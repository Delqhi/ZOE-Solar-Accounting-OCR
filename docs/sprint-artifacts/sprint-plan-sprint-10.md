# Sprint Plan (Sprint 10 — geplant)

## Sprint-Ziel

ELSTER-nahe Übergabe für UStVA verbessern: **Stammdaten** sind pflegbar und Exporte enthalten die Stammdaten; zusätzlich wird ein **ELSTER XML-Export für manuelle Übermittlung** implementiert (als Alternative zu ERiC, da keine öffentlichen ERiC-Binaries verfügbar sind).

## Hintergrund / Problem

- Nutzer:innen möchten Werte aus der UStVA-Ansicht je Monat/Quartal exportieren und möglichst ELSTER-konform weiterverwenden.
- Ein „einfaches XML“ ist häufig nicht ausreichend, weil ELSTER-konforme Übermittlung üblicherweise über **ERiC (Elster Rich Client)** mit Zertifikaten/Signaturen läuft.- **Recherche-Ergebnis:** Keine öffentlichen/legalen Quellen für ERiC-Binaries gefunden. Daher Fallback auf XML-Export für manuelle Übermittlung via ELSTER Online Portal.- **Status:** XML-Export implementiert und funktionsfähig. ELSTER-kompatibles XML-Format wird generiert und kann manuell im ELSTER Online Portal hochgeladen werden.## Scope

**In Scope (Sprint 10):**
- L2: ELSTER UStVA XML Export für manuelle Übermittlung (je Monat/Quartal) — siehe stories/L2.md

**Out of Scope:**
- Vollständige Zertifikatsverwaltung/Submission im Browser ohne Backend (falls nicht sicher/tragfähig)

## Akzeptanzkriterien auf Sprint-Ebene

- Klar dokumentiert: XML-Export für Upload im ELSTER Online Portal.
- Zeitraumlogik eindeutig und testbar.
- Keine Änderungen am DATEV-Exportformat.

## Story-Details

- L2: stories/L2.md
