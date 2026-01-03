import { ExtractedData, LineItem, DocumentTypeClassification } from "../types";

const documentTypeMap: Record<string, DocumentTypeClassification> = {
  'rechnung': DocumentTypeClassification.RECHNUNG,
  'invoice': DocumentTypeClassification.RECHNUNG,
  'beleg': DocumentTypeClassification.BELEG_QUITTUNG,
  'quittung': DocumentTypeClassification.BELEG_QUITTUNG,
  'kassenzettel': DocumentTypeClassification.BELEG_QUITTUNG,
  'receipt': DocumentTypeClassification.BELEG_QUITTUNG,
  'bestellbestaetigung': DocumentTypeClassification.BESTELLBESTAETIGUNG,
  'order confirmation': DocumentTypeClassification.BESTELLBESTAETIGUNG,
  'lieferschein': DocumentTypeClassification.LIEFERSCHEIN,
  'delivery note': DocumentTypeClassification.LIEFERSCHEIN,
  'andere': DocumentTypeClassification.ANDERE,
  'other': DocumentTypeClassification.ANDERE
};

const normalizeDocumentType = (value: unknown): {
  type: DocumentTypeClassification | undefined;
  confidence: number;
} => {
  if (typeof value !== 'string') {
    return { type: undefined, confidence: 1.0 };
  }

  const normalized = value.toLowerCase().trim();

  return {
    type: documentTypeMap[normalized] || DocumentTypeClassification.ANDERE,
    confidence: documentTypeMap[normalized] ? 0.95 : 0.5
  };
};

const isIsoDate = (value: unknown): boolean =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

const pad2 = (n: number) => n.toString().padStart(2, "0");

const toIsoDateFromParts = (year: number, month: number, day: number): string | undefined => {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return undefined;
  if (year < 1900 || year > 2200) return undefined;
  if (month < 1 || month > 12) return undefined;
  if (day < 1 || day > 31) return undefined;

  const iso = `${year}-${pad2(month)}-${pad2(day)}`;
  const d = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return undefined;

  // reject impossible dates like 2025-02-31
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const dd = d.getUTCDate();
  if (y !== year || m !== month || dd !== day) return undefined;
  return iso;
};

const parseDateToIso = (value: unknown): { iso?: string; hadInput: boolean } => {
  if (value === null || value === undefined) return { hadInput: false };
  const raw: string = typeof value === "string" ? value.trim() : String(value).trim();
  if (!raw) return { hadInput: false };
  if (isIsoDate(raw)) return { iso: raw, hadInput: true };

  // Common formats:
  // DD.MM.YYYY | D.M.YYYY | DD/MM/YYYY | DD-MM-YYYY
  // YYYY/MM/DD
  // DD.MM.YY
  const m1 = raw.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2}|\d{4})$/);
  if (m1) {
    const day = Number(m1[1]);
    const month = Number(m1[2]);
    let year = Number(m1[3]);
    if (m1[3].length === 2) {
      // Use 30-year sliding window: 00-29 → 2000-2029, 30-99 → 1930-1999
      year = year < 30 ? 2000 + year : 1900 + year;
    }
    return { iso: toIsoDateFromParts(year, month, day), hadInput: true };
  }

  const m2 = raw.match(/^(\d{4})[.\/-](\d{1,2})[.\/-](\d{1,2})$/);
  if (m2) {
    const year = Number(m2[1]);
    const month = Number(m2[2]);
    const day = Number(m2[3]);
    return { iso: toIsoDateFromParts(year, month, day), hadInput: true };
  }

  // Last resort: Date.parse (kept conservative; locale parsing is unreliable)
  const t = Date.parse(raw);
  if (Number.isFinite(t)) {
    const d = new Date(t);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return { iso: toIsoDateFromParts(year, month, day), hadInput: true };
  }

  return { hadInput: true };
};

