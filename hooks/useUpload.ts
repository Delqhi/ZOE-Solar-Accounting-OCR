import { useState, useCallback } from 'react';
import { DocumentRecord, ExtractedData, Attachment, DocumentStatus, AppSettings } from '../types';
import { analyzeDocumentWithGemini } from '../services/geminiService';
import { applyAccountingRules, generateZoeInvoiceId } from '../services/ruleEngine';
import { normalizeExtractedData } from '../services/extractedDataNormalization';
import { detectPrivateDocument } from '../services/privateDocumentDetection';
import { getAllDocuments, getSettings } from '../services/storageService';
import { v4 as uuidv4 } from 'uuid';

interface UseUploadReturn {
  processing: boolean;
  progress: string | null;
  uploadFile: (file: File) => Promise<DocumentRecord | null>;
}

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

      // Step 3: Normalize extracted data to ensure full ExtractedData type
      const normalizedData = normalizeExtractedData(extractedData);

      // Get existing documents and settings for rule application
      const [existingDocs, settings] = await Promise.all([
        getAllDocuments(),
        getSettings()
      ]);

      // Step 4: Apply accounting rules
      const enrichedData = applyAccountingRules(
        normalizedData,
        existingDocs,
        settings || getDefaultSettings()
      );

      // Step 5: Generate ZOE invoice ID
      const zoeId = generateZoeInvoiceId(enrichedData.belegDatum, existingDocs);

      // Step 6: Check for private documents
      const privateCheck = detectPrivateDocument(enrichedData);

      // Step 7: Create document record
      const doc: DocumentRecord = {
        id: uuidv4(),
        fileName: file.name,
        fileType: file.type,
        uploadDate: new Date().toISOString(),
        status: privateCheck.isPrivate ? DocumentStatus.PRIVATE : DocumentStatus.REVIEW_NEEDED,
        duplicateOfId: undefined,
        duplicateReason: undefined,
        previewUrl: url,
        data: {
          ...enrichedData,
          eigeneBelegNummer: zoeId
        }
      };

      setProgress(null);
      return doc;

    } catch (error) {
      console.error('Upload error:', error);
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

// Helper to get default settings
const getDefaultSettings = (): AppSettings => ({
  id: 'global',
  taxDefinitions: [],
  accountDefinitions: [],
  datevConfig: {
    beraterNr: '',
    mandantNr: '',
    wirtschaftsjahrBeginn: '',
    sachkontenlaenge: 4,
    waehrung: 'EUR',
    herkunftKz: 'RE',
    diktatkuerzel: '',
    stapelBezeichnung: 'Buchungsstapel',
    taxCategoryToBuKey: {}
  },
  elsterStammdaten: {
    unternehmensName: '',
    land: 'DE',
    plz: '',
    ort: '',
    strasse: '',
    hausnummer: '',
    eigeneSteuernummer: '',
    eigeneUstIdNr: '',
    finanzamtName: '',
    finanzamtNr: '',
    rechtsform: undefined,
    besteuerungUst: 'unbekannt',
    kleinunternehmer: false,
    iban: '',
    kontaktEmail: ''
  },
  accountGroups: [],
  ocrConfig: {
    scores: {},
    required_fields: [],
    field_weights: {},
    regex_patterns: {},
    validation_rules: { sum_check: true, date_check: true, min_confidence: 0.8 }
  }
});
