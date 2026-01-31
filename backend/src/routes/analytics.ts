import { Router } from "express";
import * as analyticsController from "../controllers/analytics.controller";
import { authenticateToken, requireRole } from "../middleware/auth";

const router = Router();

// All analytics routes require authentication and admin/provider role
router.use(authenticateToken);
router.use(requireRole(["ADMIN", "PROVIDER"]));

// Routes
router.get("/dashboard", analyticsController.getDashboardStats);
router.get("/payments/summary", analyticsController.getPaymentSummary);
router.get("/payments/trends", analyticsController.getRevenueTrends);
router.get("/facilities/performance", analyticsController.getFacilityPerformance);
router.get("/patients/overview", analyticsController.getPatientOverview);
router.get("/revenue/forecast", analyticsController.getRevenueForecast);

export { router as analyticsRoutes };
