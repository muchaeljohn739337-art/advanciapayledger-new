import Redis from 'ioredis';

interface LockOptions {
  ttl?: number; // Time to live in seconds (default: 5)
  retries?: number; // Number of retry attempts (default: 3)
  retryDelay?: number; // Delay between retries in ms (default: 100)
}

export class RedisLockService {
  private redis: Redis;
  private readonly DEFAULT_TTL = 5; // 5 seconds
  private readonly DEFAULT_RETRIES = 3;
  private readonly DEFAULT_RETRY_DELAY = 100; // 100ms

  constructor(redisClient: Redis) {
    this.redis = redisClient;
  }

  async acquireLock(
    key: string,
    options: LockOptions = {}
  ): Promise<string | null> {
    const ttl = options.ttl || this.DEFAULT_TTL;
    const retries = options.retries || this.DEFAULT_RETRIES;
    const retryDelay = options.retryDelay || this.DEFAULT_RETRY_DELAY;

    const lockValue = this.generateLockValue();
    const lockKey = `lock:${key}`;

    for (let attempt = 0; attempt < retries; attempt++) {
      const acquired = await this.redis.set(
        lockKey,
        lockValue,
        'EX',
        ttl,
        'NX'
      );

      if (acquired === 'OK') {
        return lockValue;
      }

      if (attempt < retries - 1) {
        await this.sleep(retryDelay);
      }
    }

    return null;
  }

  async releaseLock(key: string, lockValue: string): Promise<boolean> {
    const lockKey = `lock:${key}`;

    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    const result = await this.redis.eval(script, 1, lockKey, lockValue);
    return result === 1;
  }

  async extendLock(
    key: string,
    lockValue: string,
    ttl: number
  ): Promise<boolean> {
    const lockKey = `lock:${key}`;

    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("expire", KEYS[1], ARGV[2])
      else
        return 0
      end
    `;

    const result = await this.redis.eval(script, 1, lockKey, lockValue, ttl);
    return result === 1;
  }

  async withLock<T>(
    key: string,
    callback: () => Promise<T>,
    options: LockOptions = {}
  ): Promise<T> {
    const lockValue = await this.acquireLock(key, options);

    if (!lockValue) {
      throw new Error(`Failed to acquire lock for key: ${key}`);
    }

    try {
      const result = await callback();
      return result;
    } finally {
      await this.releaseLock(key, lockValue);
    }
  }

  private generateLockValue(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async isLocked(key: string): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const exists = await this.redis.exists(lockKey);
    return exists === 1;
  }

  async getLockTTL(key: string): Promise<number> {
    const lockKey = `lock:${key}`;
    return await this.redis.ttl(lockKey);
  }
}

export default RedisLockService;
