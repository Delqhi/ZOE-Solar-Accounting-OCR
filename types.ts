
export enum DocumentStatus {
  PROCESSING = 'PROCESSING',
  REVIEW_NEEDED = 'REVIEW_NEEDED',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
  DUPLICATE = 'DUPLICATE',
  PRIVATE = 'PRIVATE' // Document moved to belege_privat table
}

export enum DocumentTypeClassification {
  RECHNUNG = 'rechnung',
  BELEG_QUITTUNG = 'beleg_quittung',
  BESTELLBESTAETIGUNG = 'bestellbestaetigung',
  LIEFERSCHEIN = 'lieferschein',
  ANDERE = 'andere'
}

export interface RelatedDocumentMatch {
  documentId: string;
  matchScore: number;
  matchCriteria: {
    dateMatch: boolean;
    amountMatch: boolean;
    vendorMatch: boolean;
    typeCompatibility: boolean;
  };
}

export interface LineItem {
  description: string;
  amount?: number;
}

export interface TaxCategoryDefinition {
  value: string;
  label: string;
  ust_satz: number;
  vorsteuer: boolean;
  reverse_charge?: boolean;
}

export interface AccountDefinition {
  id: string;
  name: string;
  skr03: string; // New: Explicit SKR03 number
  steuerkategorien: string[]; // List of allowed tax category values
}

export interface ExtractedData {
  // Grunddaten
  documentType?: DocumentTypeClassification;
  documentTypeConfidence?: number;
  relatedDocumentIds?: string[];
  relatedDocumentMatches?: RelatedDocumentMatch[];

  belegDatum: string;
  belegNummerLieferant: string;
  lieferantName: string;
  lieferantAdresse: string;
  steuernummer: string;

  // Finanzielle Daten
  nettoBetrag: number;
  mwstSatz0: number;
  mwstBetrag0: number;
  mwstSatz7: number;
  mwstBetrag7: number;
  mwstSatz19: number;
  mwstBetrag19: number;
  bruttoBetrag: number;
  zahlungsmethode: string;

  // Positionen
  lineItems: LineItem[];

  // Neu: KI Klassifizierung / Kontierung
  kontierungskonto?: string; // ID from AccountDefinition
  steuerkategorie?: string;  // Value from TaxCategoryDefinition
  kontierungBegruendung?: string; // UI: "Warum dieses Konto?"
  
  // Legacy / Fallbacks
  kontogruppe: string; 
  konto_skr03: string; 
  ust_typ: string;     

  // Derived for internal consistency
  sollKonto: string; // Explicit Field for UI/DB
  habenKonto: string; // Explicit Field for UI/DB
  steuerKategorie: string; // Legacy string description

  // Organisatorisch
  eigeneBelegNummer: string; 
  zahlungsDatum: string;
  zahlungsStatus: string; 
  aufbewahrungsOrt: string; 
  rechnungsEmpfaenger: string;
  
  // Flags
  kleinbetrag: boolean;
  vorsteuerabzug: boolean;
  reverseCharge: boolean;
  privatanteil: boolean;
  
  // Content
  beschreibung: string;
  textContent?: string;

  // AI Quality & OCR Score
  qualityScore?: number; // Legacy
  ocr_score?: number;    // New System 0-10
  ocr_rationale?: string; // New System explanation
  
  // Memory System
  ruleApplied?: boolean; 
}

export interface Attachment {
    id: string;
    url: string;
    type: string;
    name: string;
}

export interface DocumentRecord {
  id: string;
  fileName: string;
  fileType: string;
  uploadDate: string;
  status: DocumentStatus;
  data: ExtractedData | null;
  error?: string;
  previewUrl?: string;

  // Multiple pages/attachments
  attachments?: Attachment[];

  fileHash?: string;
  duplicateOfId?: string;
  duplicateConfidence?: number;
  duplicateReason?: string;

  // Document relationships
  relatedDocumentIds?: string[];
  isOrphaned?: boolean;
  queueStatus?: string;
}

// --- Configuration Types ---

export interface AccountGroupDefinition {
  id: string;
  name: string;      
  skr03: string;     
  taxType: string;   
  keywords: string[]; 
  isRevenue: boolean; 
}

export interface ScoreDefinition {
  min_fields: number;
  desc: string;
}

export interface ValidationRules {
  sum_check: boolean;
  date_check: boolean;
  min_confidence: number;
}

export interface OCRConfig {
  scores: Record<string, ScoreDefinition>;
  required_fields: string[];
  field_weights: Record<string, number>;
  regex_patterns: Record<string, string>;
  validation_rules: ValidationRules;
}

export type ElsterRechtsform =
  | 'einzelunternehmen'
  | 'gmbh'
  | 'ug'
  | 'gbr'
  | 'ohg'
  | 'kg'
  | 'ev'
  | 'sonstiges';

export type ElsterBesteuerungUst = 'ist' | 'soll' | 'unbekannt';

export interface ElsterStammdaten {
  // Pflicht-Minimum
  unternehmensName: string;
  land: string; // ISO-3166-1 Alpha-2, z.B. DE
  plz: string;
  ort: string;
  strasse: string;
  hausnummer: string;
  eigeneSteuernummer: string;

  // Optional
  eigeneUstIdNr?: string;
  finanzamtName?: string;
  finanzamtNr?: string;
  rechtsform?: ElsterRechtsform;
  besteuerungUst?: ElsterBesteuerungUst;
  kleinunternehmer?: boolean;
  iban?: string;
  kontaktEmail?: string;
}

export interface StartupChecklist {
  uploadErsterBeleg: boolean;
  datevKonfiguriert: boolean;
  elsterStammdatenKonfiguriert: boolean;
}

export interface AppSettings {
  id: string;
  // New Configs
  taxDefinitions: TaxCategoryDefinition[];
  accountDefinitions: AccountDefinition[];

  // DATEV / Steuerberater-Übergabe
  datevConfig?: DatevConfig;

  // ELSTER (Mandanten-/Stammdaten)
  elsterStammdaten?: ElsterStammdaten;

  // Onboarding
  startupChecklist?: StartupChecklist;

  // Legacy
  accountGroups: AccountGroupDefinition[]; 
  ocrConfig: OCRConfig;
  taxCategories?: string[]; 
}

export interface DatevConfig {
  // Pflichtangaben für DATEV-Import (abhängig von Kanzlei/DATEV-Umgebung)
  beraterNr: string; // numeric string
  mandantNr: string; // numeric string
  wirtschaftsjahrBeginn: string; // YYYYMMDD
  sachkontenlaenge: number; // z.B. 4
  waehrung: string; // z.B. EUR

  // Optional
  herkunftKz: string; // z.B. RE
  diktatkuerzel?: string;
  stapelBezeichnung?: string;

  // Mapping: interne Steuerkategorie -> DATEV BU-Schlüssel
  taxCategoryToBuKey: Record<string, string>;
}

export interface VendorRule {
  vendorName: string;      
  accountGroupName: string; // Legacy
  accountId?: string;       // New
  taxCategoryValue?: string; // New
  lastUpdated: string;
  useCount: number;
}

// OCR Provider Interface for interchangeability
export interface OcrProvider {
  analyzeDocument(base64Data: string, mimeType: string): Promise<Partial<ExtractedData>>;
}
