/**
 * Rule Engine
 * Accounting rules, SKR03 classification, and vendor rules
 */

import { ExtractedData, DocumentRecord, AppSettings, VendorRule } from '../types';

/**
 * Applies accounting rules to extracted data
 * Determines SKR03 account and tax category
 */
export function applyAccountingRules(
  data: Partial<ExtractedData>,
  existingDocs: DocumentRecord[],
  settings: AppSettings | null,
  overrideRule?: { accountId?: string; taxCategoryValue?: string }
): ExtractedData {
  const enrichedData = { ...data } as ExtractedData;

  // Apply override if provided (from vendor rules)
  if (overrideRule?.accountId) {
    enrichedData.kontierungskonto = overrideRule.accountId;
    enrichedData.sollKonto = overrideRule.accountId;
  }

  if (overrideRule?.taxCategoryValue) {
    enrichedData.steuerkategorie = overrideRule.taxCategoryValue;
  }

  // Default account if not set
  if (!enrichedData.kontierungskonto && !enrichedData.konto_skr03) {
    // Simple heuristic based on vendor name or amount
    const vendor = (enrichedData.lieferantName || '').toLowerCase();

    if (vendor.includes('strom') || vendor.includes('energy') || vendor.includes('energie')) {
      enrichedData.kontierungskonto = '4400';
      enrichedData.sollKonto = '4400';
    } else if (vendor.includes('software') || vendor.includes('lizenz')) {
      enrichedData.kontierungskonto = '4964';
      enrichedData.sollKonto = '4964';
    } else if (vendor.includes('material') || vendor.includes('büro')) {
      enrichedData.kontierungskonto = '4930';
      enrichedData.sollKonto = '4930';
    } else {
      enrichedData.kontierungskonto = '3400'; // Default: Wareneingang
      enrichedData.sollKonto = '3400';
    }
  }

  // Set habenKonto (typically 1406 for Vorsteuer or 3800 for reverse charge)
  if (!enrichedData.habenKonto) {
    if (enrichedData.reverseCharge) {
      enrichedData.habenKonto = '3800';
    } else {
      enrichedData.habenKonto = '1406'; // Vorsteuer
    }
  }

  // Tax category determination
  if (!enrichedData.steuerkategorie) {
    if (enrichedData.mwstBetrag19 && enrichedData.mwstBetrag19 > 0) {
      enrichedData.steuerkategorie = '19';
    } else if (enrichedData.mwstBetrag7 && enrichedData.mwstBetrag7 > 0) {
      enrichedData.steuerkategorie = '7';
    } else {
      enrichedData.steuerkategorie = '0';
    }
  }

  // Set flags based on data
  enrichedData.vorsteuerabzug = enrichedData.steuerkategorie !== '0';
  enrichedData.kleinbetrag = (enrichedData.bruttoBetrag || 0) < 800;

  // Legacy fields for compatibility
  enrichedData.kontogruppe = enrichedData.kontierungskonto || enrichedData.konto_skr03 || '3400';
  enrichedData.konto_skr03 = enrichedData.kontierungskonto || enrichedData.konto_skr03 || '3400';
  enrichedData.ust_typ = enrichedData.steuerkategorie || '19';

  // Derive tax amounts if missing
  if (!enrichedData.mwstBetrag19 && enrichedData.nettoBetrag && enrichedData.steuerkategorie === '19') {
    enrichedData.mwstBetrag19 = Math.round(enrichedData.nettoBetrag * 0.19 * 100) / 100;
  }
  if (!enrichedData.mwstBetrag7 && enrichedData.nettoBetrag && enrichedData.steuerkategorie === '7') {
    enrichedData.mwstBetrag7 = Math.round(enrichedData.nettoBetrag * 0.07 * 100) / 100;
  }

  // Ensure tax rate is set
  if (!enrichedData.mwstSatz19) enrichedData.mwstSatz19 = 19;
  if (!enrichedData.mwstSatz7) enrichedData.mwstSatz7 = 7;
  if (!enrichedData.mwstSatz0) enrichedData.mwstSatz0 = 0;

  return enrichedData;
}

/**
 * Generates a ZOE invoice ID
 * Format: ZOEYYMM.XXX (e.g., ZOE2601.001)
 */
export function generateZoeInvoiceId(
  dateStr: string,
  existingDocs: DocumentRecord[]
): string {
  if (!dateStr) {
    const now = new Date();
    dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  // Extract YYMM from date
  const date = new Date(dateStr);
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = `ZOE${year}${month}`;

  // Find existing IDs with same prefix
  const sameMonthDocs = existingDocs.filter(d => {
    const data = d.data;
    if (!data?.eigeneBelegNummer) return false;
    return data.eigeneBelegNummer.startsWith(prefix);
  });

  // Find highest number
  let maxNum = 0;
  for (const doc of sameMonthDocs) {
    const data = doc.data;
    if (!data?.eigeneBelegNummer) continue;
    const numStr = data.eigeneBelegNummer.split('.')[1];
    const num = parseInt(numStr, 10);
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  }

  const nextNum = maxNum + 1;
  return `${prefix}.${String(nextNum).padStart(3, '0')}`;
}

/**
 * Finds or creates a vendor rule
 */
export async function findOrCreateVendorRule(
  vendorName: string,
  accountId: string,
  taxCategoryValue: string
): Promise<VendorRule> {
  return {
    vendorName,
    accountId,
    taxCategoryValue,
    lastUpdated: new Date().toISOString(),
    useCount: 1,
    accountGroupName: '',
  };
}

/**
 * Validates accounting data
 */
export function validateAccountingData(data: Partial<ExtractedData>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data.nettoBetrag || data.nettoBetrag < 0) {
    errors.push('Invalid net amount');
  }

  if (!data.bruttoBetrag || data.bruttoBetrag < 0) {
    errors.push('Invalid gross amount');
  }

  if (data.nettoBetrag && data.bruttoBetrag && data.mwstBetrag19 !== undefined) {
    const calculated = data.nettoBetrag + data.mwstBetrag19;
    if (Math.abs(calculated - data.bruttoBetrag) > 0.01) {
      warnings.push('Sum check failed: net + tax ≠ gross');
    }
  }

  if (!data.kontierungskonto && !data.konto_skr03) {
    warnings.push('No account assigned');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
