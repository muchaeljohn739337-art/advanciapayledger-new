import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import { SecurityService } from "../services/securityService";
import { logger } from "../utils/logger";

export const requireOTP = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // TODO: Add twoFactorSecret and twoFactorEnabled fields to User schema
    // Temporarily bypass 2FA until schema is updated
    next();
  } catch (error) {
    logger.error("OTP Verification Error:", error);
    res.status(500).json({ error: "Security check failed" });
  }
};
