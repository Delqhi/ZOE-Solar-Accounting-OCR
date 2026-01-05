import { AppSettings, DocumentRecord, DocumentStatus, ExtractedData } from '../types';

type PreflightIssueLevel = 'blocker' | 'warning';

export type ExportPreflightIssue = {
  level: PreflightIssueLevel;
  docId?: string;
  fileName?: string;
  message: string;
};

export type ExportPreflightResult = {
  blockers: ExportPreflightIssue[];
  warnings: ExportPreflightIssue[];
  totalDocs: number;
};

const EPS_WARNING = 0.05;
const EPS_BLOCKER = 0.5;

const isPresent = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'boolean') return true;
  return true;
};

const getRequiredFields = (settings?: AppSettings): Array<keyof ExtractedData> => {
  const fromSettings = settings?.ocrConfig?.required_fields || [];
  if (fromSettings.length > 0) return fromSettings as Array<keyof ExtractedData>;
  return ['belegDatum', 'bruttoBetrag', 'lieferantName'];
};

const safeDocLabel = (doc: DocumentRecord): { docId: string; fileName: string } => ({
  docId: doc.id,
  fileName: doc.fileName || doc.id,
});

export const runExportPreflight = (docs: DocumentRecord[], settings?: AppSettings): ExportPreflightResult => {
  const blockers: ExportPreflightIssue[] = [];
  const warnings: ExportPreflightIssue[] = [];
  const requiredFields = getRequiredFields(settings);

  const pushIssue = (issue: ExportPreflightIssue) => {
    (issue.level === 'blocker' ? blockers : warnings).push(issue);
  };

  for (const doc of docs) {
    const { docId, fileName } = safeDocLabel(doc);

    if (doc.status === DocumentStatus.PROCESSING) {
      pushIssue({ level: 'blocker', docId, fileName, message: 'Status ist PROCESSING (noch nicht fertig verarbeitet).' });
      continue;
    }

    if (doc.status === DocumentStatus.DUPLICATE) {
      pushIssue({ level: 'blocker', docId, fileName, message: 'Status ist DUPLICATE (Duplikat noch nicht bereinigt).' });
    }

    if (doc.status === DocumentStatus.ERROR) {
      pushIssue({ level: 'blocker', docId, fileName, message: 'Status ist ERROR (OCR fehlgeschlagen oder Daten unvollständig).' });
    }

    if (doc.status === DocumentStatus.REVIEW_NEEDED) {
      pushIssue({ level: 'blocker', docId, fileName, message: 'Status ist REVIEW_NEEDED (Beleg muss geprüft/korrigiert werden).' });
    }

    const data = doc.data;
    if (!data) {
      pushIssue({ level: 'blocker', docId, fileName, message: 'Keine extrahierten Daten vorhanden.' });
      continue;
    }

    // Pflichtfelder
    for (const field of requiredFields) {
      if (!isPresent((data as any)[field])) {
        pushIssue({ level: 'blocker', docId, fileName, message: `Pflichtfeld fehlt/leer: ${String(field)}` });
      }
    }

    // Baseline: Datum muss ISO sein (für SQL DATE)
    if (isPresent(data.belegDatum) && !/^\d{4}-\d{2}-\d{2}$/.test(String(data.belegDatum))) {
      pushIssue({ level: 'blocker', docId, fileName, message: 'belegDatum ist nicht im Format YYYY-MM-DD (ISO).' });
    }

    // Summenprüfung
    const brutto = Number(data.bruttoBetrag);
    const netto = Number(data.nettoBetrag);
    const mwst0 = Number(data.mwstBetrag0 || 0);
    const mwst7 = Number(data.mwstBetrag7 || 0);
    const mwst19 = Number(data.mwstBetrag19 || 0);

    if (Number.isFinite(brutto) && Number.isFinite(netto)) {
      const calcBrutto = netto + mwst0 + mwst7 + mwst19;
      const diff = Math.abs(calcBrutto - brutto);
      if (diff > EPS_BLOCKER) {
        pushIssue({
          level: 'blocker',
          docId,
          fileName,
          message: `Summenprüfung: Netto+MwSt=${calcBrutto.toFixed(2)} weicht von Brutto=${brutto.toFixed(2)} ab (Δ=${diff.toFixed(2)}).`,
        });
      } else if (diff > EPS_WARNING) {
        pushIssue({
          level: 'warning',
          docId,
          fileName,
          message: `Summenprüfung: kleine Abweichung (Δ=${diff.toFixed(2)}).`,
        });
      }
    }
  }

  return { blockers, warnings, totalDocs: docs.length };
};

export const formatPreflightForDialog = (result: ExportPreflightResult): { title: string; body: string } => {
  const maxItems = 5;
  const blockerLines = result.blockers.slice(0, maxItems).map(i => `- ${i.fileName}: ${i.message}`);
  const warningLines = result.warnings.slice(0, maxItems).map(i => `- ${i.fileName}: ${i.message}`);

  const moreBlockers = result.blockers.length > maxItems ? `\n… und ${result.blockers.length - maxItems} weitere.` : '';
  const moreWarnings = result.warnings.length > maxItems ? `\n… und ${result.warnings.length - maxItems} weitere.` : '';

  const bodyParts: string[] = [];
  bodyParts.push(`Belege geprüft: ${result.totalDocs}`);

  if (result.blockers.length > 0) {
    bodyParts.push(`\nBLOCKER (${result.blockers.length})`);
    bodyParts.push(...blockerLines);
    bodyParts.push(moreBlockers);
  }

  if (result.warnings.length > 0) {
    bodyParts.push(`\nWARNUNGEN (${result.warnings.length})`);
    bodyParts.push(...warningLines);
    bodyParts.push(moreWarnings);
  }

  return {
    title: result.blockers.length > 0 ? 'Export blockiert (Preflight)' : result.warnings.length > 0 ? 'Export mit Warnungen (Preflight)' : 'Export OK (Preflight)',
    body: bodyParts.filter(Boolean).join('\n'),
  };
};
