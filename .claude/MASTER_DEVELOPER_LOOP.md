# 🚀 CLAUDE MASTER DEVELOPER LOOP - ARCHITEKTUR & IMPLEMENTATION

**Version:** 1.0 | **Status:** Production Ready | **Last Updated:** 2026-01-06

---

## 🎯 ZIELSETZUNG

Ein **vollautonomer Entwicklungskreislauf**, der:
- ✅ Jede Aufgabe von Analyse bis Deployment durchläuft
- ✅ State-of-the-Art Recherche & Best Practices automatisiert
- ✅ Multi-Agent-Parallelisierung für maximale Effizienz
- ✅ Selbstheilung bei Fehlern durch Retry-Loops
- ✅ Persistente Dokumentation & Knowledge Management

---

## 🏗️ SYSTEMARCHITEKTUR

### 2.1 Kernkomponenten

```
┌─────────────────────────────────────────────────────────────┐
│                    CLAUDE MASTER CONTROLLER                  │
│  (Zentrale Steuerung, Koordination, Validierung)            │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│ RESEARCH    │    │ CODE         │    │ TEST &      │
│ AGENT       │    │ AGENT        │    │ VALIDATE    │
│ (Serena)    │    │ (Claude)     │    │ AGENT       │
└─────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        └─────────┬─────────┴─────────┬─────────┘
                  ▼                   ▼
        ┌──────────────────┐   ┌─────────────────┐
        │  DEPLOY AGENT    │   │  MONITOR AGENT  │
        │  (Vercel/Git)    │   │  (Skyvern)      │
        └──────────────────┘   └─────────────────┘
                  │                   │
                  └─────────┬─────────┘
                            ▼
                  ┌─────────────────┐
                  │  KNOWLEDGE BASE │
                  │  (.claude/*)    │
                  └─────────────────┘
```

---

## 🔄 PROZESSFLUSS - DER RALPH-LOOP

### Phase 1: ANALYSE & RECHERCHE (Serena MCP)

```yaml
# Trigger: User-Aufgabe oder Fehler-Event
# Output: research_report.md + architecture_proposal.md

steps:
  1. Context-Analyse:
     - Lese alle relevanten Dateien (.claude/, src/, docs/)
     - Identifiziere Tech-Stack, Probleme, Requirements

  2. State-of-the-Art Recherche:
     - GitHub API: Neueste Framework-Versionen, Security-Patches
     - Google Search: Best Practices 2026, Alternativen
     - Stack Overflow/Reddit: Known Issues & Workarounds

  3. Architecture Proposal:
     - Tech-Stack-Empfehlung (mit Begründung)
     - Security-Checklist (OWASP Top 10 2026)
     - Performance-Optimierungen
     - Cost-Estimation (Vercel, Supabase, etc.)

  4. Dokumentation:
     - Update: .claude/PROJECT_KNOWLEDGE.md
     - Update: .claude/RESEARCH_LOG.md
```

### Phase 2: PLANUNG & TASK-BREAKDOWN (Claude Main)

```yaml
# Input: research_report.md
# Output: task_queue.yaml + implementation_plan.md

task_breakdown:
  - Haupttask: "Fix Supabase Connection Errors"
  - Subtasks:
    - id: 1
      name: "Enhanced Error Handling"
      agent: "code_agent"
      files: ["src/services/supabaseClient.ts", "src/services/monitoringService.tsx"]
      tests: ["connection.test.ts", "error_handling.test.ts"]

    - id: 2
      name: "Diagnostics & Health Check"
      agent: "code_agent"
      files: ["check-supabase-connection.js", "SUPABASE_TROUBLESHOOTING.md"]

    - id: 3
      name: "Global Infrastructure Setup"
      agent: "code_agent"
      files: ["~/.claude/GLOBAL_INFRASTRUCTURE.md", "~/.claude/QUICK_REFERENCE.md"]

    - id: 4
      name: "Test & Validate"
      agent: "test_agent"
      tests: ["npm run test", "npm run build", "vercel deploy --prod"]

    - id: 5
      name: "Monitor Deployment"
      agent: "monitor_agent"
      action: "skyvern_automation"
```

### Phase 3: IMPLEMENTATION (Code Agent)

```yaml
# Input: task_queue.yaml
# Output: Code + Tests + Documentation

workflow:
  1. Code Writing:
     - Lint & Type-Safe (TypeScript strict mode)
     - Error Handling (try/catch mit monitoringService)
     - Tests (Jest/Vitest) parallel schreiben

  2. Self-Review:
     - ESLint: `npm run lint`
     - Typecheck: `npm run typecheck`
     - Security Scan: `npm audit`

  3. Auto-Commit:
     - Git: `git add -A && git commit -m "feat: ..."`
     - Pre-Commit Hooks: Husky

  4. Dokumentation:
     - JSDoc comments
     - README updates
     - .claude/PROJECT_KNOWLEDGE.md
```

