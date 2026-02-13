#!/usr/bin/env node

/**
 * Check for local IndexedDB documents
 * This script runs in browser context to check if documents exist locally
 */

console.log('=== ZOE Solar Accounting OCR - Local Document Check ===\n');

// Check if we're in browser context
if (typeof window === 'undefined') {
  console.log('❌ This script must be run in browser console, not Node.js');
  console.log('\n📋 INSTRUCTIONS:');
  console.log('1. Open https://zoe-solar-accounting-ocr.vercel.app in Chrome');
  console.log('2. Open Developer Tools (F12)');
  console.log('3. Go to Console tab');
  console.log('4. Paste and run this script');
  process.exit(1);
}

// Check for IndexedDB databases
async function checkIndexedDB() {
  console.log('🔍 Checking IndexedDB...\n');
  
  // List all databases
  if ('databases' in indexedDB) {
    const databases = await indexedDB.databases();
    console.log('📋 Found databases:', databases.map(db => db.name));
    
    if (databases.length === 0) {
      console.log('❌ No IndexedDB databases found');
    }
  } else {
    console.log('⚠️  indexedDB.databases() not supported in this browser');
  }
  
  // Try to open common database names
  const commonNames = ['zoe-solar-ocr', 'documents', 'belege', 'local-docs'];
  
  for (const name of commonNames) {
    try {
      const request = indexedDB.open(name);
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        console.log(`✅ Found database: ${name}`);
        
        // List object stores
        const objectStores = Array.from(db.objectStoreNames);
        console.log(`   Object stores: ${objectStores.join(', ')}`);
        
        // Try to read data
        if (objectStores.length > 0) {
          const transaction = db.transaction(objectStores[0], 'readonly');
          const store = transaction.objectStore(objectStores[0]);
          const countRequest = store.count();
          
          countRequest.onsuccess = () => {
            console.log(`   Record count: ${countRequest.result}`);
            
            if (countRequest.result > 0) {
              // Get some sample records
              const getAllRequest = store.getAll();
              getAllRequest.onsuccess = () => {
                console.log(`   Sample records:`, getAllRequest.result.slice(0, 3));
              };
            }
          };
        }
      };
      
      request.onerror = () => {
        // Database doesn't exist
      };
    } catch (e) {
      // Ignore errors
    }
  }
}

// Check localStorage
function checkLocalStorage() {
  console.log('\n🔍 Checking localStorage...\n');
  
  const keys = Object.keys(localStorage);
  const zoeKeys = keys.filter(k => k.toLowerCase().includes('zoe') || 
                                   k.toLowerCase().includes('document') || 
                                   k.toLowerCase().includes('beleg'));
  
  if (zoeKeys.length > 0) {
    console.log('📋 Found ZOE-related keys:', zoeKeys);
    zoeKeys.forEach(key => {
      const value = localStorage.getItem(key);
      console.log(`   ${key}: ${value?.substring(0, 100)}${value?.length > 100 ? '...' : ''}`);
    });
  } else {
    console.log('❌ No ZOE-related localStorage keys found');
  }
}

// Check sessionStorage
function checkSessionStorage() {
  console.log('\n🔍 Checking sessionStorage...\n');
  
  const keys = Object.keys(sessionStorage);
  const zoeKeys = keys.filter(k => k.toLowerCase().includes('zoe') || 
                                   k.toLowerCase().includes('document') || 
                                   k.toLowerCase().includes('beleg'));
  
  if (zoeKeys.length > 0) {
    console.log('📋 Found ZOE-related session keys:', zoeKeys);
  } else {
    console.log('❌ No ZOE-related sessionStorage keys found');
  }
}

// Check current app state
function checkAppState() {
  console.log('\n🔍 Checking application state...\n');
  
  // Look for React state in global scope
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ React DevTools detected');
  }
  
  // Check if app has any global state objects
  const potentialState = ['appState', 'store', 'reduxStore', 'zoeState'];
  potentialState.forEach(key => {
    if (window[key]) {
      console.log(`✅ Found global state: ${key}`);
      console.log('   Keys:', Object.keys(window[key]).slice(0, 5));
    }
  });
  
  // Check for Supabase client
  if (window.supabase) {
    console.log('✅ Supabase client found in global scope');
  }
}

// Main execution
async function main() {
  try {
    await checkIndexedDB();
    checkLocalStorage();
    checkSessionStorage();
    checkAppState();
    
    console.log('\n=== SUMMARY ===');
    console.log('If you see "Found database" messages above, documents exist locally.');
    console.log('If all checks show "❌ No ... found", then no local data exists.');
    console.log('\n💡 NEXT STEPS:');
    console.log('1. If local data exists: The issue is in the React component rendering');
    console.log('2. If no local data exists: Documents were never saved locally');
    console.log('3. Supabase is unreachable, so no cloud sync is possible');
    
  } catch (error) {
    console.error('❌ Error during check:', error);
  }
}

// Run if in browser
if (typeof window !== 'undefined') {
  main();
}