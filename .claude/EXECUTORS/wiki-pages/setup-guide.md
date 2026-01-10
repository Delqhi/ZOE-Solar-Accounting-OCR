# Setup Guide - Multi-Framework System

## 🎯 Quick Start

### 1. Installation
```bash
# Clone your repository
git clone <your-repo>
cd <project>

# Run master start script
node ~/.claude/EXECUTORS/master-start-script.js
```

### 2. Configuration Check
```bash
# Verify all modules
node ~/.claude/EXECUTORS/setup-orchestrator.js status

# Run specific module
node ~/.claude/EXECUTORS/setup-orchestrator.js selective setup-designOS.js
```

### 3. Start Working
```bash
# Choose your workflow style:
npx claude
# Then say: "Baue Login System" (Amp Style)
# Or: "Master Loop für: Auth" (Devin Style)
# Or: "Entwickle Dashboard mit Agent-Loop" (Manus Style)
```

## 📋 Prerequisites

### Required
- Node.js 18+
- Git
- Claude Code CLI
- Active internet connection

### Optional (Recommended)
- TMUX for parallel execution
- VS Code for IDE integration
- GitHub account for wiki access

## 🔧 Module Installation Order

The system installs modules in this priority order:

### Priority 10 (Critical - First)
1. **setup-core.js** - Base infrastructure
2. **setup-secrets.js** - API key management
3. **setup-verification.js** - Complete validation

### Priority 9 (High - Second)
4. **setup-serena.js** - File manipulation MCP
5. **setup-integrations.js** - Plugins & agents
6. **setup-orchestrator.js** - Workflow management

### Priority 8 (Medium - Third)
7. **setup-health.js** - System checks
8. **setup-automation.js** - Auto-execution
9. **setup-designOS.js** - Design system
10. **setup-bmad.js** - Business method

### Priority 7 (Low - Fourth)
11. **setup-refactoring.js** - Code quality
12. **setup-final-checks.js** - Pre-flight

## 🚀 First-Time Setup

### Step 1: Global Configuration
```bash
# This creates all necessary directories and configs
node ~/.claude/EXECUTORS/master-start-script.js
```

**What happens:**
- Creates `~/.claude/EXECUTORS/` with all modules
- Creates `~/.claude/CONFIGS/` with templates
- Creates `~/.claude/PLUGINS/` with integrations
- Creates `~/.claude/DOCUMENTATION/` with guides
- Installs MCP servers (Serena, Tavily, Context7, etc.)
- Configures auto-activation triggers
- Runs health checks

### Step 2: Project Initialization
```bash
# In your project directory
node ~/.claude/EXECUTORS/init-project.js
```

**What happens:**
- LSP-based code exploration
- Creates `PROJECT/.claude/AGENTS.md` (Cursor pattern)
- Creates `PROJECT/.claude/todo.md` (Manus pattern)
- Creates `PROJECT/.claude/PROJECT_KNOWLEDGE.md`
- Generates environment verification

### Step 3: Verify Installation
```bash
# Check all systems
node ~/.claude/EXECUTORS/setup-orchestrator.js status

# Expected output:
# ✅ All 12 modules available
# ✅ All frameworks integrated
# ✅ Auto-activation configured
```

## 🔐 API Configuration

### Required API Keys
The system needs these API keys in `~/.claude/settings.local.json`:

```json
{
  "env": {
    "ANTHROPIC_API_KEY": "your-xiaomi-api-key",
    "TAVILY_API_KEY": "your-tavily-key",
    "YOUTUBE_API_KEY": "your-youtube-key"
  }
}
```

### Getting API Keys

#### 1. Xiaomi API (Claude Alternative)
- Visit: https://api.xiaomimimo.com
- Register account
- Generate API key
- Add to settings.local.json

#### 2. Tavily API (Web Search)
- Visit: https://tavily.com
- Free tier: 1000 searches/month
- Add to settings.local.json

#### 3. YouTube API (Optional)
- Visit: https://console.cloud.google.com
- Enable YouTube Data API v3
- Generate API key
- Add to settings.local.json

## 🎨 Framework-Specific Setup

### designOS Framework
**Purpose:** Design system with tokens and components

**Auto-activation triggers:**
- "designOS"
- "design system"
- "design tokens"
- "theme"
- "component library"

**Manual activation:**
```bash
node ~/.claude/EXECUTORS/setup-designOS.js
```

**What it creates:**
- `~/.claude/designOS.json` - Configuration
- `~/.claude/DESIGNOS_GUIDE.md` - Style guide
- `~/.claude/PLUGINS/designOS/components.js` - Component library
- `~/.claude/PLUGINS/designOS/activation.js` - Auto-detection

### BMAD Framework
**Purpose:** Business-Method-Architecture-Deploy workflow

**Auto-activation triggers:**
- "bmad"
- "business analysis"
- "technical specification"
- "architecture design"
- "brd" / "tsd"

**Manual activation:**
```bash
node ~/.claude/EXECUTORS/setup-bmad.js
```

