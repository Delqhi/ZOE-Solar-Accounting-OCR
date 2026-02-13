import { useState, useEffect, useCallback } from 'react';
import { DocumentRecord } from '../../types';
import * as storageService from '../../services/storageService';
import * as supabaseService from '../../services/supabaseService';
import { mergeDocuments } from '../utils';

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    try {
      const [localDocs, cloudDocs] = await Promise.all([
        storageService.getAllDocuments(),
        supabaseService.isSupabaseConfigured()
          ? supabaseService.getAllDocuments().catch(() => [])
          : Promise.resolve([]),
      ]);

      const merged = mergeDocuments(localDocs || [], cloudDocs || []);
      setDocuments(
        merged.sort(
          (a: DocumentRecord, b: DocumentRecord) =>
            new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        )
      );
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveDocument = useCallback(async (doc: DocumentRecord) => {
    await storageService.saveDocument(doc);
    if (supabaseService.isSupabaseConfigured()) {
      await supabaseService.saveDocument(doc).catch(console.error);
    }
    setDocuments((prev: DocumentRecord[]) => {
      const existing = prev.findIndex((d: DocumentRecord) => d.id === doc.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = doc;
        return updated;
      }
      return [doc, ...prev];
    });
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return { documents, setDocuments, loading, saveDocument, reload: loadDocuments };
}
