import { Request, Response } from 'express';
import { virtualCardService } from '../services/virtualCard.service';
import { logger } from '../utils/logger';

class VirtualCardController {
  async createVirtualCard(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { walletId, currency } = req.body;

      if (!walletId || !currency) {
        return res.status(400).json({ error: 'walletId and currency are required' });
      }

      const newCard = await virtualCardService.createVirtualCard(userId, walletId, currency);
      res.status(201).json(newCard);
    } catch (error) {
      logger.error('Error creating virtual card:', error);
      res.status(500).json({ error: 'Failed to create virtual card' });
    }
  }

  async getVirtualCards(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const cards = await virtualCardService.getVirtualCardsByUserId(userId);
      res.json(cards);
    } catch (error) {
      logger.error('Error fetching virtual cards:', error);
      res.status(500).json({ error: 'Failed to fetch virtual cards' });
    }
  }
}

export const virtualCardController = new VirtualCardController();
