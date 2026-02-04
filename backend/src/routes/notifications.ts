import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";
import { logger } from "../utils/logger";

const router = Router();

// List user's notifications
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { unreadOnly } = req.query;

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly === "true" && { read: false }),
      },
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to recent 50 notifications
    });

    res.json(notifications);
  } catch (error) {
    logger.error("List notifications error:", error);
    res.status(500).json({ error: "Failed to list notifications" });
  }
});

// Get notification count
router.get("/count", authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });

    res.json({ unreadCount });
  } catch (error) {
    logger.error("Get notification count error:", error);
    res.status(500).json({ error: "Failed to get notification count" });
  }
});

// Mark notification as read
router.put("/:id/read", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Verify user owns this notification
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    res.json(updated);
  } catch (error) {
    logger.error("Mark notification as read error:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// Mark all notifications as read
router.put("/read-all", authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;

    await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: { read: true },
    });

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    logger.error("Mark all notifications as read error:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
});

// Delete notification
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Verify user owns this notification
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    await prisma.notification.delete({
      where: { id },
    });

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    logger.error("Delete notification error:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

// Delete all read notifications
router.delete("/read/all", authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;

    await prisma.notification.deleteMany({
      where: {
        userId,
        read: true,
      },
    });

    res.json({ message: "All read notifications deleted successfully" });
  } catch (error) {
    logger.error("Delete all read notifications error:", error);
    res.status(500).json({ error: "Failed to delete read notifications" });
  }
});

export default router;
