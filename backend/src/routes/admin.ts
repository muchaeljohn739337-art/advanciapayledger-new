import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// All routes in this file are protected and require ADMIN role
router.use(authenticate, requireRole(['ADMIN']));

router.post('/create-admin', adminController.createAdmin);

export { router as adminRoutes };
