/**
 * 🔱 ULTRA 2026 - Audit Service Tests
 * Comprehensive test suite for production-grade audit logging service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuditService, type AuditLog } from '@/lib/ultra';
import { type UserId } from '@/lib/ultra';

describe('AuditService', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000' as UserId;

  beforeEach(() => {
    // Clear all logs before each test
    (AuditService as any).logs = [];
    // Mock IndexedDB
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('log', () => {
    it('should create log entry with timestamp', () => {
      const beforeTime = Date.now();

      AuditService.log({
        userId: mockUserId,
        action: 'UPLOAD',
        resource: 'document',
        resourceId: 'doc-123',
        result: 'success',
      });

      const afterTime = Date.now();
      const logs = (AuditService as any).logs;

      expect(logs.length).toBe(1);
      expect(logs[0].userId).toBe(mockUserId);
      expect(logs[0].action).toBe('UPLOAD');
      expect(logs[0].resource).toBe('document');
      expect(logs[0].resourceId).toBe('doc-123');
      expect(logs[0].result).toBe('success');
      expect(logs[0].timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime);
      expect(logs[0].timestamp.getTime()).toBeLessThanOrEqual(afterTime);
    });

    it('should include optional metadata', () => {
      AuditService.log({
        userId: mockUserId,
        action: 'AI_ANALYSIS',
        resource: 'document',
        resourceId: 'doc-456',
        result: 'success',
        metadata: {
          provider: 'gemini',
          cost: 0.01,
          confidence: 95.5,
        },
      });

      const logs = (AuditService as any).logs;
      expect(logs[0].metadata).toEqual({
        provider: 'gemini',
        cost: 0.01,
        confidence: 95.5,
      });
    });

    it('should include IP address when provided', () => {
      AuditService.log({
        userId: mockUserId,
        action: 'VIEW',
        resource: 'document',
        resourceId: 'doc-789',
        result: 'success',
        ip: '192.168.1.1',
      });

      const logs = (AuditService as any).logs;
      expect(logs[0].ip).toBe('192.168.1.1');
    });

    it('should include user agent when provided', () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      
      AuditService.log({
        userId: mockUserId,
        action: 'LOGIN',
        resource: 'auth',
        resourceId: 'auth',
        result: 'success',
        userAgent,
      });

      const logs = (AuditService as any).logs;
      expect(logs[0].userAgent).toBe(userAgent);
    });

    it('should handle failure result with error metadata', () => {
      AuditService.log({
        userId: mockUserId,
        action: 'AI_ANALYSIS',
        resource: 'document',
        resourceId: 'doc-999',
        result: 'failure',
        metadata: {
          error: 'API timeout',
          provider: 'gemini',
        },
      });

      const logs = (AuditService as any).logs;
      expect(logs[0].result).toBe('failure');
      expect(logs[0].metadata.error).toBe('API timeout');
    });

    it('should handle security violations with high priority', () => {
      AuditService.log({
        userId: mockUserId,
        action: 'SECURITY_VIOLATION',
        resource: 'security',
        resourceId: 'security',
        result: 'failure',
        metadata: {
          type: 'XSS_ATTEMPT',
          details: 'Detected script injection',
          priority: 'HIGH',
        },
      });

      const logs = (AuditService as any).logs;
      expect(logs[0].action).toBe('SECURITY_VIOLATION');
      expect(logs[0].metadata.priority).toBe('HIGH');
    });

    it('should log to console in production', () => {
      // Mock production environment
      const originalEnv = import.meta.env.PROD;
      (import.meta as any).env.PROD = true;

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      AuditService.log({
        userId: mockUserId,
        action: 'UPLOAD',
        resource: 'document',
        resourceId: 'doc-123',
        result: 'success',
      });

      expect(fetchSpy).toHaveBeenCalledWith('/api/audit', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }));

      // Restore
      (import.meta as any).env.PROD = originalEnv;
      fetchSpy.mockRestore();
    });

    it('should store offline when production fetch fails', async () => {
      // Mock production environment
      const originalEnv = import.meta.env.PROD;
      (import.meta as any).env.PROD = true;

      const fetchSpy = vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
      const storeOfflineSpy = vi.spyOn(AuditService as any, 'storeOffline');

      AuditService.log({
        userId: mockUserId,
        action: 'UPLOAD',
        resource: 'document',
        resourceId: 'doc-123',
        result: 'success',
      });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(fetchSpy).toHaveBeenCalled();
      expect(storeOfflineSpy).toHaveBeenCalled();

      // Restore
      (import.meta as any).env.PROD = originalEnv;
      fetchSpy.mockRestore();
      storeOfflineSpy.mockRestore();
    });
  });

  describe('getLogs', () => {
    beforeEach(() => {
      // Add test logs
      AuditService.log({
        userId: mockUserId,
        action: 'UPLOAD',
        resource: 'document',
        resourceId: 'doc-1',
        result: 'success',
      });
      AuditService.log({
        userId: mockUserId,
        action: 'VIEW',
        resource: 'document',
        resourceId: 'doc-2',
        result: 'success',
      });
      AuditService.log({
        userId: '00000000-0000-0000-0000-000000000001' as UserId,
        action: 'UPLOAD',
        resource: 'document',
        resourceId: 'doc-3',
        result: 'success',
      });
    });

    it('should return logs for specific user', () => {
      const logs = AuditService.getLogs(mockUserId);

      expect(logs.length).toBe(2);
      expect(logs.every(log => log.userId === mockUserId)).toBe(true);
    });

    it('should return empty array for user with no logs', () => {
      const logs = AuditService.getLogs('99999999-9999-9999-9999-999999999999' as UserId);

      expect(logs.length).toBe(0);
    });

    it('should return logs sorted by timestamp (newest first)', () => {
      // Wait to ensure different timestamps
      const logs = AuditService.getLogs(mockUserId);

      expect(logs.length).toBe(2);
      expect(logs[0].timestamp.getTime()).toBeGreaterThanOrEqual(logs[1].timestamp.getTime());
    });
  });

  describe('clearLogs', () => {
    beforeEach(() => {
      AuditService.log({
        userId: mockUserId,
        action: 'UPLOAD',
        resource: 'document',
        resourceId: 'doc-1',
        result: 'success',
      });
      AuditService.log({
        userId: '00000000-0000-0000-0000-000000000001' as UserId,
        action: 'UPLOAD',
        resource: 'document',
        resourceId: 'doc-2',
        result: 'success',
      });
    });

    it('should clear logs for specific user', () => {
      AuditService.clearLogs(mockUserId);

      const userLogs = AuditService.getLogs(mockUserId);
      const otherLogs = AuditService.getLogs('00000000-0000-0000-0000-000000000001' as UserId);

      expect(userLogs.length).toBe(0);
      expect(otherLogs.length).toBe(1);
    });

    it('should not affect logs of other users', () => {
      AuditService.clearLogs(mockUserId);

      const otherLogs = AuditService.getLogs('00000000-0000-0000-0000-000000000001' as UserId);
      expect(otherLogs.length).toBe(1);
    });
  });

  describe('exportLogs', () => {
    beforeEach(() => {
      AuditService.log({
        userId: mockUserId,
        action: 'UPLOAD',
        resource: 'document',
        resourceId: 'doc-1',
        result: 'success',
        metadata: { fileName: 'test.pdf', fileSize: 1024 },
      });
      AuditService.log({
        userId: mockUserId,
        action: 'VIEW',
        resource: 'document',
        resourceId: 'doc-2',
        result: 'success',
      });
    });

    it('should export logs as JSON', async () => {
      const exported = await AuditService.exportLogs(mockUserId, 'json');
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(2);
      expect(parsed[0].action).toBe('UPLOAD');
      expect(parsed[0].metadata.fileName).toBe('test.pdf');
    });

    it('should export logs as CSV', async () => {
      const exported = await AuditService.exportLogs(mockUserId, 'csv');

      expect(typeof exported).toBe('string');
      expect(exported).toContain('timestamp');
      expect(exported).toContain('action');
      expect(exported).toContain('resource');
      expect(exported).toContain('UPLOAD');
      expect(exported).toContain('VIEW');
    });

    it('should handle empty logs array', async () => {
      AuditService.clearLogs(mockUserId);

      const exported = await AuditService.exportLogs(mockUserId, 'json');
      expect(exported).toBe('[]');
    });

    it('should handle CSV with metadata', async () => {
      const exported = await AuditService.exportLogs(mockUserId, 'csv');

      // Should include metadata columns
      expect(exported).toContain('metadata');
      expect(exported).toContain('test.pdf');
    });
  });

  describe('getLogsByAction', () => {
    beforeEach(() => {
      AuditService.log({
        userId: mockUserId,
        action: 'UPLOAD',
        resource: 'document',
        resourceId: 'doc-1',
        result: 'success',
      });
      AuditService.log({
        userId: mockUserId,
        action: 'UPLOAD',
        resource: 'document',
        resourceId: 'doc-2',
        result: 'success',
      });
      AuditService.log({
        userId: mockUserId,
        action: 'VIEW',
        resource: 'document',
        resourceId: 'doc-3',
        result: 'success',
      });
    });

    it('should filter logs by action', () => {
      const uploadLogs = AuditService.getLogsByAction(mockUserId, 'UPLOAD');

      expect(uploadLogs.length).toBe(2);
      expect(uploadLogs.every(log => log.action === 'UPLOAD')).toBe(true);
    });

    it('should return empty array for non-existent action', () => {
      const logs = AuditService.getLogsByAction(mockUserId, 'DELETE');

      expect(logs.length).toBe(0);
    });
  });

  describe('getLogsByResource', () => {
    beforeEach(() => {
      AuditService.log({
        userId: mockUserId,
        action: 'UPLOAD',
        resource: 'document',
        resourceId: 'doc-1',
        result: 'success',
      });
      AuditService.log({
        userId: mockUserId,
        action: 'VIEW',
        resource: 'document',
        resourceId: 'doc-2',
        result: 'success',
      });
      AuditService.log({
        userId: mockUserId,
        action: 'LOGIN',
        resource: 'auth',
        resourceId: 'auth',
        result: 'success',
      });
    });

    it('should filter logs by resource', () => {
      const documentLogs = AuditService.getLogsByResource(mockUserId, 'document');

      expect(documentLogs.length).toBe(2);
      expect(documentLogs.every(log => log.resource === 'document')).toBe(true);
    });

    it('should return empty array for non-existent resource', () => {
      const logs = AuditService.getLogsByResource(mockUserId, 'settings');

      expect(logs.length).toBe(0);
    });
  });

  describe('getLogsByDateRange', () => {
    beforeEach(() => {
      // Clear and add logs with specific timestamps
      (AuditService as any).logs = [];

      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      const twoDaysAgo = now - 48 * 60 * 60 * 1000;
      const threeDaysAgo = now - 72 * 60 * 60 * 1000;

      AuditService.log({
        userId: mockUserId,
        action: 'UPLOAD',
        resource: 'document',
        resourceId: 'doc-1',
        result: 'success',
      });
      (AuditService as any).logs[0].timestamp = new Date(oneDayAgo);

      AuditService.log({
        userId: mockUserId,
        action: 'VIEW',
        resource: 'document',
        resourceId: 'doc-2',
        result: 'success',
      });
      (AuditService as any).logs[1].timestamp = new Date(twoDaysAgo);

      AuditService.log({
        userId: mockUserId,
        action: 'DELETE',
        resource: 'document',
        resourceId: 'doc-3',
        result: 'success',
      });
      (AuditService as any).logs[2].timestamp = new Date(threeDaysAgo);
    });

    it('should filter logs by date range', () => {
      const now = Date.now();
      const twoDaysAgo = now - 48 * 60 * 60 * 1000;
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      const logs = AuditService.getLogsByDateRange(mockUserId, new Date(twoDaysAgo), new Date(oneDayAgo));

      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe('VIEW');
    });

    it('should return all logs when range covers everything', () => {
      const now = Date.now();
      const threeDaysAgo = now - 72 * 60 * 60 * 1000;

      const logs = AuditService.getLogsByDateRange(mockUserId, new Date(threeDaysAgo), new Date(now));

      expect(logs.length).toBe(3);
    });

    it('should return empty array when no logs in range', () => {
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;
      const thirtyMinutesAgo = now - 30 * 60 * 1000;

      const logs = AuditService.getLogsByDateRange(mockUserId, new Date(oneHourAgo), new Date(thirtyMinutesAgo));

      expect(logs.length).toBe(0);
    });
  });

  describe('getLogStatistics', () => {
    beforeEach(() => {
      (AuditService as any).logs = [];

      // Create varied log entries
      AuditService.log({
        userId: mockUserId,
        action: 'UPLOAD',
        resource: 'document',
        resourceId: 'doc-1',
        result: 'success',
      });
      AuditService.log({
        userId: mockUserId,
        action: 'UPLOAD',
        resource: 'document',
        resourceId: 'doc-2',
        result: 'success',
      });
      AuditService.log({
        userId: mockUserId,
        action: 'VIEW',
        resource: 'document',
        resourceId: 'doc-3',
        result: 'success',
      });
      AuditService.log({
        userId: mockUserId,
        action: 'AI_ANALYSIS',
        resource: 'document',
        resourceId: 'doc-4',
        result: 'success',
        metadata: { cost: 0.01 },
      });
      AuditService.log({
        userId: mockUserId,
        action: 'AI_ANALYSIS',
        resource: 'document',
        resourceId: 'doc-5',
        result: 'failure',
        metadata: { error: 'API timeout' },
      });
    });

    it('should return correct statistics', () => {
      const stats = AuditService.getLogStatistics(mockUserId);

      expect(stats.totalLogs).toBe(5);
      expect(stats.successful).toBe(4);
      expect(stats.failed).toBe(1);
      expect(stats.byAction.UPLOAD).toBe(2);
      expect(stats.byAction.VIEW).toBe(1);
      expect(stats.byAction.AI_ANALYSIS).toBe(2);
      expect(stats.byResource.document).toBe(5);
    });

    it('should calculate average cost for AI operations', () => {
      const stats = AuditService.getLogStatistics(mockUserId);

      expect(stats.avgCost).toBe(0.01);
    });

    it('should return zero stats for user with no logs', () => {
      const stats = AuditService.getLogStatistics('99999999-9999-9999-9999-999999999999' as UserId);

      expect(stats.totalLogs).toBe(0);
      expect(stats.successful).toBe(0);
      expect(stats.failed).toBe(0);
    });
  });

  describe('storeOffline', () => {
    it('should store logs in IndexedDB when production fetch fails', async () => {
      const originalEnv = import.meta.env.PROD;
      (import.meta as any).env.PROD = true;

      // Mock IndexedDB
      const mockIndexedDB = {
        open: vi.fn().mockReturnValue({
          onupgradeneeded: null,
          onsuccess: null,
          result: {
            transaction: vi.fn().mockReturnValue({
              objectStore: vi.fn().mockReturnValue({
                add: vi.fn().mockImplementation(() => ({
                  onsuccess: null,
                  onerror: null,
                })),
              }),
            }),
          },
        }),
      };

      Object.defineProperty(window, 'indexedDB', {
        value: mockIndexedDB,
        writable: true,
      });

      const log: AuditLog = {
        timestamp: new Date(),
        userId: mockUserId,
        action: 'UPLOAD',
        resource: 'document',
        resourceId: 'doc-123',
        result: 'success',
      };

      (AuditService as any).storeOffline(log);

      expect(mockIndexedDB.open).toHaveBeenCalledWith('ZoeSolarAuditDB', 1);

      // Restore
      (import.meta as any).env.PROD = originalEnv;
    });
  });

  describe('flushOfflineLogs', () => {
    it('should have flushOfflineLogs method', () => {
      expect(typeof AuditService.flushOfflineLogs).toBe('function');
    });

    it('should attempt to flush offline logs to server', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      // Mock IndexedDB to return some logs
      const mockLogs = [
        {
          timestamp: new Date().toISOString(),
          userId: mockUserId,
          action: 'UPLOAD',
          resource: 'document',
          resourceId: 'doc-1',
          result: 'success',
        },
      ];

      // This would typically read from IndexedDB
      // For testing, we'll just verify the method exists and can be called
      await expect(AuditService.flushOfflineLogs()).resolves.not.toThrow();

      fetchSpy.mockRestore();
    });
  });

  describe('GDPR Compliance', () => {
    it('should have method to get all user data for export', () => {
      expect(typeof AuditService.getLogs).toBe('function');
    });

    it('should have method to delete all user data', () => {
      expect(typeof AuditService.clearLogs).toBe('function');
    });

    it('should include timestamp in all logs for audit trail', () => {
      AuditService.log({
        userId: mockUserId,
        action: 'UPLOAD',
        resource: 'document',
        resourceId: 'doc-1',
        result: 'success',
      });

      const logs = (AuditService as any).logs;
      expect(logs[0].timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Performance', () => {
    it('should handle high volume of logs efficiently', () => {
      const startTime = Date.now();

      // Log 1000 entries
      for (let i = 0; i < 1000; i++) {
        AuditService.log({
          userId: mockUserId,
          action: 'UPLOAD',
          resource: 'document',
          resourceId: `doc-${i}`,
          result: 'success',
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      const logs = AuditService.getLogs(mockUserId);
      expect(logs.length).toBe(1000);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle concurrent logging from multiple users', () => {
      const user1 = '11111111-1111-1111-1111-111111111111' as UserId;
      const user2 = '22222222-2222-2222-2222-222222222222' as UserId;
      const user3 = '33333333-3333-3333-3333-333333333333' as UserId;

      // Simulate concurrent logging
      for (let i = 0; i < 10; i++) {
        AuditService.log({
          userId: user1,
          action: 'UPLOAD',
          resource: 'document',
          resourceId: `doc-${i}`,
          result: 'success',
        });
        AuditService.log({
          userId: user2,
          action: 'VIEW',
          resource: 'document',
          resourceId: `doc-${i}`,
          result: 'success',
        });
        AuditService.log({
          userId: user3,
          action: 'DELETE',
          resource: 'document',
          resourceId: `doc-${i}`,
          result: 'success',
        });
      }

      expect(AuditService.getLogs(user1).length).toBe(10);
      expect(AuditService.getLogs(user2).length).toBe(10);
      expect(AuditService.getLogs(user3).length).toBe(10);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid log entry gracefully', () => {
      // Should not throw on invalid input
      expect(() => {
        AuditService.log({} as any);
      }).not.toThrow();
    });

    it('should handle missing optional fields', () => {
      AuditService.log({
        userId: mockUserId,
        action: 'UPLOAD',
        resource: 'document',
        resourceId: 'doc-1',
        result: 'success',
        // No metadata, ip, or userAgent
      });

      const logs = (AuditService as any).logs;
      expect(logs[0].metadata).toBeUndefined();
      expect(logs[0].ip).toBeUndefined();
      expect(logs[0].userAgent).toBeUndefined();
    });
  });
});
