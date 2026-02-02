import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { logger } from "../utils/logger";

export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const id = (req.headers["x-request-id"] as string) || randomUUID();
  res.setHeader("X-Request-Id", id);
  req.requestId = id;
  next();
};

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const durationNs = Number(process.hrtime.bigint() - start);
    const durationMs = Math.round(durationNs / 1e6);

    logger.info("http_request", {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      userAgent: req.get("user-agent"),
      ip: req.ip,
      contentLength: res.get("content-length"),
      responseTimeMs: durationMs,
    });
  });

  next();
};
