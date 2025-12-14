# Test Design (Sprint)

Dieses Dokument beschreibt die Teststrategie für die umgesetzten Epics A–D (Browser-SPA, keine Backend-Services, lokale Persistenz in IndexedDB).

## Ziele

- Regressionen in der OCR-Pipeline (Gemini + Fallback) früh erkennen.
- Datenkonsistenz (Model/Export) sicherstellen.
- Duplikat-/Merge-Guardrails verifizieren, um Fehlbuchungen zu verhindern.

## Grundannahmen / Constraints

- App läuft vollständig im Browser (Vite/React).
- OCR benötigt gültige API Keys in `.env` (`GEMINI_API_KEY`, optional `SILICONFLOW_API_KEY`).
- `npm run build` prüft nicht zuverlässig Typfehler/JSX-Parsing-Fehler → `npx tsc --noEmit` ist Teil der Minimal-Checks.

## Minimale Checks (immer ausführen)

- Build: `npm run build`
- Typecheck: `npx tsc --noEmit`

## Smoke-Test Checklist (manuell)

1. Start: `npm run dev` → App lädt ohne Console Errors.
2. Upload: PDF & Bild in Upload-Area ziehen → OCR läuft (Gemini) und erzeugt einen Beleg.
3. Fallback: (optional) Gemini-Key ungültig / Quota → Fallback greift und erzeugt ebenfalls einen Beleg.
4. Validierungsrobustheit: OCR-Resultat enthält keine Crashes bei fehlenden Feldern (z.B. leere `lineItems`, leere Beträge).
5. Duplicate: Upload desselben Belegs (oder Belegnummer+Betrag gleich) → Duplikat wird markiert, Grund angezeigt.
6. Merge: Versuch, einen Duplikat-Beleg zu mergen → wird geblockt (Feedback sichtbar).
7. Export: SQL-Export enthält erwartete Spalten (Schema + Inserts) und ist syntaktisch plausibel.

## Epic-spezifische Testpläne

- Epic A: [test-design-epic-1.md](test-design-epic-1.md)
- Epic B: [test-design-epic-2.md](test-design-epic-2.md)
- Epic C: [test-design-epic-3.md](test-design-epic-3.md)
- Epic D: [test-design-epic-4.md](test-design-epic-4.md)
