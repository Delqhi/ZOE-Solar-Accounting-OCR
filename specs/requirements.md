# Technical Specifications

## System Architecture Requirements

### Cloud-First Architecture
- **Backend**: Supabase PostgreSQL on OCI (Oracle Cloud Infrastructure) VM
- **Frontend**: React SPA hosted statically with API calls to Supabase
- **Storage**: Supabase Storage for document files (PDF, images)
- **Authentication**: Supabase Auth with email/password or SSO
- **No Local Storage**: Zero IndexedDB, localStorage, or local files

### AI OCR Pipeline Architecture
```
Upload → Preprocessing → Gemini 2.5 Flash → Rule Engine → Validation → Storage
    ↓
Fallback: SiliconFlow Qwen 2.5 VL if Gemini fails
```

### Data Flow
1. User uploads document (PDF/JPG/PNG/WebP)
2. PDF preview rendering with pdfjs-dist
3. AI service analysis (Gemini primary, SiliconFlow fallback)
4. Rule engine applies SKR03 standards and vendor rules
5. Validation checks (duplicate detection, sum validation)
6. Data stored in Supabase with preview URL
7. Export capabilities for ELSTER/DATEV

## Data Models and Structures

### ExtractedData Interface
```typescript
interface ExtractedData {
  // Basic Invoice Data
  belegDatum: string;                    // Invoice date (YYYY-MM-DD)
  belegNummerLieferant: string;          // Supplier invoice number
  lieferantName: string;                 // Supplier name
  lieferantAdresse: string;              // Supplier address
  steuernummer?: string;                 // Tax number (optional)

  // Financial Data
  nettoBetrag: number;                   // Net amount
  bruttoBetrag: number;                  // Gross amount
  mwstBetrag19: number;                  // 19% VAT amount
  mwstBetrag7: number;                   // 7% VAT amount
  mwstBetrag0: number;                   // 0% VAT amount
  mwstSatz19: number;                    // 19% VAT rate
  mwstSatz7: number;                     // 7% VAT rate
  mwstSatz0: number;                     // 0% VAT rate

  // Bookkeeping Data
  kontierungskonto: string;              // GL account (4-digit SKR03)
  sollKonto: string;                     // Debit account
  habenKonto: string;                    // Credit account
  steuerkategorie: string;               // Tax category (6 types)

  // Line Items
  lineItems: LineItem[];                 // Detailed line items

  // Quality Metrics
  ocr_score: number;                     // OCR confidence (0-1)
  ocr_rationale: string;                 // OCR reasoning
  textContent?: string;                  // Full extracted text (optional)
}

interface LineItem {
  description: string;                   // Item description
  amount: number;                        // Line amount
}
```

### DocumentRecord Interface
```typescript
interface DocumentRecord {
  id: string;                            // UUID
  fileName: string;                      // Original filename
  fileType: string;                      // MIME type
  uploadDate: string;                    // Upload timestamp (ISO)
  status: DocumentStatus;                // pending/processing/completed/duplicate/error
  data: ExtractedData | null;            // Extracted data
  previewUrl: string;                    // Supabase storage URL
  fileHash?: string;                     // SHA-256 hash for duplicate detection
  duplicateOfId?: string;                // Reference to duplicate document
  duplicateConfidence?: number;          // Duplicate confidence (0-1)
  duplicateReason?: string;              // Reason for duplicate flag
}

type DocumentStatus = 'pending' | 'processing' | 'completed' | 'duplicate' | 'error';
```

## API Specifications

### OCR Services

#### GeminiService
```typescript
interface GeminiService {
  analyzeDocument(file: File): Promise<ExtractedData>
  // Implementation details:
  // - Primary: Google Gemini 2.5 Flash API
  // - Timeout: 3 seconds
  // - Fallback: triggers fallbackService on timeout/error
}

// Environment variables:
VITE_GEMINI_API_KEY: string
```

#### FallbackService
```typescript
interface FallbackService {
  analyzeDocument(file: File): Promise<ExtractedData>
  // Implementation details:
  // - Secondary: SiliconFlow Qwen 2.5 VL
  // - Timeout: 5 seconds
  // - Used when Gemini fails
}

// Environment variables:
VITE_SILICONFLOW_API_KEY: string
```

### Supabase Service
```typescript
interface SupabaseService {
  getAllDocuments(filters?: DocumentFilters): Promise<DocumentRecord[]>
  saveDocument(doc: DocumentRecord): Promise<DocumentRecord>
  getDocument(id: string): Promise<DocumentRecord | null>
  updateDocument(id: string, updates: Partial<DocumentRecord>): Promise<DocumentRecord>
  deleteDocument(id: string): Promise<void>
  uploadFile(file: File, path: string): Promise<string>
  downloadFile(path: string): Promise<Blob>
}

interface DocumentFilters {
  dateFrom?: string
  dateTo?: string
  status?: DocumentStatus
  supplier?: string
  amountFrom?: number
  amountTo?: number
  page?: number
  pageSize?: number
}
```

