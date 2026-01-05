import { useState, useCallback } from 'react';
import { DocumentRecord, ExtractedData, Attachment } from '../types';
import { analyzeDocumentWithGemini } from '../services/geminiService';
import { applyAccountingRules, generateZoeInvoiceId } from '../services/ruleEngine';
import { normalizeExtractedData } from '../services/extractedDataNormalization';
import { detectPrivateDocument } from '../services/privateDocumentDetection';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../src/utils/logger';

interface UseUploadReturn {
  processing: boolean;
  progress: string | null;
  uploadFile: (file: File) => Promise<DocumentRecord | null>;
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

export const useUpload = (): UseUploadReturn => {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File): Promise<DocumentRecord | null> => {
    setProcessing(true);
    setProgress('Datei wird verarbeitet...');

    try {
      // Step 1: Read file
      const { base64, url } = await readFileToBase64(file);
      setProgress('OCR-Analyse läuft...');

      // Step 2: Run AI Analysis
      const extractedData = await analyzeDocumentWithGemini(base64, file.type);
      setProgress('Buchungsregeln werden angewendet...');

      // Step 3: Apply accounting rules
      const enrichedData = applyAccountingRules(extractedData);

      // Step 4: Generate ZOE invoice ID
      const zoeId = generateZoeInvoiceId();

      // Step 5: Check for private documents
      const isPrivate = detectPrivateDocument(enrichedData);

      // Step 6: Create document record
      const doc: DocumentRecord = {
        id: uuidv4(),
        fileName: file.name,
        fileType: file.type,
        uploadDate: new Date().toISOString(),
        status: isPrivate ? 'PRIVATE' : 'REVIEW_NEEDED',
        duplicateOfId: undefined,
        duplicateReason: undefined,
        previewUrl: url,
        data: {
          ...normalizeExtractedData(enrichedData),
          eigeneBelegNummer: zoeId,
          ocr_score: extractedData.ocr_score ?? 0,
          ocr_rationale: extractedData.ocr_rationale
        },
        isPrivate,
        privateReason: isPrivate ? enrichedData.ocr_rationale : undefined
      };

      setProgress(null);
      return doc;

    } catch (error) {
      logger.error('Upload error:', error);
      setProgress(null);
      return null;
    } finally {
      setProcessing(false);
    }
  }, []);

  return {
    processing,
    progress,
    uploadFile
  };
};
