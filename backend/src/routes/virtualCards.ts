import { Router } from 'express';
import { virtualCardController } from '../controllers/virtualCard.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', virtualCardController.createVirtualCard);
router.get('/', virtualCardController.getVirtualCards);

export { router as virtualCardRoutes };
