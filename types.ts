
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
  documentType?: string; 
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
  
  // New: Multiple pages/attachments
  attachments?: Attachment[];
  
  fileHash?: string;
  duplicateOfId?: string;
  duplicateConfidence?: number;
  duplicateReason?: string;
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

export interface AppSettings {
  id: string;
  // New Configs
  taxDefinitions: TaxCategoryDefinition[];
  accountDefinitions: AccountDefinition[];
  
  // Legacy
  accountGroups: AccountGroupDefinition[]; 
  ocrConfig: OCRConfig;
  taxCategories?: string[]; 
}

export interface VendorRule {
  vendorName: string;      
  accountGroupName: string; // Legacy
  accountId?: string;       // New
  taxCategoryValue?: string; // New
  lastUpdated: string;
  useCount: number;
}
