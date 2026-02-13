#!/usr/bin/env node

// Test script to verify Supabase connection with production URL
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://supabase.aura-call.de";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIn0.oqN5J2n6GBoLIf3OpsUrK2OZWIAINIWcbmRV0mtA4yQ";

console.log('Testing Supabase connection...');
console.log('URL:', SUPABASE_URL);
console.log('Anon Key:', SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  try {
    // Test basic connection
    const { data, error } = await supabase.from('belege').select('*').limit(1);

    if (error) {
      console.log('⚠️  Supabase connection failed:', error.message);
      console.log('   This might be expected if the table doesn\'t exist yet');
      return false;
    }

    console.log('✅ Supabase connection successful!');
    console.log('   Data retrieved:', data ? data.length : 0, 'records');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Production Supabase configuration is working correctly!');
  } else {
    console.log('\n⚠️  Supabase connection issue detected');
  }
});