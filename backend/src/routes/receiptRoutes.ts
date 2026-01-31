import { Router } from "express";
import { parseReceiptUpload } from "../controllers/receiptController";
import { uploadMiddleware } from "../controllers/uploadController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

/**
 * @route POST /api/receipts/parse
 * @desc Parse a receipt image using AI OCR
 * @access Private
 */
router.post("/parse", authenticateToken, uploadMiddleware, parseReceiptUpload);

export default router;
