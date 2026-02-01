import { PrismaClient, Prisma } from '@prisma/client';
import RedisLockService from './redisLockService';
import IdempotencyService from './idempotencyService';

interface WalletTransactionOptions {
  userId: string;
  amount: number;
  currency: string;
  type: 'DEBIT' | 'CREDIT';
  description: string;
  idempotencyKey?: string;
  metadata?: any;
}

interface WalletTransactionResult {
  success: boolean;
  transactionId?: string;
  newBalance?: number;
  error?: string;
}

export class WalletService {
  private prisma: PrismaClient;
  private lockService: RedisLockService;
  private idempotencyService: IdempotencyService;

  constructor(
    prisma: PrismaClient,
    lockService: RedisLockService,
    idempotencyService: IdempotencyService
  ) {
    this.prisma = prisma;
    this.lockService = lockService;
    this.idempotencyService = idempotencyService;
  }

  async executeTransaction(
    options: WalletTransactionOptions
  ): Promise<WalletTransactionResult> {
    const { userId, amount, currency, type, description, idempotencyKey, metadata } = options;

    if (amount <= 0) {
      return { success: false, error: 'Amount must be positive' };
    }

    const effectiveIdempotencyKey =
      idempotencyKey ||
      this.idempotencyService.generateIdempotencyKey(userId, type, {
        amount,
        currency,
        timestamp: Date.now(),
      });

    const idempotencyCheck = await this.idempotencyService.checkIdempotency(
      effectiveIdempotencyKey
    );

    if (idempotencyCheck.isProcessed) {
      return idempotencyCheck.result as WalletTransactionResult;
    }

    const lockKey = `wallet:${userId}:${currency}`;

    try {
      const result = await this.lockService.withLock(
        lockKey,
        async () => {
          return await this.performAtomicTransaction(options);
        },
        { ttl: 5, retries: 3, retryDelay: 100 }
      );

      await this.idempotencyService.storeIdempotencyResult(
        effectiveIdempotencyKey,
        result
      );

      return result;
    } catch (error: any) {
      const errorResult = {
        success: false,
        error: error.message || 'Transaction failed',
      };

      await this.idempotencyService.storeIdempotencyResult(
        effectiveIdempotencyKey,
        errorResult
      );

      return errorResult;
    }
  }

  private async performAtomicTransaction(
    options: WalletTransactionOptions
  ): Promise<WalletTransactionResult> {
    const { userId, amount, currency, type, description, metadata } = options;

    return await this.prisma.$transaction(async (tx) => {
      let wallet = await tx.wallet.findFirst({
        where: {
          userId,
          blockchain: currency,
          isActive: true,
        },
        select: {
          id: true,
          balanceUSD: true,
        },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const currentBalance = wallet.balanceUSD || 0;
      const newBalance = type === 'DEBIT' 
        ? currentBalance - amount 
        : currentBalance + amount;

      if (type === 'DEBIT' && newBalance < 0) {
        throw new Error('Insufficient balance');
      }

      const updateResult = await tx.wallet.updateMany({
        where: {
          id: wallet.id,
          balanceUSD: currentBalance,
        },
        data: {
          balanceUSD: newBalance,
          lastSyncAt: new Date(),
        },
      });

      if (updateResult.count === 0) {
        throw new Error('Balance changed during transaction (race condition detected)');
      }

      const transaction = await tx.transaction.create({
        data: {
          userId,
          walletId: wallet.id,
          amount: new Prisma.Decimal(amount),
          currency,
          type,
          status: 'COMPLETED',
          description,
          paymentMethod: 'WALLET',
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: `WALLET_${type}`,
          resource: 'wallet',
          resourceId: wallet.id,
          details: {
            transactionId: transaction.id,
            amount,
            currency,
            oldBalance: currentBalance,
            newBalance,
            metadata,
          },
        },
      });

      return {
        success: true,
        transactionId: transaction.id,
        newBalance,
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 5000,
    });
  }

  async getBalance(userId: string, currency: string): Promise<number> {
    const wallet = await this.prisma.wallet.findFirst({
      where: {
        userId,
        blockchain: currency,
        isActive: true,
      },
      select: {
        balanceUSD: true,
      },
    });

    return wallet?.balanceUSD || 0;
  }

  async validateBalance(
    userId: string,
    currency: string,
    requiredAmount: number
  ): Promise<boolean> {
    const balance = await this.getBalance(userId, currency);
    return balance >= requiredAmount;
  }

  async transfer(
    fromUserId: string,
    toUserId: string,
    amount: number,
    currency: string,
    idempotencyKey?: string
  ): Promise<WalletTransactionResult> {
    if (fromUserId === toUserId) {
      return { success: false, error: 'Cannot transfer to self' };
    }

    const effectiveIdempotencyKey =
      idempotencyKey ||
      this.idempotencyService.generateIdempotencyKey(fromUserId, 'TRANSFER', {
        toUserId,
        amount,
        currency,
        timestamp: Date.now(),
      });

    const idempotencyCheck = await this.idempotencyService.checkIdempotency(
      effectiveIdempotencyKey
    );

    if (idempotencyCheck.isProcessed) {
      return idempotencyCheck.result as WalletTransactionResult;
    }

    const lockKeys = [
      `wallet:${fromUserId}:${currency}`,
      `wallet:${toUserId}:${currency}`,
    ].sort();

    try {
      const result = await this.lockService.withLock(
        lockKeys.join(':'),
        async () => {
          const debitResult = await this.executeTransaction({
            userId: fromUserId,
            amount,
            currency,
            type: 'DEBIT',
            description: `Transfer to ${toUserId}`,
            metadata: { transferTo: toUserId },
          });

          if (!debitResult.success) {
            throw new Error(debitResult.error);
          }

          const creditResult = await this.executeTransaction({
            userId: toUserId,
            amount,
            currency,
            type: 'CREDIT',
            description: `Transfer from ${fromUserId}`,
            metadata: { transferFrom: fromUserId },
          });

          if (!creditResult.success) {
            throw new Error('Credit failed after debit - manual intervention required');
          }

          return {
            success: true,
            transactionId: debitResult.transactionId,
            newBalance: debitResult.newBalance,
          };
        },
        { ttl: 10, retries: 3, retryDelay: 100 }
      );

      await this.idempotencyService.storeIdempotencyResult(
        effectiveIdempotencyKey,
        result
      );

      return result;
    } catch (error: any) {
      const errorResult = {
        success: false,
        error: error.message || 'Transfer failed',
      };

      await this.idempotencyService.storeIdempotencyResult(
        effectiveIdempotencyKey,
        errorResult
      );

      return errorResult;
    }
  }
}

export default WalletService;
