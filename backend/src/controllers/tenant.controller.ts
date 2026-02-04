import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";
import { TenantRequest } from "../middleware/tenant";
import {
  CreateTenantRequest,
  UpdateTenantRequest,
  AddTenantUserRequest,
  UpdateTenantUserRequest,
  TenantStatus,
} from "../models/tenant.model";

const prisma = new PrismaClient();

export class TenantController {
  async createTenant(req: Request, res: Response) {
    try {
      const {
        name,
        subdomain,
        domain,
        plan = "FREE",
        settings = {},
      } = req.body as CreateTenantRequest;

      // Check if subdomain already exists
      const existingTenant = await prisma.tenant.findUnique({
        where: { subdomain },
      });

      if (existingTenant) {
        return res.status(409).json({
          error: "Subdomain already taken",
          code: "SUBDOMAIN_TAKEN",
        });
      }

      // Check if domain already exists (if provided)
      if (domain) {
        const existingDomain = await prisma.tenant.findUnique({
          where: { domain },
        });

        if (existingDomain) {
          return res.status(409).json({
            error: "Domain already taken",
            code: "DOMAIN_TAKEN",
          });
        }
      }

      // Create tenant
      const tenant = await prisma.tenant.create({
        data: {
          name,
          subdomain,
          domain,
          plan,
          settings,
          status: "ACTIVE",
        },
        select: {
          id: true,
          name: true,
          subdomain: true,
          domain: true,
          plan: true,
          status: true,
          settings: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info(`Tenant created: ${tenant.id} (${tenant.subdomain})`);

      res.status(201).json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      logger.error("Create tenant error:", error);
      res.status(500).json({
        error: "Internal server error",
        code: "CREATE_TENANT_FAILED",
      });
    }
  }

  async getCurrentTenant(req: TenantRequest, res: Response) {
    try {
      if (!req.tenant) {
        return res.status(404).json({
          error: "Tenant not found",
          code: "TENANT_NOT_FOUND",
        });
      }

      res.json({
        success: true,
        data: req.tenant,
      });
    } catch (error) {
      logger.error("Get current tenant error:", error);
      res.status(500).json({
        error: "Internal server error",
        code: "GET_TENANT_FAILED",
      });
    }
  }

  async updateTenant(req: TenantRequest, res: Response) {
    try {
      if (!req.tenant) {
        return res.status(404).json({
          error: "Tenant not found",
          code: "TENANT_NOT_FOUND",
        });
      }

      const { name, domain, status, plan, settings } =
        req.body as UpdateTenantRequest;

      // Check domain uniqueness if updating
      if (domain && domain !== req.tenant.domain) {
        const existingDomain = await prisma.tenant.findUnique({
          where: { domain },
        });

        if (existingDomain) {
          return res.status(409).json({
            error: "Domain already taken",
            code: "DOMAIN_TAKEN",
          });
        }
      }

      const updatedTenant = await prisma.tenant.update({
        where: { id: req.tenant.id },
        data: {
          ...(name && { name }),
          ...(domain !== undefined && { domain }),
          ...(status && { status }),
          ...(plan && { plan }),
          ...(settings && { settings }),
        },
        select: {
          id: true,
          name: true,
          subdomain: true,
          domain: true,
          plan: true,
          status: true,
          settings: true,
          updatedAt: true,
        },
      });

      logger.info(`Tenant updated: ${updatedTenant.id}`);

      res.json({
        success: true,
        data: updatedTenant,
      });
    } catch (error) {
      logger.error("Update tenant error:", error);
      res.status(500).json({
        error: "Internal server error",
        code: "UPDATE_TENANT_FAILED",
      });
    }
  }

  async deleteTenant(req: TenantRequest, res: Response) {
    try {
      if (!req.tenant) {
        return res.status(404).json({
          error: "Tenant not found",
          code: "TENANT_NOT_FOUND",
        });
      }

      // Soft delete by setting status to INACTIVE
      await prisma.tenant.update({
        where: { id: req.tenant.id },
        data: { status: TenantStatus.INACTIVE },
      });

      logger.info(`Tenant deleted (soft): ${req.tenant.id}`);

      res.json({
        success: true,
        message: "Tenant deactivated successfully",
      });
    } catch (error) {
      logger.error("Delete tenant error:", error);
      res.status(500).json({
        error: "Internal server error",
        code: "DELETE_TENANT_FAILED",
      });
    }
  }

  async getTenantUsers(req: TenantRequest, res: Response) {
    try {
      if (!req.tenant) {
        return res.status(404).json({
          error: "Tenant not found",
          code: "TENANT_NOT_FOUND",
        });
      }

      const users = await prisma.tenantUser.findMany({
        where: { tenantId: req.tenant.id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              status: true,
            },
          },
        },
        orderBy: { joinedAt: "desc" },
      });

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      logger.error("Get tenant users error:", error);
      res.status(500).json({
        error: "Internal server error",
        code: "GET_TENANT_USERS_FAILED",
      });
    }
  }

  async addTenantUser(req: TenantRequest, res: Response) {
    try {
      if (!req.tenant) {
        return res.status(404).json({
          error: "Tenant not found",
          code: "TENANT_NOT_FOUND",
        });
      }

      const { userId, role } = req.body as AddTenantUserRequest;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({
          error: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      // Check if user is already in tenant
      const existingMembership = await prisma.tenantUser.findUnique({
        where: {
          tenantId_userId: {
            tenantId: req.tenant.id,
            userId,
          },
        },
      });

      if (existingMembership) {
        return res.status(409).json({
          error: "User already in tenant",
          code: "USER_ALREADY_IN_TENANT",
        });
      }

      // Add user to tenant
      const tenantUser = await prisma.tenantUser.create({
        data: {
          tenantId: req.tenant.id,
          userId,
          role,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              status: true,
            },
          },
        },
      });

      logger.info(`User added to tenant: ${userId} -> ${req.tenant.id}`);

      res.status(201).json({
        success: true,
        data: tenantUser,
      });
    } catch (error) {
      logger.error("Add tenant user error:", error);
      res.status(500).json({
        error: "Internal server error",
        code: "ADD_TENANT_USER_FAILED",
      });
    }
  }

  async updateTenantUser(req: TenantRequest, res: Response) {
    try {
      if (!req.tenant) {
        return res.status(404).json({
          error: "Tenant not found",
          code: "TENANT_NOT_FOUND",
        });
      }

      const { userId } = req.params;
      const { role } = req.body as UpdateTenantUserRequest;

      const updatedUser = await prisma.tenantUser.update({
        where: {
          tenantId_userId: {
            tenantId: req.tenant.id,
            userId,
          },
        },
        data: { role },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              status: true,
            },
          },
        },
      });

