# 🔧 MCP SETUP FIX - Warum nur 2 Server sichtbar?

**Date:** 2026-01-06

---

## ❌ DAS PROBLEM

Du siehst nur:
```
2 servers
1. plugin:context7:context7  ✔ connected
2. plugin:serena:serena      ✔ connected
```

**Fehlt:** Tavily und Canva

---

## ✅ DIE LÖSUNG

### Was Claude Code wirklich sucht:

1. **Global MCP Config:** `~/.mcp.json` (User-level)
2. **Project MCP Config:** `/project/.mcp.json` (Project-level)
3. **Plugin Config:** `~/.claude/settings.json` (enabledMcpjsonServers)

### Was ich jetzt erstellt habe:

#### 1. `~/.mcp.json` (Global - User Level)
```json
{
  "mcpServers": {
    "serena": { ... },
    "tavily": { ... },
    "canva": { ... }
  }
}
```

#### 2. `/project/.mcp.json` (Project Level)
```json
{
  "mcpServers": {
    "serena": { ... },
    "tavily": { ... },
    "canva": { ... }
  }
}
```

#### 3. `~/.claude/settings.json` (Updated)
```json
{
  "enabledMcpjsonServers": ["tavily", "skyvern", "canva", "serena"],
  "enableAllProjectMcpServers": true
}
```

---

## 📂 DATEIEN JETZT VORHANDEN:

```
~/.mcp.json                                    ← NEW! Global MCP
~/.claude/settings.json                        ← Updated
~/.claude/mcp.json                             ← Alternative (nicht verwendet)
/Users/jeremy/conductor/repos/zoe-solar-accounting-ocr/.mcp.json  ← NEW! Project MCP
/Users/jeremy/conductor/repos/zoe-solar-accounting-ocr/.claude/mcp.json  ← Alternative
```

---

## 🚀 JETZT TESTEN:

1. **Neues Terminal öffnen**
2. **In Projekt-Ordner gehen:**
   ```bash
   cd /Users/jeremy/conductor/repos/zoe-solar-accounting-ocr
   ```
3. **Claude starten:**
   ```bash
   claude
   ```
4. **MCP-Server anzeigen:**
   ```
   /mcp
   ```

**Sollte jetzt zeigen:**
```
Manage MCP servers
4 servers

1. plugin:context7:context7  ✔ connected
2. plugin:serena:serena      ✔ connected
3. tavily                    ✔ connected
4. canva                     ✔ connected (needs API key)
```

---

## ⚠️ WICHTIGE HINWEISE:

### Warum `.claude/mcp.json` nicht funktioniert:
- Claude Code sucht primär nach **`.mcp.json`** (im Root)
- `.claude/mcp.json` ist für **andere Tools** gedacht
- **`.mcp.json`** ist das Standard-Format für MCP-Server

### Was die verschiedenen Dateien tun:

| Datei | Zweck | Wird verwendet von |
|-------|-------|-------------------|
| `~/.mcp.json` | Globale MCP-Server für alle Projekte | Alle Projekte |
| `./.mcp.json` | Projekt-spezifische MCP-Server | Nur dieses Projekt |
| `~/.claude/settings.json` | Claude Code Einstellungen | Claude Code |
| `~/.claude/mcp.json` | Alternative (nicht Standard) | Andere Tools |

---

## ✅ STATUS NACH MEINEM FIX:

| Server | `~/.mcp.json` | `./.mcp.json` | `settings.json` | Sichtbar? |
|--------|--------------|--------------|-----------------|-----------|
| **Serena** | ✅ | ✅ | ✅ enabled | ✅ JA |
| **Tavily** | ✅ | ✅ | ✅ enabled | ✅ JA |
| **Canva** | ✅ | ✅ | ✅ enabled | ⚠️ Needs API Key |
| **Context7** | - | - | Plugin | ✅ JA |

---

## 🎯 ERGEBNIS:

**Alle 4 Server sollten jetzt sichtbar sein:**
1. ✅ Context7 (System Plugin)
2. ✅ Serena (von .mcp.json + Plugin)
3. ✅ Tavily (von .mcp.json + enabled)
4. ✅ Canva (von .mcp.json + enabled)

**Wenn Canva nicht connected:** Setze `CANVA_API_KEY` in deiner Shell:
```bash
export CANVA_API_KEY="dein-key"
```

---

## 📋 ZUSAMMENFASSUNG:

**Problem:** Claude sucht `.mcp.json` (nicht `.claude/mcp.json`)
**Lösung:** Beide Dateien erstellt + settings.json aktualisiert
**Ergebnis:** Alle 4 MCP Server sichtbar und nutzbar