const toStringSafe = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const parseNumber = (value: unknown): { ok: boolean; value?: number } => {
  if (typeof value === "number" && Number.isFinite(value)) return { ok: true, value };
  if (value === null || value === undefined) return { ok: false };

  const raw = typeof value === "string" ? value.trim() : String(value).trim();
  if (!raw) return { ok: false };

  // Keep digits + separators + minus; strip currency symbols and spaces.
  // Examples: "1.234,56 €" -> "1.234,56"; "1 234,56" -> "1234,56"
  let s = raw
    .replace(/\s|\u00A0/g, "")
    .replace(/[€$£¥]|EUR|EURO/gi, "")
    .replace(/[^0-9,.-]/g, "");

  if (!s) return { ok: false };

  // Handle parentheses for negatives: (123,45)
  if (/^\(.*\)$/.test(s)) s = `-${s.slice(1, -1)}`;

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  // Thousand-separator-only forms like 1.234.567
  if (!hasComma && /^-?\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, "");
  }
  if (!hasDot && /^-?\d{1,3}(,\d{3})+$/.test(s)) {
    s = s.replace(/,/g, "");
  }

  if (hasComma && hasDot) {
    // Choose decimal separator by last occurrence
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    if (lastComma > lastDot) {
      // comma decimal, dots thousand
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      // dot decimal, commas thousand
      s = s.replace(/,/g, "");
    }
  } else if (hasComma) {
    // comma decimal
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    // dot decimal (default)
    // keep as is
  }

  const parsed = Number(s);
  if (!Number.isFinite(parsed)) return { ok: false };
  return { ok: true, value: parsed };
};

const toNumberSafe = (value: unknown, fallback = 0): number => {
  const res = parseNumber(value);
  return res.ok && res.value !== undefined ? res.value : fallback;
};

const toNumberMaybe = (value: unknown): number | undefined => {
  const res = parseNumber(value);
  return res.ok ? res.value : undefined;
};

const toBooleanSafe = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (["true", "1", "yes", "ja"].includes(v)) return true;
    if (["false", "0", "no", "nein"].includes(v)) return false;
  }
  if (typeof value === "number") return value !== 0;
  return fallback;
};

const normalizeLineItems = (value: unknown): LineItem[] => {
  const arr = Array.isArray(value)
    ? value
    : (value && typeof value === "object" ? [value] : []);

  return arr
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const anyItem = item as any;
      const description = toStringSafe(anyItem.description, "").trim();
      const amount = anyItem.amount === undefined || anyItem.amount === null
        ? undefined
        : toNumberMaybe(anyItem.amount);
      if (!description) return null;
      const li: LineItem = amount === undefined ? { description } : { description, amount };
      return li;
    })
    .filter((x): x is LineItem => Boolean(x));
};

