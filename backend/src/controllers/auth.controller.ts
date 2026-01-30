import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma";
import { hashPassword, comparePassword } from "../utils/encryption";
import { redis } from "../utils/redis";
import { logger } from "../utils/logger";
import { AuthRequest } from "../middleware/auth";

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName, role = "PATIENT" } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          firstName,
          lastName,
          role,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      });

      // Generate tokens
      const tokens = this.generateTokens(user.id);

      // Store refresh token in Redis
      await redis.setEx(`refresh_token:${user.id}`, 7 * 24 * 60 * 60, tokens.refreshToken);

      logger.info(`User registered: ${email}`);

      res.status(201).json({
        user,
        ...tokens,
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
        },
      });

      if (!user || !user.isActive) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await comparePassword(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate tokens
      const tokens = this.generateTokens(user.id);

      // Store refresh token in Redis
      await redis.setEx(`refresh_token:${user.id}`, 7 * 24 * 60 * 60, tokens.refreshToken);

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
        const decoded = jwt.decode(token) as any;
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

      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;
      const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

      if (storedToken !== refreshToken) {
        return res.status(401).json({ error: "Invalid refresh token" });
      }

      const tokens = this.generateTokens(decoded.userId);

      // Update refresh token in Redis
      await redis.setEx(`refresh_token:${decoded.userId}`, 7 * 24 * 60 * 60, tokens.refreshToken);

      res.json(tokens);
    } catch (error) {
      logger.error("Token refresh error:", error);
      res.status(401).json({ error: "Invalid refresh token" });
    }
  }

  async getProfile(req: AuthRequest, res: Response) {
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

  private generateTokens(userId: string) {
    const jwtSecret = process.env.JWT_SECRET!;
    const accessToken = jwt.sign({ userId }, jwtSecret, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ userId }, jwtSecret, { expiresIn: "7d" });

    return { accessToken, refreshToken };
  }
}

export const authController = new AuthController();
