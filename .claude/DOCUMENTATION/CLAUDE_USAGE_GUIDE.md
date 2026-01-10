# 🤖 CLAUDE CODE - NUTZUNGSANLEITUNG
**Wie du Claude Code mit deiner globalen Infrastruktur nutzt**

---

## 🎯 GRUNDPRINZIP

**Claude Code hat immer Zugriff auf:**
1. Deine globalen Secrets in `~/.claude/GLOBAL_INFRASTRUCTURE.md`
2. Deine VM1 (130.162.235.142)
3. Deine Supabase-Instanz (https://supabase.aura-call.de)

**Für JEDES neue Projekt:**
- Claude weiß automatisch von VM1 und Supabase
- Keine Konfiguration nötig
- Einfach loslegen!

---

## 💬 BEFEHLE FÜR CLAUDE

### 1. Supabase Connection prüfen
```
"Prüfe die Supabase Verbindung"
"Check if Supabase is reachable"
"Teste Supabase connection"
```

Claude führt aus:
- `curl -I https://supabase.aura-call.de`
- Testet DNS resolution
- Gibt Status zurück

### 2. VM Status prüfen
```
"Prüfe VM1 Status"
"Check if VM1 is running"
"Zeige Docker Container auf VM1"
```

Claude führt aus:
```bash
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "docker ps"
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "free -h"
```

### 3. Supabase Services neu starten
```
"Restart Supabase on VM1"
"Neustart von Supabase"
"Supabase ist down, hilfe!"
```

Claude führt aus:
```bash
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "cd ~/ngze-tech.stack && docker compose restart supabase"
```

### 4. Logs anzeigen
```
"Zeige Supabase logs"
"Letzte 50 Zeilen von n8n logs"
"Logs von VM1"
```

Claude führt aus:
```bash
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "docker logs <container> --tail 50"
```

### 5. SSH Befehle ausführen
```
"SSH zu VM1 und zeige free -h"
"Führe auf VM1 aus: df -h"
"Check disk space on VM1"
```

Claude führt aus:
```bash
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "<dein-befehl>"
```

### 6. Supabase Datenbank abfragen
```
"Zeige alle Dokumente in Supabase"
"Query belege table"
"Check Supabase settings"
```

Claude nutzt:
- Supabase JS Client
- Deine globalen Credentials
- Gibt Ergebnisse zurück

### 7. Umgebungsvariablen erstellen
```
"Erstelle .env file für dieses Projekt"
"Setup environment variables"
```

Claude erstellt:
```bash
# .env
VITE_SUPABASE_URL=https://supabase.aura-call.de
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GEMINI_API_KEY=AIzaSyBaH6sO1vVs14N1tZinSBG3QFtynF6OUWk
```

### 8. Fehler beheben
```
"ERR_CONNECTION_REFUSED - was tun?"
"Supabase connection failed"
"VM1 nicht erreichbar"
```

Claude führt aus:
- Prüft VM Status
- Testet Supabase
- Gibt Lösungen basierend auf `GLOBAL_INFRASTRUCTURE.md`

---

## 📋 TYPISCHE WORKFLOWS

### Neues Projekt starten
```
User: "Neues Projekt: Rechnungs-Scanner. Hilf mir."
Claude:
1. Erstellt .env mit globalen Secrets
2. Erklärt Supabase Nutzung
3. Zeigt SSH Befehle für VM1
4. Hilft bei Docker Setup
```

### Supabase Problem
```
User: "Supabase gibt 500 error"
Claude:
1. Checkt https://supabase.aura-call.de
2. SSH zu VM1: docker logs
3. Restartet Supabase wenn nötig
4. Gibt Lösung
```

### VM Debugging
```
User: "VM1 ist langsam"
Claude:
1. SSH: free -h, df -h, docker ps
2. Zeigt Ressourcen-Usage
3. Empfiehlt Cleanup
```

### Datenbank Zugriff
```
User: "Zeige meine Dokumente"
Claude:
1. Nutzt Supabase Client
2. Query: SELECT * FROM belege
3. Zeigt Ergebnisse
```

---

## 🔧 CLAUDE KANN AUTOMATISCH

✅ **SSH-Verbindungen** zu VM1 herstellen
✅ **Docker-Befehle** auf VM1 ausführen
✅ **Supabase-Queries** durchführen
✅ **Umgebungsvariablen** lesen aus `~/.claude/`
✅ **Logs** von VM1 abrufen
✅ **Services** neu starten
✅ **DNS** und Connectivity prüfen
✅ **Backups** erstellen und wiederherstellen

---

## 🚨 WICHTIGE REGELN

### Was Claude automatisch weiß:
- VM1 IP: 130.162.235.142
- SSH Key: ~/.ssh/aura-call-vm-key
- Supabase URL: https://supabase.aura-call.de
- Alle Secrets aus `~/.claude/GLOBAL_INFRASTRUCTURE.md`

### Was du NICHT sagen musst:
- ❌ "Verwende IP 130.162.235.142"
- ❌ "SSH Key ist ~/.ssh/aura-call-vm-key"
- ❌ "Supabase URL ist https://supabase.aura-call.de"

**Claude weiß das alles automatisch!**

### Was du SAGEN solltest:
- ✅ "Prüfe VM1"
- ✅ "Restart Supabase"
- ✅ "Zeige Logs"
- ✅ "Query belege table"
- ✅ "SSH zu VM1 und führe aus: docker ps"

---

## 🎓 BEISPIEL-SESSION

```
User: Ich habe ein Problem mit Supabase in meinem neuen Projekt

Claude: Ich prüfe das sofort für dich.

[Prüft Supabase Connection]
✅ Supabase ist erreichbar: https://supabase.aura-call.de

[Prüft VM1 Status]
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "docker ps"

Name                Status
supabase-rest       Up 2 hours
supabase-studio     Up 2 hours
n8n                 Up 2 hours

[Ergebnis]
Supabase läuft auf VM1. Alle Services aktiv.
Was genau ist das Problem?
```

---

## ⚡ QUICK COMMANDS

### Für Claude immer verfügbar:

| Befehl | Was passiert |
|--------|--------------|
| `ssh vm1` | Verbindung zu VM1 |
| `docker ps` | Alle Container auf VM1 |
| `curl -I supabase.aura-call.de` | Supabase Status |
| `node check-supabase-connection.js` | Detail-Test |

---

## 📚 WO FINDE ICH WAS?

### Globale Config
```
~/.claude/GLOBAL_INFRASTRUCTURE.md
  ├── VM1 Details
  ├── Supabase Secrets
  ├── SSH Commands
  └── Troubleshooting
```

### Projekt-spezifisch
```
/projekt/.claude/
  ├── PROJECT_KNOWLEDGE.md (Projekt-Info)
  └── SSH_REFERENCE.md (SSH Commands)
```

### SSH Keys
```
~/.ssh/
  ├── aura-call-vm-key (✅ FÜR VM1)
  ├── zoe_vm_key
  └── ...
```

---

## 🎯 CLAUDE VERHALTEN

### Was Claude automatisch macht:
1. Liest `~/.claude/GLOBAL_INFRASTRUCTURE.md` bei jedem Start
2. Weiß VM1 IP und SSH Key
3. Kennt alle Supabase Credentials
4. Kann sofort SSH und Docker Befehle ausführen

### Was du tun musst:
1. Nichts! 😊
2. Sag einfach was du willst
3. Claude weiß Bescheid

---

## 🚨 EMERGENCY - WAS WENN...

### VM1 ist down?
```
User: "VM1 antwortet nicht!"
Claude:
1. Prüft OCI Console Status
2. Checkt SSH Verbindung
3. Empfiehlt Soft Reset
4. Zeigt Backup Optionen
```

### Supabase ist down?
```
User: "Supabase connection failed"
Claude:
1. Testet https://supabase.aura-call.de
2. SSH zu VM1: docker logs
3. Restartet wenn nötig
4. Gibt Lösung
```

### Neue Secrets?
```
User: "Neuer API Key für Projekt X"
Claude:
1. Fügt zu ~/.claude/GLOBAL_INFRASTRUCTURE.md hinzu
2. Erklärt wie er verwendet wird
3. Zeigt Beispiel
```

---

## ✅ CHECKLISTE - VOR PROJEKT-START

Bevor du ein neues Projekt startest:

- [ ] SSH Key hat richtige Rechte: `chmod 600 ~/.ssh/aura-call-vm-key`
- [ ] VM1 ist erreichbar: `ssh oci-vm1 "echo OK"`
- [ ] Supabase läuft: `curl -I https://supabase.aura-call.de`
- [ ] .env file erstellt mit globalen Secrets

---

## 🤖 SKYVERN MCP - BROWSER AUTOMATION

### Was ist Skyvern?
Skyvern ist ein MCP-Server für browserbasierte Automatisierung, der natürliche Sprache in Web-Aktionen übersetzt.

### Verfügbare Tools

**1. skyvern_create_task** - Browser-Automatisierung starten
```
"Use Skyvern to scrape product prices from https://example.com"
"Extract contact information from company website"
```

**2. skyvern_get_task** - Task-Status prüfen
```
"Check status of task sk_abc123"
"Show me results from task sk_xyz789"
```

**3. skyvern_list_tasks** - Tasks auflisten
```
"List recent Skyvern tasks"
"Show last 5 tasks"
```

**4. skyvern_cancel_task** - Task abbrechen
```
"Cancel task sk_abc123"
"Stop running Skyvern task"
```

### Skyvern MCP Server Status
- **Server Location**: `/Users/jeremy/conductor/repos/magicrebuild/skyvern-mcp-server/`
- **API Endpoint**: `http://130.162.235.142:8000` (VM1)
- **Authentication**: X-API-Key header
- **Status**: ✅ Installed, requires network access to VM1

### Skyvern API Key
```
SKYVERN_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJvXzQ3NTgwMzYwOTkzNzQ0MDE3MiIsImV4cCI6MjA4MTgyNjQzNX0.VygIWXgxFuykAQ7t9LI4MH9qHyYhnQUCq6SKUQn3Kk
```

### Troubleshooting Skyvern
- **Network Error**: Ensure VPN/SSH tunnel to VM1 (130.162.235.142)
- **Auth Error**: Verify API key format and permissions
- **Task Failed**: Check website accessibility and automation restrictions

### Common Use Cases
- **Web Scraping**: Extract data from websites
- **Form Filling**: Automated form submission
- **Data Extraction**: Get structured data from pages
- **Navigation**: Browse and interact with web apps

---

## 📞 SUPPORT

Wenn etwas nicht funktioniert:

1. **SSH Problem?**
   ```
   User: "SSH funktioniert nicht"
   Claude: Prüft Key-Rechte und Verbindung
   ```

2. **Supabase Problem?**
   ```
   User: "Supabase Error"
   Claude: Testet Connection und zeigt Logs
   ```

3. **VM Problem?**
   ```
   User: "VM1 ist langsam"
   Claude: Zeigt Ressourcen und empfiehlt Actions
   ```

---

**Version:** 1.0
**Status:** ✅ Fertig konfiguriert
**Nutzung:** Für ALLE Projekte mit Claude Code

---

## 🎉 ZUSAMMENFASSUNG

**Was du wissen musst:**
1. VM1 ist immer `130.162.235.142`
2. Supabase ist immer `https://supabase.aura-call.de`
3. Alle Secrets sind in `~/.claude/GLOBAL_INFRASTRUCTURE.md`
4. Claude weiß alles automatisch

**Was du sagst:**
- Einfach, was du willst
- Keine technischen Details nötig

**Was passiert:**
- Claude macht alles automatisch
- Nutzt globale Config
- Löst Probleme selbstständig

**Fertig! 🚀**
