#!/usr/bin/env node
/**
 * VS CODE IDE FIXER - /fix-ide COMMAND
 * Version: 1.0 | Best Practices
 * 
 * Fixes common VS Code integration issues with Claude Code
 * including settings, extensions, and workspace configuration.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CLAUDE_DIR = path.join(process.env.HOME, '.claude');
const VSCODE_DIR = path.join(process.env.HOME, '.vscode');
const WORKSPACE_VSCODE = path.join(process.cwd(), '.vscode');

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function log(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = {
    'info': '🟣',
    'warn': '🟡',
    'error': '🔴',
    'success': '✅'
  }[type] || 'ℹ️';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Created: ${dir}`, 'success');
  }
}

function createFile(filePath, content, description) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    log(`✓ ${description}`, 'success');
    return true;
  } catch (error) {
    log(`✗ ${description}: ${error.message}`, 'error');
    return false;
  }
}

function backupFile(filePath) {
  if (fs.existsSync(filePath)) {
    const backupPath = `${filePath}.backup.${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    log(`Backup: ${path.basename(filePath)}`, 'info');
  }
}

// ============================================================================
// STEP 1: FIX WORKSPACE SETTINGS
// ============================================================================

function fixWorkspaceSettings() {
  log('Fixing workspace settings...', 'info');
  
  ensureDirectory(WORKSPACE_VSCODE);
  
  const settingsPath = path.join(WORKSPACE_VSCODE, 'settings.json');
  backupFile(settingsPath);
  
  const settings = {
    "claude-code.autoAccept": {
      "edit": true,
      "bash": false,
      "webfetch": true
    },
    "claude-code.model": "mimo-v2-flash",
    "claude-code.maxOutputTokens": null,
    "claude-code.enableAllProjectMcpServers": true,
    "editor.formatOnSave": true,
    "editor.tabSize": 2,
    "editor.insertSpaces": true,
    "files.exclude": {
      "**/.git": true,
      "**/.DS_Store": true,
      "**/node_modules": true,
      "**/dist": true,
      "**/build": true
    },
    "search.exclude": {
      "**/node_modules": true,
      "**/dist": true,
      "**/build": true,
      "**/.git": true
    },
    "files.associations": {
      "*.md": "markdown",
      "*.json": "json",
      "*.js": "javascript",
      "*.ts": "typescript"
    }
  };
  
  return createFile(settingsPath, JSON.stringify(settings, null, 2), 'Workspace settings');
}

// ============================================================================
// STEP 2: FIX WORKSPACE EXTENSIONS
// ============================================================================

function createExtensionsJson() {
  log('Creating extensions configuration...', 'info');
  
  ensureDirectory(WORKSPACE_VSCODE);
  
  const extensionsPath = path.join(WORKSPACE_VSCODE, 'extensions.json');
  backupFile(extensionsPath);
  
  const extensions = {
    "recommendations": [
      "anthropics.claude-code",
      "ms-vscode.vscode-json",
      "ms-vscode.vscode-typescript-next",
      "esbenp.prettier-vscode",
      "dbaeumer.vscode-eslint",
      "eamodio.gitlens",
      "ms-vscode.vscode-markdown"
    ],
    "unwantedRecommendations": [
      "coenraads.bracket-pair-colorizer",
      "coenraads.bracket-pair-colorizer-2"
    ]
  };
  
  return createFile(extensionsPath, JSON.stringify(extensions, null, 2), 'Extensions config');
}

// ============================================================================
// STEP 3: FIX WORKSPACE FILE
// ============================================================================

