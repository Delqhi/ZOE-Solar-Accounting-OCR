<div align="center">

# ⚡ ZOE Solar Accounting OCR

**Die professionelle Buchhaltungslösung für Solarunternehmen**

[![React](https://img.shields.io/badge/React-19.2.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-3.11-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tests](https://img.shields.io/badge/Tests-160%20passed-6C9A8B?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev)

---

### 🤖 KI-gestützt • 🎯 SKR03 • 📊 ELSTER • 💾 DATEV

---

</div>

## Was ist ZOE Solar Accounting OCR?

**ZOE Solar Accounting OCR** ist eine cloud-basierte Buchhaltungsanwendung für Solarunternehmen in Deutschland. Die Software extrahiert automatisch Rechnungsdaten mittels KI, ordnet nach deutschem SKR03-Standard zu und bereitet EÜR/UStVA vor.

> **Architektur:** Cloud-First mit Supabase auf OCI VM (keine lokalen Daten, kein IndexedDB)

---

## ✨ Features

<div align="center">

| | | |
|:---:|:---:|:---:|
| **🤖 KI-OCR** | **🎯 SKR03** | **📊 ELSTER** |
| Gemini 2.5 Flash + Qwen 2.5 VL | Automatische Kontierung | XML-Export für UStVA |
| | | |
| **💾 DATEV** | **🔐 Cloud-First** | **✅ Qualität** |
| EXTF-Buchungsstapel | Supabase auf OCI VM | 160 Unit Tests |

</div>

---

## 🛠 Tech Stack

<div align="center">

```typescript
Frontend     →  React 19.2.3 + TypeScript 5.8
Styling      →  Tailwind CSS 4 (via PostCSS)
Build        →  Vite 6.2.0
Backend      →  Supabase (PostgreSQL)
Tests        →  Vitest 4.0.16
AI           →  Google Gemini 2.5 Flash
             →  SiliconFlow Qwen 2.5 VL
PDF          →  PDF.js 3.11, jsPDF 2.5
Auth         →  Supabase Auth
```

</div>

---

## 🚀 Schnellstart

```bash
# Repository klonen
git clone https://github.com/DeepthinkAI2025/ZOE-Solar-Accounting-OCR.git
cd ZOE-Solar-Accounting-OCR

# Abhängigkeiten installieren
npm install

# Umgebungsvariablen konfigurieren
cp .env.example .env

# Entwicklungsserver starten
npm run dev
```

### Umgebungsvariablen

```env
# Supabase (Pflicht)
VITE_SUPABASE_URL=https://deine-supabase-url.oci.oraclecloud.com
VITE_SUPABASE_ANON_KEY=dein-anon-key

# Google Gemini API (optional)
VITE_GEMINI_API_KEY=dein-gemini-key

# SiliconFlow API (optional)
VITE_SILICONFLOW_API_KEY=dein-siliconflow-key
```

---

## 📁 Projektstruktur

```
src/
├── services/           # Business Logic
│   ├── supabaseService.ts   # Supabase CRUD
│   ├── geminiService.ts     # Google Gemini OCR
│   ├── fallbackService.ts   # SiliconFlow Fallback
│   ├── elsterExport.ts      # ELSTER XML
│   ├── datevExport.ts       # DATEV EXTF
│   ├── ruleEngine.ts        # SKR03 Regeln
│   ├── backupService.ts     # Backup/Restore
│   └── privateDocumentDetection.ts
├── components/         # React Components
│   ├── DatabaseView.tsx
│   ├── DetailModal.tsx
│   ├── DuplicateCompareModal.tsx
│   ├── AuthView.tsx
│   └── SettingsView.tsx
├── hooks/              # Custom Hooks
│   ├── useDocuments.ts
│   ├── useSettings.ts
│   └── useUpload.ts
└── types.ts            # TypeScript Interfaces
```

---

## 📤 Export-Formate

| Format | Beschreibung |
|--------|-------------|
| **ELSTER XML** | Umsatzsteuervoranmeldung für Finanzamt |
| **DATEV EXTF** | Buchungsstapel für Steuerberater-Software |
| **CSV** | Semikolon-getrennt, UTF-8 kodiert |
| **SQL** | Vollständiges PostgreSQL-Schema |
| **PDF** | Berichte: EÜR, UStVA, Beleglisten |
| **JSON** | Backup mit allen Dokumenten |

---

## ✅ Roadmap

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

## 📄 Lizenz

<div align="center">

**© 2025 ZOE Solar GmbH & Co. KG**

*Proprietäre Software - Alle Rechte vorbehalten*

Die Nutzung ist ausschließlich für ZOE Solar gestattet.

---

[📖 Wiki](https://github.com/DeepthinkAI2025/ZOE-Solar-Accounting-OCR.wiki) • [🐛 Issues](https://github.com/DeepthinkAI2025/ZOE-Solar-Accounting-OCR/issues) • [📧 Support](mailto:support@zoe-solar.de)

---

*Made with for the Solar Industry* ☀️

</div>
