import { Request, Response } from "express";
import { walletService } from "../services/wallet.service";
import { logger } from "../utils/logger";

class WalletController {
  async getWallet(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const wallet = await walletService.getWalletByUserId(userId);
      res.json(wallet);
    } catch (error) {
      logger.error("Error fetching wallet:", error);
      res.status(500).json({ error: "Failed to fetch wallet" });
    }
  }
}

export const walletController = new WalletController();
