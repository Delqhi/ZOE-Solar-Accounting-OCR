import { ExtractedData, DocumentRecord, AppSettings, TaxCategoryDefinition, AccountDefinition } from '../types';

export const SKR03_ACCOUNTS: AccountDefinition[] = [
  { id: '3400', name: 'Wareneingang', skr03: '3400', steuerkategorien: ['19%', '7%'] },
  { id: '3520', name: 'Fremdleistungen', skr03: '3520', steuerkategorien: ['19%', '7%'] },
  { id: '4400', name: 'Büromaterial', skr03: '4400', steuerkategorien: ['19%'] },
  { id: '4670', name: 'Rechts- und Beratungskosten', skr03: '4670', steuerkategorien: ['19%'] },
  { id: '4930', name: 'Büromaterial (steuerfrei)', skr03: '4930', steuerkategorien: ['0%'] },
  { id: '4964', name: 'Software', skr03: '4964', steuerkategorien: ['19%'] },
  { id: '5230', name: 'Werbung', skr03: '5230', steuerkategorien: ['19%'] },
  { id: '5410', name: 'Reisekosten', skr03: '5410', steuerkategorien: ['19%'] },
  { id: '5420', name: 'Kfz-Kosten', skr03: '5420', steuerkategorien: ['19%'] },
  { id: '6300', name: 'Löhne und Gehälter', skr03: '6300', steuerkategorien: ['0%'] },
  { id: '6400', name: 'Soziale Abgaben', skr03: '6400', steuerkategorien: ['0%'] },
  { id: '7600', name: 'Abschreibungen', skr03: '7600', steuerkategorien: ['19%'] },
];

export const TAX_CATEGORIES: TaxCategoryDefinition[] = [
  { value: '19%', label: '19% Vorsteuer', ust_satz: 19, vorsteuer: true, reverse_charge: false },
  { value: '7%', label: '7% Vorsteuer (reduziert)', ust_satz: 7, vorsteuer: true, reverse_charge: false },
  { value: '0%', label: '0% (steuerfrei)', ust_satz: 0, vorsteuer: false, reverse_charge: false },
  { value: 'RC', label: 'Reverse Charge', ust_satz: 0, vorsteuer: false, reverse_charge: true },
  { value: 'KLEIN', label: 'Kleinunternehmer', ust_satz: 0, vorsteuer: false, reverse_charge: false },
  { value: 'PRIVAT', label: 'Privatanteil', ust_satz: 0, vorsteuer: false, reverse_charge: false },
];

export function applyAccountingRules(
  data: ExtractedData,
  documents: DocumentRecord[],
  settings: AppSettings | null,
  overrideRule?: { accountId?: string; taxCategoryValue?: string }
): ExtractedData {
  const updatedData = { ...data };

  if (overrideRule?.accountId) {
    updatedData.kontierungskonto = overrideRule.accountId;
  }
  if (overrideRule?.taxCategoryValue) {
    updatedData.steuerkategorie = overrideRule.taxCategoryValue;
  }

  if (!updatedData.kontierungskonto) {
    const match = autoClassifyAccount(updatedData);
    updatedData.kontierungskonto = match.accountId;
    updatedData.steuerkategorie = match.taxCategory;
    updatedData.kontierungBegruendung = `${match.reason} (Confidence: ${Math.round(match.confidence * 100)}%)`;
  }

  const account = SKR03_ACCOUNTS.find(a => a.id === updatedData.kontierungskonto);
  if (account) {
    updatedData.sollKonto = account.skr03;
    updatedData.habenKonto = '1200';
  }

  return updatedData;
}

