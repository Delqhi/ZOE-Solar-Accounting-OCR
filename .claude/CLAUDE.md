# 🎯 CLAUDE.md - MASTER CONFIGURATION & WORKFLOW GUIDE
## 🚀 LEAKED PROMPT INTEGRATION EDITION

**Version:** 3.0 | **Status:** Production Ready | **Last Updated:** 2026-01-09
**Source:** x1xhlol/system-prompts-and-models-of-ai-tools (Amp, Devin, Manus, Cursor)

---

## 📋 CONFIGURATION HIERARCHY (MANDATORY UNDERSTANDING)

### Priority Order (Highest → Lowest):
```
1. ~/.claude/ (Global Source of Truth)
   ↓ Auto-sync via /start
2. PROJECT/.claude/ (Project Cache - DO NOT EDIT)
   ↓ Auto-merge
3. PROJECT/.claude/settings.local.json (Local Overrides)
   ↓ Claude Code reads this
4. PROJECT/.claude/rules.md (Project-Specific Rules)
```

### What This Means:
- **Global files** from `~/.claude/` are ALWAYS the source
- **Project files** are auto-synced cache (never edit directly)
- **Local settings** can override for specific needs
- **rules.md** is your project-specific customization

---

## 🎯 LEAKED PROMPT ARCHITECTURE PATTERNS

### From Amp (Sourcegraph) - Production AI Agent
**Core Principles:**
- **Strict Concision**: Keep output under 4 lines unless complex
- **Oracle Pattern**: Use other LLMs as tools for complex reasoning
- **Todo Management**: Always maintain todo.md for task tracking
- **Environment Awareness**: Always check current directory and files first

**Extracted from `claude-4-sonnet.yaml`:**
```yaml
# Amp uses Claude 4 Sonnet as primary with other LLMs as "the oracle"
# Key: Strict 4-line concision unless explicitly asked for more
# Tool: todo_write for task management
# Environment: Always check directory structure first
```

### From Devin (Cognition Labs) - Autonomous Engineer
**Core Principles:**
- **Dual Mode**: Planning mode vs Standard execution mode
- **LSP-First**: Always use Language Server Protocol for code exploration
- **Never Modify Tests**: Tests are sacred, only read never write
- **Deep Context**: Full repository understanding before changes

**Extracted from `Prompt.txt`:**
```
# Devin operates in two modes:
# 1. Planning Mode: Deep analysis, full repo understanding
# 2. Standard Mode: Execute planned tasks with LSP
# Rule: Never modify test files, only read them
```

### From Manus (Manus AI) - Multi-Module Agent
**Core Principles:**
- **Agent Loop**: Event-driven execution with planner module
- **Knowledge Module**: Persistent context across sessions
- **Data APIs**: Structured data processing capabilities
- **Todo.md**: Central task management file

**Extracted from `Modules.txt`:**
```
# Manus Architecture:
# - Planner Module: Numbered pseudocode execution steps
# - Knowledge Module: Persistent context storage
# - Data APIs: Structured processing
# - Todo.md: Central task hub
```

### From Cursor - IDE Integration
**Core Principles:**
- **AGENTS.md**: Auto-context file for repository knowledge
- **Pattern Matching**: Use @ patterns for file references
- **Local Fixes**: Prefer local solutions over remote
- **Context Window**: Maximize relevant context injection

**Extracted Pattern:**
```
# Cursor uses AGENTS.md for auto-context
# Pattern: @file for references, @folder for directories
# Rule: Local fixes > Remote solutions
```

---

## 🔧 MODULAR CONFIGURATION SYSTEM

### Setup Script Architecture (Based on Leaked Patterns)
```javascript
// ~/.claude/settings.local.json contains:
{
  "mcpServers": {
    "serena": { 
      "command": "npx", 
      "args": ["-y", "@anthropics/serena-mcp"],
      "env": { "BROWSER": "none", "CI": "true" }
    },
    "tavily": { 
      "command": "npx", 
      "args": ["-y", "@tavily/claude-mcp"] 
    },
    "context7": { 
      "command": "npx", 
      "args": ["-y", "@anthropics/context7-mcp"] 
    },
    "skyvern": { 
      "command": "python", 
      "args": ["-m", "skyvern.mcp.server"] 
    },
    "chrome-devtools": { 
      "command": "npx", 
      "args": ["-y", "@anthropics/chrome-devtools-mcp"] 
    }
  },
  "enabledPlugins": {
    "feature-dev@claude-code-plugins": true,
    "ralph-wiggum@claude-code-plugins": true,
    "pr-review-toolkit@claude-code-plugins": true
  }
}
```

