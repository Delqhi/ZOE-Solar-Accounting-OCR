#!/usr/bin/env node
/**
 * Batch OCR Script for VM
 *
 * Processes documents from Supabase with Gemini AI OCR
 * and updates extracted data in the database.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Support both local development and VM execution
const ENV_PATH = path.resolve(__dirname, '../.env');
const VM_ENV_PATH = '/home/ubuntu/.env';

// Load env vars from .env file - try multiple locations
let envContent;
if (fs.existsSync(ENV_PATH)) {
  envContent = fs.readFileSync(ENV_PATH, 'utf-8');
} else if (fs.existsSync(VM_ENV_PATH)) {
  envContent = fs.readFileSync(VM_ENV_PATH, 'utf-8');
} else {
  console.error('❌ .env file not found!');
  process.exit(1);
}
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) {
    const key = match[1];
    const value = match[2].replace(/^["']|["']$/g, '');
    envVars[key] = value;
  }
});

// Config
const PRIMARY_API_KEY = 'AIzaSyAMeanjUyVncbj93mNGd4_pxAzKW5YbF5o';  // Billing aktiviert
const FALLBACK_KEYS = [
  'AIzaSyChCp74anMmhQJAUKmFKI25KAH7nqOCKZ8',  // Free Tier
  'AIzaSyBcB81AhWglyp9JFQy7MYtCgijks_fogy4'   // Free Tier
];
const SILICONFLOW_API_KEY = envVars['SILICONFLOW_API_KEY'] || '';
const SUPABASE_URL = envVars['SUPABASE_URL'] || envVars['VITE_SUPABASE_URL'] || '';
const SUPABASE_ANON_KEY = envVars['SUPABASE_ANON_KEY'] || envVars['VITE_SUPABASE_ANON_KEY'] || '';

// Script options
const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT_ARG = process.argv.find(arg => arg.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1], 10) : 0;  // 0 = all
const SKIP_OCR = process.argv.includes('--skip-ocr');

// Rate limiting - primary key has billing (5000 RPM), fallbacks have 15 RPM
let REQUESTS_PER_MINUTE = 5000; // High volume with billing
let DELAY_MS = Math.ceil(60000 / REQUESTS_PER_MINUTE);  // ~12ms
let MAX_DAILY_REQUESTS = 100000; // Very high for paid tier

let processed = 0;
let skipped = 0;
let failed = 0;
let requestCount = 0;
let lastRequestTime = 0;

// Accounting rules - map vendor keywords to SKR03 accounts
const ACCOUNT_RULES = [
  { keywords: ['amazon', 'amazn'], skr03: '4900', steuerkategorie: '19_pv', category: 'Sonstiges' },
  { keywords: ['rewe', 'edeka', 'aldi', 'lidl', 'netto', 'kaufland', 'real'], skr03: '4900', steuerkategorie: '7_pv', category: 'Lebensmittel' },
  { keywords: ['telekom', 'vodafone', 'o2', '1&1', 'einsund1'], skr03: '4920', steuerkategorie: '19_pv', category: 'Internet/Telefon' },
  { keywords: ['stadtwerke', 'ew', 'energie', 'strom', 'gas'], skr03: '4240', steuerkategorie: '19_pv', category: 'Strom/Gas' },
  { keywords: ['shell', 'total', 'aral', 'bft', 'tank'], skr03: '4530', steuerkategorie: '19_pv', category: 'Kraftstoff' },
  { keywords: ['bahn', 'db', 'deutsche bahn', 'zug'], skr03: '4670', steuerkategorie: '19_pv', category: 'Reisekosten' },
  { keywords: ['post', 'dhl', 'dpd', ' Hermes', 'ups'], skr03: '4910', steuerkategorie: '19_pv', category: 'Porto' },
  { keywords: ['datev', 'lexware', 'sevdesk'], skr03: '4964', steuerkategorie: '19_pv', category: 'Software' },
  { keywords: ['booking', 'airbnb', 'hotel'], skr03: '4670', steuerkategorie: '19_pv', category: 'Reisekosten' },
  { keywords: ['ikea', 'home depot', 'ob'], skr03: '4900', steuerkategorie: '19_pv', category: 'Sonstiges' },
  { keywords: ['media markt', 'saturn', 'apple'], skr03: '4964', steuerkategorie: '19_pv', category: 'Elektronik' },
  { keywords: ['toom', 'hornbach', 'oba', 'praktiker'], skr03: '4800', steuerkategorie: '19_pv', category: 'Reparatur' },
];

function findAccountRules(vendorName) {
  if (!vendorName) return null;
  const lower = vendorName.toLowerCase();
  for (const rule of ACCOUNT_RULES) {
    if (rule.keywords.some(kw => lower.includes(kw))) {
      return rule;
    }
  }
  return null;
}

// Calculate OCR score based on extracted fields
function calculateScore(data) {
  let score = 0;
  if (data.bruttoBetrag && data.bruttoBetrag > 0) score += 30;
  if (data.belegDatum && /^\d{4}-\d{2}-\d{2}$/.test(data.belegDatum)) score += 25;
  if (data.lieferantName && data.lieferantName.length > 1) score += 20;
  if (data.nettoBetrag && data.nettoBetrag > 0) score += 10;
  if (data.mwstBetrag19 > 0 || data.mwstBetrag7 > 0) score += 10;
  if (data.lineItems && data.lineItems.length > 0) score += 5;
  return Math.min(score, 100);
}

// Determine status based on score
function determineStatus(score) {
  if (score >= 70) return 'APPROVED';
  if (score >= 40) return 'REVIEW_NEEDED';
  return 'REJECTED';
}

// Rate limiting helper
async function waitForRateLimit() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;

  // Check daily limit
  if (requestCount >= MAX_DAILY_REQUESTS) {
    console.log(`\n⚠️  Daily limit reached (${MAX_DAILY_REQUESTS} requests). Stopping.`);
    console.log('💡 Upgrade to paid tier or wait until tomorrow to continue.');
    process.exit(0);
  }

  // Wait if needed for rate limit
  if (elapsed < DELAY_MS) {
    const waitTime = DELAY_MS - elapsed;
    console.log(`  ⏳ Rate limiting: waiting ${Math.round(waitTime/1000)}s...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
  requestCount++;
}

// Detect rate limit from error and adjust
function handleRateLimitError(errorMsg) {
  const match = errorMsg.match(/retry in (\d+\.?\d*)s/);
  if (match) {
    const suggestedDelay = parseFloat(match[1]) * 1000;
    if (suggestedDelay > DELAY_MS) {
      console.log(`  🔄 Adjusting delay to ${Math.round(suggestedDelay/1000)}s based on API`);
      DELAY_MS = suggestedDelay + 1000; // Add 1s buffer
    }
  }

  // Check if it's a daily limit
  if (errorMsg.includes('GenerateRequestsPerDayPerProjectPerModel')) {
    const limitMatch = errorMsg.match(/limit:\s*(\d+)/);
    if (limitMatch) {
      MAX_DAILY_REQUESTS = parseInt(limitMatch[1]);
      console.log(`  ⚠️  Daily limit detected: ${MAX_DAILY_REQUESTS} requests/day`);
    }
  }
}

// Fallback OCR using SiliconFlow (Qwen2-VL)
async function fallbackOCR(base64Data, mimeType) {
  console.log('  🔄 Using SiliconFlow fallback...');

  const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SILICONFLOW_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'Qwen/Qwen2-VL-7B-Instruct',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64Data}` }
            },
            {
              type: 'text',
              text: 'Extract accounting data as JSON: {belegDatum, lieferantName, bruttoBetrag, mwstSatz19, mwstBetrag19, nettoBetrag}. Return only JSON.'
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    })
  });

  if (!response.ok) {
    throw new Error(`SiliconFlow API error: ${await response.text()}`);
  }

  const result = await response.json();
  const text = result.choices?.[0]?.message?.content || '';

  try {
    // Try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return {};
  } catch {
    return {};
  }
}

// Main OCR function
async function analyzeDocument(base64Data, mimeType) {
  // Use primary key with billing
  const apiKey = PRIMARY_API_KEY;

  // Apply rate limiting
  await waitForRateLimit();
  console.log(`  📊 Request ${requestCount}/${MAX_DAILY_REQUESTS} today`);

  try {
    // Import Google GenAI dynamically
    const { GoogleGenAI, Type, Schema } = await import('@google/genai');

    const ai = new GoogleGenAI({ apiKey });

    const accountingSchema = {
      type: Type.OBJECT,
      properties: {
        belegDatum: { type: Type.STRING, description: 'YYYY-MM-DD' },
        belegNummerLieferant: { type: Type.STRING },
        lieferantName: { type: Type.STRING },
        lieferantAdresse: { type: Type.STRING },
        steuernummer: { type: Type.STRING },
        nettoBetrag: { type: Type.NUMBER },
        mwstBetrag19: { type: Type.NUMBER },
        bruttoBetrag: { type: Type.NUMBER },
        textContent: { type: Type.STRING },
      },
      required: ['belegDatum', 'lieferantName', 'bruttoBetrag']
    };

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',  // Better performance/billing tier
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: 'Extract accounting data accurately. Double check the Total Amount.' }
        ]
      },
      config: {
        systemInstruction: 'Extract German invoice data. Return JSON with belegDatum (YYYY-MM-DD), lieferantName, bruttoBetrag (total), nettoBetrag, mwstBetrag19.',
        responseMimeType: 'application/json',
        responseSchema: accountingSchema,
        temperature: 0,
      }
    });

    const text = response.text;
    if (!text) throw new Error('No response from AI');

    let jsonString = text.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json/, '').replace(/```$/, '');
    }

    const parsed = JSON.parse(jsonString);
    console.log('  ✅ Gemini OCR successful');
    return parsed;

  } catch (error) {
    const errorMsg = error.message;
    console.log(`  ⚠️  Gemini error: ${errorMsg}`);

    // Auto-detect and adjust rate limits
    if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
      handleRateLimitError(errorMsg);
    }

    // Try fallback keys if primary fails
    for (const fallbackKey of FALLBACK_KEYS) {
      console.log(`  🔄 Trying fallback key...`);
      try {
        const { GoogleGenAI, Type } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: fallbackKey });

        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: {
            parts: [
              { inlineData: { mimeType, data: base64Data } },
              { text: 'Extract accounting data accurately.' }
            ]
          },
          config: {
            systemInstruction: 'Extract German invoice data as JSON.',
            responseMimeType: 'application/json',
            temperature: 0,
          }
        });

        const text = response.text;
        if (text) {
          console.log('  ✅ Fallback OCR successful');
          return JSON.parse(text.trim());
        }
      } catch (fallbackError) {
        console.log(`  ⚠️  Fallback key failed: ${fallbackError.message}`);
        continue;
      }
    }

    // Final fallback to SiliconFlow
    if (SILICONFLOW_API_KEY) {
      return await fallbackOCR(base64Data, mimeType);
    }
    throw error;
  }
}

// Execute SQL directly on VM (no SSH tunnel needed since we're already on VM)
function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    // Write SQL to temp file to avoid command line length limits
    const tmpPath = `/tmp/sql_${Date.now()}.sql`;
    fs.writeFileSync(tmpPath, sql);

    const psql = spawn('docker', [
      'exec', '-i', 'ngze-techstack-supabase-db-1',
      'psql', '-U', 'postgres', '-d', 'postgres'
    ], { stdio: ['pipe', 'pipe', 'pipe'] });

    const readStream = fs.createReadStream(tmpPath);
    readStream.pipe(psql.stdin);

    let stderr = '';
    psql.stderr.on('data', data => stderr += data.toString());

    psql.on('close', (code) => {
      fs.unlinkSync(tmpPath);
      if (code === 0) resolve();
      else reject(new Error(`psql error: ${stderr}`));
    });
  });
}

// Query documents needing OCR
async function queryUnprocessedDocs(limit) {
  console.log('\n📊 Querying unprocessed documents...');

  const limitClause = limit > 0 ? `LIMIT ${limit}` : '';
  const sql = `SELECT id, file_name, file_data, file_type, lieferant_name, beleg_datum, created_at
               FROM belege
               WHERE brutto_betrag IS NULL
               ORDER BY created_at ASC
               ${limitClause}`;

  return new Promise((resolve, reject) => {
    // Write SQL to temp file
    const tmpPath = `/tmp/query_${Date.now()}.sql`;
    fs.writeFileSync(tmpPath, sql);

    const psql = spawn('docker', [
      'exec', '-i', 'ngze-techstack-supabase-db-1',
      'psql', '-t', '-A', '-F', '|', '-U', 'postgres', '-d', 'postgres'
    ], { stdio: ['pipe', 'pipe', 'pipe'] });

    const readStream = fs.createReadStream(tmpPath);
    readStream.pipe(psql.stdin);

    let stdout = '';
    psql.stdout.on('data', data => stdout += data.toString());

    psql.on('close', (code) => {
      fs.unlinkSync(tmpPath);
      if (code === 0) {
        const rows = stdout.trim().split('\n').filter(r => r.trim());
        const docs = rows.map(row => {
          const cols = row.split('|');
          return {
            id: cols[0],
            file_name: cols[1],
            file_data: cols[2],
            file_type: cols[3],
            lieferant_name: cols[4] || null,
            beleg_datum: cols[5] || null,
            created_at: cols[6]
          };
        });
        resolve(docs);
      } else {
        reject(new Error(`Query failed: ${stdout}`));
      }
    });
  });
}

// Update document with extracted data
async function updateDocument(doc) {
  const score = calculateScore(doc);
  const status = determineStatus(score);

  const sql = `
    UPDATE belege SET
      lieferant_name = ${doc.lieferantName ? `'${doc.lieferantName.replace(/'/g, "''")}'` : 'NULL'},
      lieferant_adresse = ${doc.lieferantAdresse ? `'${doc.lieferantAdresse.replace(/'/g, "''")}'` : 'NULL'},
      beleg_datum = ${doc.belegDatum ? `'${doc.belegDatum}'` : 'NULL'},
      brutto_betrag = ${doc.bruttoBetrag || 'NULL'},
      mwst_betrag = ${(doc.mwstBetrag19 || 0) + (doc.mwstBetrag7 || 0) || 'NULL'},
      mwst_satz = ${doc.mwstSatz19 || 'NULL'},
      steuerkategorie = ${doc.steuerkategorie ? `'${doc.steuerkategorie}'` : 'NULL'},
      skr03_konto = ${doc.skr03_konto ? `'${doc.skr03_konto}'` : 'NULL'},
      line_items = ${doc.lineItems ? `'${JSON.stringify(doc.lineItems).replace(/'/g, "''")}'` : 'NULL'},
      status = '${status}',
      score = ${score}
    WHERE id = '${doc.id}';
  `.replace(/\s+/g, ' ').trim();

  if (!DRY_RUN) {
    await executeSQL(sql);
  }
}

async function processDocument(doc) {
  console.log(`\n📄 Processing: ${doc.file_name}`);

  // Skip if already processed
  if (doc.lieferant_name && doc.beleg_datum) {
    console.log('  ⏭️  Already has data, checking if needs OCR...');
  }

  try {
    const base64Data = doc.file_data;
    let extractedData = {};

    if (!SKIP_OCR) {
      extractedData = await analyzeDocument(base64Data, doc.file_type || 'application/pdf');
    }

    // Apply accounting rules
    const vendorName = extractedData.lieferantName || doc.lieferant_name || '';
    const rules = findAccountRules(vendorName);

    const enrichedData = {
      id: doc.id,
      lieferantName: extractedData.lieferantName || vendorName || 'Unbekannt',
      lieferantAdresse: extractedData.lieferantAdresse || doc.lieferant_adresse || null,
      belegDatum: extractedData.belegDatum || doc.beleg_datum || null,
      bruttoBetrag: extractedData.bruttoBetrag || doc.brutto_betrag || null,
      nettoBetrag: extractedData.nettoBetrag || null,
      mwstBetrag19: extractedData.mwstBetrag19 || null,
      mwstSatz19: extractedData.mwstSatz19 || null,
      steuerkategorie: rules?.steuerkategorie || null,
      skr03_konto: rules?.skr03 || null,
      lineItems: extractedData.lineItems || null,
      textContent: extractedData.textContent || null,
    };

    console.log(`  📊 Vendor: ${enrichedData.lieferantName}`);
    console.log(`  💰 Amount: ${enrichedData.bruttoBetrag || 'N/A'}`);
    console.log(`  📅 Date: ${enrichedData.belegDatum || 'N/A'}`);
    if (rules) {
      console.log(`  🏷️  Account: ${rules.skr03} (${rules.category})`);
    }

    await updateDocument(enrichedData);
    processed++;

    if (!DRY_RUN) {
      console.log(`  ✅ Updated: ${doc.id}`);
    }

  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    failed++;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('ZOE Solar - Batch OCR Processor');
  console.log('='.repeat(60));
  console.log(`\n🔧 Config:`);
  console.log(`   Primary (Billing): ✓ configured`);
  console.log(`   Fallback Keys: ${FALLBACK_KEYS.length} configured`);
  console.log(`   SiliconFlow: ${SILICONFLOW_API_KEY ? 'configured' : 'NOT configured'}`);
  console.log(`   Rate Limit: ${REQUESTS_PER_MINUTE} RPM (~${DELAY_MS}ms delay)`);
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`   Limit: ${LIMIT} documents`);
  console.log(`   Skip OCR: ${SKIP_OCR ? 'yes' : 'no'}`);
  console.log('');

  // Always have primary key, so no check needed

  try {
    // Query unprocessed documents
    const docs = await queryUnprocessedDocs(LIMIT);
    console.log(`📄 Found ${docs.length} documents needing OCR\n`);

    if (docs.length === 0) {
      console.log('✅ All documents already processed!');
      return;
    }

    if (DRY_RUN) {
      console.log('⚠️  DRY RUN MODE - No changes will be made\n');
    }

    // Process each document
    for (const doc of docs) {
      await processDocument(doc);

      // Rate limiting is handled in analyzeDocument()
      // No additional delay needed here
    }

    console.log('\n' + '='.repeat(60));
    console.log('Summary');
    console.log('='.repeat(60));
    console.log(`Documents to process: ${docs.length}`);
    console.log(`Processed: ${processed}`);
    console.log(`Failed: ${failed}`);
    console.log(`API Requests used: ${requestCount}/${MAX_DAILY_REQUESTS} (${(requestCount/MAX_DAILY_REQUESTS*100).toFixed(1)}%)`);
    console.log(`Rate limit delay: ${Math.round(DELAY_MS/1000)}s between requests`);

    if (DRY_RUN) {
      console.log('\n⚠️  Run without --dry-run to actually process files');
    }

  } catch (error) {
    console.error(`\n❌ Fatal error: ${error.message}`);
    process.exit(1);
  }
}

main();
