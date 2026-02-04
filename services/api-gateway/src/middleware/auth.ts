import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId?: string;
  };
  tenant?: {
    id: string;
    name: string;
    plan: string;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        tenantUsers: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token or user inactive',
      });
    }

    // Get primary tenant (first one found)
    const primaryTenantUser = user.tenantUsers[0];
    const tenant = primaryTenantUser?.tenant;

    // Attach user and tenant to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: tenant?.id,
    };

    if (tenant) {
      req.tenant = {
        id: tenant.id,
        name: tenant.name,
        plan: tenant.plan,
      };
    }

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expired',
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
  }
};

// Optional auth - doesn't fail if no token, but attaches user if valid
export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token, continue without auth
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        tenantUsers: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (user && user.isActive) {
      const primaryTenantUser = user.tenantUsers[0];
      const tenant = primaryTenantUser?.tenant;

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: tenant?.id,
      };

      if (tenant) {
        req.tenant = {
          id: tenant.id,
          name: tenant.name,
          plan: tenant.plan,
        };
      }
    }

    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};
