import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  ocrRateLimiter,
  exportRateLimiter,
  apiRateLimiter,
  rateLimitWrapper,
} from '../rateLimiter';

describe('rateLimiter.ts', () => {
  describe('pre-configured limiters', () => {
    it('should have correct OCR limit (5 per minute)', () => {
      const status = ocrRateLimiter.getStatus('test');
      expect(status.remaining).toBe(5);
      expect(status.limited).toBe(false);
    });

    it('should have correct export limit (10 per minute)', () => {
      const status = exportRateLimiter.getStatus('test');
      expect(status.remaining).toBe(10);
      expect(status.limited).toBe(false);
    });

    it('should have correct API limit (20 per minute)', () => {
      const status = apiRateLimiter.getStatus('test');
      expect(status.remaining).toBe(20);
      expect(status.limited).toBe(false);
    });

    it('should track separate keys independently', async () => {
      const limiter = ocrRateLimiter;

      limiter.clearKey('key1');
      limiter.clearKey('key2');

      await limiter.check('key1');
      await limiter.check('key1');

      const status1 = limiter.getStatus('key1');
      const status2 = limiter.getStatus('key2');

      expect(status1.remaining).toBe(3);
      expect(status2.remaining).toBe(5);
    });

    it('should show limited when at capacity', async () => {
      const limiter = ocrRateLimiter;

      for (let i = 0; i < 5; i++) {
        await limiter.check('limit-test');
      }

      const status = limiter.getStatus('limit-test');
      expect(status.limited).toBe(true);
      expect(status.remaining).toBe(0);
    });

    it('should clear specific keys', () => {
      const limiter = ocrRateLimiter;

      limiter.clearKey('clear-me');

      const status = limiter.getStatus('clear-me');
      expect(status.remaining).toBe(5);
    });

    it('should clear all keys', () => {
      const limiter = ocrRateLimiter;

      limiter.clear();

      const status1 = limiter.getStatus('key1');
      const status2 = limiter.getStatus('key2');

      expect(status1.remaining).toBe(5);
      expect(status2.remaining).toBe(5);
    });
  });

  describe('rateLimitWrapper()', () => {
    beforeEach(() => {
      ocrRateLimiter.clear();
    });

    it('should execute operation when under limit', async () => {
      const operation = vi.fn().mockResolvedValue('result');

      const result = await rateLimitWrapper('wrapper-test', operation, ocrRateLimiter);

      expect(result).toBe('result');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should throw when over limit', async () => {
      const operation = vi.fn();

      for (let i = 0; i < 5; i++) {
        await ocrRateLimiter.check('limit-wrapper');
      }

      await expect(rateLimitWrapper('limit-wrapper', operation, ocrRateLimiter)).rejects.toThrow(
        'Rate limit exceeded'
      );
    });

    it('should include wait time in error message', async () => {
      for (let i = 0; i < 5; i++) {
        await ocrRateLimiter.check('error-msg');
      }

      try {
        await rateLimitWrapper('error-msg', async () => {}, ocrRateLimiter);
      } catch (error: any) {
        expect(error.message).toContain('Rate limit exceeded');
        expect(error.message).toContain('wait');
        expect(error.message).toContain('s');
      }
    });

    it('should clear key on operation error', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('fail'));
      ocrRateLimiter.clearKey('error-clear');

      await rateLimitWrapper('error-clear', operation, ocrRateLimiter).catch(() => {});

      const status = ocrRateLimiter.getStatus('error-clear');
      expect(status.remaining).toBe(5);
    });

    it('should use default apiRateLimiter when not specified', async () => {
      apiRateLimiter.clear();
      const operation = vi.fn().mockResolvedValue('result');

      const result = await rateLimitWrapper('default-test', operation);

      expect(result).toBe('result');
    });
  });
});
