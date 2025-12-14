# Projektüberblick

## Zweck
Browser-basierte SPA zur Beleg-/Rechnungserfassung für ZOE Solar:
- Upload von PDF/Bild
- KI-gestützte Extraktion (OCR via LMM)
- Buchhaltungs-/Kontierungslogik (SKR03, Soll/Haben, Steuerkategorien)
- Review & Korrektur im UI
- Export (u.a. SQL/PDF/CSV – je nach Implementierung)

## Haupt-User-Flows (vereinfacht)

1. Upload (Drag&Drop oder Datei wählen) → Verarbeitung startet
2. OCR/Extraktion (Primär Gemini, Fallback Vision-Modell)
3. Duplikat-Erkennung (Hash + semantische Regeln)
4. Review im Detail-Modal (PDF links, Daten rechts) inkl. Merge/Attachments
5. Persistenz lokal in IndexedDB
6. Export-Funktionen aus dem Storage-Service

## Datenhaltung

- Lokal im Browser via IndexedDB (Wrapper: `services/storageService.ts`)
- Settings enthalten u.a. Steuerkategorien und Kontierungskonten (SKR03)
- Dokumente enthalten extrahierte Daten sowie Status (Processing/Review/Done/Duplicate/Error)

## Risiken / Tech-Debt Hinweise

- API-Key Handling: Fallback-Service enthält einen hardcodierten SiliconFlow-Key (für Produktion sollte das ausgelagert werden).
- Env-Var-Naming: Vite mapped aktuell `GEMINI_API_KEY` auf `process.env.API_KEY`/`process.env.GEMINI_API_KEY`.
