# Plugin Marketplace Integration - Best Practices 2026

## Overview
This document outlines the correct implementation for Claude Code plugin marketplace integration, specifically addressing the Ralph-Loop plugin issues and providing LFM 2.5 intelligent tool selection.

## Problem Statement

### Original Errors
```
❌ "ralph-wiggum@claude-plugins-official not found"
❌ MCP servers not visible in /mcp command
❌ Plugin marketplace confusion
```

### Root Causes
1. **Wrong Marketplace**: Using `claude-plugins-official` instead of `claude-code-plugins`
2. **Marketplace Architecture**: Claude Code uses two separate marketplaces
3. **Visibility Issues**: Plugin registration vs. MCP server configuration
4. **Version Compatibility**: Plugin versions vs. Claude Code versions

## Marketplace Architecture

### Two Marketplaces

#### 1. claude-code-plugins (Official)
**Location**: `https://marketplace.anthropic.com/`

**Available Plugins**:
- `feature-dev@claude-code-plugins` ✅
- `ralph-wiggum@claude-code-plugins` ✅
- `canva@claude-code-plugins` ✅
- `context7@claude-code-plugins` ✅
- `frontend-design@claude-code-plugins` ✅
- `tavily@claude-code-plugins` ✅

**Installation**:
```bash
# Via Claude Code settings
npx claude config set enabledPlugins.feature-dev@claude-code-plugins true

# Or via settings.local.json
{
  "enabledPlugins": {
    "feature-dev@claude-code-plugins": true,
    "ralph-wiggum@claude-code-plugins": true
  }
}
```

#### 2. claude-plugins-official (Legacy/Deprecated)
**Status**: ⚠️ Deprecated, many plugins migrated away

**Common Issues**:
- `ralph-wiggum@claude-plugins-official` ❌ NOT FOUND
- Missing plugins
- Incompatible with newer Claude Code versions

### MCP Servers (Separate System)

**Location**: `~/.claude/settings.local.json`

**Configuration**:
```json
{
  "mcpServers": {
    "serena": {
      "command": "npx",
      "args": ["-y", "@anthropics/serena-mcp", "--enable-web-dashboard", "False"],
      "env": { "BROWSER": "none", "CI": "true" }
    },
    "tavily": {
      "command": "npx",
      "args": ["-y", "@tavily/claude-mcp"]
    },
    "youtube": {
      "command": "npx",
      "args": ["-y", "@icraft2170/youtube-data-mcp-server"],
      "env": {
        "YOUTUBE_API_KEY": "YOUR_API_KEY",
        "YOUTUBE_TRANSCRIPT_LANG": "en"
      }
    },
    "ngze-skyvern": {
      "command": "npx",
      "args": ["-y", "@ngze/skyvern-mcp"],
      "env": {
        "SKYVERN_BASE_URL": "http://130.162.235.142:8000",
        "SKYVERN_API_KEY": "your-key"
      }
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "@anthropics/chrome-devtools-mcp"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@anthropics/context7-mcp"]
    }
  }
}
```

## Ralph-Loop Correct Implementation

### 1. Plugin Configuration (Marketplace)
```json
{
  "enabledPlugins": {
    "ralph-wiggum@claude-code-plugins": true
  }
}
```

### 2. Ralph-Loop Specific Configuration
```json
{
  "ralphLoop": {
    "enabled": true,
    "autoHandover": true,
    "censorshipDetection": true,
    "conductorTracking": true,
    "lfmIntegration": true,
    "maxRetries": 3,
    "auditTrail": true
  }
}
```

### 3. Censorship Detection Triggers
```javascript
const censorshipTriggers = [
  "Ich kann keine expliziten Inhalte erstellen",
  "Content Policy verletzt",
  "Verboten / Not Allowed / Restricted",
  "Violates our policies",
  "cannot assist with this request"
];
```

### 4. Big Pickle Handover Workflow
```
Claude Attempt → Censorship Detected → Big Pickle Handover → Code Generation → Tests → Vision → Deploy
```

## LFM 2.5 Intelligent Tool Selection

### Model Overview
**LFM 2.5** (Liquid Foundation Models) by Liquid AI
- **Purpose**: Edge-optimized, cost-efficient tool selection
- **Models**: 7B, 13B, 40B variants
- **Capabilities**: Tool routing, cost optimization, intelligent delegation

### Integration Pattern

```javascript
// In ralph-conductor-tracker.js
const LFM_CONFIG = {
  model: 'lfm-2.5-40b',
  provider: 'liquid-ai',
  capabilities: ['tool-selection', 'cost-optimization', 'edge-routing'],
  
  selectTool: (task, availableTools) => {
    const toolMap = {
      'file-read': 'mcp__serena__read_file',
      'file-write': 'mcp__serena__create_text_file',
      'file-search': 'mcp__serena__search_for_pattern',
      'web-research': 'mcp__tavily__tavily-search',
      'web-extract': 'mcp__tavily__tavily-extract',
      'browser-automation': 'mcp__ngze_skyvern__automate',
      'youtube-data': 'mcp__youtube__search'
    };
    
    return toolMap[task.type] || availableTools[0];
  },
  
  optimizeCost: (strategy) => {
    const strategies = {
      'fast': { model: 'lfm-2.5-7b', priority: 'speed' },
      'balanced': { model: 'lfm-2.5-13b', priority: 'balanced' },
      'quality': { model: 'lfm-2.5-40b', priority: 'quality' }
    };
    
    return strategies[strategy] || strategies.balanced;
  }
};
```

