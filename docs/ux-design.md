# UX Design Notes

Ziel: Minimaler UX-Überblick für den bestehenden Flow (ohne neue Features/Seiten).

## Haupt-Flow (Happy Path)

1. Nutzer lädt PDF/Bild über Upload-Bereich.
2. App startet OCR (Primär) und zeigt nach Abschluss einen Datensatz in der Datenbank-Übersicht.
3. Nutzer öffnet Detail-Ansicht, korrigiert ggf. Felder/Positionen.
4. Nutzer exportiert Daten (SQL).

## Zustände & Feedback

### OCR läuft

- Erwartung: UI bleibt responsiv, Fortschritt/Status ist erkennbar.

### OCR liefert Partial/Null

- Erwartung: Keine Crashes; Felder sind editierbar; fehlende Werte fallen auf Defaults.

### Duplikat erkannt

- Erwartung:
  - Klarer Hinweis im Detail-Modal inkl. Begründung.
  - „Original öffnen“ möglich.
  - Riskante Aktionen (z.B. OCR-Retry/Merge) sind deaktiviert oder geblockt mit Feedback.

### Merge

- Erwartung:
  - Merge in Duplikate/Errors wird geblockt.
  - Feedback ist klar (warum geblockt).

## Informationsarchitektur (bestehende Views)

- Datenbank-Übersicht: Liste/Gridsicht der Belege
- Detail-Modal: Review & Edit
- Settings: Regeln/Konten/Anbieter-Regeln
- Export/Reports: Export-Aktionen

## UX-Risiken

- Falsches Vertrauen in OCR (Fehlbuchungen) → mitigiert durch Duplicate/Merge-Guards und klare Hinweise.
- Unklare Fehlerbilder bei fehlenden API Keys → mitigiert durch klare Fehlermeldungen.

## Akzeptanz (UX)

- Duplikat-Hinweise und Next Steps sind für Nicht-Entwickler verständlich.
- Kernaktionen sind nicht „still failing“: Fehler haben sichtbares Feedback.
