#!/usr/bin/env node
/**
 * CONFIG SYNC - /start COMMAND
 * Version: 1.0 | Amp Pattern Integration
 * 
 * Syncs all global configs from ~/.claude/ to project directories
 * with 4-line concision and automatic initialization.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CLAUDE_DIR = path.join(process.env.HOME, '.claude');
const EXECUTORS_DIR = path.join(CLAUDE_DIR, 'EXECUTORS');
const CONFIGS_DIR = path.join(CLAUDE_DIR, 'CONFIGS');
const DOCUMENTATION_DIR = path.join(CLAUDE_DIR, 'DOCUMENTATION');
const PLUGINS_DIR = path.join(CLAUDE_DIR, 'PLUGINS');

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

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
    log(`Created: ${dir}`, 'success');
  }
}

function backupFile(filePath) {
  if (fs.existsSync(filePath)) {
    const backupPath = `${filePath}.backup.${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    log(`Backup: ${path.basename(filePath)}`, 'info');
  }
}

function syncFile(source, target, description) {
  try {
    if (fs.existsSync(source)) {
      backupFile(target);
      fs.copyFileSync(source, target);
      log(`✓ ${description}`, 'success');
      return true;
    } else {
      log(`⚠️ Source missing: ${description}`, 'warn');
      return false;
    }
  } catch (error) {
    log(`✗ ${description}: ${error.message}`, 'error');
    return false;
  }
}

function syncDirectory(sourceDir, targetDir, description) {
  try {
    if (!fs.existsSync(sourceDir)) {
      log(`⚠️ Source dir missing: ${description}`, 'warn');
      return false;
    }

    ensureDirectory(targetDir);
    
    const items = fs.readdirSync(sourceDir);
    let synced = 0;
    
    for (const item of items) {
      const sourcePath = path.join(sourceDir, item);
      const targetPath = path.join(targetDir, item);
      
      if (fs.statSync(sourcePath).isDirectory()) {
        syncDirectory(sourcePath, targetPath, `${description}/${item}`);
        synced++;
      } else if (item.endsWith('.js') || item.endsWith('.json') || item.endsWith('.md')) {
        syncFile(sourcePath, targetPath, `${description}/${item}`);
        synced++;
      }
    }
    
    log(`✓ ${description}: ${synced} items`, 'success');
    return true;
  } catch (error) {
    log(`✗ ${description}: ${error.message}`, 'error');
    return false;
  }
}

function findProjectRoot() {
  let cwd = process.cwd();
  while (cwd !== '/' && cwd !== process.env.HOME) {
    if (fs.existsSync(path.join(cwd, '.git')) || 
        fs.existsSync(path.join(cwd, 'package.json')) ||
        fs.existsSync(path.join(cwd, '.claude'))) {
      return cwd;
    }
    cwd = path.dirname(cwd);
  }
  return process.cwd();
}

// ============================================================================
// SYNC OPERATIONS
// ============================================================================

function syncGlobalConfigs() {
  log('Syncing global configurations...', 'info');
  
  const projectRoot = findProjectRoot();
  const projectClaudeDir = path.join(projectRoot, '.claude');
  
  ensureDirectory(projectClaudeDir);
  
  const syncs = [
    {
      source: path.join(CLAUDE_DIR, 'settings.local.json'),
      target: path.join(projectClaudeDir, 'settings.local.json'),
      desc: 'Settings'
    },
    {
      source: path.join(CLAUDE_DIR, 'CLAUDE.md'),
      target: path.join(projectClaudeDir, 'CLAUDE.md'),
      desc: 'Global instructions'
    },
    {
      source: path.join(CLAUDE_DIR, 'global.env'),
      target: path.join(projectClaudeDir, 'global.env'),
      desc: 'Secrets'
    }
  ];
  
  let allSuccess = true;
  for (const sync of syncs) {
    if (!syncFile(sync.source, sync.target, sync.desc)) {
      allSuccess = false;
    }
  }
  
  return allSuccess;
}

function syncExecutors() {
  log('Syncing executor scripts...', 'info');
  
  const projectRoot = findProjectRoot();
  const projectExecutors = path.join(projectRoot, '.claude', 'EXECUTORS');
  
  return syncDirectory(EXECUTORS_DIR, projectExecutors, 'EXECUTORS');
}

function syncConfigs() {
  log('Syncing configuration files...', 'info');
  
  const projectRoot = findProjectRoot();
  const projectConfigs = path.join(projectRoot, '.claude', 'CONFIGS');
  
  return syncDirectory(CONFIGS_DIR, projectConfigs, 'CONFIGS');
}

function syncDocumentation() {
  log('Syncing documentation...', 'info');
  
  const projectRoot = findProjectRoot();
  const projectDocs = path.join(projectRoot, '.claude', 'DOCUMENTATION');
  
  return syncDirectory(DOCUMENTATION_DIR, projectDocs, 'DOCUMENTATION');
}

function syncPlugins() {
  log('Syncing plugins...', 'info');
  
  const projectRoot = findProjectRoot();
  const projectPlugins = path.join(projectRoot, '.claude', 'PLUGINS');
  
  return syncDirectory(PLUGINS_DIR, projectPlugins, 'PLUGINS');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  log('═══════════════════════════════════════════════════════════', 'info');
  log('🚀 CONFIG SYNC - /start', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');
  
  const projectRoot = findProjectRoot();
  log(`Project: ${projectRoot}`, 'info');
  
  const results = {
    globalConfigs: syncGlobalConfigs(),
    executors: syncExecutors(),
    configs: syncConfigs(),
    documentation: syncDocumentation(),
    plugins: syncPlugins()
  };
  
  const allSuccess = Object.values(results).every(r => r === true);
  
  log('\n═══════════════════════════════════════════════════════════', 'info');
  log('📊 SYNC SUMMARY', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');
  
  if (allSuccess) {
    log('✅ All configs synced successfully', 'success');
    log('\n💡 Next: Run /init to initialize project', 'info');
  } else {
    log('⚠️ Some syncs failed - check logs above', 'warn');
  }
  
  log('═══════════════════════════════════════════════════════════', 'info');
  
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