import { describe, it, expect, beforeEach, vi } from 'vitest';
import { syncWithCloudAction } from '../services/server-actions';
import * as storageService from '../services/storageService';
import * as supabaseService from '../services/supabaseService';

// Mock external services
vi.mock('../services/storageService', () => ({
  saveDocument: vi.fn(),
  deleteDocument: vi.fn(),
  getAllDocuments: vi.fn().mockResolvedValue([]),
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

describe('Debug syncWithCloudAction - Step by Step', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks to default state
    vi.mocked(storageService.getAllDocuments).mockResolvedValue([]);
    vi.mocked(supabaseService.isSupabaseConfigured).mockReturnValue(false);
    vi.mocked(supabaseService.getAllDocuments).mockResolvedValue([]);
  });

  it('should show what happens during sync', async () => {
    console.log('\n=== DEBUG TEST START ===');

    // Step 1: Check initial mock state
    console.log('1. Initial mock state:');
    console.log('   isSupabaseConfigured:', supabaseService.isSupabaseConfigured);
    console.log('   getAllDocuments:', storageService.getAllDocuments);

    // Step 2: Set up spies
    const isConfiguredSpy = vi.spyOn(supabaseService, 'isSupabaseConfigured').mockReturnValue(true);
    const localDocsSpy = vi.spyOn(storageService, 'getAllDocuments').mockResolvedValue([
      { id: 'local-1', fileName: 'doc1.pdf', fileType: 'application/pdf', uploadDate: new Date().toISOString(), status: 'PROCESSING', data: {} }
    ]);
    const cloudDocsSpy = vi.spyOn(supabaseService, 'getAllDocuments').mockResolvedValue([]);

    console.log('2. After vi.spyOn:');
    console.log('   isSupabaseConfigured:', supabaseService.isSupabaseConfigured);
    console.log('   getAllDocuments:', storageService.getAllDocuments);
    console.log('   isConfiguredSpy:', isConfiguredSpy);
    console.log('   localDocsSpy:', localDocsSpy);
    console.log('   cloudDocsSpy:', cloudDocsSpy);

    // Step 3: Call the function
    const formData = new FormData();
    formData.append('userId', 'test-user');

    console.log('3. Calling syncWithCloudAction...');
    const result = await syncWithCloudAction({}, formData);

    console.log('4. Result:', result);
    console.log('5. Mock call counts:');
    console.log('   storageService.getAllDocuments calls:', (storageService.getAllDocuments as any).mock?.calls?.length || 'undefined');
    console.log('   supabaseService.isSupabaseConfigured calls:', (supabaseService.isSupabaseConfigured as any).mock?.calls?.length || 'undefined');
    console.log('   supabaseService.getAllDocuments calls:', (supabaseService.getAllDocuments as any).mock?.calls?.length || 'undefined');
    console.log('   supabaseService.saveDocument calls:', (supabaseService.saveDocument as any).mock?.calls?.length || 'undefined');

    console.log('=== DEBUG TEST END ===\n');

    expect(result.success).toBe(true);
    expect(result.synced).toBe(1);
  });
});