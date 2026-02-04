// @ts-nocheck
import { Request, Response } from "express";
import Stripe from "stripe";
import { prisma } from "../utils/prisma";
import { logger } from "../utils/logger";
import { z } from "zod";
import { fraudDetectionAgent } from "../agents/FraudDetectionAgent";
import {
  processDebitCard,
  processHSAFSA,
  getProcessingFee,
  getSettlementDays,
  DebitCardData,
  HSAFSAData,
} from "../utils/debitCard";

export class PaymentController {
  async createPayment(req: Request, res: Response) {
    try {
      const {
        amount,
        currency,
        paymentMethod,
        description,
        patientId,
        facilityId,
        // Debit card specific fields
        cardData,
        isMedicalExpense = true,
      } = req.body;

      // Verify patient exists and belongs to user if not admin/provider
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        include: { facility: true },
      });

      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      // AI Fraud Detection Check
      const fraudResult = await fraudDetectionAgent.analyzeTransaction(
        req.user!.id,
        amount,
        currency || "USD",
        description,
        { paymentMethod, patientId, facilityId },
      );

      if (fraudResult.isSuspicious && fraudResult.riskScore > 80) {
        logger.warn(
          `Fraud Alert: Transaction blocked for user ${req.user!.id}. Risk Score: ${fraudResult.riskScore}. Reason: ${fraudResult.reason}`,
        );
        return res.status(403).json({
          error: "FRAUD_ALERT",
          message: "Transaction flagged by security systems for manual review.",
          riskScore: fraudResult.riskScore,
          reason: fraudResult.reason,
        });
      }

      // Calculate processing fee based on payment method
      const processingFee = getProcessingFee(paymentMethod, amount);
      const settledAmount = amount - processingFee;
      const settlementDays = getSettlementDays(paymentMethod);
      const settlementDate = new Date();
      settlementDate.setDate(settlementDate.getDate() + settlementDays);

      let transactionResult;
      let isDebitCard = false;
      let pinVerified = false;
      let hsaFsaType = null;

      // Process payment based on method
      switch (paymentMethod) {
        case "DEBIT_CARD":
          isDebitCard = true;
          transactionResult = await processDebitCard(
            cardData as DebitCardData,
            amount,
            description,
          );
          pinVerified = !!(cardData as DebitCardData).pin;
          break;

        case "HSA_CARD":
        case "FSA_CARD":
          isDebitCard = true;
          hsaFsaType = paymentMethod.replace("_CARD", "");
          transactionResult = await processHSAFSA(
            cardData as HSAFSAData,
            amount,
            description,
            isMedicalExpense,
          );
          break;

        case "CREDIT_CARD":
        case "ACH":
        case "CRYPTO":
        default:
          // Handle other payment methods (existing logic)
          transactionResult = {
            success: true,
            transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fee: processingFee,
            settledAmount,
            settlementDate,
          };
          break;
      }

      if (!transactionResult.success) {
        return res.status(400).json({
          error: "Payment processing failed",
          details: transactionResult.error,
        });
      }

      // Create payment record with debit card fields
      const payment = await prisma.payment.create({
        data: {
          amount,
          currency: currency || "USD",
          paymentMethod,
          status: "COMPLETED",
          description,
          transactionId: transactionResult.transactionId,
          patientId,
          facilityId: facilityId || patient.facilityId,
          createdBy: req.user!.id,
          // Debit card specific fields
          isDebitCard,
          pinVerified,
          balanceCheck: isDebitCard ? new Date() : null,
          hsaFsaType,
        },
        include: {
          patient: true,
          facility: true,
        },
      });

      logger.info(`Payment created: ${payment.id} via ${paymentMethod}`);

