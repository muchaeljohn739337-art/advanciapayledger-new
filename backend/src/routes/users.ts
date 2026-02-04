import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";
import { logger } from "../utils/logger";

const router = Router();

// Get current user profile
router.get("/me", authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        supabaseId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    logger.error("Get user profile error:", error);
    res.status(500).json({ error: "Failed to get user profile" });
  }
});

// Update current user profile
router.put("/me", authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { firstName, lastName } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(updated);
  } catch (error) {
    logger.error("Update user profile error:", error);
    res.status(500).json({ error: "Failed to update user profile" });
  }
});

// Get user settings
router.get("/me/settings", authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorEnabled: true,
        // Add other settings fields as needed
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    logger.error("Get user settings error:", error);
    res.status(500).json({ error: "Failed to get user settings" });
  }
});

// Update user settings
router.put("/me/settings", authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { twoFactorEnabled } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(typeof twoFactorEnabled === "boolean" && { twoFactorEnabled }),
      },
      select: {
        twoFactorEnabled: true,
      },
    });

    res.json(updated);
  } catch (error) {
    logger.error("Update user settings error:", error);
    res.status(500).json({ error: "Failed to update user settings" });
  }
});

// Delete user account
router.delete("/me", authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;

    // Soft delete - mark as inactive
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    // Log account deletion
    await prisma.auditLog.create({
      data: {
        userId,
        action: "DELETE",
        resource: "user",
        resourceId: userId,
        details: "User account deleted",
      },
    });

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    logger.error("Delete user account error:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

export default router;