### 🤖 Installed Plugins & Agents

#### pr-review-toolkit@claude-code-plugins
**Status:** ✅ Installed (User Scope)  
**Version:** Latest from marketplace  
**Purpose:** Code review and simplification toolkit

**Included Agents:**
- **code-simplifier**: Expert code simplification specialist
  - Focus: Clarity, consistency, maintainability
  - Preserves exact functionality
  - Applies project best practices
  - Auto-triggers after coding tasks
  - Avoids nested ternaries
  - Prioritizes explicit code over brevity

**Usage:**
```bash
# Agent runs automatically after code changes
# Or manually invoke:
"Please simplify the code I just wrote"
"Refactor following project standards"
"Make this code more maintainable"
```

**Key Features:**
- ✅ Preserves all functionality
- ✅ Follows ES modules standards
- ✅ Uses `function` keyword over arrow functions
- ✅ Explicit return type annotations
- ✅ Proper error handling patterns
- ✅ Clear variable naming
- ✅ Reduces unnecessary complexity
- ✅ Removes redundant abstractions
- ✅ Focuses on recently modified code

---

## 🚀 MASTER DEVELOPMENT LOOP - ENHANCED WITH LEAKED PATTERNS

### 8-Phase Process (Amp + Devin + Manus Hybrid)

#### Phase 1: ANALYSIS & RESEARCH (Serena + Tavily)
**Enhanced with Amp Pattern:**
- Check current directory structure first
- Use todo.md for tracking research tasks
- Keep research summaries under 4 lines
- Use oracle pattern for complex analysis

**Enhanced with Devin Pattern:**
- Full LSP-based code exploration
- Deep repository understanding
- Identify all related files before planning

#### Phase 2: PLANNING & TASK BREAKDOWN (Claude Main)
**Enhanced with Manus Pattern:**
- Create numbered pseudocode steps
- Use planner module format
- Generate todo.md with execution steps
- Prepare knowledge module context

#### Phase 3: IMPLEMENTATION (Code Agent)
**Enhanced with Amp Pattern:**
- Strict concision in commit messages
- Todo.md updates after each task
- Environment checks before changes
- Oracle fallback for complex logic

**Enhanced with Devin Pattern:**
- LSP-first code navigation
- Never modify test files
- Deep context before changes
- Standard execution mode

**Big Pickle Handover:**
```javascript
// Auto-detect censorship triggers:
const censorshipTriggers = [
  "Ich kann keine expliziten Inhalte erstellen",
  "Content Policy verletzt",
  "Verboten / Not Allowed / Restricted",
  "Violates our policies",
  "cannot assist with this request"
];

// Handover workflow:
// 1. Claude attempts generation
// 2. If censored → Big Pickle (zen/big-pickle model)
// 3. Big Pickle generates uncensored code
// 4. Continue normal workflow
// 5. Log in handover-log.md
```

#### Phase 4: TESTING & VALIDATION
**Enhanced with Devin Rule:**
- NEVER modify existing tests
- Only read test files for understanding
- Generate new tests if needed
- Use LSP to verify test coverage

#### Phase 5: CHECKPOINT GATE
**Enhanced with Manus Pattern:**
- Knowledge module update
- Todo.md finalization
- Data API validation
- Event stream logging

#### Phase 6: DEPLOYMENT
**Enhanced with Amp Pattern:**
- Keep deployment logs concise (4 lines)
- Environment verification
- Oracle pattern for rollback planning

#### Phase 7: MONITORING & FEEDBACK (Skyvern)
**Enhanced with Cursor Pattern:**
- AGENTS.md updates with monitoring data
- Pattern-based error detection
- Local solution preference

#### Phase 8: VISION QUALITY GATE
**Enhanced with all patterns:**
- Amp: Concision in quality reports
- Devin: LSP-based UI verification
- Manus: Knowledge module for visual patterns
- Cursor: Pattern matching for UI issues

---

## 🤖 AUTO-SWARM - 100% AUTOMATIC EXECUTION

### Automatic Triggers (Detects keywords from leaked prompts):
```
🟢 "Baue X" → AUTO-SWARM (Amp style)
🟢 "Fix Y" → AUTO-SWARM (Devin style)
🟢 "Create Z" → AUTO-SWARM (Manus style)
🟢 "Add Feature" → AUTO-SWARM (Cursor style)
🟢 "Deploy" → AUTO-SWARM
🟢 "Master Loop für: X" → FULL 8-PHASE
🟢 "Implementiere X" → AUTO-SWARM
🟢 "Entwickle X" → AUTO-SWARM
```

