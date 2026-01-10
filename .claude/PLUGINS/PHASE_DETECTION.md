# Phase Detection Helper

## Setup Phase vs Development Phase

### ⚠️ SETUP PHASE (Native Node.js OK)

**When:**
- Running `master-start-script.js`
- Running any `setup-*.js` file
- Installing infrastructure
- Before MCP servers exist

**File Paths:**
- `~/.claude/EXECUTORS/setup-*.js`
- `~/.claude/EXECUTORS/master-start-script.js`

**Purpose:**
- Installing dependencies
- Configuring environment
- Verifying tools
- Creating directories

**Allowed Tools:**
```javascript
// ✅ CORRECT in Setup Phase
const fs = require('fs');           // File operations
const path = require('path');       // Path handling
const { execSync } = require('child_process');  // Shell
const os = require('os');           // OS operations
```

**Why Native is OK:**
- MCP servers don't exist yet
- No alternative available
- Bootstrapping required

### ⚠️ DEVELOPMENT PHASE (MCP ONLY)

**When:**
- Working on project files
- Reading documentation
- Creating code
- After /start completes

**File Paths:**
- Project files (not setup scripts)
- Documentation files
- Code files
- Configuration files

**Purpose:**
- Reading files
- Editing code
- Creating documentation
- Researching

**Forbidden Tools:**
```javascript
// ❌ NEVER in Development Phase
Read()           // Native Claude tool
Write()          // Native Claude tool
Edit()           // Native Claude tool
Grep()           // Native Claude tool
WebSearch()      // Native Claude tool
WebFetch()       // Native Claude tool
```

**Required Tools:**
```javascript
// ✅ ALWAYS in Development Phase
mcp__serena__read_file()
mcp__serena__create_text_file()
mcp__serena__replace_content()
mcp__serena__search_for_pattern()
mcp__tavily__tavily-search()
mcp__tavily__tavily-extract()
```

## Detection Checklist

### Setup Phase Check
- [ ] File in /EXECUTORS/setup-*?
- [ ] File is master-start-script.js?
- [ ] Purpose: Installing/configuring?
- [ ] MCP servers not available?
- [ ] No MCP alternative exists?
→ ✅ Native tools OK

### Development Phase Check
- [ ] Working on project files?
- [ ] MCP servers available?
- [ ] Serena/Fast-FS/Tavily exist?
- [ ] File operation needed?
→ ❌ Native tools FORBIDDEN

## Examples

### Example 1: Setup Script
```javascript
// File: ~/.claude/EXECUTORS/setup-core.js
// Phase: SETUP

const fs = require('fs');  // ✅ OK
const { execSync } = require('child_process');  // ✅ OK

async function verifyClaudeCode() {
  const version = execSync('claude --version');  // ✅ OK
  // MCP not available yet
}
```

### Example 2: Project File
```javascript
// File: ./src/app.js
// Phase: DEVELOPMENT

// ❌ WRONG
const content = Read('config.json');  // Native tool

// ✅ CORRECT
const content = await mcp__serena__read_file('config.json');  // MCP
```

### Example 3: Documentation
```javascript
// File: ./docs/README.md
// Phase: DEVELOPMENT

// ❌ WRONG
const results = WebSearch('best practices');  // Native tool

// ✅ CORRECT
const results = await mcp__tavily__tavily-search('best practices');  // MCP
```

## Consequences

### Setup Phase Violation
- Using MCP when not available
- Result: Script fails
- Impact: Expected behavior

### Development Phase Violation
- Using native tools when MCP available
- Result: **CRITICAL FAILURE**
- Impact: Work rejected

## Quick Reference

### Setup Phase (Native OK)
```
File: setup-*.js or master-start-script.js
Tools: fs, path, child_process, os
Purpose: Bootstrap infrastructure
Status: ✅ Native allowed
```

### Development Phase (MCP ONLY)
```
File: Project files, docs, code
Tools: mcp__serena__*, mcp__tavily__*
Purpose: Work on project
Status: ❌ Native forbidden
```

## Verification

### Check Current Context
```bash
# Are you in a setup script?
pwd | grep "EXECUTORS/setup-"

# Are you in project files?
pwd | grep -v "EXECUTORS"

# Result determines tool choice
```

### Quick Decision Tree
`Is this a setup script? → YES → Use native tools
                         ↓ NO
Are MCP servers available? → YES → Use MCP tools
                            ↓ NO
Use native tools (fallback)`

Generated: 2026-01-09T12:58:06.620Z
