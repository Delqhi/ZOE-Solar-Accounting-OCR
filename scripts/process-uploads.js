#!/usr/bin/env node
/**
 * Simple Batch Upload Script for belege-uploads
 *
 * Uploads all PDFs to Supabase via direct DB connection through SSH tunnel.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = '/Users/jeremy/conductor/repos/zoe-solar-accounting-ocr/belege-uploads';
const ENV_PATH = path.resolve(__dirname, '../.env');

// Load env vars from .env file
const envContent = fs.readFileSync(ENV_PATH, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) {
    const key = match[1];
    const value = match[2].replace(/^["']|["']$/g, '');
    envVars[key] = value;
  }
});

const dbPassword = envVars['SUPABASE_DB_PASSWORD'] || '';
const gitlabToken = envVars['GITLAB_API_TOKEN'] || '';
const gitlabUrl = envVars['GITLAB_INSTANCE_URL'] || 'https://gitlab.com';
const gitlabProjectPath = envVars['GITLAB_STORAGE_PROJECT_PATH'] || '';

// Config
const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT_ARG = process.argv.find(arg => arg.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1], 10) : Infinity;

let processed = 0;
let failed = 0;
let deleted = 0;

function extractDateFromFilename(filename) {
  const match = filename.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function extractVendorFromFilename(filename) {
  const withoutExt = filename.replace(/\.pdf$/i, '');
  const withoutUuid = withoutExt.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[_-]?/i, '');
  return withoutUuid.trim().replace(/[_-]/g, ' ') || 'Unbekannt';
}

async function uploadToGitLabStorage(base64Data, fileName, mimeType) {
  if (!gitlabToken || !gitlabUrl || !gitlabProjectPath) {
    console.log('  ⚠️  GitLab not configured - skipping upload');
    return null;
  }

  const fileId = uuidv4();
  const extension = fileName.split('.').pop() || 'pdf';
  const storagePath = `documents/${fileId}.${extension}`;
  const projectEncoded = encodeURIComponent(gitlabProjectPath);

  try {
    const response = await fetch(
      `${gitlabUrl}/api/v4/projects/${projectEncoded}/repository/files/${encodeURIComponent(storagePath)}`,
      {
        method: 'PUT',
        headers: {
          'PRIVATE-TOKEN': gitlabToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          branch: 'main',
          author_email: 'system@zoe-solar.de',
          author_name: 'ZOE Solar System',
          content: base64Data,
          commit_message: `Add document: ${fileName}`,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitLab upload failed: ${error}`);
    }

    return { url: `${gitlabUrl}/${gitlabProjectPath}/-/raw/main/${storagePath}` };
  } catch (error) {
    console.error(`  ❌ GitLab error: ${error.message}`);
    return null;
  }
}

async function insertToDatabase(doc) {
  return new Promise((resolve, reject) => {
    const escaped = (val) => {
      if (val === null) return 'NULL';
      if (typeof val === 'number') return val;
      return `'${String(val).replace(/'/g, "''")}'`;
    };

    const sql = `
      INSERT INTO belege (id, file_data, file_name, file_type, lieferant_name, lieferant_adresse,
                          beleg_datum, brutto_betrag, mwst_betrag, mwst_satz, steuerkategorie,
                          skr03_konto, line_items, status, score, created_at)
      VALUES (${escaped(doc.id)}, ${escaped(doc.file_data)}, ${escaped(doc.file_name)}, ${escaped(doc.file_type)},
              ${escaped(doc.lieferant_name)}, ${escaped(doc.lieferant_adresse)}, ${escaped(doc.beleg_datum)},
              ${escaped(doc.brutto_betrag)}, ${escaped(doc.mwst_betrag)}, ${escaped(doc.mwst_satz)},
              ${escaped(doc.steuerkategorie)}, ${escaped(doc.skr03_konto)}, ${escaped(doc.line_items)},
              ${escaped(doc.status)}, ${escaped(doc.score)}, ${escaped(doc.created_at)})
      ON CONFLICT (id) DO NOTHING;
    `;

    // Execute via SSH tunnel to the pooler
    // Use echo to pipe SQL directly to docker exec
    const escapedSql = sql.replace(/'/g, "'\\''").replace(/\n/g, ' ').trim();
    const sshCmd = `echo '${escapedSql}' | docker exec -i ngze-techstack-supabase-db-1 psql -U postgres -d postgres`;

    const psql = spawn('ssh', [
      '-o', 'StrictHostKeyChecking=no',
      'ubuntu@130.162.235.142',
      sshCmd
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stderr = '';
    psql.stderr.on('data', data => stderr += data.toString());

    psql.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`psql error: ${stderr}`));
    });
  });
}

async function processFile(filePath) {
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName).toLowerCase();

  if (ext !== '.pdf') {
    console.log(`  Skipping non-PDF: ${fileName}`);
    return false;
  }

  try {
    console.log(`\n📄 Processing: ${fileName}`);

    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');

    const belegDatum = extractDateFromFilename(fileName);
    const lieferantName = extractVendorFromFilename(fileName);
    const docId = uuidv4();

    const doc = {
      id: docId,
      file_data: base64Data,
      file_name: fileName,
      file_type: 'application/pdf',
      lieferant_name: lieferantName,
      lieferant_adresse: null,
      beleg_datum: belegDatum,
      brutto_betrag: null,
      mwst_betrag: null,
      mwst_satz: null,
      steuerkategorie: null,
      skr03_konto: null,
      line_items: null,
      status: 'REVIEW_NEEDED',
      score: null,
      created_at: new Date().toISOString()
    };

    console.log('  💾 Saving to Supabase...');
    if (!DRY_RUN) {
      await insertToDatabase(doc);
    }

    console.log('  📤 Uploading to GitLab Storage...');
    if (!DRY_RUN) {
      await uploadToGitLabStorage(base64Data, fileName, 'application/pdf');
    }

    console.log('  🗑️  Removing from uploads directory...');
    if (!DRY_RUN) {
      fs.unlinkSync(filePath);
      deleted++;
    }

    processed++;
    console.log(`  ✅ Done: ${docId}`);
    return true;

  } catch (error) {
    console.error(`  ❌ Error: ${error instanceof Error ? error.message : error}`);
    failed++;
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('ZOE Solar - Simple Document Batch Uploader');
  console.log('='.repeat(60));
  console.log(`\n📁 Uploads directory: ${UPLOADS_DIR}`);
  console.log(`🔧 Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`🔧 GitLab: ${gitlabToken ? 'configured' : 'NOT configured'}`);
  if (LIMIT !== Infinity) console.log(`📊 Limit: ${LIMIT} files`);
  console.log('');

  if (!fs.existsSync(UPLOADS_DIR)) {
    console.error(`❌ Directory not found: ${UPLOADS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(UPLOADS_DIR)
    .map(f => path.join(UPLOADS_DIR, f))
    .filter(f => fs.statSync(f).isFile())
    .sort();

  console.log(`📄 Found ${files.length} files to process`);

  if (DRY_RUN) console.log('\n⚠️  DRY RUN MODE - No files will be modified\n');

  let count = 0;
  for (const filePath of files) {
    if (count >= LIMIT) {
      console.log(`\n⚠️  Limit reached (${LIMIT} files). Stopping.`);
      break;
    }

    await processFile(filePath);
    count++;

    if (!DRY_RUN && count < files.length && count < LIMIT) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Total files found: ${files.length}`);
  console.log(`Processed: ${processed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Deleted from uploads: ${deleted}`);

  if (DRY_RUN) {
    console.log('\n⚠️  Run without --dry-run to actually process files');
  }
}

main().catch(console.error);
