import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  handler?: (req: Request, res: Response) => void;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: number;
}

export class AdvancedRateLimiter {
  private redis: Redis;
  private config: RateLimitConfig;

  constructor(redis: Redis, config: RateLimitConfig) {
    this.redis = redis;
    this.config = {
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    };
  }

  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const key = this.getKey(req);
        const info = await this.checkLimit(key);

        res.setHeader('X-RateLimit-Limit', info.limit);
        res.setHeader('X-RateLimit-Remaining', info.remaining);
        res.setHeader('X-RateLimit-Reset', info.resetTime);

        if (info.remaining < 0) {
          if (this.config.handler) {
            return this.config.handler(req, res);
          }

          return res.status(429).json({
            error: 'Too many requests',
            retryAfter: Math.ceil((info.resetTime - Date.now()) / 1000),
          });
        }

        const originalSend = res.send;
        res.send = function (data: any) {
          if (!this.config.skipSuccessfulRequests || res.statusCode >= 400) {
            // Count is already incremented
          }
          return originalSend.call(res, data);
        }.bind(this);

        next();
      } catch (error) {
        console.error('Rate limiter error:', error);
        next();
      }
    };
  }

  private async checkLimit(key: string): Promise<RateLimitInfo> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    const multi = this.redis.multi();
    
    multi.zremrangebyscore(key, 0, windowStart);
    multi.zadd(key, now, `${now}-${Math.random()}`);
    multi.zcard(key);
    multi.expire(key, Math.ceil(this.config.windowMs / 1000));

    const results = await multi.exec();
    
    const current = results?.[2]?.[1] as number || 0;
    const remaining = Math.max(0, this.config.maxRequests - current);
    const resetTime = now + this.config.windowMs;

    return {
      limit: this.config.maxRequests,
      current,
      remaining,
      resetTime,
    };
  }

  private getKey(req: Request): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(req);
    }

    const userId = (req as any).user?.id;
    const ip = req.ip || req.socket.remoteAddress;
    
    return `ratelimit:${userId || ip}`;
  }

  async getRemainingRequests(key: string): Promise<number> {
    const info = await this.checkLimit(key);
    return info.remaining;
  }

  async resetLimit(key: string): Promise<void> {
    await this.redis.del(key);
  }
}

export const createRateLimiter = (redis: Redis, config: RateLimitConfig) => {
  return new AdvancedRateLimiter(redis, config);
};

export const createMultiTierRateLimiter = (redis: Redis) => {
  return {
    perSecond: createRateLimiter(redis, {
      windowMs: 1000,
      maxRequests: 10,
      keyGenerator: (req) => `ratelimit:second:${(req as any).user?.id || req.ip}`,
    }),
    
    perMinute: createRateLimiter(redis, {
      windowMs: 60000,
      maxRequests: 100,
      keyGenerator: (req) => `ratelimit:minute:${(req as any).user?.id || req.ip}`,
    }),
    
    perHour: createRateLimiter(redis, {
      windowMs: 3600000,
      maxRequests: 1000,
      keyGenerator: (req) => `ratelimit:hour:${(req as any).user?.id || req.ip}`,
    }),
    
    mutations: createRateLimiter(redis, {
      windowMs: 60000,
      maxRequests: 20,
      keyGenerator: (req) => `ratelimit:mutations:${(req as any).user?.id || req.ip}`,
    }),
    
    payments: createRateLimiter(redis, {
      windowMs: 60000,
      maxRequests: 5,
      keyGenerator: (req) => `ratelimit:payments:${(req as any).user?.id || req.ip}`,
    }),
    
    auth: createRateLimiter(redis, {
      windowMs: 900000, // 15 minutes
      maxRequests: 5,
      keyGenerator: (req) => `ratelimit:auth:${req.ip}`,
      handler: (req, res) => {
        res.status(429).json({
          error: 'Too many authentication attempts',
          message: 'Please try again in 15 minutes',
        });
      },
    }),
  };
};

export default AdvancedRateLimiter;
