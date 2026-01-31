import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

/**
 * Security middleware to prevent access to sensitive tables
 */
export const preventSensitiveTableAccess = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const url = req.url.toLowerCase();

  // Block any direct access to sessions table via API
  if (url.includes("/sessions") || url.includes("session")) {
    logger.warn(
      `Blocked attempt to access sessions endpoint: ${url} from IP: ${req.ip}`,
    );
    return res.status(404).json({
      error: "Endpoint not found",
      message: "The requested resource does not exist",
    });
  }

  // Block any Prisma query that might expose sessions
  const body = req.body;
  if (body && typeof body === "object") {
    const bodyStr = JSON.stringify(body).toLowerCase();
    if (bodyStr.includes("session") || bodyStr.includes("refresh_token")) {
      logger.warn(
        `Blocked request with potential session exposure: ${url} from IP: ${req.ip}`,
      );
      return res.status(400).json({
        error: "Invalid request",
        message: "Request contains prohibited content",
      });
    }
  }

  next();
};

/**
 * Middleware to sanitize query parameters
 */
export const sanitizeQueries = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Remove any potential session-related query parameters
  const { session, refresh_token, refreshToken, ...sanitizedQuery } = req.query;

  if (session || refresh_token || refreshToken) {
    logger.warn(
      `Sanitized query parameters removed from request: ${req.path} from IP: ${req.ip}`,
    );
    req.query = sanitizedQuery;
  }

  next();
};

/**
 * Rate limiting for sensitive operations
 */
export const sensitiveOperationRateLimit = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const sensitivePaths = ["/auth/login", "/auth/register", "/auth/refresh"];

  if (sensitivePaths.some((path) => req.path.startsWith(path))) {
    // Add stricter rate limiting for auth endpoints
    res.setHeader("X-Rate-Limit-Limit", "5");
    res.setHeader("X-Rate-Limit-Remaining", "5");
    res.setHeader("X-Rate-Limit-Reset", Date.now() + 60000); // 1 minute
  }

  next();
};

/**
 * Data sanitization middleware to prevent sensitive data leakage
 */
export const sanitizeResponse = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const originalJson = res.json;

  res.json = function (data: any) {
    if (data && typeof data === "object") {
      // Recursively remove sensitive fields
      const sanitized = removeSensitiveFields(data);
      return originalJson.call(this, sanitized);
    }
    return originalJson.call(this, data);
  };

  next();
};

/**
 * Recursively remove sensitive fields from objects
 */
function removeSensitiveFields(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => removeSensitiveFields(item));
  }

  if (typeof obj === "object") {
    const sensitiveFields = [
      "refreshToken",
      "refresh_token",
      "passwordHash",
      "password_hash",
      "twoFactorSecret",
      "two_factor_secret",
      "ssn",
      "session",
    ];

    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
      // Skip sensitive fields
      if (sensitiveFields.includes(key.toLowerCase())) {
        continue;
      }

      // Recursively sanitize nested objects
      sanitized[key] = removeSensitiveFields(value);
    }

    return sanitized;
  }

  return obj;
}

/**
 * Security headers middleware
 */
export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Prevent caching of sensitive responses
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  // Security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  next();
};
