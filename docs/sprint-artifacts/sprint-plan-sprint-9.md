# Sprint Plan (Sprint 9 — geplant)

## Sprint-Ziel

Alle zu erfassenden Belegdaten vollständig und konsistent abbilden (Datenmodell + Export), damit Steuerberater/Reporting nicht an fehlenden Spalten scheitert.

## Hintergrund / Problem

Der aktuelle CSV-Export enthält nur einen Kernsatz (ca. 14 Spalten). Im Datenmodell sind bereits zusätzliche Felder vorhanden bzw. fachlich erforderlich (u.a. Positionen, Zahlung, organisatorische Metadaten). Zusätzlich sind Positionen 1:n (Line Items) und brauchen eine klare Export-Strategie.

## Scope

**In Scope (Sprint 9):**
- K1: Feldkatalog (Soll-Zielmodell) + Datenmodell-/Persistenz-Check (ohne neue Seiten)
- K2: Export-Erweiterung (CSV/SQL) inkl. Positionen (1:n) und Zahlungsdaten

**Out of Scope (Sprint 9):**
- Neue Views/Seiten
- DATEV-spezifische Erweiterungen (bereits Sprint 8)
- Automatische Zahlungsabgleiche (Bank/PSD2)

## Entscheidungen (für Sprint 9)

- Positionen (Line Items) werden **nicht** in eine einzelne „Belege“-CSV gepresst.
- Stattdessen: **Zwei CSVs**
  - `zoe_belege_*.csv` (Beleg-Kopf / 1:1)
  - `zoe_positionen_*.csv` (Positionen / 1:n, referenziert per `doc_id`)

## Akzeptanzkriterien auf Sprint-Ebene

- Ein Feldkatalog definiert eindeutig, welche Felder exportiert werden (und welche optional sind).
- CSV-Export enthält Zahlungsdaten (`zahlungsmethode`, `zahlungsDatum`, `zahlungsStatus`) und organisatorische Felder (z.B. `aufbewahrungsOrt`, `rechnungsEmpfaenger`).
- Positionen sind exportierbar über separate CSV (`doc_id`, `line_index`, `description`, `amount`).

## Story-Details

- K1: [stories/K1.md](stories/K1.md)
- K2: [stories/K2.md](stories/K2.md)
