#!/usr/bin/env node

/**
 * Test script to verify Supabase connection and data retrieval
 * This script tests the backend services independently of the React app
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load environment variables from .env.local
const envContent = readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2].replace(/^"|"$/g, '').replace(/\\n$/, '');
  }
});

const SUPABASE_URL = envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');

// Check environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.log('❌ MISSING ENVIRONMENT VARIABLES');
  console.log('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('   VITE_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
  console.log('\nPlease set these variables in Vercel or local .env file');
  process.exit(1);
}

console.log('✅ Environment variables found');
console.log('   SUPABASE_URL:', SUPABASE_URL);
console.log('   SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY.substring(0, 10) + '...');

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: true, persistSession: false }
});

async function testConnection() {
  try {
    console.log('\n📡 Testing connection to Supabase...');

    // Test 1: Check if we can reach Supabase
    const { data: testData, error: testError } = await supabase
      .from('belege')
      .select('count')
      .limit(1);

    if (testError) {
      console.log('❌ Connection test failed:', testError.message);
      return false;
    }

    console.log('✅ Connection successful');

    // Test 2: Get document count
    const { count, error: countError } = await supabase
      .from('belege')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('❌ Count query failed:', countError.message);
      return false;
    }

    console.log(`✅ Found ${count} documents in database`);

    // Test 3: Get sample documents
    const { data: documents, error: docsError } = await supabase
      .from('belege')
      .select('*')
      .order('uploaded_at', { ascending: false })
      .limit(5);

    if (docsError) {
      console.log('❌ Document query failed:', docsError.message);
      return false;
    }

    console.log(`✅ Retrieved ${documents.length} sample documents`);

    if (documents.length > 0) {
      console.log('\n📋 Sample document structure:');
      const sample = documents[0];
      console.log('   ID:', sample.id);
      console.log('   Type:', sample.type);
      console.log('   Date:', sample.document_date);
      console.log('   Amount:', sample.total_amount);
      console.log('   Status:', sample.status);
      console.log('   Uploaded:', sample.uploaded_at);
    }

    return true;

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    return false;
  }
}

async function testSchema() {
  try {
    console.log('\n🔍 Checking database schema...');

    // Test if 'belege' table exists and has expected columns
    const { data: sample, error } = await supabase
      .from('belege')
      .select('id, type, document_date, total_amount, status, uploaded_at, file_name, file_type, file_size, content, extracted_data, user_id')
      .limit(1);

    if (error) {
      console.log('❌ Schema check failed:', error.message);
      return false;
    }

    console.log('✅ Schema validation passed');
    if (sample && sample.length > 0) {
      console.log('   Columns present:', Object.keys(sample[0]).join(', '));
    }

    return true;
  } catch (error) {
    console.log('❌ Schema check error:', error.message);
    return false;
  }
}

async function testTransform() {
  try {
    console.log('\n🔄 Testing data transformation...');

    const { data: rawDocs, error } = await supabase
      .from('belege')
      .select('*')
      .order('uploaded_at', { ascending: false })
      .limit(3);

    if (error) {
      console.log('❌ Data retrieval failed:', error.message);
      return false;
    }

    if (!rawDocs || rawDocs.length === 0) {
      console.log('⚠️  No documents found in database');
      return true; // Not an error, just empty database
    }

    // Transform to DocumentRecord format (simulating what storageService does)
    const transformed = rawDocs.map(doc => ({
      id: doc.id,
      fileName: doc.file_name,
      fileType: doc.file_type,
      fileSize: doc.file_size,
      uploadDate: doc.uploaded_at,
      documentDate: doc.document_date,
      type: doc.type,
      totalAmount: doc.total_amount,
      vatAmount: doc.vat_amount,
      netAmount: doc.net_amount,
      creditor: doc.creditor,
      vatRate: doc.vat_rate,
      iban: doc.iban,
      description: doc.description,
      content: doc.content,
      extractedData: doc.extracted_data,
      status: doc.status,
      userId: doc.user_id,
      processingTime: doc.processing_time,
      aiConfidence: doc.ai_confidence,
      ocrEngine: doc.ocr_engine,
      syncStatus: doc.sync_status || 'synced',
      createdAt: doc.created_at || doc.uploaded_at,
      updatedAt: doc.updated_at || doc.uploaded_at
    }));

    console.log(`✅ Successfully transformed ${transformed.length} documents`);
    console.log('   Transformed fields:', Object.keys(transformed[0]).join(', '));

    return true;
  } catch (error) {
    console.log('❌ Transformation test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('═'.repeat(60));
  console.log('ZOE Solar Accounting OCR - Supabase Connection Test');
  console.log('═'.repeat(60));

  const connectionOk = await testConnection();
  const schemaOk = await testSchema();
  const transformOk = await testTransform();

  console.log('\n═'.repeat(60));
  console.log('SUMMARY');
  console.log('═'.repeat(60));
  console.log('Connection:', connectionOk ? '✅ PASS' : '❌ FAIL');
  console.log('Schema:', schemaOk ? '✅ PASS' : '❌ FAIL');
  console.log('Transformation:', transformOk ? '✅ PASS' : '❌ FAIL');

  if (connectionOk && schemaOk && transformOk) {
    console.log('\n🎉 ALL TESTS PASSED - Backend is working correctly!');
    console.log('\nIf documents are not displaying in the UI, the issue is likely in:');
    console.log('1. React component state management');
    console.log('2. useEffect initialization logic');
    console.log('3. UI rendering components');
    process.exit(0);
  } else {
    console.log('\n❌ TESTS FAILED - Backend issues detected');
    console.log('\nPlease check:');
    console.log('1. Supabase project is running');
    console.log('2. Database table "belege" exists');
    console.log('3. Environment variables are correct');
    console.log('4. User has proper database permissions');
    process.exit(1);
  }
}

main();