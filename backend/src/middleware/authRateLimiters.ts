import rateLimit from "express-rate-limit";
import { logger } from "../utils/logger";

// Strict rate limiter for login attempts
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true,
  message: {
    error: "Too many login attempts",
    message: "Please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("Login rate limit exceeded", {
      ip: req.ip,
      email: req.body?.email,
      userAgent: req.get("User-Agent"),
    });
    res.status(429).json({
      error: "Too many login attempts",
      message: "Please try again after 15 minutes",
    });
  },
});

// Rate limiter for 2FA verification
export const twoFactorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true,
  message: {
    error: "Too many 2FA attempts",
    message: "Please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("2FA rate limit exceeded", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
    res.status(429).json({
      error: "Too many 2FA attempts",
      message: "Please try again after 15 minutes",
    });
  },
});

// Rate limiter for password reset requests
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: {
    error: "Too many password reset requests",
    message: "Please try again after 1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("Password reset rate limit exceeded", {
      ip: req.ip,
      email: req.body?.email,
      userAgent: req.get("User-Agent"),
    });
    res.status(429).json({
      error: "Too many password reset requests",
      message: "Please try again after 1 hour",
    });
  },
});

// Rate limiter for registration
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: {
    error: "Too many registration attempts",
    message: "Please try again after 1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("Registration rate limit exceeded", {
      ip: req.ip,
      email: req.body?.email,
      userAgent: req.get("User-Agent"),
    });
    res.status(429).json({
      error: "Too many registration attempts",
      message: "Please try again after 1 hour",
    });
  },
});
