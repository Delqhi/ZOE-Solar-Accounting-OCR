# Architecture Validation

Ziel: Kurzer Abgleich der implementierten Änderungen (Epics A–D) gegen die bestehende Lösung/Architektur, inkl. Risiken und offenen Punkten.

## Architektur-Snapshot (Ist)

- **Frontend-only SPA** (React/Vite), keine Server-Komponenten.
- **OCR Provider Layer**: Primär Google Gemini, Fallback SiliconFlow.
- **Persistenz**: IndexedDB (lokal), Export als SQL.

## Validierung — Änderungen passen zur Architektur

### A: Sicherheit & Konfiguration

- Secrets werden über `.env` in Vite injiziert; keine hardcodierten Keys.
- Risiko „Leak“ reduziert durch `.gitignore`.

### B: OCR Robustheit

- Zentrale Normalisierung reduziert Crash-Risiko bei Partial/Null-Feldern.
- PDF-Limits im Fallback (Pages/Bytes) schützen Browser-Ressourcen.

### C: Datenmodell & Export

- SQL-Export wurde erweitert, um Modellfelder konsistenter abzubilden.
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` minimiert Drift-/Migrationsprobleme beim Import.

### D: UI/Bedienbarkeit

- Duplicate-UX (Grund + Next Steps) und Merge-Guardrails entsprechen dem Ziel „Fehlbuchungen verhindern“.

## Regression Hotspots

- **OCR JSON Contract**: Modellantworten können variieren → Normalisierung ist zentral und sollte bei Schema-Änderungen mit angepasst werden.
- **Vite Build vs. TS**: `vite build` kann TS/JSX-Probleme übersehen → `npx tsc --noEmit` als Pflichtcheck.
- **Export-Schema**: Jede Erweiterung des Datenmodells muss im SQL-Export nachgezogen werden.

## Offene Punkte (bewusst)

- Keine automatisierten Browser-Tests eingerichtet; Qualitätssicherung erfolgt über `npm run check` + manuelle Smoke-Checks.
- Fallback-Provider ist abhängig von externem API-Verhalten; Fehlermeldungen sollten bei Bedarf weiter UX-polished werden.

## Empfehlung

- Optional als CI/Hook: `npx tsc --noEmit` zusätzlich zu `npm run build`.
- Manuelle Smoke-Checks standardisieren (siehe Release/QA Runbook).
