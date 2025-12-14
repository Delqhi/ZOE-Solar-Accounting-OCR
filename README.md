
# ZOE Solar Accounting OCR ☀️🧾

**Version:** 1.2.0  
**Status:** Produktion  
**Sprache:** TypeScript / React 19

Eine spezialisierte, KI-gestützte Buchhaltungs-Anwendung für **ZOE Solar**. Diese Web-App automatisiert die Extraktion von Rechnungsdaten inklusive Positionen, die Kontierung nach SKR03 (Soll/Haben) und die Vorbereitung für EÜR/UStVA.

---

## 🚀 Übersicht & Features

Diese Anwendung ist ein **Single-Page-Application (SPA)**, die vollständig im Browser läuft. Sie nutzt modernste Vision-KI-Modelle, um Belege zu analysieren, und speichert alle Daten lokal (IndexedDB).

### 🧠 KI & OCR Pipeline (High-Fidelity 2-Stufen-System)
Wir setzen ausschließlich auf Large Multimodal Models (LMMs) für höchste Präzision. Tesseract (lokales OCR) wurde zugunsten der Qualität entfernt.

1.  **Primär:** **Google Gemini 2.5 Flash**. Extrahiert komplexe Strukturen, Rechnungspositionen (Line Items) und Kontext in extrem hoher Geschwindigkeit.
2.  **Fallback:** **SiliconFlow (Qwen 2.5 VL - 72B)**. Ein extrem leistungsstarkes Open-Source Vision Modell, das einspringt, wenn Google Quotas erreicht sind oder Fehler wirft.

### ✨ Hauptfunktionen

#### 1. Buchhaltung & SKR03
*   **Soll & Haben:** Automatische Ermittlung des Soll-Kontos (z.B. 3400 Wareneingang) und Haben-Kontos (z.B. 70000 Kreditor oder 1200 Bank).
*   **SKR03 Editor:** Kontenrahmen kann in den Einstellungen bearbeitet werden.
*   **Steuer-Logik:** Unterstützung spezieller PV-Steuerregeln (19%, 0% PV, Reverse Charge, Kleinunternehmer) und Validierung gegen die extrahierten Steuerbeträge.

#### 2. Positionen (Line Items)
*   **Detail-Erfassung:** Die KI extrahiert einzelne Rechnungspositionen.
*   **Grid-View:** In der Übersichtstabelle können Zeilen aufgeklappt werden (Accordion), um die Positionen zu sehen, ohne den Beleg zu öffnen.
*   **Editierbar:** Positionen können im Detail-Modal bearbeitet, hinzugefügt oder gelöscht werden.

#### 3. Aggressive Duplikat-Erkennung (V2)
Das System nutzt eine strikte Logik, um Doppelbuchungen zu verhindern:
*   **Hard Match:** Stimmen **Belegnummer UND Betrag** (oder Datum) überein, wird der Beleg **sofort** als Duplikat markiert und gesperrt.
*   **Fuzzy Match:** Ein Punktesystem prüft Ähnlichkeiten bei Lieferant, Datum und ungefährem Betrag, falls kein Hard Match vorliegt.
*   **Hash Check:** Identische Dateien werden sofort abgefangen.

#### 4. Workflow & UI
*   **Split-View Editor:** PDF/Bild-Vorschau links (mit Zoom & Pan), extrahierte Daten rechts.
*   **Zusammenführen (Merge):** Per Drag & Drop in der Sidebar oder über die Suche im Modal können Belege zusammengefügt werden (z.B. Seite 1 + Seite 2).
*   **Interne Nummerierung:** Generiert automatisch IDs im Format `ZOEYYMM.###`.

### 📊 Berichte & Export
*   **PDF:** EÜR, UStVA-Vorbereitung, Detaillierte Belegliste.
*   **SQL:** Exportiert ein Schema mit `belege`, `kontierungskonten` und `steuerkategorien` inkl. `soll_konto` und `haben_konto` Feldern.
*   **CSV:** Standardisierter Export.

---

## 🛠 Tech Stack

*   **Frontend Framework:** React 19
*   **Sprache:** TypeScript
*   **Styling:** Tailwind CSS
*   **Datenbank:** IndexedDB (Wrapper `storageService.ts`)
*   **PDF Engine:** PDF.js & jsPDF
*   **KI SDK:** `@google/genai` (Google) & `fetch` (SiliconFlow)

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
Erstellen Sie eine `.env` Datei im Root-Verzeichnis:
```env
# Google Gemini API Key (Zwingend erforderlich)
API_KEY="AIzaSy..."
```

### 4. Starten
```bash
npm start
# oder
npm run dev
```

---

## 📖 Bedienungsanleitung

### 1. Upload & KI-Analyse
Ziehen Sie Dateien in den Upload-Bereich. Die KI analysiert sofort. Falls Gemini überlastet ist ("429"), wechselt das System automatisch zu Qwen 2.5 VL.

### 2. Prüfung (Detail-Ansicht)
*   **Soll/Haben:** Prüfen Sie die automatisch zugewiesenen SKR03 Konten.
*   **Positionen:** Ergänzen oder korrigieren Sie die einzelnen Rechnungsposten in der Tabelle unten.
*   **Regel-Lernen:** Wenn Sie ein Konto bei einem Lieferanten ändern, merkt sich das System dies für die Zukunft.

### 3. Duplikate
Rot markierte Belege sind Duplikate. Der Grund (z.B. "Belegnummer und Betrag identisch") wird im Modal angezeigt. Sie können diese Belege löschen oder (falls es sich um einen Fehler handelt) die Belegnummer ändern, um den Status zurückzusetzen.

### 4. Export
Nutzen Sie den Button "Berichte", um die Daten für den Steuerberater (PDF/SQL) zu exportieren. Der SQL-Export enthält nun explizite Spalten für `soll_konto` und `haben_konto`.

---

## 🏛 Datenmodell (`ExtractedData`)

```typescript
interface ExtractedData {
  // ...Basisdaten
  belegDatum: string;
  belegNummerLieferant: string;
  lieferantName: string;
  
  // Finanzdaten
  nettoBetrag: number;
  bruttoBetrag: number;
  mwstBetrag19: number; 
  mwstBetrag7: number;
  
  // Buchhaltung (NEU)
  kontierungskonto: string;    // Interne ID (z.B. "buero")
  sollKonto: string;           // SKR03 (z.B. "4930")
  habenKonto: string;          // SKR03 (z.B. "1200")
  steuerkategorie: string;     // z.B. "19_pv"
  
  // Inhalt
  lineItems: LineItem[];       // Array [{ description: "...", amount: 10.00 }]
}
```

---

## ⚠️ Troubleshooting

**KI antwortet nicht / Fallback greift nicht:**
*   Prüfen Sie, ob der `API_KEY` korrekt gesetzt ist.
*   SiliconFlow Key ist aktuell hardcodiert in `fallbackService.ts` – für Produktion sollte dieser in `.env` ausgelagert werden.

**PDF Vorschau unscharf:**
*   Die Vorschau nutzt `pdf.js` mit Scale 2.0. Bei sehr kleinen Displays kann es zu Skalierungseffekten kommen. Nutzen Sie Zoom (Mausrad + Ctrl).

---

## 📄 Lizenz

Proprietäre Software für ZOE Solar.
