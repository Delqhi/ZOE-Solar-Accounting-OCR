/**
 * Extracted Data Normalization Service
 * Standardizes OCR results to consistent format
 */

import { ExtractedData } from '../types';

/**
 * Normalizes extracted data from OCR
 * Cleans, validates, and standardizes values
 */
export function normalizeExtractedData(data: Partial<ExtractedData>): Partial<ExtractedData> {
  const normalized = { ...data };

  // Normalize dates (YYYY-MM-DD)
  if (normalized.belegDatum) {
    normalized.belegDatum = normalizeDate(normalized.belegDatum);
  }

  if (normalized.zahlungsDatum) {
    normalized.zahlungsDatum = normalizeDate(normalized.zahlungsDatum);
  }

  // Normalize vendor name
  if (normalized.lieferantName) {
    normalized.lieferantName = normalized.lieferantName
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[\u200B-\u200D\uFEFF]/g, ''); // Remove zero-width chars
  }

  // Normalize address
  if (normalized.lieferantAdresse) {
    normalized.lieferantAdresse = normalized.lieferantAdresse
      .trim()
      .replace(/\s+/g, ' ');
  }

  // Normalize amounts (numbers with 2 decimal places)
  if (normalized.nettoBetrag !== undefined) {
    normalized.nettoBetrag = roundToTwo(normalized.nettoBetrag);
  }

  if (normalized.mwstBetrag19 !== undefined) {
    normalized.mwstBetrag19 = roundToTwo(normalized.mwstBetrag19);
  }

  if (normalized.mwstBetrag7 !== undefined) {
    normalized.mwstBetrag7 = roundToTwo(normalized.mwstBetrag7);
  }

  if (normalized.mwstBetrag0 !== undefined) {
    normalized.mwstBetrag0 = roundToTwo(normalized.mwstBetrag0);
  }

  if (normalized.bruttoBetrag !== undefined) {
    normalized.bruttoBetrag = roundToTwo(normalized.bruttoBetrag);
  }

  // Normalize tax rates
  if (normalized.mwstSatz19 === undefined) {
    normalized.mwstSatz19 = 19;
  }
  if (normalized.mwstSatz7 === undefined) {
    normalized.mwstSatz7 = 7;
  }
  if (normalized.mwstSatz0 === undefined) {
    normalized.mwstSatz0 = 0;
  }

  // Normalize account numbers (SKR03)
  if (normalized.konto_skr03) {
    normalized.konto_skr03 = normalized.konto_skr03.replace(/\D/g, '').padStart(4, '0').slice(0, 4);
  }

  if (normalized.kontierungskonto) {
    normalized.kontierungskonto = normalized.kontierungskonto.replace(/\D/g, '').padStart(4, '0').slice(0, 4);
  }

  // Ensure line items array
  if (!normalized.lineItems) {
    normalized.lineItems = [];
  }

  // Normalize line items
  if (normalized.lineItems.length > 0) {
    normalized.lineItems = normalized.lineItems.map(item => ({
      description: (item.description || '').trim(),
      amount: item.amount !== undefined ? roundToTwo(item.amount) : undefined,
    })).filter(item => item.description.length > 0);
  }

  // Set default values for missing fields
  if (!normalized.steuernummer) {
    normalized.steuernummer = '';
  }

  if (!normalized.belegNummerLieferant) {
    normalized.belegNummerLieferant = '';
  }

  // Normalize text fields
  if (normalized.beschreibung) {
    normalized.beschreibung = normalized.beschreibung.trim();
  }

  if (normalized.textContent) {
    normalized.textContent = normalized.textContent.trim();
  }

  if (normalized.ocr_rationale) {
    normalized.ocr_rationale = normalized.ocr_rationale.trim();
  }

  // Ensure quality score is within range
  if (normalized.ocr_score !== undefined) {
    if (normalized.ocr_score < 0) normalized.ocr_score = 0;
    if (normalized.ocr_score > 10) normalized.ocr_score = 10;
  }

  // Normalize payment method
  if (normalized.zahlungsmethode) {
    normalized.zahlungsmethode = normalized.zahlungsmethode.toLowerCase().trim();
  }

  // Set default flags
  if (normalized.kleinbetrag === undefined) {
    normalized.kleinbetrag = false;
  }

  if (normalized.vorsteuerabzug === undefined) {
    normalized.vorsteuerabzug = true;
  }

  if (normalized.reverseCharge === undefined) {
    normalized.reverseCharge = false;
  }

  if (normalized.privatanteil === undefined) {
    normalized.privatanteil = false;
  }

  return normalized;
}

/**
 * Normalizes various date formats to YYYY-MM-DD
 */
function normalizeDate(dateStr: string): string {
  if (!dateStr) return '';

  // Try parsing as Date first
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  // Try DD.MM.YYYY or MM/DD/YYYY or other common formats
  // German format: DD.MM.YYYY
  const deMatch = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (deMatch) {
    const day = deMatch[1].padStart(2, '0');
    const month = deMatch[2].padStart(2, '0');
    const year = deMatch[3];
    return `${year}-${month}-${day}`;
  }

  // US format: MM/DD/YYYY
  const usMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    const month = usMatch[1].padStart(2, '0');
    const day = usMatch[2].padStart(2, '0');
    const year = usMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Format: YYYYMMDD
  const yyyymmddMatch = dateStr.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (yyyymmddMatch) {
    return `${yyyymmddMatch[1]}-${yyyymmddMatch[2]}-${yyyymmddMatch[3]}`;
  }

  // Return original if cannot parse
  return dateStr;
}

/**
 * Rounds number to 2 decimal places
 */
function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Validates and cleans currency strings
 */
export function parseCurrency(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;

  const str = String(value)
    .replace(/[€$]/g, '') // Remove currency symbols
    .replace(/'/g, '.') // Replace apostrophe with dot
    .replace(/,/g, '.') // Replace comma with dot
    .replace(/\s/g, '') // Remove spaces
    .trim();

  const num = parseFloat(str);
  return isNaN(num) ? 0 : roundToTwo(num);
}

/**
 * Batch normalization
 */
export function normalizeBatch(
  dataList: Partial<ExtractedData>[]
): Partial<ExtractedData>[] {
  return dataList.map(normalizeExtractedData);
}
