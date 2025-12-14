# Test Design — Epic 2 (B) OCR-Pipeline Robustheit

## Scope

- Parsing/Normalisierung der OCR-Antworten ist defensiv.
- PDF-Verarbeitung ist begrenzt (Seiten/Bytes) und verhält sich kontrolliert.

## Risiken

- Modelle liefern Partial/Null/Strings statt Zahlen → UI/Rule-Engine crasht oder speichert falsche Werte.
- Große PDFs → Performance/Memory/Timeouts.

## Tests

### Normalisierung

- OCR liefert JSON mit:
  - leeren Strings/`null`/fehlenden Feldern
  - Zahlen als Strings ("1.234,56" / "1234.56")
  - `lineItems` als `[]`, `null`, gemischte Typen
- Erwartung: App bleibt stabil, Zahlen werden sinnvoll geparst oder auf Default gesetzt, `lineItems` sind ein Array.

### PDF-Limits (Fallback)

- PDF <= Limit: Fallback akzeptiert und verarbeitet.
- PDF > Limit (Pages oder Bytes): Fallback bricht mit verständlicher Fehlermeldung ab.

### Regression Smoke

- Upload eines normalen PDFs (1–2 Seiten) → Ergebnis plausibel.

## Evidence

- `npm run build`
- `npx tsc --noEmit`
