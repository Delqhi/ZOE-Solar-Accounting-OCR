# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Client-only SPA for German accounting/OCR - automated invoice extraction for solar companies. Uses Supabase DB for data and GitLab for file storage.

## Commands

```bash
npm install              # Install dependencies
npm run dev              # Start dev server (port 3000)
npm run typecheck        # TypeScript validation only
npm run check            # Full validation (typecheck + build)
npm run build            # Production build
npm run preview          # Preview production build
```

## Tech Stack

- **Frontend:** React 19, TypeScript 5.x, Vite 6.x, Tailwind CSS
- **AI/OCR:** Google Gemini 2.5 Flash (primary), SiliconFlow Qwen 2.5 VL (fallback)
- **PDF:** PDF.js 3.11, jsPDF 2.5
- **Storage:** Supabase DB + GitLab (file storage)
- **Language:** German (UI and business logic)

## Architecture

### Directory Structure

```
├── components/           # React UI components
├── services/             # Business logic layer
├── docs/                 # Architecture docs
├── App.tsx               # Main orchestrator
├── types.ts              # Core TypeScript interfaces
└── index.tsx             # Entry point
```

### Data Flow (Upload → Document)

1. Upload → Base64 encoding + file hash
2. OCR via Gemini → `Partial<ExtractedData>`
3. Duplicate detection (hash + semantic scoring)
4. Rule engine enrichment (SKR03 accounts, tax category, OCR score)
5. Supabase persistence via `storageService` + GitLab file upload

### Core Services

| Service | Purpose |
|---------|---------|
| `geminiService.ts` | Primary OCR with JSON schema + fallback to SiliconFlow |
| `fallbackService.ts` | Vision fallback (PDF → stitched image) |
| `ruleEngine.ts` | Derives `sollKonto`/`habenKonto` + tax category |
| `storageService.ts` | Supabase DB + GitLab storage + exports (SQL/PDF/CSV) |
| `elsterExport.ts` | ELSTER XML for German tax authority (UStVA) |
| `datevExport.ts` | DATEV EXTF format for accountants |

### Key Types (`types.ts`)

- `ExtractedData` - Main document model with SKR03 fields
- `DocumentRecord` - Document wrapper with status/metadata
- `TaxCategoryDefinition` - Tax rate configurations
- `AccountDefinition` - SKR03 account mappings
- `ElsterStammdaten` - ELSTER tax authority data

### Export Formats

- **ELSTER XML** - German tax authority format (UStVA)
- **DATEV EXTF** - German accounting software format
- **PDF** - Report generation with jsPDF
- **CSV** - UTF-8 semicolon-delimited
- **SQL** - Full schema with relations

## Configuration

### Environment Variables

```env
GEMINI_API_KEY="..."        # Required - Google Gemini API key
SILICONFLOW_API_KEY="..."   # Optional - Fallback OCR provider
SUPABASE_URL="..."          # Required - Supabase project URL
SUPABASE_ANON_KEY="..."     # Required - Supabase anonymous key
GITLAB_URL="..."            # GitLab instance URL
GITLAB_TOKEN="..."          # GitLab personal access token
```

Vite exposes these as `process.env.*` at build time.

### Path Alias

`@/*` maps to the project root (configured in `tsconfig.json` and `vite.config.ts`)

## PDF Processing

- PDFs are stitched into images (max 3 pages, scale 2.0)
- Large PDFs (>12MB decoded) are rejected
- PDF.js for rendering, jsPDF for generation

## German Accounting

- **SKR03** standard accounts
- **UStVA** Umsatzsteuervoranmeldung (quarterly VAT return)
- **DATEV EXTF** format for tax consultants
