# Sprint 2 — Closeout

Datum: 2025-12-14

## Ziel

OCR-Pipeline robuster machen, Datenmodell konsistent halten, UI-Bedienbarkeit verbessern.

## Scope (In Scope)

- B2: Parsing/Schema-Validierung härten (defensiv gegen Partial/Null-Felder)
- B3: PDF-Stitching Grenzen/Regeln dokumentieren und testen (max pages/size)
- C1: IndexedDB Migrationspfad dokumentieren (DB_VERSION und Objektstores)
- C2: Export-Schema (SQL) mit Modell-Feldern synchron halten
- D1: Duplicate UX klarer (Warum / next action) + blockierende Aktionen verhindern
- D2: Merge-Flow besser absichern (nicht in Duplikate mergen, Feedback)

## Ergebnis

- OCR-Ergebnisse werden normalisiert, um Partial/Null/Strings robust zu handhaben.
- Fallback-PDF-Verarbeitung ist durch Limits geschützt.
- SQL-Export ist näher am Datenmodell und idempotenter.
- Duplikat-Handling ist klarer, Merge-Risiken sind reduziert.

## Evidence / Checks

- Lokal: `npm run check` (Typecheck + Build) ist grün.

## Artefakte

- Sprint Plan: [sprint-plan-sprint-2.md](sprint-plan-sprint-2.md)
- Sprint Status: [sprint-status.yaml](sprint-status.yaml)
- Test Design: [test-design.md](test-design.md)
- Retrospective: [sprint-retrospective.md](sprint-retrospective.md)

## Notes / Follow-ups

- Als nächster Schritt bietet sich ein kurzer standardisierter QA-/Release-Ablauf an (Runbook).
