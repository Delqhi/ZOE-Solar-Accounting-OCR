# Sprint Plan (Sprint 10 — geplant)

## Sprint-Ziel

ELSTER-nahe Übergabe für UStVA verbessern: **Stammdaten** sind pflegbar und Exporte enthalten die Stammdaten; zusätzlich wird die Machbarkeit eines **ELSTER/ERiC-kompatiblen UStVA-Exports** geklärt und umgesetzt (sofern ohne unverhältnismäßige Komplexität möglich).

## Hintergrund / Problem

- Nutzer:innen möchten Werte aus der UStVA-Ansicht je Monat/Quartal exportieren und möglichst ELSTER-konform weiterverwenden.
- Ein „einfaches XML“ ist häufig nicht ausreichend, weil ELSTER-konforme Übermittlung üblicherweise über **ERiC (Elster Rich Client)** mit Zertifikaten/Signaturen läuft.

## Scope

**In Scope (Sprint 10):**
- L2: ELSTER UStVA XML/ERiC Export (je Monat/Quartal) — siehe stories/L2.md

**Out of Scope:**
- Vollständige Zertifikatsverwaltung/Submission im Browser ohne Backend (falls nicht sicher/tragfähig)

## Akzeptanzkriterien auf Sprint-Ebene

- Klar dokumentiert: was der Export ist (nur Payload vs. submitbar) und wie er genutzt werden kann.
- Zeitraumlogik eindeutig und testbar.
- Keine Änderungen am DATEV-Exportformat.

## Story-Details

- L2: stories/L2.md
