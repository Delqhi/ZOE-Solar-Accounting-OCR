/** Rule Engine - Placeholder for accounting rules */

import { ExtractedData, DocumentRecord, AppSettings } from '../types';

export function applyAccountingRules(
  data: ExtractedData,
  documents: DocumentRecord[],
  settings: AppSettings | null,
  overrideRule?: { accountId?: string; taxCategoryValue?: string }
): ExtractedData {
  // Apply vendor rules if available
  if (overrideRule?.accountId) {
    data.kontierungskonto = overrideRule.accountId;
  }
  if (overrideRule?.taxCategoryValue) {
    data.steuerkategorie = overrideRule.taxCategoryValue;
  }

  return data;
}

export function generateZoeInvoiceId(date: string, documents: DocumentRecord[]): string {
  const year = date.substring(0, 4) || new Date().getFullYear().toString();
  const yearDocs = documents.filter(d => d.data?.belegDatum?.startsWith(year));
  const nextNum = yearDocs.length + 1;
  return `ZOE-${year}-${nextNum.toString().padStart(4, '0')}`;
}