function createWorkspaceFile() {
  log('Creating workspace file...', 'info');
  
  const root = process.cwd();
  const workspaceName = path.basename(root);
  const workspacePath = path.join(root, `${workspaceName}.code-workspace`);
  
  backupFile(workspacePath);
  
  const workspace = {
    "folders": [
      {
        "path": ".",
        "name": workspaceName
      }
    ],
    "settings": {
      "claude-code.autoAccept": {
        "edit": true,
        "bash": false,
        "webfetch": true
      },
      "claude-code.model": "mimo-v2-flash",
      "claude-code.maxOutputTokens": null,
      "claude-code.enableAllProjectMcpServers": true
    },
    "extensions": {
      "recommendations": [
        "anthropics.claude-code",
        "ms-vscode.vscode-json",
        "ms-vscode.vscode-typescript-next",
        "esbenp.prettier-vscode",
        "dbaeumer.vscode-eslint"
      ]
    }
  };
  
  return createFile(workspacePath, JSON.stringify(workspace, null, 2), 'Workspace file');
}

// ============================================================================
// STEP 4: FIX GLOBAL VSCODE SETTINGS
// ============================================================================

function fixGlobalSettings() {
  log('Fixing global VS Code settings...', 'info');
  
  ensureDirectory(VSCODE_DIR);
  
  const settingsPath = path.join(VSCODE_DIR, 'settings.json');
  backupFile(settingsPath);
  
  let existingSettings = {};
  if (fs.existsSync(settingsPath)) {
    try {
      existingSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch {
      existingSettings = {};
    }
  }
  
  const claudeSettings = {
    "claude-code.autoAccept": {
      "edit": true,
      "bash": false,
      "webfetch": true
    },
    "claude-code.model": "mimo-v2-flash",
    "claude-code.maxOutputTokens": null,
    "claude-code.enableAllProjectMcpServers": true,
    "claude-code.disableNonessentialTraffic": "1"
  };
  
  const mergedSettings = { ...existingSettings, ...claudeSettings };
  
  return createFile(settingsPath, JSON.stringify(mergedSettings, null, 2), 'Global settings');
}

// ============================================================================
// STEP 5: VERIFY INSTALLATION
// ============================================================================

function verifyInstallation() {
  log('Verifying Claude Code installation...', 'info');
  
  const checks = [];
  
  // Check if Claude Code extension is installed
  try {
    const result = execSync('code --list-extensions 2>/dev/null | grep claude-code || echo "not-found"', {
      encoding: 'utf8',
      stdio: 'pipe'
    }).trim();
    
    if (result.includes('claude-code')) {
      checks.push({ name: 'Claude Code Extension', status: '✅', detail: 'Installed' });
    } else {
      checks.push({ name: 'Claude Code Extension', status: '❌', detail: 'Not found' });
    }
  } catch {
    checks.push({ name: 'Claude Code Extension', status: '⚠️', detail: 'Unknown' });
  }
  
  // Check workspace settings
  const workspaceSettings = path.join(process.cwd(), '.vscode', 'settings.json');
  if (fs.existsSync(workspaceSettings)) {
    checks.push({ name: 'Workspace Settings', status: '✅', detail: 'Present' });
  } else {
    checks.push({ name: 'Workspace Settings', status: '❌', detail: 'Missing' });
  }
  
  // Check global settings
  const globalSettings = path.join(VSCODE_DIR, 'settings.json');
  if (fs.existsSync(globalSettings)) {
    checks.push({ name: 'Global Settings', status: '✅', detail: 'Present' });
  } else {
    checks.push({ name: 'Global Settings', status: '⚠️', detail: 'Optional' });
  }
  
  // Log results
  log('\n--- Verification Results ---', 'info');
  checks.forEach(check => {
    log(`${check.status} ${check.name}: ${check.detail}`, 'info');
  });
  
  return checks.filter(c => c.status === '✅').length >= 2;
}

// ============================================================================
// STEP 6: CREATE TROUBLESHOOTING GUIDE
// ============================================================================

function createTroubleshootingGuide() {
  log('Creating troubleshooting guide...', 'info');
  
  const content = `# IDE TROUBLESHOOTING GUIDE
**Generated by /fix-ide** | **${new Date().toISOString().split('T')[0]}**

## 🔧 Common Issues & Fixes

### Issue 1: Claude Code Command Not Found
**Symptom:** "claude: command not found"
**Fix:**
\`\`\`bash
# Install Claude Code CLI
npm install -g @anthropics/claude-code

# Verify installation
claude --version
\`\`\`

### Issue 2: Browser Opens on Every Tab
**Symptom:** Browser opens when opening new files
**Fix:**
1. Check ~/.claude/settings.local.json
2. Ensure "BROWSER": "none" is set
3. Restart Claude Code

### Issue 3: MCP Servers Not Connecting
**Symptom:** "MCP server not available"
**Fix:**
\`\`\`bash
# Run setup
node ~/.claude/EXECUTORS/setup-serena.js
node ~/.claude/EXECUTORS/setup-integrations.js
\`\`\`

### Issue 4: Token Limit Errors
**Symptom:** "Response exceeded token maximum"
**Fix:**
1. Remove CLAUDE_CODE_MAX_OUTPUT_TOKENS from settings
2. Use Xiaomi API (configured in settings.local.json)
3. Restart Claude Code

### Issue 5: /ralph-loop Command Missing
**Symptom:** Ralph-Loop command not visible
**Fix:**
\`\`\`bash
# Run Ralph-Loop setup
node ~/.claude/EXECUTORS/setup-ralph-loop.js
\`\`\`

## 🎯 Quick Commands

### Fix Everything
\`\`\`bash
cd /your/project
node ~/.claude/EXECUTORS/fix-vscode-ide.js
\`\`\`

### Verify Installation
\`\`\`bash
# Check extensions
code --list-extensions | grep claude

# Check settings
cat .vscode/settings.json
\`\`\`

### Restart Claude Code
\`\`\`bash
# Close all Claude Code instances
# Reopen with:
npx claude
\`\`\`

## 📋 Checklist
- [ ] Claude Code extension installed
- [ ] Workspace settings configured
- [ ] Global settings updated
- [ ] MCP servers running
- [ ] Token limits removed
- [ ] Ralph-Loop configured

## 📞 Support
If issues persist:
1. Run: node ~/.claude/EXECUTORS/setup-health.js
2. Check: ~/.claude/handover-log.md
3. Verify: All setup scripts completed

---
*Auto-generated by /fix-ide*
*Last updated: ${new Date().toISOString()}*
`;

  const guidePath = path.join(WORKSPACE_VSCODE, 'TROUBLESHOOTING.md');
  ensureDirectory(WORKSPACE_VSCODE);
  return createFile(guidePath, content, 'Troubleshooting guide');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  log('═══════════════════════════════════════════════════════════', 'info');
  log('🟣 VS CODE IDE FIXER - /fix-ide', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');
  
  const results = {
    workspaceSettings: fixWorkspaceSettings(),
    extensions: createExtensionsJson(),
    workspaceFile: createWorkspaceFile(),
    globalSettings: fixGlobalSettings(),
    verification: verifyInstallation(),
    troubleshooting: createTroubleshootingGuide()
  };
  
  const allSuccess = Object.values(results).every(r => r === true);
  
  log('\n═══════════════════════════════════════════════════════════', 'info');
  log('📊 FIX SUMMARY', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');
  
  if (allSuccess) {
    log('✅ IDE integration fixed successfully', 'success');
    log('\n📁 Created/Updated:', 'info');
    log('   • .vscode/settings.json', 'info');
    log('   • .vscode/extensions.json', 'info');
    log('   • *.code-workspace', 'info');
    log('   • ~/.vscode/settings.json', 'info');
    log('   • .vscode/TROUBLESHOOTING.md', 'info');
    log('\n💡 Restart VS Code and Claude Code', 'info');
  } else {
    log('⚠️ Some fixes failed - check logs above', 'warn');
  }
  
  log('\n═══════════════════════════════════════════════════════════', 'info');
  
  return allSuccess;
}

// Execute
if (require.main === module) {
  main().catch(error => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main };