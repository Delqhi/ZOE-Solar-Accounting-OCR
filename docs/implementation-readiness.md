# Implementation Readiness

> Gate-Check: Sind PRD, (Solution-)Architektur und Epics/Stories ausreichend klar, um in die Implementierung zu gehen?

## Inputs

- PRD: [docs/prd.md](prd.md)
- Solution Architecture: [docs/solution-architecture.md](solution-architecture.md)
- Epics & Stories: [docs/sprint-artifacts/epics-and-stories.md](sprint-artifacts/epics-and-stories.md)

## Checkliste

### 1) Scope & Ziele

- [ ] Scope ist klar (welche Epics/Stories sind „in“)
- [ ] Nicht-Ziele sind dokumentiert

### 2) Architekturentscheidungen

- [ ] Secrets/Keys Handling entschieden (keine hardcodierten Keys)
- [ ] Env-Variablen-Standard entschieden (`GEMINI_API_KEY` als Source of Truth)
- [ ] Touchpoints identifiziert (UI/Services/Storage)

### 3) Stories sind umsetzbar

Mindestens für die nächsten 1–3 Stories:
- [ ] klare Akzeptanzkriterien
- [ ] betroffene Dateien/Module bekannt
- [ ] Risiken/Abhängigkeiten benannt

### 4) Testbarkeit (minimal)

- [ ] Für jede Story gibt es Test-Hinweise (Unit/Smoke/Manual)
- [ ] Kritische Pfade (Upload/OCR/Duplikat/Merge/Export) werden nicht unbeabsichtigt gebrochen

## Ready-to-Start (Vorschlag)

Start-Sprint mit einem kleinen, risikoarmen Slice:
- A1 (Key aus Code entfernen) → A2 (Env/README konsistent) → B1 (Schnittstelle)

## Offene Punkte

- Finaler Sprint-Scope: Stories K1 (Feldkatalog-Typen), K2 (DATEV-Export), L2 (ELSTER-Export) und A1-A2 (API-Key/Env-Konsistenz)
