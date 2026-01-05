/**
 * Type Definitions - Centralized
 * Defines all application types
 */

// ==================== Core Domain Types ====================

export interface ExtractedData {
  belegDatum?: string;
  lieferantName?: string;
  bruttoBetrag?: number;
  amountNetto?: number;
  amountMwSt?: number;
  steuerkategorie?: string;
  kontierungskonto?: string;
  description?: string;
  isPrivate?: boolean;
  requiresReview?: boolean;
  ocr_quality?: number;
  ocr_rationale?: string;
  lineItems?: LineItem[];
}

export interface LineItem {
  description: string;
  amount: number;
  quantity?: number;
}

export interface Attachment {
  id: string;
  url: string;
  type: string;
  name: string;
}

export enum DocumentStatus {
  COMPLETED = 'COMPLETED',
  REVIEW_NEEDED = 'REVIEW_NEEDED',
  DUPLICATE = 'DUPLICATE',
  ERROR = 'ERROR',
  PROCESSING = 'PROCESSING',
  PRIVATE = 'PRIVATE',
}

export interface DocumentRecord {
  id: string;
  zoeId?: string;
  fileName: string;
  fileType: string;
  uploadDate: string;
  previewUrl?: string;
  attachments?: Attachment[];
  data?: ExtractedData;
  status: DocumentStatus;
  error?: string;
  duplicateOfId?: string;
  fileHash?: string;
  source?: 'upload' | 'import';
}

export interface AppSettings {
  theme: 'light' | 'dark';
  exportFormat: 'ELSTER' | 'DATEV' | 'CSV' | 'SQL';
  defaultTaxRate: number;
  ocrConfig: OCRConfig;
  accountDefinitions: AccountDefinition[];
  taxDefinitions: TaxDefinition[];
  supabaseConfig?: SupabaseConfig;
  elsterConfig?: ElsterConfig;
  datevConfig?: DatevConfig;
}

export interface OCRConfig {
  provider: 'gemini' | 'siliconflow';
  timeout: number;
  required_fields: string[];
}

export interface AccountDefinition {
  id: string;
  name: string;
  steuerkategorien: string[];
}

export interface TaxDefinition {
  value: string;
  label: string;
  type: 'regular' | 'reduced' | 'exempt';
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  syncInterval: number;
}

export interface ElsterConfig {
  taxNumber: string;
  period: string;
  contactEmail: string;
}

export interface DatevConfig {
  accountLength: number;
  buSchluessel: string;
  exportFormat: string;
}

// ==================== Context Types ====================

export interface AppState {
  documents: DocumentRecord[];
  settings: AppSettings;
  loading: boolean;
  error: string | null;
  selectedDocumentId: string | null;
  filters: {
    year: string;
    quarter: string;
    month: string;
    status: string;
    vendor: string;
  };
}

export interface AppContextType {
  state: AppState;
  addDocument: (doc: DocumentRecord) => Promise<void>;
  updateDocument: (doc: DocumentRecord) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  selectDocument: (id: string | null) => void;
  updateFilters: (filters: Partial<AppState['filters']>) => void;
  clearFilters: () => void;
  retryOCR: (doc: DocumentRecord) => Promise<void>;
  mergeDocuments: (sourceId: string, targetId: string) => Promise<void>;
}

// ==================== OCR Service Types ====================

export interface OCRResult {
  success: boolean;
  data?: ExtractedData;
  error?: string;
  quality?: number;
  provider?: string;
  duration?: number;
}

export interface OCRRequest {
  base64: string;
  mimeType: string;
  fileName: string;
}

// ==================== Export Types ====================

export interface ExportData {
  documents: DocumentRecord[];
  format: string;
  timestamp: string;
  version: string;
}

export interface ElsterExport extends ExportData {
  format: 'ELSTER';
  xml: string;
  period: string;
  taxNumber: string;
}

export interface DatevExport extends ExportData {
  format: 'DATEV';
  csv: string;
  header: string[];
}

// ==================== Validation Types ====================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ==================== API Types ====================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
  success: boolean;
}

// ==================== Analytics Types ====================

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: number;
}

// ==================== Security Types ====================

export interface SecurityContext {
  userId?: string;
  sessionId?: string;
  ip?: string;
  userAgent: string;
  timestamp: number;
}

// ==================== Error Types ====================

export interface AppError {
  message: string;
  code?: string;
  context?: any;
  timestamp: number;
}

// ==================== Helper Types ====================

/**
 * Utility type for making all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Utility type for non-nullable properties
 */
export type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

/**
 * Union type for all supported file types
 */
export type SupportedFileType = 'application/pdf' | 'image/jpeg' | 'image/jpg' | 'image/png' | 'image/webp';

/**
 * Type for filter state used in tables
 */
export interface FilterState {
  year: string;
  quarter: string;
  month: string;
  status: string;
  vendor: string;
  dateRange: { start: string; end: string };
}
