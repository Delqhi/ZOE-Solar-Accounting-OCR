# 🤖 Claude CLI Configuration - ZOE Solar Accounting OCR

**Ultimate MCP Agent Delegation System** | **Version 2026.1**

This directory contains the complete Claude CLI configuration for 100% error-free code with MCP server integration.

## 🚀 NEW: Global Instructions

**🔥 CRITICAL**: Start here! The new `.claude.md` file in your project root contains global MCP integration instructions.

```bash
# View global instructions
cat .claude.md
```

## 📁 Files

### Core Configuration
- **`.claude.md`** ⭐ **NEW** - Global MCP instructions & delegation rules
- **`claude-config.json`** - JSON MCP server configuration
- **`mcp.json`** - Project-level MCP server definitions
- **`agents.md`** - Complete agent delegation guide
- **`claude-config.md`** - Universal rules and workflows
- **`universal-testing-instructions.md`** - Comprehensive testing guide
- **`COMMANDS.md`** - Quick command reference

### Commands
- **`commands/console-check.js`** - `/console-check` command executable
- **`commands/check-mcp-servers.js`** ⭐ **NEW** - MCP health check
- **`commands/console-check.md`** - Command documentation

## 🎯 Quick Usage

### MCP Server Health Check
```bash
# Verify all MCP servers are configured
node .claude/commands/check-mcp-servers.js
```

### For Claude Code
When working on this project, Claude will automatically:
1. **Delegate to MCP servers** for specialized tasks
2. **Activate Ralph-Loop** for complex workflows
3. **Run build, TypeScript, and ESLint checks**
4. **Perform visual testing** for web apps
5. **Check browser console** for errors
6. **Validate all fixes** before declaring completion

### Manual Commands
```bash
# Run validation script
./validate.sh

# Run visual test
node test-visual.js

# Run console check
node .claude/commands/console-check.js

# Check MCP servers
node .claude/commands/check-mcp-servers.js
```

## 🚀 Universal Commands

### `/console-check`
Comprehensive browser console and visual testing.

**Usage:**
```bash
/console-check                    # Test localhost:5173
/console-check --visible          # Show browser
/console-check https://app.com    # Test production
```

**What it does:**
- ✅ Captures all console messages
- ✅ Takes screenshots
- ✅ Checks for DOM errors
- ✅ Validates Tailwind CSS
- ✅ Verifies favicon
- ✅ Detects React errors
- ✅ Monitors network requests

### MCP Server Commands

**Serena (Code Analysis):**
```bash
# Automatically delegated for code fixes
# Find symbols, replace code, rename, etc.
```

**Tavily (Web Research):**
```bash
# Automatically delegated for research
# Search current docs, find best practices
```

**Canva (Visual Design):**
```bash
# Automatically delegated for visuals
# Create diagrams, mockups, presentations
```

**Ralph-Loop (Complex Workflows):**
```bash
# Activated for "fix all errors" requests
# 5-phase validation: Analyze → Delegate → Execute → Validate → Iterate
```

## 📋 Validation Workflow

### When User Says "Fix All Errors" (Ralph-Loop Activated)

**Claude's Automatic 5-Phase Process:**

1. **ANALYZE** (5 seconds)
   ```bash
   # Check MCP servers first
   node .claude/commands/check-mcp-servers.js

   # Run diagnostics
   npm run build
   npx tsc --noEmit
   npm run lint
   ```

2. **DELEGATE** (10 seconds)
   ```
   Code issues → Serena MCP
   Research needed → Tavily MCP
   Visual issues → Canva MCP
   Complex → Ralph-Loop
   ```

3. **EXECUTE** (60 seconds)
   ```
   Serena: Fixes all code issues
   Tavily: Researches best practices
   Canva: Creates visual documentation
   You: Coordinate and verify
   ```

4. **VALIDATE** (30 seconds)
   ```bash
   ./validate.sh
   node .claude/commands/console-check.js
   ```

