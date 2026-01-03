# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build, Test, and Dev Commands

```bash
npm run dev          # Start Vite dev server (port 3000)
npm run build        # Production build
npm run preview      # Preview production build
npm run typecheck    # TypeScript type checking (tsc --noEmit)
npm run check        # Typecheck + build
npm run test         # Run all tests (vitest run)
npm run test:watch   # Watch mode (vitest)
```

## Architecture Overview

**Type:** React 19 SPA with TypeScript, cloud-first architecture using Supabase (PostgreSQL on OCI)

**Data Flow:**
1. User uploads document via `UploadArea` → `useUpload` hook
2. `geminiService.analyzeDocument()` calls Gemini 2.5 Flash
3. `fallbackService` handles timeout → SiliconFlow Qwen 2.5 VL
4. `ruleEngine.applyRules()` applies SKR03 German accounting standards
5. `supabaseService.saveDocument()` persists to Supabase
6. `DatabaseGrid` displays documents with filtering/sorting

## Key Services Layer (`src/services/`)

| Service | Purpose |
|---------|---------|
| `geminiService.ts` | Primary OCR using Google Gemini 2.5 Flash |
| `fallbackService.ts` | Fallback OCR via SiliconFlow Qwen 2.5 VL |
| `supabaseService.ts` | Database CRUD operations + authentication |
| `ruleEngine.ts` | SKR03 account mapping (20 predefined accounts) |
| `elsterExport.ts` | Generate ELSTER XML for UStVA |
| `datevExport.ts` | Generate DATEV EXTF format forbuchungsstapel |
| `backupService.ts` | Backup/restore functionality |
| `privateDocumentDetection.ts` | Detect private vs business documents |

## Key Components (`src/components/`)

- `DatabaseView.tsx` - Main view with filters
- `DatabaseGrid.tsx` - Sortable document table
- `DetailModal.tsx` - Split-view document editor
- `UploadArea.tsx` - Drag & drop file upload
- `PdfViewer.tsx` - PDF rendering with pdfjs-dist

## Key Hooks (`src/hooks/`)

- `useDocuments.ts` - Document CRUD + pagination
- `useSettings.ts` - App settings management
- `useUpload.ts` - File upload + OCR pipeline

## Critical Path for Changes

When modifying document processing:
1. Check `types.ts` for `ExtractedData` and `DocumentRecord` interfaces
2. Update `geminiService.ts` or `fallbackService.ts` for OCR changes
3. Update `ruleEngine.ts` for accounting rule changes
4. Update `supabaseService.ts` for database schema changes
5. Tests exist alongside source files (e.g., `ruleEngine.test.ts`)

## Environment Variables (`.env`)

```env
VITE_SUPABASE_URL=        # Required - Supabase PostgreSQL URL
VITE_SUPABASE_ANON_KEY=   # Required - Supabase anonymous key
VITE_GEMINI_API_KEY=      # Optional - Primary OCR API
VITE_SILICONFLOW_API_KEY= # Optional - Fallback OCR API
```

## Project Conventions

- ESM module (`"type": "module"` in package.json)
- Path alias `@` resolves to project root
- Tailwind CSS 4 via CDN in `index.html`
- 160+ unit tests with Vitest + React Testing Library
- German/English mixed inline comments
- Tax categories: 19% Vorsteuer, 7% Vorsteuer, 0% PV, Reverse Charge, Kleinunternehmer, Privatanteil
