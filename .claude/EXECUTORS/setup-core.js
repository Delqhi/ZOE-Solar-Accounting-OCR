#!/usr/bin/env node
/**
 * SETUP CORE - Core Infrastructure Setup
 * Version: 3.0 | Ensures all required directories and base files exist
 * Enhanced: Node.js version check, npx availability, environment validation
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
  const prefix = {
    'info': '🟢',
    'warn': '🟡',
    'error': '🔴',
    'success': '✅'
  }[type] || 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Created directory: ${dir}`, 'success');
    return true;
  }
  log(`Directory exists: ${dir}`, 'info');
  return false;
}

function checkNodeVersion() {
  try {
    const version = process.version;
    const majorVersion = parseInt(version.slice(1).split('.')[0]);

    if (majorVersion >= 18) {
      log(`✓ Node.js ${version} (≥18 required)`, 'success');
      return true;
    } else {
      log(`✗ Node.js ${version} is too old (need ≥18)`, 'error');
      return false;
    }
  } catch (error) {
    log(`✗ Could not check Node.js version: ${error.message}`, 'error');
    return false;
  }
}

function checkNpxAvailable() {
  try {
    execSync('npx --version', { stdio: 'pipe' });
    log('✓ npx is available', 'success');
    return true;
  } catch (error) {
    log('✗ npx is not available', 'error');
    return false;
  }
}

function checkEnvironment() {
  log('Checking environment...', 'info');

  const required = ['HOME'];
  const missing = required.filter(env => !process.env[env]);

  if (missing.length === 0) {
    log('✓ All required environment variables present', 'success');
    return true;
  } else {
    log(`✗ Missing environment variables: ${missing.join(', ')}`, 'error');
    return false;
  }
}

function createBaseConfigFiles() {
  log('Creating base configuration files...', 'info');

  const settingsPath = path.join(CLAUDE_DIR, 'settings.json');
  const settingsLocalPath = path.join(CLAUDE_DIR, 'settings.local.json');
  const claudeMdPath = path.join(CLAUDE_DIR, 'CLAUDE.md');

  let allCreated = true;

  // Create settings.json if it doesn't exist
  if (!fs.existsSync(settingsPath)) {
    const defaultSettings = {
      "model": "mimo-v2-flash",
      "permissions": {
        "allow": [
          ".claude/plugins/cache/**",
          "**/scripts/ralph-loop-wrapper.sh*",
          "/Users/jeremy/.claude/plugins/**",
          "WebSearch",
          "WebFetch",
          "Task",
          "Bash(npx:*)"
        ],
        "defaultMode": "bypassPermissions"
      },
      "enableAllProjectMcpServers": true
    };

    fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
    log('✓ Created settings.json', 'success');
  } else {
    log('✓ settings.json exists', 'info');
  }

  // Create settings.local.json placeholder if it doesn't exist
  if (!fs.existsSync(settingsLocalPath)) {
    fs.writeFileSync(settingsLocalPath, JSON.stringify({}, null, 2));
    log('✓ Created settings.local.json', 'success');
  } else {
    log('✓ settings.local.json exists', 'info');
  }

  // Create CLAUDE.md placeholder if it doesn't exist
  if (!fs.existsSync(claudeMdPath)) {
    const defaultClaudeMd = `# CLAUDE.md - Global Instructions

**Version:** 1.0 | **Status:** Active

## Configuration
- Model: mimo-v2-flash
- MCP Servers: 6 configured
- Plugins: Multiple enabled

## Workflow
Use /start to sync configurations
Use /init to initialize projects

---
Generated: ${new Date().toISOString()}
`;
    fs.writeFileSync(claudeMdPath, defaultClaudeMd);
    log('✓ Created CLAUDE.md', 'success');
  } else {
    log('✓ CLAUDE.md exists', 'info');
  }

  return allCreated;
}

function main() {
  log('═══════════════════════════════════════════════════════════', 'info');
  log('🚀 SETUP CORE - Infrastructure & Validation', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');

  let allSuccess = true;

  // Step 1: Environment validation
  log('\n📍 Step 1: Environment validation', 'info');
  if (!checkEnvironment()) allSuccess = false;
  if (!checkNodeVersion()) allSuccess = false;
  if (!checkNpxAvailable()) allSuccess = false;

  // Step 2: Directory structure
  log('\n📍 Step 2: Directory structure', 'info');
  const dirs = [CLAUDE_DIR, EXECUTORS_DIR, CONFIGS_DIR, DOCUMENTATION_DIR, PLUGINS_DIR];
  let dirsCreated = 0;

  for (const dir of dirs) {
    if (ensureDirectory(dir)) dirsCreated++;
  }

  // Step 3: Base config files
  log('\n📍 Step 3: Base configuration files', 'info');
  if (!createBaseConfigFiles()) allSuccess = false;

  // Summary
  log('\n═══════════════════════════════════════════════════════════', 'info');
  if (allSuccess) {
    log('✅ Core infrastructure complete', 'success');
    log(`   Created ${dirsCreated} directories`, 'info');
    log('   All validations passed', 'info');
  } else {
    log('⚠️  Core infrastructure complete with warnings', 'warn');
    log('   Some validations failed but continuing...', 'info');
  }
  log('═══════════════════════════════════════════════════════════', 'info');

  return allSuccess;
}

if (require.main === module) {
  const success = main();
  process.exit(success ? 0 : 1);
}

module.exports = { main };