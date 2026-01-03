# Export-Formate

## ELSTER XML

Exportiert die Umsatzsteuervoranmeldung als ELSTER-kompatible XML-Datei.

**Format:** ElsterAnmeldung v8 (Coala-XML)

**Kennzahlen:**
- Kz21: Steuerfreie Umsätze
- Kz35: Reverse Charge
- Kz81/Kz83: 7% Steuer
- Kz86/Kz89: 19% Steuer
- Kz93: Gesamtsteuer

**Zeitraum:** Quartal (Q1-Q4) oder Monat

**Verwendung:**
1. Export-Button klicken
2. XML-Datei herunterladen
3. Im ELSTER Online Portal hochladen

## DATEV EXTF

Exportiert Buchungsstapel im DATEV EXTF-Format für Steuerberater-Software.

**Konfiguration in Einstellungen:**
- Beraternummer
- Mandantnummer
- Wirtschaftsjahr
- Sachkontenlänge

## CSV

Semikolon-getrennt, UTF-8 kodiert.

**Spalten:**
- datum, lieferant, adresse, steuernummer
- belegnummer_lieferant, interne_nummer
- netto, mwst_satz_19, mwst_19, brutto
- kontierungskonto, soll_konto, haben_konto
- status, beschreibung

## SQL

Vollständiges PostgreSQL-Schema mit:
- steuerkategorien
- kontierungskonten
- belege
- beleg_positionen
- elster_stammdaten

## PDF

Generiert Berichte mit:
- EÜR-Auswertung
- UStVA-Übersicht
- Beleglisten

## Backup

JSON-Backup mit allen Dokumenten und Einstellungen.
SQL-Backup für vollständige Datenbankwiederherstellung.
