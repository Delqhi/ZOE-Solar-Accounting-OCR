
import { DocumentRecord, AppSettings, AccountGroupDefinition, VendorRule, TaxCategoryDefinition, AccountDefinition } from '../types';

const DB_NAME = 'ZoeAccountingDB';
const STORE_DOCUMENTS = 'documents';
const STORE_SETTINGS = 'settings';
const STORE_VENDOR_RULES = 'vendor_rules';
const DB_VERSION = 5; // Bumped for new schema

// --- New Default Configurations ---

const DEFAULT_TAX_DEFINITIONS: TaxCategoryDefinition[] = [
  { value: "19_pv", label: "19% Vorsteuer", ust_satz: 0.19, vorsteuer: true },
  { value: "7_pv", label: "7% Vorsteuer", ust_satz: 0.07, vorsteuer: true },
  { value: "0_pv", label: "0% PV (Steuerfrei)", ust_satz: 0.00, vorsteuer: true },
  { value: "0_igl_rc", label: "0% IGL / Reverse Charge", ust_satz: 0.00, vorsteuer: false, reverse_charge: true },
  { value: "steuerfrei_kn", label: "Steuerfrei (Kleinunternehmer)", ust_satz: 0.00, vorsteuer: false },
  { value: "keine_pv", label: "Keine Vorsteuer (Privatanteil)", ust_satz: 0.00, vorsteuer: false }
];

const DEFAULT_ACCOUNT_DEFINITIONS: AccountDefinition[] = [
  { id: "wareneingang", name: "Wareneingang / Material", skr03: "3400", steuerkategorien: ["19_pv", "0_igl_rc"] },
  { id: "fremdleistung", name: "Fremdleistungen", skr03: "3100", steuerkategorien: ["19_pv", "0_igl_rc"] },
  { id: "buero", name: "Büromaterial", skr03: "4930", steuerkategorien: ["19_pv", "7_pv"] },
  { id: "reise", name: "Reisekosten", skr03: "4670", steuerkategorien: ["19_pv", "7_pv"] },
  { id: "vertretung", name: "Vertretungskosten", skr03: "4610", steuerkategorien: ["19_pv"] },
  { id: "software", name: "Software/Lizenzen", skr03: "4964", steuerkategorien: ["19_pv"] },
  { id: "internet", name: "Internet/Telefon", skr03: "4920", steuerkategorien: ["19_pv"] },
  { id: "makler", name: "Maklerprovisionen", skr03: "4760", steuerkategorien: ["19_pv", "0_igl_rc"] },
  { id: "abschreibung", name: "Abschreibungen", skr03: "4830", steuerkategorien: ["19_pv"] },
  { id: "fuhrpark", name: "Fuhrpark/Kraftstoff", skr03: "4530", steuerkategorien: ["19_pv"] },
  { id: "maschinen", name: "Maschinen/Anlagen", skr03: "0200", steuerkategorien: ["19_pv"] },
  { id: "werbung", name: "Werbung", skr03: "4600", steuerkategorien: ["19_pv"] },
  { id: "miete", name: "Miete/Pachten", skr03: "4210", steuerkategorien: ["19_pv"] },
  { id: "reparatur", name: "Reparatur/Wartung", skr03: "4800", steuerkategorien: ["19_pv"] },
  { id: "beratung", name: "Beratung/Steuerberater", skr03: "4950", steuerkategorien: ["19_pv"] },
  { id: "versicherung", name: "Versicherungen", skr03: "4360", steuerkategorien: ["19_pv"] },
  { id: "strom", name: "Strom/Gas/Wasser", skr03: "4240", steuerkategorien: ["19_pv"] },
  { id: "ausbildung", name: "Fortbildung", skr03: "4945", steuerkategorien: ["19_pv"] },
  { id: "portokosten", name: "Porto/Versand", skr03: "4910", steuerkategorien: ["19_pv"] },
  { id: "sonstiges", name: "Sonstige Betriebsausgaben", skr03: "4900", steuerkategorien: ["19_pv", "7_pv"] },
  { id: "privat", name: "Privatanteil", skr03: "1800", steuerkategorien: ["keine_pv"] }
];

const DEFAULT_ACCOUNT_GROUPS: AccountGroupDefinition[] = [
  // Keeping these for legacy support / fallback reference
  { id: 'pv', name: 'Photovoltaik', skr03: '8400', taxType: '0%', keywords: ['zoe solar', 'pv-montage', 'nullsteuersatz'], isRevenue: true },
  { id: 'mat', name: 'Wareneingang/Material', skr03: '3400', taxType: '19%', keywords: ['baustoff', 'kabel'], isRevenue: false },
];

