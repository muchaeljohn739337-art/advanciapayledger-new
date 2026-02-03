import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma";
import { hashPassword, comparePassword } from "../utils/encryption";
import { redis } from "../utils/redis";
import { logger } from "../utils/logger";

interface JwtPayload {
  userId: string;
}
import { emailIntegrationService } from "../services/emailIntegrationService";
import crypto from "crypto";

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        role = "PATIENT",
      } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user and wallet in a single transaction
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          firstName,
          lastName,
          role,
          isActive: false, // User is inactive until email is verified
          wallets: {
            create: {},
          },
        },
      });

      // Create verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");
      await prisma.verificationToken.create({
        data: {
          token: verificationToken,
          email: user.email,
          type: "EMAIL_VERIFICATION",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      // Send verification email
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

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          approvalStatus: true,
        },
      });

      if (!user || !user.isActive) {
        return res
          .status(401)
          .json({ error: "Invalid credentials or email not verified." });
      }

      if (user.approvalStatus === "PENDING") {
        return res
          .status(403)
          .json({
            error: "Your account is pending approval from an administrator.",
          });
      }

      if (user.approvalStatus === "REJECTED") {
        return res
          .status(403)
          .json({
            error: "Your account has been rejected. Please contact support.",
          });
      }

      // Verify password
      const isValidPassword = await comparePassword(
        password,
        user.passwordHash,
      );
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate tokens
      const tokens = this.generateTokens(user.id);

      // Store refresh token in Redis
      await redis.setEx(
        `refresh_token:${user.id}`,
        7 * 24 * 60 * 60,
        tokens.refreshToken,
      );

      const { ...userWithoutPassword } = user;

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
        const decoded: JwtPayload = jwt.decode(token);
        await redis.del(`refresh_token:${decoded.userId}`);
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
      );
      const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

      if (storedToken !== refreshToken) {
        return res.status(401).json({ error: "Invalid refresh token" });
      }

      const tokens = this.generateTokens(decoded.userId);

      // Update refresh token in Redis
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

      const verificationToken = await prisma.verificationToken.findUnique({
        where: { token },
      });

      if (!verificationToken || verificationToken.expiresAt < new Date()) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }

      // Activate user
      await prisma.user.update({
        where: { email: verificationToken.email },
        data: { isActive: true },
      });

      // Delete the token so it can't be used again
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      });

      logger.info(`Email verified for: ${verificationToken.email}`);

      res.json({ message: "Email verified successfully. You can now log in." });
    } catch (error) {
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
