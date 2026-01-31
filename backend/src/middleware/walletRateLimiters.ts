import rateLimit from "express-rate-limit";
import { logger } from "../utils/logger";

// Rate limiter for wallet connection
export const walletConnectLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 wallet connections per hour
  skipSuccessfulRequests: false,
  message: {
    error: "Too many wallet connection attempts",
    message: "Please try again after 1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("Wallet connect rate limit exceeded", {
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.get("User-Agent"),
    });
    res.status(429).json({
      error: "Too many wallet connection attempts",
      message: "Please try again after 1 hour",
    });
  },
});

// Rate limiter for balance fetching
export const balanceFetchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 balance checks per minute
  skipSuccessfulRequests: false,
  message: {
    error: "Too many balance requests",
    message: "Please try again in a moment",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("Balance fetch rate limit exceeded", {
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.get("User-Agent"),
    });
    res.status(429).json({
      error: "Too many balance requests",
      message: "Please try again in a moment",
    });
  },
});

// Rate limiter for transaction history
export const historyFetchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 history requests per minute
  skipSuccessfulRequests: false,
  message: {
    error: "Too many history requests",
    message: "Please try again in a moment",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("History fetch rate limit exceeded", {
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.get("User-Agent"),
    });
    res.status(429).json({
      error: "Too many history requests",
      message: "Please try again in a moment",
    });
  },
});
