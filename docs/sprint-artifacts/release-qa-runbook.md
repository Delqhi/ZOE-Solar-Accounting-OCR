# Release / QA Runbook

Ziel: Wiederholbarer, kurzer Ablauf, um vor einem Release/Hand-Off die wichtigsten Risiken (TypeScript/Build, OCR-Flow, Duplikate/Merge, Export) zu prüfen.

## Voraussetzungen

- Node.js installiert
- `.env` gesetzt:
  - `GEMINI_API_KEY` (Pflicht)
  - `SILICONFLOW_API_KEY` (optional, nur Fallback)

## 1) Technische Checks (Pflicht)

```bash
npm ci
npm run check
```

Erwartung: `npm run check` läuft grün (Typecheck + Build).

## 2) Manuelle Smoke Checks (10–15 Minuten)

### 2.1 App-Start

```bash
npm run dev
```

- App lädt ohne Console Errors.

### 2.2 OCR — Normalfall

- 1–2-seitiges PDF oder ein Bild hochladen.
- Erwartung: OCR läuft durch, es entsteht ein neuer Beleg, UI bleibt stabil.

### 2.3 OCR — Robustheit (Partial/Null)

- Einen „schwierigen“ Beleg testen (z.B. unklare Beträge/Datum).
- Erwartung: Keine Crashes; Felder bleiben editierbar; Beträge werden sinnvoll geparst oder fallen auf Defaults.

### 2.4 Duplikat-Erkennung

- Den gleichen Beleg (oder Belegnummer+Betrag gleich) erneut hochladen.
- Erwartung: Beleg wird als Duplikat markiert, Grund wird angezeigt, „Original öffnen“ ist möglich.

### 2.5 Merge-Guards

- Versuchen, einen Duplikat-Beleg zu mergen.
- Erwartung: Merge wird geblockt und Feedback ist sichtbar.

### 2.6 Export (SQL)

- SQL-Export erzeugen.
- Erwartung:
  - Schema enthält die erwarteten Spalten.
  - Inserts sehen konsistent aus (Spaltenanzahl passt zu VALUES).

## 3) Ergebnis dokumentieren (kurz)

- Datum + Ergebnis (OK/Fail) + ggf. Screenshot/Notiz im Sprint-Status oder im Release-PR.
