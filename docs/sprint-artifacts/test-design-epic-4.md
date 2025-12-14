# Test Design — Epic 4 (D) UI Review & Bedienbarkeit

## Scope

- Duplikat-UX: Grund + Next Steps sichtbar, riskante Aktionen blockiert.
- Merge-Flow: keine Merges in Duplikate/Errors.

## Risiken

- User merged “falsche” Belege → Datenkorruption/Fehlbuchung.
- Duplicate-Kennzeichnung ist unklar → unnötige Support-/Nacharbeit.

## Tests (manuell)

### Duplicate UX

- Beleg A erzeugen.
- Beleg B erzeugen, der als Duplikat zu A erkannt wird.
- Erwartung:
  - Modal zeigt Duplikat-Hinweis inkl. Begründung.
  - „Original öffnen“ funktioniert.
  - OCR-Retry ist deaktiviert (oder klar blockiert).

### Merge Guards

- Versuch, Duplikat/Fehler-Beleg als Merge-Quelle oder -Ziel zu verwenden.
- Erwartung: Merge wird blockiert und User erhält Feedback.

## Evidence

- Kurzer Screenrecord oder Screenshots (optional) für Sprint-Doku.
