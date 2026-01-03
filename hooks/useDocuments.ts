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
    try {
      // Optimistic update
      setDocuments(prev => prev.map(d =>
        ids.includes(d.id) ? { ...d, status: DocumentStatus.COMPLETED } : d
      ));
      // Call API to persist status change
      for (const id of ids) {
        const doc = documents.find(d => d.id === id);
        if (doc) {
          const updatedDoc = { ...doc, status: DocumentStatus.COMPLETED };
          await supabaseService.saveDocument(updatedDoc);
        }
      }
    } catch (e) {
      setError('Fehler beim Markieren als erledigt');
      console.error(e);
      throw e;
    }
  }, [documents]);

  const reRunOcr = useCallback(async (ids: string[]) => {
    try {
      // Set documents to processing state
      setDocuments(prev => prev.map(d =>
        ids.includes(d.id) ? { ...d, status: DocumentStatus.PROCESSING } : d
      ));

      // Trigger re-OCR for selected documents
      for (const id of ids) {
        const doc = documents.find(d => d.id === id);
        if (doc && doc.previewUrl) {
          const base64 = doc.previewUrl.split(',')[1];
          const mimeType = doc.fileType || 'application/pdf';

          // Import dynamically to avoid circular deps
          const { analyzeDocumentWithGemini } = await import('../services/geminiService');
          const { applyAccountingRules } = await import('../services/ruleEngine');
          const { normalizeExtractedData } = await import('../services/extractedDataNormalization');

          const extractedData = await analyzeDocumentWithGemini(base64, mimeType);
          const enrichedData = applyAccountingRules(extractedData);
          const normalizedData = normalizeExtractedData(enrichedData);

          const updatedDoc = {
            ...doc,
            status: DocumentStatus.REVIEW_NEEDED,
            data: { ...normalizedData, ocr_score: extractedData.ocr_score ?? 0, ocr_rationale: extractedData.ocr_rationale }
          };

          await supabaseService.saveDocument(updatedDoc);
          setDocuments(prev => prev.map(d => d.id === id ? updatedDoc : d));
        }
      }
    } catch (e) {
      setError('Fehler bei der OCR-Wiederholung');
      console.error(e);
      throw e;
    }
  }, [documents]);

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
