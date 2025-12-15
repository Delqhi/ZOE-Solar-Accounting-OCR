# Sprint Plan: Erica-Integration für UStVA-Submission

## Sprint-Ziel
Integration von Erica (Open-Source-ELSTER-Wrapper) in die ZOE Solar Accounting OCR Webapp, um UStVA-Submission ohne direkten ERiC-Zugang zu ermöglichen. Fokus auf serverbasierte Lösung auf OCI VM, mit Fallback auf ELSTER-Online-Portal falls Erica nicht funktioniert.

## Hintergrund
- ERiC ist Windows-only und erfordert ELSTER-Entwickler-Zugang (nicht verfügbar).
- Erica kapselt ERiC in Python und bietet APIs für Web-Apps.
- Erica ist discontinued, aber Open-Source – Risiken bei ELSTER-Updates.
- Ziel: Automatisierte UStVA-Submission via Webapp-UI.

## Sprint-Dauer
2-3 Wochen (abhängig von Testing und ELSTER-Kompatibilität).

## User Stories
1. **Als Benutzer möchte ich UStVA-Daten über die Webapp an ELSTER senden können.**
   - Acceptance Criteria: UI für Daten-Upload, Validierung und Submission; Integration mit Erica-API.

2. **Als Entwickler möchte ich Erica auf der OCI VM deployen.**
   - Acceptance Criteria: Erica-Service läuft auf Ubuntu VM; APIs exponiert.

3. **Als Benutzer möchte ich die VM nur während Submission aktivieren (Kostensparen).**
   - Acceptance Criteria: UI-Buttons zum Start/Stop der VM via OCI CLI.

## Tasks
### Phase 1: Setup und Exploration (Tag 1-3)
- [ ] Erica-Repo klonen und analysieren (https://github.com/digitalservicebund/erica).
- [ ] ERiC-Binaries beschaffen (Test-Versionen prüfen; Fallback: ELSTER-Online).
- [ ] VM-Umgebung vorbereiten (Ubuntu ARM64; Python, Dependencies installieren).
- [ ] OCI CLI konfigurieren für VM-Steuerung (API Keys generieren).

### Phase 2: Integration (Tag 4-7)
- [ ] Erica-Service auf VM deployen (Docker-Container erstellen).
- [ ] Webapp-Backend erweitern: Neue API-Endpunkte für Erica-Calls (validateUstva, submitUstva).
- [ ] UI erweitern: Submission-Modus "Erica" hinzufügen; VM-Start/Stop-Buttons.
- [ ] Datenfluss implementieren: OCR-Daten → Erica-XML → ELSTER-Submission.

### Phase 3: Testing und Fallback (Tag 8-10)
- [ ] Unit-Tests für Erica-Integration schreiben.
- [ ] End-to-End-Test: UStVA-Submission simulieren (Test-Umgebung).
- [ ] Fallback implementieren: Wenn Erica fehlschlägt, ELSTER-Online-Portal verwenden (webbasiert).
- [ ] Sicherheit prüfen: Zertifikate, Verschlüsselung.

### Phase 4: Deployment und Dokumentation (Tag 11-14)
- [ ] VM-Scripts finalisieren (auto-start Erica-Service).
- [ ] README aktualisieren mit Erica-Setup.
- [ ] User-Manual für Submission-Prozess.
- [ ] Monitoring: Logs für Submission-Erfolge/Fehler.

## Risiken
- Erica discontinued: ELSTER-API-Änderungen könnten brechen.
- Kein ERiC-Zugang: Test-Binaries verwenden; Fallback auf ELSTER-Online.
- VM-Kosten: Automatisches Stoppen nach Submission implementieren.

## Definition of Done
- Erica-Service läuft stabil auf VM.
- Webapp kann UStVA-Daten an ELSTER senden.
- UI für VM-Steuerung funktioniert.
- Dokumentation vollständig.

## Sprint-Retrospective
Nach Abschluss: Was lief gut? Was verbessern? Nächster Sprint: Optimierung oder weitere Steuerarten.