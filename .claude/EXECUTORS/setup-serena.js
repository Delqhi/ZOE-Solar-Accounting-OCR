#!/usr/bin/env node
/**
 * Setup Serena MCP Server
 * Configures Serena MCP server with proper settings
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.HOME, '.claude');
const CLAUDE_JSON_FILE = path.join(CLAUDE_DIR, '.claude.json');

function log(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = { 'info': '🟢', 'warn': '🟡', 'error': '🔴', 'success': '✅' }[type] || 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function ensureClaudeJson() {
  if (!fs.existsSync(CLAUDE_JSON_FILE)) {
    log('Creating .claude.json...', 'info');
    const initialConfig = { mcpServers: {} };
    fs.writeFileSync(CLAUDE_JSON_FILE, JSON.stringify(initialConfig, null, 2));
    return initialConfig;
  }
  return JSON.parse(fs.readFileSync(CLAUDE_JSON_FILE, 'utf8'));
}

function configureSerena(config) {
  const serenaConfig = {
    command: "npx",
    args: ["-y", "@anthropics/serena-mcp", "--headless"],
    env: {
      "BROWSER": "none",
      "CI": "true"
    }
  };
  
  if (!config.mcpServers) {
    config.mcpServers = {};
  }
  
  config.mcpServers.serena = serenaConfig;
  log('✓ Serena MCP server configured', 'success');
  return config;
}

function verifySerena(config) {
  const serena = config.mcpServers?.serena;
  if (!serena) {
    log('✗ Serena not configured', 'error');
    return false;
  }
  
  const isCorrect = 
    serena.command === 'npx' &&
    Array.isArray(serena.args) &&
    serena.args.includes('-y') &&
    serena.args.includes('@anthropics/serena-mcp') &&
    serena.args.includes('--headless') &&
    serena.env?.BROWSER === 'none' &&
    serena.env?.CI === 'true';
  
  if (isCorrect) {
    log('✓ Serena configuration verified', 'success');
    return true;
  } else {
    log('✗ Serena configuration incorrect', 'error');
    return false;
  }
}

function main() {
  log('═══════════════════════════════════════════════════════════', 'info');
  log('🤖 SETUP SERENA MCP SERVER', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');
  
  try {
    let config = ensureClaudeJson();
    config = configureSerena(config);
    
    fs.writeFileSync(CLAUDE_JSON_FILE, JSON.stringify(config, null, 2));
    
    const verified = verifySerena(config);
    
    log('\n═══════════════════════════════════════════════════════════', 'info');
    if (verified) {
      log('✅ Serena MCP setup complete!', 'success');
    } else {
      log('⚠️  Serena setup may have issues', 'warn');
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