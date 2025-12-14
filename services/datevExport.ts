import { AppSettings, DatevConfig, DocumentRecord, DocumentStatus } from '../types';
import { ExportPreflightIssue, ExportPreflightResult, runExportPreflight } from './exportPreflight';
import { EXTF_COLUMN_HEADERS, EXTF_HEADER1_TEMPLATE_FIELDS } from './datevExtfTemplate';

export type DatevPreflightResult = ExportPreflightResult;

const isIsoDate = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

const toYyyymmdd = (iso: string): string => iso.replace(/-/g, '');

const toDdmm = (iso: string): string => {
  // DATEV example uses DDMM (without year)
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return '';
  return `${m[3]}${m[2]}`;
};

const nowDatevTimestamp = (): string => {
  // Example: 20180306102500000 (17 digits)
  const d = new Date();
  const pad = (n: number, len: number) => String(n).padStart(len, '0');
  return (
    `${d.getFullYear()}` +
    `${pad(d.getMonth() + 1, 2)}` +
    `${pad(d.getDate(), 2)}` +
    `${pad(d.getHours(), 2)}` +
    `${pad(d.getMinutes(), 2)}` +
    `${pad(d.getSeconds(), 2)}` +
    '00000'
  );
};

const quoteIfNeeded = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (s === '') return '';

  // Keep typical DATEV numeric formats unquoted (e.g., 24,95)
  if (/^-?\d+(,\d{1,2})?$/.test(s)) return s;

  return `"${s.replace(/"/g, '""')}"`;
};

const formatAmount = (value: unknown): string => {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '';
  // DATEV example uses comma decimal separator and no thousands separators
  return n.toFixed(2).replace('.', ',');
};

const sumToBrutto = (netto: unknown, mwst0: unknown, mwst7: unknown, mwst19: unknown): number | undefined => {
  const nNetto = typeof netto === 'number' ? netto : Number(netto);
  if (!Number.isFinite(nNetto)) return undefined;
  const n0 = Number(mwst0 || 0);
  const n7 = Number(mwst7 || 0);
  const n19 = Number(mwst19 || 0);
  if (![n0, n7, n19].every(Number.isFinite)) return undefined;
  return nNetto + n0 + n7 + n19;
};

const DATEV_BANK_KONTO = '1200';

const isBankAccount = (konto: string): boolean => konto === DATEV_BANK_KONTO;

const getDatevConfig = (settings?: AppSettings): DatevConfig | undefined => settings?.datevConfig;

export function runDatevExportPreflight(docs: DocumentRecord[], settings?: AppSettings): DatevPreflightResult {
  const base = runExportPreflight(docs, settings);
  const blockers: ExportPreflightIssue[] = [...base.blockers];
  const warnings: ExportPreflightIssue[] = [...base.warnings];

  const push = (level: 'blocker' | 'warning', message: string) => {
    (level === 'blocker' ? blockers : warnings).push({ level, message });
  };

  const cfg = getDatevConfig(settings);
  if (!cfg) {
    push('blocker', 'DATEV-Konfiguration fehlt (Einstellungen → DATEV Export).');
    return { blockers, warnings, totalDocs: docs.length };
  }

  if (!cfg.beraterNr?.trim()) push('blocker', 'DATEV: Berater-Nr. ist leer.');
  if (!cfg.mandantNr?.trim()) push('blocker', 'DATEV: Mandant-Nr. ist leer.');
  if (!cfg.wirtschaftsjahrBeginn?.trim()) push('blocker', 'DATEV: Wirtschaftsjahr-Beginn ist leer (YYYYMMDD).');

  if (cfg.beraterNr && !/^\d+$/.test(cfg.beraterNr.trim())) push('blocker', 'DATEV: Berater-Nr. muss numerisch sein.');
  if (cfg.mandantNr && !/^\d+$/.test(cfg.mandantNr.trim())) push('blocker', 'DATEV: Mandant-Nr. muss numerisch sein.');
  if (cfg.wirtschaftsjahrBeginn && !/^\d{8}$/.test(cfg.wirtschaftsjahrBeginn.trim())) {
    push('blocker', 'DATEV: Wirtschaftsjahr-Beginn muss das Format YYYYMMDD haben.');
  }

  // Used tax categories must be mapped to BU key
  const usedTaxCategories = new Set<string>();
  for (const doc of docs) {
    if (doc.status === DocumentStatus.DUPLICATE) continue;
    const tax = doc.data?.steuerkategorie;
    if (tax) usedTaxCategories.add(tax);
  }
  for (const tax of usedTaxCategories) {
    const mapped = (cfg.taxCategoryToBuKey || {})[tax];
    if (!mapped || !mapped.trim()) push('blocker', `DATEV: BU-Schlüssel Mapping fehlt für Steuerkategorie „${tax}“.`);
  }

  // Soft checks
  if (!cfg.waehrung?.trim()) push('warning', 'DATEV: Währung ist leer (Standard: EUR).');

  for (const doc of docs) {
    if (doc.status === DocumentStatus.DUPLICATE) continue;
    const d = doc.data;
    if (!d) continue;
    const soll = d.sollKonto || '';
    const haben = d.habenKonto || '';

    const expectedLen = cfg.sachkontenlaenge;
    if (expectedLen && /^\d+$/.test(soll) && soll.length !== expectedLen) {
      push('warning', `DATEV: Soll-Konto „${soll}“ passt nicht zur Sachkontenlänge ${expectedLen}.`);
      break;
    }
    if (expectedLen && /^\d+$/.test(haben) && haben.length !== expectedLen) {
      push('warning', `DATEV: Haben-Konto „${haben}“ passt nicht zur Sachkontenlänge ${expectedLen}.`);
      break;
    }
  }

  return { blockers, warnings, totalDocs: docs.length };
}

