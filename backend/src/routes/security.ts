import { Router } from 'express';
import { securityController } from '../controllers/security.controller';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

// Validation schemas
const verify2FASchema = z.object({
  body: z.object({
    token: z.string().length(6),
  }),
});

// Routes - All protected by auth
router.use(authenticateToken);

router.post('/2fa/setup', securityController.setup2FA);
router.post('/2fa/verify', validate(verify2FASchema), securityController.verifyAndEnable2FA);
router.post('/2fa/disable', validate(verify2FASchema), securityController.disable2FA);

export { router as securityRoutes };
