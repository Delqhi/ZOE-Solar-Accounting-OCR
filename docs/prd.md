# PRD (Brownfield): ZOE Solar Accounting OCR

> Zweck dieses Dokuments: Anforderungen für die nächsten Änderungen/Erweiterungen am bestehenden System festhalten.
> Kontextquellen: [docs/index.md](index.md) und die darin verlinkten Brownfield-Dokumente.

## 1. Problem / Ziel

**Problem:** Benutzer haben keine lokale, offline-fähige Lösung für Rechnungsverarbeitung

**Ziel:** Eine 100% lokale, browser-basierte Lösung mit optionaler Cloud-Synchronisation

**Nicht-Ziele:**
- Keine Cloud-Zwangsregistrierung
- Keine Abhängigkeit von externen Servern für Kernfunktionalität

## 2. Kontext (Ist-Zustand)

Kurzüberblick:
- SPA (React/Vite) im Browser
- OCR/Extraktion: Primär Gemini, Fallback Vision
- Persistenz: IndexedDB

Relevante Referenzen:
- Überblick: [docs/project-overview.md](project-overview.md)
- Architektur: [docs/architecture.md](architecture.md)

## 3. Nutzer & Use Cases

- **Primärnutzer:** Buchhaltung / Backoffice (ZOE Solar)
- **Kern-Use-Case:** Beleg hochladen → Extraktion prüfen/korrigieren → Export

## 4. Anforderungen

### 4.1 Functional Requirements (FR)

- FR1: Lokale Datenspeicherung mit IndexedDB
- FR2: Optionale Supabase-Synchronisation wenn konfiguriert
- FR3: Environment-Variablen mit VITE_ Prefix für Vite

### 4.2 Non-Functional Requirements (NFR)

- NFR1: Daten bleiben lokal (IndexedDB), sofern nicht explizit anders beschlossen
- NFR2: Robustheit bei OCR-Ausfällen (Fallback/Manuelle Eingabe)
- NFR3: Keine regressions in Duplikat-Erkennung / Merge

## 5. Daten / Validierung

- Relevante Felder: `ExtractedData` (siehe `types.ts`)
- Validierungslogik: Sum-Check, OCR-Score, Tax/Konten (siehe `services/ruleEngine.ts`)

## 6. UX / UI

- UI vorhanden → UX-Design-Workflow optional/conditional.
- Falls Änderungen am Flow/Screen nötig sind: hier grob skizzieren. (TBD)

## 7. Risiken & Abhängigkeiten

- Secrets/Keys: Fallback-Service enthält aktuell einen hardcodierten API-Key (Security-Risiko).
- Env Mapping: Vite lädt `GEMINI_API_KEY`, README erwähnt teils `API_KEY`.

## 8. Out of Scope / Später

- Mobile App
- Multi-User Support (später)
- Cloud-Synchronisation (nur optional)
