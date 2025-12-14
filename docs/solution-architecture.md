# Solution Architecture (Brownfield)

> Dieses Dokument beschreibt die **Ziel-/Lösungsarchitektur** für die nächsten geplanten Änderungen.
> Es ergänzt die Ist-Architektur in [docs/architecture.md](architecture.md).

## 1. Scope / Vorhaben

- (TBD) Welche konkreten Features/Änderungen werden umgesetzt?
- (TBD) Welche Bereiche sind betroffen (UI, Services, Storage, Export)?

## 2. Architektur-Ziele

- Stabilere/robustere Extraktion & Validierung (OCR)
- Minimierung von Duplikaten/Fehlbuchungen
- Wartbarkeit (klarere Abgrenzung UI ↔ Domain ↔ Storage)
- Keine Server-Abhängigkeit (weiterhin Client-only), sofern nicht anders entschieden

## 3. Zielbild (High-Level)

### 3.1 Schichten

- **UI Layer**: React Komponenten + View State
- **Domain Layer**: Normalisierung/Validierung, Regelengine, Duplikat-Checks
- **Integration Layer**: OCR Provider (Gemini/Fallback) hinter klarer Schnittstelle
- **Persistence Layer**: `storageService` (IndexedDB) + Export

### 3.2 Empfohlene Schnittstellen (minimal)

- `services/ocrProvider.ts` (neu, optional): Einheitliche Schnittstelle `analyzeDocument(input) -> Partial<ExtractedData>`
- `services/documentPipeline.ts` (neu, optional): Orchestrierung Upload → OCR → Regeln → Persistenz

> Hinweis: Das sind optionale Refactors; wenn Scope klein bleibt, reicht auch ein dokumentiertes „so wie heute“.

## 4. Schlüsselentscheidungen

- **Secrets/Keys:** keine hardcodierten API Keys im Repo (Fallback-Key auslagern)
- **Env Vars:** einheitlich `GEMINI_API_KEY` als Source of Truth; keine Doppelbelegung
- **PDF.js Worker:** stabile Worker-URL (pinning) und Fehlerbehandlung

## 5. Datenmodell / Migrations

- `ExtractedData` ist bereits breit; Änderungen möglichst kompatibel.
- Wenn Felder umbenannt werden: Migrationspfad für IndexedDB Versionen definieren.

## 6. Risiken & Mitigations

- Anbieter-Quota/Timeouts → Fallback + „Fail-safe object“ bleibt
- Sehr große PDFs → Limit Pages/Resize/Stitching (bestehende Logik), klare Grenzwerte dokumentieren

## 7. Offene Punkte

- (TBD) Was ist das nächste konkrete Feature/Problem?
- (TBD) Brauchen wir UX-Redesign oder reicht kleine UI-Anpassung?
