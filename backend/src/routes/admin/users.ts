import { Router } from 'express';
import { userController } from '../../controllers/user.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { UserRole } from "@prisma/client";

const router = Router();

// All routes in this file are protected and require an admin role
router.use(authenticate, requireRole([UserRole.SUPER_ADMIN, UserRole.FACILITY_ADMIN]));

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.put("/:id/approve", userController.approveUser);
router.delete('/:id', userController.deleteUser);

export { router as adminUserRoutes };
