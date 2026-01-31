import express from "express";
import { authenticateToken } from "../middleware/auth";
import { financialInsightAgent } from "../agents/FinancialInsightAgent";
import { logger } from "../utils/logger";

const router = express.Router();

// Get financial insights for user
router.get("/financial/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Ensure user can only access their own insights
    if (req.user?.id !== userId && req.user?.role !== "ADMIN") {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const insights = await financialInsightAgent.analyzeTransactions(userId);

    res.json({
      success: true,
      insights,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error getting financial insights:", error);
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

// Get cash flow prediction
router.get("/cashflow/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user?.id !== userId && req.user?.role !== "ADMIN") {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const prediction = await financialInsightAgent.predictCashFlow(userId);

    res.json({
      success: true,
      prediction,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error getting cash flow prediction:", error);
    res.status(500).json({ error: "Failed to generate prediction" });
  }
});

export { router as insightsRoutes };
