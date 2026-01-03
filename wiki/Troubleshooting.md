# Troubleshooting

## Häufige Probleme

### Supabase nicht verbunden

**Symptom:** "Supabase not configured" Fehler

**Lösung:**
1. Prüfe `VITE_SUPABASE_URL` in .env
2. Prüfe `VITE_SUPABASE_ANON_KEY` in .env
3. Stelle sicher dass Supabase erreichbar ist

### KI antwortet nicht

**Symptom:** OCR bleibt bei "Analysiere..."

**Lösung:**
1. Prüfe API Keys in .env
2. Falls Gemini 429 (Rate Limit): System wechselt automatisch zu SiliconFlow
3. Prüfe Internetverbindung

### PDF Vorschau unscharf

**Symptom:** Unscharfe PDF-Darstellung

**Lösung:**
1. Nutze Zoom (Mausrad + Ctrl)
2. Prüfe PDF.js Konfiguration

### Authentifizierung fehlgeschlagen

**Symptom:** Login funktioniert nicht

**Lösung:**
1. Prüfe Supabase Auth Settings
2. Stelle sicher dass E-Mail-Verifizierung konfiguriert ist
3. Prüfe Netzwerkverbindung

### DATEV Export Fehler

**Symptom:** DATEV-Datei kann nicht erstellt werden

**Lösung:**
1. Prüfe DATEV-Konfiguration in Einstellungen
2. Stelle sicher dass alle Pflichtfelder ausgefüllt sind
3. Beraternummer und Mandantnummer erforderlich

### Performance-Probleme

**Symptom:** Langsame Seitenladung

**Lösung:**
1. Reduziere Anzahl der angezeigten Belege (Pagination nutzen)
2. Prüfe Supabase Performance
3. Nutze Browser-Entwicklertools für Diagnose

## Logs prüfen

Öffne die Browser-Konsole (F12) für detaillierte Fehlermeldungen.

## Support

Wenn das Problem nicht gelöst werden kann:
1. Erstelle ein GitHub Issue
2. Beschreibe das Problem detailliert
3. Füge Screenshots hinzu
4. Nenne Browser und Version
