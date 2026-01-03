# PRD (Brownfield): ZOE Solar Accounting OCR

> Zweck dieses Dokuments: Anforderungen für die nächsten Änderungen/Erweiterungen am bestehenden System festhalten.
> Kontextquellen: [docs/index.md](index.md) und die darin verlinkten Brownfield-Dokumente.

## 1. Problem / Ziel

**Problem:** Buchhaltung von ZOE Solar benötigt eine effiziente Lösung zur digitalen Erfassung, Kategorisierung und Buchung von Belegen (Rechnungen, Quittungen). Der aktuelle Prozess ist manuell, zeitaufwendig und fehleranfällig.

**Ziel:** Eine browserbasierte OCR-Anwendung, die Belege automatisch extrahiert, kategorisiert und für den Export in DATEV und ELSTER vorbereitet, mit Fokus auf Solar-spezifische Buchhaltungsanforderungen.

**Nicht-Ziele:**
- Änderung der bestehenden DATEV-Software oder ELSTER-Schnittstelle
- Vollständige Automatisierung ohne menschliche Prüfung
- Multi-Mandanten-Support

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

- FR1: OCR-Extraktion von Belegdaten (Datum, Betrag, Lieferant, MwSt) mit Qualitätsbewertung
- FR2: Automatische Kontierungsvorschläge basierend auf Lieferanten-Regeln und Steuerkategorien
- FR3: DATEV-Export im externen Buchungsstapel-Format (EXTF)
- FR4: ELSTER UStVA XML-Export für Umsatzsteuervoranmeldung
- FR5: Duplikaterkennung und Merge-Funktion für Belege

### 4.2 Non-Functional Requirements (NFR)

- NFR1: Daten bleiben lokal (IndexedDB), sofern nicht explizit anders beschlossen
- NFR2: Robustheit bei OCR-Ausfällen (Fallback/Manuelle Eingabe)
- NFR3: Keine regressions in Duplikat-Erkennung / Merge

## 5. Daten / Validierung

- Relevante Felder: `ExtractedData` (siehe `types.ts`)
- Validierungslogik: Sum-Check, OCR-Score, Tax/Konten (siehe `services/ruleEngine.ts`)

## 6. UX / UI

- UI vorhanden → UX-Design-Workflow optional/conditional.
- Falls Änderungen am Flow/Screen nötig sind: hier grob skizzieren. Aktuell keine größeren UI-Änderungen geplant, nur Export-Flow-Verbesserungen.

## 7. Risiken & Abhängigkeiten

- Secrets/Keys: Fallback-Service enthält aktuell einen hardcodierten API-Key (Security-Risiko).
- Env Mapping: Vite lädt `GEMINI_API_KEY`, README erwähnt teils `API_KEY`.

## 8. Out of Scope / Später

- Echtzeit-ELSTER-Übermittlung mit Zertifikat
- Automatische Buchungsübergabe an Steuerberater
- Mobile App oder Offline-First ohne Cloud-Anbindung
