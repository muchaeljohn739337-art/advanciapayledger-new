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

  async updateBalance(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { currency, amount } = req.body;

      if (!currency || typeof amount !== "number") {
        return res.status(400).json({ error: "Invalid currency or amount" });
      }

      const updatedBalance = await walletService.updateBalance(
        userId,
        currency,
        amount,
      );
      res.json(updatedBalance);
    } catch (error) {
      logger.error("Error updating balance:", error);
      res.status(500).json({ error: "Failed to update balance" });
    }
  }
}

export const walletController = new WalletController();
