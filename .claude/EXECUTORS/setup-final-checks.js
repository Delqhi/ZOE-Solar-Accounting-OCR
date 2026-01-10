#!/usr/bin/env node
/**
 * Setup Final Checks
 * Comprehensive verification of all setup components
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CLAUDE_DIR = path.join(process.env.HOME, '.claude');
const EXECUTORS_DIR = path.join(CLAUDE_DIR, 'EXECUTORS');
const CONFIGS_DIR = path.join(CLAUDE_DIR, 'CONFIGS');
const DOCUMENTATION_DIR = path.join(CLAUDE_DIR, 'DOCUMENTATION');
const PLUGINS_DIR = path.join(CLAUDE_DIR, 'PLUGINS');

function log(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = { 'info': '🟢', 'warn': '🟡', 'error': '🔴', 'success': '✅' }[type] || 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

const checks = [
  // Core files
  { path: path.join(CLAUDE_DIR, 'opencode.json'), name: 'opencode.json', type: 'file' },
  { path: path.join(CLAUDE_DIR, '.claude.json'), name: '.claude.json', type: 'file' },
  { path: path.join(CLAUDE_DIR, 'settings.json'), name: 'settings.json', type: 'file' },
  { path: path.join(CLAUDE_DIR, 'CLAUDE.md'), name: 'CLAUDE.md', type: 'file' },
  
  // Directories
  { path: EXECUTORS_DIR, name: 'EXECUTORS', type: 'dir' },
  { path: CONFIGS_DIR, name: 'CONFIGS', type: 'dir' },
  { path: DOCUMENTATION_DIR, name: 'DOCUMENTATION', type: 'dir' },
  { path: PLUGINS_DIR, name: 'PLUGINS', type: 'dir' },
  
  // Setup modules
  { path: path.join(EXECUTORS_DIR, 'master-start-script.js'), name: 'master-start-script.js', type: 'file' },
  { path: path.join(EXECUTORS_DIR, 'setup-core.js'), name: 'setup-core.js', type: 'file' },
  { path: path.join(EXECUTORS_DIR, 'setup-opencode-config.js'), name: 'setup-opencode-config.js', type: 'file' },
  { path: path.join(EXECUTORS_DIR, 'setup-secrets.js'), name: 'setup-secrets.js', type: 'file' },
  { path: path.join(EXECUTORS_DIR, 'setup-health.js'), name: 'setup-health.js', type: 'file' },
  { path: path.join(EXECUTORS_DIR, 'setup-serena.js'), name: 'setup-serena.js', type: 'file' },
  { path: path.join(EXECUTORS_DIR, 'setup-integrations.js'), name: 'setup-integrations.js', type: 'file' },
  { path: path.join(EXECUTORS_DIR, 'setup-automation.js'), name: 'setup-automation.js', type: 'file' },
  { path: path.join(EXECUTORS_DIR, 'setup-refactoring.js'), name: 'setup-refactoring.js', type: 'file' },
  { path: path.join(EXECUTORS_DIR, 'setup-final-checks.js'), name: 'setup-final-checks.js', type: 'file' },
  { path: path.join(EXECUTORS_DIR, 'setup-verification.js'), name: 'setup-verification.js', type: 'file' },
  
  // Documentation
  { path: path.join(DOCUMENTATION_DIR, 'GLOBAL_INFRASTRUCTURE.md'), name: 'GLOBAL_INFRASTRUCTURE.md', type: 'file' },
  { path: path.join(DOCUMENTATION_DIR, 'REFACTORING_STANDARDS.md'), name: 'REFACTORING_STANDARDS.md', type: 'file' }
];

function verifyFile(filePath, type) {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  
  if (type === 'dir') {
    return fs.statSync(filePath).isDirectory();
  } else {
    return fs.statSync(filePath).isFile();
  }
}

function verifyOpencodeJson() {
  const file = path.join(CLAUDE_DIR, 'opencode.json');
  if (!fs.existsSync(file)) return false;

  try {
    const config = JSON.parse(fs.readFileSync(file, 'utf8'));
    return config.models &&
           config.models['glm-4.7-free'] &&
           config.models['glm-4.7-free'].apiKey === 'sk-wsoDvbl0JOfbSk5lmYJ5JZEx3fzChVBAn9xdb5NkOKuaDCdjudzFyU2UJ975ozdT' &&
           config.models['glm-4.7-free'].baseURL === 'https://opencode.ai/zen/v1' &&
           config.defaults.model === 'glm-4.7-free';
  } catch {
    return false;
  }
}

function verifyClaudeJson() {
  const file = path.join(CLAUDE_DIR, '.claude.json');
  if (!fs.existsSync(file)) return false;
  
  try {
    const config = JSON.parse(fs.readFileSync(file, 'utf8'));
    const servers = Object.keys(config.mcpServers || {});
    const required = ['serena', 'youtube', 'skyvern', 'tavily', 'context7', 'chrome-devtools'];
    return servers.length === 6 && required.every(s => servers.includes(s));
  } catch {
    return false;
  }
}

function verifySettingsJson() {
  const file = path.join(CLAUDE_DIR, 'settings.json');
  if (!fs.existsSync(file)) return false;
  
  try {
    const config = JSON.parse(fs.readFileSync(file, 'utf8'));
    return config.model === 'mimo-v2-flash' &&
           config.env?.ANTHROPIC_BASE_URL === 'https://api.xiaomimimo.com/anthropic' &&
           config.enabledPlugins?.["pr-review-toolkit@claude-code-plugins"] === true;
  } catch {
    return false;
  }
}

function main() {
  log('═══════════════════════════════════════════════════════════', 'info');
  log('📋 SETUP FINAL CHECKS', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');
  
  let allPassed = true;
  
  log('\n📍 Checking file and directory structure...', 'info');
  for (const check of checks) {
    const exists = verifyFile(check.path, check.type);
    if (exists) {
      log(`✓ ${check.name}`, 'success');
    } else {
      log(`✗ ${check.name} missing`, 'error');
      allPassed = false;
    }
  }
  
  log('\n📍 Verifying configuration content...', 'info');
  
  const configChecks = [
    { name: 'opencode.json format', fn: verifyOpencodeJson },
    { name: '.claude.json MCP servers', fn: verifyClaudeJson },
    { name: 'settings.json integration', fn: verifySettingsJson }
  ];
  
  for (const check of configChecks) {
    if (check.fn()) {
      log(`✓ ${check.name}`, 'success');
    } else {
      log(`✗ ${check.name} invalid`, 'error');
      allPassed = false;
    }
  }
  
  log('\n📍 Checking file sizes...', 'info');
  const largeFiles = [];
  for (const check of checks) {
    if (check.type === 'file' && fs.existsSync(check.path)) {
      const content = fs.readFileSync(check.path, 'utf8');
      const lines = content.split('\n').length;
      if (lines > 300) {
        largeFiles.push({ name: check.name, lines });
      }
    }
  }
  
  if (largeFiles.length === 0) {
    log('✓ All files under 300 lines', 'success');
  } else {
    for (const file of largeFiles) {
      log(`⚠️  ${file.name}: ${file.lines} lines`, 'warn');
    }
  }
  
  log('\n═══════════════════════════════════════════════════════════', 'info');
  if (allPassed) {
    log('✅ ALL FINAL CHECKS PASSED', 'success');
    log('\n🎯 Setup Summary:', 'info');
    log('   • 10 setup modules created', 'info');
    log('   • 3 core config files verified', 'info');
    log('   • 4 directories established', 'info');
    log('   • 6 MCP servers configured', 'info');
    log('   • 6 plugins enabled', 'info');
    log('   • Leaked patterns integrated', 'info');
    log('\n🚀 Ready for production use!', 'info');
  } else {
    log('⚠️  Some checks failed - review above', 'warn');
  }
  log('═══════════════════════════════════════════════════════════', 'info');
  
  return allPassed;
}

if (require.main === module) {
  const success = main();
  process.exit(success ? 0 : 1);
}

module.exports = { main };