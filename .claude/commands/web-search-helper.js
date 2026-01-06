#!/usr/bin/env node

/**
 * Web Search Helper Script
 *
 * This script provides alternative methods for web searching when the built-in
 * WebSearch tool is unavailable (region-restricted or other issues).
 *
 * Usage:
 *   node .claude/commands/web-search-helper.js "Azure AI Vision pricing 2025"
 *   node .claude/commands/web-search-helper.js --query "OCR monthly transactions" --platform "Azure"
 */

import { spawn } from 'child_process';

const args = process.argv.slice(2);
const config = {
  tavily: {
    command: 'npx',
    args: ['-y', 'tavily-mcp'],
    description: 'Tavily MCP server for web research'
  },
  search_queries: {
    azure_ocr_pricing: {
      query: 'Azure AI Vision OCR pricing 2025 free tier monthly transactions',
      keywords: ['Azure', 'AI Vision', 'OCR', 'pricing', '2025', 'free tier', 'monthly']
    },
    azure_vision_pricing: {
      query: 'Azure AI Vision pricing 2025 Computer Vision API cost',
      keywords: ['Azure', 'AI Vision', 'Computer Vision', 'pricing', '2025', 'API']
    }
  }
};

function printHelp() {
  console.log(`
🌐 Web Search Helper - Alternative Search Methods

USAGE:
  node .claude/commands/web-search-helper.js [query]
  node .claude/commands/web-search-helper.js --query "search term" --platform "Azure"

EXAMPLES:
  node .claude/commands/web-search-helper.js "Azure AI Vision pricing 2025"
  node .claude/commands/web-search-helper.js --query "OCR monthly transactions"

STRATEGIES:
  1. Built-in WebSearch (may be region-restricted)
  2. Tavily MCP Server (configured in mcp.json)
  3. Manual search queries with specific keywords
  4. WebFetch for specific URLs

QUICK QUERIES:
  azure_ocr_pricing      - Azure AI Vision OCR pricing 2025
  azure_vision_pricing   - Azure AI Vision Computer Vision pricing

TAVILY MCP SETUP:
  If Tavily MCP is not working, ensure:
  - TAVILY_API_KEY is set in environment
  - MCP server is installed: npx -y @tavily/mcp-server
  - mcp.json has correct configuration

  `);
}

function printManualSearchQuery(query, platform = 'general') {
  console.log(`
🔍 MANUAL SEARCH STRATEGY
========================

Platform: ${platform}
Query: "${query}"

Suggested Search Terms:
  ${query}

Keywords to include:
  ${query.split(' ').map(k => `• ${k}`).join('\n  ')}

Search Platforms:
  • Google: https://www.google.com/search?q=${encodeURIComponent(query)}
  • Bing: https://www.bing.com/search?q=${encodeURIComponent(query)}
  • DuckDuckGo: https://duckduckgo.com/?q=${encodeURIComponent(query)}

Alternative Queries:
  • "${query} 2025"
  • "${query} documentation"
  • "${query} pricing"
  • "${query} API"

  `);
}

function printTavilySetup() {
  console.log(`
🔧 TAVILY MCP SERVER SETUP
==========================

1. Install Tavily MCP Server:
   npx -y @tavily/mcp-server

2. Set Environment Variable:
   export TAVILY_API_KEY="your_api_key_here"

3. Verify mcp.json Configuration:
   {
     "mcpServers": {
       "tavily": {
         "command": "npx",
         "args": ["-y", "@tavily/mcp-server"],
         "env": {
           "TAVILY_API_KEY": "\${TAVILY_API_KEY}"
         }
       }
     }
   }

4. Get API Key:
   - Visit: https://tavily.com/
   - Sign up for free tier
   - Copy API key

5. Usage in Claude:
   - Use Tavily tools via MCP
   - Tools available: search, research, get_context

  `);
}

function printWebSearchFallback() {
  console.log(`
🔄 WEB SEARCH FALLBACK STRATEGIES
=================================

When WebSearch tool fails:

1. TAVILY MCP (Recommended)
   - Already configured in mcp.json
   - Use via Claude's MCP integration
   - Command: npx -y @tavily/mcp-server

2. MANUAL SEARCH QUERIES
   - I provide specific search terms
   - You search manually on Google/Bing
   - Share results for analysis

3. WEBFETCH FOR SPECIFIC URLS
   - Use: WebFetch tool with specific URLs
   - Example: WebFetch("https://azure.microsoft.com/pricing")

4. DOCUMENTATION LOOKUP
   - Check official docs
   - Review pricing pages
   - Analyze API documentation

  `);
}

// Main execution
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

// Parse arguments
let query = '';
let platform = 'general';

if (args[0] === '--query') {
  query = args[1] || '';
  const platformIndex = args.indexOf('--platform');
  if (platformIndex !== -1 && args[platformIndex + 1]) {
    platform = args[platformIndex + 1];
  }
} else if (args[0] in config.search_queries) {
  // Predefined query
  const key = args[0];
  const predefined = config.search_queries[key];
  printManualSearchQuery(predefined.query, platform);
  console.log('\n📝 Additional Keywords:\n  ' + predefined.keywords.join(', '));
  process.exit(0);
} else {
  query = args.join(' ');
}

if (query) {
  printManualSearchQuery(query, platform);
} else {
  printTavilySetup();
  printWebSearchFallback();
}

// Additional tips
console.log('\n💡 PRO TIPS:');
console.log('   • Use WebFetch for specific URLs when available');
console.log('   • Tavily MCP is the best alternative to built-in WebSearch');
console.log('   • For pricing queries, include year (2025) and "pricing" keyword');
console.log('   • For API queries, include "API", "documentation", "reference"');