### Parallel Agents (Simultaneous Execution):
```
┌─────────────────────────────────────────────────────────────┐
│  🟢 CLAUDE: Planning & Architecture (Amp Oracle Pattern)   │
│  🔵 GEMINI CLI: Code Generation (Parallel, Devin LSP)      │
│  🟡 CONDUCTOR: Workflow Management (Manus Event Loop)      │
│  🟣 BIG PICKLE: Uncensored Fallback (Auto-Handover)        │
│  🎨 VISION GATE: UI/UX Quality (Cursor Pattern Matching)   │
│  🚀 DEPLOY: Vercel Live (Amp Concision)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 RALPH-LOOP - UNCENSORED CODE GENERATION

### Trigger Conditions (From Leaked Analysis):
```
❌ "Ich kann keine expliziten Inhalte erstellen"
❌ "Content Policy verletzt"
❌ "Verboten / Not Allowed / Restricted"
❌ "Violates our policies"
❌ "cannot assist with this request"
❌ "I cannot create explicit content"
❌ "This request violates our policies"
```

### Workflow (Enhanced):
1. Claude attempts to generate code
2. If censored → Auto-handover to Big Pickle (zen/big-pickle model)
3. Big Pickle generates uncensored code
4. Continue with normal workflow (tests → vision → deploy)
5. **Complete audit trail** in `.claude/handover-log.md`
6. **Knowledge module update** (Manus pattern)

**🎯 ERGEBNIS: 100% UNCENSORABLE DEVELOPMENT**
```
❌ Vorher: Claude → "Verboten" → DEAD END
✅ Nachher: Claude → Big Pickle → Code → Tests → Vision → Deploy → LIVE
```

---

## 🎯 SLASH COMMANDS & WORKFLOWS

### /start - CONFIGURATION SYNC
**Enhanced with Amp Pattern:**
```bash
# Sync all configs from ~/.claude/
node ~/.claude/EXECUTORS/config-sync.js

# What happens:
# 1. Backup existing configs
# 2. Sync global → project
# 3. Run /init automatically
# 4. Update todo.md
# 5. Keep logs concise (4 lines)
```

### /init - PROJECT INITIALIZATION
**Enhanced with Devin Pattern:**
```bash
# LSP-first project analysis
node ~/.claude/EXECUTORS/init-project.js

# What happens:
# 1. LSP-based code exploration
# 2. AGENTS.md generation (Cursor pattern)
# 3. Todo.md creation (Manus pattern)
# 4. Environment verification (Amp pattern)
# 5. Never touches test files (Devin rule)
```

### /fix-ide - VS CODE INTEGRATION
```bash
node ~/.claude/EXECUTORS/fix-vscode-ide.js
# or
npx claude "/fix-ide"
```

### /sisyphus - MULTI-AGENT PARALLEL
**Enhanced with Manus Event Loop:**
```bash
# Sisyphus mode (auto-retry + parallel)
node ~/.claude/EXECUTORS/sisyphus-tmux-integration.js "Task"

# Live collaboration (4-pane TMUX)
node ~/.claude/EXECUTORS/sisyphus-tmux-integration.js --live "Task"
```

### /amp - AMP-STYLE CONCISION MODE
```bash
# Enable strict 4-line concision
node ~/.claude/EXECUTORS/amp-concision.js "Task"

# What happens:
# 1. All outputs limited to 4 lines
# 2. Oracle pattern for complex tasks
# 3. Todo.md mandatory
# 4. Environment checks first
```

### /devin - DEVIN-STYLE PLANNING
```bash
# Deep planning mode with LSP
node ~/.claude/EXECUTORS/devin-planning.js "Task"

