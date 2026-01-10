#!/usr/bin/env node
/**
 * AMP CONCISION MODE - /amp COMMAND
 * Version: 1.0 | Amp Pattern Integration
 * 
 * Strict 4-line output concision with oracle pattern for complexity
 * Enforces Amp Style (Sourcegraph) best practices.
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const MAX_LINES = 4;
const CLAUDE_DIR = path.join(process.env.HOME, '.claude');

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

function createTodoEntry(task) {
  const todoPath = path.join(process.cwd(), '.claude', 'todo.md');
  if (fs.existsSync(todoPath)) {
    let content = fs.readFileSync(todoPath, 'utf8');
    const timestamp = new Date().toISOString();
    
    if (!content.includes(`- [ ] ${task} (Amp`)) {
      content += `\n- [ ] ${task} (Amp: ${timestamp})`;
      fs.writeFileSync(todoPath, content, 'utf8');
      log(`✓ Added to todo.md`, 'success');
    }
  }
}

function createAmpLog(task, output) {
  const logPath = path.join(process.cwd(), '.claude', 'RESEARCH_LOG.md');
  const timestamp = new Date().toISOString();
  
  let content = '';
  if (fs.existsSync(logPath)) {
    content = fs.readFileSync(logPath, 'utf8');
  } else {
    content = '# Amp Concision Log\n\n';
  }
  
  content += `## ${timestamp}\n**Task:** ${task}\n**Output:** ${output}\n\n`;
  fs.writeFileSync(logPath, content, 'utf8');
}

// ============================================================================
// ORACLE PATTERN (Complex Tasks)
// ============================================================================

function oraclePattern(task) {
  log('Oracle pattern activated (complex task)', 'info');
  
  // For complex tasks, use simplified reasoning
  const analysis = analyzeComplexity(task);
  
  if (analysis.complexity > 7) {
    log('⚠️ High complexity detected', 'warn');
    log('Using oracle fallback...', 'info');
    return `Oracle: ${analysis.reasoning}`;
  }
  
  return null;
}

function analyzeComplexity(task) {
  const keywords = ['algorithm', 'architecture', 'design', 'research', 'analyze'];
  const matches = keywords.filter(k => task.toLowerCase().includes(k));
  
  return {
    complexity: matches.length,
    reasoning: matches.length > 0 ? `Requires ${matches.join(', ')} phase` : 'Simple task'
  };
}

// ============================================================================
// AMP OUTPUT GENERATOR
// ============================================================================

function generateAmpOutput(task) {
  // Check for complexity
  const oracle = oraclePattern(task);
  if (oracle) {
    return oracle;
  }
  
  // Generate 4-line output
  const lines = [
    `Task: ${task}`,
    `Status: In progress`,
    `Method: Amp concision`,
    `Next: Complete`
  ];
  
  return lines.join('\n');
}

function enforceConcision(output) {
  const lines = output.split('\n');
  
  if (lines.length > MAX_LINES) {
    log(`⚠️ Output exceeds ${MAX_LINES} lines, truncating...`, 'warn');
    return lines.slice(0, MAX_LINES).join('\n');
  }
  
  return output;
}

// ============================================================================
// AMP WORKFLOW
// ============================================================================

function executeAmpWorkflow(task) {
  log('Starting Amp workflow...', 'info');
  
  // Step 1: Environment check (Amp principle)
  log('1. Environment check', 'info');
  const root = process.cwd();
  const hasClaude = fs.existsSync(path.join(root, '.claude'));
  
  if (!hasClaude) {
    log('⚠️ No .claude directory found', 'warn');
    log('Run /init first', 'error');
    return false;
  }
  
  // Step 2: Todo management (Amp principle)
  log('2. Todo management', 'info');
  createTodoEntry(task);
  
  // Step 3: Generate output
  log('3. Generate output', 'info');
  let output = generateAmpOutput(task);
  
  // Step 4: Enforce concision
  log('4. Enforce concision', 'info');
  output = enforceConcision(output);
  
  // Step 5: Log results
  log('5. Log results', 'info');
  createAmpLog(task, output);
  
  // Display output
  log('\n--- AMP OUTPUT (4-line max) ---', 'info');
  console.log(output);
  
  return true;
}

// ============================================================================
// ORACLE FALLBACK SYSTEM
// ============================================================================

function oracleFallback(task) {
  log('Oracle fallback triggered', 'info');
  
  const fallbacks = {
    'research': 'Use Tavily MCP for research',
    'analyze': 'Use LSP for code analysis',
    'build': 'Use modular approach',
    'fix': 'Use Ralph-Loop for censorship',
    'design': 'Use desigOS patterns'
  };
  
  for (const [key, value] of Object.entries(fallbacks)) {
    if (task.toLowerCase().includes(key)) {
      return `Oracle: ${value}`;
    }
  }
  
  return 'Oracle: Use /devin for planning';
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const task = args[0] || 'Default task';
  
  log('═══════════════════════════════════════════════════════════', 'info');
  log('🟢 AMP CONCISION MODE - /amp', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');
  log(`Task: "${task}"`, 'info');
  log(`Max lines: ${MAX_LINES}`, 'info');
  
  const success = executeAmpWorkflow(task);
  
  log('\n═══════════════════════════════════════════════════════════', 'info');
  log('📊 AMP SUMMARY', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');
  
  if (success) {
    log('✅ Amp workflow complete', 'success');
    log('\n📋 Artifacts:', 'info');
    log('   • .claude/todo.md (Updated)', 'info');
    log('   • .claude/RESEARCH_LOG.md (Amp logs)', 'info');
    log('\n💡 Principle: 4-line concision, oracle for complexity', 'info');
  } else {
    log('❌ Amp workflow failed', 'error');
  }
  
  log('\n═══════════════════════════════════════════════════════════', 'info');
  
  return success;
}

// Execute
if (require.main === module) {
  main().catch(error => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main };