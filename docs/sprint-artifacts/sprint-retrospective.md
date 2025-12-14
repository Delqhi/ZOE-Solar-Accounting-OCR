# Sprint Retrospective

Datum: 2025-12-14

## Keep (Beibehalten)

- Klare Trennung von Planung/Artefakten (BMAD) und Umsetzung (Code) hat geholfen, schnell von „Discovery“ in „Delivery“ zu kommen.
- Zusätzlich zu `npm run build` konsequent `npx tsc --noEmit` laufen lassen (TypeScript/JSX-Probleme früh erkannt).
- Defensive Normalisierung der OCR-Ausgaben reduziert Runtime-Crashes und Support-Aufwand.

## Problem (Verbessern)

- Vite-Build allein ist kein verlässlicher Typecheck; Fehler wurden erst durch `tsc --noEmit` sichtbar.
- Sprint-Status/Markierungen waren zwischenzeitlich inkonsistent (Stories fälschlich als „done“), bevor sie wirklich umgesetzt waren.
- OCR-/Export-Flows sind ohne definierten Standardablauf schwer reproduzierbar zu prüfen.

## Try (Nächstes Mal ausprobieren)

- Minimaler „Quality Gate“: `npm run build` + `npx tsc --noEmit` als Standard-Check (und optional später CI).
- Bei Sprint-Updates: „Done“ erst nach (a) Typecheck grün, (b) kurzer Smoke-Test grün.
- Einen kurzen, festen Smoke-Test-Ablauf pflegen (App-Start → Upload/OCR → Duplikat → Merge-Guard → Export).

## Risiken / Follow-ups

- OCR-JSON Contract kann driften: Normalisierung muss bei Prompt-/Modelländerungen mitgeführt werden.
- SQL-Export driftet leicht: Bei Modelländerungen immer Export mit anfassen.
