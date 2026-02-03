import { Request, Response } from 'express';
import multer from 'multer';
import { uploadToSpaces, deleteFromSpaces } from '../config/digitalocean';
import { logger } from "../utils/logger";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

export const uploadMiddleware = upload.single('file');

export const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const folder = req.body.folder || 'uploads';
    const fileUrl = await uploadToSpaces(req.file, folder);

    res.status(200).json({
      success: true,
      url: fileUrl,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    logger.error("Upload error", { error });
    res.status(500).json({ error: 'Failed to upload file' });
  }
};

export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { fileUrl } = req.body;

    if (!fileUrl) {
      return res.status(400).json({ error: 'File URL is required' });
    }

    await deleteFromSpaces(fileUrl);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    logger.error("Delete error", { error });
    res.status(500).json({ error: 'Failed to delete file' });
  }
};
