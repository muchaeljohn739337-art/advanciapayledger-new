import express from "express";
import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { authenticateToken } from "../middleware/auth";
import { authController } from "../controllers/auth.controller";

const router = Router();

// Validation schemas
const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    role: z.enum(["PATIENT", "PROVIDER", "ADMIN"]).optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
});

// Routes
router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/logout", authController.logout);
router.post(
  "/refresh",
  validate(refreshTokenSchema),
  authController.refreshToken,
);
router.get(
  "/profile",
  authenticateToken,
  authController.getCurrentUser.bind(authController),
);

export { router as authRoutes };
