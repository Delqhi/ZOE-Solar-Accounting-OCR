#!/usr/bin/env node
/**
 * Setup Integrations (Plugins & Agents)
 * Configures plugins and custom agents for Claude Code
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.HOME, '.claude');
const SETTINGS_FILE = path.join(CLAUDE_DIR, 'settings.json');

function log(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = { 'info': '🟢', 'warn': '🟡', 'error': '🔴', 'success': '✅' }[type] || 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function ensureSettingsFile() {
  if (!fs.existsSync(SETTINGS_FILE)) {
    log('Creating settings.json...', 'info');
    const initialConfig = {
      env: {},
      permissions: { allow: [], defaultMode: 'bypassPermissions' },
      enabledPlugins: {}
    };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(initialConfig, null, 2));
    return initialConfig;
  }
  return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
}

function configurePlugins(config) {
  const requiredPlugins = {
    "context7@claude-plugins-official": true,
    "frontend-design@claude-plugins-official": true,
    "feature-dev@claude-plugins-official": true,
    "ralph-wiggum@claude-plugins-official": true,
    "tavily@claude-plugins-official": true,
    "pr-review-toolkit@claude-code-plugins": true
  };
  
  if (!config.enabledPlugins) {
    config.enabledPlugins = {};
  }
  
  // Merge required plugins
  Object.assign(config.enabledPlugins, requiredPlugins);
  
  log('✓ Configured 6 plugins', 'success');
  return config;
}

function configureMcpServers(config) {
  const requiredServers = ['tavily', 'skyvern', 'canva', 'context7', 'chrome-devtools', 'youtube'];
  
  if (!config.enabledMcpjsonServers) {
    config.enabledMcpjsonServers = [];
  }
  
  // Add missing servers
  for (const server of requiredServers) {
    if (!config.enabledMcpjsonServers.includes(server)) {
      config.enabledMcpjsonServers.push(server);
    }
  }
  
  log('✓ Enabled 6 MCP servers', 'success');
  return config;
}

function configurePermissions(config) {
  const requiredPermissions = [
    ".claude/plugins/cache/**",
    "**/scripts/ralph-loop-wrapper.sh*",
    "/Users/jeremy/.claude/plugins/**",
    "WebSearch",
    "WebFetch",
    "Task",
    "Bash(npx:*)"
  ];
  
  if (!config.permissions) {
    config.permissions = { allow: [], defaultMode: 'bypassPermissions' };
  }
  
  if (!config.permissions.allow) {
    config.permissions.allow = [];
  }
  
  // Add missing permissions
  for (const perm of requiredPermissions) {
    if (!config.permissions.allow.includes(perm)) {
      config.permissions.allow.push(perm);
    }
  }
  
  config.permissions.defaultMode = 'bypassPermissions';
  
  log('✓ Configured permissions', 'success');
  return config;
}

function verifyIntegrations(config) {
  const checks = [
    { 
      name: 'Plugins', 
      check: () => {
        const plugins = Object.keys(config.enabledPlugins || {});
        return plugins.length >= 6 && 
               plugins.includes('context7@claude-plugins-official') &&
               plugins.includes('pr-review-toolkit@claude-code-plugins');
      }
    },
    { 
      name: 'MCP Servers', 
      check: () => {
        const servers = config.enabledMcpjsonServers || [];
        return servers.length >= 6 && servers.includes('tavily') && servers.includes('skyvern');
      }
    },
    { 
      name: 'Permissions', 
      check: () => {
        const perms = config.permissions?.allow || [];
        return perms.length >= 6 && perms.includes('WebSearch') && perms.includes('Task');
      }
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
  log('🔗 SETUP INTEGRATIONS (Plugins & Agents)', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');
  
  try {
    let config = ensureSettingsFile();
    
    log('\n📍 Configuring plugins...', 'info');
    config = configurePlugins(config);
    
    log('\n📍 Configuring MCP servers...', 'info');
    config = configureMcpServers(config);
    
    log('\n📍 Configuring permissions...', 'info');
    config = configurePermissions(config);
    
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(config, null, 2));
    
    log('\n📍 Verifying integrations...', 'info');
    const verified = verifyIntegrations(config);
    
    log('\n═══════════════════════════════════════════════════════════', 'info');
    if (verified) {
      log('✅ Integrations setup complete!', 'success');
      log('   6 plugins configured', 'info');
      log('   6 MCP servers enabled', 'info');
      log('   Permissions set', 'info');
    } else {
      log('⚠️  Some integrations may have issues', 'warn');
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