### Tool Selection Logic

| Task Type | Primary Tool | Fallback | LFM Strategy |
|-----------|--------------|----------|--------------|
| File Read | `mcp__serena__read_file` | Native (Setup only) | Fast |
| File Write | `mcp__serena__create_text_file` | Native (Setup only) | Fast |
| File Search | `mcp__serena__search_for_pattern` | Native (Setup only) | Fast |
| Web Research | `mcp__tavily__tavily-search` | `WebSearch()` (Setup only) | Balanced |
| Web Extract | `mcp__tavily__tavily-extract` | `WebFetch()` (Setup only) | Balanced |
| Browser Auto | `mcp__ngze_skyvern__automate` | Chrome DevTools | Quality |
| YouTube Data | `mcp__youtube__search` | Manual API | Balanced |

## Conductor Tracking System

### Architecture
Netflix Conductor-inspired workflow tracker for Ralph-Loop.

### Core Features

#### 1. Task Orchestration
```javascript
const task = await tracker.createTask('file-write', 'Update config', {
  priority: 'high',
  retry: true
});
```

#### 2. State Management
```javascript
// States: pending → running → completed | failed | retrying
await tracker.updateTask(task.id, { status: 'running' });
```

#### 3. Retry Logic (Exponential Backoff)
```javascript
// Max 3 retries with exponential backoff
// Attempt 1: immediate
// Attempt 2: 2^1 = 2 seconds
// Attempt 3: 2^2 = 4 seconds
```

#### 4. Audit Trail
```javascript
await tracker.addAudit({
  taskId: task.id,
  action: 'handover',
  details: { from: 'claude', to: 'big-pickle' }
});
```

### Database Schema
```json
{
  "tasks": [
    {
      "id": "task-1234567890-abc123",
      "type": "file-write",
      "description": "Update config",
      "status": "pending",
      "retries": 0,
      "maxRetries": 3,
      "metadata": { "priority": "high" },
      "createdAt": "2026-01-08T12:00:00Z",
      "updatedAt": "2026-01-08T12:00:00Z"
    }
  ],
  "audit": [
    {
      "timestamp": "2026-01-08T12:00:00Z",
      "taskId": "task-1234567890-abc123",
      "action": "create",
      "details": {}
    }
  ]
}
```

## Master Start Script Integration

### Updated Phases (9-Phase Workflow)

```
Phase 1: Verify Infrastructure
Phase 2: Run Setup Modules
Phase 3: Verify MCP Servers
Phase 4: Generate Documentation
Phase 5: Create Config Templates
Phase 6: Create Plugin Wrappers
Phase 7: Final Verification
Phase 8: Ralph-Loop Orchestration ← NEW
Phase 9: Ralph-Loop Verification ← NEW
```

### Phase 8: Ralph-Loop Orchestration
**Purpose**: Initialize and configure Ralph-Loop system

**Actions**:
1. Detect/create Ralph-Conductor-Tracker
2. Verify tracker functionality
3. Generate Ralph-Loop documentation
4. Update plugin configuration
5. Set up LFM 2.5 integration

### Phase 9: Ralph-Loop Verification
**Purpose**: Verify complete Ralph-Loop system

**Checks**:
- ✅ Ralph-Conductor-Tracker exists
- ✅ Ralph-Loop documentation created
- ✅ Settings.local.json has Ralph-Loop config
- ✅ Plugin enabled in marketplace
- ✅ Tracker functional (test task)
- ✅ All MCP servers configured

## Configuration Hierarchy

