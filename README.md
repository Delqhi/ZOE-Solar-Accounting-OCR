# ZOE Solar Accounting OCR ☀️🧾

**Version:** 1.0.0  
**Status:** Produktion / Stabil  
**Sprache:** TypeScript / React

Eine spezialisierte, KI-gestützte Buchhaltungs-Anwendung für **ZOE Solar**. Diese Web-App automatisiert die Extraktion von Rechnungsdaten, die Klassifizierung nach SKR03 und die Vorbereitung für EÜR/UStVA – alles lokal im Browser mit Cloud-KI-Unterstützung.

---

## 🚀 Übersicht & Features

Diese Anwendung ist ein **Single-Page-Application (SPA)**, die vollständig im Browser läuft. Sie nutzt modernste KI-Modelle, um Belege zu analysieren, und speichert alle Daten lokal (IndexedDB) für maximale Privatsphäre und Geschwindigkeit.

### 🧠 KI & OCR Pipeline (3-Stufen-System)
Das System nutzt eine robuste Kaskade, um Daten zu extrahieren:
1.  **Primär:** **Google Gemini 2.5 Flash**. Extrahiert komplexe Strukturen, Positionen (Line Items) und Kontext.
2.  **Fallback 1:** **SiliconFlow (Qwen 2.5 VL)**. Springt ein, wenn Gemini überlastet ist oder Quotas erreicht sind.
3.  **Fallback 2:** **Tesseract.js / Lokales OCR**. Läuft komplett offline im Browser als letzter Rettungsanker, um zumindest Rohtext zu sichern.

### ✨ Hauptfunktionen
*   **Multi-Format Upload:** Unterstützt PDF, JPG, PNG, HEIC, WEBP via Drag & Drop oder Kamera-Aufnahme.
*   **Intelligente Duplikat-Erkennung:**
    *   *Technisch:* Prüfung per Datei-Hash (SHA-256).
    *   *Semantisch:* Prüfung auf identischen Lieferanten, Datum und Betrag (verhindert doppelte Buchung bei erneuter Fotografie).
*   **Split-View Editor:** PDF/Bild-Vorschau links (mit Zoom & Pan), extrahierte Daten rechts.
*   **Zusammenführen (Merge):** Mehrere hochgeladene Dateien können zu einem Beleg zusammengefügt werden (z.B. Rechnung Seite 1 + Seite 2).
*   **Memory System:** Die App "lernt", wie bestimmte Lieferanten kontiert werden (z.B. "Shell" -> "Fuhrpark") und schlägt dies beim nächsten Mal automatisch vor.
*   **Interne Nummerierung:** Generiert automatisch IDs im Format `ZOEYYMM.###` (z.B. `ZOE2305.001`).

### 📊 Buchhaltung & Export
*   **SKR03 Mapping:** Automatische Zuordnung zu Buchungskonten (z.B. 4930 Bürobedarf).
*   **Steuer-Logik:** Unterstützung spezieller PV-Steuerregeln (19%, 0% PV, Reverse Charge, Kleinunternehmer).
*   **Berichte & Export:**
    *   **PDF:** EÜR (Einnahmenüberschussrechnung), UStVA-Vorbereitung, Belegliste.
    *   **SQL:** Vollständiger Datenbank-Export (PostgreSQL kompatibel) zur Langzeitarchivierung.
    *   **CSV:** Export für Excel/Steuerberater.

---

## 🛠 Tech Stack

*   **Frontend Framework:** React 19
*   **Sprache:** TypeScript
*   **Styling:** Tailwind CSS
*   **Build Tool:** Vite (impliziert)
*   **Datenbank:** IndexedDB (via Wrapper `storageService.ts`)
*   **PDF Engine:** PDF.js & jsPDF
*   **KI SDK:** `@google/genai`

---

## ⚙️ Installation & Setup

### Voraussetzungen
*   Node.js (v18 oder höher)
*   Ein Google Cloud Projekt mit aktiviertem **Gemini API Key**.

### 1. Repository klonen
```bash
git clone <repo-url>
cd zoe-accounting-ocr
```

### 2. Abhängigkeiten installieren
```bash
npm install
```

### 3. Umgebungsvariablen konfigurieren
Die App benötigt zwingend einen API-Key. Erstellen Sie eine `.env` Datei im Root-Verzeichnis oder konfigurieren Sie Ihren Bundler so, dass `process.env.API_KEY` verfügbar ist.

**.env Beispiel:**
```env
# Google Gemini API Key (Zwingend erforderlich)
API_KEY="AIzaSy..."
```

*Hinweis: Der `SF_API_KEY` (SiliconFlow) ist aktuell im `fallbackService.ts` hardcodiert und sollte für Produktion ebenfalls in die Env-Variablen ausgelagert werden.*

### 4. Starten
```bash
npm start
# oder
npm run dev
```

---

