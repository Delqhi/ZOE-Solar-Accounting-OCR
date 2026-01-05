import { describe, it, expect, beforeEach, vi } from 'vitest';
import { syncWithCloudAction } from '../services/server-actions';
import { PerformanceMonitor } from '../utils/performanceMonitor';
import { apiRateLimiter } from '../utils/rateLimiter';
import * as storageService from '../services/storageService';
import * as supabaseService from '../services/supabaseService';

vi.mock('../services/storageService', () => ({
  saveDocument: vi.fn(),
  deleteDocument: vi.fn(),
  getAllDocuments: vi.fn(),
  saveSettings: vi.fn(),
  getDBStatus: vi.fn().mockResolvedValue({ isOpen: true, documentCount: 0 })
}));

vi.mock('../services/supabaseService', () => ({
  isSupabaseConfigured: vi.fn().mockReturnValue(false),
  saveDocument: vi.fn(),
  deleteDocument: vi.fn(),
  getAllDocuments: vi.fn().mockResolvedValue([]),
  saveSettings: vi.fn(),
  exportDocumentsToSQL: vi.fn().mockReturnValue('SQL EXPORT'),
  checkSupabaseServiceHealth: vi.fn().mockResolvedValue({ healthy: true, message: 'OK' })
}));

describe('Debug syncWithCloudAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (PerformanceMonitor as any).metrics = {};
    apiRateLimiter.reset('action-sync:test-user');
  });

  it('should successfully sync local documents to cloud', async () => {
    console.log('Before vi.spyOn:');
    console.log('  isSupabaseConfigured:', supabaseService.isSupabaseConfigured);
    console.log('  getAllDocuments:', storageService.getAllDocuments);

    vi.spyOn(supabaseService, 'isSupabaseConfigured').mockReturnValue(true);
    vi.spyOn(storageService, 'getAllDocuments').mockResolvedValue([
      { id: 'local-1', fileName: 'doc1.pdf', fileType: 'application/pdf', uploadDate: new Date().toISOString(), status: 'PROCESSING', data: {} }
    ]);
    vi.spyOn(supabaseService, 'getAllDocuments').mockResolvedValue([]);

    console.log('After vi.spyOn:');
    console.log('  isSupabaseConfigured:', supabaseService.isSupabaseConfigured);
    console.log('  getAllDocuments:', storageService.getAllDocuments);

    const formData = new FormData();
    formData.append('userId', 'test-user');

    console.log('Before action call...');
    const result = await syncWithCloudAction({}, formData);

    console.log('Result:', result);
    console.log('storageService.getAllDocuments called:', (storageService.getAllDocuments as any).mock.calls);
    console.log('supabaseService.getAllDocuments called:', (supabaseService.getAllDocuments as any).mock.calls);
    console.log('supabaseService.saveDocument called:', (supabaseService.saveDocument as any).mock.calls);

    expect(result.success).toBe(true);
    expect(result.synced).toBe(1);
  });
});
