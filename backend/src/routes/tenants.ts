import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticateToken } from '../middleware/auth';
import { tenantController } from '../controllers/tenant.controller';
import { tenantMiddleware, requireTenant } from '../middleware/tenant';

const router = Router();

// Validation schemas
const createTenantSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    subdomain: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
    domain: z.string().optional(),
    plan: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
    settings: z.record(z.any()).optional(),
  }),
});

const updateTenantSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    domain: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRIAL']).optional(),
    plan: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
    settings: z.record(z.any()).optional(),
  }),
});

const addTenantUserSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']),
  }),
});

const updateTenantUserSchema = z.object({
  body: z.object({
    role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']).optional(),
  }),
});

// Public routes (for tenant creation)
router.post(
  '/',
  validate(createTenantSchema),
  tenantController.createTenant,
);

// Tenant-specific routes (require tenant context)
router.use(tenantMiddleware);
router.use(requireTenant);

router.get(
  '/',
  authenticateToken,
  tenantController.getCurrentTenant,
);

router.patch(
  '/',
  authenticateToken,
  validate(updateTenantSchema),
  tenantController.updateTenant,
);

router.delete(
  '/',
  authenticateToken,
  tenantController.deleteTenant,
);

// Tenant user management
router.get(
  '/users',
  authenticateToken,
  tenantController.getTenantUsers,
);

router.post(
  '/users',
  authenticateToken,
  validate(addTenantUserSchema),
  tenantController.addTenantUser,
);

router.patch(
  '/users/:userId',
  authenticateToken,
  validate(updateTenantUserSchema),
  tenantController.updateTenantUser,
);

router.delete(
  '/users/:userId',
  authenticateToken,
  tenantController.removeTenantUser,
);

// Admin routes (system-wide tenant management)
router.get(
  '/admin/all',
  authenticateToken,
  tenantController.getAllTenants, // Requires SUPER_ADMIN role
);

router.get(
  '/admin/:tenantId',
  authenticateToken,
  tenantController.getTenantById, // Requires SUPER_ADMIN role
);

export { router as tenantRoutes };
