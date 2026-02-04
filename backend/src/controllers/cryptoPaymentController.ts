// @ts-nocheck
/**
 * Crypto Payment Controller
 * Handles cryptocurrency payment processing for Advancia PayLedger
 */

import { Request, Response } from "express";
import { web3Service, SUPPORTED_TOKENS } from "../services/web3Service";
import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

/**
 * Create a new crypto payment request
 */
export const createPaymentRequest = async (req: Request, res: Response) => {
  try {
    const {
      amount,
      currency,
      recipientAddress,
      description,
      network = "Ethereum Mainnet",
    } = req.body;

    // Validate inputs
    if (!amount || !currency || !recipientAddress) {
      return res.status(400).json({
        error: "Missing required fields: amount, currency, recipientAddress",
      });
    }

    // Validate recipient address
    if (!web3Service.isValidAddress(recipientAddress)) {
      return res.status(400).json({
        error: "Invalid Ethereum address",
      });
    }

    // Validate currency and network
    const supportedTokens = web3Service.getSupportedTokens() as any;
    const token = supportedTokens[currency];
    if (!token) {
      return res.status(400).json({
        error: `Unsupported currency. Supported: ${Object.keys(supportedTokens).join(", ")}`,
      });
    }

    // Create payment request in database
    const paymentRequest = await prisma.cryptoPayment.create({
      data: {
        amount: amount.toString(),
        cryptocurrency: currency,
        walletAddress: recipientAddress,
        status: "PENDING",
        patientId: req.user?.id || "",
        facilityId: "",
        createdBy: req.user?.id || "",
      },
    });

    // Get current gas price for estimation
    const gasPrice = await web3Service.getGasPrice();

    res.json({
      success: true,
      paymentRequest: {
        id: paymentRequest.id,
        amount,
        currency,
        network,
        recipientAddress,
        status: "pending",
        gasEstimate: gasPrice,
      },
    });
  } catch (error: unknown) {
    logger.error("[CryptoPayment] Create payment request error", { error });
    if (error instanceof Error) {
      res.status(500).json({
        error: "Failed to create payment request",
        details: error.message,
      });
    } else {
      res.status(500).json({
        error: "Failed to create payment request",
        details: "Unknown error",
      });
    }
  }
};

/**
 * Verify a crypto payment transaction
 */
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { paymentId, txHash } = req.body;

    if (!paymentId || !txHash) {
      return res.status(400).json({
        error: "Missing required fields: paymentId, txHash",
      });
    }

    // Get payment request from database
    const payment = await prisma.cryptoPayment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return res.status(404).json({
        error: "Payment request not found",
      });
    }

    // Verify the transaction
    const isValid = await web3Service.verifyPayment(
      txHash,
      payment.amount.toString(),
      payment.cryptocurrency,
      payment.walletAddress,
    );

    if (isValid) {
      // Update payment status
      await prisma.cryptoPayment.update({
        where: { id: paymentId },
        data: {
          status: "COMPLETED",
          transactionHash: txHash,
          confirmations: 1,
        },
      });

      res.json({
        success: true,
        status: "confirmed",
        txHash,
      });
    } else {
      res.json({
        success: false,
        status: "invalid",
        message: "Transaction verification failed",
      });
    }
  } catch (error: unknown) {
    logger.error("[CryptoPayment] Verify payment error", { error });
    if (error instanceof Error) {
      res.status(500).json({
        error: "Failed to verify payment",
        details: error.message,
      });
    } else {
      res.status(500).json({
        error: "Failed to verify payment",
        details: "Unknown error",
      });
    }
  }
};

/**
 * Get transaction status
 */
export const getTransactionStatus = async (req: Request, res: Response) => {
  try {
    const { txHash } = req.params;

    if (!txHash) {
      return res.status(400).json({
        error: "Transaction hash required",
      });
    }

    const status = await web3Service.monitorTransaction(txHash);

    res.json({
      success: true,
      transaction: {
        hash: txHash,
        ...status,
      },
    });
  } catch (error: unknown) {
    logger.error("[CryptoPayment] Get transaction status error", { error });
    if (error instanceof Error) {
      res.status(500).json({
        error: "Failed to get transaction status",
        details: error.message,
      });
    } else {
      res.status(500).json({
        error: "Failed to get transaction status",
        details: "Unknown error",
      });
    }
  }
};

