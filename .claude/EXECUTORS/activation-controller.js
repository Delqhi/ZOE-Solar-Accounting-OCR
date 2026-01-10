#!/usr/bin/env node
/**
 * ACTIVATION CONTROLLER - Auto-Framework Detection
 * Version: 2.0 | Multi-Framework Integration
 * 
 * Detects and activates all frameworks automatically
 * Enhanced with 7 frameworks + command scripts
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CLAUDE_DIR = path.join(process.env.HOME, '.claude');
const EXECUTORS_DIR = path.join(CLAUDE_DIR, 'EXECUTORS');
const CONFIGS_DIR = path.join(CLAUDE_DIR, 'CONFIGS');

// ============================================================================
// FRAMEWORK CONFIGURATIONS
// ============================================================================

const FRAMEWORK_CONFIGS = {
  'amp-style': {
    name: 'Amp Style (Concision)',
    triggers: ['baue', 'create', 'build', 'make', 'implement', 'implementiere'],
    activation: () => {
      log('🎯 Activating Amp Style (4-line concision)', 'info');
      return true; // Built-in
    }
  },
  'devin-style': {
    name: 'Devin Style (Planning)',
    triggers: ['master loop', 'plan', 'analyze', 'research', 'devin', 'analysiere'],
    activation: () => {
      log('🎯 Activating Devin Style (LSP-first planning)', 'info');
      return true; // Built-in
    }
  },
  'manus-style': {
    name: 'Manus Style (Agent Loop)',
    triggers: ['entwickle', 'agent', 'loop', 'manus', 'event', 'develop'],
    activation: () => {
      log('🎯 Activating Manus Style (Event-driven execution)', 'info');
      return true; // Built-in
    }
  },
  'ralph-loop': {
    name: 'Ralph-Loop (Uncensored)',
    triggers: ['fix', 'ralph', 'uncensored', 'handover', 'big pickle', 'error'],
    activation: () => {
      log('🎯 Activating Ralph-Loop (Censorship handling)', 'info');
      const ralphConfig = path.join(CLAUDE_DIR, 'ralph.yml');
      return fs.existsSync(ralphConfig);
    }
  },
  'desigos': {
    name: 'desigOS (Design System)',
    triggers: ['desig', 'design', 'ui', 'ux', 'frontend', 'desigos', 'layout'],
    activation: () => {
      log('🎯 Activating desigOS (Design framework)', 'info');
      const desigosConfig = path.join(CLAUDE_DIR, 'desigos-config.json');
      return fs.existsSync(desigosConfig);
    }
  },
  'bmad': {
    name: 'BMAD (Business Method)',
    triggers: ['bmad', 'business', 'method', 'strategy', 'analysis', 'requirements'],
    activation: () => {
      log('🎯 Activating BMAD (Business method)', 'info');
      const bmadConfig = path.join(CLAUDE_DIR, 'bmad-config.json');
      return fs.existsSync(bmadConfig);
    }
  },
  'conductor': {
    name: 'Conductor Track',
    triggers: ['conductor', 'workflow', 'orchestration', 'track', 'pipeline'],
    activation: () => {
      log('🎯 Activating Conductor Track (Orchestration)', 'info');
      const conductorConfig = path.join(CONFIGS_DIR, 'conductor-ralph-loop.json');
      return fs.existsSync(conductorConfig);
    }
  },
  'vision-gate': {
    name: 'Vision Quality Gate',
    triggers: ['vision', 'quality', 'ui check', 'visual', 'screenshot'],
    activation: () => {
      log('🎯 Activating Vision Quality Gate', 'info');
      const visionModule = path.join(EXECUTORS_DIR, 'vision-workflow.js');
      return fs.existsSync(visionModule);
    }
  },
  'research-agent': {
    name: 'Research Agent',
    triggers: ['research', 'phd', 'study', 'investigate', 'hypothesis'],
    activation: () => {
      log('🎯 Activating Research Agent', 'info');
      const researchModule = path.join(EXECUTORS_DIR, 'research-agent.js');
      return fs.existsSync(researchModule);
    }
  }
};

// ============================================================================
// COMMAND SCRIPT TRIGGERS
// ============================================================================

const COMMAND_SCRIPTS = {
  'config-sync': {
    triggers: ['/start', 'sync config', 'sync configs'],
    script: 'config-sync.js',
    desc: 'Sync global configs'
  },
  'init-project': {
    triggers: ['/init', 'init project', 'initialize'],
    script: 'init-project.js',
    desc: 'Initialize project'
  },
  'fix-ide': {
    triggers: ['/fix-ide', 'fix ide', 'vscode fix'],
    script: 'fix-vscode-ide.js',
    desc: 'Fix IDE integration'
  },
  'sisyphus': {
    triggers: ['/sisyphus', 'parallel', 'multi-agent', 'tmux'],
    script: 'sisyphus-tmux-integration.js',
    desc: 'Parallel execution'
  },
  'amp-command': {
    triggers: ['/amp', 'amp mode', 'strict concision'],
    script: 'amp-concision.js',
    desc: 'Amp concision mode'
  },
  'devin-command': {
    triggers: ['/devin', 'devin mode', 'planning mode'],
    script: 'devin-planning.js',
    desc: 'Devin planning mode'
  }
};

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

function runScript(scriptName, description) {
  const scriptPath = path.join(EXECUTORS_DIR, scriptName);
  
  if (!fs.existsSync(scriptPath)) {
    log(`⚠️ Script not found: ${scriptName}`, 'warn');
    return false;
  }
  
  try {
    log(`Executing: ${description}`, 'info');
    const result = require(scriptPath);
    if (result.main) {
      return result.main();
    }
    return true;
  } catch (error) {
    log(`✗ Failed: ${error.message}`, 'error');
    return false;
  }
}

// ============================================================================
// DETECTION LOGIC
// ============================================================================

function detectFrameworks(userInput) {
  const input = userInput.toLowerCase();
  const detected = [];
  
  for (const [key, config] of Object.entries(FRAMEWORK_CONFIGS)) {
    const matches = config.triggers.some(trigger => input.includes(trigger));
    if (matches) {
      detected.push(key);
    }
  }
  
  // If no specific triggers, activate ALL (default behavior)
  if (detected.length === 0) {
    log('ℹ️  No specific triggers detected - activating ALL frameworks', 'info');
    return Object.keys(FRAMEWORK_CONFIGS);
  }
  
  return detected;
}

function detectCommands(userInput) {
  const input = userInput.toLowerCase();
  const detected = [];
  
  for (const [key, config] of Object.entries(COMMAND_SCRIPTS)) {
    const matches = config.triggers.some(trigger => input.includes(trigger));
    if (matches) {
      detected.push({ key, ...config });
    }
  }
  
  return detected;
}

// ============================================================================
// ACTIVATION LOGIC
// ============================================================================

function activateFrameworks(userInput) {
  log('═══════════════════════════════════════════════════════════', 'info');
  log('🤖 AUTO-ACTIVATION SYSTEM - Multi-Framework', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');
  log(`Input: "${userInput}"`, 'info');
  
  // Check for command scripts first
  const commands = detectCommands(userInput);
  if (commands.length > 0) {
    log(`\n📋 Command detected: ${commands.map(c => c.desc).join(', ')}`, 'info');
    for (const cmd of commands) {
      const success = runScript(cmd.script, cmd.desc);
      if (success) {
        log(`✅ ${cmd.desc} executed`, 'success');
      }
    }
    return true;
  }
  
  // Framework activation
  const frameworksToActivate = detectFrameworks(userInput);
  log(`\n🎯 Detected frameworks: ${frameworksToActivate.join(', ')}`, 'info');
  
  let allActivated = true;
  for (const frameworkKey of frameworksToActivate) {
    const config = FRAMEWORK_CONFIGS[frameworkKey];
    const activated = config.activation();
    if (!activated) {
      log(`⚠️  Failed to activate ${config.name}`, 'warn');
      allActivated = false;
    }
  }
  
  if (allActivated) {
    log('\n✅ All frameworks activated successfully', 'success');
  } else {
    log('\n⚠️  Some frameworks failed to activate', 'warn');
  }
  
  log('═══════════════════════════════════════════════════════════', 'info');
  return allActivated;
}

// ============================================================================
// UNIFIED CONTROLLER
// ============================================================================

function createUnifiedController() {
  const controllerPath = path.join(EXECUTORS_DIR, 'auto-activation-controller.js');
  
  const controllerCode = `#!/usr/bin/env node
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
  console.log(\`\${prefix} \${msg}\`);
}

function main() {
  const userInput = process.argv[2] || 'default';

  log('═══════════════════════════════════════════════════════════');
  log('🤖 UNIFIED AUTO-ACTIVATION CONTROLLER');
  log('═══════════════════════════════════════════════════════════');
  log(\`Input: "\${userInput}"\`);

  log('Activating ALL frameworks automatically...');

  let allActive = true;
  for (const [key, framework] of Object.entries(FRAMEWORKS)) {
    const verified = framework.verify();
    const status = verified ? '✅' : '⚠️';
    log(\`\${status} \${framework.name}: \${verified ? 'READY' : 'CONFIG MISSING'}\`);
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
`;

  fs.writeFileSync(controllerPath, controllerCode, 'utf8');
  log(`✓ Unified activation controller created`, 'success');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const userInput = process.argv[2] || 'default';
  
  // Create unified controller if needed
  const unifiedPath = path.join(EXECUTORS_DIR, 'auto-activation-controller.js');
  if (!fs.existsSync(unifiedPath)) {
    createUnifiedController();
  }
  
  // Activate frameworks
  const success = activateFrameworks(userInput);
  
  return success;
}

// Execute
if (require.main === module) {
  main().catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { main };