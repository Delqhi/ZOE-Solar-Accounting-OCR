# Feldkatalog: Steuerliche Stammdaten (ELSTER)

## Ziel
Dieser Feldkatalog definiert **minimale, präzise Stammdaten**, die für eine **ELSTER-nahe** Übergabe (UStVA/EÜR-Vorbereitung) benötigt werden, ohne bestehende **DATEV-EX­TF** Exporte zu verändern.

Wichtige Abgrenzung:
- Das bestehende Belegfeld `steuernummer` in den extrahierten Belegdaten bezieht sich auf die **Steuernummer des Lieferanten/Belegs**.
- Die ELSTER-Stammdaten in diesem Katalog beziehen sich auf die **eigene Steuernummer / eigene USt-IdNr** des Steuerpflichtigen (Mandant).

**Leitprinzipien**
- **Minimal**: nur Felder, die in ELSTER-Workflows typischerweise benötigt werden.
- **Nicht-invasiv**: keine Änderung an DATEV-Exportformat/Spalten.
- **Lokal**: Speicherung im bestehenden Settings-Speicher (IndexedDB) wie andere Konfigurationen.

## Datenmodell (kanonisch)
Empfohlene Ablage als optionales Settings-Objekt (Beispielname): `AppSettings.elsterStammdaten`.

- Datentyp: ein einzelnes Objekt (1 Mandant/Instanz).
- Alle Felder: **string/boolean** (keine komplexen Typen), um Migrationen leicht zu halten.

## Felder
Format der Feldnamen:
- **Kanonisch (UI/Settings):** `camelCase`
- **Export-Spalten (CSV/SQL):** `snake_case`

### Pflicht-Minimum (für eindeutige steuerliche Zuordnung)
| Feld (canonical) | Export-Key | Datentyp | Pflicht | Minimale Validierung | Hinweise |
|---|---|---:|:---:|---|---|
| `unternehmensName` | `unternehmens_name` | string | ✅ | `trim().length >= 1` | Rechtsname / Name des Steuerpflichtigen |
| `land` | `land` | string | ✅ | ISO-3166-1 Alpha-2, Default `DE` | Für Anschrift; aktuell Fokus DE |
| `plz` | `plz` | string | ✅ | DE: `^\d{5}$` | Bei nicht-DE: Validierung nur `trim().length >= 1` |
| `ort` | `ort` | string | ✅ | `trim().length >= 1` |  |
| `strasse` | `strasse` | string | ✅ | `trim().length >= 1` |  |
| `hausnummer` | `hausnummer` | string | ✅ | `trim().length >= 1` |  |
| `eigeneSteuernummer` | `eigene_steuernummer` | string | ✅ | Zeichenmenge: Ziffern + ` /-` (optional). Zusätzlich: nach Normalisierung `digits.length` zwischen 10 und 13 | In Deutschland existieren mehrere Formate; wir validieren bewusst konservativ |

**Normalisierung für `eigeneSteuernummer` (Export/Checks)**
- `eigene_steuernummer_digits = eigeneSteuernummer.replace(/\D/g, "")`
- Speichern: **Originalwert** (wie eingegeben). Für Exporte/Checks: optional zusätzlich `eigene_steuernummer_digits` berechnen.

### Optional (typisch hilfreich für ELSTER-Formulare)
| Feld (canonical) | Export-Key | Datentyp | Pflicht | Minimale Validierung | Hinweise |
|---|---|---:|:---:|---|---|
| `eigeneUstIdNr` | `eigene_ust_idnr` | string | ⛔ | `^DE\d{9}$` (falls gesetzt) | Eigene USt-IdNr (nur wenn vorhanden) |
| `finanzamtName` | `finanzamt_name` | string | ⛔ | `trim().length >= 1` (falls gesetzt) | Lesbarer Name |
| `finanzamtNr` | `finanzamt_nr` | string | ⛔ | `^\d{4}$` (falls gesetzt) | Nur, wenn im Kontext genutzt |
| `rechtsform` | `rechtsform` | string | ⛔ | Enum (falls gesetzt): `einzelunternehmen|gmbh|ug|gbr|ohg|kg|ev|sonstiges` | Minimaler Satz, erweiterbar |
| `besteuerungUst` | `besteuerung_ust` | string | ⛔ | Enum (falls gesetzt): `ist|soll|unbekannt` | Für UStVA-Kontext |
| `kleinunternehmer` | `kleinunternehmer` | boolean | ⛔ | boolean | Korrespondiert fachlich zu §19; beeinflusst Auswertungs-/Hinweislogik |
| `iban` | `iban` | string | ⛔ | sehr minimal: `^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$` (falls gesetzt) | Für Erstattungen/Lastschrift ggf. relevant |
| `kontaktEmail` | `kontakt_email` | string | ⛔ | sehr minimal: enthält `@` (falls gesetzt) | Kein striktes RFC, um False-Negatives zu vermeiden |

## Export-Entscheidung (PDF / CSV / SQL) – ohne DATEV zu brechen
### DATEV (EXTF/DTVF)
- **Keine Änderungen** am DATEV-Export.
- ELSTER-Stammdaten werden **nicht** in DATEV-Spalten „hineingemappt“, da das Importformat strikt ist.

### PDF (Berichte: Belegliste/EÜR/UStVA)
- Stammdaten werden als **Header-Block** auf Seite 1 ausgegeben:
  - `unternehmensName`, Anschrift, `steuernummer`, optional `ustIdNr`, optional `finanzamtName`.
- Ziel: Nutzer kann ELSTER-Onlineformulare schneller manuell befüllen; keine elektronische ELSTER-Schnittstelle notwendig.

### CSV
- Bestehende Dateien bleiben **unverändert**:
  - `zoe_belege_*.csv`
  - `zoe_positionen_*.csv`
- Zusätzlich neue, eigenständige Datei:
  - `zoe_elster_stammdaten_<filterTag>_<timestamp>.csv`
- Struktur: genau **1 Datenzeile** (1 Mandant), deterministische Spaltenreihenfolge gemäß Feldkatalog.

### SQL
- Bestehender SQL-Export bleibt kompatibel (bestehende Tabellen unverändert nutzbar).
- Ergänzung als **neue Tabelle** ist rückwärtskompatibel:
  - Tabelle `elster_stammdaten` (1 Row)
- Keine Änderung der DATEV- oder Beleg-Tabellen erforderlich.

## Akzeptanzkriterien (kurz)
- Feldkatalog enthält für jedes Feld: Name, Typ, Pflicht/Optional, minimale Validierung, Export-Key.
- `steuernummer` wird tolerant akzeptiert (mit Trennzeichen), aber für Exporte kann eine Ziffern-Normalisierung abgeleitet werden.
- DATEV-Export (`generateDatevExtfBuchungsstapelCsv`) bleibt **inhaltlich und strukturell unverändert**.
- CSV/SQL/PDF integrieren Stammdaten **ohne** bestehende `zoe_belege_*.csv` Spaltenreihenfolge zu ändern.
- Fehlende optionale Stammdaten führen zu **leeren Feldern/NULL**, nicht zu Export-Abbrüchen.
