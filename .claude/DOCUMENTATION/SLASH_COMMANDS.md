# 🎯 CLAUDE SLASH COMMANDS - QUICK REFERENCE

**Version:** 2.3 | **Status:** Production Ready | **Last Updated:** 2026-01-06

---

## 🚀 Overview

Slash commands provide instant access to common workflows without typing full instructions.

---

## 🛠️ CONFIGURATION COMMANDS

### `/start` - **Global Configuration Sync** ⭐ NEW

**Purpose:** Synchronizes global Claude configurations to project directories

**Usage:**
```bash
/start
```

**What it does:**
- ✅ Syncs global configs from `~/.claude/` to project `.claude/`
- ✅ Updates executor scripts (auto-swarm, master-loop, etc.)
- ✅ Creates automatic backups before overwriting
- ✅ Preserves project-specific files
- ✅ Creates config notice documentation

**Files synced:**
- `GLOBAL_INFRASTRUCTURE.md` - All secrets & infrastructure
- `QUICK_REFERENCE.md` - Command reference
- `CLAUDE_USAGE_GUIDE.md` - Usage instructions
- `MASTER_DEVELOPER_LOOP.md` - Complete workflow docs
- `HYBRID_APPROACH_COMPLETE.md` - Vision gate docs
- All executor scripts

**Files preserved:**
- `PROJECT_KNOWLEDGE.md`
- `CONDUCTOR_WORKFLOW.json`
- `RESEARCH_LOG.md`
- `ERROR_SOLUTIONS.md`
- `TASK_QUEUE.yaml`
- `VISION_STATE.md`
- `handover-log.md`
- `rules.md`

**When to use:**
- After updating global configurations
- When project falls behind on workflow improvements
- Before starting new development tasks
- Regularly (weekly) to stay current

---

## 🤖 WORKFLOW COMMANDS

### `/swarm` - **Auto-Swarm Executor**

**Purpose:** Parallel agent execution for coding tasks

**Usage:**
```bash
/swarm "Implement user authentication"
/swarm "Fix Supabase connection errors"
/swarm "Add dark mode toggle"
```

**What it does:**
- Auto-detects coding tasks
- Runs Claude + Gemini CLI + Conductor in parallel
- Performs visual analysis (Chrome DevTools + Skyvern+Qwen)
- Deploys to Vercel
- Updates knowledge base

**Execution flow:**
```
Task → Auto-Detect → Parallel Agents → Visual Gate → Deploy → Complete
```

**Best for:**
- New feature implementation
- Bug fixes
- UI/UX updates
- Integration tasks

---

### `/master-loop` - **8-Phase Autonomous Workflow**

**Purpose:** Complete development lifecycle automation

**Usage:**
```bash
/master-loop "Build user dashboard with charts"
/master-loop "Create API endpoint for data export"
/master-loop "Fix security vulnerability in auth"
```

**What it does:**
1. **Analysis** - Research & context gathering
2. **Planning** - Task breakdown & track creation
3. **Implementation** - Code generation (with Big Pickle fallback)
4. **Testing** - 80%+ coverage with auto-generation
5. **Checkpoint Gate** - AI/Human review
6. **Deployment** - Vercel deployment
7. **Monitoring** - Skyvern automation
8. **Visual Analysis** - Chrome DevTools + Skyvern+Qwen

**Best for:**
- Complex multi-phase tasks
- Security-critical features
- Full feature implementations
- Critical bug fixes

---

### `/vision` - **Visual Quality Gate Only**

**Purpose:** Check UI/UX quality of deployment

**Usage:**
```bash
/vision https://your-app.vercel.app
/vision https://your-app.vercel.app --fix
```

**What it does:**
- Takes screenshots (Chrome DevTools + Skyvern)
- Analyzes with Qwen AI vision
- Scores: Layout, Responsive, Colors, Typography, Interactions
- Auto-fixes if score < 8.5
- Re-deploys and re-checks

**Best for:**
- After deployment verification
- UI/UX quality assurance
- Visual regression detection

---

## 🔐 MANAGEMENT COMMANDS

### `/secrets` - **Secret Synchronization**

**Purpose:** Sync secrets across Vercel + Supabase

**Usage:**
```bash
/secrets
```

**What it does:**
- Reads secrets from `~/.claude/GLOBAL_INFRASTRUCTURE.md`
- Syncs to Vercel (all environments)
- Syncs to Supabase credentials table
- Validates sync status
- Creates audit log

**Triple Sync:**
```
~/.claude/GLOBAL_INFRASTRUCTURE.md
    ↓ (sync)
Vercel Environments (Production/Preview/Development)
    ↓ (sync)
Supabase app_secrets table
```

---

### `/status` - **Workflow Status Check**

**Purpose:** Check current workflow progress

**Usage:**
```bash
/status
```

**What it does:**
- Lists active tracks
- Shows checkpoint status
- Displays latest monitoring report
- Shows knowledge base updates
- Reports any errors

---

## 📊 QUICK REFERENCE TABLE

| Command | Purpose | Speed | Complexity |
|---------|---------|-------|------------|
| `/start` | Sync global configs | ⚡ Instant | Low |
| `/swarm` | Parallel execution | ⚡ Fast | Medium |
| `/master-loop` | Full lifecycle | ⏱️ Complete | High |
| `/vision` | Visual check | ⚡ Fast | Low |
| `/secrets` | Secret sync | ⚡ Fast | Medium |
| `/status` | Status check | ⚡ Instant | Low |

