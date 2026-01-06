#!/usr/bin/env node

/**
 * Test Tavily MCP Search Functionality
 * Tests the Tavily MCP server for WebSearch region fix solutions
 */

import { spawn } from 'child_process';

const TAVILY_API_KEY = process.env.TAVILY_API_KEY || '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';

async function testTavilySearch() {
  console.log('🔍 Testing Tavily MCP Search...\n');

  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['-y', 'tavily-mcp'], {
      env: { ...process.env, TAVILY_API_KEY }
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        console.log('Error output:', errorOutput);
        reject(new Error(`Process exited with code ${code}`));
      } else {
        resolve({ output, errorOutput });
      }
    });

    // Send initialize
    const initRequest = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0' }
      }
    });

    child.stdin.write(initRequest + '\n');

    // Send tools/list to discover available tools
    setTimeout(() => {
      const toolsRequest = JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {}
      });
      child.stdin.write(toolsRequest + '\n');
    }, 500);

    // Send a search request
    setTimeout(() => {
      const searchRequest = JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'tavily-search',
          arguments: {
            query: 'WebSearch region fix solution Claude Code',
            search_depth: 'basic',
            max_results: 5
          }
        }
      });
      child.stdin.write(searchRequest + '\n');
    }, 1000);

    // Close after 3 seconds
    setTimeout(() => {
      child.stdin.end();
    }, 3000);
  });
}

async function main() {
  try {
    const result = await testTavilySearch();
    console.log('Tavily MCP Response:', result.output);

    // Parse the response
    const lines = result.output.split('\n').filter(l => l.trim());
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        console.log('\nParsed JSON:', JSON.stringify(parsed, null, 2));
      } catch (e) {
        // Not JSON, skip
      }
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

main();
