# Ralph Fix Plan

## High Priority

### 1. OCR Pipeline Implementation
- [ ] Implement Google Gemini 2.5 Flash OCR service (`geminiService.ts`)
- [ ] Create SiliconFlow Qwen 2.5 VL fallback service (`fallbackService.ts`)
- [ ] Build PDF preview component with pdfjs-dist
- [ ] Integrate drag & drop upload with file validation
- [ ] Implement OCR confidence scoring and rationale

### 2. SKR03 Accounting Engine
- [ ] Create rule engine for SKR03 standard mapping (20 accounts)
- [ ] Implement 6 tax categories classification
- [ ] Build vendor rules learning system
- [ ] Add quality validation (Net + VAT = Gross check)
- [ ] Create private document detection service

### 3. Export System
- [ ] Implement ELSTER XML generation for UStVA
- [ ] Create DATEV EXTF format export
- [ ] Build CSV export with 32 columns, semicolon separation
- [ ] Add SQL backup generation
- [ ] Create PDF report generation

### 4. Quality Assurance
- [ ] Implement duplicate detection V2 (hard + fuzzy + hash)
- [ ] Add OCR validation and error handling
- [ ] Create comprehensive unit tests (160+ tests)
- [ ] Implement backup/restore functionality

## Medium Priority

### 5. User Interface
- [ ] Build main DatabaseView with filter functionality
- [ ] Create DatabaseGrid with sortable columns
- [ ] Implement DetailModal split-view editor
- [ ] Add DuplicateCompareModal for conflict resolution
- [ ] Build SettingsView for application configuration

### 6. Backend Integration
- [ ] Complete Supabase CRUD operations (`supabaseService.ts`)
- [ ] Implement authentication UI
- [ ] Add real-time data synchronization
- [ ] Create backup/restore service

### 7. Data Models & Types
- [ ] Define ExtractedData interface with all fields
- [ ] Create DocumentRecord interface
- [ ] Implement LineItem interface
- [ ] Add TypeScript type definitions for exports

## Low Priority

### 8. Advanced Features
- [ ] KI-gestützte Korrekturvorschläge (AI correction suggestions)
- [ ] Mobile app support (React Native)
- [ ] Real-time collaboration features
- [ ] Advanced analytics dashboard

### 9. Performance & Optimization
- [ ] Image preprocessing for better OCR accuracy
- [ ] Batch processing for multiple invoices
- [ ] Caching strategies for vendor rules
- [ ] Performance monitoring and metrics

## Completed
- [x] Project initialization with React/TypeScript/Tailwind
- [x] Basic project structure established
- [x] Dependencies configured (Vite, Supabase, PDF libraries)
- [x] Development environment setup

## Notes
This project targets solar companies in Germany requiring:
- Professional accounting compliance (SKR03)
- Tax reporting (ELSTER)
- Accounting firm integration (DATEV)
- Cloud-first architecture (Supabase on OCI VM)
- AI-powered efficiency (Gemini OCR)

The codebase should maintain enterprise-grade quality with comprehensive testing and German accounting standards compliance.