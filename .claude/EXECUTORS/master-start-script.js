#!/usr/bin/env node
/**
 * MASTER START SCRIPT - CLAUDE CODE SETUP ORCHESTRATOR
 * Version: 3.0 | Modular Architecture
 *
 * Lightweight wrapper that delegates to modular components
 * Replaces monolithic 587-line script with 3 focused modules
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CLAUDE_DIR = path.join(process.env.HOME, '.claude');
const EXECUTORS_DIR = path.join(CLAUDE_DIR, 'EXECUTORS');

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

async function main() {
  log('═══════════════════════════════════════════════════════════', 'info');
  log('🚀 MASTER START SCRIPT - Modular Delegation', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');

  const userInput = process.argv[2] || 'default';

  // Delegate to orchestrator
  log('\n📍 Delegating to orchestrator.js...', 'info');
  try {
    const orchestrator = require(path.join(EXECUTORS_DIR, 'orchestrator.js'));
    await orchestrator.main();
  } catch (error) {
    log(`⚠️ Orchestrator not ready, running legacy mode: ${error.message}`, 'warn');

    // Fallback: Run setup-orchestrator
    try {
      execSync(`node ${path.join(EXECUTORS_DIR, 'setup-orchestrator.js')}`, {
        encoding: 'utf8',
        stdio: 'inherit'
      });

      // Then activation
      execSync(`node ${path.join(EXECUTORS_DIR, 'activation-controller.js')} "${userInput}"`, {
        encoding: 'utf8',
        stdio: 'inherit'
      });
    } catch (fallbackError) {
      log(`✗ Legacy mode failed: ${fallbackError.message}`, 'error');
      return false;
    }
  }

  log('\n═══════════════════════════════════════════════════════════', 'info');
  log('✅ Setup complete - Modular architecture active', 'success');
  log('\n💡 New modular commands:', 'info');
  log('   node ~/.claude/EXECUTORS/orchestrator.js', 'info');
  log('   node ~/.claude/EXECUTORS/activation-controller.js', 'info');
  log('   node ~/.claude/EXECUTORS/setup-orchestrator.js', 'info');
  log('\n📋 Command scripts:', 'info');
  log('   /start (config-sync) /init (init-project) /fix-ide', 'info');
  log('   /sisyphus (parallel) /amp (concision) /devin (planning)', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');

  return true;
}

// Execute
if (require.main === module) {
  main().catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { main };
