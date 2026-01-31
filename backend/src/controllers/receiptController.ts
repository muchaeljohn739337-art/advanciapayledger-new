import { Request, Response } from "express";
import { receiptOCRAgent } from "../agents/ReceiptOCRAgent";
import { logger } from "../utils/logger";

/**
 * Handle receipt image upload and parsing
 */
export const parseReceiptUpload = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No receipt image provided" });
    }

    logger.info(`Processing receipt parse request for file: ${req.file.originalname}`);

    const result = await receiptOCRAgent.parseReceipt(
      req.file.buffer,
      req.file.mimetype
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error parsing receipt:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error during receipt parsing",
    });
  }
};
