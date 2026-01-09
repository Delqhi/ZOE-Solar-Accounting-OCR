#!/usr/bin/env node

/**
 * Pipeline Verification Script
 * Checks all components of the AI document processing pipeline
 */

const fs = require('fs');
const path = require('path');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const PROJECT_ROOT = path.resolve(__dirname, '..');

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const fullPath = path.join(PROJECT_ROOT, filePath);
  const exists = fs.existsSync(fullPath);

  if (exists) {
    const stats = fs.statSync(fullPath);
    const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
    log(`✅ ${description}`, 'green');
    log(`   Path: ${filePath}`, 'cyan');
    log(`   Size: ${lines} lines`, 'cyan');
    return true;
  } else {
    log(`❌ ${description}`, 'red');
    log(`   Missing: ${filePath}`, 'yellow');
    return false;
  }
}

function checkDirectory(dirPath, description) {
  const fullPath = path.join(PROJECT_ROOT, dirPath);
  const exists = fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();

  if (exists) {
    const files = fs.readdirSync(fullPath);
    log(`✅ ${description}`, 'green');
    log(`   Path: ${dirPath}`, 'cyan');
    log(`   Files: ${files.length}`, 'cyan');
    return true;
  } else {
    log(`❌ ${description}`, 'red');
    log(`   Missing: ${dirPath}`, 'yellow');
    return false;
  }
}

function checkEnvVar(varName, required = false) {
  const value = process.env[varName];
  const exists = value !== undefined && value !== '';

  if (exists) {
    log(`✅ ${varName}`, 'green');
    return true;
  } else if (required) {
    log(`❌ ${varName} (REQUIRED)`, 'red');
    return false;
  } else {
    log(`⚠️  ${varName} (optional)`, 'yellow');
    return true;
  }
}

