# Test Design — Epic 3 (C) Datenmodell & Persistenz

## Scope

- IndexedDB Schema/Versionierung ist dokumentiert.
- SQL-Export ist schema-konform (CREATE/ALTER/INSERT konsistent).

## Risiken

- Export driftet vom tatsächlichen Modell ab → Downstream-Import scheitert.
- Neue Felder fehlen im Export oder sind falsch typisiert.

## Tests

### Export-Schema

- SQL-Export erzeugen (UI Export/Report).
- Prüfen:
  - `CREATE TABLE belege` enthält die erwarteten Spalten.
  - `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` ist idempotent.
  - `INSERT INTO belege (...) VALUES (...)` enthält exakt passende Spaltenreihenfolge.

### Persistenz Smoke

- Beleg anlegen → Reload der Seite → Beleg ist weiterhin vorhanden (IndexedDB).

## Evidence

- Export-Datei kurz gegenlesen (Schema + Inserts).
- Optional: Import in lokale SQLite/Postgres-Instanz (außerhalb dieses Projekts).
