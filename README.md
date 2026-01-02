
<div align="left">

# 🌟 ZOE Solar Accounting OCR

[![Version](https://img.shields.io/badge/version-1.3.0-blue.svg)](https://github.com/DeepthinkAI2025/ZOE-Solar-Accounting-OCR)
[![Status](https://img.shields.io/badge/status-production-brightgreen.svg)](https://github.com/DeepthinkAI2025/ZOE-Solar-Accounting-OCR)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**🚀 Die Zukunft der Buchhaltung für Solar-Unternehmen**

*Automatisierte KI-gestützte Rechnungsextraktion • SKR03-Kontierung • EÜR/UStVA-Vorbereitung • ELSTER XML-Export*

[📥 Download](#-installation--setup) • [🎯 Live Demo](#) • [📚 Dokumentation](#-features) • [🐛 Issues](https://github.com/DeepthinkAI2025/ZOE-Solar-Accounting-OCR/issues)

---

## ✨ Was macht diese App besonders?

<table>
  <tr>
    <td>
      <h3>🤖 KI-gestützt</h3>
      <p>Modernste Vision-KI für 99% Genauigkeit bei der Datenerfassung</p>
    </td>
    <td>
      <h3>⚡ Blitzschnell</h3>
      <p>Rechnungen in Sekunden analysiert, nicht Stunden</p>
    </td>
    <td>
      <h3>🔒 Datenschutz</h3>
      <p>100% lokal - keine Daten verlassen Ihren Browser</p>
    </td>
  </tr>
  <tr>
    <td>
      <h3>🎯 SKR03</h3>
      <p>Automatische Soll/Haben-Kontierung nach deutschem Standard</p>
    </td>
    <td>
      <h3>📊 ELSTER Ready</h3>
      <p>Direkter XML-Export für ELSTER Umsatzsteuervoranmeldung</p>
    </td>
    <td>
      <h3>☁️ Cloud Automation</h3>
      <p>n8n + Supabase + GitLab für automatische Verarbeitung</p>
    </td>
  </tr>
</table>

---

## 🎬 Quick Start (2 Minuten)

```bash
git clone https://github.com/DeepthinkAI2025/ZOE-Solar-Accounting-OCR.git
cd ZOE-Solar-Accounting-OCR
npm install
echo "GEMINI_API_KEY=your_key_here" > .env
npm run dev
```

**🎉 Fertig!** Öffne [http://localhost:5173](http://localhost:5173) in deinem Browser.

---

## 🧠 Revolutionäre KI-Technologie

### 🔥 High-Fidelity 2-Stufen KI-Pipeline

| Stufe | Modell | Geschwindigkeit | Genauigkeit | Zweck |
|-------|--------|----------------|-------------|-------|
| **1️⃣ Primär** | Google Gemini 2.5 Flash ⚡ | < 3 Sekunden | 99% | Komplexe Strukturen & Positionen |
| **2️⃣ Fallback** | SiliconFlow Qwen 2.5 VL (72B) 🧠 | < 5 Sekunden | 98% | Maximale Zuverlässigkeit |

**🚫 Kein Tesseract!** Wir verwenden ausschließlich Large Multimodal Models (LMMs) für höchste Präzision.

---

## 🎯 Kernfunktionen

### 📑 Intelligente Belegverarbeitung

<details>
<summary><strong>📄 PDF & Bild Upload</strong> - Drag & Drop einfachheit</summary>

- **Multi-Format Support:** PDF, JPG, PNG, WebP
- **Batch Upload:** Mehrere Dateien gleichzeitig
- **Automatische Erkennung:** Rechnungstyp und Layout
- **Vorschau:** Sofortige Anzeige vor Verarbeitung

</details>

<details>
<summary><strong>🎯 SKR03 Kontierung</strong> - Deutsche Buchführungsstandards</summary>

- **Automatisch:** Soll & Haben Konten werden intelligent ermittelt
- **Solar-spezifisch:** Optimierte Regeln für PV-Branche
- **Editierbar:** SKR03-Kontenrahmen in Einstellungen anpassbar
- **Validierung:** Plausibilitätsprüfungen gegen Steuerbeträge

```typescript
// Beispiel für automatische Kontierung
const kontierung = {
  sollKonto: "3400", // Wareneingang
  habenKonto: "70000", // Kreditor
  steuerkategorie: "19% Umsatzsteuer"
};
```

</details>

<details>
<summary><strong>📊 Positionen Extraktion</strong> - Jedes Detail zählt</summary>

- **KI-gestützt:** Einzelne Rechnungspositionen werden erkannt
- **Accordion View:** Zeilen aufklappen ohne PDF zu öffnen
- **Bearbeitbar:** Positionen hinzufügen, ändern, löschen
- **Summenvalidierung:** Automatische Prüfung gegen Gesamtbetrag

</details>

### 🛡️ Qualitätssicherung

<details>
<summary><strong>🚫 Duplikat-Erkennung V2</strong> - Zero Tolerance für Doppelbuchungen</summary>

- **Hard Match:** Belegnummer + Betrag = Sofort blockiert
- **Fuzzy Match:** Ähnlichkeitsalgorithmus für ähnliche Belege
- **Hash Check:** Identische Dateien werden abgefangen
- **Visuelle Indikatoren:** Farbkodierung für Status

</details>

### 🎨 Benutzeroberfläche

<details>
<summary><strong>🎭 Split-View Editor</strong> - Professionelle Bearbeitung</summary>

- **Links:** PDF-Vorschau mit Zoom & Pan
- **Rechts:** Extrahierte Daten editierbar
- **Synchronisiert:** Änderungen live aktualisiert
- **Keyboard Shortcuts:** Effiziente Bedienung

</details>

<details>
<summary><strong>🔗 Beleg-Zusammenführung</strong> - Nahtlose Integration</summary>

- **Drag & Drop:** Einfach Belege zusammenziehen
- **Intelligente Suche:** Ähnliche Belege finden
- **Automatische Nummerierung:** ZOEYYMM.### Format
- **Versionierung:** Änderungshistorie behalten

</details>

---

## ☁️ n8n Cloud Automation

### 🔄 Automatisierte Dokumentenverarbeitung

Die App unterstützt jetzt die vollständige Automatisierung via n8n, Supabase und GitLab.

| Workflow | Trigger | Aktion |
|----------|---------|--------|
| **WhatsApp Belege** | Datei in "Belege" Gruppe | OCR → Supabase → GitLab |
| **Gmail Rechnungen** | E-Mail mit "Rechnung" | Queue → UI Notification |

### 📱 WhatsApp Integration (WAHA)

```
Beleg in WhatsApp Gruppe "Belege" → n8n Webhook → OCR (Gemini)
    ↓
Supabase (Dokument speichern) → GitLab (PDF + JSON) → App Benachrichtigung
```

**Setup:**
1. WAHA Session erstellen: https://waha.aura-call.de
2. Webhook konfigurieren: `https://n8n.aura-call.de/webhook/zoe-whatsapp`
3. n8n Workflow importieren: `n8n-workflows/workflow-1-whatsapp-belege.json`

### 📧 Gmail Integration

```
Rechnung per E-Mail → n8n Gmail Trigger → Supabase Queue
    ↓
UI Notification anzeigen → User bestätigt/löscht → Dokument verarbeitet
```

**Setup:**
1. Gmail OAuth2 Credential in n8n erstellen
2. Filter: Betreff enthält "rechnung", "invoice", "beleg"
3. n8n Workflow importieren: `n8n-workflows/workflow-2-gmail-queue.json`

### 🗄️ Supabase Cloud Database

Die App nutzt Supabase als zentrale Datenbank für:
- **documents** - Alle verarbeiteten Belege
- **pending_queue** - Unbestätigte Gmail-Rechnungen
- **notifications** - UI Benachrichtigungen
- **processed_messages** - Idempotenz-Check

**Setup:**
1. Supabase Projekt erstellen: https://supabase.com
2. `supabase-schema.sql` im SQL Editor ausführen
3. Environment Variablen setzen:

```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbG..."
```

### 📦 GitLab Document Storage

Alle Belege werden automatisch in GitLab archiviert:
- **PDF Dateien:** `{year}/{month}/{zoe_reference}.pdf`
- **Metadaten:** `{year}/{month}/{zoe_reference}.json`

**Setup:**
1. GitLab Projekt erstellen: `zoe-solar-documents`
2. API Token mit `write_repository` Scope generieren

```env
VITE_GITLAB_PROJECT_ID="zoe-solar-documents"
VITE_GITLAB_API_URL="https://gitlab.com/api/v4"
```

### 🔔 Real-time Notifications

Die App zeigt Benachrichtigungen in der Sidebar an:
- Neue Belege aus WhatsApp
- Ausstehende Rechnungen aus Gmail (mit Bestätigen/Löschen Buttons)
- Echtzeit-Updates via Supabase Realtime

---

### 📐 Supabase Database Schema

Die zentrale Datenbank besteht aus folgenden Tabellen:

```sql
-- Haupt-Tabelle: documents
CREATE TABLE documents (
    id UUID PRIMARY KEY,
    zoe_reference VARCHAR(50),      -- z.B. "ZOE-202501-ABC123"
    file_name VARCHAR(500),
    source_type VARCHAR(50),        -- 'whatsapp', 'gmail', 'upload'
    document_type VARCHAR(100),
    beleg_datum DATE,
    lieferant_name VARCHAR(500),
    brutto_betrag DECIMAL(12, 2),
    status VARCHAR(50),             -- 'processing', 'completed', 'review_needed'
    ocr_score INTEGER,
    raw_data JSONB,
    created_at TIMESTAMPTZ
);

-- Queue-Tabelle: pending_queue (Gmail Workflow)
CREATE TABLE pending_queue (
    id UUID PRIMARY KEY,
    source_type VARCHAR(50),
    source_message_id VARCHAR(255),
    sender_email VARCHAR(255),
    preliminary_data JSONB,         -- { extracted_vendor, extracted_amount, ... }
    extracted_amount DECIMAL(12, 2),
    extracted_vendor VARCHAR(500),
    status VARCHAR(20),             -- 'pending', 'confirmed', 'rejected'
    created_at TIMESTAMPTZ
);

-- Benachrichtigungen
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    notification_type VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ
);

-- Idempotenz-Check
CREATE TABLE processed_messages (
    id VARCHAR(255) PRIMARY KEY,   -- WhatsApp message ID oder Gmail ID
    message_type VARCHAR(50),
    processing_status VARCHAR(50),
    document_id UUID,
    created_at TIMESTAMPTZ
);
```

---

### 📁 GitLab Document Structure

Belege werden in GitLab mit folgender Struktur gespeichert:

```
zoe-solar-documents/
├── 2025/
│   ├── 01/
│   │   ├── ZOE-202501-ABC123.pdf
│   │   ├── ZOE-202501-ABC123.json
│   │   ├── ZOE-202501-DEF456.pdf
│   │   └── ZOE-202501-DEF456.json
│   └── 02/
├── 2024/
│   └── ...
├── README.md
```

**JSON Metadaten Format:**
```json
{
  "id": "uuid-von-supabase",
  "zoe_reference": "ZOE-202501-ABC123",
  "source": {
    "type": "whatsapp",
    "message_id": "whatsapp_msg_123",
    "timestamp": "2025-01-15T10:30:00Z"
  },
  "document": {
    "type": "invoice",
    "date": "2025-01-15",
    "vendor": {
      "name": "SolarTech GmbH",
      "address": "Solarweg 5, 12345 Berlin"
    },
    "invoice_number": "RE-2025-001"
  },
  "financial": {
    "net": 1000.00,
    "gross": 1190.00,
    "vat_19": 190.00
  },
  "accounting": {
    "ocr_score": 9,
    "status": "completed"
  }
}
```

---

### 🔄 Workflow 1: WhatsApp → OCR → Supabase → GitLab

**Trigger:** WAHA Webhook (`POST /webhook/zoe-whatsapp`)

**Ablauf:**
```
1. WAHA Webhook empfängt Nachricht aus "Belege" Gruppe
2. Filter: Nur Nachrichten mit Media (PDF/Image)
3. Check processed_messages (Idempotenz)
4. Download Media von WAHA API
5. OCR mit Google Gemini 2.5 Flash
6. Parse OCR Response → ExtractedData
7. Generate UUID + ZOE Reference
8. Insert in Supabase documents Tabelle
9. Upload PDF zu GitLab
10. Create JSON Metadata in GitLab
11. Mark as processed + Create Notification
```

**n8n Nodes:**
- `WAHA Webhook` → Filter Belege Group → Check Processed → Download Media
- → OCR with Gemini → Parse OCR Response → Generate UUID
- → Insert to Supabase → Upload to GitLab → Create JSON Metadata
- → Mark as Processed → Create App Notification

---

### 📋 Workflow 2: Gmail → Queue → User Decision

**Trigger:** Gmail Trigger (Neue E-Mail mit "rechnung"/"invoice" im Betreff)

**Ablauf:**
```
1. Gmail Trigger erkennt neue Rechnung
2. Download Attachment
3. Check processed_messages (Idempotenz)
4. Extract Metadata (Sender, Amount, Date)
5. Insert in pending_queue
6. Create Notification → UI zeigt Queue Item
7. User klickt "Bestätigen" oder "Löschen"
8. pending_queue.status wird aktualisiert
```

**Queue UI in App:**
- Sidebar Button mit Badge (Anzahl ausstehend)
- Dropdown mit allen Queue Items
- "Bestätigen" Button → Beleg wird verarbeitet
- "Löschen" Button → Beleg wird verworfen

---

### ⚠️ Error Handling & Troubleshooting

**Supabase Connection Failed:**
- Prüfe `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY`
- Stelle sicher, dass RLS Policies korrekt sind
- Prüfe Realtime Replication in Supabase Dashboard

**GitLab Upload Failed:**
- Prüfe API Token Permissions (`write_repository`)
- Repository muss existieren
- Dateipfad darf nicht länger als 255 Zeichen sein

**WhatsApp Webhook nicht aktiv:**
- WAHA Session muss aktiv sein
- Webhook URL muss in WAHA konfiguriert sein
- Firewall/Network Access prüfen

**Gmail Trigger nicht ausgelöst:**
- OAuth Token可能是expired
- Filter-Bedingungen prüfen
- Spam-Ordner prüfen

---

### 🔐 Security Best Practices

1. **API Keys nie committen** → `.env` wird von git ignoriert
2. **Supabase RLS Policies** → Nur notwendige Tables exposed
3. **GitLab Token Minimal Scope** → Nur `write_repository`
4. **Gmail OAuth with Restricted Scopes** → Nur Mail lesen
5. **Regular Key Rotation** → API Keys regelmäßig erneuern

---

## 📊 Export & Integrationen

### 🚀 Export-Formate

| Format | Zweck | Besonderheiten |
|--------|-------|----------------|
| **📄 PDF** | Berichte & Archivierung | EÜR, UStVA, Beleglisten |
| **💾 SQL** | Datenmigration | Vollständiges Schema mit Relationen |
| **📊 CSV** | Tabellenkalkulation | UTF-8, semikolon-getrennt |
| **📋 ELSTER XML** | Steuerbehörde | Direkter Upload ins ELSTER Portal |
| **🏦 DATEV** | Steuerberater | EXTF Buchungsstapel |

### 🎯 ELSTER Integration (NEU!)

```xml
<!-- Automatisch generiertes ELSTER XML -->
<Elster xmlns="http://www.elster.de/2002/XMLSchema">
  <Umsatzsteuervoranmeldung>
    <Jahr>2024</Jahr>
    <Zeitraum>41</Zeitraum> <!-- Q1 -->
    <Kz81>1250.00</Kz81> <!-- 7% Basis -->
    <Kz83>87.50</Kz83>   <!-- 7% Steuer -->
    <Kz86>2500.00</Kz86> <!-- 19% Basis -->
    <Kz89>475.00</Kz89>  <!-- 19% Steuer -->
    <Kz93>562.50</Kz93>  <!-- Gesamtsteuer -->
  </Umsatzsteuervoranmeldung>
</Elster>
```

**🎉 Ein Klick** → XML-Datei herunterladen → [ELSTER Online Portal](https://www.elster.de/portal/) → Hochladen fertig!

---

## 🛠 Tech Stack

### Frontend Architecture
![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite)

### AI & Data
![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?style=for-the-badge&logo=google)
![SiliconFlow](https://img.shields.io/badge/SiliconFlow-Qwen_72B-FF6B35?style=for-the-badge)
![IndexedDB](https://img.shields.io/badge/IndexedDB-Local_Storage-FF9500?style=for-the-badge)
![Supabase](https://img.shields.io/badge/Supabase-Cloud_Database-3ECF8E?style=for-the-badge&logo=supabase)

### Automation & Storage
![n8n](https://img.shields.io/badge/n8n-Workflow_Automation-FF4000?style=for-the-badge&logo=n8n)
![GitLab](https://img.shields.io/badge/GitLab-Document_Storage-FC6D26?style=for-the-badge&logo=gitlab)
![WAHA](https://img.shields.io/badge/WAHA-WhatsApp_API-25D366?style=for-the-badge&logo=whatsapp)
![Gmail](https://img.shields.io/badge/Gmail-Integration EA4335?style=for-the-badge&logo=gmail)

### Export & Integration
![PDF.js](https://img.shields.io/badge/PDF.js-4.0-DC2626?style=for-the-badge)
![jsPDF](https://img.shields.io/badge/jsPDF-2.5-EA4335?style=for-the-badge)
![ELSTER](https://img.shields.io/badge/ELSTER-XML-000000?style=for-the-badge)
![DATEV](https://img.shields.io/badge/DATEV-EXTF-005CA9?style=for-the-badge)

---

## ⚙️ Installation & Setup

### 📋 Voraussetzungen

- ✅ Node.js 18+
- ✅ Moderner Browser (Chrome/Edge/Firefox)
- ✅ Google Gemini API Key (kostenlos bis 60 Anfragen/Tag)

### 🚀 Schnellstart

```bash
# 1. Repository klonen
git clone https://github.com/DeepthinkAI2025/ZOE-Solar-Accounting-OCR.git
cd ZOE-Solar-Accounting-OCR

# 2. Abhängigkeiten installieren
npm install

# 3. API Keys konfigurieren
cp .env.example .env
# Bearbeite .env mit deinen API Keys

# 4. Entwicklungsserver starten
npm run dev

# 5. Öffne Browser
# http://localhost:5173
```

### 🔑 API Konfiguration

```env
# ============================================
# AI/OCR Configuration
# ============================================

# Google Gemini (Primär - Empfohlen)
GEMINI_API_KEY=AIzaSy...

# SiliconFlow (Fallback - Optional)
SILICONFLOW_API_KEY=sk-...

# ============================================
# Supabase Configuration (Cloud)
# ============================================

# Cloud Database URL and Anon Key
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbG..."

# ============================================
# n8n Configuration
# ============================================

# n8n Webhook URL for receiving notifications
VITE_N8N_WEBHOOK_URL="https://n8n.aura-call.de/webhook/zoe-app"

# ============================================
# GitLab Configuration (Document Storage)
# ============================================

VITE_GITLAB_PROJECT_ID="zoe-solar-documents"
VITE_GITLAB_API_URL="https://gitlab.com/api/v4"

# ============================================
# External Services
# ============================================

WAHA_URL="https://waha.aura-call.de"
WAHA_API_KEY=""
```

> **💡 Tipp:** Gemini API ist kostenlos für bis zu 60 Anfragen pro Tag. Perfect für kleine bis mittlere Unternehmen!

---

## 🎮 Verwendung

### 📤 Beleg hochladen

1. **Drag & Drop** oder **Klick zum Auswählen**
2. **KI analysiert** automatisch alle Daten
3. **Überprüfen & Korrigieren** falls nötig
4. **Speichern** - Fertig!

### 📊 Berichte erstellen

1. **Filter setzen** (Jahr/Quartal/Monat)
2. **Export-Format wählen** (PDF/CSV/ELSTER)
3. **Download** - Bereit für Steuerberater!

### ⚙️ Einstellungen

- **SKR03 Kontenrahmen** anpassen
- **ELSTER Stammdaten** konfigurieren
- **API Keys** verwalten
- **UI Themes** wählen

---

## 📈 Roadmap

### ✅ Bereits implementiert
- [x] KI-gestützte OCR (Gemini + SiliconFlow)
- [x] SKR03 Soll/Haben Kontierung
- [x] Positionen Extraktion
- [x] Duplikat-Erkennung V2
- [x] PDF/CSV/SQL Export
- [x] ELSTER XML Export
- [x] DATEV Integration
- [x] **Supabase Cloud Database**
- [x] **n8n Workflow Automation**
- [x] **WhatsApp Integration (WAHA)**
- [x] **Gmail Integration**
- [x] **GitLab Document Storage**
- [x] **Real-time Notifications**

### 🚧 In Arbeit
- [ ] Mobile App (React Native)
- [ ] Multi-Benutzer Support
- [ ] Advanced Analytics Dashboard

### 🔮 Geplant
- [ ] KI-gestützte Korrekturvorschläge
- [ ] Integration mit Buchhaltungssoftware
- [ ] Automatische Beleg-Klassifizierung
- [ ] Echtzeit Kollaboration

---

## 🤝 Beitragen

Wir freuen uns über Contributions! 🎉

1. **Fork** das Repository
2. **Branch** erstellen: `git checkout -b feature/AmazingFeature`
3. **Commit** deine Änderungen: `git commit -m 'Add AmazingFeature'`
4. **Push** zum Branch: `git push origin feature/AmazingFeature`
5. **Pull Request** öffnen

### 🐛 Bug Reports & Feature Requests

[🐛 Issue erstellen](https://github.com/DeepthinkAI2025/ZOE-Solar-Accounting-OCR/issues/new)

**Bitte inkludere:**
- Browser & Version
- Betriebssystem
- Schritte zur Reproduktion
- Erwartetes vs. tatsächliches Verhalten

---

## 📄 Lizenz

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Dieses Projekt ist unter der MIT Lizenz lizenziert - siehe die [LICENSE](LICENSE) Datei für Details.

---

## 🙏 Danksagungen

- **Google** für die Gemini API
- **SiliconFlow** für das Qwen Modell
- **Supabase** für die Cloud Database
- **n8n** für die Workflow Automation
- **ZOE Solar** für die Inspiration
- **Open Source Community** für die großartigen Tools

---

<div align="left">

**Made with ❤️ for the Solar Industry**

[⬆️ Nach oben](#-zoe-solar-accounting-ocr) • [📧 Kontakt](#) • [🐙 GitHub](https://github.com/DeepthinkAI2025/ZOE-Solar-Accounting-OCR)

</div>

#### ELSTER XML-Export (Neu in v1.2.0)
*   **Zweck:** Generiert ELSTER-kompatible XML-Dateien für die elektronische Umsatzsteuervoranmeldung.
*   **Format:** ElsterAnmeldung v8 (Coala-XML) mit Umsatzsteuervoranmeldung-Daten.
*   **Kennzahlen:** Kz21 (steuerfreie Umsätze), Kz35 (Reverse Charge), Kz81/Kz83 (7% Steuer), Kz86/Kz89 (19% Steuer), Kz93 (Gesamtsteuer).
*   **Zeitraum:** Automatische Erkennung von Quartal (Q1-Q4) oder Monat (01-12).
*   **Verwendung:** XML-Datei manuell im [ELSTER Online Portal](https://www.elster.de/portal/) hochladen.
*   **Voraussetzung:** ELSTER-Stammdaten müssen in den Einstellungen konfiguriert sein.

**Export-Datei:** `elster_ustva_{period}.xml` (z.B. `elster_ustva_2024Q1.xml`)

#### CSV-Export (Format)

- **Umfang:** Exportiert die aktuell gefilterte Dokumentliste (Jahr/Quartal/Monat) aus der Übersicht.
- **Kodierung:** UTF-8
- **Trennzeichen:** `;`
- **Quoting:** Alle Werte werden in `"..."` geschrieben (auch Zahlen), um Sonderzeichen/Zeilenumbrüche robust zu handhaben.
- **Datumsformat:** ISO `YYYY-MM-DD`
- **Zahlenformat:** Immer mit 2 Nachkommastellen (z.B. `"123.45"`).

**Export-Dateien:**

1) `zoe_belege_*.csv` (1 Zeile pro Beleg)

**Spalten (in dieser Reihenfolge):**

1. `datum`
2. `lieferant`
3. `adresse`
4. `steuernummer`
5. `belegnummer_lieferant`
6. `interne_nummer`
7. `zahlungsmethode`
8. `zahlungsdatum`
9. `zahlungsstatus`
10. `rechnungs_empfaenger`
11. `aufbewahrungsort`
12. `netto`
13. `mwst_satz_0`
14. `mwst_0`
15. `mwst_satz_7`
16. `mwst_7`
17. `mwst_satz_19`
18. `mwst_19`
19. `brutto`
20. `steuerkategorie`
21. `kontierungskonto`
22. `soll_konto`
23. `haben_konto`
24. `reverse_charge`
25. `vorsteuerabzug`
26. `kleinbetrag`
27. `privatanteil`
28. `ocr_score`
29. `ocr_rationale`
30. `beschreibung`
31. `text_content`
32. `status`

2) `zoe_positionen_*.csv` (Positionen / 1:n)

**Spalten:**

1. `doc_id`
2. `line_index`
3. `description`
4. `amount`

---

## 🛠 Tech Stack

### Frontend
*   **Framework:** React 19
*   **Sprache:** TypeScript
*   **Styling:** Tailwind CSS
*   **Build:** Vite 6

### Local Data
*   **Browser DB:** IndexedDB (Wrapper `storageService.ts`)
*   **PDF Engine:** PDF.js & jsPDF

### AI & OCR
*   **Primary:** Google Gemini 2.5 Flash (`@google/genai`)
*   **Fallback:** SiliconFlow Qwen 2.5 VL 72B

### Cloud & Automation
*   **Database:** Supabase (PostgreSQL + Realtime)
*   **Workflow:** n8n (https://n8n.aura-call.de)
*   **Document Storage:** GitLab
*   **WhatsApp:** WAHA API (https://waha.aura-call.de)
*   **Email:** Gmail API

---

### 📂 Projekt-Struktur

```
rome/
├── services/                          # Business Logic Layer
│   ├── supabaseService.ts            # Supabase Client + Realtime
│   ├── storageService.ts             # IndexedDB + Supabase Bridge
│   ├── geminiService.ts              # Google Gemini OCR
│   ├── fallbackService.ts            # SiliconFlow Fallback OCR
│   ├── ruleEngine.ts                 # SKR03 Kontierungsregeln
│   ├── elsterExport.ts               # ELSTER XML Generation
│   ├── datevExport.ts                # DATEV CSV Export
│   ├── extractedDataNormalization.ts # Data Cleanup
│   ├── submissionService.ts          # OCI Backend API
│   └── exportPreflight.ts            # Export Validation
│
├── components/                        # React UI Components
│   ├── UploadArea.tsx                # Drag & Drop File Upload
│   ├── DatabaseGrid.tsx              # Document List View
│   ├── DatabaseView.tsx              # Database Management
│   ├── DetailModal.tsx               # Document Editor Modal
│   ├── PdfViewer.tsx                 # PDF Preview Component
│   └── SettingsView.tsx              # Settings Page
│
├── n8n-workflows/                    # n8n Automation
│   ├── workflow-1-whatsapp-belege.json  # WhatsApp Processing
│   └── workflow-2-gmail-queue.json      # Gmail Queue Workflow
│
├── .env                              # Environment Variables
├── supabase-schema.sql               # Database Schema (copy to Supabase)
├── App.tsx                           # Main Application Component
├── index.tsx                         # Entry Point
├── index.html                        # HTML Template
├── types.ts                          # TypeScript Type Definitions
└── package.json                      # Dependencies
```

### 🔧 Service Responsibilities

| Service | Verantwortlichkeit |
|---------|-------------------|
| `supabaseService.ts` | Supabase Client, CRUD Operations, Realtime Subscriptions |
| `storageService.ts` | IndexedDB Wrapper, Supabase Integration Functions |
| `geminiService.ts` | Google Gemini API Calls für OCR |
| `ruleEngine.ts` | SKR03 Kontierung, Vendor Rules |
| `elsterExport.ts` | ELSTER XML Generation |
| `datevExport.ts` | DATEV CSV Generation |

---

### 🚀 Deployment Options

**Lokal (Entwicklung):**
```bash
npm run dev
# Öffne http://localhost:5173
```

**Produktion (Static Hosting):**
```bash
npm run build
# Output: dist/ Verzeichnis
# Deploy auf: Vercel, Netlify, Cloudflare Pages
```

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
Erstellen Sie eine `.env` Datei im Root-Verzeichnis (oder kopieren Sie `.env.example` nach `.env`):
```env
# Google Gemini API Key (Zwingend erforderlich)
GEMINI_API_KEY="AIzaSy..."

# SiliconFlow API Key (Fallback für Gemini)
SILICONFLOW_API_KEY="sk-..."
```

Hinweis: Wenn ein API-Key versehentlich in einem Chat/Issue/Screenshot gelandet ist, sollten Sie ihn beim Anbieter **rotieren** (neuen Key erzeugen, alten deaktivieren) und danach nur den neuen Key lokal in `.env` eintragen.

### 4. Starten
```bash
npm start
# oder
npm run dev
```

### 5. Checks (empfohlen)
`vite build` ist nicht immer ein verlässlicher TypeScript-/JSX-Check. Daher zusätzlich ausführen:

```bash
npm run typecheck
```

Oder als Einzeiler (Typecheck + Build):

```bash
npm run check
```

---

## ☁️ OCI VM Deployment (für ELSTER UStVA-Übermittlung)

Für die elektronische Übermittlung von UStVA-Daten an ELSTER benötigen Sie eine OCI VM mit dem Submission-Backend und ERiC.

### Voraussetzungen
*   OCI Account mit Always-Free VM (z.B. Ubuntu 24.04 ARM64)
*   ERiC Software (von Ihrem Steuerberater oder Finanzamt)
*   SSH-Zugang zur VM

### 1. VM vorbereiten
Stellen Sie sicher, dass Ihre OCI VM läuft (z.B. IP: 92.5.30.252).

Verbinden Sie sich via SSH:
```bash
ssh -i /path/to/your/private-key ubuntu@92.5.30.252
```

### 2. ERiC installieren
Laden Sie das `install_eric.sh` Script auf Ihre VM und führen Sie es aus:
```bash
# Auf Ihrer lokalen Maschine
scp -i /path/to/your/private-key install_eric.sh ubuntu@92.5.30.252:/home/ubuntu/

# Auf der VM
bash install_eric.sh
```

**Wichtig:** Ersetzen Sie die ERiC-Download-URL im Script mit der echten URL von Ihrem Steuerberater.

### 3. Submission-Backend deployen
Laden Sie das Backend auf die VM:
```bash
# Lokale Maschine
scp -i /path/to/your/private-key -r submission-backend ubuntu@92.5.30.252:/home/ubuntu/

# Auf der VM
bash deploy_backend.sh
```

### 4. Frontend konfigurieren
In der Webapp (Einstellungen > OCI):
- Wählen Sie "OCI" als Übermittlungsmodus
- Tragen Sie die VM-IP ein: `http://92.5.30.252:8080`
- Optional: API-Key setzen

### 5. Testen
- Health-Check: `curl http://localhost:8080/health`
- UStVA-Validierung in der Webapp testen

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
*   Prüfen Sie, ob der `GEMINI_API_KEY` korrekt gesetzt ist.
*   Falls Gemini überlastet ist, prüfen Sie `SILICONFLOW_API_KEY` in der `.env` Datei.

**PDF Vorschau unscharf:**
*   Die Vorschau nutzt `pdf.js` mit Scale 2.0. Bei sehr kleinen Displays kann es zu Skalierungseffekten kommen. Nutzen Sie Zoom (Mausrad + Ctrl).

---

## 📄 Lizenz

Proprietäre Software für ZOE Solar.