const DEFAULT_SETTINGS: AppSettings = {
  id: 'global',
  taxDefinitions: DEFAULT_TAX_DEFINITIONS,
  accountDefinitions: DEFAULT_ACCOUNT_DEFINITIONS,
  accountGroups: DEFAULT_ACCOUNT_GROUPS,
  ocrConfig: {
    scores: {
      "0": { min_fields: 0, desc: "Kein gültiger Beleg" },
      "5": { min_fields: 4, desc: "Basisdaten vorhanden" },
      "10": { min_fields: 7, desc: "Perfekt erkannt" }
    },
    required_fields: ["belegDatum", "bruttoBetrag", "lieferantName"],
    field_weights: { bruttoBetrag: 3, belegDatum: 3, lieferantName: 2, belegNummerLieferant: 2 },
    regex_patterns: { belegDatum: "\\d{4}-\\d{2}-\\d{2}" },
    validation_rules: { sum_check: true, date_check: true, min_confidence: 0.8 }
  }
};

// --- IndexedDB Setup ---
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_DOCUMENTS)) {
        db.createObjectStore(STORE_DOCUMENTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_VENDOR_RULES)) {
        db.createObjectStore(STORE_VENDOR_RULES, { keyPath: 'vendorName' });
      }
    };
  });
};

export const getSettings = async (): Promise<AppSettings> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SETTINGS, 'readonly');
    const store = tx.objectStore(STORE_SETTINGS);
    const request = store.get('global');
    request.onsuccess = () => {
      const result = request.result as AppSettings;
      if (result) {
        // Ensure new fields exist if migrating
        if (!result.taxDefinitions) result.taxDefinitions = DEFAULT_TAX_DEFINITIONS;
        
        // AUTO-MERGE: Ensure critical default accounts exist even if user has saved settings
        if (!result.accountDefinitions) {
            result.accountDefinitions = DEFAULT_ACCOUNT_DEFINITIONS;
        } else {
            // Check specifically for Wareneingang and Fremdleistung, add if missing
            const missingDefaults = DEFAULT_ACCOUNT_DEFINITIONS.filter(def => 
                !result.accountDefinitions.some(existing => existing.id === def.id)
            );
            if (missingDefaults.length > 0) {
                // Merge carefully: Preserve existing, but ensure defaults have SKR03 if they were missing it (migrating old data)
                const updatedDefs = result.accountDefinitions.map(acc => {
                    const def = DEFAULT_ACCOUNT_DEFINITIONS.find(d => d.id === acc.id);
                    if (def && !acc.skr03) return { ...acc, skr03: def.skr03 };
                    return acc;
                });
                
                result.accountDefinitions = [...missingDefaults, ...updatedDefs];
                saveSettings(result); 
            }
        }
        resolve(result);
      } else {
        resolve(DEFAULT_SETTINGS);
      }
    };
    request.onerror = () => reject(request.error);
  });
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SETTINGS, 'readwrite');
    const store = tx.objectStore(STORE_SETTINGS);
    const toSave = { ...settings, id: 'global' };
    const request = store.put(toSave);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const saveDocument = async (doc: DocumentRecord): Promise<void> => {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_DOCUMENTS, 'readwrite');
    const store = tx.objectStore(STORE_DOCUMENTS);
    const request = store.put(doc);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getAllDocuments = async (): Promise<DocumentRecord[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DOCUMENTS, 'readonly');
    const store = tx.objectStore(STORE_DOCUMENTS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as DocumentRecord[]);
    request.onerror = () => reject(request.error);
  });
};

export const deleteDocument = async (id: string): Promise<void> => {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_DOCUMENTS, 'readwrite');
    const store = tx.objectStore(STORE_DOCUMENTS);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// --- Memory System: Vendor Rules ---

export const getVendorRule = async (vendorName: string): Promise<VendorRule | undefined> => {
    if (!vendorName || vendorName.length < 2) return undefined;
    
    const db = await openDB();
    const normalized = vendorName.trim().toLowerCase();
    
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_VENDOR_RULES, 'readonly');
        const store = tx.objectStore(STORE_VENDOR_RULES);
        const request = store.get(normalized);
        request.onsuccess = () => resolve(request.result as VendorRule);
        request.onerror = () => reject(request.error);
    });
};

