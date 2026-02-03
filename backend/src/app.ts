import express from "express";
import cors from "cors";
import helmet from "helmet";
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
import userRoutes from "./routes/users";
import patientRoutes from "./routes/patients";
import providerRoutes from "./routes/providers";
import appointmentRoutes from "./routes/appointments";
import medicalRecordRoutes from "./routes/medical-records";
import prescriptionRoutes from "./routes/prescriptions";
import notificationRoutes from "./routes/notifications";
import { walletRoutes } from "./routes/wallets";
// import walletRoutes from "./routes/wallet.secure"; // File not found
import chamberRoutes from "./routes/chambers";
import bookingRoutes from "./routes/bookings";
import scheduleRoutes from "./routes/schedule";
import currencyRoutes from "./routes/currency.routes";
import healthRouter from "./routes/health";
import monitoringRoutes from "./routes/monitoring";
import { adminRoutes } from "./routes/admin";
import { adminUserRoutes } from "./routes/admin/users";
import { adminWalletRoutes } from "./routes/admin/wallet";
import { virtualCardRoutes } from "./routes/virtualCards";
import { rateLimiter } from "./middleware/rateLimiter";
import { setupSwagger } from "./config/swagger";
import { requestId, requestLogger } from "./middleware/requestLogger";
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
// Add a conservative Content Security Policy (adjust as needed)
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: [
        "'self'",
        process.env.FRONTEND_URL || "http://localhost:3000",
      ],
      frameAncestors: ["'none'"],
    },
  }),
);
// Request correlation ID and structured request logging
app.use(requestId);
app.use(requestLogger);
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// API Documentation
setupSwagger(app);

// Health check routes (comprehensive monitoring)
app.use(healthRouter);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/medical-records", medicalRecordRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/facilities", facilityRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/debit-cards", debitCardRoutes);
app.use("/api/ach", achRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/crypto", cryptoRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/chambers", chamberRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/currency", currencyRoutes);
app.use("/api/monitoring", monitoringRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/wallet", adminWalletRoutes);
app.use("/api/virtual-cards", virtualCardRoutes);

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
