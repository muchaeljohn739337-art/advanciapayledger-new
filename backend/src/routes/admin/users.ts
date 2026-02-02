import { Router } from 'express';
import { userController } from '../../controllers/user.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

// All routes in this file are protected and require ADMIN role
router.use(authenticate, requireRole(['ADMIN']));

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

export { router as adminUserRoutes };
