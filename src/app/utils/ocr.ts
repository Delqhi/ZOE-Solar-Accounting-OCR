import { DocumentRecord, DocumentStatus, ExtractedData } from '../../types';

export type DuplicateMatch = { doc: DocumentRecord; reason: string; confidence: number };

export const classifyOcrOutcome = (
  data: ExtractedData
): { status: DocumentStatus; error?: string } => {
  const score = data.ocr_score ?? 0;
  const vendor = (data.lieferantName || '').toLowerCase();
  const rationale = (data.ocr_rationale || '').trim();
  const description = (data.beschreibung || '').trim();

  const msg = (rationale || description).toLowerCase();

  const isTechnicalFailure =
    msg.includes('siliconflow_api_key') ||
    msg.includes('api key') ||
    msg.includes('pdf ist zu groß') ||
    msg.includes('vision api error') ||
    msg.includes('gemini fehlgeschlagen') ||
    msg.includes('quota') ||
    msg.includes('http 4') ||
    msg.includes('http 5');

  const looksLikeManualTemplate =
    vendor.includes('manuelle eingabe') || (score <= 0 && (data.bruttoBetrag ?? 0) === 0);

  if (looksLikeManualTemplate) {
    const errorMsg = rationale || description || 'Analyse fehlgeschlagen. Bitte manuell erfassen.';
    return {
      status: isTechnicalFailure ? DocumentStatus.ERROR : DocumentStatus.REVIEW_NEEDED,
      error: errorMsg,
    };
  }

  if (
    rationale.includes('Datum unklar') ||
    rationale.includes('Summen widersprüchlich') ||
    score < 6
  ) {
    return { status: DocumentStatus.REVIEW_NEEDED, error: rationale || 'Bitte Daten prüfen.' };
  }

  return { status: DocumentStatus.COMPLETED, error: undefined };
};

export const findSemanticDuplicate = (
  data: Partial<ExtractedData>,
  existingDocs: DocumentRecord[]
): DuplicateMatch | undefined => {
  if (!data.bruttoBetrag && !data.belegNummerLieferant) return undefined;

  const normalize = (s: string | undefined) => (s ? s.toLowerCase().replace(/[^a-z0-9]/g, '') : '');

  const newInvoiceNum = normalize(data.belegNummerLieferant);
  const newAmount = data.bruttoBetrag;
  const newDate = data.belegDatum;
  const newVendor = normalize(data.lieferantName);

  for (const doc of existingDocs) {
    if (!doc.data || doc.status === DocumentStatus.ERROR || doc.status === DocumentStatus.DUPLICATE)
      continue;

    const existingInvNum = normalize(doc.data.belegNummerLieferant);
    const existingAmount = doc.data.bruttoBetrag;
    const existingDate = doc.data.belegDatum;

    if (newInvoiceNum.length >= 2 && newInvoiceNum === existingInvNum) {
      if (newAmount !== undefined && existingAmount !== undefined) {
        if (Math.abs(newAmount - existingAmount) < 0.1) {
          return {
            doc,
            reason: `Belegnummer (${doc.data.belegNummerLieferant}) und Betrag identisch.`,
            confidence: 0.95,
          };
        }
      }
    }

    if (newInvoiceNum.length >= 3 && newInvoiceNum === existingInvNum) {
      if (newDate && existingDate && newDate === existingDate) {
        return {
          doc,
          reason: `Belegnummer (${doc.data.belegNummerLieferant}) und Datum identisch.`,
          confidence: 0.9,
        };
      }
    }

    let score = 0;

    if (newAmount !== undefined && existingAmount !== undefined) {
      if (Math.abs(newAmount - existingAmount) < 0.05) score += 40;
    }

    if (newDate && existingDate && newDate === existingDate) score += 30;

    const existingVendor = normalize(doc.data.lieferantName);
    if (newVendor && existingVendor) {
      if (newVendor.includes(existingVendor) || existingVendor.includes(newVendor)) score += 20;
    }

    if (newInvoiceNum.length > 4 && existingInvNum.includes(newInvoiceNum)) score += 20;

    if (score >= 70) {
      return {
        doc,
        reason: 'Hohe Ähnlichkeit bei Datum, Betrag und Lieferant.',
        confidence: Math.min(0.89, score / 100),
      };
    }
  }

  return undefined;
};