5. **ITERATE or EXIT**
   ```
   IF errors remain → Go back to Phase 2
   ELSE → Report success + Commit/Deploy if requested
   ```

**Final Report:**
```
✅ Build: 0 errors
✅ TypeScript: 0 errors
✅ ESLint: 0 errors
✅ Visual: Clean
✅ Console: Clean
🎯 Result: 100% Error-Free
```

## 🔧 Project-Specific Rules

### Web Application Requirements
- ✅ Favicon in index.html (data URI)
- ✅ Tailwind CSS properly configured
- ✅ No console.log in production code
- ✅ All unused imports removed
- ✅ All unused variables prefixed with `_` or removed

### Error Handling
- ✅ Use error boundaries
- ✅ Proper error messages
- ✅ No unhandled promises
- ✅ Graceful degradation

## 📚 Reference

See `universal-testing-instructions.md` for:
- Complete validation checklist
- Common fixes and patterns
- Browser testing workflows
- Deployment checklist
- Troubleshooting guide

## ✅ Success Criteria

A project is "100% error-free" when:
- [ ] Build completes without errors
- [ ] TypeScript shows 0 errors
- [ ] ESLint shows 0 errors
- [ ] Visual test is clean
- [ ] Browser console is clean
- [ ] All features work as expected
- [ ] All MCP servers configured and tested

---

## 🎉 NEW: 2026 MCP Agent Team Configuration

### What's Now Available

| Component | Status | Purpose |
|-----------|--------|---------|
| **Global Instructions** | ✅ NEW | `.claude.md` - MCP delegation rules |
| **Serena MCP** | ✅ Configured | Code analysis & editing (P0) |
| **Tavily MCP** | ✅ Configured | Web research & documentation (P1) |
| **Canva MCP** | ✅ NEW | Visual design & diagrams (P2) |
| **Ralph-Loop** | ✅ Enhanced | 5-phase validation workflow |
| **MCP Health Check** | ✅ NEW | `check-mcp-servers.js` |
| **Project Config** | ✅ NEW | `.claude/mcp.json` |

### Quick Start Commands

```bash
# 1. Check MCP server health
node .claude/commands/check-mcp-servers.js

# 2. View global instructions
cat .claude.md

# 3. Run full validation
./validate.sh && node .claude/commands/console-check.js

# 4. Test MCP delegation
echo "Fix unused variables in App.tsx" | claude
```

### The 5-Second Delegation Rule

When you give Claude a task, it will decide within 5 seconds:

1. **Code?** → Serena MCP (immediate)
2. **Research?** → Tavily MCP (immediate)
3. **Visuals?** → Canva MCP (immediate)
4. **Complex?** → Ralph-Loop (automated)
5. **Simple?** → Manual fix

### Ralph-Loop Triggers

These phrases automatically activate the 5-phase workflow:
- "mach alle error weg"
- "alles soll 100% funktinoieren"
- "fix everything"
- "100% working"
- "commit and deploy"
- "design muss optimal sein"

---

## 📊 Configuration Summary

Your project now has **complete 2026 best practices** for Claude CLI agent delegation:

✅ **Global MCP Integration** - `.claude.md` with delegation rules
✅ **Agent Configuration** - `.claude/agents.md` with patterns
✅ **JSON Configuration** - `.claude/claude-config.json` + `.claude/mcp.json`
✅ **Validation System** - `validate.sh`, `console-check.js`, `test-visual.js`
✅ **MCP Health Checks** - `check-mcp-servers.js`
✅ **Ralph-Loop Workflow** - 5-phase automated validation
✅ **Documentation** - Complete command reference

**Result:** Ultimate Claude CLI agent team with 100% error-free code guarantee.

---

**Remember**: The goal is perfection. No compromises. If it's not 100%, it's not done.

**Delegate. Validate. Iterate. Deploy.** 🚀