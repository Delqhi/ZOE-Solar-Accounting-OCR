import { useState, useEffect, useCallback } from 'react';
import { DocumentRecord, DocumentStatus, ExtractedData } from '../types';
import * as storageService from '../services/storageService';
import * as supabaseService from '../services/supabaseService';
import { analyzeDocumentWithGemini } from '../services/geminiService';
import { applyAccountingRules, generateZoeInvoiceId } from '../services/ruleEngine';
import { normalizeExtractedData } from '../services/extractedDataNormalization';

interface UseDocumentsReturn {
  documents: DocumentRecord[];
  loading: boolean;
  error: string | null;
  isSynced: boolean;
  refreshDocuments: () => Promise<void>;
  addDocument: (doc: DocumentRecord) => Promise<void>;
  updateDocument: (doc: DocumentRecord) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  markAsReviewed: (ids: string[]) => Promise<void>;
  reRunOcr: (ids: string[]) => Promise<void>;
  saveDocumentWithSync: (doc: DocumentRecord) => Promise<void>;
}

/**
 * Helper function to merge local and cloud documents
 */
const mergeDocuments = (localDocs: DocumentRecord[], cloudDocs: DocumentRecord[]): DocumentRecord[] => {
  const docMap = new Map<string, DocumentRecord>();

  // Add all local docs
  for (const doc of localDocs) {
    docMap.set(doc.id, doc);
  }

  // Merge cloud docs (prefer newer versions)
  for (const cloudDoc of cloudDocs) {
    const existing = docMap.get(cloudDoc.id);
    if (!existing) {
      docMap.set(cloudDoc.id, cloudDoc);
    } else {
      // Compare by upload date, prefer newer
      const localDate = new Date(existing.uploadDate).getTime();
      const cloudDate = new Date(cloudDoc.uploadDate).getTime();
      if (cloudDate > localDate) {
        docMap.set(cloudDoc.id, cloudDoc);
      }
    }
  }

  return Array.from(docMap.values());
};

