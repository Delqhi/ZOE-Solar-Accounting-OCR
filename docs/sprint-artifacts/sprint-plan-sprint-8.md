# Sprint Plan (Sprint 8 — abgeschlossen)

## Sprint-Ziel

Steuerberater-Übergabe weiter vereinheitlichen: ein DATEV-nahes Exportformat vorbereiten und die dafür nötigen Validierungen/Mapping-Regeln klar definieren — ohne neue Seiten.

## Sprint Scope (Vorschlag)

**In Scope (Sprint 8):**
- J1: DATEV-kompatibler Buchungsstapel-Export (CSV, minimaler Kernumfang)
- J2: DATEV-Preflight & Steuer-/Konten-Mapping (harte Validierung + klare Fehlhinweise)

**Out of Scope (Sprint 8):**
- Backend/Server
- Import/Sync aus DATEV
- Neue Seiten/Views oder komplexe UI-Flows

## Akzeptanz auf Sprint-Ebene

- Export erzeugt ein DATEV-nahes CSV, das pro Beleg einen Buchungssatz erzeugt (Soll/Haben, Betrag, Datum, Belegfeld).
- Preflight blockt fehlende/ungültige Felder mit klarer, handlungsorientierter Meldung.

## Story-Details

- J1: Details: [stories/J1.md](stories/J1.md)
- J2: Details: [stories/J2.md](stories/J2.md)
