/**
 * Rate Limiter - Prevents API abuse and spam
 * Implements token bucket algorithm for efficient rate limiting
 */

import { validateRateLimitData } from './validation';

/**
 * Token Bucket Rate Limiter (for tests)
 * Implements token bucket algorithm with refill rate
 */
export class TokenBucketRateLimiter {
  private capacity: number;
  private refillRate: number; // tokens per second
  private windowMs: number;
  private keyPrefix: string;
  private buckets: Map<string, { tokens: number; lastRefill: number; lastAccess: number }>; // Made public for tests

  constructor(config: { capacity: number; refillRate: number; windowMs: number; keyPrefix: string }) {
    // Validation
    if (config.capacity <= 0) {
      throw new Error('capacity must be positive');
    }
    if (config.refillRate <= 0) {
      throw new Error('refillRate must be positive');
    }
    if (config.windowMs <= 0) {
      throw new Error('windowMs must be positive');
    }

    this.capacity = config.capacity;
    this.refillRate = config.refillRate;
    this.windowMs = config.windowMs;
    this.keyPrefix = config.keyPrefix;
    this.buckets = new Map();
  }

  private refillTokens(key: string): void {
    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (!bucket) {
      this.buckets.set(key, { tokens: this.capacity, lastRefill: now, lastAccess: now });
      return;
    }

    const timePassed = (now - bucket.lastRefill) / 1000; // seconds
    const tokensToAdd = timePassed * this.refillRate;

    bucket.tokens = Math.min(this.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
    bucket.lastAccess = now;
  }

  async check(key: string): Promise<{ allowed: boolean; remaining: number; resetTime: number; retryAfter?: number }> {
    const fullKey = `${this.keyPrefix}:${key}`;
    this.refillTokens(fullKey);

    const bucket = this.buckets.get(fullKey)!;
    const now = Date.now();

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      const resetTime = now + this.windowMs;
      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        resetTime
      };
    }

    // Calculate retryAfter based on refill rate
    const timeToNextToken = 1 / this.refillRate; // seconds
    const retryAfter = Math.ceil(timeToNextToken);
    const resetTime = now + this.windowMs;

    return {
      allowed: false,
      remaining: 0,
      resetTime,
      retryAfter
    };
  }

  async consume(key: string, tokens = 1): Promise<boolean> {
    const fullKey = `${this.keyPrefix}:${key}`;
    this.refillTokens(fullKey);

    const bucket = this.buckets.get(fullKey)!;

    if (bucket.tokens >= tokens) {
      bucket.tokens -= tokens;
      return true;
    }

    return false;
  }

  async peek(key: string): Promise<number> {
    const fullKey = `${this.keyPrefix}:${key}`;
    this.refillTokens(fullKey);

    const bucket = this.buckets.get(fullKey);
    return bucket ? Math.floor(bucket.tokens) : this.capacity;
  }

  async reset(key: string): Promise<void> {
    const fullKey = `${this.keyPrefix}:${key}`;
    this.buckets.delete(fullKey);
  }

  getBucket(key: string): { tokens: number; lastRefill: number } | undefined {
    const fullKey = `${this.keyPrefix}:${key}`;
    const bucket = this.buckets.get(fullKey);
    if (bucket) {
      return { tokens: bucket.tokens, lastRefill: bucket.lastRefill };
    }
    return undefined;
  }

  // Cleanup old entries (called by tests)
  cleanup(): void {
    const now = Date.now();
    const gracePeriod = this.windowMs * 2; // Keep for 2x window duration

    for (const [key, data] of this.buckets.entries()) {
      if (now - data.lastAccess > gracePeriod) {
        this.buckets.delete(key);
      }
    }
  }
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDuration?: number; // How long to block after limit exceeded
  store?: RateLimitStore;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

interface RateLimitStore {
  get: (key: string) => Promise<RateLimitData | null>;
  set: (key: string, data: RateLimitData, ttl: number) => Promise<void>;
  delete: (key: string) => Promise<void>;
}

