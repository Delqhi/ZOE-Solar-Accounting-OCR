# ZOE Solar Accounting OCR - Project Overview

**Project Type:** Cloud-based accounting application for solar companies in Germany
**Architecture:** Cloud-First with Supabase on OCI VM
**Primary Language:** TypeScript
**Framework:** React 19 with Vite 6

## Core Purpose
Professional accounting solution with AI-powered OCR for German solar companies. Extracts invoice data automatically using AI, maps to German SKR03 standard, and prepares EÜR/UStVA tax reports.

## Key Features
- AI OCR Pipeline (Gemini 2.5 Flash + SiliconFlow Qwen fallback)
- SKR03 automatic accounting assignment
- ELSTER XML export for tax office
- DATEV EXTF booking batch export
- Duplicate detection V2 (Hard + Fuzzy match + Hash)
- Private document detection
- Cloud-first architecture (no local data, no IndexedDB)

## Tech Stack Details
- **Frontend:** React 19.2.3, TypeScript 5.8.2, Tailwind CSS 4.1.18
- **Build:** Vite 6.2.0 with manual code splitting
- **Backend:** Supabase PostgreSQL on OCI VM
- **AI:** @google/genai ^1.33.0
- **PDF:** pdfjs-dist ^5.4.530, jspdf ^4.0.0
- **State:** Zustand ^5.0.9, React Query ^5.90.16
- **Testing:** Vitest ^4.0.16 (160 tests)
- **Linting:** ESLint 8.57 with TypeScript plugin
- **Formatting:** Prettier 3.2.5
- **Git Hooks:** Husky 9.0.11 with lint-staged

## Project Structure
```
src/
├── services/          # Business logic (OCR, rules, export)
├── components/        # React components
├── hooks/            # Custom hooks
├── types.ts          # TypeScript interfaces
├── App.tsx           # Main application
└── index.tsx         # Entry point
```

## Quality Metrics
- 160 Unit Tests passing
- TypeScript strict mode enabled
- ESLint + Prettier configured
- Husky pre-commit hooks active
