import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma";
import { logger } from "../utils/logger";
import { UserRole } from "@prisma/client";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    isActive: boolean;
  };
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    // Use Supabase JWT secret for validation
    const supabaseJwtSecret =
      process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;
    if (!supabaseJwtSecret) {
      throw new Error(
        "SUPABASE_JWT_SECRET or JWT_SECRET environment variable is not set",
      );
    }

    const decoded = jwt.verify(token, supabaseJwtSecret) as any;

    // Supabase JWT payload contains: { sub: userId, email, ... }
    const supabaseUserId = decoded.sub;
    const email = decoded.email;

    if (!supabaseUserId) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    // Find user by supabaseId (preferred) or fallback to old userId for backwards compatibility
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { supabaseId: supabaseUserId },
          { id: decoded.userId }, // Fallback for old custom JWT tokens
        ],
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        supabaseId: true,
      },
    });

    // If user doesn't exist, create profile automatically
    if (!user && supabaseUserId && email) {
      logger.info(`Creating user profile for Supabase user: ${email}`);
      user = await prisma.user.create({
        data: {
          supabaseId: supabaseUserId,
          email: email,
          role: "PATIENT", // Default role
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          supabaseId: true,
        },
      });
    }

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid or inactive user" });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error("Authentication error:", error);
    return res.status(401).json({ error: "Invalid token" });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
};

// Alias for consistency
export const authenticate = authenticateToken;

// Additional alias for compatibility with other modules
export const authMiddleware = authenticateToken;
