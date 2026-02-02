import { PrismaClient } from '@prisma/client';
import { getRedisClient } from './redis';
import { getStripeClient } from './stripe';
import RedisLockService from '../services/redisLockService';
import IdempotencyService from '../services/idempotencyService';
import WalletService from '../services/walletService';
import PaymentService from '../services/paymentService';
import { logger } from "../utils/logger";

let prismaClient: PrismaClient | null = null;
let lockService: RedisLockService | null = null;
let idempotencyService: IdempotencyService | null = null;
let walletService: WalletService | null = null;
let paymentService: PaymentService | null = null;

export const getPrismaClient = (): PrismaClient => {
  if (!prismaClient) {
    prismaClient = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
    });
    
    logger.info("Prisma client initialized");
  }
  
  return prismaClient;
};

export const getLockService = (): RedisLockService => {
  if (!lockService) {
    const redis = getRedisClient();
    lockService = new RedisLockService(redis);
    logger.info("Lock service initialized");
  }
  
  return lockService;
};

export const getIdempotencyService = (): IdempotencyService => {
  if (!idempotencyService) {
    const prisma = getPrismaClient();
    const redis = getRedisClient();
    idempotencyService = new IdempotencyService(prisma, redis);
    logger.info("Idempotency service initialized");
  }
  
  return idempotencyService;
};

export const getWalletService = (): WalletService => {
  if (!walletService) {
    const prisma = getPrismaClient();
    const lock = getLockService();
    const idempotency = getIdempotencyService();
    walletService = new WalletService(prisma, lock, idempotency);
    logger.info("Wallet service initialized");
  }
  
  return walletService;
};

export const getPaymentService = (): PaymentService => {
  if (!paymentService) {
    const prisma = getPrismaClient();
    const stripe = getStripeClient();
    const lock = getLockService();
    const idempotency = getIdempotencyService();
    const wallet = getWalletService();
    paymentService = new PaymentService(prisma, stripe, lock, idempotency, wallet);
    logger.info("Payment service initialized");
  }
  
  return paymentService;
};

export const closeAllConnections = async (): Promise<void> => {
  if (prismaClient) {
    await prismaClient.$disconnect();
    prismaClient = null;
  }
  
  const redis = getRedisClient();
  if (redis) {
    await redis.quit();
  }
  
  logger.info("All connections closed");
};

export default {
  getPrismaClient,
  getLockService,
  getIdempotencyService,
  getWalletService,
  getPaymentService,
  closeAllConnections,
};
