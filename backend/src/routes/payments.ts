import { Router } from "express";
import { z } from "zod";
import { paymentController } from "../controllers/payments.controller";
import { authenticateToken, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

// All payment routes require authentication
router.use(authenticateToken);

// Validation schemas
const createPaymentSchema = z.object({
  body: z.object({
    amount: z.number().positive(),
    currency: z.string().min(3).max(3),
    paymentMethod: z.enum(["CREDIT_CARD", "DEBIT_CARD", "CRYPTO", "ACH"]),
    description: z.string().min(1),
    patientId: z.string().uuid(),
    facilityId: z.string().uuid(),
  }),
});

const cryptoPaymentSchema = z.object({
  body: z.object({
    amount: z.number().positive(),
    cryptocurrency: z.enum(["SOL", "ETH", "MATIC", "USDC"]),
    walletAddress: z.string().min(1),
    patientId: z.string().uuid(),
    facilityId: z.string().uuid(),
  }),
});

// Routes
router.post("/", validate(createPaymentSchema), paymentController.createPayment);
router.get("/", paymentController.getPayments);
router.get("/:id", paymentController.getPaymentById);
router.patch("/:id/status", requireRole(["PROVIDER", "ADMIN"]), paymentController.updatePaymentStatus);
router.post("/crypto", validate(cryptoPaymentSchema), paymentController.createCryptoPayment);
router.get("/crypto/rates", paymentController.getCryptoRates);
router.post("/:id/refund", requireRole(["PROVIDER", "ADMIN"]), paymentController.refundPayment);

export { router as paymentRoutes };
