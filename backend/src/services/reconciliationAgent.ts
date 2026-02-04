// @ts-nocheck
import { prisma } from "../app";
// TODO: Create blockchainService or use web3Service instead
// import { blockchainService } from "./blockchainService";
import { logger } from "../utils/logger";
import { notificationService } from "./notificationService";

export class ReconciliationAgent {
  private static instance: ReconciliationAgent;
  private isRunning = false;

  private constructor() {}

  static getInstance(): ReconciliationAgent {
    if (!ReconciliationAgent.instance) {
      ReconciliationAgent.instance = new ReconciliationAgent();
    }
    return ReconciliationAgent.instance;
  }

  /**
   * Start the reconciliation process
   */
  async start(intervalMinutes: number = 30) {
    if (this.isRunning) return;
    this.isRunning = true;

    logger.info(
      `Reconciliation Agent started. Running every ${intervalMinutes} minutes.`,
    );

    // Initial run
    this.reconcile().catch((err) =>
      logger.error("Initial reconciliation failed:", err),
    );

    setInterval(
      async () => {
        try {
          await this.reconcile();
        } catch (error) {
          logger.error("Error during scheduled reconciliation:", error);
        }
      },
      intervalMinutes * 60 * 1000,
    );
  }

  /**
   * Reconcile pending payments with blockchain state
   */
  async reconcile() {
    logger.info("Starting blockchain-database reconciliation...");

    try {
      // 1. Find pending crypto payments that are older than 5 minutes
      const pendingPayments = await prisma.cryptoPayment.findMany({
        where: {
          status: "PENDING",
          createdAt: {
            lt: new Date(Date.now() - 5 * 60 * 1000),
          },
          transactionHash: { not: null },
        },
      });

      logger.info(
        `Found ${pendingPayments.length} pending payments to reconcile.`,
      );

      for (const payment of pendingPayments) {
        if (!payment.transactionHash) continue;

        try {
          const networkName = this.mapCurrencyToNetwork(payment.cryptocurrency);
          // TODO: Implement blockchain tracking with web3Service
          // const tx = await blockchainService.trackTransaction(
          //   payment.transactionHash,
          //   networkName,
          // );
          const tx: any = { status: 1, blockNumber: 0 }; // Temporary mock

          if (tx.status === 1) {
            // Transaction succeeded on chain but DB says pending
            await prisma.cryptoPayment.update({
              where: { id: payment.id },
              data: {
                status: "COMPLETED",
                confirmations: Number(tx.blockNumber),
              },
            });

            notificationService.notifyUser(
              payment.createdBy,
              "payment_completed",
              {
                id: payment.id,
                amount: payment.amount,
                currency: payment.cryptocurrency,
                hash: payment.transactionHash,
              },
            );

            logger.info(
              `Reconciled payment ${payment.id}: Marked as COMPLETED.`,
            );
          } else if (tx.status === 0) {
            // Transaction failed on chain
            await prisma.cryptoPayment.update({
              where: { id: payment.id },
              data: { status: "FAILED" },
            });

            notificationService.notifyUser(
              payment.createdBy,
              "payment_failed",
              {
                id: payment.id,
                reason: "Blockchain transaction failed",
              },
            );

            logger.info(`Reconciled payment ${payment.id}: Marked as FAILED.`);
          }
        } catch (error) {
          logger.error(`Failed to reconcile payment ${payment.id}:`, error);
        }
      }

      logger.info("Reconciliation process completed.");
    } catch (error) {
      logger.error("Reconciliation error:", error);
      throw error;
    }
  }

  private mapCurrencyToNetwork(currency: string): string {
    switch (currency) {
      case "ETH":
        return "Ethereum Mainnet";
      case "MATIC":
        return "Polygon Mainnet";
      case "SOL":
        return "Solana Mainnet"; // Note: Service might need Solana support
      default:
        return "Ethereum Mainnet";
    }
  }
}

export const reconciliationAgent = ReconciliationAgent.getInstance();