export const useDocuments = (): UseDocumentsReturn => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSynced, setIsSynced] = useState(false);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Local-first: Load from IndexedDB first
      const localDocs = await storageService.getAllDocuments();
      setDocuments(localDocs.sort((a, b) =>
        new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      ));
      setIsSynced(false);

      // Optionally sync with Supabase if configured
      if (supabaseService.isSupabaseConfigured()) {
        try {
          const cloudDocs = await supabaseService.getAllDocuments();

          if (cloudDocs.length > 0) {
            // Merge strategy: Prefer newer documents, handle duplicates
            const mergedDocs = mergeDocuments(localDocs, cloudDocs);
            setDocuments(mergedDocs.sort((a, b) =>
              new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
            ));

            // Save merged data back to local storage
            for (const doc of mergedDocs) {
              await storageService.saveDocument(doc);
            }

            setIsSynced(true);
          }
        } catch (syncError) {
          console.warn('Supabase documents sync failed, using local data:', syncError);
        }
      }
    } catch (e) {
      setError('Fehler beim Laden der Dokumente');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const addDocument = useCallback(async (doc: DocumentRecord) => {
    try {
      // Save locally first
      await storageService.saveDocument(doc);
      setDocuments(prev => [doc, ...prev]);
      setIsSynced(false);

      // Optionally sync to Supabase if configured
      if (supabaseService.isSupabaseConfigured()) {
        try {
          await supabaseService.saveDocument(doc);
          setIsSynced(true);
        } catch (syncError) {
          console.warn('Failed to sync document to Supabase:', syncError);
        }
      }
    } catch (e) {
      setError('Fehler beim Hinzufügen des Dokuments');
      throw e;
    }
  }, []);

  const updateDocument = useCallback(async (doc: DocumentRecord) => {
    try {
      await storageService.saveDocument(doc);
      setDocuments(prev => prev.map(d => d.id === doc.id ? doc : d));
      setIsSynced(false);

      if (supabaseService.isSupabaseConfigured()) {
        try {
          await supabaseService.saveDocument(doc);
          setIsSynced(true);
        } catch (syncError) {
          console.warn('Failed to sync document to Supabase:', syncError);
        }
      }
    } catch (e) {
      setError('Fehler beim Aktualisieren des Dokuments');
      throw e;
    }
  }, []);

  const saveDocumentWithSync = useCallback(async (doc: DocumentRecord) => {
    try {
      // Save locally first
      await storageService.saveDocument(doc);
      setDocuments(prev => prev.map(d => d.id === doc.id ? doc : d));

      // Optionally sync to Supabase if configured
      if (supabaseService.isSupabaseConfigured()) {
        try {
          await supabaseService.saveDocument(doc);
          setIsSynced(true);
        } catch (syncError) {
          console.warn('Failed to sync document to Supabase:', syncError);
          setIsSynced(false);
        }
      }
    } catch (e) {
      setError('Fehler beim Speichern des Dokuments');
      throw e;
    }
  }, []);

  const deleteDocument = useCallback(async (id: string) => {
    try {
      await storageService.deleteDocument(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
      setIsSynced(false);

      if (supabaseService.isSupabaseConfigured()) {
        try {
          await supabaseService.deleteDocument(id);
          setIsSynced(true);
        } catch (syncError) {
          console.warn('Failed to delete document from Supabase:', syncError);
        }
      }
    } catch (e) {
      setError('Fehler beim Löschen des Dokuments');
      throw e;
    }
  }, []);

  const markAsReviewed = useCallback(async (ids: string[]) => {
    try {
      // Get current settings for rule application
      const settings = await storageService.getSettings();

      // Optimistic update
      setDocuments(prev => prev.map(d =>
        ids.includes(d.id) ? { ...d, status: DocumentStatus.COMPLETED } : d
      ));

      // Update each document in storage
      const docsToUpdate = documents.filter(d => ids.includes(d.id));
      for (const doc of docsToUpdate) {
        const updatedDoc = { ...doc, status: DocumentStatus.COMPLETED };
        await storageService.saveDocument(updatedDoc);

        if (supabaseService.isSupabaseConfigured()) {
          try {
            await supabaseService.saveDocument(updatedDoc);
          } catch (syncError) {
            console.warn('Failed to sync reviewed document to Supabase:', syncError);
          }
        }
      }

      setIsSynced(false);
    } catch (e) {
      setError('Fehler beim Markieren als geprüft');
      throw e;
    }
  }, [documents]);

  const reRunOcr = useCallback(async (ids: string[]) => {
    try {
      // Get current settings
      const settings = await storageService.getSettings();

      // Set documents to processing state
      setDocuments(prev => prev.map(d =>
        ids.includes(d.id) ? { ...d, status: DocumentStatus.PROCESSING, error: undefined } : d
      ));

      // Get documents to process
      const docsToProcess = documents.filter(d => ids.includes(d.id));

      // Process each document
      for (const doc of docsToProcess) {
        if (!doc.previewUrl) {
          // No preview available, mark as error
          const errorDoc = { ...doc, status: DocumentStatus.ERROR, error: 'Keine Vorschau verfügbar' };
          await storageService.saveDocument(errorDoc);
          setDocuments(prev => prev.map(d => d.id === doc.id ? errorDoc : d));
          continue;
        }

        try {
          const base64 = doc.previewUrl.split(',')[1];
          const extractedRaw = await analyzeDocumentWithGemini(base64, doc.fileType);
          const extracted = normalizeExtractedData(extractedRaw);

          // Get existing vendor rule if applicable
          let overrideRule: { accountId?: string; taxCategoryValue?: string } | undefined = undefined;
          if (extracted.lieferantName) {
            const rule = await storageService.getVendorRule(extracted.lieferantName);
            if (rule) {
              overrideRule = { accountId: rule.accountId, taxCategoryValue: rule.taxCategoryValue };
            }
          }

          // Apply accounting rules
          const currentDocs = documents.filter(d => d.id !== doc.id);
          const finalData = applyAccountingRules(
            extracted,
            currentDocs,
            settings,
            overrideRule
          );

          // Generate ZOE ID if not exists
          finalData.eigeneBelegNummer = doc.data?.eigeneBelegNummer ||
            generateZoeInvoiceId(finalData.belegDatum, currentDocs);

          // Classify outcome
          const score = finalData.ocr_score ?? 0;
          const status = score >= 6 ? DocumentStatus.COMPLETED : DocumentStatus.REVIEW_NEEDED;

          const updatedDoc = { ...doc, status, data: finalData, error: undefined };
          await storageService.saveDocument(updatedDoc);
          setDocuments(prev => prev.map(d => d.id === doc.id ? updatedDoc : d));

          // Sync to cloud
          if (supabaseService.isSupabaseConfigured()) {
            try {
              await supabaseService.saveDocument(updatedDoc);
            } catch (syncError) {
              console.warn('Failed to sync OCR result to Supabase:', syncError);
            }
          }
        } catch (ocrError) {
          const msg = ocrError instanceof Error ? ocrError.message : 'OCR fehlgeschlagen';
          const errorDoc = { ...doc, status: DocumentStatus.ERROR, error: msg };
          await storageService.saveDocument(errorDoc);
          setDocuments(prev => prev.map(d => d.id === doc.id ? errorDoc : d));
        }
      }

      setIsSynced(false);
    } catch (e) {
      setError('Fehler beim erneuten Ausführen der OCR');
      throw e;
    }
  }, [documents]);

  const refreshDocuments = useCallback(async () => {
    await loadDocuments();
  }, [loadDocuments]);

  return {
    documents,
    loading,
    error,
    isSynced,
    refreshDocuments,
    addDocument,
    updateDocument,
    deleteDocument,
    markAsReviewed,
    reRunOcr,
    saveDocumentWithSync
  };
};