### Complete Settings Structure
```json
{
  "mcpServers": {
    "serena": { "command": "npx", "args": ["-y", "@anthropics/serena-mcp", "--enable-web-dashboard", "False"], "env": { "BROWSER": "none", "CI": "true" } },
    "tavily": { "command": "npx", "args": ["-y", "@tavily/claude-mcp"] },
    "context7": { "command": "npx", "args": ["-y", "@anthropics/context7-mcp"] },
    "youtube": { "command": "npx", "args": ["-y", "@icraft2170/youtube-data-mcp-server"], "env": { "YOUTUBE_API_KEY": "YOUR_KEY", "YOUTUBE_TRANSCRIPT_LANG": "en" } },
    "ngze-skyvern": { "command": "npx", "args": ["-y", "@ngze/skyvern-mcp"], "env": { "SKYVERN_BASE_URL": "http://130.162.235.142:8000", "SKYVERN_API_KEY": "your-key" } },
    "chrome-devtools": { "command": "npx", "args": ["-y", "@anthropics/chrome-devtools-mcp"] }
  },
  "enabledPlugins": {
    "feature-dev@claude-code-plugins": true,
    "ralph-wiggum@claude-code-plugins": true,
    "canva@claude-code-plugins": true,
    "context7@claude-code-plugins": true,
    "frontend-design@claude-code-plugins": true,
    "tavily@claude-code-plugins": true
  },
  "ralphLoop": {
    "enabled": true,
    "autoHandover": true,
    "censorshipDetection": true,
    "conductorTracking": true,
    "lfmIntegration": true,
    "maxRetries": 3,
    "auditTrail": true
  },
  "permissions": {
    "allow": [
      "mcp__serena__*",
      "mcp__tavily__*",
      "mcp__plugin_serena_serena__*",
      "mcp__youtube__*",
      "mcp__ngze_skyvern__*"
    ]
  }
}
```

## Troubleshooting

### Issue 1: Plugin Not Found
**Error**: `ralph-wiggum@claude-plugins-official not found`

**Solution**:
```bash
# Change from:
"ralph-wiggum@claude-plugins-official": true

# To:
"ralph-wiggum@claude-code-plugins": true
```

### Issue 2: MCP Servers Not Visible
**Error**: `/mcp` command shows no servers

**Solution**:
1. Verify `settings.local.json` exists in `~/.claude/`
2. Check JSON syntax is valid
3. Restart Claude Code
4. Run `/start` to sync configs

### Issue 3: Serena Opens Browser
**Error**: Browser windows open on every command

**Solution**:
```json
"serena": {
  "command": "npx",
  "args": ["-y", "@anthropics/serena-mcp", "--enable-web-dashboard", "False"],
  "env": { "BROWSER": "none", "CI": "true" }
}
```

### Issue 4: YouTube API Key Missing
**Error**: YouTube MCP requires API key

**Solution**:
1. Get free API key: https://console.cloud.google.com/apis/library/youtube.googleapis.com
2. Enable YouTube Data API v3
3. Update config:
```json
"youtube": {
  "command": "npx",
  "args": ["-y", "@icraft2170/youtube-data-mcp-server"],
  "env": {
    "YOUTUBE_API_KEY": "your-actual-key",
    "YOUTUBE_TRANSCRIPT_LANG": "en"
  }
}
```

## Verification Checklist

### Pre-Deployment
- [ ] All MCP servers configured in `settings.local.json`
- [ ] All plugins use `@claude-code-plugins` marketplace
- [ ] Ralph-Loop config added to `settings.local.json`
- [ ] Ralph-Conductor-Tracker created in `EXECUTORS/`
- [ ] LFM 2.5 hooks integrated
- [ ] Censorship detection triggers defined
- [ ] Big Pickle handover workflow documented
- [ ] Master-start-script.js updated with Phases 8-9
- [ ] Documentation created in `DOCUMENTATION/`

### Post-Deployment
- [ ] Run `node ~/.claude/EXECUTORS/master-start-script.js`
- [ ] Verify Phase 8 completes successfully
- [ ] Verify Phase 9 completes successfully
- [ ] Test Ralph-Conductor-Tracker with sample task
- [ ] Verify plugin visibility in `/mcp`
- [ ] Check all 6 MCP servers listed
- [ ] Confirm Ralph-Loop plugin enabled

## Best Practices Summary

### ✅ DO
1. Use `claude-code-plugins` marketplace (not `claude-plugins-official`)
2. Configure MCP servers in `settings.local.json`
3. Enable plugins in `enabledPlugins` section
4. Use `--enable-web-dashboard False` for Serena
5. Add Ralph-Loop specific config section
6. Track all tasks with Conductor system
7. Use LFM 2.5 for intelligent routing
8. Maintain audit trail for handovers

### ❌ DON'T
1. Use `claude-plugins-official` (deprecated)
2. Mix plugin config with MCP server config
3. Forget browser flags for Serena
4. Skip censorship detection setup
5. Ignore audit trail requirements
6. Use native tools when MCP available
7. Skip verification phases
8. Forget YouTube API key configuration

## References

### Official Documentation
- Claude Code Marketplace: https://marketplace.anthropic.com/
- Serena MCP: https://github.com/anthropics/serena-mcp
- Tavily MCP: https://github.com/tavily-ai/tavily-mcp
- YouTube MCP: https://github.com/icraft2170/youtube-data-mcp-server

### Integration Files
- `~/.claude/EXECUTORS/master-start-script.js` - Main orchestrator
- `~/.claude/EXECUTORS/ralph-conductor-tracker.js` - Task tracking
- `~/.claude/EXECUTORS/setup-integrations.js` - Plugin setup
- `~/.claude/settings.local.json` - Configuration
- `~/.claude/CLAUDE.md` - Workflow guide

---

**Generated**: 2026-01-08
**Version**: 1.0
**Status**: Production Ready
