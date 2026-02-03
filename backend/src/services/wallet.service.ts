import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

class WalletService {
  async getWalletByUserId(userId: string) {
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { userId },
        include: {
          balances: true,
        },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      return wallet;
    } catch (error) {
      logger.error('Error fetching wallet:', error);
      throw new Error('Failed to fetch wallet');
    }
  }
}

export const walletService = new WalletService();