      logger.info(`Tenant user role updated: ${userId} -> ${role}`);

      res.json({
        success: true,
        data: updatedUser,
      });
    } catch (error) {
      logger.error("Update tenant user error:", error);
      res.status(500).json({
        error: "Internal server error",
        code: "UPDATE_TENANT_USER_FAILED",
      });
    }
  }

  async removeTenantUser(req: TenantRequest, res: Response) {
    try {
      if (!req.tenant) {
        return res.status(404).json({
          error: "Tenant not found",
          code: "TENANT_NOT_FOUND",
        });
      }

      const { userId } = req.params;

      await prisma.tenantUser.delete({
        where: {
          tenantId_userId: {
            tenantId: req.tenant.id,
            userId,
          },
        },
      });

      logger.info(`User removed from tenant: ${userId} <- ${req.tenant.id}`);

      res.json({
        success: true,
        message: "User removed from tenant successfully",
      });
    } catch (error) {
      logger.error("Remove tenant user error:", error);
      res.status(500).json({
        error: "Internal server error",
        code: "REMOVE_TENANT_USER_FAILED",
      });
    }
  }

  async getAllTenants(req: Request, res: Response) {
    try {
      // TODO: Add SUPER_ADMIN role check
      const tenants = await prisma.tenant.findMany({
        select: {
          id: true,
          name: true,
          subdomain: true,
          domain: true,
          plan: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({
        success: true,
        data: tenants,
      });
    } catch (error) {
      logger.error("Get all tenants error:", error);
      res.status(500).json({
        error: "Internal server error",
        code: "GET_ALL_TENANTS_FAILED",
      });
    }
  }

  async getTenantById(req: Request, res: Response) {
    try {
      // TODO: Add SUPER_ADMIN role check
      const { tenantId } = req.params;

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      if (!tenant) {
        return res.status(404).json({
          error: "Tenant not found",
          code: "TENANT_NOT_FOUND",
        });
      }

      res.json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      logger.error("Get tenant by ID error:", error);
      res.status(500).json({
        error: "Internal server error",
        code: "GET_TENANT_BY_ID_FAILED",
      });
    }
  }
}

export const tenantController = new TenantController();
