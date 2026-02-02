import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { captureException } from "../config/sentry";

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  logger.error("Error occurred:", {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    requestId: req.requestId,
  });

  // Prisma errors
  if (
    error instanceof Error &&
    error.name === "PrismaClientKnownRequestError"
  ) {
    res.status(400).json({
      error: "Database operation failed",
      message: "Invalid data provided",
    });
    return;
  }

  // Validation errors
  if (error instanceof Error && error.name === "ValidationError") {
    res.status(400).json({
      error: "Validation failed",
      message: error.message,
    });
    return;
  }

  // JWT errors
  if (error instanceof Error && error.name === "JsonWebTokenError") {
    res.status(401).json({
      error: "Invalid authentication token",
    });
    return;
  }

  // Default error
  const statusCode =
    typeof error === "object" && error !== null && "statusCode" in error
      ? (error as { statusCode?: number }).statusCode || 500
      : 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : error instanceof Error
        ? error.message
        : String(error);

  // Capture unexpected server errors in Sentry
  if (statusCode >= 500) {
    captureException(
      error instanceof Error ? error : new Error(String(error)),
      {
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        requestId: req.requestId,
      },
    );
  }

  res.status(statusCode).json({
    error: "An error occurred",
    message,
    ...(process.env.NODE_ENV !== "production" &&
      error instanceof Error && { stack: error.stack }),
  });
};
