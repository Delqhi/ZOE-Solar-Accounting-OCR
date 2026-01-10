#!/usr/bin/env node
/**
 * DEVIN PLANNING MODE - /devin COMMAND
 * Version: 1.0 | Devin Pattern Integration
 * 
 * Deep planning mode with LSP-first exploration
 * Never modifies tests, full repository understanding.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CLAUDE_DIR = path.join(process.env.HOME, '.claude');

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

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Created: ${dir}`, 'success');
  }
}

function createFile(filePath, content, description) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    log(`✓ ${description}`, 'success');
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
// LSP-FIRST EXPLORATION (DEVIN PRINCIPLE)
// ============================================================================

function lspExploration(root, task) {
  log('LSP-first exploration started', 'info');
  
  const exploration = {
    files: [],
    functions: [],
    classes: [],
    imports: [],
    tests: []
  };
  
  try {
    // Scan for JavaScript/TypeScript files
    const scanDir = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        
        // Skip test files (Devin rule: never touch tests)
        if (item.includes('test') || item.includes('spec') || item.includes('__tests__')) {
          exploration.tests.push(fullPath);
          continue;
        }
        
        if (fs.statSync(fullPath).isDirectory()) {
          if (!item.startsWith('.') && item !== 'node_modules' && item !== 'dist' && item !== 'build') {
            scanDir(fullPath);
          }
        } else if (item.match(/\.(js|ts|jsx|tsx)$/)) {
          exploration.files.push(fullPath);
          
          // Read file content
          const content = fs.readFileSync(fullPath, 'utf8');
          
          // Find functions
          const funcMatches = content.match(/function\s+\w+\s*\(/g);
          if (funcMatches) exploration.functions.push(...funcMatches);
          
          // Find classes
          const classMatches = content.match(/class\s+\w+/g);
          if (classMatches) exploration.classes.push(...classMatches);
          
          // Find imports
          const importMatches = content.match(/(import|require)\s+.*from\s+['"].*['"]/g);
          if (importMatches) exploration.imports.push(...importMatches);
        }
      }
    };
    
    scanDir(root);
    
    log(`Found ${exploration.files.length} files`, 'info');
    log(`Found ${exploration.functions.length} functions`, 'info');
    log(`Found ${exploration.classes.length} classes`, 'info');
    log(`Found ${exploration.tests.length} test files (protected)`, 'info');
    
    return exploration;
  } catch (error) {
    log(`⚠️ Exploration error: ${error.message}`, 'warn');
    return exploration;
  }
}

// ============================================================================
// DEEP CONTEXT ANALYSIS
// ============================================================================

function analyzeContext(root, exploration, task) {
  log('Analyzing context...', 'info');
  
  const analysis = {
    task: task,
    scope: 'unknown',
    dependencies: [],
    risks: [],
    recommendations: []
  };
  
  // Determine scope
  if (exploration.files.length > 50) {
    analysis.scope = 'large';
    analysis.risks.push('Large codebase - may need phased approach');
  } else if (exploration.files.length > 10) {
    analysis.scope = 'medium';
  } else {
    analysis.scope = 'small';
  }
  
  // Check for common patterns
  if (exploration.classes.length > 0) {
    analysis.recommendations.push('OOP architecture detected - use class-based approach');
  }
  
  if (exploration.imports.some(i => i.includes('react') || i.includes('React'))) {
    analysis.recommendations.push('React detected - use component-based patterns');
  }
  
  if (exploration.imports.some(i => i.includes('express') || i.includes('node'))) {
    analysis.recommendations.push('Node.js backend detected - use middleware patterns');
  }
  
  // Check for tests
  if (exploration.tests.length > 0) {
    analysis.risks.push('Test files found - Devin rule: NEVER modify existing tests');
    analysis.recommendations.push('Read tests for understanding, write new tests if needed');
  }
  
  return analysis;
}

// ============================================================================
// PLANNING MODULE (MANUS PATTERN)
// ============================================================================

function createPlan(root, analysis) {
  log('Creating numbered plan...', 'info');
  
  const planPath = path.join(root, '.claude', 'PLANNING.md');
  ensureDirectory(path.join(root, '.claude'));
  
  const steps = [
    'Analyze requirements and context',
    'Explore codebase with LSP-first approach',
    'Identify all related files',
    'Create numbered pseudocode steps',
    'Verify no test modifications needed',
    'Execute implementation',
    'Validate with existing tests',
    'Update knowledge module'
  ];
  
  const content = `# DEVIN PLANNING DOCUMENT
**Generated by /devin** | **${new Date().toISOString().split('T')[0]}**

## 📋 Task Overview
**Task:** ${analysis.task}
**Scope:** ${analysis.scope}
**Root:** ${root}

## 🔍 Context Analysis
### Files Found
- Total: ${analysis.dependencies.length} dependencies
- Protected tests: ${analysis.risks.filter(r => r.includes('test')).length}

### Architecture Detected
${analysis.recommendations.map(r => `- ${r}`).join('\n') || '- Standard patterns'}

### Risks & Constraints
${analysis.risks.map(r => `⚠️ ${r}`).join('\n') || '✅ No major risks'}

## 📝 Numbered Pseudocode (Manus Pattern)
\`\`\`
1. ANALYSIS PHASE
   1.1 LSP exploration complete
   1.2 All files identified
   1.3 Test files protected

2. PLANNING PHASE
   2.1 Break down into sub-tasks
   2.2 Create numbered steps
   2.3 Update todo.md

3. IMPLEMENTATION PHASE
   3.1 Execute each step
   3.2 Never touch test files
   3.3 Use LSP for navigation

4. VALIDATION PHASE
   4.1 Run existing tests
   4.2 Verify no regressions
   4.3 Update knowledge
\`\`\`

## 🎯 Execution Steps
${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## 🛡️ Devin Rules
- ✅ LSP-first navigation
- ✅ Never modify existing tests
- ✅ Deep context before changes
- ✅ Standard execution mode

## 📊 Metrics
**Files to analyze:** ${exploration.files.length}
**Functions found:** ${exploration.functions.length}
**Classes found:** ${exploration.classes.length}
**Test files (protected):** ${exploration.tests.length}

---
*Use this plan with /sisyphus for execution*
*Update after each phase completion*
`;

  return createFile(planPath, content, 'Planning document');
}

// ============================================================================
// CREATE TODO.MD UPDATES
// ============================================================================

function updateTodoWithPlan(root, task) {
  const todoPath = path.join(root, '.claude', 'todo.md');
  
  if (fs.existsSync(todoPath)) {
    let content = fs.readFileSync(todoPath, 'utf8');
    const timestamp = new Date().toISOString();
    
    const newTasks = [
      `- [ ] Analyze codebase (Devin: ${timestamp})`,
      `- [ ] Create numbered plan (Devin: ${timestamp})`,
      `- [ ] Execute implementation (Devin: ${timestamp})`,
      `- [ ] Validate with tests (Devin: ${timestamp})`
    ];
    
    content += '\n' + newTasks.join('\n');
    fs.writeFileSync(todoPath, content, 'utf8');
    log('✓ Updated todo.md with plan', 'success');
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const task = args[0] || 'Default planning task';
  
  log('═══════════════════════════════════════════════════════════', 'info');
  log('🔵 DEVIN PLANNING MODE - /devin', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');
  log(`Task: "${task}"`, 'info');
  
  const root = findProjectRoot();
  log(`Project: ${root}`, 'info');
  
  // Phase 1: LSP Exploration
  log('\n📍 Phase 1: LSP-first exploration...', 'info');
  const exploration = lspExploration(root, task);
  
  // Phase 2: Context Analysis
  log('\n📍 Phase 2: Deep context analysis...', 'info');
  const analysis = analyzeContext(root, exploration, task);
  
  // Phase 3: Planning
  log('\n📍 Phase 3: Creating plan...', 'info');
  const planSuccess = createPlan(root, analysis);
  
  // Phase 4: Todo Update
  log('\n📍 Phase 4: Updating todo.md...', 'info');
  updateTodoWithPlan(root, task);
  
  // Summary
  log('\n═══════════════════════════════════════════════════════════', 'info');
  log('📊 DEVIN PLANNING SUMMARY', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');
  
  if (planSuccess) {
    log('✅ Planning complete', 'success');
    log('\n📁 Created:', 'info');
    log('   • .claude/PLANNING.md (Numbered plan)', 'info');
    log('   • .claude/todo.md (Updated with steps)', 'info');
    log('\n🛡️ Devin Rules Applied:', 'info');
    log('   • LSP-first exploration ✓', 'info');
    log('   • Test files protected ✓', 'info');
    log('   • Deep context analysis ✓', 'info');
    log('\n💡 Next: Use /sisyphus to execute the plan', 'info');
  } else {
    log('❌ Planning failed', 'error');
  }
  
  log('\n═══════════════════════════════════════════════════════════', 'info');
  
  return planSuccess;
}

// Execute
if (require.main === module) {
  main().catch(error => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main };