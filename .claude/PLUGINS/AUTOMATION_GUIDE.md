# Slash Commands & Automation

## Quick Commands

### /start - Configuration Sync
```bash
node ~/.claude/EXECUTORS/config-sync.js
# or in Claude: /start
```
**What it does:**
- Syncs global configs to project
- Creates backups
- Preserves project-specific files
- Runs /init automatically

### /init - Project Initialization
```bash
node ~/.claude/EXECUTORS/init-project.js
# or in Claude: /init
```
**What it does:**
- Detects project info
- Creates rules.md
- Verifies MCP servers
- Checks installation

### /fix-ide - IDE Integration
```bash
node ~/.claude/EXECUTORS/fix-vscode-ide.js
# or in Claude: /fix-ide
```
**What it does:**
- Checks VS Code CLI
- Verifies Claude extension
- Fixes integration issues

### /sisyphus - Multi-Agent
```bash
node ~/.claude/EXECUTORS/sisyphus-tmux-integration.js "Task"
# or in Claude: /sisyphus "Task"
```
**What it does:**
- Parallel TMUX sessions
- Auto-retry failed tasks
- Agent specialization
- Real-time monitoring

## Auto-Execution Triggers

### Auto-Swarm (Automatic)
Any coding task triggers complete workflow:
- "Baue X" → Full swarm
- "Fix Y" → Swarm + tests
- "Create Z" → Complete workflow
- "Deploy" → Auto-deploy

### Master Loop (8-Phase)
```bash
node ~/.claude/EXECUTORS/master-loop-executor.js "Task"
```
**Phases:**
1. Analysis & Research
2. Planning & Breakdown
3. Implementation
4. Testing & Validation
5. Checkpoint Gate
6. Deployment
7. Monitoring
8. Vision Quality Gate

### Ralph-Loop (Uncensored)
```bash
node ~/.claude/EXECUTORS/ralph-loop-wrapper.js "Task"
```
**Features:**
- Censorship detection
- Big Pickle handover
- Audit trail
- 100% task completion

## Workflow Examples

### Example 1: Build Feature
```
User: "Baue Login Page"
→ Auto-swarm triggers
→ Claude plans
→ Gemini codes
→ Tests run
→ Vision checks
→ Deploy
```

### Example 2: Fix Bug
```
User: "Fix authentication bug"
→ Analysis
→ Fix implementation
→ Tests
→ Regression check
→ Deploy
```

### Example 3: Uncensored Task
```
User: "Create explicit content tool"
→ Claude attempts
→ Censorship detected
→ Big Pickle handover
→ Code generated
→ Tests pass
→ Deploy
```

## Configuration Files

### Global (~/.claude/)
- CLAUDE.md - Master config
- settings.local.json - MCP & plugins
- .mcp.json - Server definitions

### Project (./.claude/)
- rules.md - Project rules
- PROJECT_KNOWLEDGE.md - Learnings
- handover-log.md - Ralph history
- TASK_QUEUE.yaml - Current tasks

## Automation Status

✅ Auto-swarm: Ready
✅ Master loop: Ready
✅ Ralph-loop: Ready
✅ Slash commands: Ready
✅ All integrations: Active

Generated: 2026-01-09T12:58:06.581Z