export const normalizeExtractedData = (input: Partial<ExtractedData> | unknown): ExtractedData => {
  const obj: any = (input && typeof input === "object") ? input : {};

  const warnings: string[] = [];

  const todayIso = new Date().toISOString().split("T")[0];

  const belegDatumParsed = parseDateToIso(obj.belegDatum);
  const belegDatum = belegDatumParsed.iso || todayIso;
  if (belegDatumParsed.hadInput && !belegDatumParsed.iso) {
    warnings.push("Datum unklar – bitte prüfen");
  }

  const nettoBetrag = toNumberSafe(obj.nettoBetrag, 0);
  const mwstBetrag0 = toNumberSafe(obj.mwstBetrag0, 0);
  const mwstBetrag7 = toNumberSafe(obj.mwstBetrag7, 0);
  const mwstBetrag19 = toNumberSafe(obj.mwstBetrag19, 0);

  const bruttoParsed = parseNumber(obj.bruttoBetrag);
  let bruttoBetrag = bruttoParsed.ok && bruttoParsed.value !== undefined ? bruttoParsed.value : 0;

  // Summen/Rundungs-Guardrail:
  // - if brutto missing/0 but net+tax exists => derive brutto
  // - if conflict exists => warn (do not silently overwrite brutto)
  const taxSum = mwstBetrag0 + mwstBetrag7 + mwstBetrag19;
  const netPlusTax = nettoBetrag + taxSum;
  const hasNet = nettoBetrag > 0;
  const hasAnyTax = Math.abs(taxSum) > 0;
  const tolerance = 0.05;

  if ((bruttoBetrag === 0 || !bruttoParsed.ok) && hasNet && (hasAnyTax || netPlusTax > 0)) {
    bruttoBetrag = Math.round(netPlusTax * 100) / 100;
  } else if (bruttoBetrag > 0 && hasNet) {
    const diff = Math.abs(netPlusTax - bruttoBetrag);
    if (diff > tolerance && (hasAnyTax || netPlusTax > 0)) {
      warnings.push(`Summen widersprüchlich (Netto+MwSt vs. Brutto, Δ=${diff.toFixed(2)}€) – bitte prüfen`);
    }
  }

  const documentTypeNormalized = normalizeDocumentType(obj.documentType);
  const documentType = documentTypeNormalized.type;
  const documentTypeConfidence = typeof obj.documentTypeConfidence === 'number'
    ? Math.max(0, Math.min(1, obj.documentTypeConfidence))
    : documentTypeNormalized.confidence;

  const existingRationale = obj.ocr_rationale !== undefined ? toStringSafe(obj.ocr_rationale, "") : undefined;
  const combinedRationale = (
    [existingRationale, ...(warnings.length ? [warnings.join(". ")] : [])]
      .filter((x) => typeof x === "string" && x.trim().length > 0)
      .join(" | ")
  ) || undefined;

  return {
    documentType,
    documentTypeConfidence,
    relatedDocumentIds: obj.relatedDocumentIds || [],
    relatedDocumentMatches: obj.relatedDocumentMatches || [],

    belegDatum,
    belegNummerLieferant: toStringSafe(obj.belegNummerLieferant, ""),
    lieferantName: toStringSafe(obj.lieferantName, ""),
    lieferantAdresse: toStringSafe(obj.lieferantAdresse, ""),
    steuernummer: toStringSafe(obj.steuernummer, ""),

    nettoBetrag,
    mwstSatz0: toNumberSafe(obj.mwstSatz0, 0),
    mwstBetrag0,
    mwstSatz7: toNumberSafe(obj.mwstSatz7, 0),
    mwstBetrag7,
    mwstSatz19: toNumberSafe(obj.mwstSatz19, 0),
    mwstBetrag19,
    bruttoBetrag,
    zahlungsmethode: toStringSafe(obj.zahlungsmethode, ""),

    lineItems: normalizeLineItems(obj.lineItems),

    kontierungskonto: obj.kontierungskonto ? toStringSafe(obj.kontierungskonto, "") : undefined,
    steuerkategorie: obj.steuerkategorie ? toStringSafe(obj.steuerkategorie, "") : undefined,
    kontierungBegruendung: obj.kontierungBegruendung ? toStringSafe(obj.kontierungBegruendung, "") : undefined,

    kontogruppe: toStringSafe(obj.kontogruppe, ""),
    konto_skr03: toStringSafe(obj.konto_skr03, ""),
    ust_typ: toStringSafe(obj.ust_typ, ""),

    sollKonto: toStringSafe(obj.sollKonto, ""),
    habenKonto: toStringSafe(obj.habenKonto, ""),
    steuerKategorie: toStringSafe(obj.steuerKategorie, ""),

    eigeneBelegNummer: toStringSafe(obj.eigeneBelegNummer, ""),
    zahlungsDatum: toStringSafe(obj.zahlungsDatum, ""),
    zahlungsStatus: toStringSafe(obj.zahlungsStatus, ""),
    aufbewahrungsOrt: toStringSafe(obj.aufbewahrungsOrt, ""),
    rechnungsEmpfaenger: toStringSafe(obj.rechnungsEmpfaenger, ""),

    kleinbetrag: toBooleanSafe(obj.kleinbetrag, false),
    vorsteuerabzug: toBooleanSafe(obj.vorsteuerabzug, false),
    reverseCharge: toBooleanSafe(obj.reverseCharge, false),
    privatanteil: toBooleanSafe(obj.privatanteil, false),

    beschreibung: toStringSafe(obj.beschreibung, ""),
    textContent: obj.textContent !== undefined ? toStringSafe(obj.textContent, "") : undefined,

    qualityScore: obj.qualityScore !== undefined ? toNumberSafe(obj.qualityScore, 0) : undefined,
    ocr_score: obj.ocr_score !== undefined ? toNumberSafe(obj.ocr_score, 0) : undefined,
    ocr_rationale: combinedRationale,

    ruleApplied: obj.ruleApplied !== undefined ? toBooleanSafe(obj.ruleApplied, false) : undefined
  };
};
