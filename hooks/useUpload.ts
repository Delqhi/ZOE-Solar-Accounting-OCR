import { useState, useCallback } from 'react';
import { DocumentRecord, ExtractedData, AppSettings, DocumentStatus } from '../types';
import { analyzeDocumentWithGemini } from '../services/geminiService';
import { applyAccountingRules, generateZoeInvoiceId } from '../services/ruleEngine';
import { normalizeExtractedData } from '../services/extractedDataNormalization';
import { detectPrivateDocument } from '../services/privateDocumentDetection';
import { v4 as uuidv4 } from 'uuid';

interface UseUploadReturn {
  processing: boolean;
  progress: string | null;
  uploadFile: (file: File) => Promise<DocumentRecord | null>;
}

const DEFAULT_SETTINGS: AppSettings = {
  id: 'default',
  taxDefinitions: [
    { value: "19_pv", label: "19% Vorsteuer", ust_satz: 0.19, vorsteuer: true },
    { value: "7_pv", label: "7% Vorsteuer", ust_satz: 0.07, vorsteuer: true },
    { value: "0_pv", label: "0% PV (Steuerfrei)", ust_satz: 0.00, vorsteuer: true },
    { value: "0_igl_rc", label: "0% IGL / Reverse Charge", ust_satz: 0.00, vorsteuer: false, reverse_charge: true },
    { value: "steuerfrei_kn", label: "Steuerfrei (Kleinunternehmer)", ust_satz: 0.00, vorsteuer: false },
    { value: "keine_pv", label: "Keine Vorsteuer (Privatanteil)", ust_satz: 0.00, vorsteuer: false }
  ],
  accountDefinitions: [
    { id: "wareneingang", name: "Wareneingang / Material", skr03: "3400", steuerkategorien: ["19_pv", "0_igl_rc"] },
    { id: "fremdleistung", name: "Fremdleistungen", skr03: "3100", steuerkategorien: ["19_pv", "0_igl_rc"] },
    { id: "buero", name: "Büromaterial", skr03: "4930", steuerkategorien: ["19_pv", "7_pv"] },
    { id: "reise", name: "Reisekosten", skr03: "4670", steuerkategorien: ["19_pv", "7_pv"] },
    { id: "vertretung", name: "Vertretungskosten", skr03: "4610", steuerkategorien: ["19_pv"] },
    { id: "software", name: "Software/Lizenzen", skr03: "4964", steuerkategorien: ["19_pv"] },
    { id: "internet", name: "Internet/Telefon", skr03: "4920", steuerkategorien: ["19_pv"] },
    { id: "makler", name: "Maklerprovisionen", skr03: "4760", steuerkategorien: ["19_pv", "0_igl_rc"] },
    { id: "abschreibung", name: "Abschreibungen", skr03: "4830", steuerkategorien: ["19_pv"] },
    { id: "fuhrpark", name: "Fuhrpark/Kraftstoff", skr03: "4530", steuerkategorien: ["19_pv"] },
    { id: "maschinen", name: "Maschinen/Anlagen", skr03: "0200", steuerkategorien: ["19_pv"] },
    { id: "werbung", name: "Werbung", skr03: "4600", steuerkategorien: ["19_pv"] },
    { id: "miete", name: "Miete/Pachten", skr03: "4210", steuerkategorien: ["19_pv"] },
    { id: "reparatur", name: "Reparatur/Wartung", skr03: "4800", steuerkategorien: ["19_pv"] },
    { id: "beratung", name: "Beratung/Steuerberater", skr03: "4950", steuerkategorien: ["19_pv"] },
    { id: "versicherung", name: "Versicherungen", skr03: "4360", steuerkategorien: ["19_pv"] },
    { id: "strom", name: "Strom/Gas/Wasser", skr03: "4240", steuerkategorien: ["19_pv"] },
    { id: "ausbildung", name: "Fortbildung", skr03: "4945", steuerkategorien: ["19_pv"] },
    { id: "portokosten", name: "Porto/Versand", skr03: "4910", steuerkategorien: ["19_pv"] },
    { id: "sonstiges", name: "Sonstige Betriebsausgaben", skr03: "4900", steuerkategorien: ["19_pv", "7_pv"] },
    { id: "privat", name: "Privatanteil", skr03: "1800", steuerkategorien: ["keine_pv"] }
  ],
  accountGroups: [],
  ocrConfig: {
    scores: {
      "0": { min_fields: 0, desc: "Kein gültiger Beleg" },
      "5": { min_fields: 4, desc: "Basisdaten vorhanden" },
      "10": { min_fields: 7, desc: "Perfekt erkannt" }
    },
    required_fields: ["belegDatum", "bruttoBetrag", "lieferantName"],
    field_weights: { bruttoBetrag: 3, belegDatum: 3, lieferantName: 2, belegNummerLieferant: 2 },
    regex_patterns: { belegDatum: "\\d{4}-\\d{2}-\\d{2}" },
    validation_rules: { sum_check: true, date_check: true, min_confidence: 0.8 }
  }
};

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

export const useUpload = (settings?: AppSettings): UseUploadReturn => {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const effectiveSettings = settings || DEFAULT_SETTINGS;

  const uploadFile = useCallback(async (file: File): Promise<DocumentRecord | null> => {
    setProcessing(true);
    setProgress('Datei wird verarbeitet...');

    try {
      // Step 1: Read file
      const { base64, url } = await readFileToBase64(file);
      setProgress('OCR-Analyse läuft...');

      // Step 2: Run AI Analysis
      const extractedRaw = await analyzeDocumentWithGemini(base64, file.type);
      const extractedData = normalizeExtractedData(extractedRaw);
      setProgress('Buchungsregeln werden angewendet...');

      // Step 3: Apply accounting rules (with empty existingDocs for new uploads)
      const enrichedData = applyAccountingRules(extractedData, [], effectiveSettings);

      // Step 4: Generate ZOE invoice ID
      const zoeId = generateZoeInvoiceId(enrichedData.belegDatum || new Date().toISOString(), []);

      // Step 5: Check for private documents
      const privateResult = detectPrivateDocument(enrichedData);
      const isPrivate = privateResult.isPrivate;

      // Step 6: Create document record
      const doc: DocumentRecord = {
        id: uuidv4(),
        fileName: file.name,
        fileType: file.type,
        uploadDate: new Date().toISOString(),
        status: isPrivate ? DocumentStatus.PRIVATE : DocumentStatus.REVIEW_NEEDED,
        duplicateOfId: undefined,
        duplicateReason: undefined,
        previewUrl: url,
        data: {
          ...enrichedData,
          eigeneBelegNummer: zoeId,
          ocr_score: extractedRaw.ocr_score ?? 0,
          ocr_rationale: extractedRaw.ocr_rationale,
          privatanteil: isPrivate
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
  }, [effectiveSettings]);

  return {
    processing,
    progress,
    uploadFile
  };
};
