/**
 * Private Document Detection Service
 * Detects private/personal documents that should be handled separately
 */

import { ExtractedData } from '../types';

export interface PrivateDocumentCheck {
  isPrivate: boolean;
  detectedVendor?: string;
  reason?: string;
  confidence?: number;
}

/**
 * Detects if a document contains private/personal content
 * Based on vendor names, keywords, and patterns
 */
export function detectPrivateDocument(data: Partial<ExtractedData>): PrivateDocumentCheck {
  const vendor = (data.lieferantName || '').toLowerCase();
  const description = (data.beschreibung || '').toLowerCase();
  const textContent = (data.textContent || '').toLowerCase();

  // Private vendor patterns
  const privateVendors = [
    'privat',
    'personal',
    'family',
    'mitarbeiter',
    'employee',
    'private',
    'persönlich',
    'eigen',
    'sonstiges',
  ];

  // Check vendor name
  for (const pv of privateVendors) {
    if (vendor.includes(pv)) {
      return {
        isPrivate: true,
        detectedVendor: data.lieferantName,
        reason: `Privater Lieferant erkannt: "${pv}"`,
        confidence: 0.9,
      };
    }
  }

  // Check for private keywords in description
  const privateKeywords = [
    'privatentnahme',
    'private use',
    'eigenbedarf',
    'mitarbeiter',
    'personal',
    'guthaben',
    'gutschein',
    'trinkgeld',
    'spende',
  ];

  for (const keyword of privateKeywords) {
    if (description.includes(keyword) || textContent.includes(keyword)) {
      return {
        isPrivate: true,
        detectedVendor: data.lieferantName,
        reason: `Privater Inhalt erkannt: "${keyword}"`,
        confidence: 0.85,
      };
    }
  }

  // Check for very small amounts that might be personal
  if (data.bruttoBetrag && data.bruttoBetrag < 10 && vendor.includes('supermarkt')) {
    return {
      isPrivate: true,
      detectedVendor: data.lieferantName,
      reason: 'Kleinbetrag Einkauf (potenziell privat)',
      confidence: 0.6,
    };
  }

  // Check for personal services
  const personalServices = [
    'friseur',
    'kosmetik',
    'nagelstudio',
    'fitness',
    'yoga',
    'massage',
    'arzt',
    'zahnarzt',
    'apotheke',
  ];

  for (const service of personalServices) {
    if (vendor.includes(service)) {
      return {
        isPrivate: true,
        detectedVendor: data.lieferantName,
        reason: `Persönlicher Dienstleister: "${service}"`,
        confidence: 0.75,
      };
    }
  }

  return { isPrivate: false };
}

/**
 * Batch detection for multiple documents
 */
export function detectPrivateDocuments(
  documents: Partial<ExtractedData>[]
): PrivateDocumentCheck[] {
  return documents.map(detectPrivateDocument);
}

/**
 * Categorizes document privacy level
 */
export function getPrivacyLevel(data: Partial<ExtractedData>): 'public' | 'mixed' | 'private' {
  const check = detectPrivateDocument(data);

  if (check.isPrivate && (check.confidence || 0) > 0.8) {
    return 'private';
  }

  if (check.isPrivate) {
    return 'mixed';
  }

  return 'public';
}
