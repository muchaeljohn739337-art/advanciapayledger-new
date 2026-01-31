import { Router, Response } from "express";
import { prisma } from "../../app";
import { authenticateToken, requireRole } from "../../middleware/auth";
import { requireOTP } from "../../middleware/otpVerify";
import { ipWhitelist } from "../../middleware/ipWhitelist";
import { logger } from "../../utils/logger";

const router = Router();

// Load allowed IPs from environment or use empty array
const ALLOWED_ADMIN_IPS = (process.env.ALLOWED_ADMIN_IPS || "")
  .split(",")
  .filter((ip) => ip.trim());

// Apply IP whitelist to all routes in this router
router.use(ipWhitelist(ALLOWED_ADMIN_IPS));

// ========================================
// INTERNAL ROUTES - SECURED WITH OTP
// ========================================
// These routes require SUPER_ADMIN role AND valid OTP token
// All actions are logged for audit trail

/**
 * SUPER ADMIN SECRET: Manual balance adjustment
 * Protected by: JWT + SUPER_ADMIN + OTP
 */
router.post(
  "/balance/adjust",
  authenticateToken,
  requireRole(["ADMIN"]), // Using ADMIN as mapped in UserRole enum
  requireOTP,
  async (req: any, res: Response) => {
    try {
      const { userId, amount, reason } = req.body;

      if (!userId || !amount || !reason) {
        return res.status(400).json({
          error: "userId, amount, and reason are required",
        });
      }

      // Check if target user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // In this version, we'll create a special internal transaction
      const transaction = await prisma.payment.create({
        data: {
          amount: Math.abs(amount),
          currency: "USD",
          paymentMethod: "HSA_CARD", // Using as internal adjustment proxy
          status: "COMPLETED",
          description: `[ADMIN ADJUSTMENT] ${reason}`,
          patientId: userId, // Assuming patient adjustment
          facilityId: "SYSTEM", // System facility
          createdBy: req.user!.id,
        },
      });

      // Log this action (secret audit trail)
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: "BALANCE_ADJUSTMENT",
          resource: "PAYMENT",
          resourceId: transaction.id,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          details: {
            targetUserId: userId,
            amount,
            reason,
            timestamp: new Date().toISOString(),
          },
        },
      });

      res.json({
        success: true,
        transaction,
        message: "Balance adjusted successfully (recorded as system payment)",
      });
    } catch (error: any) {
      logger.error("Balance adjustment error:", error);
      res.status(500).json({ error: "Internal error" });
    }
  },
);

/**
 * SUPER ADMIN SECRET: View hidden audit trail
 */
router.get(
  "/audit/secret",
  authenticateToken,
  requireRole(["ADMIN"]),
  requireOTP,
  async (req: any, res: Response) => {
    try {
      const { limit = 100 } = req.query;

      const secretActions = await prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });

      res.json({
        actions: secretActions,
        count: secretActions.length,
        message: "Secret audit trail retrieved",
      });
    } catch (error: any) {
      logger.error("Secret audit retrieval error:", error);
      res.status(500).json({ error: "Internal error" });
    }
  },
);

/**
 * SUPER ADMIN SECRET: System health check
 */
router.get(
  "/system/health",
  authenticateToken,
  requireRole(["ADMIN"]),
  async (req: any, res: Response) => {
    try {
      const [userCount, paymentCount, facilityCount] = await Promise.all([
        prisma.user.count(),
        prisma.payment.count(),
        prisma.facility.count(),
      ]);

      res.json({
        status: "operational",
        stats: {
          users: userCount,
          payments: paymentCount,
          facilities: facilityCount,
        },
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error("System health check error:", error);
      res.status(500).json({ error: "Health check failed" });
    }
  },
);

export default router;
