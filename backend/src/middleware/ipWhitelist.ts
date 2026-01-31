import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

/**
 * Middleware to restrict access to specific IP addresses
 * @param whitelist Array of allowed IP addresses. If empty, allows all.
 */
export const ipWhitelist = (whitelist: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // In production, we usually look at x-forwarded-for if behind a proxy like Cloudflare
    const clientIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "";
    
    // Normalize IP (handle IPv6 mapping if needed)
    const normalizedIp = clientIp.includes("::ffff:") ? clientIp.split("::ffff:")[1] : clientIp;

    if (whitelist.length > 0 && !whitelist.includes(normalizedIp) && normalizedIp !== "127.0.0.1" && normalizedIp !== "::1") {
      logger.warn(`Unauthorized access attempt from IP: ${normalizedIp} to ${req.originalUrl}`);
      return res.status(403).json({
        error: "IP_RESTRICTED",
        message: "Your IP address is not authorized to access this internal resource.",
      });
    }

    next();
  };
};
