# Verwendung

## Beleg-Upload

1. **Drag & Drop** oder **Klick zum Auswählen**
2. Unterstützte Formate: PDF, JPG, PNG, WebP
3. KI analysiert automatisch alle Daten
4. Überprüfen und korrigieren falls nötig
5. Speichern in Supabase

## Kontierung

### Automatische Zuweisung

- **SKR03-Konten** werden automatisch zugewiesen
- **Steuerkategorie** (19%, 7%, etc.) wird erkannt
- **Vendor Rules** werden für zukünftige Belege gemerkt

### Steuerkategorien

| Kategorie | USt-Satz | Vorsteuer |
|-----------|----------|-----------|
| 19% Vorsteuer | 19% | Ja |
| 7% Vorsteuer | 7% | Ja |
| 0% PV (Steuerfrei) | 0% | Ja |
| 0% IGL / Reverse Charge | 0% | Nein |
| Steuerfrei (Kleinunternehmer) | 0% | Nein |
| Keine Vorsteuer (Privatanteil) | 0% | Nein |

## Qualitätssicherung

### Duplikat-Erkennung

- **Hard Match:** Belegnummer + Betrag identisch
- **Fuzzy Match:** Ähnlichkeitsalgorithmus
- **Hash Check:** Identische Dateien

### Private Documents

Private Belege werden automatisch erkannt und separiert.

## Export

Siehe [Export-Formate](Export-Formate)