async function main() {
  log('\n🔍 AI Document Processing Pipeline - Verification', 'bold');
  log('='.repeat(60), 'cyan');

  let passed = 0;
  let total = 0;

  // 1. Project Structure
  log('\n📁 1. PROJECT STRUCTURE', 'bold');
  total++; if (checkDirectory('src', 'Source Directory')) passed++;
  total++; if (checkDirectory('src/services', 'Services Directory')) passed++;
  total++; if (checkDirectory('src/services/ai', 'AI Services')) passed++;
  total++; if (checkDirectory('src/services/pipeline', 'Pipeline Services')) passed++;
  total++; if (checkDirectory('src/services/optimization', 'Optimization Services')) passed++;
  total++; if (checkDirectory('src/services/errors', 'Error Handling')) passed++;
  total++; if (checkDirectory('src/components', 'UI Components')) passed++;
  total++; if (checkDirectory('supabase/migrations', 'Database Migrations')) passed++;

  // 2. Core Services
  log('\n⚙️  2. CORE SERVICES', 'bold');
  total++; if (checkFile('src/services/masterLoopService.ts', 'Master Loop Service')) passed++;
  total++; if (checkFile('src/services/pipeline/documentProcessingPipeline.ts', 'Document Processing Pipeline')) passed++;
  total++; if (checkFile('src/services/optimization/costOptimizer.ts', 'Cost Optimizer')) passed++;
  total++; if (checkFile('src/services/errors/pipelineErrorHandler.ts', 'Pipeline Error Handler')) passed++;

  // 3. AI Services
  log('\n🧠 3. AI SERVICES', 'bold');
  total++; if (checkFile('src/services/layoutAnalysisService.ts', 'Layout Analysis Service')) passed++;
  total++; if (checkFile('src/services/ai/senderRecognitionService.ts', 'Sender Recognition Service')) passed++;
  total++; if (checkFile('src/services/ai/entityExtractionService.ts', 'Entity Extraction Service')) passed++;
  total++; if (checkFile('src/services/ai/clusteringService.ts', 'Clustering Service')) passed++;
  total++; if (checkFile('src/services/ai/ragService.ts', 'RAG Service')) passed++;

  // 4. UI Components
  log('\n🎨 4. UI COMPONENTS', 'bold');
  total++; if (checkFile('src/components/MasterLoopIntegration.tsx', 'Master Loop Integration')) passed++;
  total++; if (checkFile('src/components/BatchProcessingView.tsx', 'Batch Processing View')) passed++;
  total++; if (checkFile('src/components/ClusteringView.tsx', 'Clustering View')) passed++;

  // 5. Database Migrations
  log('\n🗄️  5. DATABASE MIGRATIONS', 'bold');
  total++; if (checkFile('supabase/migrations/001_add_vector_tables.sql', 'Vector Tables Migration')) passed++;

  // 6. Configuration
  log('\n⚙️  6. CONFIGURATION', 'bold');
  total++; if (checkFile('.env.example', 'Environment Template')) passed++;
  total++; if (checkFile('package.json', 'Package Configuration')) passed++;
  total++; if (checkFile('tsconfig.json', 'TypeScript Config')) passed++;

  // 7. Tests
  log('\n🧪 7. TESTS', 'bold');
  total++; if (checkFile('src/__tests__/pipeline.integration.test.ts', 'Integration Tests')) passed++;

  // 8. Documentation
  log('\n📚 8. DOCUMENTATION', 'bold');
  total++; if (checkFile('AI_PIPELINE_SETUP.md', 'Setup Documentation')) passed++;

  // 9. Environment Variables
  log('\n🔐 9. ENVIRONMENT VARIABLES', 'bold');
  const envPath = path.join(PROJECT_ROOT, '.env');
  if (fs.existsSync(envPath)) {
    log('✅ .env file exists', 'green');
    // Load and check (with graceful fallback if dotenv not available)
    try {
      require('dotenv').config();
    } catch (e) {
      log('⚠️  dotenv package not available, skipping variable loading', 'yellow');
    }
    checkEnvVar('VITE_GEMINI_API_KEY', true);
    checkEnvVar('VITE_SUPABASE_URL', true);
    checkEnvVar('VITE_SUPABASE_ANON_KEY', true);
    checkEnvVar('VITE_GROQ_API_KEY', false);
  } else {
    log('⚠️  .env file not found (create from .env.example)', 'yellow');
  }

  // 10. Dependencies
  log('\n📦 10. DEPENDENCIES', 'bold');
  const pkgPath = path.join(PROJECT_ROOT, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const required = ['@supabase/supabase-js', 'react', 'typescript'];
    const optional = ['pdfjs-dist', '@playwright/test'];

    required.forEach(dep => {
      total++;
      if (pkg.dependencies && pkg.dependencies[dep]) {
        log(`✅ ${dep}`, 'green');
        passed++;
      } else if (pkg.devDependencies && pkg.devDependencies[dep]) {
        log(`✅ ${dep} (dev)`, 'green');
        passed++;
      } else {
        log(`❌ ${dep} (missing)`, 'red');
      }
    });

    optional.forEach(dep => {
      total++;
      if (pkg.dependencies && pkg.dependencies[dep]) {
        log(`✅ ${dep}`, 'green');
        passed++;
      } else if (pkg.devDependencies && pkg.devDependencies[dep]) {
        log(`✅ ${dep} (dev)`, 'green');
        passed++;
      } else {
        log(`⚠️  ${dep} (optional)`, 'yellow');
        passed++; // Don't count optional as failure
      }
    });
  }

  // Summary
  log('\n📊 SUMMARY', 'bold');
  log('='.repeat(60), 'cyan');
  const percentage = Math.round((passed / total) * 100);

  if (percentage >= 90) {
    log(`✅ PASSED: ${passed}/${total} (${percentage}%)`, 'green');
    log('\n🎉 Pipeline is ready for deployment!', 'green');
    log('\nNext steps:', 'cyan');
    log('  1. npm run pipeline:deploy', 'yellow');
    log('  2. npm run pipeline:test', 'yellow');
    log('  3. npm run pipeline:start', 'yellow');
    process.exit(0);
  } else if (percentage >= 70) {
    log(`⚠️  WARNING: ${passed}/${total} (${percentage}%)`, 'yellow');
    log('\nSome components missing. Fix issues before deployment.', 'yellow');
    process.exit(1);
  } else {
    log(`❌ FAILED: ${passed}/${total} (${percentage}%)`, 'red');
    log('\nPipeline setup incomplete. Please fix missing components.', 'red');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(err => {
    log(`\n❌ Fatal error: ${err.message}`, 'red');
    console.error(err);
    process.exit(1);
  });
}

module.exports = { checkFile, checkDirectory, checkEnvVar, main };
