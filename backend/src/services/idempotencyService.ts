import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

interface IdempotencyResult {
  isProcessed: boolean;
  result?: any;
}

export class IdempotencyService {
  private prisma: PrismaClient;
  private redis: Redis;
  private readonly TTL = 86400; // 24 hours

  constructor(prisma: PrismaClient, redis: Redis) {
    this.prisma = prisma;
    this.redis = redis;
  }

  async checkIdempotency(key: string): Promise<IdempotencyResult> {
    const redisKey = `idempotency:${key}`;
    
    const cached = await this.redis.get(redisKey);
    if (cached) {
      return {
        isProcessed: true,
        result: JSON.parse(cached),
      };
    }

    const dbRecord = await this.prisma.systemConfig.findUnique({
      where: { key: `idempotency:${key}` },
    });

    if (dbRecord) {
      await this.redis.setex(redisKey, this.TTL, JSON.stringify(dbRecord.value));
      return {
        isProcessed: true,
        result: dbRecord.value,
      };
    }

    return { isProcessed: false };
  }

  async storeIdempotencyResult(key: string, result: any): Promise<void> {
    const redisKey = `idempotency:${key}`;

    await this.redis.setex(redisKey, this.TTL, JSON.stringify(result));

    await this.prisma.systemConfig.upsert({
      where: { key: `idempotency:${key}` },
      create: {
        key: `idempotency:${key}`,
        value: result,
      },
      update: {
        value: result,
      },
    });
  }

  async deleteIdempotencyKey(key: string): Promise<void> {
    const redisKey = `idempotency:${key}`;
    
    await this.redis.del(redisKey);
    
    await this.prisma.systemConfig.deleteMany({
      where: { key: `idempotency:${key}` },
    });
  }

  generateIdempotencyKey(userId: string, operation: string, data: any): string {
    const dataHash = this.hashData(data);
    return `${userId}:${operation}:${dataHash}`;
  }

  private hashData(data: any): string {
    const crypto = require('crypto');
    const str = JSON.stringify(data);
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
  }

  async cleanupExpired(): Promise<number> {
    const oneDayAgo = new Date(Date.now() - 86400000);
    
    const deleted = await this.prisma.systemConfig.deleteMany({
      where: {
        key: {
          startsWith: 'idempotency:',
        },
        createdAt: {
          lt: oneDayAgo,
        },
      },
    });

    return deleted.count;
  }
}

export default IdempotencyService;
