import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { SecurityService } from "../services/securityService";
import { logger } from "../utils/logger";

export class SecurityController {
  /**
   * Setup 2FA for a user
   */
  async setup2FA(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const secret = SecurityService.generateSecret(user.email);
      const otpauthURI = SecurityService.getQRCodeURI(user.email, secret);
      const qrCodeImage = await SecurityService.generateQRCodeImage(otpauthURI);

      // Temporarily store secret in user (needs migration to be final)
      // TODO: Add twoFactorSecret and twoFactorEnabled fields to User schema
      // await prisma.user.update({
      //   where: { id: req.user!.id },
      //   data: {
      //     twoFactorSecret: secret,
      //   },
      // });

      res.json({
        secret,
        qrCode: qrCodeImage,
      });
    } catch (error) {
      logger.error("2FA setup error:", error);
      res.status(500).json({ error: "Failed to setup 2FA" });
    }
  }

  /**
   * Verify and enable 2FA
   */
  async verifyAndEnable2FA(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ error: "Token is required" });
      }

      // TODO: Add twoFactorSecret and twoFactorEnabled fields to User schema
      // const user = await prisma.user.findUnique({
      //   where: { id: req.user.id },
      // });

      // if (!user || !user.twoFactorSecret) {
      //   return res.status(400).json({ error: '2FA not initialized' });
      // }

      // const isValid = SecurityService.verifyToken(token, user.twoFactorSecret);
      // if (!isValid) {
      //   return res.status(400).json({ error: 'Invalid verification code' });
      // }

      // await prisma.user.update({
      //   where: { id: user.id },
      //   data: {
      //     twoFactorEnabled: true,
      //   },
      // });

      res.json({ success: true, message: "2FA enabled successfully" });
    } catch (error) {
      logger.error("2FA verification error:", error);
      res.status(500).json({ error: "Failed to verify 2FA" });
    }
  }

  /**
   * Disable 2FA
   */
  async disable2FA(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { token } = req.body;
      if (!token) {
        return res
          .status(400)
          .json({ error: "Token is required to disable 2FA" });
      }

      // TODO: Add twoFactorSecret and twoFactorEnabled fields to User schema
      // const user = await prisma.user.findUnique({
      //   where: { id: req.user!.id },
      // });

      // if (!user || !user.twoFactorSecret || !user.twoFactorEnabled) {
      //   return res.status(400).json({ error: '2FA not enabled' });
      // }

      // const isValid = SecurityService.verifyToken(token, user.twoFactorSecret);

      // if (!isValid) {
      //   return res.status(401).json({ error: 'Invalid 2FA token' });
      // }

      // Disable 2FA
      // await prisma.user.update({
      //   where: { id: req.user!.id },
      //   data: {
      //     twoFactorEnabled: false,
      //     twoFactorSecret: null,
      //   },
      // }
      // });

      res.json({ success: true, message: "2FA disabled successfully" });
    } catch (error) {
      logger.error("2FA disable error:", error);
      res.status(500).json({ error: "Failed to disable 2FA" });
    }
  }
}

export const securityController = new SecurityController();
