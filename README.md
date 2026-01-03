# ZOE Solar Accounting OCR

[![React 19.2.3](https://img.shields.io/badge/React-19.2.3-61dafb?logo=react)](https://react.dev)
[![TypeScript 5.8](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-4-38b2ac?logo=tailwind-css)](https://tailwindcss.com)
[![Vite 6](https://img.shields.io/badge/Vite-6.0-646cff?logo=vite)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-3.11.174-3ecf8e)](https://supabase.com)
[![Vitest Tests](https://img.shields.io/badge/Tests-160-6c9a8b)](https://vitest.dev)

---

## Was ist ZOE Solar Accounting OCR?

**ZOE Solar Accounting OCR** ist eine professionelle Buchhaltungsanwendung für Solarunternehmen in Deutschland. Die Software extrahiert automatisch Rechnungsdaten mittels KI, ordnet nach SKR03 zu und bereitet EÜR/UStVA vor.

**Architektur:** Cloud-First mit Supabase auf OCI VM (kein IndexedDB, keine lokalen Daten)

---

## Features

| Feature | Beschreibung |
|---------|-------------|
| **KI-gestützte OCR** | Google Gemini 2.5 Flash + SiliconFlow Qwen 2.5 VL |
| **SKR03 Kontierung** | Automatische Soll/Haben-Buchung nach deutschem Standard |
| **ELSTER XML Export** | Direkter Export für Umsatzsteuervoranmeldung |
| **DATEV EXTF Export** | Buchungsstapel für Steuerberater |
| **Supabase Backend** | PostgreSQL auf OCI VM |
| **Private Document Detection** | Automatische Erkennung von Privatbelegen |
| **Duplikat-Erkennung** | Hard-, Fuzzy- und Hash-Matching |
| **160 Unit Tests** | Vollständige Testabdeckung |

---

## Tech Stack

```
Frontend:     React 19.2.3 + TypeScript 5.8
Styling:      Tailwind CSS 4 (via PostCSS)
Build:        Vite 6.2.0
Backend:      Supabase (PostgreSQL)
Tests:        Vitest 4.0.16
AI:           Google Gemini 2.5 Flash, SiliconFlow Qwen 2.5 VL
PDF:          PDF.js 3.11, jsPDF 2.5 + AutoTable
Auth:         Supabase Auth
```

---

## Installation

### Voraussetzungen

- Node.js 18+
- Supabase Projekt auf OCI VM

### Setup

```bash
# 1. Repository klonen
git clone https://github.com/DeepthinkAI2025/ZOE-Solar-Accounting-OCR.git
cd ZOE-Solar-Accounting-OCR

# 2. Abhängigkeiten installieren
npm install

# 3. Umgebungsvariablen konfigurieren
cp .env.example .env
# Bearbeite .env mit deinen Supabase Credentials

# 4. Entwicklungsserver starten
npm run dev
```

### Umgebungsvariablen (.env)

```env
# Supabase (Pflicht)
VITE_SUPABASE_URL=https://deine-supabase-url.oci.oraclecloud.com
VITE_SUPABASE_ANON_KEY=dein-anon-key

# Google Gemini API (optional - Fallback)
VITE_GEMINI_API_KEY=dein-gemini-key

# SiliconFlow API (optional - Fallback)
VITE_SILICONFLOW_API_KEY=dein-siliconflow-key
```

---

## Verwendung

### 1. Beleg hochladen

- Drag & Drop oder Klick zum Auswählen
- KI analysiert automatisch alle Daten
- Überprüfen und korrigieren falls nötig
- Speichern in Supabase

### 2. Kontierung prüfen

- SKR03-Konten automatisch zugewiesen
- Steuerkategorie (19%, 7%, etc.) erkannt
- Vendor Rules werden gelernt

### 3. Export

| Format | Verwendung |
|--------|------------|
| **ELSTER XML** | UStVA an Finanzamt |
| **DATEV EXTF** | Buchhaltungssoftware |
| **CSV** | Excel/Tabellenkalkulation |
| **SQL** | Datenbank-Migration |
| **PDF** | Berichte & Archivierung |

---

## Projektstruktur

```
src/
├── services/           # Business Logic
│   ├── supabaseService.ts   # Supabase CRUD
│   ├── geminiService.ts     # Google Gemini OCR
│   ├── fallbackService.ts   # SiliconFlow Fallback
│   ├── elsterExport.ts      # ELSTER XML
│   ├── datevExport.ts       # DATEV EXTF
│   ├── ruleEngine.ts        # SKR03 Regeln
│   └── backupService.ts     # Backup/Restore
├── components/         # React Components
├── hooks/              # Custom Hooks
└── types.ts            # TypeScript Interfaces
```

---

## Roadmap

### Abgeschlossen

- [x] KI-gestützte OCR (Gemini + SiliconFlow)
- [x] SKR03 Soll/Haben Kontierung
- [x] Positionen Extraktion
- [x] Duplikat-Erkennung V2
- [x] PDF/CSV/SQL Export
- [x] ELSTER XML Export
- [x] DATEV EXTF Export
- [x] Supabase Auth UI
- [x] Backup/Restore
- [x] Pagination & Filterung
- [x] Private Document Detection
- [x] 160 Unit Tests

### Geplant

- [ ] KI-gestützte Korrekturvorschläge
- [ ] Mobile App (React Native)
- [ ] Echtzeit Kollaboration

---

## Lizenz

**Proprietär** - ZOE Solar GmbH & Co. KG

Alle Rechte vorbehalten. Die Nutzung ist ausschließlich für ZOE Solar gestattet.

---

## Support

Bei Fragen oder Problemen bitte Issue erstellen auf GitHub.

---

*Made with for the Solar Industry*
