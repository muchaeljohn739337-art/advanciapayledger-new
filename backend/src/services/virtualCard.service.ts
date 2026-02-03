import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { hash } from '../utils/encryption';
import { VirtualCardStatus } from "@prisma/client";

class VirtualCardService {
  async createVirtualCard(userId: string, walletId: string, currency: string) {
    try {
      logger.info(`Creating virtual card for user ${userId}`);

      const cardNumber =
        "5" +
        Array.from({ length: 15 }, () => Math.floor(Math.random() * 10)).join(
          "",
        );
      const cvv = Array.from({ length: 3 }, () =>
        Math.floor(Math.random() * 10),
      ).join("");
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 3);

      const cardNumberHash = await hash(cardNumber);
      const cvvHash = await hash(cvv);
      const cardLast4 = cardNumber.slice(-4);
      const cardBrand = this.getCardBrand(cardNumber);

      const newCard = await prisma.virtualCard.create({
        data: {
          userId,
          walletId,
          cardNumberHash,
          cvvHash,
          expiryDate,
          cardLast4,
          cardBrand,
          status: VirtualCardStatus.ACTIVE,
          dailyLimit: 1000,
          monthlyLimit: 5000,
          currency,
        },
      });

      logger.info(`Virtual card created: ${newCard.id}`);

      // Return only safe card data - NEVER expose sensitive information
      return {
        id: newCard.id,
        userId: newCard.userId,
        walletId: newCard.walletId,
        expiryDate: newCard.expiryDate,
        status: newCard.status,
        dailyLimit: newCard.dailyLimit,
        monthlyLimit: newCard.monthlyLimit,
        currency: newCard.currency,
        createdAt: newCard.createdAt,
        updatedAt: newCard.updatedAt,
        cardLast4: newCard.cardLast4,
        cardBrand: newCard.cardBrand,
      };
    } catch (error) {
      logger.error("Error creating virtual card:", error);
      throw new Error("Failed to create virtual card");
    }
  }

  async getVirtualCardsByUserId(userId: string) {
    try {
      logger.info(`Fetching virtual cards for user ${userId}`);
      const cards = await prisma.virtualCard.findMany({
        where: { userId },
        select: {
          id: true,
          walletId: true,
          expiryDate: true,
          status: true,
          dailyLimit: true,
          monthlyLimit: true,
          currency: true,
          cardLast4: true,
          cardBrand: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return cards;
    } catch (error) {
      logger.error("Error fetching virtual cards:", error);
      throw new Error("Failed to fetch virtual cards");
    }
  }

  private getCardBrand(cardNumber: string): string {
    const firstDigit = cardNumber.charAt(0);
    const firstTwoDigits = cardNumber.substring(0, 2);
    
    if (firstDigit === '4') {
      return 'VISA';
    } else if (firstTwoDigits >= '51' && firstTwoDigits <= '55') {
      return 'MASTERCARD';
    } else if (firstTwoDigits === '34' || firstTwoDigits === '37') {
      return 'AMERICAN_EXPRESS';
    } else if (firstTwoDigits === '65') {
      return 'DISCOVER';
    } else {
      return 'UNKNOWN';
    }
  }
}

export const virtualCardService = new VirtualCardService();
