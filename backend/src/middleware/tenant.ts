import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

export interface TenantRequest extends Request {
  tenant?: {
    id: string;
    name: string;
    subdomain: string;
    status: string;
    plan: string;
    settings: Record<string, unknown>;
  };
  tenantId?: string;
}

export const tenantMiddleware = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Extract tenant from subdomain or custom domain
    const host = req.headers.host || "";
    const subdomain = host.split(".")[0];

    // Skip tenant check for health checks and admin routes
    if (
      req.path.startsWith("/health") ||
      req.path.startsWith("/api/admin/system") ||
      subdomain === "api" ||
      subdomain === "www"
    ) {
      return next();
    }

    // Find tenant by subdomain
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain },
      select: {
        id: true,
        name: true,
        subdomain: true,
        status: true,
        plan: true,
        settings: true,
      },
    });

    if (!tenant) {
      logger.warn(`Tenant not found for subdomain: ${subdomain}`);
      return res.status(404).json({
        error: "Tenant not found",
        code: "TENANT_NOT_FOUND",
      });
    }

    if (tenant.status !== "ACTIVE") {
      logger.warn(
        `Inactive tenant access attempt: ${subdomain}, status: ${tenant.status}`,
      );
      return res.status(403).json({
        error: "Tenant inactive",
        code: "TENANT_INACTIVE",
      });
    }

    // Attach tenant to request
    req.tenant = tenant;
    req.tenantId = tenant.id;

    // Add tenant context to logs
    logger.addContext("tenantId", tenant.id);
    logger.addContext("tenantName", tenant.name);

    next();
  } catch (error) {
    logger.error("Tenant middleware error:", error);
    res.status(500).json({
      error: "Internal server error",
      code: "TENANT_ERROR",
    });
  }
};

export const requireTenant = (
  req: TenantRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.tenant) {
    return res.status(400).json({
      error: "Tenant context required",
      code: "TENANT_REQUIRED",
    });
  }
  next();
};
