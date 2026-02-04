import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

// Role hierarchy for permission checking
const ROLE_HIERARCHY = {
  'USER': 0,
  'ADMIN': 1,
  'SUPER_ADMIN': 2,
};

// Check if user has required role or higher
const hasRole = (userRole: string, requiredRoles: string[]): boolean => {
  return requiredRoles.some(requiredRole => {
    const userLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole as keyof typeof ROLE_HIERARCHY] || 0;
    return userLevel >= requiredLevel;
  });
};

// RBAC middleware factory
export const rbacMiddleware = (requiredRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Check if user has required role
    if (!hasRole(req.user.role, requiredRoles)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`,
        userRole: req.user.role,
      });
    }

    // Check tenant access if tenant-specific resource
    if (req.params.tenantId && req.user.tenantId) {
      if (req.user.tenantId !== req.params.tenantId && req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Access denied to this tenant',
        });
      }
    }

    next();
  };
};

// Resource-based access control
export const resourceAccessMiddleware = (
  resourceType: string,
  action: 'create' | 'read' | 'update' | 'delete'
) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Define resource permissions
    const resourcePermissions = {
      'tenant': {
        'create': ['ADMIN', 'SUPER_ADMIN'],
        'read': ['USER', 'ADMIN', 'SUPER_ADMIN'],
        'update': ['ADMIN', 'SUPER_ADMIN'],
        'delete': ['SUPER_ADMIN'],
      },
      'user': {
        'create': ['ADMIN', 'SUPER_ADMIN'],
        'read': ['ADMIN', 'SUPER_ADMIN'],
        'update': ['ADMIN', 'SUPER_ADMIN'],
        'delete': ['SUPER_ADMIN'],
      },
      'deployment': {
        'create': ['ADMIN', 'SUPER_ADMIN'],
        'read': ['USER', 'ADMIN', 'SUPER_ADMIN'],
        'update': ['ADMIN', 'SUPER_ADMIN'],
        'delete': ['ADMIN', 'SUPER_ADMIN'],
      },
      'monitoring': {
        'create': ['USER', 'ADMIN', 'SUPER_ADMIN'],
        'read': ['USER', 'ADMIN', 'SUPER_ADMIN'],
        'update': ['ADMIN', 'SUPER_ADMIN'],
        'delete': ['ADMIN', 'SUPER_ADMIN'],
      },
      'web3': {
        'create': ['USER', 'ADMIN', 'SUPER_ADMIN'],
        'read': ['USER', 'ADMIN', 'SUPER_ADMIN'],
        'update': ['ADMIN', 'SUPER_ADMIN'],
        'delete': ['ADMIN', 'SUPER_ADMIN'],
      },
      'ai': {
        'create': ['USER', 'ADMIN', 'SUPER_ADMIN'],
        'read': ['USER', 'ADMIN', 'SUPER_ADMIN'],
        'update': ['ADMIN', 'SUPER_ADMIN'],
        'delete': ['ADMIN', 'SUPER_ADMIN'],
      },
      'security': {
        'create': ['ADMIN', 'SUPER_ADMIN'],
        'read': ['ADMIN', 'SUPER_ADMIN'],
        'update': ['SUPER_ADMIN'],
        'delete': ['SUPER_ADMIN'],
      },
      'notification': {
        'create': ['USER', 'ADMIN', 'SUPER_ADMIN'],
        'read': ['USER', 'ADMIN', 'SUPER_ADMIN'],
        'update': ['ADMIN', 'SUPER_ADMIN'],
        'delete': ['ADMIN', 'SUPER_ADMIN'],
      },
      'billing': {
        'create': ['ADMIN', 'SUPER_ADMIN'],
        'read': ['USER', 'ADMIN', 'SUPER_ADMIN'],
        'update': ['ADMIN', 'SUPER_ADMIN'],
        'delete': ['SUPER_ADMIN'],
      },
    };

    const permissions = resourcePermissions[resourceType as keyof typeof resourcePermissions];
    const requiredRoles = permissions?.[action] || [];

    if (!hasRole(req.user.role, requiredRoles)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Insufficient permissions for ${action} on ${resourceType}`,
        requiredRoles,
        userRole: req.user.role,
      });
    }

    next();
  };
};

// Tenant ownership check
export const tenantOwnershipMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  // Super admins can access any tenant
  if (req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  // Users can only access their own tenant
  const tenantId = req.params.tenantId || req.body.tenantId || req.query.tenantId;
  
  if (tenantId && req.user.tenantId !== tenantId) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied to this tenant',
    });
  }

  next();
};

// Self-access check (users can only access their own resources)
export const selfAccessMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  // Super admins can access any user
  if (req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  // Users can only access their own resources
  const userId = req.params.userId || req.params.id || req.body.userId;
  
  if (userId && req.user.id !== userId) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied to this resource',
    });
  }

  next();
};
