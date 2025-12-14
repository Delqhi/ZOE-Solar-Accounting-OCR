# Sprint Plan

## Sprint-Ziel

OCR-Pipeline robuster machen, Datenmodell konsistent halten, UI-Bedienbarkeit verbessern.

## Sprint Scope (Auswahl)

**In Scope (Sprint 2):**
- B2: Parsing/Schema-Validierung härten (defensiv gegen Partial/Null-Felder)
- B3: PDF-Stitching Grenzen/Regeln dokumentieren und testen (max pages/size)
- C1: IndexedDB Migrationspfad dokumentieren (DB_VERSION und Objektstores)
- C2: Export-Schema (SQL) mit Modell-Feldern synchron halten
- D1: Duplicate UX klarer (Warum / next action) + blockierende Aktionen verhindern
- D2: Merge-Flow besser absichern (nicht in Duplikate mergen, Feedback)

**Out of Scope (Sprint 2):**
- Neue Features
- Große Architektur-Änderungen

## Akzeptanz auf Sprint-Ebene

- OCR-Pipeline widerstandsfähiger gegen fehlerhafte Eingaben
- Datenmodell-Migrationen dokumentiert und funktionsfähig
- UI-Fehler bei Duplikaten/Merges reduziert

## Notizen

- Story-Details/ACs bitte pro Story ergänzen, bevor dev startet.
