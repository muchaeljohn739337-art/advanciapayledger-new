// @ts-nocheck
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma";
import { hashPassword, comparePassword } from "../utils/encryption";
import { redis } from "../utils/redis";
import { logger } from "../utils/logger";
import { emailIntegrationService } from "../services/emailIntegrationService";
import { UserRole, UserStatus } from "@prisma/client";

interface JwtPayload {
  userId: string;
}

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        role = UserRole.PATIENT,
      } = req.body;

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      const passwordHash = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          role,
          status: UserStatus.PENDING_VERIFICATION,
          emailVerified: false,
        },
      });

      const verificationToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: "24h" },
      );

      await emailIntegrationService.sendVerificationEmail(
        user,
        verificationToken,
      );

      logger.info(`User registered: ${email}. Verification email sent.`);

      res.status(201).json({
        message:
          "Registration successful. Please check your email to verify your account.",
      });
    } catch (error) {
      logger.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (!user.emailVerified) {
        return res.status(403).json({ error: "Email not verified" });
      }

      if (
        user.status === UserStatus.SUSPENDED ||
        user.status === UserStatus.INACTIVE
      ) {
        return res.status(403).json({ error: "Account is not active" });
      }

      if (user.status === UserStatus.PENDING_VERIFICATION) {
        return res
          .status(403)
          .json({ error: "Account is pending verification" });
      }

      const isValidPassword = await comparePassword(
        password,
        user.passwordHash,
      );
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const tokens = this.generateTokens(user.id);

      await redis.setEx(
        `refresh_token:${user.id}`,
        7 * 24 * 60 * 60,
        tokens.refreshToken,
      );

      const { passwordHash, ...userWithoutPassword } = user;

      logger.info(`User logged in: ${email}`);

      res.json({
        user: userWithoutPassword,
        ...tokens,
      });
    } catch (error) {
      logger.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      if (token) {
        const decoded: JwtPayload = jwt.decode(token) as JwtPayload;
        if (decoded) {
          await redis.del(`refresh_token:${decoded.userId}`);
        }
      }

      res.json({ message: "Logged out successfully" });
    } catch (error) {
      logger.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token required" });
      }

      const decoded: JwtPayload = jwt.verify(
        refreshToken,
        process.env.JWT_SECRET!,
      ) as JwtPayload;

      const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

      if (storedToken !== refreshToken) {
        return res.status(401).json({ error: "Invalid refresh token" });
      }

      const tokens = this.generateTokens(decoded.userId);

      await redis.setEx(
        `refresh_token:${decoded.userId}`,
        7 * 24 * 60 * 60,
        tokens.refreshToken,
      );

      res.json(tokens);
    } catch (error) {
      logger.error("Token refresh error:", error);
      res.status(401).json({ error: "Invalid refresh token" });
    }
  }

  async getCurrentUser(req: Request, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ user });
    } catch (error) {
      logger.error("Get profile error:", error);
      res.status(500).json({ error: "Failed to get profile" });
    }
  }

  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.query as { token: string };

      if (!token) {
        return res
          .status(400)
          .json({ error: "Verification token is required" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        email: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || user.email !== decoded.email) {
        return res.status(400).json({ error: "Invalid verification token" });
      }

      if (user.emailVerified) {
        return res.status(400).json({ error: "Email already verified" });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, status: UserStatus.ACTIVE },
      });

      logger.info(`Email verified for: ${user.email}`);

      res.json({ message: "Email verified successfully. You can now log in." });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }
      logger.error("Email verification error:", error);
      res.status(500).json({ error: "Email verification failed" });
    }
  }

  private generateTokens(userId: string) {
    const jwtSecret = process.env.JWT_SECRET!;
    const accessToken = jwt.sign({ userId }, jwtSecret, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ userId }, jwtSecret, { expiresIn: "7d" });

    return { accessToken, refreshToken };
  }
}

export const authController = new AuthController();

