
export enum DocumentStatus {
  PROCESSING = 'PROCESSING',
  REVIEW_NEEDED = 'REVIEW_NEEDED',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
  DUPLICATE = 'DUPLICATE'
}

export interface LineItem {
  description: string;
  amount?: number;
}

export interface ExtractedData {
  // Grunddaten
  belegDatum: string;
  belegNummerLieferant: string;
  lieferantName: string;
  lieferantAdresse: string;
  steuernummer: string;

  // Finanzielle Daten
  nettoBetrag: number;
  mwstSatz7: number; // e.g. 0.07
  mwstBetrag7: number;
  mwstSatz19: number; // e.g. 0.19
  mwstBetrag19: number;
  bruttoBetrag: number;
  zahlungsmethode: string; // Bar, EC, Überweisung, Kreditkarte

  // Positionen
  lineItems: LineItem[];

  // Kategorisierung & Buchhaltung
  kostenstelle: string;
  projekt: string; // Projekt- oder Auftragszuordnung
  sollKonto: string; // z.B. 4220, 3100
  habenKonto: string; // z.B. 1200, 1800, 1000
  steuerKategorie: string; // z.B. "19% Vorsteuer", "0% PV"

  // Organisatorisch / Generierte Felder
  eigeneBelegNummer: string; // ZOE2512.1
  zahlungsDatum: string;
  zahlungsStatus: string; // bezahlt/offen
  aufbewahrungsOrt: string; // Betriebseigene Cloud-Storage
  rechnungsEmpfaenger: string; // ZOE Solar, Inh. Jeremy Schulze...
  
  // Besonderheiten / Flags
  kleinbetrag: boolean;
  vorsteuerabzug: boolean;
  reverseCharge: boolean;
  privatanteil: boolean;
  
  // Optional
  beschreibung: string;
  
  // Raw text for rules engine
  textContent?: string;
}

export interface DocumentRecord {
  id: string;
  fileName: string;
  fileType: string;
  uploadDate: string;
  status: DocumentStatus;
  data: ExtractedData | null;
  error?: string;
  previewUrl?: string; // For displaying the image/pdf preview
  
  // Duplicate Detection
  fileHash?: string;
  duplicateOfId?: string;
}

export interface AppSettings {
  id: string; // usually 'global'
  taxCategories: string[];
}