function autoClassifyAccount(data: ExtractedData): { accountId: string; taxCategory: string; confidence: number; reason: string } {
  const text = `${data.lieferantName} ${data.beschreibung || ''} ${data.lineItems?.map(i => i.description).join(' ') || ''}`.toLowerCase();
  
  const rules = [
    { pattern: /software|lizenz|subscription|saas|cloud|microsoft|adobe|google workspace/, accountId: '4964', taxCategory: '19%', weight: 0.9, reason: 'Software-Erkennung' },
    { pattern: /büro|papier|drucker|tinte|stift|ordner|schreib|büromaterial/, accountId: '4400', taxCategory: '19%', weight: 0.85, reason: 'Büromaterial' },
    { pattern: /rechtsanwalt|anwalt|notar|beratung|consulting|steuerberater/, accountId: '4670', taxCategory: '19%', weight: 0.9, reason: 'Beratungsleistung' },
    { pattern: /werbung|marketing|google ads|facebook|social media|seo/, accountId: '5230', taxCategory: '19%', weight: 0.85, reason: 'Werbung/Marketing' },
    { pattern: /reise|hotel|flug|bahn|taxi|mietwagen/, accountId: '5410', taxCategory: '19%', weight: 0.8, reason: 'Reisekosten' },
    { pattern: /tanken|kfz|auto|werkstatt|reifen|sprit/, accountId: '5420', taxCategory: '19%', weight: 0.8, reason: 'Kfz-Kosten' },
    { pattern: /lohn|gehalt|personal|arbeitnehmer/, accountId: '6300', taxCategory: '0%', weight: 0.95, reason: 'Personalaufwand' },
    { pattern: /krankenversicherung|rentenversicherung|sozial|arbeitsamt/, accountId: '6400', taxCategory: '0%', weight: 0.9, reason: 'Soziale Abgaben' },
    { pattern: /abschreibung|anlage|maschine|gerät|investition/, accountId: '7600', taxCategory: '19%', weight: 0.75, reason: 'Abschreibung' },
    { pattern: /solar|modul|wechselrichter|pv|photovoltaik|montage/, accountId: '3400', taxCategory: '19%', weight: 0.85, reason: 'Wareneingang (Solar)' },
  ];

  for (const rule of rules) {
    if (rule.pattern.test(text)) {
      return {
        accountId: rule.accountId,
        taxCategory: rule.taxCategory,
        confidence: rule.weight,
        reason: rule.reason
      };
    }
  }

  const taxCategory = detectTaxCategory(data);
  const defaultAccount = taxCategory === '0%' ? '4930' : '3520';
  
  return {
    accountId: defaultAccount,
    taxCategory,
    confidence: 0.5,
    reason: 'Standard-Kontierung (keine spezifische Regel)'
  };
}

function detectTaxCategory(data: ExtractedData): string {
  if (data.reverseCharge) return 'RC';
  if (data.kleinbetrag) return 'KLEIN';
  if (data.privatanteil) return 'PRIVAT';
  
  const net19 = Math.abs(data.mwstBetrag19 - (data.nettoBetrag * 0.19)) < 0.01;
  const net7 = Math.abs(data.mwstBetrag7 - (data.nettoBetrag * 0.07)) < 0.01;
  
  if (net19) return '19%';
  if (net7) return '7%';
  
  return '19%';
}

export function validateInvoiceData(data: ExtractedData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const expectedBrutto = data.nettoBetrag + data.mwstBetrag19 + data.mwstBetrag7 + data.mwstBetrag0;
  if (Math.abs(data.bruttoBetrag - expectedBrutto) > 0.01) {
    errors.push(`Summenprüfung fehlgeschlagen: ${data.nettoBetrag} + MwSt ≠ ${data.bruttoBetrag}`);
  }
  
  if (!data.lieferantName || data.lieferantName.length < 2) {
    errors.push('Lieferantenname fehlt oder ungültig');
  }
  
  if (!data.belegDatum || !/\d{4}-\d{2}-\d{2}/.test(data.belegDatum)) {
    errors.push('Belegdatum fehlt oder ungültig (YYYY-MM-DD erwartet)');
  }
  
  if (data.bruttoBetrag <= 0) {
    errors.push('Bruttobetrag muss größer als 0 sein');
  }
  
  return { valid: errors.length === 0, errors };
}

export function generateZoeInvoiceId(date: string, documents: DocumentRecord[]): string {
  const year = date.substring(0, 4) || new Date().getFullYear().toString();
  const yearDocs = documents.filter(d => d.data?.belegDatum?.startsWith(year));
  const nextNum = yearDocs.length + 1;
  return `ZOE-${year}-${nextNum.toString().padStart(4, '0')}`;
}

export function suggestTaxCategory(data: ExtractedData): TaxCategoryDefinition | null {
  const category = detectTaxCategory(data);
  return TAX_CATEGORIES.find(t => t.value === category) || null;
}
