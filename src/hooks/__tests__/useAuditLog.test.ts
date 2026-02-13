/**
 * 🔱 ULTRA 2026 - Audit Logging Hook Tests
 * Comprehensive test suite for audit logging functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuditLog } from '../useAuditLog';
import { AuditService } from '@/lib/ultra';

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
    },
    loading: false,
    error: null,
    session: null,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    resetPassword: vi.fn(),
  }))
}));

// Mock AuditService
vi.mock('@/lib/ultra', () => ({
  AuditService: {
    log: vi.fn(),
    getLogs: vi.fn(() => []),
  }
}));

describe('useAuditLog', () => {
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000' as any,
    email: 'test@example.com' as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logDocumentUpload', () => {
    it('should log document upload with user context', async () => {
      const { result } = renderHook(() => useAuditLog());

      act(() => {
        result.current.logDocumentUpload('doc-123');
      });

      expect(AuditService.log).toHaveBeenCalledWith({
        userId: mockUser.id,
        action: 'UPLOAD',
        resource: 'document',
        resourceId: 'doc-123',
        result: 'success',
      });
    });

    it('should include optional metadata when provided', async () => {
      const { result } = renderHook(() => useAuditLog());

      act(() => {
        result.current.logDocumentUpload('doc-123', {
          metadata: { fileName: 'test.pdf', fileSize: 1024 }
        });
      });

      expect(AuditService.log).toHaveBeenCalledWith({
        userId: mockUser.id,
        action: 'UPLOAD',
        resource: 'document',
        resourceId: 'doc-123',
        result: 'success',
        metadata: { fileName: 'test.pdf', fileSize: 1024 }
      });
    });

    it('should include IP address when requested', async () => {
      const { result } = renderHook(() => useAuditLog());

      act(() => {
        result.current.logDocumentUpload('doc-123', { includeIP: true });
      });

      expect(AuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          ip: expect.any(String),
        })
      );
    });

    it('should include user agent when requested', async () => {
      const { result } = renderHook(() => useAuditLog());

      act(() => {
        result.current.logDocumentUpload('doc-123', { includeUserAgent: true });
      });

      expect(AuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userAgent: expect.any(String),
        })
      );
    });

    it('should not log if user is not authenticated', async () => {
      // Mock useAuth to return null user
      const { useAuth } = await import('@/hooks/useAuth');
      (useAuth as any).mockReturnValue({
        user: null,
        loading: false,
        error: null,
        session: null,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        resetPassword: vi.fn(),
      });

      const { result } = renderHook(() => useAuditLog());

      act(() => {
        result.current.logDocumentUpload('doc-123');
      });

      expect(AuditService.log).not.toHaveBeenCalled();

      // Restore original mock
      (useAuth as any).mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
        session: null,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        resetPassword: vi.fn(),
      });
    });
  });

  describe('logDocumentDelete', () => {
    it('should log document deletion', async () => {
      const { result } = renderHook(() => useAuditLog());

      act(() => {
        result.current.logDocumentDelete('doc-456');
      });

      expect(AuditService.log).toHaveBeenCalledWith({
        userId: mockUser.id,
        action: 'DELETE',
        resource: 'document',
        resourceId: 'doc-456',
        result: 'success',
      });
    });

    it('should log deletion with reason metadata', async () => {
      const { result } = renderHook(() => useAuditLog());

      act(() => {
        result.current.logDocumentDelete('doc-456', {
          metadata: { reason: 'duplicate', originalFileName: 'test.pdf' }
        });
      });

      expect(AuditService.log).toHaveBeenCalledWith({
        userId: mockUser.id,
        action: 'DELETE',
        resource: 'document',
        resourceId: 'doc-456',
        result: 'success',
        metadata: { reason: 'duplicate', originalFileName: 'test.pdf' }
      });
    });
  });

  describe('logDocumentView', () => {
    it('should log document view', async () => {
      const { result } = renderHook(() => useAuditLog());

      act(() => {
        result.current.logDocumentView('doc-789');
      });

      expect(AuditService.log).toHaveBeenCalledWith({
        userId: mockUser.id,
        action: 'VIEW',
        resource: 'document',
        resourceId: 'doc-789',
        result: 'success',
      });
    });
  });

  describe('logAIAnalysis', () => {
    it('should log AI analysis with cost and provider', async () => {
      const { result } = renderHook(() => useAuditLog());

      act(() => {
        result.current.logAIAnalysis('doc-999', 'gemini', 0.01, {
          metadata: { confidence: 95.5 }
        });
      });

      expect(AuditService.log).toHaveBeenCalledWith({
        userId: mockUser.id,
        action: 'AI_ANALYSIS',
        resource: 'document',
        resourceId: 'doc-999',
        result: 'success',
        metadata: {
          provider: 'gemini',
          cost: 0.01,
          confidence: 95.5,
        },
      });
    });

    it('should log AI analysis with metadata including error', async () => {
      const { result } = renderHook(() => useAuditLog());

      act(() => {
        result.current.logAIAnalysis('doc-999', 'gemini', 0, {
          metadata: { error: 'API timeout', confidence: 0 }
        });
      });

      expect(AuditService.log).toHaveBeenCalledWith({
        userId: mockUser.id,
        action: 'AI_ANALYSIS',
        resource: 'document',
        resourceId: 'doc-999',
        result: 'success',
        metadata: {
          provider: 'gemini',
          cost: 0,
          error: 'API timeout',
          confidence: 0,
        },
      });
    });

    it('should log AI analysis without optional metadata', async () => {
      const { result } = renderHook(() => useAuditLog());

      act(() => {
        result.current.logAIAnalysis('doc-999', 'siliconflow', 0.005);
      });

      expect(AuditService.log).toHaveBeenCalledWith({
        userId: mockUser.id,
        action: 'AI_ANALYSIS',
        resource: 'document',
        resourceId: 'doc-999',
        result: 'success',
        metadata: {
          provider: 'siliconflow',
          cost: 0.005,
        },
      });
    });
  });

  describe('logAuth', () => {
    it('should log successful login', async () => {
      const { result } = renderHook(() => useAuditLog());

      act(() => {
        result.current.logAuth('LOGIN');
      });

      expect(AuditService.log).toHaveBeenCalledWith({
        userId: mockUser.id,
        action: 'LOGIN',
        resource: 'auth',
        resourceId: mockUser.id,
        result: 'success',
      });
    });

    it('should log failed login attempt with metadata', async () => {
      const { result } = renderHook(() => useAuditLog());

      act(() => {
        result.current.logAuth('LOGIN', { 
          metadata: { error: 'Invalid credentials' },
          includeIP: true,
          includeUserAgent: true
        });
      });

      expect(AuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          action: 'LOGIN',
          resource: 'auth',
          resourceId: mockUser.id,
          result: 'success',
          metadata: { error: 'Invalid credentials' },
          ip: expect.any(String),
          userAgent: expect.any(String),
        })
      );
    });
  });

  describe('logError', () => {
    it('should log error events', async () => {
      const { result } = renderHook(() => useAuditLog());
      const testError = new Error('Test error');

      act(() => {
        result.current.logError('UPLOAD', 'document', 'doc-123', testError);
      });

      expect(AuditService.log).toHaveBeenCalledWith({
        userId: mockUser.id,
        action: 'UPLOAD',
        resource: 'document',
        resourceId: 'doc-123',
        result: 'failure',
        metadata: {
          error: 'Test error',
          stack: testError.stack,
        },
      });
    });
  });

  describe('getLogs', () => {
    it('should retrieve logs for current user', async () => {
      const mockLogs = [
        { timestamp: new Date(), userId: mockUser.id, action: 'UPLOAD', resource: 'document', resourceId: 'doc-1', result: 'success' },
        { timestamp: new Date(), userId: mockUser.id, action: 'VIEW', resource: 'document', resourceId: 'doc-2', result: 'success' },
      ];

      (AuditService.getLogs as any).mockReturnValue(mockLogs);

      const { result } = renderHook(() => useAuditLog());

      const logs = result.current.getLogs();

      expect(AuditService.getLogs).toHaveBeenCalledWith(mockUser.id);
      expect(logs).toEqual(mockLogs);
    });

    it('should return empty array if no user', async () => {
      // Mock useAuth to return null
      const { useAuth } = await import('@/hooks/useAuth');
      (useAuth as any).mockReturnValue({
        user: null,
        loading: false,
        error: null,
        session: null,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        resetPassword: vi.fn(),
      });

      const { result } = renderHook(() => useAuditLog());

      const logs = result.current.getLogs();

      expect(AuditService.getLogs).not.toHaveBeenCalled();
      expect(logs).toEqual([]);

      // Restore
      (useAuth as any).mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
        session: null,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        resetPassword: vi.fn(),
      });
    });
  });

  describe('clearLogs', () => {
    it('should log warning when clearLogs is called', async () => {
      const { result } = renderHook(() => useAuditLog());
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      act(() => {
        result.current.clearLogs();
      });

      expect(consoleSpy).toHaveBeenCalledWith('[AuditLog] Clear logs called - would require admin in production');

      consoleSpy.mockRestore();
    });
  });

  describe('exportLogs', () => {
    it('should export logs as JSON string', async () => {
      const mockLogs = [
        { timestamp: new Date().toISOString(), userId: mockUser.id, action: 'UPLOAD', resource: 'document', resourceId: 'doc-1', result: 'success' },
      ];

      (AuditService.getLogs as any).mockReturnValue(mockLogs);

      const { result } = renderHook(() => useAuditLog());

      const exportData = result.current.exportLogs();

      expect(AuditService.getLogs).toHaveBeenCalledWith(mockUser.id);
      expect(typeof exportData).toBe('string');
      const parsed = JSON.parse(exportData);
      expect(parsed).toEqual(mockLogs);
    });
  });

  describe('Integration Tests', () => {
    it('should maintain consistent state across multiple operations', async () => {
      const { result } = renderHook(() => useAuditLog());

      // Perform multiple operations
      act(() => {
        result.current.logDocumentUpload('doc-1');
        result.current.logDocumentView('doc-1');
        result.current.logAIAnalysis('doc-1', 'gemini', 0.01, { metadata: { confidence: 95.5 } });
        result.current.logDocumentDelete('doc-1');
      });

      // All should use same user ID
      const calls = (AuditService.log as any).mock.calls;
      expect(calls.length).toBe(4);
      
      calls.forEach(call => {
        expect(call[0].userId).toEqual(mockUser.id);
      });
    });

    it('should handle rapid sequential logging', async () => {
      const { result } = renderHook(() => useAuditLog());

      // Rapid sequential calls
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.logDocumentUpload(`doc-${i}`);
        }
      });

      expect(AuditService.log).toHaveBeenCalledTimes(10);
    });

    it('should expose all expected methods', async () => {
      const { result } = renderHook(() => useAuditLog());

      expect(result.current).toHaveProperty('logDocumentUpload');
      expect(result.current).toHaveProperty('logDocumentDelete');
      expect(result.current).toHaveProperty('logDocumentView');
      expect(result.current).toHaveProperty('logAIAnalysis');
      expect(result.current).toHaveProperty('logAuth');
      expect(result.current).toHaveProperty('logError');
      expect(result.current).toHaveProperty('getLogs');
      expect(result.current).toHaveProperty('exportLogs');
      expect(result.current).toHaveProperty('clearLogs');
      expect(result.current).toHaveProperty('isLogging');
    });
  });
});