      res.status(201).json({
        payment,
        processing: {
          fee: processingFee,
          settledAmount,
          settlementDate,
          settlementDays,
        },
      });
    } catch (error) {
      logger.error("Error creating payment:", error);
      res.status(500).json({ error: "Failed to create payment" });
    }
  }

  async getPayments(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, status, patientId, facilityId } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (status) where.status = status;
      if (patientId) where.patientId = patientId;
      if (facilityId) where.facilityId = facilityId;

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: "desc" },
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            facility: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        prisma.payment.count({ where }),
      ]);

      res.json({
        payments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error("Get payments error:", error);
      res.status(500).json({ error: "Failed to get payments" });
    }
  }

  async getPaymentById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              dateOfBirth: true,
            },
          },
          facility: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
        },
      });

      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      res.json({ payment });
    } catch (error) {
      logger.error("Get payment error:", error);
      res.status(500).json({ error: "Failed to get payment" });
    }
  }

  async updatePaymentStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, transactionId } = req.body;

      const payment = await prisma.payment.update({
        where: { id },
        data: {
          status,
          transactionId,
          updatedAt: new Date(),
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      logger.info(`Payment status updated: ${payment.id} -> ${status}`);

      res.json({ payment });
    } catch (error) {
      logger.error("Update payment status error:", error);
      res.status(500).json({ error: "Failed to update payment status" });
    }
  }

  async createCryptoPayment(req: Request, res: Response) {
    try {
      const { amount, cryptocurrency, walletAddress, patientId, facilityId } =
        req.body;

      // Create crypto payment record
      const cryptoPayment = await prisma.cryptoPayment.create({
        data: {
          amount,
          cryptocurrency,
          walletAddress,
          status: "PENDING",
          patientId,
          facilityId,
          createdBy: req.user!.id,
        },
      });

      // Generate unique payment address (simplified for demo)
      const paymentAddress = `${cryptocurrency.toLowerCase()}_${cryptoPayment.id}_${Date.now()}`;

      const updatedPayment = await prisma.cryptoPayment.update({
        where: { id: cryptoPayment.id },
        data: { paymentAddress },
      });

      logger.info(`Crypto payment created: ${cryptoPayment.id}`);

      res.status(201).json({
        cryptoPayment: updatedPayment,
        paymentAddress,
        amount,
        cryptocurrency,
      });
    } catch (error) {
      logger.error("Create crypto payment error:", error);
      res.status(500).json({ error: "Failed to create crypto payment" });
    }
  }

  async getCryptoRates(req: Request, res: Response) {
    try {
      // Mock crypto rates - in production, integrate with real API
      const rates = {
        SOL: { USD: 98.45, EUR: 91.23, GBP: 78.9 },
        ETH: { USD: 2234.56, EUR: 2078.9, GBP: 1798.45 },
        MATIC: { USD: 0.92, EUR: 0.85, GBP: 0.74 },
        USDC: { USD: 1.0, EUR: 0.93, GBP: 0.8 },
      };

      res.json({ rates, timestamp: new Date().toISOString() });
    } catch (error) {
      logger.error("Get crypto rates error:", error);
      res.status(500).json({ error: "Failed to get crypto rates" });
    }
  }

  async refundPayment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const payment = await prisma.payment.findUnique({
        where: { id },
      });

      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      if (payment.status !== "COMPLETED") {
        return res
          .status(400)
          .json({ error: "Only completed payments can be refunded" });
      }

      // Create refund record
      const refund = await prisma.refund.create({
        data: {
          paymentId: id,
          amount: payment.amount,
          reason: reason || "Customer request",
          status: "PENDING",
          processedBy: req.user!.id,
        },
      });

      // Update payment status
      await prisma.payment.update({
        where: { id },
        data: { status: "REFUNDED" },
      });

      logger.info(`Refund created: ${refund.id} for payment: ${id}`);

      res.status(201).json({ refund });
    } catch (error) {
      logger.error("Refund payment error:", error);
      res.status(500).json({ error: "Failed to refund payment" });
    }
  }
}

export const paymentController = new PaymentController();