---

## 🎯 USAGE EXAMPLES

### Example 1: New Feature Development
```bash
# 1. Sync configs
/start

# 2. Start development
/master-loop "Build user authentication with OAuth"
```

### Example 2: Bug Fix
```bash
# 1. Quick fix with swarm
/swarm "Fix Supabase connection timeout"

# 2. Verify visual quality
/vision https://zoe-solar-accounting-ocr.vercel.app --fix
```

### Example 3: UI/UX Update
```bash
# 1. Sync latest configs
/start

# 2. Implement changes
/swarm "Add dark mode with smooth transitions"

# 3. Check visual quality
/vision https://zoe-solar-accounting-ocr.vercel.app --fix
```

### Example 4: Security Task
```bash
# 1. Use full workflow for safety
/master-loop "Implement JWT token refresh with security best practices"

# 2. Sync secrets
/secrets
```

---

## 🔧 INTEGRATION WITH CLAUDE CODE

To enable slash commands in Claude Code, add to your settings:

```json
{
  "slashCommands": {
    "start": {
      "description": "Sync global Claude configurations to project",
      "script": "node .claude/config-sync.js"
    },
    "swarm": {
      "description": "Run parallel agent swarm execution",
      "script": "node .claude/auto-swarm-executor.js"
    },
    "master-loop": {
      "description": "Run 8-phase autonomous workflow",
      "script": "node .claude/master-loop-executor.js"
    },
    "vision": {
      "description": "Run visual quality gate",
      "script": "node .claude/vision-workflow.js"
    },
    "secrets": {
      "description": "Sync secrets to Vercel + Supabase",
      "script": "node .claude/secret-sync.js"
    },
    "status": {
      "description": "Check workflow status",
      "script": "node .claude/status-check.js"
    }
  }
}
```

---

## 📂 FILE LOCATIONS

### Global Directory (Source of Truth)
```
~/.claude/
├── GLOBAL_INFRASTRUCTURE.md      # All secrets & configs
├── QUICK_REFERENCE.md            # This file
├── CLAUDE_USAGE_GUIDE.md         # How to use Claude
├── MASTER_DEVELOPER_LOOP.md      # Complete architecture
├── HYBRID_APPROACH_COMPLETE.md   # Vision gate docs
├── auto-swarm-executor.js        # Parallel executor
├── master-loop-executor.js       # 8-phase workflow
├── vision-workflow.js            # Visual analysis
├── config-sync.js                # /start command
└── PROJECTS/                     # Per-project configs
    └── zoe-solar-accounting-ocr/
        └── PROJECT_KNOWLEDGE.md
```

### Project Directory (Auto-synced)
```
.your-project/
└── .claude/
    ├── GLOBAL_CONFIG_NOTICE.md   # Sync instructions
    ├── GLOBAL_INFRASTRUCTURE.md  # From ~/.claude/
    ├── QUICK_REFERENCE.md        # From ~/.claude/
    ├── auto-swarm-executor.js    # From ~/.claude/
    ├── master-loop-executor.js   # From ~/.claude/
    ├── vision-workflow.js        # From ~/.claude/
    ├── PROJECT_KNOWLEDGE.md      # Project-specific
    ├── CONDUCTOR_WORKFLOW.json   # Project-specific
    └── ... (other project files)
```

---

## 🎓 BEST PRACTICES

### 1. Always Sync First
```bash
/start  # Before any major task
```

### 2. Choose Right Tool
- **Quick tasks** → `/swarm`
- **Complex tasks** → `/master-loop`
- **Visual checks** → `/vision`
- **Security** → `/master-loop`

### 3. Verify After Deploy
```bash
/vision https://your-app.vercel.app --fix
```

### 4. Keep Secrets Synced
```bash
/secrets  # After adding new API keys
```

### 5. Check Status Regularly
```bash
/status  # See what's running
```

---

## ⚡ TROUBLESHOOTING

### Command not found
```bash
# Make scripts executable
chmod +x .claude/*.js

# Or use node directly
node .claude/config-sync.js
```

### Global directory missing
```bash
mkdir -p ~/.claude
# Then run /start
```

### Permission errors
```bash
# Check ownership
ls -la ~/.claude/
# Fix if needed
sudo chown -R $USER ~/.claude/
```

---

## 📈 SUCCESS METRICS

| Metric | Target | How to Check |
|--------|--------|--------------|
| Config Sync Success | 100% | `/status` |
| Vision Score | ≥ 8.5/10 | `/vision` |
| Auto-Fix Rate | > 80% | Knowledge Base |
| Deployment Success | > 98% | `/status` |

---

## 🚀 QUICK START

```bash
# 1. Initial setup (one time)
mkdir -p ~/.claude
# Add your secrets to ~/.claude/GLOBAL_INFRASTRUCTURE.md

# 2. Sync to project
/start

# 3. Run your first task
/master-loop "Build a user dashboard"
```

---

**Version:** 2.3
**Status:** ✅ Production Ready
**Last Updated:** 2026-01-06

**"One command to rule them all"** 🎯