export function generateDatevExtfBuchungsstapelCsv(
  docs: DocumentRecord[],
  settings: AppSettings,
  opts?: { stapelBezeichnung?: string }
): { csv: string; filename: string } {
  const cfg = getDatevConfig(settings);
  if (!cfg) throw new Error('DATEV-Konfiguration fehlt.');

  const exportable = docs.filter(d => d.status !== DocumentStatus.DUPLICATE);

  const belegDates = exportable
    .map(d => d.data?.belegDatum)
    .filter(isIsoDate);

  const fromIso = belegDates.length ? belegDates.reduce((a, b) => (a < b ? a : b)) : new Date().toISOString().slice(0, 10);
  const toIso = belegDates.length ? belegDates.reduce((a, b) => (a > b ? a : b)) : new Date().toISOString().slice(0, 10);

  const header1 = [...EXTF_HEADER1_TEMPLATE_FIELDS];
  // Indices derived from public example structure
  header1[5] = nowDatevTimestamp();
  header1[7] = 'ZOE';
  header1[8] = 'ZOE Solar Accounting OCR';
  header1[10] = cfg.beraterNr.trim();
  header1[11] = cfg.mandantNr.trim();
  header1[12] = cfg.wirtschaftsjahrBeginn.trim();
  header1[14] = toYyyymmdd(fromIso);
  header1[15] = toYyyymmdd(toIso);
  header1[16] = opts?.stapelBezeichnung || cfg.stapelBezeichnung || 'Buchungsstapel';
  header1[21] = cfg.waehrung || 'EUR';

  const columnIndex = new Map<string, number>();
  EXTF_COLUMN_HEADERS.forEach((h, i) => columnIndex.set(h.trim(), i));

  const idx = (name: string): number => {
    const i = columnIndex.get(name);
    if (i === undefined) throw new Error(`DATEV-Spalte nicht gefunden: ${name}`);
    return i;
  };

  const iUmsatz = idx('Umsatz (ohne Soll/Haben-Kz)');
  const iShkz = idx('Soll/Haben-Kennzeichen');
  const iWkz = idx('WKZ Umsatz');
  const iKonto = idx('Konto');
  const iGegenkonto = idx('Gegenkonto (ohne BU-Schlüssel)');
  const iBu = idx('BU-Schlüssel');
  const iBelegdatum = idx('Belegdatum');
  const iBelegfeld1 = idx('Belegfeld 1');
  const iBelegfeld2 = idx('Belegfeld 2');
  const iBuchungstext = idx('Buchungstext');
  const iHerkunft = idx('Herkunft-Kz');

  const lines: string[] = [];
  lines.push(header1.map(quoteIfNeeded).join(';'));
  // In the DATEV example, column headers are unquoted
  lines.push(EXTF_COLUMN_HEADERS.join(';'));

  for (const doc of exportable) {
    const d = doc.data;
    if (!d) continue;

    const row = new Array(EXTF_COLUMN_HEADERS.length).fill('');

    const tax = d.steuerkategorie || '';
    const bu = tax ? (cfg.taxCategoryToBuKey || {})[tax] || '' : '';

    // Fixed rule: prefer Bankkonto 1200 as `Konto`.
    const soll = d.sollKonto || '';
    const haben = d.habenKonto || '';
    const sollIsBank = isBankAccount(soll);
    const habenIsBank = isBankAccount(haben);

    let konto = haben;
    let gegenkonto = soll;
    let shkz: 'S' | 'H' = 'H';

    if (sollIsBank && !habenIsBank) {
      konto = soll;
      gegenkonto = haben;
      shkz = 'S';
    } else if (habenIsBank && !sollIsBank) {
      konto = haben;
      gegenkonto = soll;
      shkz = 'H';
    }

    const brutto = Number(d.bruttoBetrag);
    const amount = Number.isFinite(brutto)
      ? brutto
      : (sumToBrutto(d.nettoBetrag, d.mwstBetrag0, d.mwstBetrag7, d.mwstBetrag19) ?? NaN);

    row[iUmsatz] = formatAmount(amount);
    row[iShkz] = shkz;
    row[iWkz] = cfg.waehrung || 'EUR';
    row[iKonto] = konto;
    row[iGegenkonto] = gegenkonto;
    row[iBu] = bu;

    if (isIsoDate(d.belegDatum)) row[iBelegdatum] = toDdmm(d.belegDatum);

    row[iBelegfeld1] = d.belegNummerLieferant || d.eigeneBelegNummer || '';
    row[iBelegfeld2] = d.eigeneBelegNummer || '';

    const textParts = [d.lieferantName, d.beschreibung].filter(Boolean);
    row[iBuchungstext] = textParts.join(' - ').slice(0, 60);

    row[iHerkunft] = cfg.herkunftKz || 'RE';

    lines.push(row.map(quoteIfNeeded).join(';'));
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `zoe_datev_extf_buchungsstapel_${timestamp}.csv`;
  return { csv: lines.join('\r\n') + '\r\n', filename };
}
