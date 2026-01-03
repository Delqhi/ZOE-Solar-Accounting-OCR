import { useState, useCallback } from 'react';
import { DocumentRecord, DocumentStatus, ExtractedData } from '../types';
import { analyzeDocumentWithGemini } from '../services/geminiService';
import { applyAccountingRules, generateZoeInvoiceId } from '../services/ruleEngine';
import { normalizeExtractedData } from '../services/extractedDataNormalization';
import { detectPrivateDocument } from '../services/privateDocumentDetection';
import * as storageService from '../services/storageService';

interface UseUploadReturn {
  processing: boolean;
  progress: string | null;
  error: string | null;
  uploadFile: (file: File) => Promise<DocumentRecord | null>;
  reset: () => void;
}

interface UploadResult {
  doc: DocumentRecord;
  isPrivate: boolean;
  privateReason?: string;
}

const computeFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
};

const readFileToBase64 = (file: File): Promise<{ base64: string; url: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      resolve({ base64: res.split(',')[1], url: res });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const classifyOutcome = (data: ExtractedData): { status: 'completed' | 'review_needed' | 'error'; error?: string } => {
  const score = data.ocr_score ?? 0;
  const rationale = (data.ocr_rationale || '').toLowerCase();
  const description = (data.beschreibung || '').toLowerCase();

  // Check for technical failures
  const isTechnicalFailure =
    rationale.includes('siliconflow_api_key') ||
    rationale.includes('api key') ||
    rationale.includes('quota') ||
    rationale.includes('http 4') ||
    rationale.includes('http 5');

  // Check for manual template
  const looksLikeManualTemplate =
    (data.lieferantName || '').toLowerCase().includes('manuelle eingabe') ||
    (score <= 0 && (data.bruttoBetrag ?? 0) === 0);

  if (looksLikeManualTemplate) {
    return {
      status: isTechnicalFailure ? 'error' : 'review_needed',
      error: rationale || description || 'Analyse fehlgeschlagen. Bitte manuell erfassen.'
    };
  }

  // Check if needs review
  if (rationale.includes('datum unklar') ||
      rationale.includes('summen widersprüchlich') ||
      score < 6) {
    return { status: 'review_needed', error: rationale || 'Bitte Daten prüfen.' };
  }

  return { status: 'completed' };
};

export const useUpload = (onUploadComplete?: (doc: DocumentRecord) => void): UseUploadReturn => {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setProcessing(false);
    setProgress(null);
    setError(null);
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<DocumentRecord | null> => {
    setProcessing(true);
    setProgress('Datei wird gelesen...');
    setError(null);

    try {
      // Step 1: Read file and compute hash
      const { base64, url } = await readFileToBase64(file);
      const hash = await computeFileHash(file);
      setProgress('OCR-Analyse läuft...');

      // Step 2: Check for duplicates in IndexedDB
      const existingDocs = await storageService.getAllDocuments();
      const isDuplicate = existingDocs.some(d => d.fileHash === hash);

      if (isDuplicate) {
        setProgress('Duplikat erkannt');
        // Find the existing document
        const existingDoc = existingDocs.find(d => d.fileHash === hash);
        if (existingDoc) {
          const duplicateDoc: DocumentRecord = {
            id: crypto.randomUUID(),
            fileName: file.name,
            fileType: file.type,
            uploadDate: new Date().toISOString(),
            status: DocumentStatus.DUPLICATE,
            data: existingDoc.data,
            previewUrl: url,
            fileHash: hash,
            duplicateOfId: existingDoc.id,
            duplicateReason: 'Datei identisch (Hash)',
            duplicateConfidence: 1
          };
          await storageService.saveDocument(duplicateDoc);
          onUploadComplete?.(duplicateDoc);
          setProcessing(false);
          setProgress(null);
          return duplicateDoc;
        }
      }

      // Step 3: Run AI Analysis
      const extractedData = await analyzeDocumentWithGemini(base64, file.type);
      setProgress('Buchungsregeln werden angewendet...');

      // Step 4: Get settings for rule application
      const settings = await storageService.getSettings();

      // Step 5: Apply accounting rules
      const enrichedData = applyAccountingRules(extractedData, existingDocs, settings);

      // Step 6: Check for private documents
      const privateCheck = detectPrivateDocument(enrichedData);
      const isPrivate = privateCheck.isPrivate;

      // Step 7: Generate ZOE invoice ID
      const zoeId = generateZoeInvoiceId(enrichedData.belegDatum, existingDocs);

      // Step 8: Classify outcome
      const outcome = classifyOutcome(enrichedData);

      // Map outcome to DocumentStatus enum
      let status: DocumentStatus;
      if (isPrivate) {
        status = DocumentStatus.PRIVATE;
      } else {
        switch (outcome.status) {
          case 'completed':
            status = DocumentStatus.COMPLETED;
            break;
          case 'review_needed':
            status = DocumentStatus.REVIEW_NEEDED;
            break;
          case 'error':
          default:
            status = DocumentStatus.ERROR;
            break;
        }
      }

      // Step 9: Create document record
      const doc: DocumentRecord = {
        id: crypto.randomUUID(),
        fileName: file.name,
        fileType: file.type,
        uploadDate: new Date().toISOString(),
        status,
        previewUrl: url,
        fileHash: hash,
        data: {
          ...normalizeExtractedData(enrichedData),
          eigeneBelegNummer: zoeId,
          ocr_score: extractedData.ocr_score ?? 0,
          ocr_rationale: extractedData.ocr_rationale
        }
      };

      if (isPrivate) {
        doc.data = { ...doc.data, privatanteil: true };
      }

      if (outcome.status === 'error' || outcome.status === 'review_needed') {
        doc.error = outcome.error;
      }

      // Step 10: Save to IndexedDB
      await storageService.saveDocument(doc);

      // Step 11: Optionally save private document to separate store
      if (isPrivate) {
        await storageService.savePrivateDocument(
          doc.id,
          file.name,
          file.type,
          base64,
          doc.data,
          privateCheck.reason || 'Private Positionen erkannt'
        );
      }

      setProgress(null);
      setProcessing(false);
      onUploadComplete?.(doc);
      return doc;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload fehlgeschlagen';
      setError(errorMessage);
      setProgress(null);
      setProcessing(false);
      console.error('Upload error:', err);
      return null;
    }
  }, [onUploadComplete]);

  return {
    processing,
    progress,
    error,
    uploadFile,
    reset
  };
};
