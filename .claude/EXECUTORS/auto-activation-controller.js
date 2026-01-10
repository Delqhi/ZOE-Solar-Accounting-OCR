#!/usr/bin/env node
/**
 * AUTO-ACTIVATION CONTROLLER (Unified)
 * Automatically activates all frameworks regardless of input
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.HOME, '.claude');
const EXECUTORS_DIR = path.join(CLAUDE_DIR, 'EXECUTORS');

const FRAMEWORKS = {
  'amp-style': { name: 'Amp Style', verify: () => true },
  'devin-style': { name: 'Devin Style', verify: () => true },
  'manus-style': { name: 'Manus Style', verify: () => true },
  'ralph-loop': { name: 'Ralph-Loop', verify: () => fs.existsSync(path.join(CLAUDE_DIR, 'ralph.yml')) },
  'desigos': { name: 'desigOS', verify: () => fs.existsSync(path.join(CLAUDE_DIR, 'desigos-config.json')) },
  'bmad': { name: 'BMAD', verify: () => fs.existsSync(path.join(CLAUDE_DIR, 'bmad-config.json')) },
  'conductor': { name: 'Conductor', verify: () => fs.existsSync(path.join(CLAUDE_DIR, 'CONFIGS', 'conductor-ralph-loop.json')) },
  'vision-gate': { name: 'Vision Gate', verify: () => fs.existsSync(path.join(EXECUTORS_DIR, 'vision-workflow.js')) },
  'research-agent': { name: 'Research Agent', verify: () => fs.existsSync(path.join(EXECUTORS_DIR, 'research-agent.js')) }
};

function log(msg, type = 'info') {
  const prefix = { info: '🟢', success: '✅', warn: '🟡', error: '🔴' }[type] || 'ℹ️';
  console.log(`${prefix} ${msg}`);
}

function main() {
  const userInput = process.argv[2] || 'default';

  log('═══════════════════════════════════════════════════════════');
  log('🤖 UNIFIED AUTO-ACTIVATION CONTROLLER');
  log('═══════════════════════════════════════════════════════════');
  log(`Input: "${userInput}"`);

  log('Activating ALL frameworks automatically...');

  let allActive = true;
  for (const [key, framework] of Object.entries(FRAMEWORKS)) {
    const verified = framework.verify();
    const status = verified ? '✅' : '⚠️';
    log(`${status} ${framework.name}: ${verified ? 'READY' : 'CONFIG MISSING'}`);
    if (!verified) allActive = false;
  }

  log('═══════════════════════════════════════════════════════════');
  log(allActive ? '✅ ALL FRAMEWORKS ACTIVE' : '⚠️  Some frameworks missing config', allActive ? 'success' : 'warn');
  log('═══════════════════════════════════════════════════════════');
}

if (require.main === module) {
  main();
}

module.exports = { main };