### Phase 4: TESTING & VALIDATION (Test Agent)

```yaml
# Input: Implementierter Code
# Output: Test-Reports + Go/No-Go

tests:
  unit:
    - Supabase connection tests
    - Error handling tests
    - Type validation tests

  integration:
    - API endpoint tests
    - Database connectivity
    - Environment variable validation

  e2e:
    - User flow tests (Playwright/Cypress)
    - Deployment validation
    - Performance benchmarks

  security:
    - Secret scanning (git-secrets)
    - Dependency vulnerability scan
    - CORS & CSP validation
```

### Phase 5: DEPLOYMENT (Deploy Agent)

```yaml
# Input: Validated Code
# Output: Live Deployment + Monitoring

deployment_flow:
  1. Git Operations:
     - `git checkout main`
     - `git pull origin main`
     - `git merge feature-branch --no-ff`
     - `git push origin main`

  2. Vercel Deployment:
     - `vercel --prod --yes`
     - Wait for build completion
     - Verify deployment URL

  3. Post-Deploy Checks:
     - Health check: `curl -I https://deployment-url.vercel.app`
     - Error log monitoring
     - Performance metrics

  4. Rollback Plan:
     - Auto-rollback on failure
     - Previous deployment: `vercel --prod --target production`
```

### Phase 6: MONITORING & FEEDBACK (Skyvern MCP)

```yaml
# Input: Live Deployment
# Output: Monitoring Report + Error Analysis

monitoring:
  browser_automation:
    - Skyvern öffnet Vercel Logs
    - Skyvern screenshot: Error Console
    - Skyvern loggt: Performance Metrics

  error_detection:
    - Console Errors: "ERR_CONNECTION_REFUSED", "TypeError"
    - Network Errors: 404, 500, CORS
    - User Flow Errors: Form validation, Auth

  feedback_loop:
    - Wenn Fehler → Rückkehr zu Phase 1 (Analyse)
    - Wenn erfolgreich → Dokumentation & Archivierung
    - Knowledge Update: .claude/ERROR_SOLUTIONS.md
```

---

## 🛠️ TECHNISCHE IMPLEMENTATION

### 3.1 Global Infrastructure (`.claude/`)

```
~/.claude/
├── GLOBAL_INFRASTRUCTURE.md      # VM1, Supabase, API Keys (alle Projekte)
├── CLAUDE_USAGE_GUIDE.md         # Wie nutze ich Claude mit Infrastruktur
├── QUICK_REFERENCE.md            # Schnell-Übersicht
├── MASTER_DEVELOPER_LOOP.md      # Dieses Dokument
├── PROJECT_KNOWLEDGE.md          # Projekt-spezifisches Wissen
├── RESEARCH_LOG.md               # Recherche-Ergebnisse & Quellen
├── ERROR_SOLUTIONS.md            # Bekannte Fehler & Fixes
└── TASK_QUEUE.yaml               # Aktuelle Task-Queue
```

### 3.2 MCP Server Integration

```json
{
  "mcpServers": {
    "serena": {
      "command": "npx",
      "args": ["-y", "@anthropics/serena-mcp"],
      "description": "Code Analysis & Architecture"
    },
    "skyvern": {
      "command": "python",
      "args": ["-m", "skyvern.mcp.server"],
      "description": "Browser Automation & Monitoring"
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@anthropics/context7-mcp"],
      "description": "Documentation & Examples"
    }
  }
}
```

### 3.3 n8n Workflow (YAML)

```yaml
# n8n Workflow: Master Developer Loop
# File: ~/.claude/n8n-workflow-master-loop.yaml

workflow:
  name: "Claude Master Developer Loop"
  trigger: "Webhook / Claude Command"

  nodes:
    - id: analyze
      type: "function"
      name: "Analyze Task"
      code: |
        const task = items[0].json.task;
        const research = await callMCP('serena', 'analyze', task);
        return [{json: {research, task}}];

    - id: research
      type: "http_request"
      name: "Research State-of-the-Art"
      url: "https://api.github.com/search/repositories"
      method: "GET"
      params:
        q: "supabase connection error 2026"
        sort: "updated"

    - id: plan
      type: "function"
      name: "Create Task Queue"
      code: |
        const plan = await generatePlan(items[0].json);
        await updateClaudeFile('.claude/TASK_QUEUE.yaml', plan);
        return [{json: {plan}}];

    - id: code
      type: "subworkflow"
      name: "Code Agent Loop"
      workflowId: "code-agent-workflow"

    - id: test
      type: "exec"
      name: "Run Tests"
      command: "cd /path/to/project && npm run test"

    - id: deploy
      type: "exec"
      name: "Deploy to Vercel"
      command: "cd /path/to/project && vercel --prod --yes"

    - id: monitor
      type: "function"
      name: "Skyvern Monitor"
      code: |
        const skyvern = await callMCP('skyvern', 'monitor', {
          url: deploymentUrl,
          actions: ['open_logs', 'screenshot', 'check_errors']
        });
        return [{json: {monitoring: skyvern}}];

    - id: feedback
      type: "if"
      name: "Error Detection"
      condition: "monitoring.errors.length > 0"
      true: "Return to Analyze",
      false: "Complete & Document"
