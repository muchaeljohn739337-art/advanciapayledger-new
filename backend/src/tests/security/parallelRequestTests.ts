import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import WalletService from '../../services/walletService';
import RedisLockService from '../../services/redisLockService';
import IdempotencyService from '../../services/idempotencyService';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);
const lockService = new RedisLockService(redis);
const idempotencyService = new IdempotencyService(prisma, redis);
const walletService = new WalletService(prisma, lockService, idempotencyService);

describe('Parallel Request Security Tests', () => {
  const testUserId = 'test-user-123';
  const testCurrency = 'USD';

  beforeAll(async () => {
    await prisma.wallet.create({
      data: {
        userId: testUserId,
        address: '0xtest123',
        blockchain: testCurrency,
        balanceUSD: 1000,
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.wallet.deleteMany({ where: { userId: testUserId } });
    await prisma.transaction.deleteMany({ where: { userId: testUserId } });
    await prisma.$disconnect();
    await redis.quit();
  });

  describe('Double Spend Prevention', () => {
    it('should prevent double spend with 10 parallel requests', async () => {
      const initialBalance = await walletService.getBalance(testUserId, testCurrency);
      const debitAmount = 100;
      const numRequests = 10;

      const requests = Array(numRequests)
        .fill(null)
        .map((_, index) =>
          walletService.executeTransaction({
            userId: testUserId,
            amount: debitAmount,
            currency: testCurrency,
            type: 'DEBIT',
            description: `Test debit ${index}`,
          })
        );

      const results = await Promise.allSettled(requests);

      const successfulDebits = results.filter(
        (r) => r.status === 'fulfilled' && r.value.success
      ).length;

      const finalBalance = await walletService.getBalance(testUserId, testCurrency);

      expect(successfulDebits).toBeLessThanOrEqual(
        Math.floor(initialBalance / debitAmount)
      );
      expect(finalBalance).toBeGreaterThanOrEqual(0);
      expect(finalBalance).toBe(initialBalance - successfulDebits * debitAmount);
    });

    it('should handle race condition with same idempotency key', async () => {
      const idempotencyKey = `test-${Date.now()}`;
      const debitAmount = 50;

      const requests = Array(5)
        .fill(null)
        .map(() =>
          walletService.executeTransaction({
            userId: testUserId,
            amount: debitAmount,
            currency: testCurrency,
            type: 'DEBIT',
            description: 'Duplicate request test',
            idempotencyKey,
          })
        );

      const results = await Promise.all(requests);

      const successfulDebits = results.filter((r) => r.success).length;

      expect(successfulDebits).toBe(1);

      const allSameResult = results.every(
        (r) => r.transactionId === results[0].transactionId
      );
      expect(allSameResult).toBe(true);
    });
  });

  describe('Negative Balance Prevention', () => {
    it('should prevent negative balance under concurrent load', async () => {
      const balance = await walletService.getBalance(testUserId, testCurrency);
      const largeAmount = balance + 100;

      const requests = Array(5)
        .fill(null)
        .map(() =>
          walletService.executeTransaction({
            userId: testUserId,
            amount: largeAmount,
            currency: testCurrency,
            type: 'DEBIT',
            description: 'Over-debit attempt',
          })
        );

      const results = await Promise.allSettled(requests);

      const successfulDebits = results.filter(
        (r) => r.status === 'fulfilled' && r.value.success
      ).length;

      expect(successfulDebits).toBe(0);

      const finalBalance = await walletService.getBalance(testUserId, testCurrency);
      expect(finalBalance).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Transfer Race Conditions', () => {
    const user2Id = 'test-user-456';

    beforeAll(async () => {
      await prisma.wallet.create({
        data: {
          userId: user2Id,
          address: '0xtest456',
          blockchain: testCurrency,
          balanceUSD: 500,
          isActive: true,
        },
      });
    });

    afterAll(async () => {
      await prisma.wallet.deleteMany({ where: { userId: user2Id } });
      await prisma.transaction.deleteMany({ where: { userId: user2Id } });
    });

    it('should handle parallel transfers correctly', async () => {
      const transferAmount = 10;
      const numTransfers = 5;

      const initialBalance1 = await walletService.getBalance(testUserId, testCurrency);
      const initialBalance2 = await walletService.getBalance(user2Id, testCurrency);

      const requests = Array(numTransfers)
        .fill(null)
        .map(() =>
          walletService.transfer(testUserId, user2Id, transferAmount, testCurrency)
        );

      const results = await Promise.allSettled(requests);

      const successfulTransfers = results.filter(
        (r) => r.status === 'fulfilled' && r.value.success
      ).length;

      const finalBalance1 = await walletService.getBalance(testUserId, testCurrency);
      const finalBalance2 = await walletService.getBalance(user2Id, testCurrency);

      expect(finalBalance1).toBe(initialBalance1 - successfulTransfers * transferAmount);
      expect(finalBalance2).toBe(initialBalance2 + successfulTransfers * transferAmount);
      expect(finalBalance1 + finalBalance2).toBe(initialBalance1 + initialBalance2);
    });
  });

  describe('Lock Timeout and Recovery', () => {
    it('should timeout and retry when lock is held too long', async () => {
      const lockKey = `wallet:${testUserId}:${testCurrency}`;
      
      const lockValue = await lockService.acquireLock(lockKey, { ttl: 2 });
      expect(lockValue).toBeTruthy();

      const startTime = Date.now();
      
      const result = await walletService.executeTransaction({
        userId: testUserId,
        amount: 10,
        currency: testCurrency,
        type: 'CREDIT',
        description: 'Lock timeout test',
      });

      const elapsed = Date.now() - startTime;

      await lockService.releaseLock(lockKey, lockValue!);

      expect(elapsed).toBeGreaterThan(2000);
      expect(result.success).toBe(true);
    });
  });

  describe('Stress Test - High Concurrency', () => {
    it('should handle 50 concurrent mixed operations', async () => {
      const operations = [];

      for (let i = 0; i < 25; i++) {
        operations.push(
          walletService.executeTransaction({
            userId: testUserId,
            amount: 5,
            currency: testCurrency,
            type: 'CREDIT',
            description: `Stress credit ${i}`,
          })
        );
      }

      for (let i = 0; i < 25; i++) {
        operations.push(
          walletService.executeTransaction({
            userId: testUserId,
            amount: 3,
            currency: testCurrency,
            type: 'DEBIT',
            description: `Stress debit ${i}`,
          })
        );
      }

      const initialBalance = await walletService.getBalance(testUserId, testCurrency);

      const results = await Promise.allSettled(operations);

      const successfulCredits = results
        .slice(0, 25)
        .filter((r) => r.status === 'fulfilled' && r.value.success).length;

      const successfulDebits = results
        .slice(25)
        .filter((r) => r.status === 'fulfilled' && r.value.success).length;

      const expectedBalance =
        initialBalance + successfulCredits * 5 - successfulDebits * 3;

      const finalBalance = await walletService.getBalance(testUserId, testCurrency);

      expect(finalBalance).toBe(expectedBalance);
      expect(finalBalance).toBeGreaterThanOrEqual(0);
    });
  });
});
