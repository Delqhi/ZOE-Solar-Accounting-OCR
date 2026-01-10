#!/usr/bin/env node
/**
 * ORCHESTRATOR - Master Entry Point
 * Version: 2.0 | Modular Architecture
 * 
 * Main entry point that coordinates all setup and activation
 * Replaces monolithic master-start-script.js
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
    log(`Created directory: ${dir}`, 'success');
  }
}

function runModule(moduleName, description) {
  const modulePath = path.join(EXECUTORS_DIR, moduleName);
  
  if (!fs.existsSync(modulePath)) {
    log(`Module not found: ${moduleName}`, 'warn');
    return false;
  }
  
  try {
    log(`Running: ${description}`, 'info');
    execSync(`node ${modulePath}`, {
      encoding: 'utf8',
      stdio: 'inherit'
    });
    log(`✓ ${description} completed`, 'success');
    return true;
  } catch (error) {
    log(`✗ ${description} failed: ${error.message}`, 'error');
    return false;
  }
}

function verifyFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✓ ${description} exists`, 'success');
    return true;
  } else {
    log(`✗ ${description} missing`, 'error');
    return false;
  }
}

// ============================================================================
// WORKFLOW DEFINITIONS
// ============================================================================

const SETUP_WORKFLOW = [
  { name: 'setup-core.js', desc: 'Core infrastructure' },
  { name: 'setup-opencode-config.js', desc: 'OpenCode zen configuration' },
  { name: 'setup-secrets.js', desc: 'Secret management' },
  { name: 'setup-health.js', desc: 'System health check' },
  { name: 'setup-serena.js', desc: 'Serena MCP server' },
  { name: 'setup-integrations.js', desc: 'Plugins & agents' },
  { name: 'setup-automation.js', desc: 'Auto-execution setup' },
  { name: 'setup-refactoring.js', desc: 'Refactoring mode' },
  { name: 'setup-ralph-loop.js', desc: 'Ralph-Loop integration' },
  { name: 'setup-desigos.js', desc: 'desigOS integration' },
  { name: 'setup-bmad.js', desc: 'BMAD integration' },
  { name: 'setup-final-checks.js', desc: 'Final verification' },
  { name: 'setup-verification.js', desc: 'Verification orchestrator' }
];

const VERIFICATION_CHECKS = [
  { path: CLAUDE_DIR, name: '~/.claude directory' },
  { path: path.join(CLAUDE_DIR, 'opencode.json'), name: 'opencode.json' },
  { path: path.join(process.env.HOME, '.claude.json'), name: '.claude.json' },
  { path: path.join(CLAUDE_DIR, 'settings.json'), name: 'settings.json' },
  { path: path.join(CLAUDE_DIR, 'settings.local.json'), name: 'settings.local.json' },
  { path: path.join(CLAUDE_DIR, 'CLAUDE.md'), name: 'CLAUDE.md' },
  { path: path.join(CLAUDE_DIR, 'global.env'), name: 'global.env' },
  { path: path.join(CLAUDE_DIR, 'EXECUTORS'), name: 'EXECUTORS directory' },
  { path: path.join(CLAUDE_DIR, 'CONFIGS'), name: 'CONFIGS directory' },
  { path: path.join(CLAUDE_DIR, 'DOCUMENTATION'), name: 'DOCUMENTATION directory' },
  { path: path.join(CLAUDE_DIR, 'PLUGINS'), name: 'PLUGINS directory' },
  { path: path.join(CLAUDE_DIR, 'AGENTS'), name: 'AGENTS directory' },
  { path: path.join(CLAUDE_DIR, 'SKILLS'), name: 'SKILLS directory' },
  { path: path.join(CLAUDE_DIR, 'RULES'), name: 'RULES directory' },
  { path: path.join(CLAUDE_DIR, 'HOOKS'), name: 'HOOKS directory' },
  { path: path.join(CLAUDE_DIR, 'MEMORY'), name: 'MEMORY directory' },
  { path: path.join(CLAUDE_DIR, 'handover-log.md'), name: 'handover-log.md' },
  { path: path.join(CLAUDE_DIR, 'ralph.yml'), name: 'ralph.yml' },
  { path: path.join(CLAUDE_DIR, 'desigos-config.json'), name: 'desigOS configuration' },
  { path: path.join(CLAUDE_DIR, 'bmad-config.json'), name: 'BMAD configuration' }
];

// ============================================================================
// STEP 1: CREATE WORKTREE DIRECTORIES
// ============================================================================

function createWorktree() {
  log('\n📍 Step 1: Creating complete Worktree structure...', 'info');
  
  const directories = [
    CLAUDE_DIR,
    path.join(CLAUDE_DIR, 'EXECUTORS'),
    path.join(CLAUDE_DIR, 'CONFIGS'),
    path.join(CLAUDE_DIR, 'DOCUMENTATION'),
    path.join(CLAUDE_DIR, 'PLUGINS'),
    path.join(CLAUDE_DIR, 'AGENTS'),
    path.join(CLAUDE_DIR, 'SKILLS'),
    path.join(CLAUDE_DIR, 'RULES'),
    path.join(CLAUDE_DIR, 'HOOKS'),
    path.join(CLAUDE_DIR, 'MEMORY')
  ];
  
  directories.forEach(dir => ensureDirectory(dir));
  log('✓ All 9 Worktree directories created', 'success');
  return true;
}

// ============================================================================
// STEP 2: RUN SETUP WORKFLOW
// ============================================================================

function runSetupWorkflow() {
  log('\n📍 Step 2: Running modular workflow...', 'info');
  
  let allSuccess = true;
  
  for (const module of SETUP_WORKFLOW) {
    const success = runModule(module.name, module.desc);
    if (!success) {
      allSuccess = false;
      log(`⚠️  Continuing despite failure in ${module.desc}...`, 'warn');
    }
  }
  
  return allSuccess;
}

// ============================================================================
// STEP 3: AUTO-ACTIVATION
// ============================================================================

function runAutoActivation() {
  log('\n📍 Step 3: Running auto-activation...', 'info');
  
  const activationModule = path.join(EXECUTORS_DIR, 'activation-controller.js');
  
  if (!fs.existsSync(activationModule)) {
    log('⚠️ Activation controller not found, creating...', 'warn');
    const createSuccess = runModule('master-start-script.js', 'Create activation controller');
    if (!createSuccess) {
      log('✗ Failed to create activation controller', 'error');
      return false;
    }
  }
  
  const userInput = process.argv[2] || 'default';
  try {
    execSync(`node ${activationModule} "${userInput}"`, {
      encoding: 'utf8',
      stdio: 'inherit'
    });
    return true;
  } catch (error) {
    log(`✗ Auto-activation failed: ${error.message}`, 'error');
    return false;
  }
}

// ============================================================================
// STEP 4: FINAL VERIFICATION
// ============================================================================

function runFinalVerification() {
  log('\n📍 Step 4: Final verification...', 'info');
  
  let allVerified = true;
  
  for (const check of VERIFICATION_CHECKS) {
    const verified = verifyFile(check.path, check.name);
    if (!verified) {
      allVerified = false;
    }
  }
  
  return allVerified;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  log('═══════════════════════════════════════════════════════════', 'info');
  log('🚀 ORCHESTRATOR - Master Entry Point', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');
  
  // Execute all steps
  const results = {
    worktree: createWorktree(),
    workflow: runSetupWorkflow(),
    activation: runAutoActivation(),
    verification: runFinalVerification()
  };
  
  // Summary
  log('\n═══════════════════════════════════════════════════════════', 'info');
  log('📊 ORCHESTRATOR SUMMARY', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');
  
  const allSuccess = Object.values(results).every(r => r === true);
  
  if (allSuccess) {
    log('✅ ALL CHECKS PASSED - Setup complete!', 'success');
    log('\n🎯 Frameworks Available:', 'info');
    log('   🟢 Amp Style (Concision) - "Baue X"', 'info');
    log('   🔵 Devin Style (Planning) - "Master Loop für: X"', 'info');
    log('   🟡 Manus Style (Agent Loop) - "Entwickle X"', 'info');
    log('   🟣 Ralph-Loop (Uncensored) - Auto-handover', 'info');
    log('   🎨 desigOS (Design System) - "Design X"', 'info');
    log('   📊 BMAD (Business Method) - "Business X"', 'info');
    log('   🚀 Conductor Track - Full orchestration', 'info');
    log('\n📖 Next steps:', 'info');
    log('   1. npx claude', 'info');
    log('   2. Say ANYTHING - All frameworks auto-activate!', 'info');
    log('   3. Or use: node ~/.claude/EXECUTORS/orchestrator.js', 'info');
  } else {
    log('⚠️ Some checks failed - please review logs above', 'warn');
    log('\n🔧 To retry:', 'info');
    log('   node ~/.claude/EXECUTORS/orchestrator.js', 'info');
  }
  
  log('\n═══════════════════════════════════════════════════════════', 'info');
  
  return allSuccess;
}

// Execute
if (require.main === module) {
  main().catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { main };