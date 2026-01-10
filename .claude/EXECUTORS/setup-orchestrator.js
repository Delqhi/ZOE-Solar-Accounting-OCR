#!/usr/bin/env node
/**
 * SETUP ORCHESTRATOR - Modular Setup Workflow
 * Version: 2.0 | SRP Compliant
 * 
 * Executes setup workflow in modular fashion
 * Each module handles one responsibility
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CLAUDE_DIR = path.join(process.env.HOME, '.claude');
const EXECUTORS_DIR = path.join(CLAUDE_DIR, 'EXECUTORS');

// ============================================================================
// SETUP MODULES
// ============================================================================

const SETUP_MODULES = [
  {
    name: 'setup-core.js',
    desc: 'Core infrastructure',
    purpose: 'Creates base directories and environment',
    weight: 10
  },
  {
    name: 'setup-opencode-config.js',
    desc: 'OpenCode zen configuration',
    purpose: 'Configures GLM 4.7 model',
    weight: 9
  },
  {
    name: 'setup-secrets.js',
    desc: 'Secret management',
    purpose: 'Creates global.env with API keys',
    weight: 10
  },
  {
    name: 'setup-health.js',
    desc: 'System health check',
    purpose: 'Verifies all components',
    weight: 8
  },
  {
    name: 'setup-serena.js',
    desc: 'Serena MCP server',
    purpose: 'File manipulation MCP',
    weight: 9
  },
  {
    name: 'setup-integrations.js',
    desc: 'Plugins & agents',
    purpose: 'Installs all plugins',
    weight: 9
  },
  {
    name: 'setup-automation.js',
    desc: 'Auto-execution setup',
    purpose: 'Configures triggers',
    weight: 8
  },
  {
    name: 'setup-refactoring.js',
    desc: 'Refactoring mode',
    purpose: 'Code quality rules',
    weight: 7
  },
  {
    name: 'setup-ralph-loop.js',
    desc: 'Ralph-Loop integration',
    purpose: 'Uncensored handover',
    weight: 9
  },
  {
    name: 'setup-designOS.js',
    desc: 'designOS integration',
    purpose: 'Design system',
    weight: 8
  },
  {
    name: 'setup-bmad.js',
    desc: 'BMAD integration',
    purpose: 'Business method',
    weight: 8
  },
  {
    name: 'setup-final-checks.js',
    desc: 'Final verification',
    purpose: 'Pre-flight checks',
    weight: 10
  },
  {
    name: 'setup-verification.js',
    desc: 'Verification orchestrator',
    purpose: 'Complete validation',
    weight: 10
  }
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function log(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = {
    'info': '🔵',
    'warn': '🟡',
    'error': '🔴',
    'success': '✅'
  }[type] || 'ℹ️';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function runModule(moduleName, description) {
  const modulePath = path.join(EXECUTORS_DIR, moduleName);
  
  if (!fs.existsSync(modulePath)) {
    log(`⚠️ Module not found: ${moduleName}`, 'warn');
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

function calculateProgress(current, total, weight) {
  const percentage = Math.round((current / total) * 100);
  const bars = Math.round(percentage / 5);
  return `[${'█'.repeat(bars).padEnd(20, '░')}] ${percentage}%`;
}

// ============================================================================
// EXECUTION STRATEGIES
// ============================================================================

function executeSequential() {
  log('Executing setup modules sequentially...', 'info');
  
  let allSuccess = true;
  let completed = 0;
  const total = SETUP_MODULES.length;
  
  for (const module of SETUP_MODULES) {
    log(`\n--- ${module.desc} (${module.weight}/10 priority) ---`, 'info');
    log(`Purpose: ${module.purpose}`, 'info');
    log(`Progress: ${calculateProgress(completed, total)}`, 'info');
    
    const success = runModule(module.name, module.desc);
    
    if (!success) {
      allSuccess = false;
      log(`⚠️  Continuing despite failure...`, 'warn');
    }
    
    completed++;
  }
  
  return allSuccess;
}

function executeParallel() {
  log('Executing high-priority modules in parallel...', 'info');
  
  const highPriority = SETUP_MODULES.filter(m => m.weight >= 9);
  const lowPriority = SETUP_MODULES.filter(m => m.weight < 9);
  
  log(`High priority: ${highPriority.length} modules`, 'info');
  log(`Low priority: ${lowPriority.length} modules`, 'info');
  
  // Execute high priority in parallel (simulated)
  log('\n--- Phase 1: High Priority (Parallel) ---', 'info');
  let allSuccess = true;
  
  for (const module of highPriority) {
    const success = runModule(module.name, module.desc);
    if (!success) allSuccess = false;
  }
  
  // Execute low priority sequentially
  log('\n--- Phase 2: Low Priority (Sequential) ---', 'info');
  for (const module of lowPriority) {
    const success = runModule(module.name, module.desc);
    if (!success) allSuccess = false;
  }
  
  return allSuccess;
}

function executeSelective(modules) {
  log(`Executing ${modules.length} selected modules...`, 'info');
  
  let allSuccess = true;
  
  for (const moduleName of modules) {
    const module = SETUP_MODULES.find(m => m.name === moduleName);
    if (module) {
      const success = runModule(module.name, module.desc);
      if (!success) allSuccess = false;
    } else {
      log(`⚠️ Unknown module: ${moduleName}`, 'warn');
    }
  }
  
  return allSuccess;
}

// ============================================================================
// MODULE MANAGEMENT
// ============================================================================

function listModules() {
  log('\nAvailable Setup Modules:', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');
  
  SETUP_MODULES.forEach((module, index) => {
    const marker = module.weight >= 9 ? '🔴' : module.weight >= 8 ? '🟡' : '🟢';
    log(`${marker} ${module.name}`, 'info');
    log(`   ${module.desc} (Priority: ${module.weight})`, 'info');
    log(`   Purpose: ${module.purpose}`, 'info');
  });
  
  log('═══════════════════════════════════════════════════════════', 'info');
}

function getModuleStatus() {
  log('\nModule Status Check:', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');
  
  let available = 0;
  let missing = 0;
  
  for (const module of SETUP_MODULES) {
    const modulePath = path.join(EXECUTORS_DIR, module.name);
    const exists = fs.existsSync(modulePath);
    
    if (exists) {
      available++;
      log(`✅ ${module.name}`, 'info');
    } else {
      missing++;
      log(`❌ ${module.name}`, 'error');
    }
  }
  
  log('═══════════════════════════════════════════════════════════', 'info');
  log(`Available: ${available}/${SETUP_MODULES.length}`, 'info');
  log(`Missing: ${missing}/${SETUP_MODULES.length}`, 'info');
  
  return missing === 0;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'sequential';
  
  log('═══════════════════════════════════════════════════════════', 'info');
  log('🔵 SETUP ORCHESTRATOR', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');
  log(`Mode: ${mode}`, 'info');
  
  let success = false;
  
  switch(mode) {
    case 'list':
      listModules();
      success = true;
      break;
      
    case 'status':
      success = getModuleStatus();
      break;
      
    case 'parallel':
      success = executeParallel();
      break;
      
    case 'selective':
      const modules = args.slice(1);
      if (modules.length === 0) {
        log('⚠️ No modules specified', 'warn');
        log('Usage: node setup-orchestrator.js selective setup-core.js setup-serena.js', 'info');
        success = false;
      } else {
        success = executeSelective(modules);
      }
      break;
      
    case 'sequential':
    default:
      success = executeSequential();
      break;
  }
  
  log('\n═══════════════════════════════════════════════════════════', 'info');
  log('📊 SETUP SUMMARY', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');
  
  if (success) {
    log('✅ Setup orchestration complete', 'success');
    log('\n💡 Usage:', 'info');
    log('   node setup-orchestrator.js list      - Show all modules', 'info');
    log('   node setup-orchestrator.js status    - Check status', 'info');
    log('   node setup-orchestrator.js sequential - Run all', 'info');
    log('   node setup-orchestrator.js parallel   - Priority-based', 'info');
    log('   node setup-orchestrator.js selective [modules] - Select modules', 'info');
  } else {
    log('❌ Setup orchestration failed', 'error');
  }
  
  log('\n═══════════════════════════════════════════════════════════', 'info');
  
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