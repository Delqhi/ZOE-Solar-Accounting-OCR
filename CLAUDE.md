# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ZOE Solar Accounting OCR - A cloud-based accounting application for German solar companies with AI-powered OCR and German tax export capabilities (DATEV, ELSTER).

## Commands

```bash
# Development
npm run dev              # Start Vite dev server (port 3000)

# Build & Type Checking
npm run build            # Production build
npm run typecheck        # TypeScript type checking
npm run check            # TypeScript check + build

# Testing
npm run test             # Run all tests (Vitest, 160+ passing)
npm run test:watch       # Watch mode for tests
```

## Architecture

### Tech Stack
- React 19.2.3 with TypeScript 5.8
- Vite 6.2.0 for bundling
- Tailwind CSS 4 (via CDN)
- Supabase for cloud database/auth
- Google Gemini 2.5 Flash + SiliconFlow Qwen 2.5 VL for OCR
- Vitest for testing

### Code Organization (Feature-based)

```
src/
├── components/          # React UI components
│   ├── views/          # AuthView, BackupView, DatabaseView, SettingsView
│   ├── modals/         # DetailModal, DuplicateCompareModal
│   └── ui/             # DatabaseGrid, FilterBar, PdfViewer, UploadArea
├── services/           # Business logic layer
│   ├── geminiService.ts        # AI OCR
│   ├── supabaseService.ts      # Cloud DB + Auth
│   ├── storageService.ts       # IndexedDB local storage
│   ├── ruleEngine.ts           # SKR03 accounting rules
│   ├── datevExport.ts          # DATEV SQL export
│   └── elsterExport.ts         # ELSTER XML export
├── hooks/              # Custom React hooks
│   ├── useDocuments.ts  # Document CRUD + filtering
│   ├── useSettings.ts   # App configuration
│   └── useUpload.ts     # File processing pipeline
└── types.ts            # TypeScript type definitions
```

### State Management

- **No Redux/Zustand** - React useState + custom hooks pattern
- Central state in `App.tsx` with custom hooks for separation
- **Local-first**: IndexedDB via `storageService.ts`
- **Optional sync**: Supabase configured via `.env`

### View Routing

State-based routing (no React Router):
```typescript
const [viewMode, setViewMode] = useState<'document' | 'settings' | 'database' | 'auth' | 'backup'>('document');
```

### Key Services

- **ruleEngine.ts**: SKR03 automatic accounting categorization, vendor rule matching
- **datevExport.ts**: DATEV EXTF format for accounting software
- **elsterExport.ts**: ELSTER XML for German VAT declarations
- **backupService.ts**: JSON backup/restore with document merging

### Duplicate Detection

Hash-based + fuzzy matching with semantic similarity threshold in `duplicateDetection.ts`

## Critical Files

| File | Purpose |
|------|---------|
| `App.tsx` | Main container, upload pipeline, document operations |
| `types.ts` | DocumentRecord, AppSettings, ExtractedData types |
| `services/ruleEngine.ts` | SKR03 accounting categorization |
| `services/geminiService.ts` | Gemini 2.5 Flash OCR integration |
| `services/supabaseService.ts` | Supabase database and auth operations |

## Documentation

See `/docs/` for:
- `architecture.md` - System architecture
- `development-guide.md` - Setup, IndexedDB schema, PDF processing
- `elster-stammdaten-feldkatalog.md` - ELSTER field catalog for German tax exports
