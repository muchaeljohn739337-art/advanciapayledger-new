import { Router } from "express";
import * as marketController from "../controllers/market.controller";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// All market routes require authentication
router.use(authenticateToken);

// Market summary - overview of all markets
router.get("/summary", marketController.getMarketSummary);

// Stock quotes
router.get("/stocks", marketController.getStockQuotes);

// Crypto quotes
router.get("/crypto", marketController.getCryptoQuotes);

// Forex rates
router.get("/forex", marketController.getForexRates);

// Historical data for charts
router.get("/history", marketController.getHistoricalData);

// User watchlist
router.get("/watchlist", marketController.getWatchlist);

// Symbol search
router.get("/search", marketController.searchSymbol);

export { router as marketRoutes };
