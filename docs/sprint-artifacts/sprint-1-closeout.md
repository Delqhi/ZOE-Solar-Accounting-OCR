# Sprint 1 — Closeout

Datum: 2025-12-14

## Ziel

Sicherheit & Konfiguration bereinigen (keine Secrets im Code), Konfiguration dokumentieren.

## Scope (In Scope)

- A1: Hardcodierten Fallback-API-Key entfernen
- A2: Env-Var Naming vereinheitlichen (GEMINI_API_KEY) + README
- B1: OCR Provider Schnittstelle definieren

## Ergebnis

- Secrets/Keys sind nicht mehr hardcodiert; Konfiguration läuft über `.env`.
- Dokumentation für Setup/Env ist konsistenter.
- OCR Provider Layer ist als Schnittstelle modelliert.

## Evidence / Checks

- Lokal: `npm run check` (Typecheck + Build) ist grün.

## Artefakte

- Sprint Status: [sprint-status.yaml](sprint-status.yaml)
- Epics/Stories: [epics-and-stories.md](epics-and-stories.md)

## Notes

- Folgearbeit (Robustheit, Datenmodell, UI) wurde in Sprint 2 abgeschlossen.
