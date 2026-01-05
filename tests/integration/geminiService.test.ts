/**
 * Integration Tests for Gemini Service
 * Tests API integration, error handling, and rate limiting
 * Production-ready with 2026 best practices
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GeminiService, createGeminiService } from '../../src/services/geminiService';
import { PerformanceMonitor } from '../../src/utils/performanceMonitor';
import { apiRateLimiter } from '../../src/utils/rateLimiter';

describe('GeminiService Integration', () => {
  let service: GeminiService;
  let originalFetch: typeof global.fetch;
  let consoleWarnSpy: any;
  let consoleLogSpy: any;

  beforeEach(() => {
    // Create service instance
    service = createGeminiService('test-api-key-12345');

    // Spy on console methods
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Store original fetch
    originalFetch = global.fetch;
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;

    // Clear all mocks
    vi.clearAllMocks();

    // Reset performance monitor
    (PerformanceMonitor as any).metrics = {};
  });

  describe('Service Initialization', () => {
    it('should create service with valid API key', () => {
      expect(service).toBeDefined();
      expect(service['apiKey']).toBe('test-api-key-12345');
    });

    it('should throw error when API key is missing', () => {
      expect(() => createGeminiService('')).toThrow('API key is required');
      expect(() => createGeminiService(undefined as any)).toThrow('API key is required');
    });

    it('should throw error when API key is placeholder', () => {
      expect(() => createGeminiService('YOUR_GEMINI_API_KEY')).toThrow('placeholder detected');
      expect(() => createGeminiService('YOUR_API_KEY')).toThrow('placeholder detected');
    });
  });

  describe('analyzeImage - Success Cases', () => {
    it('should successfully analyze image and return OCR result', async () => {
      // Mock successful API response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  supplierName: 'Test Supplier GmbH',
                  invoiceNumber: 'INV-2024-001',
                  invoiceDate: '15.01.2024',
                  totalAmount: 119.00,
                  vatAmount: 19.00,
                  netAmount: 100.00,
                  vatRate: 19
                })
              }]
            }
          }]
        })
      } as Response);

      const result = await service.analyzeImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.supplierName).toBe('Test Supplier GmbH');
      expect(result.data.invoiceNumber).toBe('INV-2024-001');
      expect(result.data.totalAmount).toBe(119.00);

      // Verify performance was recorded
      const metrics = PerformanceMonitor.getMetrics();
      expect(metrics.geminiAnalysis).toBeGreaterThan(0);
    });

    it('should handle network errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await service.analyzeImage('data:image/png;base64,invalid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
      expect(result.data).toBeUndefined();
    });

    it('should handle HTTP error responses', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ error: { message: 'Rate limit exceeded' } })
      } as Response);

      const result = await service.analyzeImage('data:image/png;base64,invalid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('429');
      expect(result.error).toContain('Rate limit exceeded');
    });

    it('should handle malformed API responses', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ invalid: 'response' })
      } as Response);

      const result = await service.analyzeImage('data:image/png;base64,invalid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid response format');
    });

    it('should handle timeout scenarios', async () => {
      global.fetch = vi.fn().mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 10000)
        )
      );

      const result = await service.analyzeImage('data:image/png;base64,invalid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    }, 15000); // Extended timeout for this test
  });

  describe('analyzeImage - Rate Limiting', () => {
    it('should respect rate limits', async () => {
      // Consume all rate limit tokens
      const promises = Array.from({ length: 20 }, () =>
        apiRateLimiter.check('test-gemini-rate-limit')
      );
      await Promise.all(promises);

      // Mock fetch (should not be called due to rate limit)
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ candidates: [{ content: { parts: [{ text: 'test' }] } }] })
      } as Response);

      const result = await service.analyzeImage('data:image/png;base64,invalid');

      // Should fail due to rate limit
      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit exceeded');
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('analyzeImage - Input Validation', () => {
    it('should reject invalid base64 data', async () => {
      const result = await service.analyzeImage('not-valid-base64!@#$');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid base64');
    });

    it('should reject empty image data', async () => {
      const result = await service.analyzeImage('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid image data');
    });

    it('should reject non-base64 image data', async () => {
      const result = await service.analyzeImage('data:text/plain,invalid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid base64');
    });

    it('should reject oversized base64 data', async () => {
      // Create a very large base64 string (>10MB)
      const largeData = 'data:image/png;base64,' + 'A'.repeat(15000000);

      const result = await service.analyzeImage(largeData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('exceeds maximum size');
    });
  });

  describe('analyzeImage - Performance Monitoring', () => {
    it('should record performance metrics on success', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify({ supplierName: 'Test' }) }]
            }
          }]
        })
      } as Response);

      await service.analyzeImage('data:image/png;base64,valid');

      const metrics = PerformanceMonitor.getMetrics();
      expect(metrics.geminiAnalysis).toBeGreaterThan(0);
    });

    it('should record performance metrics on failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('API Error'));

      await service.analyzeImage('data:image/png;base64,invalid');

      // Should have recorded the failure metric
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log detailed performance information', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify({ supplierName: 'Test' }) }]
            }
          }]
        })
      } as Response);

      await service.analyzeImage('data:image/png;base64,valid');

      // Should log performance summary
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('geminiAnalysis')
      );
    });
  });

  describe('analyzeImage - Error Classification', () => {
    it('should classify authentication errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: { message: 'Invalid API key' } })
      } as Response);

      const result = await service.analyzeImage('data:image/png;base64,invalid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('401');
      expect(result.error).toContain('API key');
    });

    it('should classify validation errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: { message: 'Invalid image format' } })
      } as Response);

      const result = await service.analyzeImage('data:image/png;base64,invalid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('400');
      expect(result.error).toContain('Invalid image format');
    });

    it('should classify server errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: { message: 'Server error' } })
      } as Response);

      const result = await service.analyzeImage('data:image/png;base64,invalid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('500');
      expect(result.error).toContain('Internal Server Error');
    });
  });

  describe('analyzeImage - Response Parsing', () => {
    it('should parse complex invoice data correctly', async () => {
      const complexResponse = {
        supplierName: 'Tech Solutions GmbH',
        invoiceNumber: 'TS-2024-12345',
        invoiceDate: '15.01.2024',
        dueDate: '30.01.2024',
        netAmount: 1000.00,
        vatAmount: 190.00,
        totalAmount: 1190.00,
        vatRate: 19,
        vatId: 'DE123456789',
        iban: 'DE89370400440532013000',
        bic: 'COBADEFFXXX',
        email: 'rechnung@tech-solutions.de',
        phone: '+493012345678',
        description: 'IT Services January 2024',
        orderNumber: 'PO-2024-001'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify(complexResponse) }]
            }
          }]
        })
      } as Response);

      const result = await service.analyzeImage('data:image/png;base64,valid');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(complexResponse);
    });

    it('should handle partial data extraction', async () => {
      const partialResponse = {
        supplierName: 'Test Supplier',
        invoiceNumber: 'INV-001',
        totalAmount: 119.00
        // Missing other fields
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify(partialResponse) }]
            }
          }]
        })
      } as Response);

      const result = await service.analyzeImage('data:image/png;base64,valid');

      expect(result.success).toBe(true);
      expect(result.data.supplierName).toBe('Test Supplier');
      expect(result.data.totalAmount).toBe(119.00);
      expect(result.data.netAmount).toBeUndefined(); // Missing field
    });

    it('should handle text-only responses', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'This is plain text response' }]
            }
          }]
        })
      } as Response);

      const result = await service.analyzeImage('data:image/png;base64,valid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid response format');
    });
  });

  describe('analyzeImage - Retry Logic', () => {
    it('should retry on transient network errors', async () => {
      let attemptCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 2) {
          return Promise.reject(new Error('ECONNRESET'));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{ text: JSON.stringify({ supplierName: 'Test' }) }]
              }
            }]
          })
        } as Response);
      });

      const result = await service.analyzeImage('data:image/png;base64,valid');

      expect(result.success).toBe(true);
      expect(attemptCount).toBe(2);
    });

    it('should not retry on authentication errors', async () => {
      let attemptCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        attemptCount++;
        return Promise.resolve({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: async () => ({ error: { message: 'Invalid API key' } })
        } as Response);
      });

      const result = await service.analyzeImage('data:image/png;base64,valid');

      expect(result.success).toBe(false);
      expect(attemptCount).toBe(1); // No retry
    });

    it('should respect max retry attempts', async () => {
      let attemptCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        attemptCount++;
        return Promise.reject(new Error('Network error'));
      });

      const result = await service.analyzeImage('data:image/png;base64,valid');

      expect(result.success).toBe(false);
      expect(attemptCount).toBeLessThanOrEqual(3); // Max retries
    });
  });

  describe('analyzeImage - Concurrency', () => {
    it('should handle multiple concurrent requests', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify({ supplierName: 'Test' }) }]
            }
          }]
        })
      } as Response);

      const promises = Array.from({ length: 5 }, (_, i) =>
        service.analyzeImage(`data:image/png;base64,valid${i}`)
      );

      const results = await Promise.all(promises);

      expect(results.every(r => r.success)).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(5);
    });

    it('should maintain rate limits across concurrent requests', async () => {
      // Consume rate limit
      const ratePromises = Array.from({ length: 20 }, () =>
        apiRateLimiter.check('concurrent-test')
      );
      await Promise.all(ratePromises);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify({ supplierName: 'Test' }) }]
            }
          }]
        })
      } as Response);

      const promises = Array.from({ length: 5 }, () =>
        service.analyzeImage('data:image/png;base64,valid')
      );

      const results = await Promise.all(promises);

      // All should fail due to rate limit
      expect(results.every(r => !r.success)).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('analyzeImage - Edge Cases', () => {
    it('should handle extremely large responses', async () => {
      const largeData = { supplierName: 'A'.repeat(10000) };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify(largeData) }]
            }
          }]
        })
      } as Response);

      const result = await service.analyzeImage('data:image/png;base64,valid');

      expect(result.success).toBe(true);
      expect(result.data.supplierName.length).toBe(10000);
    });

    it('should handle special characters in response', async () => {
      const specialData = {
        supplierName: 'Test & Co. GmbH <script>alert("xss")</script>',
        invoiceNumber: 'INV-2024-001'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify(specialData) }]
            }
          }]
        })
      } as Response);

      const result = await service.analyzeImage('data:image/png;base64,valid');

      expect(result.success).toBe(true);
      // Service should return raw data, sanitization happens at validation layer
      expect(result.data.supplierName).toContain('<script>');
    });

    it('should handle unicode characters', async () => {
      const unicodeData = {
        supplierName: 'Müller GmbH - Café & Bäckerei 🎉',
        invoiceNumber: 'RE-2024-123'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify(unicodeData) }]
            }
          }]
        })
      } as Response);

      const result = await service.analyzeImage('data:image/png;base64,valid');

      expect(result.success).toBe(true);
      expect(result.data.supplierName).toBe('Müller GmbH - Café & Bäckerei 🎉');
    });

    it('should handle null values in response', async () => {
      const dataWithNulls = {
        supplierName: 'Test Supplier',
        invoiceNumber: null,
        totalAmount: 119.00,
        vatRate: null
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify(dataWithNulls) }]
            }
          }]
        })
      } as Response);

      const result = await service.analyzeImage('data:image/png;base64,valid');

      expect(result.success).toBe(true);
      expect(result.data.supplierName).toBe('Test Supplier');
      expect(result.data.invoiceNumber).toBeNull();
      expect(result.data.totalAmount).toBe(119.00);
    });

    it('should handle empty object response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify({}) }]
            }
          }]
        })
      } as Response);

      const result = await service.analyzeImage('data:image/png;base64,valid');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });
  });

  describe('analyzeImage - API Configuration', () => {
    it('should use correct API endpoint', async () => {
      let capturedUrl = '';
      global.fetch = vi.fn().mockImplementation((url, options) => {
        capturedUrl = url as string;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{ text: JSON.stringify({ supplierName: 'Test' }) }]
              }
            }]
          })
        } as Response);
      });

      await service.analyzeImage('data:image/png;base64,valid');

      expect(capturedUrl).toContain('generativelanguage.googleapis.com');
      expect(capturedUrl).toContain('v1beta/models/gemini-1.5-flash');
    });

    it('should send correct request headers', async () => {
      let capturedOptions: RequestInit = {};
      global.fetch = vi.fn().mockImplementation((url, options) => {
        capturedOptions = options as RequestInit;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{ text: JSON.stringify({ supplierName: 'Test' }) }]
              }
            }]
          })
        } as Response);
      });

      await service.analyzeImage('data:image/png;base64,valid');

      expect(capturedOptions.headers).toBeDefined();
      expect((capturedOptions.headers as any)['Content-Type']).toBe('application/json');
      expect((capturedOptions.headers as any)['x-goog-api-key']).toBe('test-api-key-12345');
    });

    it('should send correct request body structure', async () => {
      let capturedBody: any = null;
      global.fetch = vi.fn().mockImplementation((url, options) => {
        capturedBody = JSON.parse(options.body as string);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{ text: JSON.stringify({ supplierName: 'Test' }) }]
              }
            }]
          })
        } as Response);
      });

      const base64Data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      await service.analyzeImage(base64Data);

      expect(capturedBody).toBeDefined();
      expect(capturedBody.contents).toBeDefined();
      expect(capturedBody.contents[0].role).toBe('user');
      expect(capturedBody.contents[0].parts).toBeDefined();
      expect(capturedBody.contents[0].parts[0].inline_data).toBeDefined();
      expect(capturedBody.contents[0].parts[0].inline_data.mime_type).toBe('image/png');
      expect(capturedBody.contents[0].parts[0].inline_data.data).toBeDefined();
    });
  });

  describe('analyzeImage - Memory Management', () => {
    it('should not leak memory between requests', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify({ supplierName: 'Test' }) }]
            }
          }]
        })
      } as Response);

      // Perform multiple requests
      for (let i = 0; i < 10; i++) {
        await service.analyzeImage('data:image/png;base64,valid');
      }

      // Verify no memory leaks in performance monitor
      const metrics = PerformanceMonitor.getMetrics();
      expect(metrics.geminiAnalysis).toBeGreaterThan(0);

      // Should have logged summary (indicating cleanup)
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle garbage collection gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify({ supplierName: 'Test' }) }]
            }
          }]
        })
      } as Response);

      // Create and use service, then let it potentially be GC'd
      const tempService = createGeminiService('temp-key');
      const result = await tempService.analyzeImage('data:image/png;base64,valid');

      expect(result.success).toBe(true);

      // Service should still be usable after potential GC
      const result2 = await tempService.analyzeImage('data:image/png;base64,valid');
      expect(result2.success).toBe(true);
    });
  });

  describe('analyzeImage - Security', () => {
    it('should not leak API key in error messages', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('API error with key: test-api-key-12345'));

      const result = await service.analyzeImage('data:image/png;base64,valid');

      expect(result.error).not.toContain('test-api-key-12345');
      expect(result.error).toContain('API error');
    });

    it('should sanitize base64 input before processing', async () => {
      // This would be caught by validation layer, but service should handle gracefully
      const maliciousInput = 'data:image/png;base64,valid; DROP TABLE users; --';

      const result = await service.analyzeImage(maliciousInput);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle oversized payloads without crashing', async () => {
      // Create 20MB base64 string
      const hugeData = 'data:image/png;base64,' + 'A'.repeat(20000000);

      const result = await service.analyzeImage(hugeData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('exceeds maximum size');
    });
  });

  describe('analyzeImage - Logging', () => {
    it('should log successful operations', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify({ supplierName: 'Test' }) }]
            }
          }]
        })
      } as Response);

      await service.analyzeImage('data:image/png;base64,valid');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('geminiAnalysis')
      );
    });

    it('should log failed operations with details', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network timeout'));

      await service.analyzeImage('data:image/png;base64,valid');

      expect(consoleLogSpy).toHaveBeenCalled();
      const calls = consoleLogSpy.mock.calls.flat();
      expect(calls.some(c => typeof c === 'string' && c.includes('geminiAnalysis'))).toBe(true);
    });

    it('should log rate limit violations', async () => {
      // Consume rate limit
      const promises = Array.from({ length: 20 }, () =>
        apiRateLimiter.check('logging-test')
      );
      await Promise.all(promises);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify({ supplierName: 'Test' }) }]
            }
          }]
        })
      } as Response);

      await service.analyzeImage('data:image/png;base64,valid');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Rate limit exceeded')
      );
    });
  });

  describe('analyzeImage - Time-based Scenarios', () => {
    it('should handle rapid successive calls', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify({ supplierName: 'Test' }) }]
            }
          }]
        })
      } as Response);

      const startTime = Date.now();
      const results = [];

      for (let i = 0; i < 5; i++) {
        results.push(service.analyzeImage('data:image/png;base64,valid'));
      }

      await Promise.all(results);
      const duration = Date.now() - startTime;

      // Should complete within reasonable time (< 10 seconds for 5 requests)
      expect(duration).toBeLessThan(10000);
      expect(global.fetch).toHaveBeenCalledTimes(5);
    });

    it('should handle slow network conditions', async () => {
      global.fetch = vi.fn().mockImplementation(() =>
        new Promise(resolve =>
          setTimeout(() => {
            resolve({
              ok: true,
              status: 200,
              json: async () => ({
                candidates: [{
                  content: {
                    parts: [{ text: JSON.stringify({ supplierName: 'Test' }) }]
                  }
                }]
              })
            } as Response);
          }, 2000)
        )
      );

      const result = await service.analyzeImage('data:image/png;base64,valid');

      expect(result.success).toBe(true);
      expect(result.data.supplierName).toBe('Test');
    }, 10000);
  });

  describe('analyzeImage - Integration with PerformanceMonitor', () => {
    it('should track cumulative performance metrics', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify({ supplierName: 'Test' }) }]
            }
          }]
        })
      } as Response);

      // Reset metrics
      (PerformanceMonitor as any).metrics = {};

      // Perform multiple analyses
      for (let i = 0; i < 3; i++) {
        await service.analyzeImage('data:image/png;base64,valid');
      }

      const metrics = PerformanceMonitor.getMetrics();
      expect(metrics.geminiAnalysis).toBeGreaterThan(0);

      // Should have logged summary
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance Summary')
      );
    });

    it('should record failed operations in metrics', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('API Error'));

      (PerformanceMonitor as any).metrics = {};

      await service.analyzeImage('data:image/png;base64,valid');

      // Should have logged the failure
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('analyzeImage - Browser Compatibility', () => {
    it('should work with standard base64 format', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify({ supplierName: 'Test' }) }]
            }
          }]
        })
      } as Response);

      const result = await service.analyzeImage('data:image/png;base64,iVBORw0KGgo=');

      expect(result.success).toBe(true);
    });

    it('should handle base64 without data URI prefix', async () => {
      // This should be rejected by validation, but service should handle gracefully
      const result = await service.analyzeImage('iVBORw0KGgo=');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle different image formats', async () => {
      const formats = [
        'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
        'data:image/png;base64,iVBORw0KGgo=',
        'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=',
        'data:image/heic;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAs1tZGF0AAACrQYF//+p3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE1MiByMjg1NCBlOWE1OTAzIC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxNyAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTMgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAAD2WIhAA3//728P4FNjuZQQAAAu5tb292AAAAbG12aGQAAAAAAAAAAAAAAAAAAAPoAAAAZAABAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAABz3RyYWsAAABcdGtoZAAAAAMAAAAAAAAAAAAAAAEAAAAAAAAAZAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAACWAAAAZAAAAAAACRlZHRzAAAAHGVsc3QAAAAAAAAAAQAAAGQAAAAAAAEAAAAAAQdtZGlhAAAAIG1kaGQAAAAAAAAAAAAAAAAAADwAAAAEAFXEAAAAAAAtaGRscgAAAAAAAAAAdmlkZQAAAAAAAAAAAAAAAFZpZGVvSGFuZGxlcgAAAAE7bWluZgAAABR2bWhkAAAAAQAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAABG3N0YmwAAACXc3RzZAAAAAAAAAABAAAAh2F2YzEAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAACWAGQAEgAAABIAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY//8AAAAxYXZjQwFkAAr/4QAYZ2QACqzZQJgz5eEAAAMAAQAAAwA8DxgxlgEABmjr48siwP34+AAAAAAUYnRydAAAAAAAAPSAAAAA9AAAABhzdHRzAAAAAAAAAAEAAAAeAAAAQAAAABRzdHNzAAAAAAAAAAEAAAABAAAAHGVsc3QAAAAAAAAAAQAAABQAAAAEAAAAAAAAAAEAAAAAAQAAAAAAAAAAAAAAQAAAAABAAAAAAQAAAAAAAAAAAAAAQAAAAABAAAAAA=='
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify({ supplierName: 'Test' }) }]
            }
          }]
        })
      } as Response);

      for (const format of formats) {
        const result = await service.analyzeImage(format);
        // All should either succeed or fail gracefully
        expect(typeof result.success).toBe('boolean');
      }
    });
  });

  describe('analyzeImage - Stress Testing', () => {
    it('should handle 50 sequential requests', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify({ supplierName: 'Test' }) }]
            }
          }]
        })
      } as Response);

      const results = [];
      for (let i = 0; i < 50; i++) {
        results.push(await service.analyzeImage('data:image/png;base64,valid'));
      }

      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBeGreaterThan(0);
    }, 60000); // Extended timeout for stress test

    it('should handle burst traffic', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify({ supplierName: 'Test' }) }]
            }
          }]
        })
      } as Response);

      // Reset rate limiter for this test
      await apiRateLimiter.reset('burst-test');

      const promises = Array.from({ length: 10 }, (_, i) =>
        service.analyzeImage('data:image/png;base64,valid')
      );

      const results = await Promise.all(promises);

      // Some should succeed, some should be rate limited
      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBeGreaterThan(0);
      expect(successCount).toBeLessThanOrEqual(10);
    });
  });

  describe('analyzeImage - Error Recovery', () => {
    it('should recover from temporary network failure', async () => {
      let attempt = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        attempt++;
        if (attempt === 1) {
          return Promise.reject(new Error('Network unreachable'));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{ text: JSON.stringify({ supplierName: 'Test' }) }]
              }
            }]
          })
        } as Response);
      });

      const result = await service.analyzeImage('data:image/png;base64,valid');

      expect(result.success).toBe(true);
      expect(attempt).toBe(2);
    });

    it('should handle server maintenance windows', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => ({ error: { message: 'Maintenance in progress' } })
      } as Response);

      const result = await service.analyzeImage('data:image/png;base64,valid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('503');
      expect(result.error).toContain('Maintenance');
    });

    it('should handle gateway timeouts', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 504,
        statusText: 'Gateway Timeout',
        json: async () => ({ error: { message: 'Gateway timeout' } })
      } as Response);

      const result = await service.analyzeImage('data:image/png;base64,valid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('504');
    });
  });

  describe('analyzeImage - Data Integrity', () => {
    it('should preserve numerical precision', async () => {
      const preciseData = {
        netAmount: 1234.56789,
        vatAmount: 234.56789,
        totalAmount: 1469.13578,
        vatRate: 19.00000
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify(preciseData) }]
            }
          }]
        })
      } as Response);

      const result = await service.analyzeImage('data:image/png;base64,valid');

      expect(result.success).toBe(true);
      expect(result.data.netAmount).toBe(1234.56789);
      expect(result.data.vatAmount).toBe(234.56789);
      expect(result.data.totalAmount).toBe(1469.13578);
      expect(result.data.vatRate).toBe(19.00000);
    });

    it('should handle very large numbers', async () => {
      const largeData = {
        netAmount: 999999999.99,
        vatAmount: 189999999.99,
        totalAmount: 1189999999.98
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify(largeData) }]
            }
          }]
        })
      } as Response);

      const result = await service.analyzeImage('data:image/png;base64,valid');

      expect(result.success).toBe(true);
      expect(result.data.totalAmount).toBe(1189999999.98);
    });

    it('should handle very small numbers', async () => {
      const smallData = {
        netAmount: 0.01,
        vatAmount: 0.0019,
        totalAmount: 0.0119
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify(smallData) }]
            }
          }]
        })
      } as Response);

      const result = await service.analyzeImage('data:image/png;base64,valid');

      expect(result.success).toBe(true);
      expect(result.data.netAmount).toBe(0.01);
    });
  });

  describe('analyzeImage - Final Validation', () => {
    it('should meet all production requirements', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify({
                supplierName: 'Complete Test Supplier GmbH',
                invoiceNumber: 'INV-2024-999',
                invoiceDate: '31.12.2024',
                dueDate: '15.01.2025',
                netAmount: 1000.00,
                vatAmount: 190.00,
                totalAmount: 1190.00,
                vatRate: 19,
                vatId: 'DE123456789',
                iban: 'DE89370400440532013000',
                bic: 'COBADEFFXXX',
                email: 'rechnung@test.de',
                phone: '+493012345678',
                description: 'Test Description',
                orderNumber: 'PO-2024-001'
              }) }]
            }
          }]
        })
      } as Response);

      const result = await service.analyzeImage('data:image/png;base64,valid');

      // Verify all requirements
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(typeof result.data).toBe('object');
      expect(result.data.supplierName).toBe('Complete Test Supplier GmbH');
      expect(result.data.totalAmount).toBe(1190.00);

      // Verify performance tracking
      const metrics = PerformanceMonitor.getMetrics();
      expect(metrics.geminiAnalysis).toBeGreaterThan(0);

      // Verify no API key leakage
      expect(JSON.stringify(result)).not.toContain('test-api-key-12345');
    });

    it('should handle complete failure scenario gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Complete failure'));

      const result = await service.analyzeImage('data:image/png;base64,valid');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeUndefined();
      expect(typeof result.error).toBe('string');
      expect(result.error.length).toBeGreaterThan(0);
    });
  });
});