/**
 * Get wallet balance
 */
export const getWalletBalance = async (req: Request, res: Response) => {
  try {
    const { address, token } = req.query;

    if (!address) {
      return res.status(400).json({
        error: "Wallet address required",
      });
    }

    if (!web3Service.isValidAddress(address as string)) {
      return res.status(400).json({
        error: "Invalid Ethereum address",
      });
    }

    let balance: string;

    if (!token || token === "ETH") {
      balance = await web3Service.getEthBalance(address as string);
    } else {
      balance = await web3Service.getTokenBalance(
        address as string,
        token as string,
      );
    }

    res.json({
      success: true,
      address,
      token: token || "ETH",
      balance,
    });
  } catch (error: unknown) {
    logger.error("[CryptoPayment] Get wallet balance error", { error });
    if (error instanceof Error) {
      res.status(500).json({
        error: "Failed to get wallet balance",
        details: error.message,
      });
    } else {
      res.status(500).json({
        error: "Failed to get wallet balance",
        details: "Unknown error",
      });
    }
  }
};

/**
 * Authenticate wallet via signature
 */
export const authenticateWallet = async (req: Request, res: Response) => {
  try {
    const { address, message, signature } = req.body;

    if (!address || !message || !signature) {
      return res.status(400).json({
        error: "Missing required fields: address, message, signature",
      });
    }

    const isValid = await web3Service.verifyWalletSignature(
      address,
      message,
      signature,
    );

    if (isValid) {
      // Create or update user session
      // You can integrate with your existing auth system here

      res.json({
        success: true,
        authenticated: true,
        address,
      });
    } else {
      res.status(401).json({
        success: false,
        authenticated: false,
        error: "Invalid signature",
      });
    }
  } catch (error: unknown) {
    logger.error("[CryptoPayment] Authenticate wallet error", { error });
    if (error instanceof Error) {
      res.status(500).json({
        error: "Failed to authenticate wallet",
        details: error.message,
      });
    } else {
      res.status(500).json({
        error: "Failed to authenticate wallet",
        details: "Unknown error",
      });
    }
  }
};

/**
 * Get supported tokens
 */
export const getSupportedTokens = async (req: Request, res: Response) => {
  try {
    const tokens = web3Service.getSupportedTokens();

    res.json({
      success: true,
      tokens: Object.entries(tokens).map(([tokenSymbol, tokenData]) => ({
        symbol: tokenSymbol,
        name: tokenData.name,
        decimals: tokenData.decimals,
        address: tokenData.address,
      })),
    });
  } catch (error: unknown) {
    logger.error("[CryptoPayment] Get supported tokens error", { error });
    if (error instanceof Error) {
      res.status(500).json({
        error: "Failed to get supported tokens",
        details: error.message,
      });
    } else {
      res.status(500).json({
        error: "Failed to get supported tokens",
        details: "Unknown error",
      });
    }
  }
};

/**
 * Get current gas prices
 */
export const getGasPrices = async (req: Request, res: Response) => {
  try {
    const gasPrice = await web3Service.getGasPrice();

    res.json({
      success: true,
      gasPrice,
    });
  } catch (error: unknown) {
    logger.error("[CryptoPayment] Get gas prices error", { error });
    if (error instanceof Error) {
      res.status(500).json({
        error: "Failed to get gas prices",
        details: error.message,
      });
    } else {
      res.status(500).json({
        error: "Failed to get gas prices",
        details: "Unknown error",
      });
    }
  }
};

/**
 * Get Web3 connection status
 */
export const getConnectionStatus = async (req: Request, res: Response) => {
  try {
    const logs = web3Service.getConnectionLogs();
    const recentLogs = logs.slice(-10); // Last 10 connection attempts

    res.json({
      success: true,
      status: "connected",
      recentConnections: recentLogs,
    });
  } catch (error: unknown) {
    logger.error("[CryptoPayment] Get connection status error", { error });
    if (error instanceof Error) {
      res.status(500).json({
        error: "Failed to get connection status",
        details: error.message,
      });
    } else {
      res.status(500).json({
        error: "Failed to get connection status",
        details: "Unknown error",
      });
    }
  }
};

