import { Router } from "express";
import * as portfolioController from "../controllers/portfolio.controller";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// All portfolio routes require authentication
router.use(authenticateToken);

// Get portfolio summary with holdings and current values
router.get("/", portfolioController.getPortfolio);

// Add a new holding (buy)
router.post("/holdings", portfolioController.addHolding);

// Sell a holding
router.post("/holdings/sell", portfolioController.sellHolding);

// Delete a holding
router.delete("/holdings/:holdingId", portfolioController.deleteHolding);

// Get transaction history
router.get("/transactions", portfolioController.getTransactions);

// Get portfolio performance over time
router.get("/performance", portfolioController.getPerformance);

// Take a snapshot of current portfolio value
router.post("/snapshot", portfolioController.takeSnapshot);

export { router as portfolioRoutes };