```

### 3.4 Skyvern Browser Automation (Python)

```python
# File: ~/.claude/skyvern_monitor.py

from skyvern import Skyvern
import asyncio

async def monitor_deployment(deployment_url: str):
    skyvern = Skyvern()

    # 1. Open Vercel Dashboard
    await skyvern.navigate("https://vercel.com")
    await skyvern.login()  # Auto-login with stored credentials

    # 2. Go to Project Logs
    await skyvern.click(f"a[href*='{deployment_url}']")
    await skyvern.click("button:contains('Logs')")

    # 3. Capture Errors
    errors = await skyvern.extract_text(".log-error, .console-error")

    # 4. Screenshot
    screenshot = await skyvern.screenshot()

    # 5. Analyze & Report
    report = {
        "errors": errors,
        "screenshot": screenshot,
        "timestamp": datetime.now().isoformat()
    }

    # 6. Save to .claude/
    with open(".claude/MONITORING_REPORT.md", "w") as f:
        f.write(f"# Monitoring Report\n\n{report}")

    return report

# Usage: python skyvern_monitor.py --url https://zoe-solar-accounting-ocr.vercel.app
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Schritt 1: Setup (5 Minuten)

```bash
# 1.1 Install MCP Servers
npm install -g @anthropics/serena-mcp
npm install -g @anthropics/context7-mcp
pip install skyvern

# 1.2 Configure Claude Settings
mkdir -p ~/.claude
cat > ~/.claude/settings.json << 'EOF'
{
  "mcpServers": {
    "serena": {"command": "npx", "args": ["-y", "@anthropics/serena-mcp"]},
    "skyvern": {"command": "python", "args": ["-m", "skyvern.mcp.server"]},
    "context7": {"command": "npx", "args": ["-y", "@anthropics/context7-mcp"]}
  },
  "enabledPlugins": {
    "feature-dev@claude-code-plugins": true,
    "ralph-wiggum@claude-code-plugins": true
  }
}
EOF

# 1.3 Create Global Infrastructure
cat > ~/.claude/MASTER_DEVELOPER_LOOP.md << 'EOF'
[Content from this file]
EOF
```

### Schritt 2: Projekt-Integration (2 Minuten)

```bash
# In jedem neuen Projekt:
mkdir -p .claude
cat > .claude/PROJECT_KNOWLEDGE.md << 'EOF'
# Project: ZOE Solar Accounting OCR
- Tech: Vite + TypeScript + Supabase
- VM: 130.162.235.142
- Supabase: https://supabase.aura-call.de
- Deployment: Vercel
EOF
```

### Schritt 3: Erste Ausführung

```bash
# Sage einfach:
"Starte Master Developer Loop für: [Aufgabe]"

# Oder:
"Fixe Supabase Connection mit Master Loop"
```

---

## 🎯 BEISPIEL: FEHLERBEHEBUNG MIT DEM LOOP

### User-Input:
```
"Supabase gibt ERR_CONNECTION_REFUSED. Fixe das!"
```

### Automatischer Loop:

1. **Serena analysiert:**
   - Liest `src/services/supabaseClient.ts`
   - Findet: Kein Timeout, keine CORS-Config
   - Recherchiert: Supabase Self-Hosting Best Practices 2026

2. **Claude plant:**
   - Task 1: Add 15s timeout
   - Task 2: Add CORS headers
   - Task 3: Create health check endpoint
   - Task 4: Add diagnostic script

3. **Code Agent implementiert:**
   ```typescript
   // src/services/supabaseClient.ts
   const fetchWrapper = async (url, options) => {
     const controller = new AbortController();
     setTimeout(() => controller.abort(), 15000);
     return fetch(url, { ...options, signal: controller.signal, mode: 'cors' });
   };
   ```

4. **Test Agent validiert:**
   - `npm run build` ✅
   - `npm run test` ✅
   - `curl -I https://supabase.aura-call.de` ✅

5. **Deploy Agent released:**
   - `git commit -m "fix: Supabase connection with timeout & CORS"`
   - `git push origin main`
   - `vercel --prod`

