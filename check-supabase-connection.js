#!/usr/bin/env node

/**
 * Supabase Connection Diagnostic Script
 * Run this script to test your Supabase connection and get detailed diagnostics
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Load environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🔍 ZOE Solar OCR - Supabase Connection Diagnostic\n');

// Check if environment variables are set
if (!SUPABASE_URL) {
  console.log('❌ ERROR: VITE_SUPABASE_URL environment variable is not set');
  console.log('   Please add it to your .env file');
  process.exit(1);
}

if (!SUPABASE_ANON_KEY) {
  console.log('❌ ERROR: VITE_SUPABASE_ANON_KEY environment variable is not set');
  console.log('   Please add it to your .env file');
  process.exit(1);
}

console.log('📋 Configuration:');
console.log(`   URL: ${SUPABASE_URL}`);
console.log(`   Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...${SUPABASE_ANON_KEY.slice(-10)}\n`);

// Parse URL
let parsedUrl;
try {
  parsedUrl = new URL(SUPABASE_URL);
} catch (error) {
  console.log('❌ ERROR: Invalid Supabase URL format');
  console.log(`   Expected format: https://your-project.supabase.co or https://your-domain.com`);
  console.log(`   Got: ${SUPABASE_URL}`);
  process.exit(1);
}

// Test DNS resolution
console.log('📡 Step 1: Testing DNS resolution...');
const dns = require('dns');
dns.lookup(parsedUrl.hostname, (err, address, family) => {
  if (err) {
    console.log(`   ❌ DNS lookup failed: ${err.message}`);
    console.log('   This usually means the domain doesn\'t exist or DNS is misconfigured');
    return;
  }
  console.log(`   ✅ DNS resolved to: ${address} (IPv${family})\n`);

  // Test HTTP connectivity
  testConnection();
});

function testConnection() {
  console.log('🔌 Step 2: Testing HTTP connectivity...');

  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
    path: '/rest/v1/',
    method: 'GET',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'User-Agent': 'ZOE-OCR-Diagnostic/1.0'
    },
    timeout: 10000 // 10 seconds
  };

  const protocol = parsedUrl.protocol === 'https:' ? https : http;

  const req = protocol.request(options, (res) => {
    console.log(`   Status: ${res.statusCode}`);
    console.log(`   Headers:`, res.headers);

    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('   ✅ Connection successful!\n');
        testTableAccess();
      } else if (res.statusCode === 401 || res.statusCode === 403) {
        console.log('   ❌ Authentication failed');
        console.log('   Your anon key may be invalid or insufficient permissions\n');
        printNextSteps();
      } else if (res.statusCode === 404) {
        console.log('   ❌ API endpoint not found');
        console.log('   This Supabase instance may not be properly configured\n');
        printNextSteps();
      } else {
        console.log(`   ⚠️  Unexpected status code: ${res.statusCode}`);
        console.log(`   Response: ${data}\n`);
        printNextSteps();
      }
    });
  });

  req.on('error', (error) => {
    console.log(`   ❌ Connection error: ${error.message}`);

    if (error.code === 'ECONNREFUSED') {
      console.log('   This usually means:');
      console.log('   - The server is not running');
      console.log('   - The port is blocked');
      console.log('   - Firewall is blocking the connection');
    } else if (error.code === 'ENOTFOUND') {
      console.log('   DNS resolution failed - domain doesn\'t exist');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('   Connection timed out - server not responding');
    }

    console.log('');
    printNextSteps();
  });

  req.on('timeout', () => {
    console.log('   ❌ Request timeout after 10 seconds');
    console.log('   The server is taking too long to respond\n');
    req.destroy();
    printNextSteps();
  });

  req.end();
}

function testTableAccess() {
  console.log('📊 Step 3: Testing table access...');

  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
    path: '/rest/v1/einstellungen?select=schluessel&limit=1',
    method: 'GET',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Accept': 'application/vnd.pgrst.object+json',
      'User-Agent': 'ZOE-OCR-Diagnostic/1.0'
    },
    timeout: 10000
  };

  const protocol = parsedUrl.protocol === 'https:' ? https : http;

  const req = protocol.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 200 || res.statusCode === 206) {
        console.log('   ✅ Table access successful!');
        console.log('   Your Supabase connection is fully working\n');
        console.log('🎉 All tests passed! Your configuration is correct.');
      } else if (res.statusCode === 404) {
        console.log('   ⚠️  Table not found (but connection works)');
        console.log('   You may need to run the database migrations');
        console.log('   Run: supabase migration up\n');
      } else if (res.statusCode === 400) {
        console.log('   ⚠️  Bad request - checking table structure...');
        console.log('   This might be normal if tables don\'t exist yet\n');
      } else {
        console.log(`   ⚠️  Unexpected status: ${res.statusCode}`);
        console.log(`   Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.log(`   ❌ Table access error: ${error.message}\n`);
  });

  req.end();
}

function printNextSteps() {
  console.log('🔧 Next Steps:');
  console.log('');
  console.log('1. Verify Supabase instance is running:');
  console.log('   - Check if using Supabase Cloud: https://supabase.com/dashboard');
  console.log('   - Check if self-hosted: docker-compose ps');
  console.log('');
  console.log('2. Verify your .env file contains correct values:');
  console.log('   VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.log('   VITE_SUPABASE_ANON_KEY=your-anon-key');
  console.log('');
  console.log('3. Test with Supabase Cloud (recommended):');
  console.log('   - Create free project at supabase.com');
  console.log('   - Copy URL and anon key from Settings > API');
  console.log('');
  console.log('4. If self-hosted, check:');
  console.log('   - Docker containers are running');
  console.log('   - Ports 8000/8443 are accessible');
  console.log('   - CORS is enabled');
  console.log('   - SSL certificates are valid');
  console.log('');
}