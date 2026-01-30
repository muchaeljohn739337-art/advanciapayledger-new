import rateLimit from "express-rate-limit";
import { logger } from "../utils/logger";

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests",
    message: "Please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("Rate limit exceeded", {
      ip: req.ip,
      url: req.url,
      userAgent: req.get("User-Agent"),
    });
    res.status(429).json({
      error: "Too many requests",
      message: "Please try again later",
    });
  },
});
