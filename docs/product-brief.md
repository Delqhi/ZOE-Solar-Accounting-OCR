# Product Brief — ZOE Solar Accounting OCR

## Problem

Buchhaltungsbelege (PDF/Bild) werden heute manuell erfasst und kontiert. Das ist zeitintensiv und fehleranfällig (Beträge/Steuer, Belegnummern, Duplikate, Merge von mehrseitigen Belegen).

## Ziel

Eine Browser-App, die Belege lokal verarbeitet, strukturierte Daten extrahiert, Duplikate zuverlässig erkennt und Exporte für die Weiterverarbeitung erzeugt — ohne Backend.

## Zielgruppe

- Mitarbeitende bei ZOE Solar, die Belege prüfen/korrigieren, kontieren und exportieren.

## Kern-Use-Cases

1. Upload eines Belegs (PDF oder Bild) → OCR → strukturierte Felder + Positionen.
2. Review/Korrektur im Detail-Modal (Beträge, Datum, Lieferant, Line Items, Kontierung).
3. Duplikat-Erkennung verhindert Doppelbuchungen und führt zum Original.
4. Merge von zusammengehörigen Belegen/Seiten (mit Sicherheits-Guards).
5. Export (SQL) zur Weiterverarbeitung.

## Nicht-Ziele (explizit)

- Kein Server/kein Backend.
- Keine vollautomatisierte E2E-Testautomatisierung als Pflicht.
- Keine neuen UI-Features außerhalb der bestehenden App-Scopes.

## Erfolgskriterien

- Häufige OCR-Edgecases führen nicht zu Crashes (defensive Normalisierung).
- Duplikate werden nachvollziehbar markiert (Grund + Next Step) und riskante Aktionen blockiert.
- `npm run check` ist grün; Smoke-Checks sind als Runbook dokumentiert.
