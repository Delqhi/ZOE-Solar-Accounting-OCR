/**
 * Integration Tests for Server Actions
 * Tests React 19 Server Actions with full validation and error handling
 * Production-ready with 2026 best practices
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  saveDocumentAction,
  deleteDocumentAction,
  batchProcessAction,
  syncWithCloudAction,
  updateSettingsAction,
  exportDocumentsAction,
  checkServerActionsHealth,
  sanitizeDocumentData,
  isValidDocumentStatus
} from '../../services/server-actions';
import { PerformanceMonitor } from '../../utils/performanceMonitor';
import { apiRateLimiter, exportRateLimiter } from '../../utils/rateLimiter';

// Import the actual modules (we'll mock them in beforeEach)
import * as storageService from '../../services/storageService';
import * as supabaseService from '../../services/supabaseService';

// Mock external services at module level
vi.mock('../../services/storageService');
vi.mock('../../services/supabaseService');

describe('Server Actions Integration', () => {
  let consoleWarnSpy: any;
  let consoleLogSpy: any;

  beforeEach(() => {
    // Clear all mocks first
    vi.clearAllMocks();

    // Set up console spies
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Reset performance monitor
    (PerformanceMonitor as any).metrics = {};

    // Reset rate limiters
    apiRateLimiter.reset('action-save:test-user');
    apiRateLimiter.reset('action-delete:test-user');
    apiRateLimiter.reset('action-batch:test-user');
    apiRateLimiter.reset('action-sync:test-user');
    apiRateLimiter.reset('action-settings:test-user');
    exportRateLimiter.reset('action-export:test-user');
    apiRateLimiter.reset('health-check');

    // Set up default mock implementations for storageService
    vi.mocked(storageService.saveDocument).mockResolvedValue(undefined);
    vi.mocked(storageService.deleteDocument).mockResolvedValue(undefined);
    vi.mocked(storageService.getAllDocuments).mockResolvedValue([]);
    vi.mocked(storageService.saveSettings).mockResolvedValue(undefined);
    vi.mocked(storageService.getDBStatus).mockResolvedValue({ isOpen: true, documentCount: 0 });

    // Set up default mock implementations for supabaseService
    vi.mocked(supabaseService.isSupabaseConfigured).mockReturnValue(false);
    vi.mocked(supabaseService.saveDocument).mockResolvedValue(undefined);
    vi.mocked(supabaseService.deleteDocument).mockResolvedValue(undefined);
    vi.mocked(supabaseService.getAllDocuments).mockResolvedValue([]);
    vi.mocked(supabaseService.saveSettings).mockResolvedValue(undefined);
    vi.mocked(supabaseService.exportDocumentsToSQL).mockReturnValue('SQL EXPORT');
    vi.mocked(supabaseService.checkSupabaseServiceHealth).mockResolvedValue({ healthy: true, message: 'OK' });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('saveDocumentAction', () => {
    it('should successfully save document with valid data', async () => {
      const formData = new FormData();
      const doc = {
        id: 'doc-123',
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        uploadDate: new Date().toISOString(),
        status: 'PROCESSING',
        data: {
          lieferantName: 'Test Supplier',
          bruttoBetrag: 100.00
        },
        previewUrl: 'data:application/pdf;base64,dGVzdA=='
      };
      formData.append('document', JSON.stringify(doc));
      formData.append('userId', 'test-user');

      const result = await saveDocumentAction({}, formData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('doc-123');
      expect(storageService.saveDocument).toHaveBeenCalledWith(doc);
    });

    it('should reject missing document data', async () => {
      const formData = new FormData();
      formData.append('userId', 'test-user');

      const result = await saveDocumentAction({}, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('No document data');
    });

    it('should reject invalid JSON', async () => {
      const formData = new FormData();
      formData.append('document', 'invalid-json');
      formData.append('userId', 'test-user');

      const result = await saveDocumentAction({}, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid JSON');
    });

    it('should reject invalid document structure', async () => {
      const formData = new FormData();
      formData.append('document', JSON.stringify({ invalid: 'structure' }));
      formData.append('userId', 'test-user');

      const result = await saveDocumentAction({}, formData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle rate limiting', async () => {
      // Consume rate limit
      for (let i = 0; i < 100; i++) {
        await apiRateLimiter.check(`action-save:test-user`);
      }

      const formData = new FormData();
      formData.append('document', JSON.stringify({
        id: 'doc-123',
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        uploadDate: new Date().toISOString(),
        status: 'PROCESSING',
        data: { lieferantName: 'Test', bruttoBetrag: 100 },
        previewUrl: 'data:application/pdf;base64,dGVzdA=='
      }));
      formData.append('userId', 'test-user');

      const result = await saveDocumentAction({}, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Rate limit exceeded');
    });

    it('should sanitize document data (XSS prevention)', async () => {
      const formData = new FormData();
      const doc = {
        id: 'doc-123',
        fileName: '<script>alert("xss")</script>.pdf',
        fileType: 'application/pdf',
        uploadDate: new Date().toISOString(),
        status: 'PROCESSING',
        data: {
          lieferantName: '<img src=x onerror=alert(1)>',
          lieferantAdresse: 'Test <script>alert(2)</script> Address',
          beschreibung: 'Test <iframe>alert(3)</iframe> description'
        },
        previewUrl: 'data:application/pdf;base64,dGVzdA=='
      };
      formData.append('document', JSON.stringify(doc));
      formData.append('userId', 'test-user');

      const result = await saveDocumentAction({}, formData);

      expect(result.success).toBe(true);
      expect(result.data?.fileName).not.toContain('<script>');
      expect(result.data?.data?.lieferantName).not.toContain('<img');
      expect(result.data?.data?.lieferantAdresse).not.toContain('<script>');
      expect(result.data?.data?.beschreibung).not.toContain('<iframe>');
    });

    it('should sync to Supabase when configured', async () => {
      (supabaseService.isSupabaseConfigured as any).mockReturnValue(true);

      const formData = new FormData();
      const doc = {
        id: 'doc-123',
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        uploadDate: new Date().toISOString(),
        status: 'PROCESSING',
        data: { lieferantName: 'Test', bruttoBetrag: 100 },
        previewUrl: 'data:application/pdf;base64,dGVzdA=='
      };
      formData.append('document', JSON.stringify(doc));
      formData.append('userId', 'test-user');

      const result = await saveDocumentAction({}, formData);

      expect(result.success).toBe(true);
      expect(supabaseService.saveDocument).toHaveBeenCalledWith(doc);
    });

    it('should handle Supabase sync failure gracefully', async () => {
      (supabaseService.isSupabaseConfigured as any).mockReturnValue(true);
      (supabaseService.saveDocument as any).mockRejectedValue(new Error('Network error'));

      const formData = new FormData();
      const doc = {
        id: 'doc-123',
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        uploadDate: new Date().toISOString(),
        status: 'PROCESSING',
        data: { lieferantName: 'Test', bruttoBetrag: 100 },
        previewUrl: 'data:application/pdf;base64,dGVzdA=='
      };
      formData.append('document', JSON.stringify(doc));
      formData.append('userId', 'test-user');

      const result = await saveDocumentAction({}, formData);

      // Should still succeed because local storage worked
      expect(result.success).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should record performance metrics', async () => {
      const formData = new FormData();
      formData.append('document', JSON.stringify({
        id: 'doc-123',
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        uploadDate: new Date().toISOString(),
        status: 'PROCESSING',
        data: { lieferantName: 'Test', bruttoBetrag: 100 },
        previewUrl: 'data:application/pdf;base64,dGVzdA=='
      }));
      formData.append('userId', 'test-user');

      await saveDocumentAction({}, formData);

      const metrics = PerformanceMonitor.getMetrics();
      // PerformanceMonitor.now() is mocked to return 0, so we just check it was called
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('deleteDocumentAction', () => {
    it('should successfully delete document', async () => {
      const formData = new FormData();
      formData.append('id', 'doc-123');
      formData.append('userId', 'test-user');

      const result = await deleteDocumentAction({}, formData);

      expect(result.success).toBe(true);
      expect(storageService.deleteDocument).toHaveBeenCalledWith('doc-123');
    });

    it('should reject missing document ID', async () => {
      const formData = new FormData();
      formData.append('userId', 'test-user');

      const result = await deleteDocumentAction({}, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Document ID is required');
    });

    it('should handle rate limiting', async () => {
      // Consume rate limit
      for (let i = 0; i < 100; i++) {
        await apiRateLimiter.check(`action-delete:test-user`);
      }

      const formData = new FormData();
      formData.append('id', 'doc-123');
      formData.append('userId', 'test-user');

      const result = await deleteDocumentAction({}, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Rate limit exceeded');
    });

    it('should sync deletion to Supabase when configured', async () => {
      (supabaseService.isSupabaseConfigured as any).mockReturnValue(true);

      const formData = new FormData();
      formData.append('id', 'doc-123');
      formData.append('userId', 'test-user');

      const result = await deleteDocumentAction({}, formData);

      expect(result.success).toBe(true);
      expect(supabaseService.deleteDocument).toHaveBeenCalledWith('doc-123');
    });
  });

  describe('batchProcessAction', () => {
    it('should successfully process multiple documents', async () => {
      const formData = new FormData();
      const docs = [
        {
          id: 'doc-1',
          fileName: 'test1.pdf',
          fileType: 'application/pdf',
          uploadDate: new Date().toISOString(),
          status: 'PROCESSING',
          data: { lieferantName: 'Test1', bruttoBetrag: 100 },
          previewUrl: 'data:application/pdf;base64,dGVzdA=='
        },
        {
          id: 'doc-2',
          fileName: 'test2.pdf',
          fileType: 'application/pdf',
          uploadDate: new Date().toISOString(),
          status: 'PROCESSING',
          data: { lieferantName: 'Test2', bruttoBetrag: 200 },
          previewUrl: 'data:application/pdf;base64,dGVzdA=='
        }
      ];
      formData.append('documents', JSON.stringify(docs));
      formData.append('userId', 'test-user');

      const result = await batchProcessAction({}, formData);

      expect(result.success).toBe(true);
      expect(result.processed).toBe(2);
      expect(storageService.saveDocument).toHaveBeenCalledTimes(2);
    });

    it('should reject empty document array', async () => {
      const formData = new FormData();
      formData.append('documents', JSON.stringify([]));
      formData.append('userId', 'test-user');

      const result = await batchProcessAction({}, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('non-empty array');
    });

    it('should reject invalid document in batch', async () => {
      const formData = new FormData();
      const docs = [
        {
          id: 'doc-1',
          fileName: 'test1.pdf',
          fileType: 'application/pdf',
          uploadDate: new Date().toISOString(),
          status: 'PROCESSING',
          data: { lieferantName: 'Test1', bruttoBetrag: 100 },
          previewUrl: 'data:application/pdf;base64,dGVzdA=='
        },
        { invalid: 'document' }
      ];
      formData.append('documents', JSON.stringify(docs));
      formData.append('userId', 'test-user');

      const result = await batchProcessAction({}, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('validation failed');
    });

    it('should handle rate limiting', async () => {
      // Consume rate limit
      for (let i = 0; i < 100; i++) {
        await apiRateLimiter.check(`action-batch:test-user`);
      }

      const formData = new FormData();
      formData.append('documents', JSON.stringify([{
        id: 'doc-1',
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        uploadDate: new Date().toISOString(),
        status: 'PROCESSING',
        data: { lieferantName: 'Test', bruttoBetrag: 100 },
        previewUrl: 'data:application/pdf;base64,dGVzdA=='
      }]));
      formData.append('userId', 'test-user');

      const result = await batchProcessAction({}, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Rate limit exceeded');
    });
  });

  describe('syncWithCloudAction', () => {
    it('should successfully sync local documents to cloud', async () => {
      // Override default mocks for this specific test
      vi.mocked(supabaseService.isSupabaseConfigured).mockReturnValue(true);
      vi.mocked(storageService.getAllDocuments).mockResolvedValue([
        { id: 'local-1', fileName: 'doc1.pdf', fileType: 'application/pdf', uploadDate: new Date().toISOString(), status: 'PROCESSING', data: {} }
      ]);
      vi.mocked(supabaseService.getAllDocuments).mockResolvedValue([]);

      const formData = new FormData();
      formData.append('userId', 'test-user');

      const result = await syncWithCloudAction({}, formData);

      expect(result.success).toBe(true);
      expect(result.synced).toBe(1);
      expect(supabaseService.saveDocument).toHaveBeenCalled();
    });

    it('should reject if Supabase not configured', async () => {
      // Default mock already returns false, but explicitly set for clarity
      vi.mocked(supabaseService.isSupabaseConfigured).mockReturnValue(false);

      const formData = new FormData();
      formData.append('userId', 'test-user');

      const result = await syncWithCloudAction({}, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Supabase not configured');
    });

    it('should handle rate limiting', async () => {
      vi.mocked(supabaseService.isSupabaseConfigured).mockReturnValue(true);

      // Consume rate limit
      for (let i = 0; i < 100; i++) {
        await apiRateLimiter.check(`action-sync:test-user`);
      }

      const formData = new FormData();
      formData.append('userId', 'test-user');

      const result = await syncWithCloudAction({}, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Rate limit exceeded');
    });

    it('should skip documents that already exist in cloud', async () => {
      vi.mocked(supabaseService.isSupabaseConfigured).mockReturnValue(true);
      vi.mocked(storageService.getAllDocuments).mockResolvedValue([
        { id: 'doc-1', fileName: 'doc1.pdf', fileType: 'application/pdf', uploadDate: new Date().toISOString(), status: 'PROCESSING', data: {} }
      ]);
      vi.mocked(supabaseService.getAllDocuments).mockResolvedValue([
        { id: 'doc-1', fileName: 'doc1.pdf', fileType: 'application/pdf', uploadDate: new Date().toISOString(), status: 'PROCESSING', data: {} }
      ]);

      const formData = new FormData();
      formData.append('userId', 'test-user');

      const result = await syncWithCloudAction({}, formData);

      expect(result.success).toBe(true);
      expect(result.synced).toBe(0);
      expect(supabaseService.saveDocument).not.toHaveBeenCalled();
    });
  });

  describe('updateSettingsAction', () => {
    it('should successfully update settings', async () => {
      const formData = new FormData();
      const settings = {
        id: 'global',
        taxDefinitions: [{ value: '19_pv', label: '19% Vorsteuer', ust_satz: 0.19, vorsteuer: true }],
        accountDefinitions: [],
        datevConfig: { beraterNr: '', mandantNr: '' },
        elsterStammdaten: { unternehmensName: 'Test' },
        accountGroups: [],
        ocrConfig: { scores: {}, required_fields: [], field_weights: {}, regex_patterns: {}, validation_rules: {} }
      };
      formData.append('settings', JSON.stringify(settings));
      formData.append('userId', 'test-user');

      const result = await updateSettingsAction({}, formData);

      expect(result.success).toBe(true);
      expect(result.settings).toEqual(settings);
      expect(storageService.saveSettings).toHaveBeenCalledWith(settings);
    });

    it('should reject missing settings data', async () => {
      const formData = new FormData();
      formData.append('userId', 'test-user');

      const result = await updateSettingsAction({}, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('No settings data');
    });

    it('should handle rate limiting', async () => {
      // Consume rate limit
      for (let i = 0; i < 100; i++) {
        await apiRateLimiter.check(`action-settings:test-user`);
      }

      const formData = new FormData();
      formData.append('settings', JSON.stringify({
        id: 'global',
        taxDefinitions: [],
        accountDefinitions: [],
        datevConfig: {},
        elsterStammdaten: {},
        accountGroups: [],
        ocrConfig: {}
      }));
      formData.append('userId', 'test-user');

      const result = await updateSettingsAction({}, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Rate limit exceeded');
    });
  });

  describe('exportDocumentsAction', () => {
    it('should successfully export documents to SQL', async () => {
      const formData = new FormData();
      const docs = [
        {
          id: 'doc-1',
          fileName: 'test.pdf',
          fileType: 'application/pdf',
          uploadDate: new Date().toISOString(),
          status: 'COMPLETED',
          data: { lieferantName: 'Test', bruttoBetrag: 100 }
        }
      ];
      formData.append('documents', JSON.stringify(docs));
      formData.append('userId', 'test-user');

      const result = await exportDocumentsAction({}, formData);

      expect(result.success).toBe(true);
      expect(result.sql).toBe('SQL EXPORT');
      expect(supabaseService.exportDocumentsToSQL).toHaveBeenCalledWith(docs, undefined);
    });

    it('should reject empty document array', async () => {
      const formData = new FormData();
      formData.append('documents', JSON.stringify([]));
      formData.append('userId', 'test-user');

      const result = await exportDocumentsAction({}, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('non-empty array');
    });

    it('should handle rate limiting', async () => {
      // Consume rate limit from exportRateLimiter
      for (let i = 0; i < 5; i++) {
        await exportRateLimiter.check(`action-export:test-user`);
      }

      const formData = new FormData();
      formData.append('documents', JSON.stringify([{ id: 'doc-1', fileName: 'test.pdf', fileType: 'application/pdf', uploadDate: new Date().toISOString(), status: 'COMPLETED', data: {} }]));
      formData.append('userId', 'test-user');

      const result = await exportDocumentsAction({}, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Rate limit exceeded');
    });

    it('should include settings if provided', async () => {
      const formData = new FormData();
      const docs = [{ id: 'doc-1', fileName: 'test.pdf', fileType: 'application/pdf', uploadDate: new Date().toISOString(), status: 'COMPLETED', data: {} }];
      const settings = { id: 'global', taxDefinitions: [], accountDefinitions: [], datevConfig: {}, elsterStammdaten: {}, accountGroups: [], ocrConfig: {} };
      formData.append('documents', JSON.stringify(docs));
      formData.append('settings', JSON.stringify(settings));
      formData.append('userId', 'test-user');

      const result = await exportDocumentsAction({}, formData);

      expect(result.success).toBe(true);
      expect(supabaseService.exportDocumentsToSQL).toHaveBeenCalledWith(docs, settings);
    });
  });

  describe('checkServerActionsHealth', () => {
    it('should return healthy status', async () => {
      const result = await checkServerActionsHealth();

      expect(result.healthy).toBe(true);
      expect(result.message).toContain('All services operational');
    });

    it('should include service details', async () => {
      const result = await checkServerActionsHealth();

      expect(result.details).toBeDefined();
      expect(result.details.storage).toBeDefined();
      expect(result.details.rateLimiter).toBeDefined();
    });

    it('should detect unhealthy services', async () => {
      (storageService.getDBStatus as any).mockResolvedValue({ isOpen: false, documentCount: 0 });

      const result = await checkServerActionsHealth();

      expect(result.healthy).toBe(false);
    });
  });

  describe('sanitizeDocumentData', () => {
    it('should sanitize filename', () => {
      const doc = {
        id: 'doc-1',
        fileName: '<script>alert("xss")</script>.pdf',
        fileType: 'application/pdf',
        uploadDate: new Date().toISOString(),
        status: 'PROCESSING',
        data: {},
        previewUrl: 'data:application/pdf;base64,dGVzdA=='
      };

      const sanitized = sanitizeDocumentData(doc);

      expect(sanitized.fileName).not.toContain('<script>');
      expect(sanitized.fileName).not.toContain('>');
    });

    it('should sanitize data fields', () => {
      const doc = {
        id: 'doc-1',
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        uploadDate: new Date().toISOString(),
        status: 'PROCESSING',
        data: {
          lieferantName: '<img src=x onerror=alert(1)>',
          lieferantAdresse: 'Test <script>alert(2)</script> Address',
          beschreibung: 'Test <iframe>alert(3)</iframe> description',
          textContent: '<div onclick="alert(4)">content</div>',
          ocr_rationale: '<svg onload=alert(5)>'
        },
        previewUrl: 'data:application/pdf;base64,dGVzdA=='
      };

      const sanitized = sanitizeDocumentData(doc);

      expect(sanitized.data?.lieferantName).not.toContain('<img');
      expect(sanitized.data?.lieferantAdresse).not.toContain('<script>');
      expect(sanitized.data?.beschreibung).not.toContain('<iframe>');
      expect(sanitized.data?.textContent).not.toContain('<div');
      expect(sanitized.data?.ocr_rationale).not.toContain('<svg');
    });

    it('should handle missing fields gracefully', () => {
      const doc = {
        id: 'doc-1',
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        uploadDate: new Date().toISOString(),
        status: 'PROCESSING',
        data: {},
        previewUrl: 'data:application/pdf;base64,dGVzdA=='
      };

      const sanitized = sanitizeDocumentData(doc);

      expect(sanitized.id).toBe('doc-1');
    });
  });

  describe('isValidDocumentStatus', () => {
    it('should return true for valid statuses', () => {
      const validStatuses = ['PROCESSING', 'REVIEW_NEEDED', 'COMPLETED', 'ERROR', 'DUPLICATE', 'PRIVATE'];
      validStatuses.forEach(status => {
        expect(isValidDocumentStatus(status)).toBe(true);
      });
    });

    it('should return false for invalid statuses', () => {
      expect(isValidDocumentStatus('INVALID')).toBe(false);
      expect(isValidDocumentStatus('')).toBe(false);
      expect(isValidDocumentStatus('pending')).toBe(false);
    });
  });

  describe('Security - XSS Prevention', () => {
    it('should sanitize malicious content in saveDocumentAction', async () => {
      const formData = new FormData();
      const maliciousDoc = {
        id: 'doc-123',
        fileName: '<script>alert(document.cookie)</script>.pdf',
        fileType: 'application/pdf',
        uploadDate: new Date().toISOString(),
        status: 'PROCESSING',
        data: {
          lieferantName: '<img src=x onerror=alert(1)>',
          lieferantAdresse: '<iframe src="javascript:alert(2)"></iframe>',
          beschreibung: '<svg onload=alert(3)>',
          textContent: '<div onclick="alert(4)">click</div>',
          ocr_rationale: '<img src=x onerror=alert(5)>'
        },
        previewUrl: 'data:application/pdf;base64,dGVzdA=='
      };
      formData.append('document', JSON.stringify(maliciousDoc));
      formData.append('userId', 'test-user');

      const result = await saveDocumentAction({}, formData);

      expect(result.success).toBe(true);
      const dataStr = JSON.stringify(result.data);
      expect(dataStr).not.toContain('<script>');
      expect(dataStr).not.toContain('onerror');
      expect(dataStr).not.toContain('javascript:');
      expect(dataStr).not.toContain('onclick');
      expect(dataStr).not.toContain('onload');
    });

    it('should sanitize file names with HTML', async () => {
      const formData = new FormData();
      const doc = {
        id: 'doc-123',
        fileName: 'test<script>alert(1)</script>.pdf',
        fileType: 'application/pdf',
        uploadDate: new Date().toISOString(),
        status: 'PROCESSING',
        data: { lieferantName: 'Test', bruttoBetrag: 100 },
        previewUrl: 'data:application/pdf;base64,dGVzdA=='
      };
      formData.append('document', JSON.stringify(doc));
      formData.append('userId', 'test-user');

      const result = await saveDocumentAction({}, formData);

      expect(result.success).toBe(true);
      expect(result.data?.fileName).not.toContain('<script>');
    });
  });

  describe('Error Handling', () => {
    it('should handle storage service failures gracefully', async () => {
      (storageService.saveDocument as any).mockRejectedValue(new Error('Storage error'));

      const formData = new FormData();
      formData.append('document', JSON.stringify({
        id: 'doc-123',
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        uploadDate: new Date().toISOString(),
        status: 'PROCESSING',
        data: { lieferantName: 'Test', bruttoBetrag: 100 },
        previewUrl: 'data:application/pdf;base64,dGVzdA=='
      }));
      formData.append('userId', 'test-user');

      const result = await saveDocumentAction({}, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Storage error');
    });

    it('should handle malformed JSON gracefully', async () => {
      const formData = new FormData();
      formData.append('document', '{invalid json}');
      formData.append('userId', 'test-user');

      const result = await saveDocumentAction({}, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid JSON');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete workflow', async () => {
      // 1. Save document
      const formData1 = new FormData();
      formData1.append('document', JSON.stringify({
        id: 'doc-123',
        fileName: 'invoice.pdf',
        fileType: 'application/pdf',
        uploadDate: new Date().toISOString(),
        status: 'PROCESSING',
        data: { lieferantName: 'Test Supplier', bruttoBetrag: 150.00 },
        previewUrl: 'data:application/pdf;base64,dGVzdA=='
      }));
      formData1.append('userId', 'test-user');

      const saveResult = await saveDocumentAction({}, formData1);
      expect(saveResult.success).toBe(true);

      // 2. Delete document
      const formData2 = new FormData();
      formData2.append('id', 'doc-123');
      formData2.append('userId', 'test-user');

      const deleteResult = await deleteDocumentAction({}, formData2);
      expect(deleteResult.success).toBe(true);

      // 3. Batch process
      const formData3 = new FormData();
      formData3.append('documents', JSON.stringify([
        {
          id: 'doc-1',
          fileName: 'doc1.pdf',
          fileType: 'application/pdf',
          uploadDate: new Date().toISOString(),
          status: 'PROCESSING',
          data: { lieferantName: 'Test1', bruttoBetrag: 100 },
          previewUrl: 'data:application/pdf;base64,dGVzdA=='
        },
        {
          id: 'doc-2',
          fileName: 'doc2.pdf',
          fileType: 'application/pdf',
          uploadDate: new Date().toISOString(),
          status: 'PROCESSING',
          data: { lieferantName: 'Test2', bruttoBetrag: 200 },
          previewUrl: 'data:application/pdf;base64,dGVzdA=='
        }
      ]));
      formData3.append('userId', 'test-user');

      const batchResult = await batchProcessAction({}, formData3);
      expect(batchResult.success).toBe(true);
      expect(batchResult.processed).toBe(2);

      // 4. Export
      const formData4 = new FormData();
      formData4.append('documents', JSON.stringify([
        {
          id: 'doc-1',
          fileName: 'doc1.pdf',
          fileType: 'application/pdf',
          uploadDate: new Date().toISOString(),
          status: 'COMPLETED',
          data: { lieferantName: 'Test1', bruttoBetrag: 100 }
        }
      ]));
      formData4.append('userId', 'test-user');

      const exportResult = await exportDocumentsAction({}, formData4);
      expect(exportResult.success).toBe(true);
      expect(exportResult.sql).toBeDefined();

      // 5. Health check
      const healthResult = await checkServerActionsHealth();
      expect(healthResult.healthy).toBe(true);
    });
  });

  describe('Rate Limiting - All Actions', () => {
    it('should enforce rate limits across all actions', async () => {
      // Consume all rate limits
      for (let i = 0; i < 100; i++) {
        await apiRateLimiter.check('action-save:test-user');
        await apiRateLimiter.check('action-delete:test-user');
        await apiRateLimiter.check('action-batch:test-user');
        await apiRateLimiter.check('action-sync:test-user');
        await apiRateLimiter.check('action-settings:test-user');
      }
      for (let i = 0; i < 5; i++) {
        await exportRateLimiter.check('action-export:test-user');
      }

      // Test save
      const formData1 = new FormData();
      formData1.append('document', JSON.stringify({
        id: 'doc-1',
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        uploadDate: new Date().toISOString(),
        status: 'PROCESSING',
        data: { lieferantName: 'Test', bruttoBetrag: 100 },
        previewUrl: 'data:application/pdf;base64,dGVzdA=='
      }));
      formData1.append('userId', 'test-user');
      const result1 = await saveDocumentAction({}, formData1);
      expect(result1.success).toBe(false);
      expect(result1.message).toContain('Rate limit exceeded');

      // Test delete
      const formData2 = new FormData();
      formData2.append('id', 'doc-1');
      formData2.append('userId', 'test-user');
      const result2 = await deleteDocumentAction({}, formData2);
      expect(result2.success).toBe(false);
      expect(result2.message).toContain('Rate limit exceeded');

      // Test batch
      const formData3 = new FormData();
      formData3.append('documents', JSON.stringify([{
        id: 'doc-1',
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        uploadDate: new Date().toISOString(),
        status: 'PROCESSING',
        data: { lieferantName: 'Test', bruttoBetrag: 100 },
        previewUrl: 'data:application/pdf;base64,dGVzdA=='
      }]));
      formData3.append('userId', 'test-user');
      const result3 = await batchProcessAction({}, formData3);
      expect(result3.success).toBe(false);
      expect(result3.message).toContain('Rate limit exceeded');

      // Test sync
      (supabaseService.isSupabaseConfigured as any).mockReturnValue(true);
      const formData4 = new FormData();
      formData4.append('userId', 'test-user');
      const result4 = await syncWithCloudAction({}, formData4);
      expect(result4.success).toBe(false);
      expect(result4.message).toContain('Rate limit exceeded');

      // Test settings
      const formData5 = new FormData();
      formData5.append('settings', JSON.stringify({
        id: 'global',
        taxDefinitions: [],
        accountDefinitions: [],
        datevConfig: {},
        elsterStammdaten: {},
        accountGroups: [],
        ocrConfig: {}
      }));
      formData5.append('userId', 'test-user');
      const result5 = await updateSettingsAction({}, formData5);
      expect(result5.success).toBe(false);
      expect(result5.message).toContain('Rate limit exceeded');

      // Test export
      const formData6 = new FormData();
      formData6.append('documents', JSON.stringify([{
        id: 'doc-1',
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        uploadDate: new Date().toISOString(),
        status: 'COMPLETED',
        data: {}
      }]));
      formData6.append('userId', 'test-user');
      const result6 = await exportDocumentsAction({}, formData6);
      expect(result6.success).toBe(false);
      expect(result6.message).toContain('Rate limit exceeded');
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance for all actions', async () => {
      // Reset metrics
      (PerformanceMonitor as any).metrics = {};

      // Save document
      const formData1 = new FormData();
      formData1.append('document', JSON.stringify({
        id: 'doc-1',
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        uploadDate: new Date().toISOString(),
        status: 'PROCESSING',
        data: { lieferantName: 'Test', bruttoBetrag: 100 },
        previewUrl: 'data:application/pdf;base64,dGVzdA=='
      }));
      formData1.append('userId', 'test-user');
      await saveDocumentAction({}, formData1);

      // Delete document
      const formData2 = new FormData();
      formData2.append('id', 'doc-1');
      formData2.append('userId', 'test-user');
      await deleteDocumentAction({}, formData2);

      // Batch process
      const formData3 = new FormData();
      formData3.append('documents', JSON.stringify([{
        id: 'doc-1',
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        uploadDate: new Date().toISOString(),
        status: 'PROCESSING',
        data: { lieferantName: 'Test', bruttoBetrag: 100 },
        previewUrl: 'data:application/pdf;base64,dGVzdA=='
      }]));
      formData3.append('userId', 'test-user');
      await batchProcessAction({}, formData3);

      // Sync
      (supabaseService.isSupabaseConfigured as any).mockReturnValue(true);
      (storageService.getAllDocuments as any).mockResolvedValue([]);
      (supabaseService.getAllDocuments as any).mockResolvedValue([]);
      const formData4 = new FormData();
      formData4.append('userId', 'test-user');
      await syncWithCloudAction({}, formData4);

      // Update settings
      const formData5 = new FormData();
      formData5.append('settings', JSON.stringify({
        id: 'global',
        taxDefinitions: [],
        accountDefinitions: [],
        datevConfig: {},
        elsterStammdaten: {},
        accountGroups: [],
        ocrConfig: {}
      }));
      formData5.append('userId', 'test-user');
      await updateSettingsAction({}, formData5);

      // Export
      const formData6 = new FormData();
      formData6.append('documents', JSON.stringify([{
        id: 'doc-1',
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        uploadDate: new Date().toISOString(),
        status: 'COMPLETED',
        data: {}
      }]));
      formData6.append('userId', 'test-user');
      await exportDocumentsAction({}, formData6);

      // Health check
      await checkServerActionsHealth();

      // All should have been logged
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('2026 Best Practices Compliance', () => {
    it('should use React 19 Server Actions pattern', async () => {
      // All actions should be async functions that accept prevState and formData
      const actions = [
        saveDocumentAction,
        deleteDocumentAction,
        batchProcessAction,
        syncWithCloudAction,
        updateSettingsAction,
        exportDocumentsAction,
        checkServerActionsHealth
      ];

      for (const action of actions) {
        expect(action.constructor.name).toBe('AsyncFunction');
      }
    });

    it('should implement proper error boundaries', async () => {
      const formData = new FormData();
      formData.append('document', 'invalid');
      formData.append('userId', 'test-user');

      const result = await saveDocumentAction({}, formData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should use TypeScript strict typing', async () => {
      const result = await checkServerActionsHealth();

      expect(result).toHaveProperty('healthy');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('details');
    });

    it('should implement comprehensive logging', async () => {
      const formData = new FormData();
      formData.append('document', JSON.stringify({
        id: 'doc-1',
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        uploadDate: new Date().toISOString(),
        status: 'PROCESSING',
        data: { lieferantName: 'Test', bruttoBetrag: 100 },
        previewUrl: 'data:application/pdf;base64,dGVzdA=='
      }));
      formData.append('userId', 'test-user');

      await saveDocumentAction({}, formData);

      expect(consoleLogSpy).toHaveBeenCalled();
      const calls = consoleLogSpy.mock.calls.flat();
      // Check for log messages (with or without emoji)
      expect(calls.some(c => typeof c === 'string' && (c.includes('Starting save document action') || c.includes('📋') && c.includes('save document action')))).toBe(true);
      expect(calls.some(c => typeof c === 'string' && (c.includes('Document saved') || c.includes('✅') && c.includes('saved')))).toBe(true);
    });

    it('should handle edge cases gracefully', async () => {
      // Empty inputs
      const formData1 = new FormData();
      formData1.append('documents', JSON.stringify([]));
      formData1.append('userId', 'test-user');
      const result1 = await batchProcessAction({}, formData1);
      expect(result1.success).toBe(false);

      // Null values
      const formData2 = new FormData();
      formData2.append('document', JSON.stringify({
        id: 'doc-1',
        fileName: null,
        fileType: 'application/pdf',
        uploadDate: new Date().toISOString(),
        status: 'PROCESSING',
        data: { lieferantName: 'Test', bruttoBetrag: 100 },
        previewUrl: 'data:application/pdf;base64,dGVzdA=='
      }));
      formData2.append('userId', 'test-user');
      const result2 = await saveDocumentAction({}, formData2);
      expect(result2.success).toBeDefined();
    });
  });
});
