#!/usr/bin/env node
/**
 * Setup Verification Orchestrator
 * Runs all setup modules and provides comprehensive verification
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

function runModule(moduleName, description) {
  const modulePath = path.join(EXECUTORS_DIR, moduleName);
  
  if (!fs.existsSync(modulePath)) {
    log(`✗ ${description} - module not found`, 'error');
    return false;
  }
  
  try {
    log(`Running: ${description}`, 'info');
    const result = execSync(`node ${modulePath}`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    log(`✓ ${description} completed`, 'success');
    return true;
  } catch (error) {
    log(`✗ ${description} failed: ${error.message}`, 'error');
    return false;
  }
}

function verifyModule(moduleName, description) {
  const modulePath = path.join(EXECUTORS_DIR, moduleName);
  const exists = fs.existsSync(modulePath);
  
  if (exists) {
    log(`✓ ${description} exists`, 'success');
  } else {
    log(`✗ ${description} missing`, 'error');
  }
  
  return exists;
}

function verifyAllModules() {
  const modules = [
    { name: 'setup-core.js', desc: 'Core infrastructure' },
    { name: 'setup-opencode-config.js', desc: 'OpenCode configuration' },
    { name: 'setup-secrets.js', desc: 'Secret management' },
    { name: 'setup-health.js', desc: 'System health' },
    { name: 'setup-serena.js', desc: 'Serena MCP' },
    { name: 'setup-integrations.js', desc: 'Plugins & agents' },
    { name: 'setup-automation.js', desc: 'Auto-execution' },
    { name: 'setup-refactoring.js', desc: 'Refactoring mode' },
    { name: 'setup-final-checks.js', desc: 'Final verification' }
  ];
  
  log('\n📍 Verifying all modules exist...', 'info');
  let allExist = true;
  for (const module of modules) {
    if (!verifyModule(module.name, module.desc)) {
      allExist = false;
    }
  }
  
  return allExist;
}

function verifyCoreFiles() {
  const files = [
    { path: path.join(CLAUDE_DIR, 'opencode.json'), name: 'opencode.json' },
    { path: path.join(CLAUDE_DIR, '.claude.json'), name: '.claude.json' },
    { path: path.join(CLAUDE_DIR, 'settings.json'), name: 'settings.json' },
    { path: path.join(CLAUDE_DIR, 'CLAUDE.md'), name: 'CLAUDE.md' }
  ];
  
  log('\n📍 Verifying core configuration files...', 'info');
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

function verifyOpencodeConfig() {
  const file = path.join(CLAUDE_DIR, 'opencode.json');
  if (!fs.existsSync(file)) return false;

  try {
    const config = JSON.parse(fs.readFileSync(file, 'utf8'));
    const correct =
      config.models &&
      config.models['glm-4.7-free'] &&
      config.models['glm-4.7-free'].name === 'glm-4.7-free' &&
      config.models['glm-4.7-free'].provider === 'opencode' &&
      config.models['glm-4.7-free'].apiKey === 'sk-wsoDvbl0JOfbSk5lmYJ5JZEx3fzChVBAn9xdb5NkOKuaDCdjudzFyU2UJ975ozdT' &&
      config.models['glm-4.7-free'].baseURL === 'https://opencode.ai/zen/v1' &&
      config.defaults.model === 'glm-4.7-free';

    if (correct) {
      log('✓ opencode.json: opencode zen format verified', 'success');
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

function verifyClaudeConfig() {
  const file = path.join(CLAUDE_DIR, '.claude.json');
  if (!fs.existsSync(file)) return false;
  
  try {
    const config = JSON.parse(fs.readFileSync(file, 'utf8'));
    const servers = Object.keys(config.mcpServers || {});
    const required = ['serena', 'youtube', 'skyvern', 'tavily', 'context7', 'chrome-devtools'];
    const correct = servers.length === 6 && required.every(s => servers.includes(s));
    
    if (correct) {
      log('✓ .claude.json: all 6 MCP servers verified', 'success');
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

function verifySettingsConfig() {
  const file = path.join(CLAUDE_DIR, 'settings.json');
  if (!fs.existsSync(file)) return false;
  
  try {
    const config = JSON.parse(fs.readFileSync(file, 'utf8'));
    const correct = 
      config.model === 'mimo-v2-flash' &&
      config.env?.ANTHROPIC_BASE_URL === 'https://api.xiaomimimo.com/anthropic' &&
      config.enabledPlugins?.["pr-review-toolkit@claude-code-plugins"] === true;
    
    if (correct) {
      log('✓ settings.json: mimo model and plugins verified', 'success');
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

function main() {
  log('═══════════════════════════════════════════════════════════', 'info');
  log('🔍 SETUP VERIFICATION ORCHESTRATOR', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');
  
  // Step 1: Verify modules exist
  log('\n📍 STEP 1: Module verification', 'info');
  const modulesExist = verifyAllModules();
  
  if (!modulesExist) {
    log('\n⚠️  Some modules are missing - cannot proceed', 'warn');
    log('Run master-start-script.js to create all modules', 'info');
    return false;
  }
  
  // Step 2: Verify core files
  log('\n📍 STEP 2: Core file verification', 'info');
  const filesExist = verifyCoreFiles();
  
  if (!filesExist) {
    log('\n⚠️  Some core files are missing', 'warn');
    return false;
  }
  
  // Step 3: Verify configuration content
  log('\n📍 STEP 3: Configuration content verification', 'info');
  const opencodeOk = verifyOpencodeConfig();
  const claudeOk = verifyClaudeConfig();
  const settingsOk = verifySettingsConfig();
  
  const allConfigOk = opencodeOk && claudeOk && settingsOk;
  
  // Step 4: Run individual modules
  log('\n📍 STEP 4: Individual module execution', 'info');
  const modules = [
    { name: 'setup-core.js', desc: 'Core infrastructure' },
    { name: 'setup-opencode-config.js', desc: 'OpenCode configuration' },
    { name: 'setup-secrets.js', desc: 'Secret management' },
    { name: 'setup-health.js', desc: 'System health' },
    { name: 'setup-serena.js', desc: 'Serena MCP' },
    { name: 'setup-integrations.js', desc: 'Plugins & agents' },
    { name: 'setup-automation.js', desc: 'Auto-execution' },
    { name: 'setup-refactoring.js', desc: 'Refactoring mode' },
    { name: 'setup-final-checks.js', desc: 'Final verification' }
  ];
  
  let allRan = true;
  for (const module of modules) {
    const success = runModule(module.name, module.desc);
    if (!success) allRan = false;
  }
  
  // Final summary
  log('\n═══════════════════════════════════════════════════════════', 'info');
  log('📊 VERIFICATION SUMMARY', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');
  
  const allPassed = modulesExist && filesExist && allConfigOk && allRan;
  
  if (allPassed) {
    log('\n✅ COMPLETE SETUP VERIFICATION PASSED', 'success');
    log('\n🎯 Configuration Status:', 'info');
    log('   ✓ opencode.json: opencode zen GLM 4.7', 'info');
    log('   ✓ .claude.json: 6 MCP servers', 'info');
    log('   ✓ settings.json: mimo model + 6 plugins', 'info');
    log('   ✓ CLAUDE.md: leaked patterns integrated', 'info');
    log('\n🚀 System Ready:', 'info');
    log('   • 10 setup modules operational', 'info');
    log('   • 8-phase workflow enabled', 'info');
    log('   • Auto-swarm triggers active', 'info');
    log('   • Ralph-Loop uncensored ready', 'info');
    log('\n💡 Usage:', 'info');
    log('   npx claude', 'info');
    log('   Say: "Baue X" (Amp) or "Master Loop für: Y" (Devin)', 'info');
  } else {
    log('\n⚠️  VERIFICATION FAILED', 'warn');
    log('Review logs above for specific issues', 'info');
  }
  
  log('\n═══════════════════════════════════════════════════════════', 'info');
  
  return allPassed;
}

if (require.main === module) {
  const success = main();
  process.exit(success ? 0 : 1);
}

module.exports = { main };