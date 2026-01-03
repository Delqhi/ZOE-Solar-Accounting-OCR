const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const UPLOADS_DIR = "/home/ubuntu/belege-uploads";

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function extractDateFromFilename(filename) {
  const match = filename.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function extractVendorFromFilename(filename) {
  const withoutExt = filename.replace(/\.pdf$/i, "");
  const withoutUuid = withoutExt.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[_-]?/i, "");
  return withoutUuid.trim().replace(/[_-]/g, " ") || "Unbekannt";
}

function escaped(val) {
  if (val === null) return "NULL";
  if (typeof val === "number") return val;
  return "'" + String(val).replace(/'/g, "''") + "'";
}

async function insertToDatabase(doc) {
  const sql = `INSERT INTO belege (id, file_data, file_name, file_type, lieferant_name, lieferant_adresse, beleg_datum, brutto_betrag, mwst_betrag, mwst_satz, steuerkategorie, skr03_konto, line_items, status, score, created_at) VALUES (${escaped(doc.id)}, ${escaped(doc.file_data)}, ${escaped(doc.file_name)}, ${escaped(doc.file_type)}, ${escaped(doc.lieferant_name)}, ${escaped(doc.lieferant_adresse)}, ${escaped(doc.beleg_datum)}, ${escaped(doc.brutto_betrag)}, ${escaped(doc.mwst_betrag)}, ${escaped(doc.mwst_satz)}, ${escaped(doc.steuerkategorie)}, ${escaped(doc.skr03_konto)}, ${escaped(doc.line_items)}, ${escaped(doc.status)}, ${escaped(doc.score)}, ${escaped(doc.created_at)}) ON CONFLICT (id) DO NOTHING;`;

  try {
    // Write SQL to temp file and execute via docker exec with cat
    const tmpSqlPath = `/tmp/sql_${doc.id}.sql`;
    fs.writeFileSync(tmpSqlPath, sql);
    execSync(`cat ${tmpSqlPath} | docker exec -i ngze-techstack-supabase-db-1 psql -U postgres -d postgres`, { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 });
    fs.unlinkSync(tmpSqlPath);
  } catch (e) {
    throw new Error(e.message);
  }
}

async function processFile(filePath) {
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName).toLowerCase();

  if (ext !== ".pdf") return false;

  try {
    console.log("Processing: " + fileName);
    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString("base64");

    const belegDatum = extractDateFromFilename(fileName);
    const lieferantName = extractVendorFromFilename(fileName);
    const docId = generateUUID();

    const doc = {
      id: docId,
      file_data: base64Data,
      file_name: fileName,
      file_type: "application/pdf",
      lieferant_name: lieferantName,
      lieferant_adresse: null,
      beleg_datum: belegDatum,
      brutto_betrag: null,
      mwst_betrag: null,
      mwst_satz: null,
      steuerkategorie: null,
      skr03_konto: null,
      line_items: null,
      status: "REVIEW_NEEDED",
      score: null,
      created_at: new Date().toISOString()
    };

    await insertToDatabase(doc);
    fs.unlinkSync(filePath);
    console.log("Done: " + docId);
    return true;
  } catch (error) {
    console.error("Error: " + error.message);
    return false;
  }
}

async function main() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    console.error("Directory not found: " + UPLOADS_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(UPLOADS_DIR).map(f => path.join(UPLOADS_DIR, f)).filter(f => fs.statSync(f).isFile());
  console.log("Found " + files.length + " files");

  let processed = 0;
  for (const filePath of files) {
    if (await processFile(filePath)) processed++;
    await new Promise(r => setTimeout(r, 500));
  }

  console.log("Done! Processed: " + processed);
}

main();