interface RateLimitData {
  count: number;
  firstRequest: number;
  lastRequest: number;
  blockedUntil?: number;
}

/**
 * In-memory rate limit store (default)
 */
class InMemoryStore implements RateLimitStore {
  private store = new Map<string, RateLimitData>();

  async get(key: string): Promise<RateLimitData | null> {
    return this.store.get(key) || null;
  }

  async set(key: string, data: RateLimitData, ttl: number): Promise<void> {
    this.store.set(key, data);

    // Auto cleanup after TTL
    setTimeout(() => {
      if (this.store.has(key)) {
        this.store.delete(key);
      }
    }, ttl);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  // Cleanup old entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.store.entries()) {
      if (data.blockedUntil && data.blockedUntil < now) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Rate Limiter Class
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private store: RateLimitStore;

  constructor(config: RateLimitConfig) {
    this.config = {
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      blockDuration: config.blockDuration || 0,
      store: config.store || new InMemoryStore(),
    };
    this.store = this.config.store;

    // Cleanup memory store periodically
    if (this.store instanceof InMemoryStore) {
      setInterval(() => this.store.cleanup(), 60000); // Every minute
    }
  }

  /**
   * Check if request is allowed
   */
  async check(userId: string): Promise<RateLimitResult> {
    // Validate input
    const validation = validateRateLimitData(userId, Date.now());
    if (!validation.valid) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now(),
        retryAfter: 0,
      };
    }

    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get current data
    let data = await this.store.get(userId);

    // Check if user is blocked
    if (data?.blockedUntil && data.blockedUntil > now) {
      const retryAfter = Math.ceil((data.blockedUntil - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetTime: data.blockedUntil,
        retryAfter,
      };
    }

    // If no data or window has passed, reset
    if (!data || data.firstRequest < windowStart) {
      data = {
        count: 1,
        firstRequest: now,
        lastRequest: now,
      };
      await this.store.set(userId, data, this.config.windowMs);
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
      };
    }

    // Increment count
    data.count++;
    data.lastRequest = now;

    // Check if limit exceeded
    if (data.count > this.config.maxRequests) {
      // Block user
      if (this.config.blockDuration > 0) {
        data.blockedUntil = now + this.config.blockDuration;
        await this.store.set(userId, data, this.config.blockDuration);
      } else {
        await this.store.set(userId, data, this.config.windowMs);
      }

      const resetTime = data.blockedUntil || (now + this.config.windowMs);
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil((resetTime - now) / 1000),
      };
    }

    // Update store
    await this.store.set(userId, data, this.config.windowMs);

    return {
      allowed: true,
      remaining: this.config.maxRequests - data.count,
      resetTime: now + this.config.windowMs,
    };
  }

  /**
   * Reset rate limit for a user
   */
  async reset(userId: string): Promise<void> {
    await this.store.delete(userId);
  }

  /**
   * Get rate limit info without modifying counter
   */
  async peek(userId: string): Promise<Omit<RateLimitResult, 'allowed'> | null> {
    const now = Date.now();
    const data = await this.store.get(userId);

    if (!data) return null;

    const windowStart = now - this.config.windowMs;

    if (data.firstRequest < windowStart) {
      return {
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs,
      };
    }

    const remaining = Math.max(0, this.config.maxRequests - data.count);
    const resetTime = data.firstRequest + this.config.windowMs;

    return {
      remaining,
      resetTime,
      retryAfter: data.blockedUntil && data.blockedUntil > now ? Math.ceil((data.blockedUntil - now) / 1000) : undefined,
    };
  }
}

/**
 * Pre-configured rate limiters for different use cases
 */

// API endpoint rate limiter (moderate) - 100 requests per minute
export const apiRateLimiter = new TokenBucketRateLimiter({
  capacity: 100,
  refillRate: 1.6667, // 100 requests per minute = 1.66/sec
  windowMs: 60000,
  keyPrefix: 'api'
});

