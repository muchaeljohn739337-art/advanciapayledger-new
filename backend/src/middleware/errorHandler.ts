import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error("Error occurred:", {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Prisma errors
  if (error.name === "PrismaClientKnownRequestError") {
    return res.status(400).json({
      error: "Database operation failed",
      message: "Invalid data provided",
    });
  }

  // Validation errors
  if (error.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation failed",
      message: error.message,
    });
  }

  // JWT errors
  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      error: "Invalid authentication token",
    });
  }

  // Default error
  const statusCode = (error as any).statusCode || 500;
  const message = process.env.NODE_ENV === "production" 
    ? "Internal server error" 
    : error.message;

  res.status(statusCode).json({
    error: "An error occurred",
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: error.stack }),
  });
};
