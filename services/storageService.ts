/**
 * Storage Service
 * IndexedDB wrapper for local-first persistence
 */

import { DocumentRecord, AppSettings, VendorRule } from '../types';

// IndexedDB Configuration
const DB_NAME = 'zoe-accounting-ocr';
const DB_VERSION = 1;
const STORE_DOCUMENTS = 'documents';
const STORE_SETTINGS = 'settings';
const STORE_VENDOR_RULES = 'vendor_rules';

let db: IDBDatabase | null = null;

// Initialize IndexedDB connection
function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create stores if they don't exist
      if (!database.objectStoreNames.contains(STORE_DOCUMENTS)) {
        const docStore = database.createObjectStore(STORE_DOCUMENTS, { keyPath: 'id' });
        docStore.createIndex('uploadDate', 'uploadDate', { unique: false });
        docStore.createIndex('status', 'status', { unique: false });
      }

      if (!database.objectStoreNames.contains(STORE_SETTINGS)) {
        database.createObjectStore(STORE_SETTINGS, { keyPath: 'id' });
      }

      if (!database.objectStoreNames.contains(STORE_VENDOR_RULES)) {
        const ruleStore = database.createObjectStore(STORE_VENDOR_RULES, { keyPath: 'vendorName' });
        ruleStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
      }
    };
  });
}

// Generic transaction helper
async function withTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => Promise<T>
): Promise<T> {
  const database = await getDB();
  const transaction = database.transaction([storeName], mode);
  const store = transaction.objectStore(storeName);

  return new Promise((resolve, reject) => {
    const request = operation(store);

    request.then(resolve).catch(reject);

    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => {};
  });
}

// ==================== Document Operations ====================

export async function getAllDocuments(): Promise<DocumentRecord[]> {
  return withTransaction(STORE_DOCUMENTS, 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  });
}

export async function getDocument(id: string): Promise<DocumentRecord | null> {
  return withTransaction(STORE_DOCUMENTS, 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  });
}

export async function saveDocument(document: DocumentRecord): Promise<DocumentRecord> {
  return withTransaction(STORE_DOCUMENTS, 'readwrite', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.put(document);
      request.onsuccess = () => resolve(document);
      request.onerror = () => reject(request.error);
    });
  });
}

export async function deleteDocument(id: string): Promise<void> {
  return withTransaction(STORE_DOCUMENTS, 'readwrite', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

export async function clearDocuments(): Promise<void> {
  return withTransaction(STORE_DOCUMENTS, 'readwrite', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

// ==================== Settings Operations ====================

export async function getSettings(): Promise<AppSettings | null> {
  return withTransaction(STORE_SETTINGS, 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.get('app-settings');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  });
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  return withTransaction(STORE_SETTINGS, 'readwrite', (store) => {
    return new Promise((resolve, reject) => {
      const settingsWithId = { ...settings, id: 'app-settings' };
      const request = store.put(settingsWithId);
      request.onsuccess = () => resolve(settings);
      request.onerror = () => reject(request.error);
    });
  });
}

// ==================== Vendor Rules Operations ====================

export async function getVendorRule(vendorName: string): Promise<VendorRule | null> {
  return withTransaction(STORE_VENDOR_RULES, 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.get(vendorName);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  });
}

export async function saveVendorRule(
  vendorName: string,
  accountId: string,
  taxCategoryValue: string
): Promise<VendorRule> {
  return withTransaction(STORE_VENDOR_RULES, 'readwrite', (store) => {
    return new Promise((resolve, reject) => {
      const rule: VendorRule = {
        vendorName,
        accountId,
        taxCategoryValue,
        lastUpdated: new Date().toISOString(),
        useCount: 1,
        accountGroupName: '', // Legacy field, kept for compatibility
      };
      const request = store.put(rule);
      request.onsuccess = () => resolve(rule);
      request.onerror = () => reject(request.error);
    });
  });
}

export async function getAllVendorRules(): Promise<VendorRule[]> {
  return withTransaction(STORE_VENDOR_RULES, 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  });
}

// ==================== Export Operations ====================

export async function exportToJSON(): Promise<string> {
  const documents = await getAllDocuments();
  const settings = await getSettings();

  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      documents,
      settings,
      version: '1.0.0',
    },
    null,
    2
  );
}

export async function exportToCSV(): Promise<string> {
  const documents = await getAllDocuments();

  if (documents.length === 0) {
    return '';
  }

  // CSV Header
  const headers = [
    'ID',
    'Date',
    'Vendor',
    'Net Amount',
    'Tax Amount',
    'Gross Amount',
    'Account',
    'Status',
  ];

  // CSV Rows
  const rows = documents.map((doc) => {
    const data = doc.data;
    return [
      doc.id,
      data?.belegDatum || '',
      data?.lieferantName || '',
      data?.nettoBetrag || 0,
      data?.mwstBetrag19 || data?.mwstBetrag7 || 0,
      data?.bruttoBetrag || 0,
      data?.konto_skr03 || data?.kontierungskonto || '',
      doc.status,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

// ==================== Bulk Operations ====================

export async function importDocuments(documents: DocumentRecord[]): Promise<void> {
  for (const doc of documents) {
    await saveDocument(doc);
  }
}

export async function exportDocumentsToSQL(
  documents: DocumentRecord[],
  settings: AppSettings
): Promise<string> {
  const tableName = 'zoe_documents';
  const statements: string[] = [];

  for (const doc of documents) {
    const data = doc.data;
    if (!data) continue;

    const values = [
      `'${doc.id}'`,
      `'${doc.uploadDate}'`,
      `'${doc.fileName.replace(/'/g, "''")}'`,
      `'${data.lieferantName.replace(/'/g, "''")}'`,
      data.nettoBetrag || 0,
      data.bruttoBetrag || 0,
      data.mwstBetrag19 || 0,
      `'${data.konto_skr03 || data.kontierungskonto || ''}'`,
      `'${doc.status}'`,
    ].join(', ');

    statements.push(`INSERT INTO ${tableName} VALUES (${values});`);
  }

  return statements.join('\n');
}
