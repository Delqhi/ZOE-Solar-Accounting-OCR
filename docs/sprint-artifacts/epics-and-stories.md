# Epics & Stories (Backlog)

> Dieses Dokument ist ein Startpunkt für `create-epics-and-stories`.
> Es leitet sich aus [docs/prd.md](../prd.md) und [docs/solution-architecture.md](../solution-architecture.md) ab.

## Epics

> Hinweis: Epics A–D wurden im aktuellen Stand umgesetzt; neue Arbeit läuft als weitere Epics. Aktive Entwicklung in Epics K und L.

### Epic A: Sicherheit & Konfiguration

**Ziel:** Secrets/Keys und Env-Konfiguration konsistent und produktionsfähig machen.

**Stories:**
- A1: Hardcodierten Fallback-API-Key entfernen und über Environment konfigurieren
- A2: Env-Var Naming vereinheitlichen (Quelle `GEMINI_API_KEY`), README anpassen

### Epic B: OCR-Pipeline Robustheit

**Ziel:** Stabilere Extraktion, bessere Fehlerbilder, nachvollziehbare Qualität.

**Stories:**
- B1: Einheitliche OCR-Provider-Schnittstelle (Gemini/Fallback) definieren
- B2: Parsing/Schema-Validierung härten (defensiv gegen Partial/Null-Felder)
- B3: PDF-Stitching Grenzen/Regeln dokumentieren und testen (max pages/size)

### Epic C: Datenmodell & Persistenz

**Ziel:** Datenmodell konsistent halten und Migrationen sauber fahren.

**Stories:**
- C1: IndexedDB Migrationspfad dokumentieren (DB_VERSION und Objektstores)
- C2: Export-Schema (SQL) mit Modell-Feldern synchron halten

### Epic D: UI Review & Bedienbarkeit

**Ziel:** Review-Flow effizienter, weniger Fehler bei Duplikaten/Merges.

**Stories:**
- D1: Duplicate UX klarer (Warum / next action) + blockierende Aktionen verhindern
- D2: Merge-Flow besser absichern (nicht in Duplikate mergen, Feedback)

### Epic E: Release/QA Runbook

**Ziel:** Regressions vermeiden, indem ein kurzer QA-/Release-Ablauf dokumentiert ist.

**Stories:**
- E2: Release/QA Runbook (Smoke-Checks, Export-Check, Duplicate/Merge-Check)

### Epic F: Stabilität & Edgecases

**Ziel:** Robustere Verarbeitung von OCR-Ausgaben (Edgecases) und klarere Fehlerbilder.

**Stories:**
- F1: Guardrails bei OCR/Parsing (Feldkonflikte, ungewöhnliche Datumsformate, Rundungslogik) → Details: [stories/F1.md](stories/F1.md)
- F2: Bessere Fehlermeldungen/Statusanzeigen bei OCR-Fail/Fallback-Fail → Details: [stories/F2.md](stories/F2.md)

### Epic G: Datenqualität & Export

**Ziel:** Export-Qualität absichern und Kontierungs-/Steuerlogik nachvollziehbar machen.

**Stories:**
- G1: Export-Validierung / Preflight (Pflichtfelder, Summenprüfung Netto+MwSt=Brutto)
- G2: Steuerlogik/Rule-Engine Finetuning + „Warum dieses Konto“ Erklärung

### Epic H: Workflow/UX Feinschliff (ohne neue Seiten)

**Ziel:** Review schneller machen und Error-Status handlungsorientiert erklären.

**Stories:**
- H1: Review-Shortcuts (Tastatur, Fokus-Handling), weniger Klicks beim Korrigieren
- H2: Klareres Handling für „Fehler“-Status (konkrete Hinweise: was tun, um zu beheben)

### Epic I: Export/Reporting Feinschliff

**Ziel:** Exporte weiter vereinheitlichen und für externe Weiterverarbeitung robuster machen.

**Stories:**
- I1: CSV-Export finalisieren/standardisieren → Details: [stories/I1.md](stories/I1.md)
- I2: Export-Dateinamen & Metadaten verbessern → Details: [stories/I2.md](stories/I2.md)

### Epic J: DATEV/Steuerberater-Übergabe

**Ziel:** Exportformate weiter an DATEV-Import-Workflows annähern und dafür Validierung/Mapping zentralisieren.

**Stories:**
- J1: DATEV-kompatibler Buchungsstapel-Export (CSV) → Details: [stories/J1.md](stories/J1.md)
- J2: DATEV-Preflight & Steuer-/Konten-Mapping → Details: [stories/J2.md](stories/J2.md)

### Epic K: Belegdaten-Vollständigkeit & Export-Schema

**Ziel:** Alle relevanten Belegfelder (inkl. Zahlung/Organisation/Flags) vollständig erfassen und konsistent exportieren; Positionen (1:n) sauber abbilden.

**Stories:**
- K1: Feldkatalog + Datenmodell-Abgleich → Details: [stories/K1.md](stories/K1.md)
- K2: CSV/SQL Export erweitern (fehlende Spalten + Positionen) → Details: [stories/K2.md](stories/K2.md)

## Story-Template

Für jede Story bitte ergänzen:
- **Beschreibung**
- **Akzeptanzkriterien**
- **Out of Scope**
- **Touchpoints** (Dateien/Komponenten)
- **Test-Hinweise**

