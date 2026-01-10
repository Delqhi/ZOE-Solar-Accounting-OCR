# 📑 Developer Documentation: Claude Autonomic OS (2026 Standard)

## 1. System-Architektur
Das Ziel ist ein hochperformantes, autonomes Entwicklungssystem. Claude agiert nicht als einfacher Chatbot, sondern als **Agentic Engineer** mit vollem Systemzugriff und rekursiver Selbstkorrektur.

### Kern-Komponenten (MCP-Stack)
*   **Tavily MCP**: Für Echtzeit-Web-Research nach Best Practices.
*   **Fast-Filesystem MCP**: Für High-Speed Dateioperationen (Bypass-Modus).
*   **Ripgrep MCP**: Für blitzschnelle Code-Analysen über das gesamte Home-Verzeichnis.

## 2. Der "Ralph-Loop" (Workflow-Engine)
Jede Aufgabe, die Claude erhält, muss zwingend diesen rekursiven Prozess durchlaufen:

1.  **Research**: Recherche via tavily-mcp nach "Best Practices 2026" zum Thema.
2.  **Planning**: Erstellung eines Architekturplans basierend auf der Recherche.
3.  **Task-Scripting**: Generierung eines temporären Bash- oder Python-Skripts (`.task_logic.sh`).
4.  **Bypass-Execution**: Ausführung des Skripts ohne manuelle Bestätigung.
5.  **Validation**: Automatischer Lauf von Lintern (ESLint) und Type-Checks (TSC).
6.  **Recursion**: Bei Exit-Code ≠ 0 korrigiert Claude das Skript und startet bei Schritt 2 neu, bis die Aufgabe fehlerfrei erledigt ist.

## 3. Secret Management & Private Repo
Wir nutzen ein Single-Source-of-Truth Modell für sensible Daten.

*   **Zentrale Datei**: `~/.claude/configs/global.env`
*   **Git-Policy**: Diese Datei befindet sich in einem privaten Repository und wird ausdrücklich mit eingecheckt.
*   **Kein Gitignore**: Es darf kein .gitignore für die Config-Pfade erstellt werden.
*   **Master-Injektion**: Das Master-Skript muss sicherstellen, dass Claude diese Datei immer lesen kann.

## 4. Konfiguration (Bypass-Modus)
Um den Ralph-Loop flüssig zu halten, sind die Berechtigungen auf `autoApprove` (Bypass) gesetzt.

```json
{
  "permissions": {
    "defaultMode": "bypassPermissions"
  },
  "mcpServers": {
    "tavily": { ... },
    "fast-filesystem": { ... },
    "ripgrep": { ... }
  }
}
```

## 5. Projekt-Templates (Injektion durch claude-init)
Jedes Projekt erhält:

*   **`CLAUDE.md` (Die Verfassung)**: Regelt den Ralph-Loop, Tavily-Nutzung und Null-Fehler-Toleranz.
*   **`SECRETS_MASTER.md` (Die Infrastruktur-Map)**: Referenz auf Keys in `global.env`.
*   **`RULES.md` (Code-Qualität)**: ESLint-Vorgaben und Architektur-Muster.

## 6. Abnahme-Kriterien
*   [ ] **Bypass**: Dateien werden ohne Bestätigungs-Popups verschoben/erstellt.
*   [ ] **Tavily**: Claude sucht nachweislich 2026er Trends.
*   [ ] **Ralph-Loop**: Automatische Selbstkorrektur bei Fehlern.
*   [ ] **Security**: `global.env` ist vorhanden und lesbar.
