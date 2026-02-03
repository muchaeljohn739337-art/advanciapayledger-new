import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { hash } from '../utils/encryption';

// This is a mock implementation until the database is stable.
const MOCK_VIRTUAL_CARDS: any[] = [];

class VirtualCardService {
  async createVirtualCard(userId: string, walletId: string, currency: string) {
    logger.info(`Creating virtual card for user ${userId}`);

    // Simulate card number and CVV generation
    const cardNumber = '5' + Array.from({ length: 15 }, () => Math.floor(Math.random() * 10)).join('');
    const cvv = Array.from({ length: 3 }, () => Math.floor(Math.random() * 10)).join('');
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 3);

    const cardNumberHash = await hash(cardNumber);
    const cvvHash = await hash(cvv);

    // Mock database interaction
    const newCard = {
      id: `vc_${Date.now()}`,
      userId,
      walletId,
      cardNumberHash,
      cvvHash,
      expiryDate,
      status: 'ACTIVE',
      dailyLimit: 1000,
      monthlyLimit: 5000,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Return plain text values for immediate use, DO NOT do this in production
      cardNumber,
      cvv,
    };

    MOCK_VIRTUAL_CARDS.push(newCard);
    logger.info(`Mock virtual card created: ${newCard.id}`);

    return newCard;
  }

  async getVirtualCardsByUserId(userId: string) {
    logger.info(`Fetching virtual cards for user ${userId}`);
    // Mock database interaction
    const cards = MOCK_VIRTUAL_CARDS.filter(card => card.userId === userId).map(card => {
      const { cardNumber, cvv, ...rest } = card; // Don't expose raw card details
      return rest;
    });
    return cards;
  }
}

export const virtualCardService = new VirtualCardService();
