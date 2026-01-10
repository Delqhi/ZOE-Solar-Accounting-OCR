#!/usr/bin/env node
/**
 * Setup OpenCode Configuration
 * Creates opencode.json with opencode zen GLM 4.7 models
 * Creates ~/.claude.json with all MCP servers
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.HOME, '.claude');
const OPCODE_FILE = path.join(CLAUDE_DIR, 'opencode.json');
const CLAUDE_JSON_FILE = path.join(CLAUDE_DIR, '.claude.json');

function log(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = { 'info': '🟢', 'warn': '🟡', 'error': '🔴', 'success': '✅' }[type] || 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Created directory: ${dir}`, 'success');
  }
}

function createOpencodeJson() {
  const opencodeConfig = {
    "models": {
      "glm-4.7-free": {
        "name": "glm-4.7-free",
        "description": "OpenCode Zen GLM 4.7 Free - Kostenloses Sprachmodell",
        "provider": "opencode",
        "apiKey": "sk-wsoDvbl0JOfbSk5lmYJ5JZEx3fzChVBAn9xdb5NkOKuaDCdjudzFyU2UJ975ozdT",
        "baseURL": "https://opencode.ai/zen/v1",
        "temperature": 0.7,
        "maxTokens": 20000096,
        "supportsStreaming": true,
        "defaultContextLength": 128000
      }
    },
    "defaults": {
      "model": "glm-4.7-free",
      "temperature": 0.7
    }
  };

  fs.writeFileSync(OPCODE_FILE, JSON.stringify(opencodeConfig, null, 2));
  log(`Created opencode.json with opencode zen GLM 4.7 models`, 'success');
}

function createClaudeJson() {
  const claudeConfig = {
    "mcpServers": {
      "serena": {
        "command": "npx",
        "args": ["-y", "@anthropics/serena-mcp", "--headless"],
        "env": {
          "BROWSER": "none",
          "CI": "true"
        }
      },
      "youtube": {
        "command": "npx",
        "args": ["-y", "@icraft2170/youtube-data-mcp-server"],
        "env": {
          "YOUTUBE_API_KEY": "AIzaSyAMeanjUyVncbj93mNGd4_pxAzKW5YbF5o",
          "YOUTUBE_TRANSCRIPT_LANG": "en"
        }
      },
      "skyvern": {
        "command": "npx",
        "args": ["-y", "@ngze/skyvern-mcp"],
        "env": {
          "SKYVERN_BASE_URL": "http://130.162.235.142:8000",
          "SKYVERN_API_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJvXzQ3NTgwMzYwOTkzNzQwMTcyIiwiZXhwIjoyMDgxMjI2NDM5fQ.VygIWXgxFuykAQ7t9LI4MH9qHyYhnQUCq6SKUQn3Kk"
        }
      },
      "tavily": {
        "command": "npx",
        "args": ["-y", "@tavily/claude-mcp"],
        "env": {
          "TAVILY_API_KEY": "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"
        }
      },
      "context7": {
        "command": "npx",
        "args": ["-y", "@anthropics/context7-mcp"]
      },
      "chrome-devtools": {
        "command": "npx",
        "args": ["-y", "@anthropics/chrome-devtools-mcp"]
      }
    }
  };

  fs.writeFileSync(CLAUDE_JSON_FILE, JSON.stringify(claudeConfig, null, 2));
  log(`Created ~/.claude.json with all 6 MCP servers`, 'success');
}

function verifyConfiguration() {
  log('Verifying configuration...', 'info');

  let allGood = true;

  // Check opencode.json
  if (fs.existsSync(OPCODE_FILE)) {
    const content = JSON.parse(fs.readFileSync(OPCODE_FILE, 'utf8'));
    if (content.models &&
        content.models['glm-4.7-free'] &&
        content.models['glm-4.7-free'].apiKey === 'sk-wsoDvbl0JOfbSk5lmYJ5JZEx3fzChVBAn9xdb5NkOKuaDCdjudzFyU2UJ975ozdT' &&
        content.models['glm-4.7-free'].baseURL === 'https://opencode.ai/zen/v1' &&
        content.defaults.model === 'glm-4.7-free') {
      log('✓ opencode.json: opencode zen GLM 4.7 models', 'success');
    } else {
      log('✗ opencode.json: Wrong format', 'error');
      allGood = false;
    }
  } else {
    log('✗ opencode.json: Missing', 'error');
    allGood = false;
  }

  // Check ~/.claude.json
  if (fs.existsSync(CLAUDE_JSON_FILE)) {
    const content = JSON.parse(fs.readFileSync(CLAUDE_JSON_FILE, 'utf8'));
    const servers = Object.keys(content.mcpServers || {});
    if (servers.length === 6 && servers.includes('serena') && servers.includes('tavily')) {
      log(`✓ ~/.claude.json: ${servers.length} MCP servers configured`, 'success');
    } else {
      log('✗ ~/.claude.json: Missing servers', 'error');
      allGood = false;
    }
  } else {
    log('✗ ~/.claude.json: Missing', 'error');
    allGood = false;
  }

  return allGood;
}

function main() {
  log('═══════════════════════════════════════════════════════════', 'info');
  log('🚀 Setup OpenCode Configuration', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');

  ensureDirectory(CLAUDE_DIR);
  createOpencodeJson();
  createClaudeJson();

  const success = verifyConfiguration();

  log('═══════════════════════════════════════════════════════════', 'info');
  if (success) {
    log('✅ OpenCode configuration complete!', 'success');
    log('opencode.json: glm-4.7-free + zen/v1 ✓', 'success');
    log('~/.claude.json: All 6 MCP servers ✓', 'success');
  } else {
    log('⚠️  Configuration incomplete', 'warn');
  }
  log('═══════════════════════════════════════════════════════════', 'info');

  return success;
}

if (require.main === module) {
  const success = main();
  process.exit(success ? 0 : 1);
}

module.exports = { main };