// OCR processing rate limiter (costly operations) - 10 requests per minute
export const ocrRateLimiter = new TokenBucketRateLimiter({
  capacity: 10,
  refillRate: 0.1667, // 10 requests per minute = 0.166/sec
  windowMs: 60000,
  keyPrefix: 'ocr'
});

// Authentication rate limiter (very strict) - 5 requests per minute
export const authRateLimiter = new TokenBucketRateLimiter({
  capacity: 5,
  refillRate: 0.0833, // 5 requests per minute = 0.083/sec
  windowMs: 60000,
  keyPrefix: 'auth'
});

// Export rate limiter (expensive operations) - 5 requests per 5 minutes
export const exportRateLimiter = new TokenBucketRateLimiter({
  capacity: 5,
  refillRate: 0.0167, // 5 requests per 300 seconds = 0.0167/sec
  windowMs: 300000,
  keyPrefix: 'export'
});

// File upload rate limiter (strict) - 10 requests per minute
export const uploadRateLimiter = new TokenBucketRateLimiter({
  capacity: 10,
  refillRate: 0.1667, // 10 requests per minute = 0.166/sec
  windowMs: 60000,
  keyPrefix: 'upload'
});

/**
 * Middleware-style rate limiting for Express/Fastify
 */
export function createRateLimitMiddleware(limiter: TokenBucketRateLimiter, keyFn: (req: any) => string) {
  return async (req: any, res: any, next: () => void) => {
    const key = keyFn(req);
    const result = await limiter.check(key);

    // Set headers
    res.setHeader('X-RateLimit-Limit', '0');
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', result.resetTime.toString());

    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfter?.toString() || '60');
      res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Retry after ${result.retryAfter || 60} seconds.`,
        retryAfter: result.retryAfter,
      });
      return;
    }

    next();
  };
}

/**
 * Check rate limit for client-side operations
 */
export async function checkClientRateLimit(
  operation: string,
  userId: string
): Promise<{ allowed: boolean; message?: string }> {
  const limiter = getLimiterForOperation(operation);

  if (!limiter) {
    return { allowed: true };
  }

  const result = await limiter.check(`${userId}:${operation}`);

  if (!result.allowed) {
    const waitTime = result.retryAfter || 60;
    return {
      allowed: false,
      message: `Rate limit exceeded. Please wait ${waitTime} seconds before retrying.`,
    };
  }

  return { allowed: true };
}

/**
 * Get appropriate limiter for operation type
 */
function getLimiterForOperation(operation: string): TokenBucketRateLimiter | null {
  switch (operation) {
    case 'upload':
    case 'file-upload':
    case 'batch-upload':
      return uploadRateLimiter;

    case 'ocr':
    case 'process-document':
    case 'analyze':
      return ocrRateLimiter;

    case 'export':
    case 'download':
    case 'generate-report':
      return exportRateLimiter;

    case 'login':
    case 'auth':
    case 'signup':
      return authRateLimiter;

    case 'api-call':
    case 'query':
    case 'search':
      return apiRateLimiter;

    default:
      return apiRateLimiter;
  }
}

/**
 * Export rate limit stats for monitoring
 */
export async function getRateLimitStats(userId: string): Promise<Record<string, any>> {
  const operations = ['upload', 'ocr', 'export', 'auth', 'api-call'];
  const stats: Record<string, any> = {};

  for (const op of operations) {
    const limiter = getLimiterForOperation(op);
    if (limiter) {
      const peek = await limiter.peek(`${userId}:${op}`);
      stats[op] = peek || { available: true };
    }
  }

  return stats;
}

/**
 * Reset all rate limits for a user (useful for admin actions)
 */
export async function resetAllRateLimits(userId: string): Promise<void> {
  const operations = ['upload', 'ocr', 'export', 'auth', 'api-call'];
  await Promise.all(
    operations.map(async (op) => {
      const limiter = getLimiterForOperation(op);
      if (limiter) {
        await limiter.reset(`${userId}:${op}`);
      }
    })
  );
}
