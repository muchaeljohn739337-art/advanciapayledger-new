import { Router } from 'express';
import { uploadFile, deleteFile, uploadMiddleware } from '../controllers/uploadController';

const router = Router();

router.post('/upload', uploadMiddleware, uploadFile);
router.delete('/delete', deleteFile);

export default router;
