#!/usr/bin/env node
/**
 * Setup Health Check
 * Validates system health and dependencies
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CLAUDE_DIR = path.join(process.env.HOME, '.claude');
const EXECUTORS_DIR = path.join(CLAUDE_DIR, 'EXECUTORS');

function log(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = { 'info': '🟢', 'warn': '🟡', 'error': '🔴', 'success': '✅' }[type] || 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function checkNodeVersion() {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);
  if (major >= 18) {
    log(`✓ Node.js ${version} (supported)`, 'success');
    return true;
  } else {
    log(`✗ Node.js ${version} (requires 18+)`, 'error');
    return false;
  }
}

function checkNpxAvailable() {
  try {
    execSync('npx --version', { stdio: 'pipe' });
    log('✓ npx available', 'success');
    return true;
  } catch {
    log('✗ npx not available', 'error');
    return false;
  }
}

function checkDirectoryStructure() {
  const dirs = [
    CLAUDE_DIR,
    EXECUTORS_DIR,
    path.join(CLAUDE_DIR, 'CONFIGS'),
    path.join(CLAUDE_DIR, 'DOCUMENTATION'),
    path.join(CLAUDE_DIR, 'PLUGINS')
  ];
  
  let allExist = true;
  for (const dir of dirs) {
    if (fs.existsSync(dir)) {
      log(`✓ ${path.basename(dir)} directory exists`, 'success');
    } else {
      log(`✗ ${path.basename(dir)} directory missing`, 'error');
      allExist = false;
    }
  }
  return allExist;
}

function checkRequiredFiles() {
  const files = [
    { path: path.join(CLAUDE_DIR, 'opencode.json'), name: 'opencode.json' },
    { path: path.join(CLAUDE_DIR, '.claude.json'), name: '.claude.json' },
    { path: path.join(CLAUDE_DIR, 'settings.json'), name: 'settings.json' },
    { path: path.join(CLAUDE_DIR, 'CLAUDE.md'), name: 'CLAUDE.md' }
  ];
  
  let allExist = true;
  for (const file of files) {
    if (fs.existsSync(file.path)) {
      log(`✓ ${file.name} exists`, 'success');
    } else {
      log(`✗ ${file.name} missing`, 'error');
      allExist = false;
    }
  }
  return allExist;
}

function checkOpencodeConfig() {
  const opencodePath = path.join(CLAUDE_DIR, 'opencode.json');
  if (!fs.existsSync(opencodePath)) {
    log('✗ opencode.json missing', 'error');
    return false;
  }

  try {
    const config = JSON.parse(fs.readFileSync(opencodePath, 'utf8'));
    const hasCorrectModel = config.models && config.models['glm-4.7-free'];
    const hasCorrectAPIKey = config.models?.['glm-4.7-free']?.apiKey === 'sk-wsoDvbl0JOfbSk5lmYJ5JZEx3fzChVBAn9xdb5NkOKuaDCdjudzFyU2UJ975ozdT';
    const hasCorrectBaseURL = config.models?.['glm-4.7-free']?.baseURL === 'https://opencode.ai/zen/v1';
    const hasCorrectDefaults = config.defaults?.model === 'glm-4.7-free';

    if (hasCorrectModel && hasCorrectAPIKey && hasCorrectBaseURL && hasCorrectDefaults) {
      log('✓ opencode.json: opencode zen GLM 4.7 format', 'success');
      return true;
    } else {
      log('✗ opencode.json: incorrect format', 'error');
      return false;
    }
  } catch {
    log('✗ opencode.json: invalid JSON', 'error');
    return false;
  }
}

function checkClaudeJson() {
  const claudePath = path.join(CLAUDE_DIR, '.claude.json');
  if (!fs.existsSync(claudePath)) {
    log('✗ .claude.json missing', 'error');
    return false;
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(claudePath, 'utf8'));
    const servers = Object.keys(config.mcpServers || {});
    const required = ['serena', 'youtube', 'skyvern', 'tavily', 'context7', 'chrome-devtools'];
    const hasAll = required.every(s => servers.includes(s));
    
    if (hasAll && servers.length === 6) {
      log(`✓ .claude.json: ${servers.length} MCP servers configured`, 'success');
      return true;
    } else {
      log('✗ .claude.json: missing servers', 'error');
      return false;
    }
  } catch {
    log('✗ .claude.json: invalid JSON', 'error');
    return false;
  }
}

function checkSettingsJson() {
  const settingsPath = path.join(CLAUDE_DIR, 'settings.json');
  if (!fs.existsSync(settingsPath)) {
    log('✗ settings.json missing', 'error');
    return false;
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    const hasMimo = config.model === 'mimo-v2-flash';
    const hasBaseUrl = config.env?.ANTHROPIC_BASE_URL === 'https://api.xiaomimimo.com/anthropic';
    
    if (hasMimo && hasBaseUrl) {
      log('✓ settings.json: mimo model configured', 'success');
      return true;
    } else {
      log('✗ settings.json: incorrect configuration', 'error');
      return false;
    }
  } catch {
    log('✗ settings.json: invalid JSON', 'error');
    return false;
  }
}

function checkEnvironmentVariables() {
  const required = ['OPENCODE_API_KEY', 'ANTHROPIC_API_KEY', 'TAVILY_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length === 0) {
    log('✓ All required environment variables present', 'success');
    return true;
  } else {
    log(`⚠️  Missing env vars: ${missing.join(', ')}`, 'warn');
    log('Note: These may be set in settings.json or opencode.json', 'info');
    return true; // Not critical
  }
}

function main() {
  log('═══════════════════════════════════════════════════════════', 'info');
  log('🩺 SYSTEM HEALTH CHECK', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');
  
  const checks = [
    { name: 'Node.js version', fn: checkNodeVersion },
    { name: 'npx availability', fn: checkNpxAvailable },
    { name: 'Directory structure', fn: checkDirectoryStructure },
    { name: 'Required files', fn: checkRequiredFiles },
    { name: 'OpenCode configuration', fn: checkOpencodeConfig },
    { name: 'Claude configuration', fn: checkClaudeJson },
    { name: 'Settings configuration', fn: checkSettingsJson },
    { name: 'Environment variables', fn: checkEnvironmentVariables }
  ];
  
  let allPassed = true;
  for (const check of checks) {
    log(`\n📍 ${check.name}...`, 'info');
    const passed = check.fn();
    if (!passed) allPassed = false;
  }
  
  log('\n═══════════════════════════════════════════════════════════', 'info');
  if (allPassed) {
    log('✅ ALL HEALTH CHECKS PASSED', 'success');
  } else {
    log('⚠️  Some checks failed - review logs above', 'warn');
  }
  log('═══════════════════════════════════════════════════════════', 'info');
  
  return allPassed;
}

if (require.main === module) {
  const success = main();
  process.exit(success ? 0 : 1);
}

module.exports = { main };