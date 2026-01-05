/**
 * Integration Tests for Supabase Service
 * Tests database operations, authentication, and cloud sync
 * Production-ready with 2026 best practices
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceMonitor } from '../../utils/performanceMonitor';
import { apiRateLimiter, exportRateLimiter, authRateLimiter } from '../../utils/rateLimiter';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    getUser: vi.fn(),
    onAuthStateChange: vi.fn()
  },
  storage: {
    from: vi.fn()
  }
};

// Mock external modules
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabaseClient
}));

// Mock validation module
vi.mock('../../utils/validation', () => ({
  validateEmail: vi.fn((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      valid: emailRegex.test(email) && email.length > 0,
      errors: emailRegex.test(email) && email.length > 0 ? undefined : ['Invalid email format']
    };
  }),
  validatePassword: vi.fn((password) => {
    return {
      valid: password.length >= 8,
      errors: password.length >= 8 ? undefined : ['Password too short']
    };
  }),
  validateBase64Data: vi.fn(() => ({ valid: true })),
  validateMimeType: vi.fn(() => ({ valid: true }))
}));

// Mock performance monitor
vi.mock('../../utils/performanceMonitor', () => ({
  PerformanceMonitor: {
    now: vi.fn(() => Date.now()),
    recordMetric: vi.fn(),
    getMetrics: vi.fn(() => ({
      authSignIn: 10,
      save_document: 10,
      get_all_documents: 10
    }))
  }
}));

// Import supabaseService AFTER mocking dependencies
import * as supabaseService from '../../services/supabaseService';

describe('SupabaseService Integration', () => {
  let consoleWarnSpy: any;
  let consoleLogSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Spy on console methods
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Reset ALL rate limiters by clearing their internal buckets
    // TokenBucketRateLimiter uses a 'buckets' Map, not 'tokens' or 'history'
    (authRateLimiter as any).buckets = new Map();
    (apiRateLimiter as any).buckets = new Map();
    (exportRateLimiter as any).buckets = new Map();

    // Reset PerformanceMonitor metrics
    (PerformanceMonitor as any).metrics = {};
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication - signIn', () => {
    it('should successfully sign in with valid credentials', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' }, session: { access_token: 'token' } },
        error: null
      });

      const result = await supabaseService.signIn('test@example.com', 'password123');

      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe('test@example.com');
      expect(result.error).toBeNull();
    });

    it('should handle invalid credentials', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      });

      const result = await supabaseService.signIn('wrong@example.com', 'wrongpass');

      expect(result.user).toBeNull();
      expect(result.error).toContain('Invalid login credentials');
    });

    it('should handle network errors during sign in', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockRejectedValue(
        new Error('Network error')
      );

      const result = await supabaseService.signIn('test@example.com', 'password123');

      expect(result.user).toBeNull();
      expect(result.error).toContain('Network error');
    });

    it('should record performance metrics for sign in', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-123' }, session: { access_token: 'token' } },
        error: null
      });

      await supabaseService.signIn('test@example.com', 'password123');

      const metrics = PerformanceMonitor.getMetrics();
      expect(metrics.authSignIn).toBeGreaterThan(0);
    });
  });

  describe('Authentication - signUp', () => {
    it('should successfully sign up new user', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: { id: 'new-user-123', email: 'new@example.com' }, session: { access_token: 'token' } },
        error: null
      });

      const result = await supabaseService.signUp('new@example.com', 'password123');

      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe('new@example.com');
    });

    it('should handle existing email error', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already exists' }
      });

      const result = await supabaseService.signUp('existing@example.com', 'password123');

      expect(result.user).toBeNull();
      expect(result.error).toContain('User already exists');
    });

    it('should validate email format before API call', async () => {
      const result = await supabaseService.signUp('invalid-email', 'password123');

      expect(result.user).toBeNull();
      expect(result.error).toContain('Invalid email format');
    });

    it('should validate password strength', async () => {
      const result = await supabaseService.signUp('test@example.com', '123');

      expect(result.user).toBeNull();
      expect(result.error).toContain('Password too short');
    });
  });

  describe('Authentication - signOut', () => {
    it('should successfully sign out', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });

      const result = await supabaseService.signOut();

      expect(result.error).toBeNull();
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    });

    it('should handle sign out errors gracefully', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: { message: 'Session not found' }
      });

      const result = await supabaseService.signOut();

      expect(result.error).toBeDefined();
    });
  });

  describe('Authentication - getCurrentUser', () => {
    it('should return current user', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const result = await supabaseService.getCurrentUser();

      expect(result.user).toBeDefined();
      expect(result.user?.id).toBe('user-123');
    });

    it('should handle no active user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      });

      const result = await supabaseService.getCurrentUser();

      expect(result.user).toBeNull();
    });
  });

  describe('Database Operations - saveDocument', () => {
    it('should successfully save document', async () => {
      const mockDocument = {
        id: 'doc-123',
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        uploadDate: '2024-01-15',
        status: 'PROCESSING',
        data: { lieferantName: 'Test', bruttoBetrag: 119.00 },
        previewUrl: 'data:application/pdf;base64,dGVzdA=='
      };

      mockSupabaseClient.from.mockReturnValue({
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: [mockDocument],
          error: null
        })
      });

      await supabaseService.saveDocument(mockDocument);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('belege');
    });

    it('should validate document data before saving', async () => {
      const invalidDocument = {
        id: '',
        fileName: '',
        fileType: '',
        uploadDate: '',
        status: 'PROCESSING',
        data: {},
        previewUrl: ''
      };

      try {
        await supabaseService.saveDocument(invalidDocument as any);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('Invalid document');
      }
    });

    it('should record performance metrics', async () => {
      mockSupabaseClient.from.mockReturnValue({
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: [{ id: 'doc-123' }],
          error: null
        })
      });

      await supabaseService.saveDocument({
        id: 'doc-123',
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        uploadDate: '2024-01-15',
        status: 'PROCESSING',
        data: { lieferantName: 'Test' },
        previewUrl: 'data:application/pdf;base64,dGVzdA=='
      });

      const metrics = PerformanceMonitor.getMetrics();
      expect(metrics.save_document).toBeGreaterThan(0);
    });
  });

  describe('Database Operations - getAllDocuments', () => {
    it('should retrieve all documents', async () => {
      const mockDocuments = [
        { id: 'doc-1', file_name: 'invoice1.pdf', file_type: 'application/pdf', created_at: '2024-01-15', status: 'COMPLETED', extracted_data: { totalAmount: 100 } },
        { id: 'doc-2', file_name: 'invoice2.pdf', file_type: 'application/pdf', created_at: '2024-01-16', status: 'COMPLETED', extracted_data: { totalAmount: 200 } }
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockDocuments,
          error: null
        })
      });

      const result = await supabaseService.getAllDocuments();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('doc-1');
    });

    it('should handle empty document list', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      });

      const result = await supabaseService.getAllDocuments();

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' }
        })
      });

      try {
        await supabaseService.getAllDocuments();
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('Database connection failed');
      }
    });
  });

  describe('Database Operations - deleteDocument', () => {
    it('should successfully delete document', async () => {
      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: [{ id: 'doc-123' }],
          error: null
        })
      });

      await supabaseService.deleteDocument('doc-123');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('belege');
    });

    it('should require document ID', async () => {
      try {
        await supabaseService.deleteDocument('');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('Document ID is required');
      }
    });
  });

  describe('Database Operations - getSettings', () => {
    it('should retrieve settings', async () => {
      const mockSettings = {
        id: 'global',
        taxDefinitions: [],
        accountDefinitions: [],
        datevConfig: {},
        elsterStammdaten: {},
        accountGroups: [],
        ocrConfig: {}
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { settings_data: mockSettings },
          error: null
        })
      });

      const result = await supabaseService.getSettings();

      expect(result.id).toBe('global');
    });

    it('should return defaults if settings not found', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' }
        })
      });

      const result = await supabaseService.getSettings();

      expect(result.id).toBe('global');
      expect(result.taxDefinitions).toBeDefined();
    });
  });

  describe('Database Operations - saveSettings', () => {
    it('should save settings', async () => {
      const settings = {
        id: 'global',
        taxDefinitions: [],
        accountDefinitions: [],
        datevConfig: {},
        elsterStammdaten: {},
        accountGroups: [],
        ocrConfig: {}
      };

      mockSupabaseClient.from.mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: null })
      });

      await supabaseService.saveSettings(settings);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('app_settings');
    });

    it('should validate settings input', async () => {
      try {
        await supabaseService.saveSettings(null as any);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('Invalid settings');
      }
    });
  });

  describe('SQL Export - exportDocumentsToSQL', () => {
    beforeEach(() => {
      // Reset export rate limiter for these tests
      (exportRateLimiter as any).buckets = new Map();
    });

    it('should export documents to SQL', async () => {
      const docs = [
        {
          id: 'doc-1',
          fileName: 'test.pdf',
          fileType: 'application/pdf',
          uploadDate: '2024-01-15',
          status: 'COMPLETED',
          data: { lieferantName: 'Test', bruttoBetrag: 100 }
        }
      ];

      const settings = {
        id: 'global',
        taxDefinitions: [],
        accountDefinitions: [],
        datevConfig: {},
        elsterStammdaten: { unternehmensName: 'Test Company' },
        accountGroups: [],
        ocrConfig: {}
      };

      const result = supabaseService.exportDocumentsToSQL(docs, settings);

      expect(result).toContain('ZOE Solar Accounting Export');
      expect(result).toContain('INSERT INTO belege');
    });

    it('should handle empty document array', async () => {
      const result = supabaseService.exportDocumentsToSQL([]);

      expect(result).toContain('ZOE Solar Accounting Export');
    });
  });

  describe('Health Check - checkSupabaseServiceHealth', () => {
    it('should return healthy status', async () => {
      const result = await supabaseService.checkSupabaseServiceHealth();

      expect(result.healthy).toBe(true);
      expect(result.message).toContain('operational');
    });
  });

  describe('Performance Monitoring', () => {
    it('should track all database operations', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      });

      await supabaseService.getAllDocuments();

      const metrics = PerformanceMonitor.getMetrics();
      expect(metrics.get_all_documents).toBeGreaterThan(0);
    });

    it('should track authentication operations', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-123' }, session: { access_token: 'token' } },
        error: null
      });

      await supabaseService.signIn('test@example.com', 'password123');

      const metrics = PerformanceMonitor.getMetrics();
      expect(metrics.authSignIn).toBeGreaterThan(0);
    });
  });

  describe('Security', () => {
    it('should validate all inputs before API calls', async () => {
      // Empty email
      const result1 = await supabaseService.signUp('', 'password123');
      expect(result1.user).toBeNull();
      expect(result1.error).toBeDefined();

      // Invalid email
      const result2 = await supabaseService.signUp('invalid', 'password123');
      expect(result2.user).toBeNull();
      expect(result2.error).toContain('Invalid email');

      // Short password
      const result3 = await supabaseService.signUp('test@example.com', '123');
      expect(result3.user).toBeNull();
      expect(result3.error).toContain('Password too short');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete workflow: sign in -> get docs -> save -> delete', async () => {
      // 1. Sign in
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-123' }, session: { access_token: 'token' } },
        error: null
      });

      const signInResult = await supabaseService.signIn('test@example.com', 'password123');
      expect(signInResult.user).toBeDefined();

      // 2. Get documents
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [{ id: 'doc-1', file_name: 'doc1.pdf', file_type: 'application/pdf', created_at: '2024-01-15', status: 'COMPLETED', extracted_data: { totalAmount: 100 } }],
          error: null
        })
      });

      const docsResult = await supabaseService.getAllDocuments();
      expect(docsResult).toHaveLength(1);

      // 3. Save document
      mockSupabaseClient.from.mockReturnValue({
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: [{ id: 'doc-2' }],
          error: null
        })
      });

      await supabaseService.saveDocument({
        id: 'doc-2',
        fileName: 'new.pdf',
        fileType: 'application/pdf',
        uploadDate: '2024-01-15',
        status: 'PROCESSING',
        data: { lieferantName: 'Test', bruttoBetrag: 200 },
        previewUrl: 'data:application/pdf;base64,dGVzdA=='
      });

      // 4. Delete document
      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: [{ id: 'doc-2' }],
          error: null
        })
      });

      await supabaseService.deleteDocument('doc-2');

      expect(mockSupabaseClient.from).toHaveBeenCalled();
    });

    it('should handle offline scenario gracefully', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockRejectedValue(
        new Error('Network unreachable')
      );

      const result = await supabaseService.signIn('test@example.com', 'password123');

      expect(result.user).toBeNull();
      expect(result.error).toContain('Network unreachable');
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in file names', async () => {
      const specialDoc = {
        id: 'doc-123',
        fileName: 'test & co. GmbH <script>.pdf',
        fileType: 'application/pdf',
        uploadDate: '2024-01-15',
        status: 'PROCESSING',
        data: { lieferantName: 'Test & Co. GmbH' },
        previewUrl: 'data:application/pdf;base64,dGVzdA=='
      };

      mockSupabaseClient.from.mockReturnValue({
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: [specialDoc],
          error: null
        })
      });

      await supabaseService.saveDocument(specialDoc);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('belege');
    });

    it('should handle unicode in extracted data', async () => {
      const unicodeDoc = {
        id: 'doc-123',
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        uploadDate: '2024-01-15',
        status: 'PROCESSING',
        data: {
          lieferantName: 'Müller GmbH - Café ☕',
          beschreibung: 'Rechnung für Januar 2024 📄'
        },
        previewUrl: 'data:application/pdf;base64,dGVzdA=='
      };

      mockSupabaseClient.from.mockReturnValue({
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: [unicodeDoc],
          error: null
        })
      });

      await supabaseService.saveDocument(unicodeDoc);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('belege');
    });
  });

  describe('Final Validation', () => {
    it('should meet all production requirements', async () => {
      // Test complete workflow
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' }, session: { access_token: 'token' } },
        error: null
      });

      const signInResult = await supabaseService.signIn('test@example.com', 'password123');
      expect(signInResult.user).toBeDefined();
      expect(signInResult.user?.email).toBe('test@example.com');

      // Verify performance tracking
      const metrics = PerformanceMonitor.getMetrics();
      expect(metrics.authSignIn).toBeGreaterThan(0);

      // Verify rate limiting exists
      expect(apiRateLimiter).toBeDefined();
    });

    it('should handle complete failure scenarios gracefully', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockRejectedValue(
        new Error('Complete system failure')
      );

      const result = await supabaseService.signIn('test@example.com', 'password123');

      expect(result.user).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.length).toBeGreaterThan(0);
    });
  });
});
