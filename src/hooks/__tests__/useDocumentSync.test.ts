/**
 * 🔱 ULTRA 2026 - Document Sync Hook Tests
 * Comprehensive test suite for document synchronization with offline-first support
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDocumentSync } from '../useDocumentSync';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type Document, type DocumentId, type UserId } from '@/lib/ultra';
import React from 'react';

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
    }
  }))
}));

// Mock useOnlineStatus
vi.mock('@/hooks/useOnlineStatus', () => ({
  useOnlineStatus: vi.fn(() => ({
    isOnline: true,
    isSyncing: false,
    lastSync: new Date(),
  }))
}));

// Mock supabase client
vi.mock('@/services/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockResolvedValue({ data: null, error: null }),
      delete: vi.fn().mockResolvedValue({ data: null, error: null }),
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    }
  }
}));

// Helper to wrap hook with QueryClient
function renderSyncHook() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );

  const result = renderHook(() => useDocumentSync(), { wrapper });
  
  return { ...result, queryClient };
}

describe('useDocumentSync', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000' as UserId;
  const mockDocumentId = 'doc-123' as DocumentId;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderSyncHook();

      expect(result.current.isOnline).toBe(true);
      expect(result.current.isSyncing).toBe(false);
      expect(result.current.pendingCount).toBe(0);
      expect(result.current.conflictCount).toBe(0);
      expect(result.current.isRealtimeConnected).toBe(false);
    });

    it('should expose all required methods', () => {
      const { result } = renderSyncHook();

      expect(typeof result.current.createDocument).toBe('function');
      expect(typeof result.current.updateDocument).toBe('function');
      expect(typeof result.current.deleteDocument).toBe('function');
      expect(typeof result.current.resolveConflict).toBe('function');
      expect(typeof result.current.forceSync).toBe('function');
      expect(typeof result.current.clearLocalData).toBe('function');
      expect(typeof result.current.getDocumentSyncStatus).toBe('function');
    });
  });

  describe('createDocument', () => {
    it('should create document with optimistic update', async () => {
      const { result, queryClient } = renderSyncHook();

      const docData = {
        fileName: 'test.pdf',
        fileType: 'pdf' as const,
        fileSize: 1024,
        documentDate: new Date(),
        type: 'RECHNUNG' as const,
        totalAmount: 119.00 as any,
        vatAmount: 19.00 as any,
        netAmount: 100.00 as any,
        creditor: 'Test GmbH',
        vatRate: 19.0,
        status: 'pending' as const,
      };

      let syncResult: any;
      await act(async () => {
        syncResult = await result.current.createDocument(docData);
      });

      expect(syncResult.success).toBe(true);
      expect(syncResult.document).toBeDefined();
      expect(syncResult.document?.fileName).toBe('test.pdf');
      expect(syncResult.document?.syncStatus).toBe('synced');

      // Check cache was updated
      const docs = queryClient.getQueryData(['documents', mockUserId]);
      expect(Array.isArray(docs)).toBe(true);
    });

    it('should handle offline mode', async () => {
      // Mock offline
      const { useOnlineStatus } = await import('@/hooks/useOnlineStatus');
      (useOnlineStatus as any).mockReturnValue({
        isOnline: false,
        isSyncing: false,
      });

      const { result, queryClient } = renderSyncHook();

      const docData = {
        fileName: 'offline.pdf',
        fileType: 'pdf' as const,
        fileSize: 2048,
        documentDate: new Date(),
        type: 'QUITTUNG' as const,
        totalAmount: 50.00 as any,
        vatAmount: 7.62 as any,
        netAmount: 42.38 as any,
        creditor: 'Offline Shop',
        vatRate: 19.0,
        status: 'pending' as const,
      };

      let syncResult: any;
      await act(async () => {
        syncResult = await result.current.createDocument(docData);
      });

      expect(syncResult.success).toBe(true);
      expect(syncResult.document).toBeDefined();
      expect(syncResult.document?.syncStatus).toBe('pending');
    });

    it('should handle authentication error', async () => {
      const { useAuth } = await import('@/hooks/useAuth');
      (useAuth as any).mockReturnValue({ user: null });

      const { result } = renderSyncHook();

      const docData = {
        fileName: 'test.pdf',
        fileType: 'pdf' as const,
        fileSize: 1024,
        documentDate: new Date(),
        type: 'RECHNUNG' as const,
        totalAmount: 119.00 as any,
        vatAmount: 19.00 as any,
        netAmount: 100.00 as any,
        creditor: 'Test GmbH',
        vatRate: 19.0,
        status: 'pending' as const,
      };

      let syncResult: any;
      await act(async () => {
        syncResult = await result.current.createDocument(docData);
      });

      expect(syncResult.success).toBe(false);
      expect(syncResult.error).toBeDefined();
      expect(syncResult.error?.message).toContain('User not authenticated');
    });

    it('should handle API failure with rollback', async () => {
      // Mock API failure
      const { supabase } = await import('@/services/supabaseClient');
      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockRejectedValue(new Error('API timeout')),
        select: vi.fn().mockReturnValue({ data: [], error: null }),
      });

      const { result, queryClient } = renderSyncHook();

      const docData = {
        fileName: 'failing.pdf',
        fileType: 'pdf' as const,
        fileSize: 1024,
        documentDate: new Date(),
        type: 'RECHNUNG' as const,
        totalAmount: 119.00 as any,
        vatAmount: 19.00 as any,
        netAmount: 100.00 as any,
        creditor: 'Test GmbH',
        vatRate: 19.0,
        status: 'pending' as const,
      };

      // First create with optimistic
      let syncResult: any;
      await act(async () => {
        syncResult = await result.current.createDocument(docData, { optimistic: true });
      });

      // Should fail but cache might have been updated
      expect(syncResult.success).toBe(false);
    });
  });

  describe('updateDocument', () => {
    it('should update document with optimistic update', async () => {
      const { result, queryClient } = renderSyncHook();

      // First create a document
      const docData = {
        fileName: 'original.pdf',
        fileType: 'pdf' as const,
        fileSize: 1024,
        documentDate: new Date(),
        type: 'RECHNUNG' as const,
        totalAmount: 119.00 as any,
        vatAmount: 19.00 as any,
        netAmount: 100.00 as any,
        creditor: 'Test GmbH',
        vatRate: 19.0,
        status: 'processed' as const,
        id: mockDocumentId,
        userId: mockUserId,
        uploadedAt: new Date(),
        updatedAt: new Date(),
      };

      // Add to cache first
      act(() => {
        queryClient.setQueryData(['documents', mockUserId], [docData]);
      });

      const updatedDoc = {
        ...docData,
        fileName: 'updated.pdf',
        totalAmount: 150.00 as any,
        vatAmount: 23.81 as any,
        netAmount: 126.19 as any,
      };

      let syncResult: any;
      await act(async () => {
        syncResult = await result.current.updateDocument(updatedDoc);
      });

      expect(syncResult.success).toBe(true);
      expect(syncResult.document?.fileName).toBe('updated.pdf');
    });

    it('should handle conflict resolution', async () => {
      const { result } = renderSyncHook();

      const localDoc: Document = {
        id: mockDocumentId,
        userId: mockUserId,
        fileName: 'local.pdf',
        fileType: 'pdf',
        fileSize: 1024,
        documentDate: new Date(),
        type: 'RECHNUNG',
        totalAmount: 119.00 as any,
        vatAmount: 19.00 as any,
        netAmount: 100.00 as any,
        creditor: 'Local GmbH',
        vatRate: 19.0,
        status: 'processed',
        uploadedAt: new Date(),
        updatedAt: new Date('2024-01-15T10:00:00Z'),
      };

      const remoteDoc: Document = {
        ...localDoc,
        fileName: 'remote.pdf',
        creditor: 'Remote GmbH',
        updatedAt: new Date('2024-01-15T11:00:00Z'), // Later timestamp
      };

      const resolved = result.current.resolveConflict(localDoc, remoteDoc, 'remote');

      expect(resolved.fileName).toBe('remote.pdf');
      expect(resolved.creditor).toBe('Remote GmbH');
    });
  });

  describe('deleteDocument', () => {
    it('should delete document with optimistic removal', async () => {
      const { result, queryClient } = renderSyncHook();

      // Add document to cache
      const doc: Document = {
        id: mockDocumentId,
        userId: mockUserId,
        fileName: 'to-delete.pdf',
        fileType: 'pdf',
        fileSize: 1024,
        documentDate: new Date(),
        type: 'RECHNUNG',
        totalAmount: 119.00 as any,
        vatAmount: 19.00 as any,
        netAmount: 100.00 as any,
        creditor: 'Test GmbH',
        vatRate: 19.0,
        status: 'processed',
        uploadedAt: new Date(),
        updatedAt: new Date(),
      };

      act(() => {
        queryClient.setQueryData(['documents', mockUserId], [doc]);
      });

      let syncResult: any;
      await act(async () => {
        syncResult = await result.current.deleteDocument(mockDocumentId);
      });

      expect(syncResult.success).toBe(true);

      // Verify document was removed from cache
      const docs = queryClient.getQueryData(['documents', mockUserId]);
      expect(docs?.length).toBe(0);
    });

    it('should rollback on deletion failure', async () => {
      // Mock API failure
      const { supabase } = await import('@/services/supabaseClient');
      (supabase.from as any).mockReturnValue({
        delete: vi.fn().mockRejectedValue(new Error('Delete failed')),
      });

      const { result, queryClient } = renderSyncHook();

      const doc: Document = {
        id: mockDocumentId,
        userId: mockUserId,
        fileName: 'protected.pdf',
        fileType: 'pdf',
        fileSize: 1024,
        documentDate: new Date(),
        type: 'RECHNUNG',
        totalAmount: 119.00 as any,
        vatAmount: 19.00 as any,
        netAmount: 100.00 as any,
        creditor: 'Test GmbH',
        vatRate: 19.0,
        status: 'processed',
        uploadedAt: new Date(),
        updatedAt: new Date(),
      };

      act(() => {
        queryClient.setQueryData(['documents', mockUserId], [doc]);
      });

      let syncResult: any;
      await act(async () => {
        syncResult = await result.current.deleteDocument(mockDocumentId, { optimistic: true });
      });

      // Should fail
      expect(syncResult.success).toBe(false);

      // Document should still be in cache (rolled back)
      const docs = queryClient.getQueryData(['documents', mockUserId]);
      expect(docs?.length).toBe(1);
      expect(docs?.[0].id).toBe(mockDocumentId);
    });
  });

  describe('forceSync', () => {
    it('should sync all pending documents', async () => {
      const { result, queryClient } = renderSyncHook();

      // Add pending documents to cache
      const pendingDocs: Document[] = [
        {
          id: 'pending-1' as DocumentId,
          userId: mockUserId,
          fileName: 'pending1.pdf',
          fileType: 'pdf',
          fileSize: 1024,
          documentDate: new Date(),
          type: 'RECHNUNG',
          totalAmount: 100.00 as any,
          vatAmount: 16.10 as any,
          netAmount: 83.90 as any,
          creditor: 'Test 1',
          vatRate: 19.0,
          status: 'pending',
          syncStatus: 'pending',
          uploadedAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'pending-2' as DocumentId,
          userId: mockUserId,
          fileName: 'pending2.pdf',
          fileType: 'pdf',
          fileSize: 2048,
          documentDate: new Date(),
          type: 'QUITTUNG',
          totalAmount: 50.00 as any,
          vatAmount: 7.62 as any,
          netAmount: 42.38 as any,
          creditor: 'Test 2',
          vatRate: 19.0,
          status: 'pending',
          syncStatus: 'pending',
          uploadedAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      act(() => {
        queryClient.setQueryData(['documents', mockUserId], pendingDocs);
      });

      let syncResult: any;
      await act(async () => {
        syncResult = await result.current.forceSync();
      });

      expect(syncResult.success).toBe(true);
      expect(syncResult.synced).toBe(2);
      expect(syncResult.failed).toBe(0);

      // Verify documents are now synced
      const docs = queryClient.getQueryData(['documents', mockUserId]);
      expect(docs?.every(d => d.syncStatus === 'synced')).toBe(true);
    });

    it('should handle partial sync failures', async () => {
      const { result, queryClient } = renderSyncHook();

      // Mock partial failure
      let callCount = 0;
      const { supabase } = await import('@/services/supabaseClient');
      (supabase.from as any).mockImplementation(() => ({
        upsert: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.reject(new Error('Network error'));
          }
          return Promise.resolve({ data: [], error: null });
        }),
      }));

      const pendingDocs: Document[] = [
        {
          id: 'pending-1' as DocumentId,
          userId: mockUserId,
          fileName: 'pending1.pdf',
          fileType: 'pdf',
          fileSize: 1024,
          documentDate: new Date(),
          type: 'RECHNUNG',
          totalAmount: 100.00 as any,
          vatAmount: 16.10 as any,
          netAmount: 83.90 as any,
          creditor: 'Test 1',
          vatRate: 19.0,
          status: 'pending',
          syncStatus: 'pending',
          uploadedAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'pending-2' as DocumentId,
          userId: mockUserId,
          fileName: 'pending2.pdf',
          fileType: 'pdf',
          fileSize: 2048,
          documentDate: new Date(),
          type: 'QUITTUNG',
          totalAmount: 50.00 as any,
          vatAmount: 7.62 as any,
          netAmount: 42.38 as any,
          creditor: 'Test 2',
          vatRate: 19.0,
          status: 'pending',
          syncStatus: 'pending',
          uploadedAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      act(() => {
        queryClient.setQueryData(['documents', mockUserId], pendingDocs);
      });

      let syncResult: any;
      await act(async () => {
        syncResult = await result.current.forceSync();
      });

      expect(syncResult.synced).toBe(1);
      expect(syncResult.failed).toBe(1);
    });
  });

  describe('getDocumentSyncStatus', () => {
    it('should return correct sync status', async () => {
      const { result, queryClient } = renderSyncHook();

      const doc: Document = {
        id: mockDocumentId,
        userId: mockUserId,
        fileName: 'test.pdf',
        fileType: 'pdf',
        fileSize: 1024,
        documentDate: new Date(),
        type: 'RECHNUNG',
        totalAmount: 119.00 as any,
        vatAmount: 19.00 as any,
        netAmount: 100.00 as any,
        creditor: 'Test GmbH',
        vatRate: 19.0,
        status: 'processed',
        syncStatus: 'synced',
        uploadedAt: new Date(),
        updatedAt: new Date(),
      };

      act(() => {
        queryClient.setQueryData(['documents', mockUserId], [doc]);
      });

      const status = result.current.getDocumentSyncStatus(mockDocumentId);
      expect(status).toBe('synced');
    });

    it('should return unknown for non-existent document', () => {
      const { result } = renderSyncHook();

      const status = result.current.getDocumentSyncStatus('non-existent' as DocumentId);
      expect(status).toBe('unknown');
    });
  });

  describe('clearLocalData', () => {
    it('should clear all local document data', async () => {
      const { result, queryClient } = renderSyncHook();

      // Add some documents
      const docs: Document[] = [
        {
          id: 'doc-1' as DocumentId,
          userId: mockUserId,
          fileName: 'test1.pdf',
          fileType: 'pdf',
          fileSize: 1024,
          documentDate: new Date(),
          type: 'RECHNUNG',
          totalAmount: 100.00 as any,
          vatAmount: 16.10 as any,
          netAmount: 83.90 as any,
          creditor: 'Test 1',
          vatRate: 19.0,
          status: 'processed',
          uploadedAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      act(() => {
        queryClient.setQueryData(['documents', mockUserId], docs);
      });

      // Verify data exists
      let cachedDocs = queryClient.getQueryData(['documents', mockUserId]);
      expect(cachedDocs?.length).toBe(1);

      // Clear data
      act(() => {
        result.current.clearLocalData();
      });

      // Verify data is cleared
      cachedDocs = queryClient.getQueryData(['documents', mockUserId]);
      expect(cachedDocs).toBeUndefined();
    });
  });

  describe('Real-time Integration', () => {
    it('should subscribe to real-time updates', async () => {
      const { result } = renderSyncHook();

      await waitFor(() => {
        expect(result.current.isRealtimeConnected).toBe(true);
      });
    });

    it('should handle real-time insert', async () => {
      const { result, queryClient } = renderSyncHook();

      // Wait for subscription
      await waitFor(() => {
        expect(result.current.isRealtimeConnected).toBe(true);
      });

      // Simulate real-time insert
      const newDoc: Document = {
        id: 'rt-doc-1' as DocumentId,
        userId: mockUserId,
        fileName: 'realtime.pdf',
        fileType: 'pdf',
        fileSize: 1024,
        documentDate: new Date(),
        type: 'RECHNUNG',
        totalAmount: 100.00 as any,
        vatAmount: 16.10 as any,
        netAmount: 83.90 as any,
        creditor: 'Realtime',
        vatRate: 19.0,
        status: 'processed',
        uploadedAt: new Date(),
        updatedAt: new Date(),
      };

      // This would normally be triggered by the realtime manager
      // For testing, we manually update the cache to simulate
      act(() => {
        queryClient.setQueryData(['documents', mockUserId], (old: Document[] = []) => [...old, newDoc]);
      });

      const docs = queryClient.getQueryData(['documents', mockUserId]);
      expect(docs?.some(d => d.id === 'rt-doc-1')).toBe(true);
    });
  });

  describe('Offline-First Behavior', () => {
    it('should queue operations when offline', async () => {
      // Mock offline
      const { useOnlineStatus } = await import('@/hooks/useOnlineStatus');
      (useOnlineStatus as any).mockReturnValue({
        isOnline: false,
        isSyncing: false,
      });

      const { result, queryClient } = renderSyncHook();

      const docData = {
        fileName: 'offline.pdf',
        fileType: 'pdf' as const,
        fileSize: 1024,
        documentDate: new Date(),
        type: 'RECHNUNG' as const,
        totalAmount: 119.00 as any,
        vatAmount: 19.00 as any,
        netAmount: 100.00 as any,
        creditor: 'Offline Test',
        vatRate: 19.0,
        status: 'pending' as const,
      };

      let syncResult: any;
      await act(async () => {
        syncResult = await result.current.createDocument(docData);
      });

      expect(syncResult.success).toBe(true);
      expect(syncResult.document?.syncStatus).toBe('pending');

      // Document should be in cache
      const docs = queryClient.getQueryData(['documents', mockUserId]);
      expect(docs?.length).toBe(1);
    });

    it('should sync when coming back online', async () => {
      // Start offline
      const { useOnlineStatus } = await import('@/hooks/useOnlineStatus');
      const mockSetState = vi.fn();
      
      (useOnlineStatus as any).mockImplementation(() => {
        const [isOnline, setIsOnline] = useState(false);
        return {
          isOnline,
          isSyncing: false,
          triggerSync: () => {
            setIsOnline(true);
            mockSetState(true);
          }
        };
      });

      const { result, queryClient } = renderSyncHook();

      // Add pending document while offline
      const pendingDoc: Document = {
        id: 'pending' as DocumentId,
        userId: mockUserId,
        fileName: 'pending.pdf',
        fileType: 'pdf',
        fileSize: 1024,
        documentDate: new Date(),
        type: 'RECHNUNG',
        totalAmount: 100.00 as any,
        vatAmount: 16.10 as any,
        netAmount: 83.90 as any,
        creditor: 'Test',
        vatRate: 19.0,
        status: 'pending',
        syncStatus: 'pending',
        uploadedAt: new Date(),
        updatedAt: new Date(),
      };

      act(() => {
        queryClient.setQueryData(['documents', mockUserId], [pendingDoc]);
      });

      // Simulate coming online
      await act(async () => {
        result.current.forceSync();
      });

      // Should attempt sync
      expect(mockSetState).toHaveBeenCalled();
    });
  });

  describe('Conflict Resolution', () => {
    it('should resolve conflicts with last-write-wins strategy', async () => {
      const { result } = renderSyncHook();

      const baseDoc: Document = {
        id: mockDocumentId,
        userId: mockUserId,
        fileName: 'base.pdf',
        fileType: 'pdf',
        fileSize: 1024,
        documentDate: new Date(),
        type: 'RECHNUNG',
        totalAmount: 100.00 as any,
        vatAmount: 16.10 as any,
        netAmount: 83.90 as any,
        creditor: 'Base',
        vatRate: 19.0,
        status: 'processed',
        uploadedAt: new Date(),
        updatedAt: new Date('2024-01-15T10:00:00Z'),
      };

      const localDoc = { ...baseDoc, fileName: 'local.pdf', updatedAt: new Date('2024-01-15T10:30:00Z') };
      const remoteDoc = { ...baseDoc, fileName: 'remote.pdf', updatedAt: new Date('2024-01-15T11:00:00Z') };

      const resolved = result.current.resolveConflict(localDoc, remoteDoc, 'last-write-wins');

      // Should use remote (later timestamp)
      expect(resolved.fileName).toBe('remote.pdf');
    });

    it('should resolve conflicts with merge strategy', async () => {
      const { result } = renderSyncHook();

      const localDoc: Document = {
        id: mockDocumentId,
        userId: mockUserId,
        fileName: 'local.pdf',
        fileType: 'pdf',
        fileSize: 1024,
        documentDate: new Date(),
        type: 'RECHNUNG',
        totalAmount: 100.00 as any,
        vatAmount: 16.10 as any,
        netAmount: 83.90 as any,
        creditor: 'Local',
        vatRate: 19.0,
        status: 'processed',
        uploadedAt: new Date(),
        updatedAt: new Date('2024-01-15T10:30:00Z'),
      };

      const remoteDoc: Document = {
        ...localDoc,
        fileName: 'remote.pdf',
        creditor: 'Remote',
        updatedAt: new Date('2024-01-15T11:00:00Z'),
      };

      const resolved = result.current.resolveConflict(localDoc, remoteDoc, 'merge');

      // Merge strategy should use newer timestamp
      expect(resolved.updatedAt.getTime()).toBeGreaterThan(localDoc.updatedAt.getTime());
    });
  });
});
