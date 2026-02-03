import { Router } from 'express';
import { prisma } from "../utils/prisma";
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';
import { UserStatus } from "@prisma/client";

const router = Router();

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        status: true,
        emailVerified: true,
        totpEnabled: true,
        facilityId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Update current user profile
router.put('/me', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { firstName, lastName, phoneNumber } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phoneNumber && { phoneNumber }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(updated);
  } catch (error) {
    logger.error('Update user profile error:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Get user settings
router.get('/me/settings', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totpEnabled: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    logger.error('Get user settings error:', error);
    res.status(500).json({ error: 'Failed to get user settings' });
  }
});

// Update user settings
router.put('/me/settings', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { totpEnabled } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(typeof totpEnabled === "boolean" && { totpEnabled }),
      },
      select: {
        totpEnabled: true,
      },
    });

    res.json(updated);
  } catch (error) {
    logger.error('Update user settings error:', error);
    res.status(500).json({ error: 'Failed to update user settings' });
  }
});

// Delete user account
router.delete('/me', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;

    // Soft delete - mark as inactive
    await prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.INACTIVE },
    });

    // Log account deletion
    await prisma.auditLog.create({
      data: {
        userId,
        action: "ACCOUNT_DEACTIVATED",
        entityType: "User",
        entityId: userId,
        metadata: { reason: "User self-deleted account" },
      },
    });

    res.json({ message: "Account deactivated successfully" });
  } catch (error) {
    logger.error('Delete user account error:', error);
    res.status(500).json({ error: "Failed to deactivate account" });
  }
});

export default router;
