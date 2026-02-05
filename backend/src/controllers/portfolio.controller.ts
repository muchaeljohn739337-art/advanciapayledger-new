import { Request, Response } from "express";
import { logger } from "../utils/logger";
import * as portfolioService from "../services/portfolio.service";
import { AssetType } from "@prisma/client";

export const getPortfolio = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const summary = await portfolioService.getPortfolioSummary(userId);
    res.json(summary);
  } catch (error) {
    logger.error("Error fetching portfolio:", error);
    res.status(500).json({ error: "Failed to fetch portfolio" });
  }
};

export const addHolding = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { symbol, name, assetType, quantity, price, fees, notes } = req.body;

    if (!symbol || !name || !assetType || !quantity || !price) {
      return res.status(400).json({ 
        error: "Missing required fields: symbol, name, assetType, quantity, price" 
      });
    }

    if (!Object.values(AssetType).includes(assetType)) {
      return res.status(400).json({ 
        error: `Invalid assetType. Must be one of: ${Object.values(AssetType).join(", ")}` 
      });
    }

    const summary = await portfolioService.addHolding(userId, {
      symbol,
      name,
      assetType,
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      fees: fees ? parseFloat(fees) : undefined,
      notes,
    });

    res.json(summary);
  } catch (error) {
    logger.error("Error adding holding:", error);
    res.status(500).json({ error: "Failed to add holding" });
  }
};

export const sellHolding = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { symbol, quantity, price, fees, notes } = req.body;

    if (!symbol || !quantity || !price) {
      return res.status(400).json({ 
        error: "Missing required fields: symbol, quantity, price" 
      });
    }

    const summary = await portfolioService.sellHolding(userId, {
      symbol,
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      fees: fees ? parseFloat(fees) : undefined,
      notes,
    });

    res.json(summary);
  } catch (error: any) {
    logger.error("Error selling holding:", error);
    if (error.message?.includes("Insufficient") || error.message?.includes("No holding")) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to sell holding" });
  }
};

export const deleteHolding = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { holdingId } = req.params;

    if (!holdingId) {
      return res.status(400).json({ error: "Holding ID is required" });
    }

    const summary = await portfolioService.deleteHolding(userId, holdingId);
    res.json(summary);
  } catch (error: any) {
    logger.error("Error deleting holding:", error);
    if (error.message?.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to delete holding" });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { symbol, limit, offset } = req.query;

    const transactions = await portfolioService.getTransactionHistory(userId, {
      symbol: symbol as string | undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json(transactions);
  } catch (error) {
    logger.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

export const getPerformance = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { period = "1M" } = req.query;
    const validPeriods = ["1W", "1M", "3M", "1Y", "ALL"];

    if (!validPeriods.includes(period as string)) {
      return res.status(400).json({ 
        error: `Invalid period. Must be one of: ${validPeriods.join(", ")}` 
      });
    }

    const performance = await portfolioService.getPortfolioPerformance(
      userId,
      period as "1W" | "1M" | "3M" | "1Y" | "ALL"
    );

    res.json(performance);
  } catch (error) {
    logger.error("Error fetching performance:", error);
    res.status(500).json({ error: "Failed to fetch performance" });
  }
};

export const takeSnapshot = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const snapshot = await portfolioService.takeSnapshot(userId);
    res.json(snapshot);
  } catch (error) {
    logger.error("Error taking snapshot:", error);
    res.status(500).json({ error: "Failed to take snapshot" });
  }
};
