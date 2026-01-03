# Architektur

## Überblick

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐   │
│  │ Upload  │ │  Grid   │ │ Editor  │ │  Settings   │   │
│  └────┬────┘ └────┬────┘ └────┬────┘ └──────┬──────┘   │
│       │           │           │             │          │
│       └───────────┴─────┬─────┴─────────────┘          │
│                         ▼                              │
│              ┌────────────────────┐                    │
│              │   React Services   │                    │
│              │  (supabaseService) │                    │
│              └─────────┬──────────┘                    │
│                        │                               │
└────────────────────────┼───────────────────────────────┘
                         ▼
            ┌────────────────────────┐
            │    Supabase Backend    │
            │   (PostgreSQL auf      │
            │     OCI VM)            │
            └────────────────────────┘
```

## Frontend Stack

- **React 19.2.3** - UI Framework
- **TypeScript 5.8** - Typsicherheit
- **Tailwind CSS 4** - Styling
- **Vite 6.2** - Build Tool
- **Vitest 4** - Testing

## Backend

- **Supabase** - PostgreSQL + Auth
- **Supabase Auth** - Benutzerauthentifizierung
- **OCI VM** - Hosting auf Oracle Cloud Infrastructure

## AI Services

| Modell | Verwendung | Geschwindigkeit |
|--------|------------|-----------------|
| Google Gemini 2.5 Flash | Primäre OCR | < 3 Sekunden |
| SiliconFlow Qwen 2.5 VL | Fallback | < 5 Sekunden |

## Datenbank-Schema

### Tabellen

- **belege** - Haupttabelle für Belege
- **beleg_positionen** - Positionen (1:n)
- **belege_privat** - Private Belege
- **app_settings** - App-Konfiguration
- **vendor_rules** - Gemerkte Lieferantenregeln

### Indizes

- `belege.created_at` - Sortierung
- `belege.status` - Filterung
- `vendor_rules.vendor_name` - Suche
