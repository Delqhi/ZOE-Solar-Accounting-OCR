# Test Design — Epic 1 (A) Sicherheit & Konfiguration

## Scope

- Keine API Keys im Repo/hardcoded.
- Laufzeitverhalten bei fehlenden Keys ist verständlich und fail-fast.

## Risiken

- Schlüssel versehentlich committed.
- App startet “scheinbar”, OCR scheitert aber erst später ohne klare Fehlermeldung.

## Tests

### Static

- Repo-Scan: sicherstellen, dass keine Keys in `services/`/`vite.config.ts` hardcoded sind.
- `.gitignore` enthält `.env` (und lokale Varianten), damit Secrets nicht committed werden.

### Runtime / UX

- Ohne `GEMINI_API_KEY`: OCR-Start führt zu klarer Fehlermeldung.
- Ohne `SILICONFLOW_API_KEY`: Fallback-Call führt zu klarer Fehlermeldung, App bleibt stabil.

## Evidence

- `npm run build`
- `npx tsc --noEmit`
