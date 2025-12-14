
import { DocumentRecord, AppSettings } from '../types';

const DB_NAME = 'ZoeAccountingDB';
const STORE_DOCUMENTS = 'documents';
const STORE_SETTINGS = 'settings';
const DB_VERSION = 2; // Incremented version

// Helper to open the database
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create documents store if not exists
      if (!db.objectStoreNames.contains(STORE_DOCUMENTS)) {
        db.createObjectStore(STORE_DOCUMENTS, { keyPath: 'id' });
      }

      // Create settings store if not exists
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'id' });
      }
    };
  });
};

// --- Documents ---

export const saveDocument = async (doc: DocumentRecord): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
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
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DOCUMENTS, 'readwrite');
    const store = tx.objectStore(STORE_DOCUMENTS);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// --- Settings ---

const DEFAULT_SETTINGS: AppSettings = {
  id: 'global',
  taxCategories: [
    '19% Vorsteuer',
    '7% Vorsteuer',
    '0% PV (Steuerfrei)',
    '0% IGL / Reverse Charge',
    'Steuerfrei (Kleinunternehmer)',
    'Keine Vorsteuer (Privatanteil)'
  ]
};

export const getSettings = async (): Promise<AppSettings> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SETTINGS, 'readonly');
    const store = tx.objectStore(STORE_SETTINGS);
    const request = store.get('global');
    
    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result as AppSettings);
      } else {
        // Return defaults if nothing saved yet
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
    // Ensure ID is global
    const toSave = { ...settings, id: 'global' };
    const request = store.put(toSave);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// --- Export ---

export const exportDatabaseToSQL = async (): Promise<string> => {
  const docs = await getAllDocuments();
  const timestamp = new Date().toISOString();
  
  let sql = `-- ZOE Solar Accounting PostgreSQL Export\n-- Generated: ${timestamp}\n\n`;
  
  sql += `CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY,
    zoe_number VARCHAR(50),
    file_name VARCHAR(255),
    file_hash VARCHAR(64),
    duplicate_of_id UUID,
    upload_date TIMESTAMP,
    status VARCHAR(20),
    vendor VARCHAR(255),
    document_date DATE,
    vendor_invoice_number VARCHAR(100),
    vendor_address TEXT,
    vendor_tax_id VARCHAR(50),
    net_amount DECIMAL(10,2),
    tax_amount_7 DECIMAL(10,2),
    tax_amount_19 DECIMAL(10,2),
    gross_amount DECIMAL(10,2),
    debit_account VARCHAR(10),
    credit_account VARCHAR(10),
    tax_category VARCHAR(100),
    payment_method VARCHAR(50),
    payment_status VARCHAR(20),
    payment_date DATE,
    description TEXT,
    cost_center VARCHAR(50),
    project VARCHAR(50),
    storage_location VARCHAR(255),
    recipient TEXT
);\n\n`;

  docs.forEach(doc => {
      const d = doc.data || {} as any;
      const clean = (val: any) => {
          if (val === undefined || val === null || val === '') return 'NULL';
          if (typeof val === 'number') return val;
          if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
          return `'${String(val).replace(/'/g, "''")}'`;
      };
      
      sql += `INSERT INTO documents (
    id, zoe_number, file_name, file_hash, duplicate_of_id, upload_date, status, 
    vendor, document_date, vendor_invoice_number, vendor_address, vendor_tax_id,
    net_amount, tax_amount_7, tax_amount_19, gross_amount, 
    debit_account, credit_account, tax_category, payment_method, payment_status, payment_date,
    description, cost_center, project, storage_location, recipient
) VALUES (
    '${doc.id}',
    ${clean(d.eigeneBelegNummer)},
    ${clean(doc.fileName)},
    ${clean(doc.fileHash)},
    ${clean(doc.duplicateOfId)},
    '${doc.uploadDate}',
    '${doc.status}',
    ${clean(d.lieferantName)},
    ${clean(d.belegDatum)},
    ${clean(d.belegNummerLieferant)},
    ${clean(d.lieferantAdresse)},
    ${clean(d.steuernummer)},
    ${clean(d.nettoBetrag)},
    ${clean(d.mwstBetrag7)},
    ${clean(d.mwstBetrag19)},
    ${clean(d.bruttoBetrag)},
    ${clean(d.sollKonto)},
    ${clean(d.habenKonto)},
    ${clean(d.steuerKategorie)},
    ${clean(d.zahlungsmethode)},
    ${clean(d.zahlungsStatus)},
    ${clean(d.zahlungsDatum)},
    ${clean(d.beschreibung)},
    ${clean(d.kostenstelle)},
    ${clean(d.projekt)},
    ${clean(d.aufbewahrungsOrt)},
    ${clean(d.rechnungsEmpfaenger)}
) ON CONFLICT (id) DO NOTHING;\n`;
  });
  
  return sql;
};
