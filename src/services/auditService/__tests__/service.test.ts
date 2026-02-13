import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuditService } from '../service';
import type { AuditAction } from '../types';

describe('AuditService', () => {
  beforeEach(() => {
    // Reset singleton
    // @ts-ignore - accessing private property for testing
    AuditService.instance = undefined;
    localStorage.clear();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = AuditService.getInstance();
      const instance2 = AuditService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should accept config', () => {
      const instance = AuditService.getInstance({
        maxBatchSize: 100,
        flushInterval: 60000
      });

      expect(instance).toBeDefined();
    });
  });

  describe('log', () => {
    it('should create log entry', () => {
      const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      AuditService.log({
        userId: 'user-123',
        action: 'UPLOAD' as AuditAction,
        resource: 'document',
        resourceId: 'doc-456',
        result: 'success'
      });

      const logs = AuditService.getLogsForUser('user-123');
      expect(logs).toHaveLength(1);
      expect(logs[0].userId).toBe('user-123');
      expect(logs[0].action).toBe('UPLOAD');
      expect(logs[0].resource).toBe('document');

      logSpy.mockRestore();
    });

    it('should generate unique IDs', () => {
      AuditService.log({
        userId: 'user-123',
        action: 'UPLOAD' as AuditAction,
        resource: 'document',
        resourceId: 'doc-1',
        result: 'success'
      });

      AuditService.log({
        userId: 'user-123',
        action: 'UPLOAD' as AuditAction,
        resource: 'document',
        resourceId: 'doc-2',
        result: 'success'
      });

      const logs = AuditService.getLogsForUser('user-123');
      expect(logs[0].id).not.toBe(logs[1].id);
    });

    it('should set timestamp', () => {
      const before = new Date();

      AuditService.log({
        userId: 'user-123',
        action: 'UPLOAD' as AuditAction,
        resource: 'document',
        resourceId: 'doc-456',
        result: 'success'
      });

      const after = new Date();
      const logs = AuditService.getLogsForUser('user-123');

      expect(logs[0].timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(logs[0].timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('getLogsForUser', () => {
    it('should filter logs by user', () => {
      AuditService.log({
        userId: 'user-1',
        action: 'UPLOAD' as AuditAction,
        resource: 'document',
        resourceId: 'doc-1',
        result: 'success'
      });

      AuditService.log({
        userId: 'user-2',
        action: 'UPLOAD' as AuditAction,
        resource: 'document',
        resourceId: 'doc-2',
        result: 'success'
      });

      const user1Logs = AuditService.getLogsForUser('user-1');
      expect(user1Logs).toHaveLength(1);
      expect(user1Logs[0].userId).toBe('user-1');
    });

    it('should sort by timestamp descending', () => {
      AuditService.log({
        userId: 'user-1',
        action: 'UPLOAD' as AuditAction,
        resource: 'document',
        resourceId: 'doc-1',
        result: 'success'
      });

      // Small delay
      vi.advanceTimersByTime(100);

      AuditService.log({
        userId: 'user-1',
        action: 'DELETE' as AuditAction,
        resource: 'document',
        resourceId: 'doc-2',
        result: 'success'
      });

      const logs = AuditService.getLogsForUser('user-1');
      expect(logs[0].action).toBe('DELETE');
      expect(logs[1].action).toBe('UPLOAD');
    });

    it('should respect limit', () => {
      for (let i = 0; i < 10; i++) {
        AuditService.log({
          userId: 'user-1',
          action: 'UPLOAD' as AuditAction,
          resource: 'document',
          resourceId: `doc-${i}`,
          result: 'success'
        });
      }

      const logs = AuditService.getLogsForUser('user-1', 5);
      expect(logs).toHaveLength(5);
    });
  });

  describe('getLogsForResource', () => {
    it('should filter by resource and ID', () => {
      AuditService.log({
        userId: 'user-1',
        action: 'VIEW' as AuditAction,
        resource: 'document',
        resourceId: 'doc-456',
        result: 'success'
      });

      AuditService.log({
        userId: 'user-2',
        action: 'VIEW' as AuditAction,
        resource: 'document',
        resourceId: 'doc-789',
        result: 'success'
      });

      const logs = AuditService.getLogsForResource('document', 'doc-456');
      expect(logs).toHaveLength(1);
      expect(logs[0].resourceId).toBe('doc-456');
    });
  });

  describe('getLogsByAction', () => {
    it('should filter by action type', () => {
      AuditService.log({
        userId: 'user-1',
        action: 'UPLOAD' as AuditAction,
        resource: 'document',
        resourceId: 'doc-1',
        result: 'success'
      });

      AuditService.log({
        userId: 'user-1',
        action: 'DELETE' as AuditAction,
        resource: 'document',
        resourceId: 'doc-2',
        result: 'success'
      });

      AuditService.log({
        userId: 'user-1',
        action: 'UPLOAD' as AuditAction,
        resource: 'document',
        resourceId: 'doc-3',
        result: 'success'
      });

      const uploadLogs = AuditService.getLogsByAction('UPLOAD' as AuditAction);
      expect(uploadLogs).toHaveLength(2);
    });
  });

  describe('cleanup', () => {
    it('should remove old logs', () => {
      // Create a log
      AuditService.log({
        userId: 'user-1',
        action: 'UPLOAD' as AuditAction,
        resource: 'document',
        resourceId: 'doc-1',
        result: 'success'
      });

      // Set retention to 0 days
      const instance = AuditService.getInstance({ retentionDays: 0 });

      // Cleanup should remove the log
      AuditService.cleanup();

      const logs = AuditService.getLogsForUser('user-1');
      expect(logs).toHaveLength(0);
    });
  });
});