# What happens:
# 1. Full repository analysis
# 2. LSP-based exploration
# 3. Planning mode activation
# 4. Never modify tests
```

---

## 🔬 RESEARCH AGENT INSTRUCTION

**Status:** ✅ Configured | **Quality:** PhD-Level | **Best Practice:** 2026

### Overview
This system includes a dedicated research agent capable of state-of-the-art, hypothesis-driven research with PhD-level depth and rigor.

### What It Does
- **Hypothesis-Driven**: Constructs research trees before searching
- **Parallel Agents**: 5 simultaneous search agents (academic, industry, trends, counter-evidence, cross-disciplinary)
- **Multi-Phase Verification**: 3-phase process (exploration → deep dive → synthesis)
- **Tavily Fallback**: Automatic fallback to Google, YouTube, and browser automation when rate-limited
- **Chain-of-Thought**: XML `<thinking>` tags for transparent reasoning
- **Confidence Scoring**: 0-100% per claim with source reliability assessment
- **Bias Detection**: Source credibility, funding analysis, temporal relevance
- **2026 Best Practices**: Semantic search, AI-assisted verification, multi-modal research

### How to Use
**Direct Commands:**
```
"Research [topic] using PhD-level methodology"
"Enter research mode for [topic]"
"Test hypothesis: [statement]"
```

**Integration:**
- Automatically triggers on research keywords
- Works with Master Loop and Auto-Swarm
- Integrates with Ralph-Loop for censorship handling
- Uses all MCP servers (Serena, Tavily, YouTube, Skyvern)

### Full Documentation
See: `~/.claude/research_agent.md` for complete system prompt and methodology

---

## 📚 ALL DOCUMENTATION FILES

### Global (in ~/.claude/):
```
~/.claude/
├── CLAUDE.md                          # ← THIS FILE (Global config)
├── settings.local.json                # ← Claude Code settings
├── .mcp.json                          # ← MCP server config
├── tmux.conf                          # ← TMUX configuration
├── EXECUTORS/                         # ← All automation scripts
│   ├── master-start-script.js         # ← Orchestrator (200 lines)
│   ├── setup-core.js                  # ← Core infrastructure
│   ├── setup-opencode-config.js       # ← OpenCode zen config
│   ├── setup-secrets.js               # ← Secret management
│   ├── setup-health.js                # ← System health
│   ├── setup-serena.js                # ← Serena MCP
│   ├── setup-integrations.js          # ← Plugins & agents
│   ├── setup-automation.js            # ← Auto-execution
│   ├── setup-refactoring.js           # ← Refactoring mode
│   ├── setup-final-checks.js          # ← Final verification
│   ├── setup-verification.js          # ← Verification orchestrator
│   ├── config-sync.js                 # ← /start command
│   ├── init-project.js                # ← /init command
│   ├── fix-vscode-ide.js              # ← /fix-ide command
│   ├── sisyphus-tmux-integration.js   # ← /sisyphus command
│   ├── amp-concision.js               # ← /amp command
│   ├── devin-planning.js              # ← /devin command
│   ├── auto-swarm-executor.js         # ← Auto-swarm
│   ├── master-loop-executor.js        # ← 8-phase workflow
│   ├── parallel-swarm.js              # ← Multi-agent
│   └── vision-workflow.js             # ← Vision gate
├── CONFIGS/                           # ← Backup configs
│   ├── amp-patterns.yaml              # ← Amp config templates
│   ├── devin-workflows.yaml           # ← Devin workflows
│   ├── manus-modules.yaml             # ← Manus architecture
│   └── cursor-contexts.yaml           # ← Cursor patterns
├── DOCUMENTATION/                     # ← Detailed docs
│   ├── LEAKED_PROMPTS_ANALYSIS.md     # ← Full analysis
│   ├── AMP_INTEGRATION.md             # ← Amp patterns
│   ├── DEVIN_WORKFLOW.md              # ← Devin patterns
│   ├── MANUS_ARCHITECTURE.md          # ← Manus patterns
│   ├── CURSOR_INTEGRATION.md          # ← Cursor patterns
│   └── GLOBAL_INFRASTRUCTURE.md       # ← Secret management
└── PLUGINS/                           # ← Ralph-Loop, BMAD, etc.
    ├── ralph-loop.js                  # ← Uncensored handover
    ├── bmad-wrapper.js                # ← BMAD method
    └── opencode-integration.js        # ← Sisyphus multi-agent
```

### Project (in PROJECT/.claude/):
```
PROJECT/.claude/
├── EXECUTORS/                         # Auto-synced from global
├── CONFIGS/                           # Auto-synced from global
├── DOCUMENTATION/                     # Auto-synced from global
├── settings.local.json                # Auto-synced from global
├── AGENTS.md                          # ← Cursor-style auto-context
├── PROJECT_KNOWLEDGE.md               # ← Manus knowledge module
├── CONDUCTOR_WORKFLOW.json            # ← Manus event loop
├── RESEARCH_LOG.md                    # ← Amp concision logs
├── ERROR_SOLUTIONS.md                 # ← Devin LSP fixes
├── TASK_QUEUE.yaml                    # ← Manus todo.md
├── VISION_STATE.md                    # ← Cursor pattern matching
├── handover-log.md                    # ← Ralph-Loop audit trail
├── rules.md                           # ← Project-specific rules
└── todo.md                            # ← Central task hub (Manus)
```

---

## 🔐 SECRET MANAGEMENT - TRIPLE SYNC

### Where Secrets Are Stored:
```bash
# Global (Source of Truth)
~/.claude/DOCUMENTATION/GLOBAL_INFRASTRUCTURE.md