## 📖 Bedienungsanleitung

### 1. Dashboard & Upload
*   Ziehen Sie Dateien in den markierten Bereich oder nutzen Sie den "Foto aufnehmen" Button auf Mobilgeräten.
*   Die KI beginnt sofort mit der Analyse (Status: `PROCESSING`).

### 2. Prüfung & Korrektur (Detail-Ansicht)
*   Klicken Sie auf einen Beleg in der Liste.
*   **Links:** Belegvorschau. Nutzen Sie das Mausrad zum Zoomen oder ziehen Sie das Bild (Pan). Mit dem `+` Button können weitere Seiten hinzugefügt werden.
*   **Rechts:** Extrahierte Daten.
    *   **Interne Nr.:** Wird automatisch vergeben.
    *   **Original Nr.:** Die Rechnungsnummer des Lieferanten.
    *   **Konto/Steuer:** Prüfen Sie die automatische Zuordnung. Das System zeigt `Automatisch erkannt & zugewiesen` an, wenn eine gelernte Regel angewendet wurde.
*   **Zusammenführen:** Nutzen Sie den Button "Zusammenführen" im Header, um einen anderen hochgeladenen Beleg in den aktuellen zu integrieren (Anhänge).

### 3. Duplikate
*   Wird ein Beleg rot markiert (`DUPLICATE`), wurde er bereits im System gefunden.
*   Öffnen Sie den Beleg, um den Grund zu sehen (z.B. "Inhaltliches Duplikat von ZOE2304.005"). Sie können ihn dann löschen.

### 4. Einstellungen
*   In der Sidebar unter "Einstellungen" können Sie **Kontierungskonten** bearbeiten, hinzufügen oder löschen.
*   Die **Steuerkategorien** sind fest definiert (System-Vorgabe), um Konsistenz für den SQL-Export zu gewährleisten.

### 5. Export
*   Gehen Sie in der Sidebar auf "Berichte & Export".
*   Nutzen Sie die Filter (Jahr, Quartal, Monat).
*   Wählen Sie die Ansicht (`LISTE`, `EÜR`, `USTVA`).
*   Klicken Sie auf das PDF-Icon für einen Druckbericht oder das SQL-Icon für ein Datenbank-Backup.

---

## 🏛 Architektur & Datenmodell

### Datenbank (IndexedDB)
Alle Daten liegen im Browser des Nutzers. Es gibt drei Haupt-Stores:
1.  `documents`: Speichert die Belege, extrahierten JSON-Daten, Base64-Blobs der Bilder und den Status.
2.  `settings`: Speichert benutzerdefinierte Kontenrahmen.
3.  `vendor_rules`: Speichert das "Gedächtnis" der KI (Lieferant -> Konto Zuordnung).

### Datenstruktur (`ExtractedData`)
Das Kernstück ist das JSON-Objekt, das die KI zurückgibt:

```typescript
interface ExtractedData {
  belegDatum: string;          // YYYY-MM-DD
  belegNummerLieferant: string;
  lieferantName: string;
  nettoBetrag: number;
  bruttoBetrag: number;
  
  // Steuer-Aufschlüsselung
  mwstSatz19: number; mwstBetrag19: number;
  mwstSatz7: number;  mwstBetrag7: number;
  
  // Klassifizierung
  kontierungskonto: string;    // z.B. "buero"
  steuerkategorie: string;     // z.B. "19_pv"
  
  lineItems: LineItem[];       // Array der Rechnungsposten
  ...
}
```

### SQL Export Schema
Der SQL-Export generiert ein Schema, das in jede PostgreSQL Datenbank importiert werden kann. Es erstellt Tabellen für:
*   `belege` (Hauptdaten)
*   `steuerkategorien` (Lookup)
*   `kontierungskonten` (Lookup)

---

## ⚠️ Troubleshooting

**KI antwortet nicht / Fehler beim Upload:**
*   Prüfen Sie Ihre Internetverbindung.
*   Prüfen Sie, ob der `API_KEY` korrekt gesetzt ist.
*   Sollte Gemini (Google) ausfallen, versucht das System automatisch SiliconFlow.

**Duplikat-Warnung trotz neuem Beleg:**
*   Das System prüft sehr genau. Haben Sie exakt denselben Betrag beim selben Lieferanten am selben Tag? Falls ja (legitim), können Sie den Status manuell ignorieren, indem Sie die Daten leicht ändern oder den Beleg einfach im System belassen (er wird in Berichten inkludiert, wenn der Status nicht auf ERROR steht).

**PDF Vorschau lädt nicht:**
*   Sehr große PDFs können die Base64-Grenzen des Browsers sprengen. Das System komprimiert Bilder vor dem Senden an die KI, aber die Vorschau nutzt das Original.

---

## 📄 Lizenz

Proprietäre Software für ZOE Solar.
Nutzung und Weitergabe nur mit Genehmigung.
