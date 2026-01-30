import { Router } from "express";
import { z } from "zod";
import { authController } from "../controllers/auth.controller";
import { validate } from "../middleware/validate";

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
router.post("/refresh", validate(refreshTokenSchema), authController.refreshToken);
router.get("/profile", authController.getProfile);

export { router as authRoutes };