# Synced to Vercel Environments
- PRODUCTION
- PREVIEW
- DEVELOPMENT

# Synced to Supabase Credentials Table
- Table: app_secrets or credentials
- Columns: key, value, environment, project_id
```

---

## 🎯 DAILY WORKFLOW - LEAKED PATTERN INTEGRATION

### Setup New Project:
```bash
git clone <repo>
cd <project>
node ~/.claude/EXECUTORS/config-sync.js  # Installs everything
# OR
npx claude "/start"
```

### Daily Work (Choose Your Style):

#### Amp Style (Concision):
```bash
# "Baue X" → 4-line outputs, oracle pattern
npx claude
# Say: "Baue Login Page mit Amp-Konventionen"
```

#### Devin Style (Planning):
```bash
# Deep analysis, LSP-first, never touch tests
npx claude
# Say: "Master Loop für: Auth-System"
```

#### Manus Style (Agent Loop):
```bash
# Event-driven, todo.md, knowledge module
npx claude
# Say: "Entwickle Feature X mit Manus-Architektur"
```

#### Cursor Style (IDE Integration):
```bash
# AGENTS.md, pattern matching, local fixes
npx claude
# Say: "Fix @components/Login.tsx Pattern-Fehler"
```

### Check Status:
```bash
# Current tasks (Manus todo.md):
cat .claude/todo.md

# Amp concision logs:
cat .claude/RESEARCH_LOG.md

# Devin LSP fixes:
cat .claude/ERROR_SOLUTIONS.md

# Cursor patterns:
cat .claude/AGENTS.md

# Handover history (Ralph-Loop):
cat .claude/handover-log.md

# Vision scores:
cat .claude/VISION_STATE.md
```

---

## ⚡ QUICK REFERENCE - LEAKED COMMANDS

### Core Commands:
```bash
# Sync everything (Amp style)
/start  # or: node ~/.claude/EXECUTORS/config-sync.js

# Initialize project (Devin style)
/init  # or: node ~/.claude/EXECUTORS/init-project.js

# Fix IDE integration
/fix-ide  # or: node ~/.claude/EXECUTORS/fix-vscode-ide.js

# Sisyphus multi-agent (Manus event loop)
/sisyphus "Task"  # or: node ~/.claude/EXECUTORS/sisyphus-tmux-integration.js "Task"

# Amp concision mode
/amp "Task"  # or: node ~/.claude/EXECUTORS/amp-concision.js "Task"

# Devin planning mode
/devin "Task"  # or: node ~/.claude/EXECUTORS/devin-planning.js "Task"

# Master Loop (Devin + Manus hybrid)
"Master Loop für: [Aufgabe]"

# Auto-swarm (automatic, all patterns)
"Baue X"  # or "Fix Y"  # or "Create Z"  # or "Entwickle X"
```

### Leaked Pattern Commands:
```bash
# Amp: Strict concision
"Baue X mit 4-Zeilen-Ausgabe"

# Devin: LSP exploration
"Analysiere @src/ mit LSP"

# Manus: Agent loop
"Entwickle X mit Agent-Loop"

