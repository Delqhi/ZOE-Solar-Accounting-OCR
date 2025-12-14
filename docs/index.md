# Projekt-Dokumentation: ZOE Solar Accounting OCR

Diese Dokumentation ist als Brownfield-Referenz für BMM/BMAD gedacht (Input für PRD/Architektur/Stories).

## Einstieg

- Überblick: [project-overview.md](project-overview.md)
- PRD: [prd.md](prd.md)
- Architektur: [architecture.md](architecture.md)
- Solution Architecture: [solution-architecture.md](solution-architecture.md)
- Source Tree (annotiert): [source-tree-analysis.md](source-tree-analysis.md)
- Lokale Entwicklung: [development-guide.md](development-guide.md)

## Planung / Backlog

- Epics & Stories: [sprint-artifacts/epics-and-stories.md](sprint-artifacts/epics-and-stories.md)
- Sprint Plan: [sprint-artifacts/sprint-plan.md](sprint-artifacts/sprint-plan.md)
- Sprint Status: [sprint-artifacts/sprint-status.yaml](sprint-artifacts/sprint-status.yaml)

## Gates

- Implementation Readiness: [implementation-readiness.md](implementation-readiness.md)

## Kernartefakte (App)

- UI Einstieg: `index.tsx` → `App.tsx`
- UI Komponenten: `components/`
- Domain/Services: `services/`
- Typen/Domain Model: `types.ts`

## Wichtige externe Abhängigkeiten

- React 19 + Vite
- Google Gemini SDK: `@google/genai`
- PDF: `pdfjs-dist`
- Export: `jspdf`, `jspdf-autotable`
