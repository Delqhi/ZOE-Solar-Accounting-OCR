/**
 * Gemini Service
 * OCR document analysis using Google Gemini 2.5 Flash
 */

import { ExtractedData } from '../types';

/**
 * Analyzes a document using Gemini 2.5 Flash
 * @param base64Data - Base64 encoded document data
 * @param mimeType - MIME type of the document
 * @returns Partial ExtractedData from OCR
 */
export async function analyzeDocumentWithGemini(
  base64Data: string,
  mimeType: string
): Promise<Partial<ExtractedData>> {
  // Placeholder implementation
  // In production, this would call the actual Gemini API

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Return mock data for now
  return {
    belegDatum: new Date().toISOString().split('T')[0],
    lieferantName: 'Example Vendor',
    lieferantAdresse: 'Test Street 1, 12345 Berlin',
    nettoBetrag: 100.00,
    mwstBetrag19: 19.00,
    bruttoBetrag: 119.00,
    konto_skr03: '3400',
    steuerkategorie: '19',
    ocr_score: 8,
    ocr_rationale: 'Mock data returned',
    beschreibung: 'Test document extraction',
    steuernummer: '',
    lineItems: [],
    mwstSatz0: 0,
    mwstBetrag0: 0,
    mwstSatz7: 0,
    mwstBetrag7: 0,
    mwstSatz19: 19,
    zahlungsmethode: '',
    eigeneBelegNummer: '',
    zahlungsDatum: '',
    zahlungsStatus: '',
    aufbewahrungsOrt: '',
    rechnungsEmpfaenger: '',
    kleinbetrag: false,
    vorsteuerabzug: true,
    reverseCharge: false,
    privatanteil: false,
    kontogruppe: '',
    kontierungskonto: '3400',
    sollKonto: '3400',
    habenKonto: '',
    belegNummerLieferant: '',
  };
}

/**
 * Analyze with fallback capability
 * @param base64Data - Base64 encoded document data
 * @param mimeType - MIME type of the document
 * @returns ExtractedData or throws error
 */
export async function analyzeDocumentWithFallback(
  base64Data: string,
  mimeType: string
): Promise<Partial<ExtractedData>> {
  try {
    return await analyzeDocumentWithGemini(base64Data, mimeType);
  } catch (error) {
    // Fallback would be SiliconFlow here
    throw new Error('All OCR providers failed');
  }
}