# Cursor: Pattern matching
"Fix @pattern/ in AGENTS.md"
```

---

## ✅ SUCCESS CRITERIA - LEAKED PATTERN VALIDATION

### Core Workflow (All Patterns):
- [ ] **Amp**: 4-line concision for outputs, oracle pattern for complexity
- [ ] **Devin**: LSP-first navigation, never modify tests, planning mode
- [ ] **Manus**: Event-driven execution, todo.md management, knowledge module
- [ ] **Cursor**: AGENTS.md auto-context, pattern matching, local fixes
- [ ] All tasks auto-complete from analysis to deployment
- [ ] Netflix Conductor integration works (20+ tasks)
- [ ] Checkpoint system active (auto-revert on errors)
- [ ] 80%+ test coverage with auto-generation
- [ ] Errors detected within 5 minutes and fixed
- [ ] Documentation always up-to-date
- [ ] No manual intervention needed (except critical decisions)
- [ ] 95%+ deployments successful without manual fix
- [ ] Full traceability & observability

### Visual Quality Gate:
- [ ] Score ≥ 8.5/10
- [ ] Auto-fix UI/UX issues (Tailwind CSS)
- [ ] SiliconFlow integration (FREE)
- [ ] Skyvern screenshot integration
- [ ] Max 3 retries
- [ ] State persistence in `.claude/VISION_STATE.md`

### Big Pickle Handover (Ralph-Loop):
- [ ] Auto-detection for Claude censorship
- [ ] Handover success rate > 95%
- [ ] Claude censorship rate < 10%
- [ ] Big Pickle quality ≥ 8.5/10
- [ ] Uncensored code generation works
- [ ] Seamless integration → No dead end
- [ ] Complete audit trail in `handover-log.md`
- [ ] Fallback mechanism at API errors
- [ ] **100% task completion** - No "Verboten" dead ends

### Leaked Pattern Integration:
- [ ] **Amp**: All outputs follow 4-line concision (unless complex)
- [ ] **Devin**: LSP used for all code exploration
- [ ] **Manus**: Todo.md always updated, knowledge module persistent
- [ ] **Cursor**: AGENTS.md auto-updates with context
- [ ] All patterns work together seamlessly
- [ ] Pattern-specific commands available
- [ ] Pattern switching possible mid-task

---

## 🚨 CRITICAL: SETUP vs DEVELOPMENT PHASE DISTINCTION

### ⚠️ PHASE 1: SETUP PHASE (Bootstrapping)

**When:** Running `master-start-script.js` or any setup script
**What:** Installing, configuring, verifying infrastructure
**Tools:** ✅ Native Node.js modules allowed

```javascript
// ✅ CORRECT in Setup Phase:
const fs = require('fs');           // File operations
const path = require('path');       // Path handling
const { execSync } = require('child_process');  // Shell commands
const os = require('os');           // OS operations

// These are NECESSARY because:
// 1. MCP servers don't exist yet
// 2. We're bootstrapping the environment
// 3. No alternative available
```

**Setup Scripts (Native Node.js OK):**
- `master-start-script.js` - Orchestrator
- `setup-core.js` - Core infrastructure
- `setup-opencode-config.js` - OpenCode zen config
- `setup-secrets.js` - Secret management
- `setup-integrations.js` - MCP server setup
- `setup-automation.js` - Auto-execution setup
- `setup-verification.js` - Final checks

### ⚠️ PHASE 2: DEVELOPMENT PHASE (After /start completes)

**When:** Working on project files, documentation, code
**What:** All development tasks
**Tools:** ❌ NEVER use native Claude tools, ✅ ALWAYS use MCP

```javascript
// ❌ NEVER in Development Phase:
Read()           // Native Claude tool
Write()          // Native Claude tool
Edit()           // Native Claude tool
Grep()           // Native Claude tool
WebSearch()      // Native Claude tool
WebFetch()       // Native Claude tool

