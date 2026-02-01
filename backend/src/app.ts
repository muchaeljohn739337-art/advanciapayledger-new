import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { logger } from "./utils/logger";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFoundHandler";
import { authRoutes } from "./routes/auth";
import { paymentRoutes } from "./routes/payments";
import { facilityRoutes } from "./routes/facilities";
import { analyticsRoutes } from "./routes/analytics";
import { webhookRoutes } from "./routes/webhooks";
import { debitCardRoutes } from "./routes/debitCards";
import { achRoutes } from "./routes/ach";
import { insightsRoutes } from "./routes/insights";
import cryptoRoutes from "./routes/cryptoRoutes";
import receiptRoutes from "./routes/receiptRoutes";
import auditRoutes from "./routes/auditRoutes";
import { securityRoutes } from "./routes/security";
// import walletRoutes from "./routes/wallet.secure"; // File not found
import chamberRoutes from "./routes/chambers";
import bookingRoutes from "./routes/bookings";
import scheduleRoutes from "./routes/schedule";
import currencyRoutes from "./routes/currency.routes";
import healthRouter from "./routes/health";
import monitoringRoutes from "./routes/monitoring";
import { rateLimiter } from "./middleware/rateLimiter";
import {
  preventSensitiveTableAccess,
  sanitizeQueries,
  sensitiveOperationRateLimit,
  sanitizeResponse,
  securityHeaders,
} from "./middleware/security";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Prisma Client
export const prisma = new PrismaClient({
  log: ["query", "error", "warn"],
});

// Security Middleware (applied first)
app.use(securityHeaders);
app.use(preventSensitiveTableAccess);
app.use(sanitizeQueries);
app.use(sensitiveOperationRateLimit);
app.use(sanitizeResponse);

// Standard Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Health check routes (comprehensive monitoring)
app.use(healthRouter);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/facilities", facilityRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/debit-cards", debitCardRoutes);
app.use("/api/ach", achRoutes);
app.use("/api/insights", insightsRoutes);
// app.use("/api/receipts", receiptRoutes); // TODO: Fix aws-sdk dependency
app.use("/api/audit", auditRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/crypto", cryptoRoutes);
// app.use("/api/wallet", walletRoutes); // TODO: Fix wallet.secure.ts schema issues
app.use("/api/chambers", chamberRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/currency", currencyRoutes);
app.use("/api/monitoring", monitoringRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully");
  await prisma.$disconnect();
  process.exit(0);
});

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
}

export default app;