6. **Skyvern monitor:**
   - Öffnet Vercel Logs
   - Screenshot: "No errors"
   - Report: "Deployment successful"

7. **Dokumentation:**
   - `.claude/ERROR_SOLUTIONS.md` aktualisiert
   - `SUPABASE_TROUBLESHOOTING.md` erstellt

---

## 📊 MONITORING & METRICS

### Key Performance Indicators (KPIs)

| Metric | Ziel | Messung |
|--------|------|---------|
| **Task Completion Rate** | > 95% | Erfolgreiche Deployments / Gesamt-Tasks |
| **Error Detection Time** | < 5min | Skyvern Monitoring |
| **Auto-Fix Rate** | > 80% | Erfolgreiche Retry-Loops |
| **Deployment Success** | > 98% | Vercel Build Success |
| **Documentation Coverage** | 100% | Alle Tasks dokumentiert |

### Alerting (n8n + Slack)

```yaml
# Bei Fehlern:
- Wenn Build failt → Slack Notification + Auto-Rollback
- Wenn Supabase down → SSH zu VM1 + Restart
- Wenn Performance drop → Alert + Scaling Check
```

---

## 🔐 SECURITY & BEST PRACTICES

### 1. Secrets Management
- ✅ Alle Secrets in `~/.claude/GLOBAL_INFRASTRUCTURE.md`
- ✅ Niemals in Git committen
- ✅ Environment Variables via Vercel Dashboard
- ✅ Regular Rotation (alle 90 Tage)

### 2. Code Quality
- ✅ TypeScript strict mode
- ✅ ESLint + Prettier
- ✅ 100% Test Coverage für Core-Services
- ✅ Security Scanning (npm audit, Snyk)

### 3. Deployment Safety
- ✅ Auto-Rollback bei Fehlern
- ✅ Blue-Green Deployment (Vercel)
- ✅ Canary Releases für große Changes
- ✅ Backup vor jedem Deploy (VM Snapshot)

---

## 🚀 QUICK REFERENCE

### Starte den Loop:

```bash
# Manuel:
"Start Master Developer Loop für: [Aufgabe]"

# Oder:
"Fixe [Fehler] mit Ralph-Loop"

# Oder:
"Recherchiere [Tech] und erstelle Plan"
```

### Check Status:

```bash
# Aktuelle Tasks:
cat ~/.claude/TASK_QUEUE.yaml

# Letztes Monitoring:
cat ~/.claude/MONITORING_REPORT.md

# Known Issues:
cat ~/.claude/ERROR_SOLUTIONS.md
```

### Force Deploy:

```bash
cd /path/to/project
git add -A && git commit -m "hotfix: [message]"
git push origin main
vercel --prod --yes
```

---

## 📚 REFERENZEN & RESSOURCEN

### Dokumente
- `~/.claude/GLOBAL_INFRASTRUCTURE.md` - Alle Secrets & Configs
- `~/.claude/QUICK_REFERENCE.md` - Schnell-Übersicht
- `~/.claude/CLAUDE_USAGE_GUIDE.md` - Wie mit Claude arbeiten
- `~/.claude/PROJECT_KNOWLEDGE.md` - Projekt-Info
- `~/.claude/RESEARCH_LOG.md` - Recherche-Historie
- `~/.claude/ERROR_SOLUTIONS.md` - Known Issues & Fixes

### Tools
- **Serena MCP**: Code Analysis & Architecture
- **Skyvern**: Browser Automation & Monitoring
- **Context7**: Documentation & Examples
- **n8n**: Workflow Automation
- **Vercel**: Deployment & Hosting
- **Supabase**: Database & Auth

### Commands
```bash
# Check everything
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "docker ps"
curl -I https://supabase.aura-call.de
npm run build && npm run test

# Deploy
git push origin main && vercel --prod

# Monitor
python ~/.claude/skyvern_monitor.py --url https://zoe-solar-accounting-ocr.vercel.app
```

---

## ✅ SUCCESS CRITERIA

Der Master Developer Loop ist erfolgreich, wenn:

- [ ] Alle Tasks automatisch von Analyse bis Deployment durchlaufen
- [ ] Fehler werden innerhalb von 5 Minuten erkannt und gefixt
- [ ] Dokumentation ist immer aktuell
- [ ] Kein manuelles Eingreifen nötig (außer bei kritischen Entscheidungen)
- [ ] 95%+ aller Deployments erfolgreich ohne manuellen Fix

---

**Version:** 1.0
**Status:** ✅ Production Ready
**Next:** Aktiviere MCP Server und starte ersten Loop!

**"Sag einfach: 'Start Master Developer Loop für: [Deine Aufgabe]'"** 🚀