export const saveVendorRule = async (vendorName: string, accountId: string, taxCategoryValue: string): Promise<void> => {
    if (!vendorName || vendorName.length < 2) return;
    
    const db = await openDB();
    const normalized = vendorName.trim().toLowerCase();
    
    // Get existing to increment count
    const existing = await getVendorRule(vendorName);
    
    const rule: VendorRule = {
        vendorName: normalized,
        accountGroupName: 'legacy', // unused
        accountId: accountId,
        taxCategoryValue: taxCategoryValue,
        useCount: (existing?.useCount || 0) + 1,
        lastUpdated: new Date().toISOString()
    };
    
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_VENDOR_RULES, 'readwrite');
        const store = tx.objectStore(STORE_VENDOR_RULES);
        const request = store.put(rule);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// --- SQL Export (Updated for PostgreSQL Extension) ---
export const exportDatabaseToSQL = async (): Promise<string> => {
  const docs = await getAllDocuments();
  const timestamp = new Date().toISOString();
  
  let sql = `-- ZOE Solar Accounting Export\n-- Generated: ${timestamp}\n\n`;

  // 1. New Tables Definition
  sql += `
CREATE TABLE IF NOT EXISTS steuerkategorien (
  id SERIAL PRIMARY KEY,
  value VARCHAR(50) UNIQUE NOT NULL,
  label VARCHAR(100),
  ust_satz NUMERIC(5,4),
  vorsteuer BOOLEAN DEFAULT TRUE,
  reverse_charge BOOLEAN DEFAULT FALSE
);\n`;

  sql += `
CREATE TABLE IF NOT EXISTS kontierungskonten (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100),
  skr03 VARCHAR(10),
  allowed_tax_categories TEXT[]
);\n`;

  // 2. Belege Table Extension
  sql += `
CREATE TABLE IF NOT EXISTS belege (
    id UUID PRIMARY KEY,
    datum DATE,
    lieferant VARCHAR(255),
    betrag DECIMAL(10,2),
    ust_satz DECIMAL(5,4),
    vorsteuer_betrag DECIMAL(10,2),
    
    -- New Fields
    steuerkategorie VARCHAR(50),
    kontierungskonto VARCHAR(50),
    soll_konto VARCHAR(10),
    haben_konto VARCHAR(10),
    konto_ust_satz NUMERIC(5,4),
    
    ocr_score INTEGER,
    ocr_rationale TEXT,
    
    ocr_text TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);\n\n`;

  // 3. Insert Config Data
  DEFAULT_TAX_DEFINITIONS.forEach(t => {
      sql += `INSERT INTO steuerkategorien (value, label, ust_satz, vorsteuer, reverse_charge) VALUES ('${t.value}', '${t.label}', ${t.ust_satz}, ${t.vorsteuer}, ${t.reverse_charge || false}) ON CONFLICT (value) DO NOTHING;\n`;
  });
  DEFAULT_ACCOUNT_DEFINITIONS.forEach(a => {
      sql += `INSERT INTO kontierungskonten (id, name, skr03, allowed_tax_categories) VALUES ('${a.id}', '${a.name}', '${a.skr03}', ARRAY['${a.steuerkategorien.join("','")}']) ON CONFLICT (id) DO NOTHING;\n`;
  });

  sql += "\n-- Data Insertion\n";

  docs.forEach(doc => {
      const d = doc.data || {} as any;
      const safeText = (s: string) => s ? `'${s.replace(/'/g, "''")}'` : 'NULL';
      const safeNum = (n: number) => n !== undefined && n !== null ? n : 'NULL';
      const safeDate = (dateStr: string) => /^\d{4}-\d{2}-\d{2}$/.test(dateStr || '') ? `'${dateStr}'` : 'NULL';
      
      sql += `INSERT INTO belege (
    id, datum, lieferant, betrag, 
    steuerkategorie, kontierungskonto, soll_konto, haben_konto, konto_ust_satz, 
    ocr_score, ocr_rationale
) VALUES (
    '${doc.id}',
    ${safeDate(d.belegDatum)},
    ${safeText(d.lieferantName)},
    ${safeNum(d.bruttoBetrag)},
    ${safeText(d.steuerkategorie)},
    ${safeText(d.kontierungskonto)},
    ${safeText(d.sollKonto)},
    ${safeText(d.habenKonto)},
    NULL, 
    ${safeNum(d.ocr_score)},
    ${safeText(d.ocr_rationale)}
);\n`;
  });
  
  return sql;
};
