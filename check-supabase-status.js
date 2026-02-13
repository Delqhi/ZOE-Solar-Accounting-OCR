#!/usr/bin/env node

/**
 * Quick Supabase Status Checker
 * Run this to diagnose why documents aren't displaying
 */

import { readFileSync } from 'fs';

console.log('🔍 Checking Supabase Configuration...\n');

// Load environment variables
let envVars = {};
try {
  const envContent = readFileSync('.env.local', 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      envVars[match[1]] = match[2].replace(/^"|"$/g, '').replace(/\\n$/, '');
    }
  });
} catch (e) {
  console.log('⚠️  No .env.local file found');
}

const SUPABASE_URL = envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('📋 Current Configuration:');
console.log('   VITE_SUPABASE_URL:', SUPABASE_URL || '❌ NOT SET');
console.log('   VITE_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅ Set (hidden)' : '❌ NOT SET');
console.log('');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.log('❌ MISSING ENVIRONMENT VARIABLES');
  console.log('');
  console.log('SOLUTION:');
  console.log('1. Open Vercel Dashboard: https://vercel.com/dashboard');
  console.log('2. Find project: zoe-solar-accounting-ocr');
  console.log('3. Go to Settings → Environment Variables');
  console.log('4. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  console.log('5. Redeploy');
  process.exit(1);
}

console.log('✅ Environment variables are set');
console.log('');

// Check if URL format is correct
if (SUPABASE_URL.includes('aura-call.de')) {
  console.log('⚠️  WARNING: Old Supabase URL detected');
  console.log('   Current:', SUPABASE_URL);
  console.log('   Expected format: https://[project-ref].supabase.co');
  console.log('');
  console.log('SOLUTION:');
  console.log('1. Login to https://supabase.com/dashboard');
  console.log('2. Check if project "aura-call.de" exists and is active');
  console.log('3. If not, create new project or find correct URL');
  console.log('4. Update VITE_SUPABASE_URL in Vercel');
  console.log('5. Redeploy');
  process.exit(1);
}

console.log('✅ URL format looks correct');
console.log('');

// Test connection (simplified)
console.log('📡 Testing connection...');
console.log('   URL:', SUPABASE_URL);
console.log('   (This may take up to 10 seconds)');

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: true, persistSession: false }
});

async function testConnection() {
  try {
    const startTime = Date.now();
    
    // Quick test - just check if we can reach the server
    const { error } = await supabase
      .from('belege')
      .select('count')
      .limit(1)
      .timeout(10); // 10 second timeout
    
    const duration = Date.now() - startTime;
    
    if (error) {
      console.log(`❌ Connection failed after ${duration}ms`);
      console.log('   Error:', error.message);
      console.log('');
      console.log('SOLUTION:');
      console.log('1. Check Supabase Dashboard status');
      console.log('2. Verify project is active (not suspended/deleted)');
      console.log('3. Check if database table "belege" exists');
      console.log('4. Update credentials if project URL changed');
      return false;
    }
    
    console.log(`✅ Connection successful (${duration}ms)`);
    return true;
    
  } catch (error) {
    console.log('❌ Connection timeout or error');
    console.log('   Error:', error.message);
    console.log('');
    console.log('SOLUTION:');
    console.log('1. Supabase project may be deleted/suspended');
    console.log('2. Check: https://supabase.com/dashboard');
    console.log('3. Create new project if needed');
    console.log('4. Update Vercel environment variables');
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('');
    console.log('🎉 SUCCESS! Supabase is working correctly');
    console.log('');
    console.log('If documents still not showing:');
    console.log('1. Check browser console for errors');
    console.log('2. Verify table "belege" has data');
    console.log('3. Check user permissions in Supabase');
  } else {
    console.log('');
    console.log('❌ FAILED - Supabase connectivity issue detected');
    console.log('');
    console.log('QUICK FIX:');
    console.log('1. Login to https://supabase.com/dashboard');
    console.log('2. Check project status');
    console.log('3. Get correct URL and anon key');
    console.log('4. Update Vercel environment variables');
    console.log('5. Redeploy');
  }
  process.exit(success ? 0 : 1);
});