/**
 * Rate Limiter Service
 * Prevents API abuse and rate limit violations
 */
class RateLimiter {
  private calls: Map<string, number[]> = new Map();
  private readonly limit: number;
  private readonly window: number;

  constructor(limit: number = 10, windowMs: number = 60000) {
    this.limit = limit; // Max calls per window
    this.window = windowMs; // Time window in ms (default: 1 minute)
  }

  /**
   * Check if a call is allowed
   * @param key - Unique identifier (e.g., 'ocr', 'export', 'api-call')
   * @returns Promise<boolean> - true if allowed, false if rate limited
   */
  async check(key: string): Promise<boolean> {
    const now = Date.now();
    const timestamps = this.calls.get(key) || [];

    // Remove old entries outside the window
    const valid = timestamps.filter(t => now - t < this.window);

    if (valid.length >= this.limit) {
      // eslint-disable-next-line no-console
      console.warn(`⚠️ Rate limit exceeded for key: ${key}`);
      return false;
    }

    valid.push(now);
    this.calls.set(key, valid);
    return true;
  }

  /**
   * Wait for rate limit to reset (if needed)
   * @param key - Unique identifier
   * @returns Promise<void>
   */
  async waitForAvailable(key: string): Promise<void> {
    const now = Date.now();
    const timestamps = this.calls.get(key) || [];
    const oldest = timestamps[0];

    if (oldest && now - oldest < this.window && timestamps.length >= this.limit) {
      const waitTime = this.window - (now - oldest);
      // eslint-disable-next-line no-console
      console.log(`⏳ Waiting ${waitTime}ms for rate limit on ${key}`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      // Clean up old entries
      this.calls.set(key, []);
    }
  }

  /**
   * Get current rate limit status
   * @param key - Unique identifier
   * @returns Object with remaining calls and reset time
   */
  getStatus(key: string): { remaining: number; resetIn: number; limited: boolean } {
    const now = Date.now();
    const timestamps = this.calls.get(key) || [];
    const valid = timestamps.filter(t => now - t < this.window);

    return {
      remaining: this.limit - valid.length,
      resetIn: valid.length > 0 ? this.window - (now - valid[0]) : 0,
      limited: valid.length >= this.limit,
    };
  }

  /**
   * Clear all rate limit data (for testing/logout)
   */
  clear(): void {
    this.calls.clear();
  }

  /**
   * Clear specific key
   */
  clearKey(key: string): void {
    this.calls.delete(key);
  }

  /**
   * Set custom limits for specific keys
   */
  setCustomLimit(_key: string, _limit: number, _windowMs: number): void {
    // Store in metadata map if needed
    // For simplicity, we keep single config but allow override via instance
  }
}

/**
 * Pre-configured rate limiters for different operations
 */
export const ocrRateLimiter = new RateLimiter(5, 60000); // 5 OCR calls per minute
export const exportRateLimiter = new RateLimiter(10, 60000); // 10 exports per minute
export const apiRateLimiter = new RateLimiter(20, 60000); // 20 API calls per minute

/**
 * Middleware function for API calls
 * Usage: await rateLimitWrapper('ocr', async () => { await callOCR(); });
 */
export async function rateLimitWrapper<T>(
  key: string,
  operation: () => Promise<T>,
  limiter: RateLimiter = apiRateLimiter
): Promise<T> {
  const allowed = await limiter.check(key);

  if (!allowed) {
    const status = limiter.getStatus(key);
    throw new Error(
      `Rate limit exceeded. Please wait ${Math.ceil(status.resetIn / 1000)}s before retrying.`
    );
  }

  try {
    const result = await operation();
    return result;
  } catch (error) {
    // Remove failed call from rate limit
    limiter.clearKey(key);
    throw error;
  }
}

/**
 * Decorator for rate limiting class methods
 */
export function rateLimit(key: string, limiter: RateLimiter = apiRateLimiter) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const allowed = await limiter.check(key);

      if (!allowed) {
        const status = limiter.getStatus(key);
        throw new Error(`Rate limit for ${key} exceeded. Wait ${Math.ceil(status.resetIn / 1000)}s`);
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Usage Examples:
 *
 * // Basic usage
 * if (!(await ocrRateLimiter.check('ocr'))) {
 *   toast.error('Too many OCR requests, please wait...');
 *   return;
 * }
 *
 * // With wrapper
 * try {
 *   const result = await rateLimitWrapper('export', async () => {
 *     return await generateElsterExport();
 *   }, exportRateLimiter);
 * } catch (error) {
 *   toast.error(error.message);
 * }
 *
 * // With decorator (in service class)
 * class ExportService {
 *   @rateLimit('export', exportRateLimiter)
 *   async generateExport() { ... }
 * }
 */
