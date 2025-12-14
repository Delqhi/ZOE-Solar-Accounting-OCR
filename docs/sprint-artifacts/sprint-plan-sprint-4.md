# Sprint Plan (Sprint 4 — geplant)

## Sprint-Ziel

Stabilität erhöhen: Guardrails bei OCR/Parsing verbessern und Fehlerbilder/Statusanzeigen bei OCR-Fails klarer machen.

## Sprint Scope (Auswahl)

**In Scope (Sprint 4):**
- F1: OCR/Parsing Guardrails (Feldkonflikte, ungewöhnliche Datumsformate, Rundungslogik)
- F2: Bessere Fehlermeldungen/Statusanzeigen bei OCR-Fail/Fallback-Fail

**Out of Scope (Sprint 4):**
- Neue Seiten/Views
- Playwright/E2E-Automatisierung
- Große Architektur-Änderungen

## Akzeptanz auf Sprint-Ebene

- OCR-Fehlschläge sind für Nutzer verständlich und führen nicht zu „Silent Fails“.
- Parsing-Edgecases verursachen keine Crashes; Rundungs-/Summenlogik ist konsistent.

## Notizen

- Details/ACs:
	- [Story F1](stories/F1.md)
	- [Story F2](stories/F2.md)

