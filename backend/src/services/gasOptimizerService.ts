import { ethers } from "ethers";
import { logger } from "../utils/logger";

export interface GasRecommendation {
  low: string;
  medium: string;
  high: string;
  instant: string;
  baseFee: string;
  timestamp: Date;
}

export class GasOptimizerService {
  private static instance: GasOptimizerService;
  private lastRecommendations: Map<string, GasRecommendation> = new Map();

  private constructor() {}

  static getInstance(): GasOptimizerService {
    if (!GasOptimizerService.instance) {
      GasOptimizerService.instance = new GasOptimizerService();
    }
    return GasOptimizerService.instance;
  }

  /**
   * Get gas recommendations for a specific network
   */
  async getGasRecommendations(
    provider: ethers.JsonRpcProvider,
    networkName: string,
  ): Promise<GasRecommendation> {
    try {
      const feeData = await provider.getFeeData();

      const baseFee = feeData.gasPrice || BigInt(0);
      const maxPriorityFee = feeData.maxPriorityFeePerGas || BigInt(0);

      const recommendation: GasRecommendation = {
        low: (baseFee + (maxPriorityFee * BigInt(50)) / BigInt(100)).toString(),
        medium: (baseFee + maxPriorityFee).toString(),
        high: (
          baseFee +
          (maxPriorityFee * BigInt(150)) / BigInt(100)
        ).toString(),
        instant: (
          baseFee +
          (maxPriorityFee * BigInt(200)) / BigInt(100)
        ).toString(),
        baseFee: baseFee.toString(),
        timestamp: new Date(),
      };

      this.lastRecommendations.set(networkName, recommendation);
      return recommendation;
    } catch (error) {
      logger.error(
        `Error fetching gas recommendations for ${networkName}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Determine if it's a good time to send a non-urgent transaction
   */
  isGasLow(networkName: string, thresholdGwei: number): boolean {
    const lastRec = this.lastRecommendations.get(networkName);
    if (!lastRec) return false;

    const currentGasGwei = parseFloat(
      ethers.formatUnits(lastRec.medium, "gwei"),
    );
    return currentGasGwei <= thresholdGwei;
  }

  /**
   * Wait for gas to be below a certain threshold (with timeout)
   */
  async waitForLowGas(
    provider: ethers.JsonRpcProvider,
    networkName: string,
    thresholdGwei: number,
    maxWaitMinutes: number = 60,
  ): Promise<boolean> {
    const startTime = Date.now();
    const maxWaitMs = maxWaitMinutes * 60 * 1000;

    while (Date.now() - startTime < maxWaitMs) {
      const rec = await this.getGasRecommendations(provider, networkName);
      const currentGasGwei = parseFloat(ethers.formatUnits(rec.medium, "gwei"));

      if (currentGasGwei <= thresholdGwei) {
        logger.info(
          `Gas is low (${currentGasGwei} Gwei) on ${networkName}. Proceeding.`,
        );
        return true;
      }

      logger.info(
        `Gas is high (${currentGasGwei} Gwei) on ${networkName}. Waiting 1 minute...`,
      );
      await new Promise((resolve) => setTimeout(resolve, 60000)); // Wait 1 minute
    }

    logger.warn(
      `Wait for low gas timed out after ${maxWaitMinutes} minutes on ${networkName}.`,
    );
    return false;
  }
}

export const gasOptimizerService = GasOptimizerService.getInstance();
