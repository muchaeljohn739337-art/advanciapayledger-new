import { Router } from "express";
import { authenticate, AuthRequest, requireRole } from "../../middleware/auth";
import { realTimeMonitoring } from "../../services/realTimeMonitoringService";
import { logger } from "../../utils/logger";

const router = Router();

// Get user's transaction alerts
router.get("/user/alerts", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const includeRead = req.query.includeRead === "true";
    const alerts = await realTimeMonitoring.getUserAlerts(userId, includeRead);

    res.json({
      success: true,
      alerts,
      unreadCount: alerts.filter((alert) => !alert.isRead).length,
    });
  } catch (error) {
    logger.error("Get user alerts error", { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Acknowledge alert
router.post(
  "/alerts/:alertId/acknowledge",
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;
      const { alertId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      await realTimeMonitoring.markAlertAsRead(alertId, userId);

      res.json({
        success: true,
        message: "Alert acknowledged successfully",
      });
    } catch (error) {
      logger.error("Acknowledge alert error", { error });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// Get monitoring rules (admin only)
router.get(
  "/admin/rules",
  authenticate,
  requireRole(["ADMIN"]),
  async (req: AuthRequest, res) => {
    try {
      const rules = realTimeMonitoring.getMonitoringRules();

      res.json({
        success: true,
        rules,
      });
    } catch (error) {
      logger.error("Get monitoring rules error", { error });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// Add monitoring rule (admin only)
router.post(
  "/admin/rules",
  authenticate,
  requireRole(["ADMIN"]),
  async (req: AuthRequest, res) => {
    try {
      const ruleData = req.body;
      const newRule = await realTimeMonitoring.addMonitoringRule(ruleData);

      res.json({
        success: true,
        rule: newRule,
        message: "Monitoring rule added successfully",
      });
    } catch (error) {
      logger.error("Add monitoring rule error", { error });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// Update monitoring rule (admin only)
router.put(
  "/admin/rules/:ruleId",
  authenticate,
  requireRole(["ADMIN"]),
  async (req: AuthRequest, res) => {
    try {
      const { ruleId } = req.params;
      const updates = req.body;

      const updatedRule = await realTimeMonitoring.updateMonitoringRule(
        ruleId,
        updates,
      );

      if (!updatedRule) {
        return res.status(404).json({
          success: false,
          error: "Monitoring rule not found",
        });
      }

      res.json({
        success: true,
        rule: updatedRule,
        message: "Monitoring rule updated successfully",
      });
    } catch (error) {
      logger.error("Update monitoring rule error", { error });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// Delete monitoring rule (admin only)
router.delete(
  "/admin/rules/:ruleId",
  authenticate,
  requireRole(["ADMIN"]),
  async (req: AuthRequest, res) => {
    try {
      const { ruleId } = req.params;

      const deleted = await realTimeMonitoring.deleteMonitoringRule(ruleId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: "Monitoring rule not found",
        });
      }

      res.json({
        success: true,
        message: "Monitoring rule deleted successfully",
      });
    } catch (error) {
      logger.error("Delete monitoring rule error", { error });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// Get system alerts (admin only)
router.get(
  "/admin/alerts",
  authenticate,
  requireRole(["ADMIN"]),
  async (req: AuthRequest, res) => {
    try {
      const severity = req.query.severity as any;
      const alerts = await realTimeMonitoring.getSystemAlerts(severity);

      res.json({
        success: true,
        alerts,
        total: alerts.length,
      });
    } catch (error) {
      logger.error("Get system alerts error", { error });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// Get monitoring statistics (admin only)
router.get(
  "/admin/stats",
  authenticate,
  requireRole(["ADMIN"]),
  async (req: AuthRequest, res) => {
    try {
      const stats = await realTimeMonitoring.getMonitoringStats();

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      logger.error("Get monitoring stats error", { error });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// Test alert generation (admin only)
router.post(
  "/admin/test-alert",
  authenticate,
  requireRole(["ADMIN"]),
  async (req: AuthRequest, res) => {
    try {
      const { userId, alertType, severity } = req.body;

      if (!userId || !alertType || !severity) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: userId, alertType, severity",
        });
      }

      const testAlert = await realTimeMonitoring.createAlert(
        {
          id: "test_rule",
          name: "Test Alert Rule",
          description: "Rule for testing alerts",
          enabled: true,
          conditions: {} as any,
          actions: {
            sendAlert: true,
            blockTransaction: false,
            requireVerification: false,
            notifyAdmin: false,
          },
          alertType: alertType as any,
          severity: severity as any,
        },
        {
          userId,
          amount: 1000,
          currency: "USD",
          paymentMethod: "TEST",
          transactionId: "test_tx_" + Date.now(),
          status: "TEST",
        },
      );

      await realTimeMonitoring.sendAlerts([testAlert]);

      res.json({
        success: true,
        alert: testAlert,
        message: "Test alert sent successfully",
      });
    } catch (error) {
      logger.error("Test alert error", { error });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

export default router;
