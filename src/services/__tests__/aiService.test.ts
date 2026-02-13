/**
 * 🔱 ULTRA 2026 - AI Service Tests
 * Comprehensive test suite for AI service with circuit breaker and cost tracking
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIService, AICircuitBreaker, AICostTracker, Result } from '@/lib/ultra';
import { type UserId } from '@/lib/ultra';

describe('AIService', () => {
  let aiService: AIService;
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000' as UserId;

  beforeEach(() => {
    aiService = new AIService();
    // Mock fetch globally
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('analyzeDocument', () => {
    it('should successfully analyze document with Gemini provider', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                type: 'RECHNUNG',
                totalAmount: 119.00,
                vatAmount: 19.00,
                netAmount: 100.00,
                creditor: 'Test GmbH',
                vatRate: 19.0,
                documentDate: '2024-01-15',
                confidence: 95.5,
              })
            }]
          }
        }]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await aiService.analyzeDocument('base64ImageData', mockUserId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalAmount).toBe(119.00);
        expect(result.data.creditor).toBe('Test GmbH');
        expect(result.data.type).toBe('RECHNUNG');
      }
    });

    it('should fall back to SiliconFlow when Gemini fails', async () => {
      // First call (Gemini) fails
      (global.fetch as any).mockRejectedValueOnce(new Error('API timeout'));

      // Second call (SiliconFlow) succeeds
      const mockSiliconFlowResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              type: 'QUITTUNG',
              totalAmount: 50.00,
              vatAmount: 7.62,
              netAmount: 42.38,
              creditor: 'Test Shop',
              vatRate: 19.0,
              documentDate: '2024-01-16',
              confidence: 92.3,
            })
          }
        }]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSiliconFlowResponse,
      } as Response);

      const result = await aiService.analyzeDocument('base64ImageData', mockUserId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalAmount).toBe(50.00);
        expect(result.data.creditor).toBe('Test Shop');
        expect(result.data.type).toBe('QUITTUNG');
      }
    });

    it('should return error when both providers fail', async () => {
      // Both providers fail
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await aiService.analyzeDocument('base64ImageData', mockUserId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Network error');
      }
    });

    it('should validate result against DocumentSchema', async () => {
      // Return invalid data
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                // Missing required fields
                type: 'RECHNUNG',
                totalAmount: -100, // Invalid: negative
              })
            }]
          }
        }]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await aiService.analyzeDocument('base64ImageData', mockUserId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Validation failed');
      }
    });

    it('should track costs for successful analysis', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                type: 'RECHNUNG',
                totalAmount: 119.00,
                vatAmount: 19.00,
                netAmount: 100.00,
                creditor: 'Test GmbH',
                vatRate: 19.0,
                documentDate: '2024-01-15',
                confidence: 95.5,
              })
            }]
          }
        }]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await aiService.analyzeDocument('base64ImageData', mockUserId);

      const costReport = aiService.getCostReport(mockUserId);
      expect(costReport.total).toBeGreaterThan(0);
      expect(costReport.byProvider.gemini).toBeGreaterThan(0);
    });

    it('should track costs for fallback provider', async () => {
      // Gemini fails
      (global.fetch as any).mockRejectedValueOnce(new Error('API timeout'));

      // SiliconFlow succeeds
      const mockSiliconFlowResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              type: 'QUITTUNG',
              totalAmount: 50.00,
              vatAmount: 7.62,
              netAmount: 42.38,
              creditor: 'Test Shop',
              vatRate: 19.0,
              documentDate: '2024-01-16',
              confidence: 92.3,
            })
          }
        }]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSiliconFlowResponse,
      } as Response);

      await aiService.analyzeDocument('base64ImageData', mockUserId);

      const costReport = aiService.getCostReport(mockUserId);
      expect(costReport.byProvider.siliconflow).toBeGreaterThan(0);
      expect(costReport.byProvider.gemini).toBeUndefined();
    });
  });

  describe('getCostReport', () => {
    beforeEach(async () => {
      // Create some cost entries
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                type: 'RECHNUNG',
                totalAmount: 119.00,
                vatAmount: 19.00,
                netAmount: 100.00,
                creditor: 'Test GmbH',
                vatRate: 19.0,
                documentDate: '2024-01-15',
                confidence: 95.5,
              })
            }]
          }
        }]
      };

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response));

      await aiService.analyzeDocument('base64ImageData', mockUserId);
      await aiService.analyzeDocument('base64ImageData', mockUserId);
    });

    it('should return total cost for user', () => {
      const report = aiService.getCostReport(mockUserId);
      expect(report.total).toBeGreaterThan(0);
      expect(report.total).toBeCloseTo(0.02, 2); // 2 * 0.01
    });

    it('should break down costs by provider', () => {
      const report = aiService.getCostReport(mockUserId);
      expect(report.byProvider).toHaveProperty('gemini');
      expect(report.byProvider.gemini).toBeGreaterThan(0);
    });

    it('should return zero for user with no costs', () => {
      const otherUser = '99999999-9999-9999-9999-999999999999' as UserId;
      const report = aiService.getCostReport(otherUser);
      expect(report.total).toBe(0);
      expect(Object.keys(report.byProvider).length).toBe(0);
    });

    it('should return report for all users when no userId provided', () => {
      const report = aiService.getCostReport();
      expect(report.total).toBeGreaterThan(0);
    });
  });
});

describe('AICircuitBreaker', () => {
  let circuitBreaker: AICircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new AICircuitBreaker();
  });

  describe('execute', () => {
    it('should execute primary function successfully', async () => {
      const primaryFn = vi.fn().mockResolvedValue('primary-result');
      const fallbackFn = vi.fn().mockResolvedValue('fallback-result');

      const result = await circuitBreaker.execute('test-provider', primaryFn, fallbackFn);

      expect(result).toBe('primary-result');
      expect(primaryFn).toHaveBeenCalledTimes(1);
      expect(fallbackFn).not.toHaveBeenCalled();
    });

    it('should call fallback when primary fails', async () => {
      const primaryFn = vi.fn().mockRejectedValue(new Error('Primary failed'));
      const fallbackFn = vi.fn().mockResolvedValue('fallback-result');

      const result = await circuitBreaker.execute('test-provider', primaryFn, fallbackFn);

      expect(result).toBe('fallback-result');
      expect(primaryFn).toHaveBeenCalledTimes(1);
      expect(fallbackFn).toHaveBeenCalledTimes(1);
    });

    it('should use fallback immediately when provider is in cooldown', async () => {
      const primaryFn = vi.fn().mockRejectedValue(new Error('Failed'));
      const fallbackFn = vi.fn().mockResolvedValue('fallback-result');

      // First failure - triggers cooldown
      await circuitBreaker.execute('test-provider', primaryFn, fallbackFn);

      // Second call - should use fallback immediately
      const result = await circuitBreaker.execute('test-provider', primaryFn, fallbackFn);

      expect(result).toBe('fallback-result');
      expect(primaryFn).toHaveBeenCalledTimes(1); // Only called once
      expect(fallbackFn).toHaveBeenCalledTimes(2);
    });

    it('should reset after cooldown period', async () => {
      vi.useFakeTimers();

      const primaryFn = vi.fn().mockRejectedValue(new Error('Failed'));
      const fallbackFn = vi.fn().mockResolvedValue('fallback-result');

      // First failure
      await circuitBreaker.execute('test-provider', primaryFn, fallbackFn);

      // Advance time past cooldown (60 seconds)
      vi.advanceTimersByTime(61000);

      // Reset primary to succeed
      primaryFn.mockResolvedValue('primary-result');

      const result = await circuitBreaker.execute('test-provider', primaryFn, fallbackFn);

      expect(result).toBe('primary-result');
      expect(primaryFn).toHaveBeenCalledTimes(2); // Called again after cooldown

      vi.useRealTimers();
    });

    it('should track multiple providers independently', async () => {
      const provider1Primary = vi.fn().mockRejectedValue(new Error('Provider 1 failed'));
      const provider1Fallback = vi.fn().mockResolvedValue('provider1-fallback');
      
      const provider2Primary = vi.fn().mockResolvedValue('provider2-success');
      const provider2Fallback = vi.fn().mockResolvedValue('provider2-fallback');

      // Provider 1 fails
      await circuitBreaker.execute('provider1', provider1Primary, provider1Fallback);

      // Provider 2 succeeds
      await circuitBreaker.execute('provider2', provider2Primary, provider2Fallback);

      // Provider 1 should use fallback
      const result1 = await circuitBreaker.execute('provider1', provider1Primary, provider1Fallback);
      expect(result1).toBe('provider1-fallback');

      // Provider 2 should use primary
      const result2 = await circuitBreaker.execute('provider2', provider2Primary, provider2Fallback);
      expect(result2).toBe('provider2-success');
    });

    it('should handle multiple failures before threshold', async () => {
      const primaryFn = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');

      const fallbackFn = vi.fn().mockResolvedValue('fallback');

      // First two failures - should still try primary
      await circuitBreaker.execute('test-provider', primaryFn, fallbackFn);
      await circuitBreaker.execute('test-provider', primaryFn, fallbackFn);

      expect(primaryFn).toHaveBeenCalledTimes(2);
      expect(fallbackFn).toHaveBeenCalledTimes(2);

      // Third call - should use fallback due to threshold
      const result = await circuitBreaker.execute('test-provider', primaryFn, fallbackFn);
      expect(result).toBe('fallback');
      expect(primaryFn).toHaveBeenCalledTimes(2); // No third call
      expect(fallbackFn).toHaveBeenCalledTimes(3);
    });
  });
});

describe('AICostTracker', () => {
  let costTracker: AICostTracker;

  beforeEach(() => {
    costTracker = new AICostTracker();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('track', () => {
    it('should track cost with all required fields', () => {
      const mockUserId = '123e4567-e89b-12d3-a456-426614174000' as UserId;

      costTracker.track({
        provider: 'gemini',
        tokens: 150,
        costUSD: 0.01,
        userId: mockUserId,
      });

      const report = costTracker.getReport(mockUserId);
      expect(report.total).toBe(0.01);
      expect(report.byProvider.gemini).toBe(0.01);
    });

    it('should accumulate costs from multiple operations', () => {
      const mockUserId = '123e4567-e89b-12d3-a456-426614174000' as UserId;

      costTracker.track({ provider: 'gemini', tokens: 100, costUSD: 0.01, userId: mockUserId });
      costTracker.track({ provider: 'gemini', tokens: 150, costUSD: 0.015, userId: mockUserId });
      costTracker.track({ provider: 'siliconflow', tokens: 200, costUSD: 0.005, userId: mockUserId });

      const report = costTracker.getReport(mockUserId);
      expect(report.total).toBeCloseTo(0.03, 3);
      expect(report.byProvider.gemini).toBeCloseTo(0.025, 3);
      expect(report.byProvider.siliconflow).toBe(0.005);
    });

    it('should separate costs by user', () => {
      const user1 = '11111111-1111-1111-1111-111111111111' as UserId;
      const user2 = '22222222-2222-2222-2222-222222222222' as UserId;

      costTracker.track({ provider: 'gemini', tokens: 100, costUSD: 0.01, userId: user1 });
      costTracker.track({ provider: 'gemini', tokens: 100, costUSD: 0.01, userId: user2 });

      const report1 = costTracker.getReport(user1);
      const report2 = costTracker.getReport(user2);

      expect(report1.total).toBe(0.01);
      expect(report2.total).toBe(0.01);
      expect(report1.total).toBe(report2.total);
    });

    it('should check budget and log error when exceeded', () => {
      const mockUserId = '123e4567-e89b-12d3-a456-426614174000' as UserId;

      // Track costs exceeding daily budget ($100)
      for (let i = 0; i < 11; i++) {
        costTracker.track({ provider: 'gemini', tokens: 1000, costUSD: 10, userId: mockUserId });
      }

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[AI Budget] Exceeded daily limit')
      );
    });

    it('should handle costs from different providers', () => {
      const mockUserId = '123e4567-e89b-12d3-a456-426614174000' as UserId;

      costTracker.track({ provider: 'gemini', tokens: 100, costUSD: 0.01, userId: mockUserId });
      costTracker.track({ provider: 'siliconflow', tokens: 200, costUSD: 0.005, userId: mockUserId });
      costTracker.track({ provider: 'gemini', tokens: 150, costUSD: 0.015, userId: mockUserId });

      const report = costTracker.getReport(mockUserId);

      expect(report.byProvider.gemini).toBeCloseTo(0.025, 3);
      expect(report.byProvider.siliconflow).toBe(0.005);
    });
  });

  describe('getReport', () => {
    it('should return zero for user with no costs', () => {
      const mockUserId = '123e4567-e89b-12d3-a456-426614174000' as UserId;
      const report = costTracker.getReport(mockUserId);

      expect(report.total).toBe(0);
      expect(Object.keys(report.byProvider).length).toBe(0);
    });

    it('should return report for all users when no userId provided', () => {
      const user1 = '11111111-1111-1111-1111-111111111111' as UserId;
      const user2 = '22222222-2222-2222-2222-222222222222' as UserId;

      costTracker.track({ provider: 'gemini', tokens: 100, costUSD: 0.01, userId: user1 });
      costTracker.track({ provider: 'gemini', tokens: 100, costUSD: 0.01, userId: user2 });

      const report = costTracker.getReport();

      expect(report.total).toBe(0.02);
      expect(report.byProvider.gemini).toBe(0.02);
    });

    it('should handle empty cost array', () => {
      const report = costTracker.getReport();
      expect(report.total).toBe(0);
      expect(report.byProvider).toEqual({});
    });
  });
});

describe('AI Provider Health Checks', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have health check methods', () => {
    expect(typeof aiService['providers'][0].healthCheck).toBe('function');
    expect(typeof aiService['providers'][1].healthCheck).toBe('function');
  });

  it('should detect healthy provider', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
    } as Response);

    const health = await aiService['providers'][0].healthCheck();
    expect(health).toBe(true);
  });

  it('should detect unhealthy provider', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const health = await aiService['providers'][0].healthCheck();
    expect(health).toBe(false);
  });
});

describe('AI Service - Circuit Breaker Integration', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should use circuit breaker to prevent cascading failures', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000' as UserId;

    // Mock multiple failures
    (global.fetch as any).mockRejectedValue(new Error('API timeout'));

    // First call - tries primary, falls back
    const result1 = await aiService.analyzeDocument('base64', mockUserId);
    expect(result1.success).toBe(false);

    // Second call - should use fallback immediately
    const result2 = await aiService.analyzeDocument('base64', mockUserId);
    expect(result2.success).toBe(false);

    // Third call - still uses fallback
    const result3 = await aiService.analyzeDocument('base64', mockUserId);
    expect(result3.success).toBe(false);

    // Verify cost tracking for fallback attempts
    const report = aiService.getCostReport(mockUserId);
    expect(report.total).toBeGreaterThan(0);
  });

  it('should recover after cooldown period', async () => {
    vi.useFakeTimers();

    const mockUserId = '123e4567-e89b-12d3-a456-426614174000' as UserId;

    // Mock initial failures
    (global.fetch as any).mockRejectedValue(new Error('API timeout'));

    // First failure
    await aiService.analyzeDocument('base64', mockUserId);

    // Advance time past cooldown
    vi.advanceTimersByTime(61000);

    // Mock success
    const mockResponse = {
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              type: 'RECHNUNG',
              totalAmount: 119.00,
              vatAmount: 19.00,
              netAmount: 100.00,
              creditor: 'Test GmbH',
              vatRate: 19.0,
              documentDate: '2024-01-15',
              confidence: 95.5,
            })
          }]
        }
      }]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    // Should try primary again
    const result = await aiService.analyzeDocument('base64', mockUserId);
    expect(result.success).toBe(true);

    vi.useRealTimers();
  });
});

describe('AI Service - Error Scenarios', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle malformed JSON response', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000' as UserId;

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ invalid: 'response' }),
    } as Response);

    const result = await aiService.analyzeDocument('base64', mockUserId);
    expect(result.success).toBe(false);
  });

  it('should handle network errors gracefully', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000' as UserId;

    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const result = await aiService.analyzeDocument('base64', mockUserId);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('Network error');
    }
  });

  it('should handle HTTP error responses', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000' as UserId;

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    const result = await aiService.analyzeDocument('base64', mockUserId);
    expect(result.success).toBe(false);
  });

  it('should handle timeout scenarios', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000' as UserId;

    // Mock timeout
    (global.fetch as any).mockImplementationOnce(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )
    );

    const result = await aiService.analyzeDocument('base64', mockUserId);
    expect(result.success).toBe(false);
  });
});

describe('AI Service - Performance', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle concurrent requests efficiently', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000' as UserId;

    const mockResponse = {
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              type: 'RECHNUNG',
              totalAmount: 119.00,
              vatAmount: 19.00,
              netAmount: 100.00,
              creditor: 'Test GmbH',
              vatRate: 19.0,
              documentDate: '2024-01-15',
              confidence: 95.5,
            })
          }]
        }
      }]
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const startTime = Date.now();

    // Concurrent requests
    const promises = Array(10).fill(null).map(() => 
      aiService.analyzeDocument('base64', mockUserId)
    );

    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;

    expect(results.every(r => r.success)).toBe(true);
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
  });

  it('should track costs accurately under load', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000' as UserId;

    const mockResponse = {
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              type: 'RECHNUNG',
              totalAmount: 119.00,
              vatAmount: 19.00,
              netAmount: 100.00,
              creditor: 'Test GmbH',
              vatRate: 19.0,
              documentDate: '2024-01-15',
              confidence: 95.5,
            })
          }]
        }
      }]
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    // 50 concurrent requests
    const promises = Array(50).fill(null).map(() => 
      aiService.analyzeDocument('base64', mockUserId)
    );

    await Promise.all(promises);

    const report = aiService.getCostReport(mockUserId);
    expect(report.total).toBeCloseTo(0.50, 2); // 50 * 0.01
  });
});