### Rule Engine
```typescript
interface RuleEngine {
  applyRules(data: ExtractedData, vendorName: string): ExtractedData
  getSKR03Accounts(): SKR03Account[]
  getTaxCategories(): TaxCategory[]
  learnVendorRule(vendorName: string, account: string): Promise<void>
}

interface SKR03Account {
  code: string;                          // 4-digit account number
  name: string;                          // Account name
  description: string;                   // Account description
  category: string;                      // Account category
}

interface TaxCategory {
  code: string;                          // e.g., "19", "7", "0", "RC", "KU", "PR"
  description: string;                   // Description
  rate: number;                          // VAT rate (0.19, 0.07, 0.0)
}
```

## User Interface Requirements

### Main Components

#### DatabaseView
- **Purpose**: Main dashboard showing all documents
- **Features**: Filtering, sorting, pagination, bulk actions
- **Dependencies**: DatabaseGrid, FilterBar, custom hooks

#### DatabaseGrid
- **Purpose**: Sortable table displaying document list
- **Features**: Column sorting, selection, actions (edit, delete, export)
- **Columns**: Date, Supplier, Amount, Status, Actions

#### DetailModal
- **Purpose**: Split-view editor for document details
- **Features**: PDF preview on left, editable form on right
- **Fields**: All ExtractedData fields with validation

#### UploadArea
- **Purpose**: Drag & drop file upload
- **Features**: Multiple file support, preview, progress indicators
- **Validation**: File type, size limits, format support

#### SettingsView
- **Purpose**: Application configuration
- **Settings**: API keys, export preferences, backup settings

## Performance Requirements

### OCR Performance
- **Primary Engine**: < 3 seconds per document
- **Fallback Engine**: < 5 seconds per document
- **Accuracy**: > 99% for standard formats
- **File Size Limit**: 10MB per document
- **Concurrency**: Process multiple documents in parallel

### Application Performance
- **Initial Load**: < 3 seconds
- **Document List**: < 1 second for 1000 documents
- **Search/Filter**: < 500ms response time
- **Export Generation**: < 10 seconds for 1000 documents

### Scalability
- **Users**: Support 100 concurrent users
- **Documents**: Handle 100,000+ documents per organization
- **Storage**: Scale to 1TB+ of document storage
- **API Rate Limits**: Respect service provider limits

## Security Considerations

### Data Protection
- **Encryption**: All data encrypted at rest and in transit
- **Access Control**: Role-based permissions (admin, user, viewer)
- **Audit Logging**: Track all document access and modifications
- **GDPR Compliance**: Data deletion and export capabilities

### API Security
- **Authentication**: JWT tokens with Supabase Auth
- **Authorization**: Fine-grained permissions per document
- **Rate Limiting**: Protect against abuse
- **Input Validation**: Sanitize all user inputs

### Document Security
- **File Validation**: Check file types and content
- **Virus Scanning**: Integrate with security services
- **Access Logging**: Track document downloads and views
- **Retention Policies**: Automatic cleanup of old documents

## Integration Requirements

### ELSTER Integration
```xml
<!-- ELSTER XML Schema -->
<Elster xmlns="http://www.elster.de/2002/XMLSchema">
  <Umsatzsteuervoranmeldung>
    <Jahr>2025</Jahr>
    <Zeitraum>01</Zeitraum>
    <Kz21>steuerfreie Umsätze</Kz21>
    <Kz35>Reverse Charge</Kz35>
    <Kz81>7% Basis</Kz81>
    <Kz83>7% Steuer</Kz83>
    <Kz86>19% Basis</Kz86>
    <Kz89>19% Steuer</Kz89>
    <Kz93>Gesamtsteuer</Kz93>
  </Umsatzsteuervoranmeldung>
</Elster>
```

### DATEV Integration
- **Format**: EXTF (externes Format)
- **Kontenlänge**: 4-stellig (SKR03)
- **Währung**: EUR
- **Encoding**: UTF-8 with semicolon separation
- **Structure**: 32 columns including all necessary fields

### Backup/Export Formats
- **JSON**: Complete document data with metadata
- **SQL**: Full database schema and data
- **CSV**: Comma-separated values for analysis
- **PDF**: Formatted reports and summaries

## Quality Assurance

### Testing Strategy
- **Unit Tests**: 160+ tests covering all services and components
- **Integration Tests**: End-to-end workflows
- **Performance Tests**: OCR speed and accuracy validation
- **Security Tests**: Authentication and authorization

### Validation Rules
- **Sum Check**: Netto + MwSt = Brutto
- **Duplicate Detection**: SHA-256 hashing + fuzzy matching
- **Format Validation**: Date, amount, account number formats
- **Business Rules**: SKR03 compliance, tax category validation

### Monitoring
- **OCR Metrics**: Success rate, processing time, accuracy
- **System Metrics**: API response times, error rates
- **User Analytics**: Feature usage, performance bottlenecks
- **Alerting**: Critical failures and performance degradation