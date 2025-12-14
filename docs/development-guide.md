# Development Guide

## Voraussetzungen

- Node.js >= 18

## Setup

### Checks (empfohlen)

## Environment / API Keys

Vite lädt Umgebungsvariablen und mappt:
- `GEMINI_API_KEY` → `process.env.API_KEY` und `process.env.GEMINI_API_KEY`
- `SILICONFLOW_API_KEY` → `process.env.SILICONFLOW_API_KEY`

Minimal: lege im Projekt-Root eine `.env` an:

```env
GEMINI_API_KEY="..."
SILICONFLOW_API_KEY="..."
```

Hinweis: Die README erwähnt teils `API_KEY`; technisch wird aktuell `GEMINI_API_KEY` eingelesen.

## IndexedDB Schema & Migrationen

- **DB-Name:** `ZoeAccountingDB`
- **Aktuelle Version:** 5
- **Objektstores:**
  - `documents`: Belege (keyPath: 'id')
  - `settings`: App-Einstellungen (keyPath: 'id')
  - `vendor_rules`: Lieferanten-Regeln (keyPath: 'vendorName')
- **Migration:** Automatische Merge von Default-Accounts bei Settings-Load; keine destruktiven Änderungen.

Reset / "Clean Slate":
- Browser DevTools → Application → IndexedDB → `ZoeAccountingDB` löschen.

## PDF-Verarbeitung

- **PDF-Stitching:** PDFs werden in Bilder umgewandelt, indem die ersten 3 Seiten vertikal gestitched werden (max. 3 Seiten, um Speicher zu schonen).
- **Skalierung:** PDFs werden mit Scale 2.0 gerendert für bessere OCR-Qualität.
- **Größenlimit:** Sehr große PDFs werden abgelehnt (ca. > 12MB decoded), um Browser/Worker zu schützen.
- **Fallback:** Bei PDF-Fehlern wird ein leerer Template zurückgegeben (manuelle Eingabe erforderlich).
