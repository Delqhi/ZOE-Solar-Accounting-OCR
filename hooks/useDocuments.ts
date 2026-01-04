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
  reRunOcr: (ids: string[]) => Promise<void>;
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
    // Optimistic update
    setDocuments(prev => prev.map(d =>
      ids.includes(d.id) ? { ...d, status: DocumentStatus.COMPLETED } : d
    ));
    // API calls to update status in database
    for (const id of ids) {
      try {
        await supabaseService.updateDocumentStatus(id, DocumentStatus.COMPLETED);
      } catch (e) {
        console.error('Failed to mark document as reviewed:', id, e);
      }
    }
  }, []);

  const reRunOcr = useCallback(async (ids: string[]) => {
    // Optimistic update - set documents to processing state
    setDocuments(prev => prev.map(d =>
      ids.includes(d.id) ? { ...d, status: DocumentStatus.PROCESSING } : d
    ));
    // Queue re-OCR jobs for each document
    for (const id of ids) {
      try {
        await supabaseService.queueReOcr(id);
      } catch (e) {
        console.error('Failed to queue re-OCR:', id, e);
      }
    }
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
