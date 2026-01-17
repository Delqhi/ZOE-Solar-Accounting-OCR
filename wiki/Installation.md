# Installation

## Voraussetzungen

- Node.js 18 oder höher
- Supabase Projekt auf OCI VM
- Git

## Schritte

### 1. Repository klonen

```bash
git clone https://github.com/Delqhi/ZOE-Solar-Accounting-OCR.git
cd ZOE-Solar-Accounting-OCR
```

### 2. Abhängigkeiten installieren

```bash
npm install
```

### 3. Umgebungsvariablen konfigurieren

Kopiere die Beispiel-Datei und bearbeite sie:

```bash
cp .env.example .env
```

Bearbeite die `.env` Datei mit deinen Credentials:

```env
# Supabase (Pflicht)
VITE_SUPABASE_URL=https://deine-supabase-url.oci.oraclecloud.com
VITE_SUPABASE_ANON_KEY=dein-anon-key

# Google Gemini API (optional)
VITE_GEMINI_API_KEY=dein-gemini-key

# SiliconFlow API (optional)
VITE_SILICONFLOW_API_KEY=dein-siliconflow-key
```

### 4. Entwicklungsserver starten

```bash
npm run dev
```

Öffne http://localhost:5173 in deinem Browser.

## Produktions-Build

```bash
npm run build
npm run preview
```

## Supabase Schema

Das Datenbankschema befindet sich in `supabase_schema.sql`. Führe es in deiner Supabase-Instanz aus.

## Troubleshooting

- Prüfe ob Supabase erreichbar ist
- Stelle sicher dass alle Umgebungsvariablen gesetzt sind
- Siehe auch [Troubleshooting](Troubleshooting)
