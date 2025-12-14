# Architektur

## Systemkontext

- **Client-only SPA (Vite/React)** läuft komplett im Browser.
- Externe Services:
  - **Gemini (Google GenAI)** für OCR/Extraktion
  - **SiliconFlow Vision (Qwen 2.5 VL)** als Fallback
- Persistenz: **IndexedDB** (lokal)

## Hauptbausteine

### UI
- `App.tsx`: Orchestriert Upload → OCR → Dupe-Checks → Persistenz → Views
- `components/UploadArea.tsx`: Upload/Drag&Drop
- `components/DatabaseView.tsx` / `DatabaseGrid.tsx`: Übersicht/Tabellenansicht
- `components/DetailModal.tsx`: Split-View Preview + Editieren + Merge
- `components/PdfViewer.tsx`: PDF/Image Preview mit Zoom/Pan, PDF.js
- `components/SettingsView.tsx`: Steuer-/Konto-Einstellungen (SKR03)

### Services
- `services/geminiService.ts`: Primärer OCR/Extraktion-Call mit JSON-Schema und robustem JSON-Parsing; fällt auf Fallback zurück
- `services/fallbackService.ts`: Vision-Fallback; kann PDF in ein „stitched image“ konvertieren (PDF.js) und dann Vision API aufrufen
- `services/ruleEngine.ts`: Kontierung/Steuerkategorie ableiten; erzeugt u.a. `sollKonto`/`habenKonto`, OCR-Score
- `services/storageService.ts`: IndexedDB Zugriff + Exporte (z.B. SQL)

### Domain Model
- `types.ts`: `ExtractedData`, `DocumentRecord`, Settings-Modelle (Tax/Accounts etc.)

## Datenfluss (Upload → Dokument)

1. Upload → Base64 + Hash
2. OCR/Extraktion → `Partial<ExtractedData>`
3. Duplikat-Erkennung:
   - Hash-Duplikat
   - Semantische Regeln (Belegnummer/Betrag/Datum + Scoring)
4. Regel-Engine reichert an:
   - Kontierungskonto + `sollKonto`/`habenKonto`
   - Steuerkategorie
   - OCR-Score
5. Persistenz: `storageService.saveDocument` in IndexedDB

## Konfiguration / Secrets

- Vite definiert zur Build-Zeit `process.env.API_KEY` aus `GEMINI_API_KEY`.
- Hinweis: Der Fallback-Service enthält aktuell einen hardcodierten API-Key (Security-Risiko).
