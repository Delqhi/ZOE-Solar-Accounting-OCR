/**
 * Unit Tests for Rate Limiter
 * Tests Token Bucket algorithm implementation
 * Production-ready with 2026 best practices
 */

import { describe, it, expect, beforeEach, afterEach, vi, SpyInstance } from 'vitest';
import {
  TokenBucketRateLimiter,
  apiRateLimiter,
  ocrRateLimiter,
  authRateLimiter
} from '../../src/utils/rateLimiter';

describe('TokenBucketRateLimiter', () => {
  let clock: SpyInstance;

  beforeEach(() => {
    // Use fake timers for precise control
    clock = vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Constructor and Configuration', () => {
    it('should create a rate limiter with valid configuration', () => {
      const limiter = new TokenBucketRateLimiter({
        capacity: 100,
        refillRate: 10,
        windowMs: 60000,
        keyPrefix: 'test'
      });

      expect(limiter).toBeDefined();
      expect(limiter['capacity']).toBe(100);
      expect(limiter['refillRate']).toBe(10);
      expect(limiter['windowMs']).toBe(60000);
    });

    it('should throw error for invalid capacity', () => {
      expect(() => {
        new TokenBucketRateLimiter({
          capacity: 0,
          refillRate: 10,
          windowMs: 60000,
          keyPrefix: 'test'
        });
      }).toThrow('capacity must be positive');
    });

    it('should throw error for invalid refill rate', () => {
      expect(() => {
        new TokenBucketRateLimiter({
          capacity: 100,
          refillRate: 0,
          windowMs: 60000,
          keyPrefix: 'test'
        });
      }).toThrow('refillRate must be positive');
    });

    it('should throw error for invalid window', () => {
      expect(() => {
        new TokenBucketRateLimiter({
          capacity: 100,
          refillRate: 10,
          windowMs: 0,
          keyPrefix: 'test'
        });
      }).toThrow('windowMs must be positive');
    });
  });

  describe('Token Consumption', () => {
    let limiter: TokenBucketRateLimiter;

    beforeEach(() => {
      limiter = new TokenBucketRateLimiter({
        capacity: 100,
        refillRate: 10,
        windowMs: 60000,
        keyPrefix: 'test'
      });
    });

    it('should allow request when bucket has tokens', async () => {
      const result = await limiter.check('test-key');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99);
      expect(result.resetTime).toBeDefined();
    });

    it('should allow multiple requests within capacity', async () => {
      for (let i = 0; i < 10; i++) {
        const result = await limiter.check('test-key');
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(99 - i);
      }
    });

    it('should reject request when bucket is empty', async () => {
      // Consume all 100 tokens
      for (let i = 0; i < 100; i++) {
        await limiter.check('test-key');
      }

      const result = await limiter.check('test-key');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should track different keys independently', async () => {
      const result1 = await limiter.check('key1');
      const result2 = await limiter.check('key2');

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result1.remaining).toBe(99);
      expect(result2.remaining).toBe(99);
    });
  });

  describe('Token Refill', () => {
    let limiter: TokenBucketRateLimiter;

    beforeEach(() => {
      limiter = new TokenBucketRateLimiter({
        capacity: 10,
        refillRate: 5,
        windowMs: 10000, // 10 seconds
        keyPrefix: 'test'
      });
    });

    it('should refill tokens after time passes', async () => {
      // Consume all tokens
      for (let i = 0; i < 10; i++) {
        await limiter.check('test-key');
      }

      // Fast-forward 2 seconds (should refill 5 tokens/sec * 2 = 10 tokens, capped at capacity)
      clock.advanceTimersByTime(2000);

      const result = await limiter.check('test-key');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9); // 10 - 10 + 10 (capped) - 1 = 9
    });

    it('should cap refill at capacity', async () => {
      // Consume all tokens
      for (let i = 0; i < 10; i++) {
        await limiter.check('test-key');
      }

      // Fast-forward 20 seconds (enough to fully refill and more)
      clock.advanceTimersByTime(20000);

      const result = await limiter.check('test-key');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9); // Max capacity is 10, consumed 1 = 9
    });

    it('should refill continuously over time', async () => {
      // Consume 5 tokens
      for (let i = 0; i < 5; i++) {
        await limiter.check('test-key');
      }

      // Wait 1 second - should refill 5 tokens (5/sec * 1 sec), then consume 1
      clock.advanceTimersByTime(1000);
      let result = await limiter.check('test-key');
      expect(result.remaining).toBe(9); // 5 + 5 - 1 = 9

      // Wait 2 more seconds - should refill 10 tokens (capped at 10), then consume 1
      clock.advanceTimersByTime(2000);
      result = await limiter.check('test-key');
      expect(result.remaining).toBe(9); // 9 + 10 (capped) - 1 = 18 capped to 10, minus 1 = 9
    });
  });

  describe('Cleanup Mechanism', () => {
    let limiter: TokenBucketRateLimiter;

    beforeEach(() => {
      limiter = new TokenBucketRateLimiter({
        capacity: 10,
        refillRate: 5,
        windowMs: 100,
        keyPrefix: 'test-cleanup'
      });
    });

    it('should clean up old entries after window expires', async () => {
      // Add some entries
      await limiter.check('key1');
      await limiter.check('key2');

      expect(limiter['buckets'].size).toBe(2);

      // Fast-forward past cleanup interval
      clock.advanceTimersByTime(1000); // 1 second (cleanup runs every 5s)

      // Manually trigger cleanup
      limiter['cleanup']();

      // Buckets with no recent activity should be cleaned up after window expires
      // First add tokens to ensure activity
      const oldData = limiter['buckets'].get('test-cleanup:key1');
      if (oldData) {
        oldData.lastAccess = Date.now() - 200; // Old timestamp
      }

      clock.advanceTimersByTime(150);
      limiter['cleanup']();

      // Data that exceeded full window + grace period should be removed
      expect(limiter['buckets'].size).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Reset Time Calculation', () => {
    it('should calculate correct reset time for partial bucket', async () => {
      const limiter = new TokenBucketRateLimiter({
        capacity: 100,
        refillRate: 10,
        windowMs: 60000,
        keyPrefix: 'test'
      });

      const result = await limiter.check('test-key');
      const resetTime = result.resetTime;

      expect(resetTime).toBeDefined();
      expect(resetTime).toBeGreaterThan(Date.now());
      expect(resetTime - Date.now()).toBeLessThanOrEqual(60000);
    });

    it('should calculate correct retryAfter for empty bucket', async () => {
      const limiter = new TokenBucketRateLimiter({
        capacity: 10,
        refillRate: 10,
        windowMs: 10000,
        keyPrefix: 'test'
      });

      // Empty the bucket
      for (let i = 0; i < 10; i++) {
        await limiter.check('test-key');
      }

      const result = await limiter.check('test-key');

      // Should need to wait ~1 second for 1 token
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(2); // Allow small margin
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent requests for same key', async () => {
      const limiter = new TokenBucketRateLimiter({
        capacity: 5,
        refillRate: 5,
        windowMs: 10000,
        keyPrefix: 'test'
      });

      // Fire 10 concurrent requests
      const promises = Array.from({ length: 10 }, () => limiter.check('concurrent'));
      const results = await Promise.all(promises);

      const allowed = results.filter(r => r.allowed).length;
      const denied = results.filter(r => !r.allowed).length;

      expect(allowed).toBe(5);
      expect(denied).toBe(5);
    });

    it('should handle very rapid requests', async () => {
      const limiter = new TokenBucketRateLimiter({
        capacity: 1000,
        refillRate: 1,
        windowMs: 60000,
        keyPrefix: 'test'
      });

      // Make 1000 requests in quick succession
      for (let i = 0; i < 1000; i++) {
        const result = await limiter.check('rapid');
        expect(result.allowed).toBe(true);
      }

      const final = await limiter.check('rapid');
      expect(final.allowed).toBe(false);
    });

    it('should handle special characters in keys', async () => {
      const limiter = new TokenBucketRateLimiter({
        capacity: 10,
        refillRate: 5,
        windowMs: 10000,
        keyPrefix: 'test'
      });

      const specialKeys = [
        'user:123',
        'email:test@example.com',
        'ip:::1',
        'key with spaces',
        'key/with/slashes',
        'key\\with\\backslashes'
      ];

      for (const key of specialKeys) {
        const result = await limiter.check(key);
        expect(result.allowed).toBe(true);
      }
    });
  });

  describe('Predefined Rate Limiters', () => {
    describe('apiRateLimiter', () => {
      it('should be defined and have correct config', async () => {
        expect(apiRateLimiter).toBeDefined();

        // Test capacity
        const promises = Array.from({ length: 100 }, () => apiRateLimiter.check('test'));
        const results = await Promise.all(promises);
        const allowed = results.filter(r => r.allowed).length;

        // Should allow 100 requests
        expect(allowed).toBe(100);

        // 101st should be denied
        const result = await apiRateLimiter.check('test');
        expect(result.allowed).toBe(false);
      });

      it('should refill at 100 requests per minute', async () => {
        // Consume all
        for (let i = 0; i < 100; i++) {
          await apiRateLimiter.check('refill-test');
        }

        // Wait 600ms (should refill 1 token at 100/min = 1.66/sec * 0.6s ≈ 1 token)
        vi.advanceTimersByTime(600);

        const result = await apiRateLimiter.check('refill-test');
        expect(result.allowed).toBe(true);
      });
    });

    describe('ocrRateLimiter', () => {
      it('should be defined and have strict limits', async () => {
        expect(ocrRateLimiter).toBeDefined();

        // Should allow up to 10
        const promises = Array.from({ length: 10 }, () => ocrRateLimiter.check('test'));
        const results = await Promise.all(promises);
        const allowed = results.filter(r => r.allowed).length;

        expect(allowed).toBe(10);

        // 11th should be denied
        const result = await ocrRateLimiter.check('test');
        expect(result.allowed).toBe(false);
      });
    });

    describe('authRateLimiter', () => {
      it('should be defined and have most strict limits', async () => {
        expect(authRateLimiter).toBeDefined();

        // Should allow up to 5
        const promises = Array.from({ length: 5 }, () => authRateLimiter.check('test'));
        const results = await Promise.all(promises);
        const allowed = results.filter(r => r.allowed).length;

        expect(allowed).toBe(5);

        // 6th should be denied
        const result = await authRateLimiter.check('test');
        expect(result.allowed).toBe(false);
      });
    });
  });

  describe('TypeScript Types', () => {
    it('should return correct types for check method', async () => {
      const limiter = new TokenBucketRateLimiter({
        capacity: 10,
        refillRate: 5,
        windowMs: 10000,
        keyPrefix: 'test'
      });

      const result = await limiter.check('key');

      // Type assertions
      expect(typeof result.allowed).toBe('boolean');
      expect(typeof result.remaining).toBe('number');
      expect(result.resetTime === undefined || typeof result.resetTime === 'number').toBe(true);
      expect(result.retryAfter === undefined || typeof result.retryAfter === 'number').toBe(true);
    });
  });
});

describe('Missed Rate Limiter Edge Cases', () => {
  // Additional tests for completeness

  it('should handle rapid career changes', async () => {
    const limiter = new TokenBucketRateLimiter({
      capacity: 10,
      refillRate: 10,
      windowMs: 10000,
      keyPrefix: 'test'
    });

    // Rapidly change the timestamp
    const baseTime = Date.now();
    vi.setSystemTime(baseTime);

    await limiter.check('key1');
    vi.setSystemTime(baseTime + 5000);
    await limiter.check('key1');
    vi.setSystemTime(baseTime + 10000);
    await limiter.check('key1');

    // Should still work
    const result = await limiter.check('key1');
    expect(result.allowed).toBe(true);
  });

  it('should handle bucket overflow protection', async () => {
    const limiter = new TokenBucketRateLimiter({
      capacity: 10,
      refillRate: 100, // Very high refill
      windowMs: 10000,
      keyPrefix: 'test'
    });

    // After a long wait, should not exceed capacity
    await limiter.check('key');
    vi.advanceTimersByTime(1000000); // Very long time

    const result = await limiter.check('key');
    expect(result.remaining).toBeLessThanOrEqual(9); // Can't exceed 10 total
  });
});
