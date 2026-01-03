import { useState, useEffect, useCallback } from 'react';
import { DocumentRecord, DocumentStatus, ExtractedData } from '../types';
import * as supabaseService from '../services/supabaseService';

interface UseDocumentsReturn {
  documents: DocumentRecord[];
  loading: boolean;
  error: string | null;
  refreshDocuments: () => Promise<void>;
  addDocument: (doc: DocumentRecord) => void;
  updateDocument: (doc: DocumentRecord) => void;
  deleteDocument: (id: string) => Promise<void>;
  markAsReviewed: (ids: string[]) => Promise<void>;
  reRunOcr: (ids: string[]) => Promise<string[]>;
}

export const useDocuments = (): UseDocumentsReturn => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const docs = await supabaseService.getAllDocuments();
      setDocuments(docs.sort((a, b) =>
        new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      ));
      setError(null);
    } catch (e) {
      setError('Fehler beim Laden der Dokumente');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  const addDocument = useCallback((doc: DocumentRecord) => {
    setDocuments(prev => [doc, ...prev]);
  }, []);

  const updateDocument = useCallback((doc: DocumentRecord) => {
    setDocuments(prev => prev.map(d => d.id === doc.id ? doc : d));
  }, []);

  const deleteDocument = useCallback(async (id: string) => {
    try {
      await supabaseService.deleteDocument(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (e) {
      setError('Fehler beim Löschen des Dokuments');
      throw e;
    }
  }, []);

  const markAsReviewed = useCallback(async (ids: string[]) => {
    try {
      // Optimistic update - update local state first
      setDocuments(prev => prev.map(d =>
        ids.includes(d.id) ? { ...d, status: DocumentStatus.COMPLETED } : d
      ));

      // Persist to Supabase (or fallback to local storage)
      for (const id of ids) {
        const doc = documents.find(d => d.id === id);
        if (doc) {
          const updatedDoc = { ...doc, status: DocumentStatus.COMPLETED };
          try {
            await supabaseService.saveDocument(updatedDoc);
          } catch {
            // Fallback to storageService if Supabase not configured
            await (await import('../services/storageService')).saveDocument(updatedDoc);
          }
        }
      }
    } catch (e) {
      console.error('Error marking documents as reviewed:', e);
      throw e;
    }
  }, [documents]);

  const reRunOcr = useCallback(async (ids: string[]) => {
    // Set documents to processing state first
    setDocuments(prev => prev.map(d =>
      ids.includes(d.id) ? { ...d, status: DocumentStatus.PROCESSING, error: undefined } : d
    ));

    // Note: The actual OCR re-run is complex and requires access to:
    // - The document's previewUrl/base64 data
    // - The OCR services (geminiService)
    // - Settings for accounting rules
    //
    // This is typically handled by the caller (App.tsx) which has all the context.
    // We just update the status here to indicate "about to re-run OCR".

    // Return the IDs that need OCR re-run for the caller to handle
    return ids;
  }, []);

  return {
    documents,
    loading,
    error,
    refreshDocuments,
    addDocument,
    updateDocument,
    deleteDocument,
    markAsReviewed,
    reRunOcr
  };
};