**What it creates:**
- `~/.claude/BMAD_METHOD.md` - Complete framework
- `~/.claude/PLUGINS/bmad/executors.js` - Phase executors
- `~/.claude/PLUGINS/bmad/templates.js` - Workflow templates
- `~/.claude/PLUGINS/bmad/activation.js` - Auto-detection

### Ralph-Loop Framework
**Purpose:** Uncensored code generation with Big Pickle fallback

**Auto-activation triggers:**
- Censorship detection (automatic)
- "uncensored"
- "handover"
- "big pickle"

**What it does:**
- Detects Claude censorship
- Auto-hands over to Big Pickle model
- Logs in `~/.claude/handover-log.md`
- Continues workflow seamlessly

## 🎯 Daily Workflow Examples

### Example 1: Quick Feature (Amp Style)
```bash
# User input: "Baue Login Page"
# → Auto-detects: Amp Style
# → 4-line output concision
# → Oracle pattern for complexity
# → Todo.md tracking
# → Auto-deploys

# Result: Login page in minutes
```

### Example 2: Complex System (Devin Style)
```bash
# User input: "Master Loop für: Auth-System"
# → Auto-detects: Devin Style
# → LSP-based exploration
# → Deep planning mode
# → Never touches tests
# → Full implementation

# Result: Complete auth system with tests
```

### Example 3: Agent Loop (Manus Style)
```bash
# User input: "Entwickle Dashboard mit Agent-Loop"
# → Auto-detects: Manus Style
# → Event-driven execution
# → Todo.md updates
# → Knowledge module persistence
# → Parallel agents

# Result: Dashboard with full tracking
```

### Example 4: Pattern Fix (Cursor Style)
```bash
# User input: "Fix @components/ Pattern-Fehler"
# → Auto-detects: Cursor Style
# → AGENTS.md context
# → Pattern matching
# → Local fixes
# → LSP verification

# Result: Fixed components with best practices
```

### Example 5: Research (PhD-Level)
```bash
# User input: "Research AI agent architecture 2026"
# → Auto-detects: Research Mode
# → 5 parallel search agents
# → Hypothesis-driven
# → 3-phase verification
# → Confidence scoring

# Result: Comprehensive research report
```

## 🔍 Troubleshooting

### Problem: "Module not found"
**Solution:**
```bash
# Check module status
node ~/.claude/EXECUTORS/setup-orchestrator.js status

# Reinstall specific module
node ~/.claude/EXECUTORS/setup-orchestrator.js selective setup-designOS.js
```

### Problem: "MCP server timeout"
**Solution:**
```bash
# Check MCP config
cat ~/.claude/.mcp.json

# Restart Claude Code
# Try again
```

### Problem: "Auto-activation not working"
**Solution:**
```bash
# Check activation triggers
cat ~/.claude/PLUGINS/designOS/activation.js
cat ~/.claude/PLUGINS/bmad/activation.js

# Verify settings
cat ~/.claude/settings.local.json
```

### Problem: "Token limit errors"
**Solution:**
```bash
# Check settings
cat ~/.claude/settings.local.json

# Should NOT contain:
# "CLAUDE_CODE_MAX_OUTPUT_TOKENS"

# If present, remove it
```

### Problem: "Ralph-Loop not triggering"
**Solution:**
```bash
# Check handover log
cat ~/.claude/handover-log.md

# Test with: "Test censorship handover"
# Should auto-switch to Big Pickle
```

## 📊 Verification Checklist

After setup, verify:

- [ ] All 12 modules exist in `~/.claude/EXECUTORS/`
- [ ] designOS files in `~/.claude/PLUGINS/designOS/`
- [ ] BMAD files in `~/.claude/PLUGINS/bmad/`
- [ ] Settings in `~/.claude/settings.local.json`
- [ ] MCP config in `~/.claude/.mcp.json`
- [ ] Documentation in `~/.claude/DOCUMENTATION/`
- [ ] Auto-activation works (test with "designOS")
- [ ] Ralph-Loop ready (test with "uncensored")
- [ ] All frameworks integrated

## 🎓 Next Steps

Once setup is complete:

1. **Read the main README**: `README_2026_BEST_PRACTICES.md`
2. **Explore frameworks**: Try each style once
3. **Check wiki**: `GITHUB_WIKI_HOME.md`
4. **Start building**: Use any workflow style
5. **Monitor**: Check `~/.claude/handover-log.md` for Ralph-Loop activity

## 💡 Pro Tips

### Speed Optimization
- Use `/sisyphus` for parallel execution
- Use `/amp` for quick tasks
- Use `/devin` for complex planning

### Quality Assurance
- Always check vision scores in `~/.claude/VISION_STATE.md`
- Review handover logs for censorship events
- Update `~/.claude/todo.md` regularly

### Best Practices
- Never edit `PROJECT/.claude/` files directly (auto-synced)
- Use `~/.claude/rules.md` for project-specific rules
- Keep API keys in `~/.claude/DOCUMENTATION/GLOBAL_INFRASTRUCTURE.md`

---

**Version:** 1.0  
**Last Updated:** 2026-01-08  
**Status:** ✅ Production Ready

Need more help? See: [Framework Comparison](framework-comparison.md) | [Architecture](architecture.md) | [Troubleshooting](troubleshooting.md)