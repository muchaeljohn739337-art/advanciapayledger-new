import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

class WalletService {
  async getWalletByUserId(userId: string) {
    try {
      let wallet = await prisma.wallet.findUnique({
        where: { userId },
        include: {
          balances: true,
        },
      });

      if (!wallet) {
        wallet = await prisma.wallet.create({
          data: {
            userId,
          },
          include: {
            balances: true,
          },
        });
      }

      return wallet;
    } catch (error) {
      logger.error("Error fetching or creating wallet:", error);
      throw new Error("Failed to fetch or create wallet");
    }
  }

  async updateBalance(userId: string, currency: string, amount: number) {
    try {
      const wallet = await this.getWalletByUserId(userId);

      const existingBalance = wallet.balances.find(b => b.currency === currency);

      if (existingBalance) {
        const updatedBalance = await prisma.walletBalance.update({
          where: { id: existingBalance.id },
          data: { amount: existingBalance.amount + amount },
        });
        return updatedBalance;
      } else {
        const newBalance = await prisma.walletBalance.create({
          data: {
            walletId: wallet.id,
            currency,
            amount,
          },
        });
        return newBalance;
      }
    } catch (error) {
      logger.error('Error updating balance:', error);
      throw new Error('Failed to update balance');
    }
  }
}

export const walletService = new WalletService();
