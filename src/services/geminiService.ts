/** Gemini Service - Placeholder for OCR operations */

import { ExtractedData } from '../types';

export async function analyzeDocumentWithGemini(base64: string, mimeType: string): Promise<Partial<ExtractedData>> {
  // Placeholder implementation
  return {
    lieferantName: 'Test Lieferant',
    bruttoBetrag: 100.00,
    belegDatum: new Date().toISOString().split('T')[0],
    belegNummerLieferant: '12345',
    documentType: 'RECHNUNG',
    ocr_score: 0.85,
    ocr_rationale: 'OCR erfolgreich'
  };
}
