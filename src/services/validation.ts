/**
 * Validation Service - 2026 Best Practices
 * Document data validation utilities
 */
import type { ExtractedData, DocumentRecord } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate document data for completeness
 */
export function validateDocumentData(data: ExtractedData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!data.belegDatum) {
    errors.push('Belegdatum fehlt');
  }

  if (!data.lieferantName?.trim()) {
    errors.push('Lieferantenname fehlt');
  }

  if (!data.bruttoBetrag || data.bruttoBetrag <= 0) {
    errors.push('Betrag fehlt oder ist ungültig');
  }

  // Warnings
  if (!data.belegNummerLieferant?.trim()) {
    warnings.push('Belegnummer fehlt');
  }

  if (!data.mwstSatz19) {
    warnings.push('Mehrwertsteuersatz nicht angegeben (Standard: 19%)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate document before export
 */
export function validateForExport(doc: DocumentRecord): ValidationResult {
  if (!doc.data) {
    return {
      isValid: false,
      errors: ['Keine Dokumentdaten vorhanden'],
      warnings: [],
    };
  }

  return validateDocumentData(doc.data);
}

/**
 * Check if document is complete
 */
export function isDocumentComplete(data: ExtractedData): boolean {
  const validation = validateDocumentData(data);
  return validation.isValid;
}

/**
 * Get missing required fields
 */
export function getMissingFields(data: ExtractedData): string[] {
  const validation = validateDocumentData(data);
  return validation.errors.map(e => e.replace(' fehlt', '').replace(' oder ist ungültig', ''));
}

export default {
  validateDocumentData,
  validateForExport,
  isDocumentComplete,
  getMissingFields,
};
