#!/usr/bin/env node

/**
 * 🤖 MCP Server Health Check Script
 *
 * Verifies all MCP servers are configured and accessible
 * Part of the ZOE Solar Accounting OCR Claude CLI system
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function checkEnvironmentVariable(varName) {
  return process.env[varName] ? '✅' : '❌';
}

function checkCommand(command) {
  try {
    execSync(`which ${command}`, { stdio: 'pipe' });
    return '✅';
  } catch {
    return '❌';
  }
}

function checkNpxPackage(packageName) {
  try {
    execSync(`npm list -g ${packageName} 2>/dev/null || echo "not installed"`, { stdio: 'pipe' });
    return '✅';
  } catch {
    return '⚠️';
  }
}

function getProjectRoot() {
  // Start from the script location and go up to find project root
  let currentDir = __dirname;
  while (currentDir !== path.dirname(currentDir)) {
    if (fs.existsSync(path.join(currentDir, 'package.json'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  return process.cwd();
}

function validateMcpConfig() {
  const projectRoot = getProjectRoot();
  const configPath = path.join(projectRoot, '.claude', 'mcp.json');

  if (!checkFileExists(configPath)) {
    log('❌ .claude/mcp.json not found', colors.red);
    return false;
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    log('✅ .claude/mcp.json found and valid', colors.green);
    return config;
  } catch (error) {
    log('❌ .claude/mcp.json is invalid JSON', colors.red);
    return false;
  }
}

function checkSerenaMCP() {
  log('\n🔍 Checking Serena MCP (Code Analysis)...', colors.cyan);

  const whichSerena = checkCommand('serena');
  const uvxCheck = checkCommand('uvx');

  log(`  Command 'serena': ${whichSerena}`);
  log(`  Command 'uvx': ${uvxCheck}`);

  if (whichSerena === '✅' && uvxCheck === '✅') {
    log('  ✅ Serena MCP: Ready', colors.green);
    return true;
  } else {
    log('  ⚠️ Serena MCP: May need installation', colors.yellow);
    log('  💡 Run: pip install uv && uvx --from git+https://github.com/oraios/serena serena start-mcp-server', colors.blue);
    return false;
  }
}

function checkTavilyMCP() {
  log('\n🔍 Checking Tavily MCP (Web Research)...', colors.cyan);

  const apiKey = process.env.TAVILY_API_KEY;
  const npxCheck = checkCommand('npx');

  log(`  TAVILY_API_KEY: ${apiKey ? '✅ Set' : '❌ Not set'}`);
  log(`  Command 'npx': ${npxCheck}`);

  if (apiKey && npxCheck === '✅') {
    log('  ✅ Tavily MCP: Ready', colors.green);
    return true;
  } else {
    log('  ⚠️ Tavily MCP: Configuration needed', colors.yellow);
    if (!apiKey) {
      log('  💡 Set TAVILY_API_KEY in .env file', colors.blue);
    }
    if (npxCheck === '❌') {
      log('  💡 Install Node.js/npm', colors.blue);
    }
    return false;
  }
}

function checkCanvaMCP() {
  log('\n🔍 Checking Canva MCP (Visual Design)...', colors.cyan);

  const apiKey = process.env.CANVA_API_KEY;

  log(`  CANVA_API_KEY: ${apiKey ? '✅ Set' : '❌ Not set'}`);
  log(`  MCP URL: https://mcp.canva.com/mcp`);

  if (apiKey) {
    log('  ✅ Canva MCP: Ready', colors.green);
    return true;
  } else {
    log('  ⚠️ Canva MCP: Configuration needed', colors.yellow);
    log('  💡 Set CANVA_API_KEY in .env file', colors.blue);
    return false;
  }
}

function checkGlobalClaudeConfig() {
  log('\n🔍 Checking Global Claude Configuration...', colors.cyan);

  const globalConfigPath = path.join(process.cwd(), '.claude.md');

  if (checkFileExists(globalConfigPath)) {
    log('  ✅ .claude.md: Found', colors.green);
    return true;
  } else {
    log('  ❌ .claude.md: Missing', colors.red);
    log('  💡 Create .claude.md with global instructions', colors.blue);
    return false;
  }
}

function checkRalphLoopTriggers() {
  log('\n🔍 Checking Ralph-Loop Triggers...', colors.cyan);

  const configPath = path.join(process.cwd(), '.claude', 'claude-config.json');

  if (checkFileExists(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const triggers = config.agents?.ralph_loop?.triggers || [];

      if (triggers.length > 0) {
        log(`  ✅ Found ${triggers.length} Ralph-Loop triggers`, colors.green);
        log(`     ${triggers.join(', ')}`);
        return true;
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  log('  ⚠️ Ralph-Loop triggers may need configuration', colors.yellow);
  return false;
}

function checkValidationScripts() {
  log('\n🔍 Checking Validation Scripts...', colors.cyan);

  const scripts = [
    { name: 'validate.sh', path: path.join(process.cwd(), 'validate.sh') },
    { name: 'console-check.js', path: path.join(process.cwd(), '.claude', 'commands', 'console-check.js') },
    { name: 'test-visual.js', path: path.join(process.cwd(), 'test-visual.js') }
  ];

  let allPresent = true;

  scripts.forEach(script => {
    const exists = checkFileExists(script.path);
    log(`  ${exists ? '✅' : '❌'} ${script.name}: ${exists ? 'Found' : 'Missing'}`);
    if (!exists) allPresent = false;
  });

  return allPresent;
}

function checkPackageJsonScripts() {
  log('\n🔍 Checking package.json Scripts...', colors.cyan);

  const packagePath = path.join(process.cwd(), 'package.json');

  if (!checkFileExists(packagePath)) {
    log('  ❌ package.json: Missing', colors.red);
    return false;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const scripts = pkg.scripts || {};

    const requiredScripts = ['build', 'lint', 'dev'];
    let allPresent = true;

    requiredScripts.forEach(script => {
      const exists = scripts[script] !== undefined;
      log(`  ${exists ? '✅' : '❌'} ${script}: ${exists ? 'Present' : 'Missing'}`);
      if (!exists) allPresent = false;
    });

    return allPresent;
  } catch (error) {
    log('  ❌ package.json: Invalid JSON', colors.red);
    return false;
  }
}

function main() {
  log('╔════════════════════════════════════════════════════════════╗', colors.bold + colors.cyan);
  log('║  🤖 MCP Server Health Check - ZOE Solar Accounting OCR    ║', colors.bold + colors.cyan);
  log('╚════════════════════════════════════════════════════════════╝', colors.bold + colors.cyan);

  log('\n📋 Checking system requirements...\n');

  const results = {
    mcpConfig: validateMcpConfig(),
    serena: checkSerenaMCP(),
    tavily: checkTavilyMCP(),
    canva: checkCanvaMCP(),
    globalConfig: checkGlobalClaudeConfig(),
    ralphLoop: checkRalphLoopTriggers(),
    validationScripts: checkValidationScripts(),
    packageScripts: checkPackageJsonScripts()
  };

  // Summary
  log('\n' + '═'.repeat(60), colors.bold + colors.cyan);
  log('📊 SUMMARY', colors.bold + colors.cyan);
  log('═'.repeat(60), colors.bold + colors.cyan);

  const readyCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;

  log(`\nOverall: ${readyCount}/${totalCount} checks passed\n`);

  if (readyCount === totalCount) {
    log('🎉 ALL SYSTEMS GO! MCP servers are fully configured.', colors.bold + colors.green);
    log('\nYou can now use:', colors.reset);
    log('  • Serena for code editing', colors.green);
    log('  • Tavily for web research', colors.green);
    log('  • Canva for visual design', colors.green);
    log('  • Ralph-Loop for complex tasks', colors.green);
  } else {
    log('⚠️  Some configuration needed before full functionality.', colors.bold + colors.yellow);
    log('\nNext steps:', colors.reset);
    log('  1. Set missing environment variables in .env', colors.yellow);
    log('  2. Install missing dependencies', colors.yellow);
    log('  3. Run: ./validate.sh', colors.yellow);
    log('  4. Test: node .claude/commands/console-check.js', colors.yellow);
  }

  log('\n📚 Documentation:', colors.blue);
  log('  • .claude.md - Global instructions', colors.blue);
  log('  • .claude/agents.md - Agent delegation guide', colors.blue);
  log('  • .claude/claude-config.json - MCP configuration', colors.blue);
  log('  • .claude/COMMANDS.md - Command reference', colors.blue);

  // Exit code
  process.exit(readyCount === totalCount ? 0 : 1);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { checkSerenaMCP, checkTavilyMCP, checkCanvaMCP, main };