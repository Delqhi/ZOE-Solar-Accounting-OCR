#!/usr/bin/env node
/**
 * Setup Automation
 * Configures auto-execution and workflow automation
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.HOME, '.claude');
const SETTINGS_FILE = path.join(CLAUDE_DIR, 'settings.json');
const CLAUDE_JSON_FILE = path.join(CLAUDE_DIR, '.claude.json');

function log(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = { 'info': '🟢', 'warn': '🟡', 'error': '🔴', 'success': '✅' }[type] || 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function configureAutoAccept(config) {
  if (!config.autoAccept) {
    config.autoAccept = {};
  }
  
  // Enable auto-accept for safe operations
  config.autoAccept.edit = true;
  config.autoAccept.bash = false; // Keep bash interactive for safety
  config.autoAccept.webfetch = true;
  
  log('✓ Auto-accept configured', 'success');
  return config;
}

function configureAutoSwarm(config) {
  if (!config.autoSwarm) {
    config.autoSwarm = {};
  }
  
  // Enable auto-swarm triggers
  config.autoSwarm.enabled = true;
  config.autoSwarm.triggers = [
    "Baue",
    "Fix",
    "Create",
    "Entwickle",
    "Master Loop für",
    "Deploy"
  ];
  
  log('✓ Auto-swarm triggers configured', 'success');
  return config;
}

function configureWorkflow(config) {
  if (!config.workflow) {
    config.workflow = {};
  }
  
  // Enable 8-phase workflow
  config.workflow.phases = [
    "Analysis & Research",
    "Planning & Task Breakdown",
    "Implementation",
    "Testing & Validation",
    "Checkpoint Gate",
    "Deployment",
    "Monitoring & Feedback",
    "Vision Quality Gate"
  ];
  
  config.workflow.autoRetry = true;
  config.workflow.maxRetries = 3;
  
  log('✓ 8-phase workflow configured', 'success');
  return config;
}

function configureRalphLoop(config) {
  if (!config.ralphLoop) {
    config.ralphLoop = {};
  }
  
  // Enable Ralph-Loop for censorship handling
  config.ralphLoop.enabled = true;
  config.ralphLoop.fallbackModel = "zen/big-pickle";
  config.ralphLoop.handoverLog = path.join(CLAUDE_DIR, 'handover-log.md');
  
  log('✓ Ralph-Loop configured', 'success');
  return config;
}

function verifyAutomation(config) {
  const checks = [
    { 
      name: 'Auto-accept', 
      check: () => config.autoAccept?.edit === true && config.autoAccept?.webfetch === true
    },
    { 
      name: 'Auto-swarm', 
      check: () => config.autoSwarm?.enabled === true && (config.autoSwarm?.triggers || []).length >= 6
    },
    { 
      name: 'Workflow', 
      check: () => (config.workflow?.phases || []).length === 8 && config.workflow?.autoRetry === true
    },
    { 
      name: 'Ralph-Loop', 
      check: () => config.ralphLoop?.enabled === true && config.ralphLoop?.fallbackModel === "zen/big-pickle"
    }
  ];
  
  let allPassed = true;
  for (const check of checks) {
    if (check.check()) {
      log(`✓ ${check.name} verified`, 'success');
    } else {
      log(`✗ ${check.name} failed`, 'error');
      allPassed = false;
    }
  }
  
  return allPassed;
}

function main() {
  log('═══════════════════════════════════════════════════════════', 'info');
  log('⚙️  SETUP AUTOMATION', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');
  
  try {
    // Load settings.json
    if (!fs.existsSync(SETTINGS_FILE)) {
      log('✗ settings.json not found - run setup-core first', 'error');
      return false;
    }
    let settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    
    log('\n📍 Configuring auto-accept...', 'info');
    settings = configureAutoAccept(settings);
    
    log('\n📍 Configuring auto-swarm...', 'info');
    settings = configureAutoSwarm(settings);
    
    log('\n📍 Configuring workflow...', 'info');
    settings = configureWorkflow(settings);
    
    log('\n📍 Configuring Ralph-Loop...', 'info');
    settings = configureRalphLoop(settings);
    
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    
    log('\n📍 Verifying automation...', 'info');
    const verified = verifyAutomation(settings);
    
    log('\n═══════════════════════════════════════════════════════════', 'info');
    if (verified) {
      log('✅ Automation setup complete!', 'success');
      log('   Auto-accept: edit & webfetch', 'info');
      log('   Auto-swarm: 6 triggers', 'info');
      log('   Workflow: 8 phases', 'info');
      log('   Ralph-Loop: enabled', 'info');
    } else {
      log('⚠️  Some automation features may have issues', 'warn');
    }
    log('═══════════════════════════════════════════════════════════', 'info');
    
    return verified;
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'error');
    return false;
  }
}

if (require.main === module) {
  const success = main();
  process.exit(success ? 0 : 1);
}

module.exports = { main };