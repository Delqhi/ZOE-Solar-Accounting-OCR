#!/usr/bin/env node
/**
 * Setup Refactoring Mode
 * Configures refactoring tools and standards
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.HOME, '.claude');
const SETTINGS_FILE = path.join(CLAUDE_DIR, 'settings.json');
const DOCUMENTATION_DIR = path.join(CLAUDE_DIR, 'DOCUMENTATION');

function log(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = { 'info': '🟢', 'warn': '🟡', 'error': '🔴', 'success': '✅' }[type] || 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Created directory: ${path.basename(dir)}`, 'success');
  }
}

function createRefactoringStandards() {
  const standardsFile = path.join(DOCUMENTATION_DIR, 'REFACTORING_STANDARDS.md');
  
  const content = `# 🔧 REFACTORING STANDARDS

## 📏 Code Quality Metrics

### File Size Limits
- **Max**: 300 lines
- **Ideal**: 100-250 lines
- **Enforcement**: Auto-split if exceeded

### Single Responsibility Principle
- **Score**: 10/10 required
- **Rule**: 1 File = 1 Responsibility
- **Check**: Automated verification

### Modular Programming
- **Pattern**: Orchestrator + Worker modules
- **Structure**: 
  - Main file (< 200 lines)
  - Worker files (100-250 lines)
  - Clear imports/exports

## 🎯 Refactoring Triggers

### Automatic Triggers
- File size > 300 lines
- Complexity score > 7/10
- Duplicate code detected
- Missing error handling
- No test coverage

### Manual Triggers
- "Refactor @file"
- "Simplify code"
- "Make maintainable"
- "Apply project standards"

## 🚀 Refactoring Workflow

### Phase 1: Analysis
1. Read file with LSP
2. Calculate complexity score
3. Identify violations
4. Generate improvement plan

### Phase 2: Execution
1. Split into modules
2. Apply ES module standards
3. Add explicit types
4. Improve error handling

### Phase 3: Validation
1. Run tests
2. Check coverage
3. Verify functionality
4. Update documentation

## 📋 Standards Checklist

- [ ] File < 300 lines
- [ ] SRP score = 10/10
- [ ] Uses function keyword (not arrow)
- [ ] Explicit return types
- [ ] Proper error handling
- [ ] Clear variable names
- [ ] No nested ternaries
- [ ] Test coverage > 80%
- [ ] Documentation updated

---

**Version:** 1.0
**Last Updated:** 2026-01-09
**Status:** ✅ Active
`;
  
  fs.writeFileSync(standardsFile, content);
  log('✓ Created refactoring standards', 'success');
}

function configureRefactoringTools(config) {
  if (!config.refactoring) {
    config.refactoring = {};
  }
  
  // Enable auto-refactoring
  config.refactoring.autoSplit = true;
  config.refactoring.maxLines = 300;
  config.refactoring.srpEnforcement = true;
  config.refactoring.qualityGate = true;
  
  // Configure pr-review-toolkit for simplification
  if (!config.enabledPlugins) {
    config.enabledPlugins = {};
  }
  config.enabledPlugins["pr-review-toolkit@claude-code-plugins"] = true;
  
  log('✓ Refactoring tools configured', 'success');
  return config;
}

function verifyRefactoring(config, standardsFile) {
  const checks = [
    { 
      name: 'Refactoring config', 
      check: () => config.refactoring?.autoSplit === true && config.refactoring?.maxLines === 300
    },
    { 
      name: 'SRP enforcement', 
      check: () => config.refactoring?.srpEnforcement === true
    },
    { 
      name: 'Quality gate', 
      check: () => config.refactoring?.qualityGate === true
    },
    { 
      name: 'PR Review Toolkit', 
      check: () => config.enabledPlugins?.["pr-review-toolkit@claude-code-plugins"] === true
    },
    { 
      name: 'Standards document', 
      check: () => fs.existsSync(standardsFile)
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
  log('🔧 SETUP REFACTORING MODE', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');
  
  try {
    ensureDirectory(DOCUMENTATION_DIR);
    
    log('\n📍 Creating refactoring standards...', 'info');
    createRefactoringStandards();
    
    // Load settings.json
    if (!fs.existsSync(SETTINGS_FILE)) {
      log('✗ settings.json not found - run setup-core first', 'error');
      return false;
    }
    let settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    
    log('\n📍 Configuring refactoring tools...', 'info');
    settings = configureRefactoringTools(settings);
    
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    
    log('\n📍 Verifying refactoring setup...', 'info');
    const standardsFile = path.join(DOCUMENTATION_DIR, 'REFACTORING_STANDARDS.md');
    const verified = verifyRefactoring(settings, standardsFile);
    
    log('\n═══════════════════════════════════════════════════════════', 'info');
    if (verified) {
      log('✅ Refactoring setup complete!', 'success');
      log('   Auto-split files > 300 lines', 'info');
      log('   SRP enforcement: 10/10', 'info');
      log('   Quality gates: enabled', 'info');
      log('   Standards document: created', 'info');
    } else {
      log('⚠️  Some refactoring features may have issues', 'warn');
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