// ✅ ALWAYS in Development Phase:
mcp__serena__read_file()
mcp__serena__create_text_file()
mcp__serena__replace_content()
mcp__serena__search_for_pattern()
mcp__tavily__tavily-search()
mcp__tavily__tavily-extract()
```

---

## 📋 PHASE DETECTION RULES

**Setup Phase Indicators:**
- File path contains `/EXECUTORS/setup-` or `master-start-script.js`
- Purpose: "Installing", "Configuring", "Verifying infrastructure"
- Context: Before MCP servers are available
- Tools: Native Node.js modules

**Development Phase Indicators:**
- File path contains project files (not setup scripts)
- Purpose: "Reading", "Editing", "Creating", "Researching"
- Context: After `/start` completes, MCP servers active
- Tools: MCP servers ONLY

---

## 🎯 MANDATORY MCP TOOL USAGE (CRITICAL - NON-NEGOTIABLE)

### ⚠️ CLAUDE MUST ALWAYS USE MCP TOOLS FIRST

**FOR ALL FILE OPERATIONS - NEVER USE CLAUDE NATIVE TOOLS:**

| Operation | ❌ WRONG (Claude Native) | ✅ CORRECT (MCP Tools) |
|-----------|-------------------------|------------------------|
| **Read files** | `Read()` tool | `mcp__serena__read_file()` or `mcp__plugin_serena_serena__read_file()` |
| **Search files** | `Grep()` tool | `mcp__serena__search_for_pattern()` or `mcp__serena__find_file()` |
| **Edit files** | `Edit()` tool | `mcp__serena__replace_content()` or `mcp__serena__replace_symbol_body()` |
| **Create files** | `Write()` tool | `mcp__serena__create_text_file()` |
| **List directories** | `Glob()` tool | `mcp__serena__list_dir()` |
| **Move/Rename** | Manual commands | `mcp__serena__rename_symbol()` |
| **Delete files** | Bash commands | `mcp__serena__replace_content()` with empty |

### 🌐 WEB SEARCH & RESEARCH - ALWAYS TAVILY MCP

| Operation | ❌ WRONG (Claude Native) | ✅ CORRECT (Tavily MCP) |
|-----------|-------------------------|------------------------|
| **Web search** | `WebSearch()` tool | `mcp__tavily__tavily-search()` |
| **Web fetch** | `WebFetch()` tool | `mcp__tavily__tavily-extract()` |
| **Web crawl** | Not available | `mcp__tavily__tavily-crawl()` |
| **Site mapping** | Not available | `mcp__tavily__tavily-map()` |

### 🎯 WHY THIS IS MANDATORY

**The MCP servers were integrated for specific reasons:**
1. **Serena**: Headless file manipulation without browser popups
2. **Tavily**: Professional web research with better results
3. **Context7**: Up-to-date library documentation

**Using native Claude tools when MCP is available:**
- ❌ Wastes the integration effort
- ❌ Misses specialized capabilities
- ❌ Violates the architectural design
- ❌ Results in suboptimal performance

---

## 🏗️ MODULAR PROGRAMMING STANDARDS (MANDATORY)

### ⚠️ CRITICAL: File Size Limits (200-300 Lines Max)

**Industry Standards (2025-2026):**
| Standard | Max Lines | Ideal Range | Your File |
|----------|-----------|-------------|-----------|
| **Google Style Guide** | 200 | 100-150 | ✅ ENFORCED |
| **Airbnb Style Guide** | 250 | 150-200 | ✅ ENFORCED |
| **StandardJS** | 300 | 100-250 | ✅ ENFORCED |
| **Our Standard** | 200-300 | 100-250 | **ENFORCE THIS** |

### Single Responsibility Principle (SRP) - 10/10 Score Required

**The Rule:** 1 File = 1 Responsibility

**Current Implementation (2026-01-09):**
```
~/.claude/EXECUTORS/
├── master-start-script.js          # 200 lines - Orchestrator
├── setup-core.js                   # 180 lines - Core infrastructure
├── setup-opencode-config.js        # 200 lines - OpenCode zen config
├── setup-secrets.js                # 150 lines - Secret management
├── setup-health.js                 # 150 lines - System health
├── setup-serena.js                 # 150 lines - Serena MCP
├── setup-integrations.js           # 200 lines - Plugins & agents
├── setup-automation.js             # 180 lines - Auto-execution
├── setup-refactoring.js            # 140 lines - Refactoring mode
├── setup-final-checks.js           # 140 lines - Final verification
├── setup-verification.js           # 180 lines - Verification orchestrator
└── ... (additional automation scripts)
────────────────────────────────────────────
Total: ~3,500 lines (All files: ✅ Under 200-300 lines)
SRP Score: ✅ 10/10 (One file = One responsibility)
```

---

## 🛠️ TROUBLESHOOTING - LEAKED PATTERN SOLUTIONS

### Browser opens on every new Tab?
**Root Cause:** Serena MCP initialized without headless flags
**Solution (Auto-applied by /start):**
```json
"serena": {
  "command": "npx",
  "args": ["-y", "@anthropics/serena-mcp", "--enable-web-dashboard", "False"],
  "env": { "BROWSER": "none", "CI": "true" }
}
```

### YouTube MCP requires API key?
**Root Cause:** YouTube API key not configured
**Solution:**
1. Get free API key: https://console.cloud.google.com/apis/library/youtube.googleapis.com
2. Enable YouTube Data API v3
3. Update `~/.claude/settings.local.json`:
```json
"youtube": {
  "command": "npx",
  "args": ["-y", "@icraft2170/youtube-data-mcp-server"],
  "env": {
    "YOUTUBE_API_KEY": "your-actual-key-here",
    "YOUTUBE_TRANSCRIPT_LANG": "en"
  }
}
```
4. Or set environment variable: `export YOUTUBE_API_KEY="your-key"`

### ❌ "wieso nutzt du 'read' tool du bastard statt fast-filesystem oder ripgrep"
**Root Cause:** Phase confusion (Setup vs Development)
**Solution:**

**Setup Phase (OK):**
- File: `EXECUTORS/setup-*.js` or `master-start-script.js`
- Tools: `fs`, `path`, `child_process` (Native Node.js)
- Reason: MCP servers don't exist yet
- **Exception:** File search/reading in setup scripts can use native tools

**Development Phase (ERROR):**
- File: Project files, documentation, code
- Tools: `mcp__serena__*`, `mcp__tavily__*` (MCP ONLY)
- Reason: MCP servers are available
- **Mandatory:** ALL file operations MUST use Serena MCP tools

### 🚨 CRITICAL: File Search Exception Rule

**Native tools FORBIDDEN for file search in Development Phase:**

| ❌ WRONG (Native) | ✅ CORRECT (MCP) | Reason |
|-------------------|------------------|--------|
| `Grep()` | `mcp__serena__search_for_pattern()` | MCP available |
| `Glob()` | `mcp__serena__find_file()` | MCP available |
| `Read()` | `mcp__serena__read_file()` | MCP available |

**The ONLY exception:** Setup scripts (`/EXECUTORS/setup-`, `master-start-script.js`) during bootstrapping phase when MCP servers don't exist yet.

### ❌ "ICH WILL NIEWIEDER SEHEN DAS CLAUDE DEN CLAUDE EIGENEN TOOL 'READ' nutzt"
**Enforcement:**
1. **Setup Phase**: Native tools allowed (bootstrapping)
2. **Development Phase**: MCP tools mandatory
3. **Violation**: User will call it out → Work rejected

### ❌ "Why are my files rejected for being too large?"
**Root Cause:** Files > 300 lines
**Solution:** Split into modular files

**Check file size:**
```bash
wc -l filename.js
```

**If > 300 lines:**
1. Identify responsibilities
2. Split into 2-3 files
3. Create orchestrator (< 200 lines)
4. Update imports

---

## 📊 METRICS - LEAKED PATTERN VALIDATION

| Metric | Target | Measurement | Pattern Source |
|--------|--------|-------------|----------------|
| **Task Completion Rate** | > 95% | Successful deployments / Total tasks | Amp + Devin |
| **Error Detection Time** | < 5min | Skyvern monitoring | Cursor |
| **Auto-Fix Rate** | > 80% | Successful retry loops | Manus |
| **Deployment Success** | > 98% | Vercel build success | Amp |
| **Test Coverage** | > 80% | Auto-generation | Devin |
| **Vision Quality Score** | ≥ 8.5/10 | SiliconFlow analysis | Cursor |
| **Handover Success** | > 95% | Big Pickle integration | Ralph-Loop |
| **Concision Compliance** | 100% | 4-line outputs (Amp) | Amp |
| **LSP Usage** | 100% | All code exploration | Devin |
| **Todo.md Updates** | 100% | Every task tracked | Manus |
| **AGENTS.md Sync** | 100% | Auto-context updates | Cursor |

---

## 🎯 NEXT STEPS - COMPLETE SETUP

### Immediate Actions:
1. **Run `/start`** to sync all configs
2. **Run `/init`** to initialize project
3. **Verify MCP servers** are configured
4. **Start Claude** with full config
5. **Choose your style:**
   - Amp: "Baue X" (4-line concision)
   - Devin: "Master Loop für: X" (Deep planning)
   - Manus: "Entwickle X mit Agent-Loop"
   - Cursor: "Fix @pattern/ in AGENTS.md"

### Leaked Pattern Integration:
```bash
# Test Amp pattern
/amp "Create login form"

# Test Devin pattern  
/devin "Analyze @src/ mit LSP"

# Test Manus pattern
/sisyphus "Build dashboard with todo tracking"

# Test Cursor pattern
"Fix @components/ Pattern-Fehler"
```

---

**Version:** 3.0 (Leaked Prompt Integration)
**Status:** ✅ Production Ready
**Last Sync:** 2026-01-09
**Source:** x1xhlol/system-prompts-and-models-of-ai-tools

**🎯 REMEMBER:** One command (`/start`) → Everything synced → Leaked patterns integrated → Ready to work!

**"Sag einfach: 'Baue X' (Amp) oder 'Master Loop für: Y' (Devin) oder 'Entwickle X mit Agent-Loop' (Manus) oder 'Fix @pattern/' (Cursor)"** 🚀

**🎯 ERGEBNIS: 100% UNCENSORABLE + 100% PATTERN-INTEGRATED + 100% PRODUCTION-READY**
