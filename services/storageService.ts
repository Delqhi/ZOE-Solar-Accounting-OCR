/**
 * IndexedDB Storage Service for ZOE Solar Accounting OCR
 * Provides local-first storage with the same interface as supabaseService
 */

import { DocumentRecord, AppSettings, VendorRule } from '../types';

const DB_NAME = 'zoe-solar-ocr-db';
const DB_VERSION = 1;

// Store names
const STORES = {
  DOCUMENTS: 'documents',
  SETTINGS: 'settings',
  VENDOR_RULES: 'vendorRules',
  PRIVATE_DOCS: 'privateDocuments'
} as const;

let db: IDBDatabase | null = null;

/**
 * Initialize the IndexedDB database
 */
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Documents store
      if (!database.objectStoreNames.contains(STORES.DOCUMENTS)) {
        const docStore = database.createObjectStore(STORES.DOCUMENTS, { keyPath: 'id' });
        docStore.createIndex('uploadDate', 'uploadDate', { unique: false });
        docStore.createIndex('status', 'status', { unique: false });
        docStore.createIndex('fileHash', 'fileHash', { unique: false });
      }

      // Settings store
      if (!database.objectStoreNames.contains(STORES.SETTINGS)) {
        database.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
      }

      // Vendor rules store
      if (!database.objectStoreNames.contains(STORES.VENDOR_RULES)) {
        const vendorStore = database.createObjectStore(STORES.VENDOR_RULES, { keyPath: 'vendorName' });
        vendorStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        vendorStore.createIndex('useCount', 'useCount', { unique: false });
      }

      // Private documents store
      if (!database.objectStoreNames.contains(STORES.PRIVATE_DOCS)) {
        const privateStore = database.createObjectStore(STORES.PRIVATE_DOCS, { keyPath: 'id' });
        privateStore.createIndex('uploadDate', 'uploadDate', { unique: false });
      }
    };
  });
};

/**
 * Get a database connection
 */
const getDB = (): IDBDatabase => {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  return db;
};

// ==================== DOCUMENT OPERATIONS ====================

/**
 * Get all documents from IndexedDB
 */
export const getAllDocuments = async (): Promise<DocumentRecord[]> => {
  await initDB();
  return new Promise((resolve, reject) => {
    const database = getDB();
    const transaction = database.transaction(STORES.DOCUMENTS, 'readonly');
    const store = transaction.objectStore(STORES.DOCUMENTS);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get a single document by ID
 */
export const getDocument = async (id: string): Promise<DocumentRecord | null> => {
  await initDB();
  return new Promise((resolve, reject) => {
    const database = getDB();
    const transaction = database.transaction(STORES.DOCUMENTS, 'readonly');
    const store = transaction.objectStore(STORES.DOCUMENTS);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Save a document to IndexedDB
 */
export const saveDocument = async (doc: DocumentRecord): Promise<void> => {
  await initDB();
  return new Promise((resolve, reject) => {
    const database = getDB();
    const transaction = database.transaction(STORES.DOCUMENTS, 'readwrite');
    const store = transaction.objectStore(STORES.DOCUMENTS);
    const request = store.put(doc);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Delete a document from IndexedDB
 */
export const deleteDocument = async (id: string): Promise<void> => {
  await initDB();
  return new Promise((resolve, reject) => {
    const database = getDB();
    const transaction = database.transaction(STORES.DOCUMENTS, 'readwrite');
    const store = transaction.objectStore(STORES.DOCUMENTS);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Update a document in IndexedDB
 */
export const updateDocument = async (id: string, updates: Partial<DocumentRecord>): Promise<void> => {
  await initDB();
  const doc = await getDocument(id);
  if (!doc) {
    throw new Error(`Document ${id} not found`);
  }
  const updatedDoc = { ...doc, ...updates };
  await saveDocument(updatedDoc);
};

/**
 * Bulk update documents
 */
export const bulkUpdateDocuments = async (ids: string[], updates: Partial<DocumentRecord>): Promise<void> => {
  await initDB();
  const docs = await getAllDocuments();
  const toUpdate = docs.filter(d => ids.includes(d.id));

  for (const doc of toUpdate) {
    await saveDocument({ ...doc, ...updates });
  }
};

// ==================== SETTINGS OPERATIONS ====================

/**
 * Get settings from IndexedDB
 */
export const getSettings = async (): Promise<AppSettings | null> => {
  await initDB();
  return new Promise((resolve, reject) => {
    const database = getDB();
    const transaction = database.transaction(STORES.SETTINGS, 'readonly');
    const store = transaction.objectStore(STORES.SETTINGS);
    const request = store.get('app-settings');

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Save settings to IndexedDB
 */
export const saveSettings = async (settings: AppSettings): Promise<void> => {
  await initDB();
  const settingsWithId = { ...settings, id: 'app-settings' };
  return new Promise((resolve, reject) => {
    const database = getDB();
    const transaction = database.transaction(STORES.SETTINGS, 'readwrite');
    const store = transaction.objectStore(STORES.SETTINGS);
    const request = store.put(settingsWithId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Delete settings from IndexedDB
 */
export const deleteSettings = async (): Promise<void> => {
  await initDB();
  return new Promise((resolve, reject) => {
    const database = getDB();
    const transaction = database.transaction(STORES.SETTINGS, 'readwrite');
    const store = transaction.objectStore(STORES.SETTINGS);
    const request = store.delete('app-settings');

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// ==================== VENDOR RULES OPERATIONS ====================

/**
 * Get all vendor rules from IndexedDB
 */
export const getAllVendorRules = async (): Promise<VendorRule[]> => {
  await initDB();
  return new Promise((resolve, reject) => {
    const database = getDB();
    const transaction = database.transaction(STORES.VENDOR_RULES, 'readonly');
    const store = transaction.objectStore(STORES.VENDOR_RULES);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get a vendor rule by vendor name
 */
export const getVendorRule = async (vendorName: string): Promise<VendorRule | null> => {
  await initDB();
  const normalizedName = vendorName.toLowerCase().trim();

  // Try exact match first
  const allRules = await getAllVendorRules();
  const rule = allRules.find(r =>
    r.vendorName.toLowerCase() === normalizedName ||
    normalizedName.includes(r.vendorName.toLowerCase()) ||
    r.vendorName.toLowerCase().includes(normalizedName)
  ) || null;

  return rule;
};

/**
 * Save a vendor rule to IndexedDB
 */
export const saveVendorRule = async (
  vendorName: string,
  accountId: string,
  taxCategoryValue: string
): Promise<void> => {
  await initDB();

  const existingRule = await getVendorRule(vendorName);
  const now = new Date().toISOString();

  const rule: VendorRule = {
    vendorName,
    accountGroupName: accountId, // Legacy field
    accountId,
    taxCategoryValue,
    lastUpdated: now,
    useCount: existingRule ? existingRule.useCount + 1 : 1
  };

  return new Promise((resolve, reject) => {
    const database = getDB();
    const transaction = database.transaction(STORES.VENDOR_RULES, 'readwrite');
    const store = transaction.objectStore(STORES.VENDOR_RULES);
    const request = store.put(rule);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Delete a vendor rule from IndexedDB
 */
export const deleteVendorRule = async (vendorName: string): Promise<void> => {
  await initDB();
  return new Promise((resolve, reject) => {
    const database = getDB();
    const transaction = database.transaction(STORES.VENDOR_RULES, 'readwrite');
    const store = transaction.objectStore(STORES.VENDOR_RULES);
    const request = store.delete(vendorName);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get frequently used vendor rules (sorted by useCount)
 */
export const getTopVendorRules = async (limit: number = 10): Promise<VendorRule[]> => {
  await initDB();
  const allRules = await getAllVendorRules();
  return allRules
    .sort((a, b) => b.useCount - a.useCount)
    .slice(0, limit);
};

// ==================== PRIVATE DOCUMENTS OPERATIONS ====================

/**
 * Save a private document to IndexedDB
 */
export const savePrivateDocument = async (
  id: string,
  fileName: string,
  fileType: string,
  base64Data: string,
  data: any,
  reason: string
): Promise<void> => {
  await initDB();
  const doc = {
    id,
    fileName,
    fileType,
    base64Data,
    data,
    reason,
    uploadDate: new Date().toISOString()
  };

  return new Promise((resolve, reject) => {
    const database = getDB();
    const transaction = database.transaction(STORES.PRIVATE_DOCS, 'readwrite');
    const store = transaction.objectStore(STORES.PRIVATE_DOCS);
    const request = store.put(doc);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get all private documents from IndexedDB
 */
export const getAllPrivateDocuments = async (): Promise<any[]> => {
  await initDB();
  return new Promise((resolve, reject) => {
    const database = getDB();
    const transaction = database.transaction(STORES.PRIVATE_DOCS, 'readonly');
    const store = transaction.objectStore(STORES.PRIVATE_DOCS);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Delete a private document from IndexedDB
 */
export const deletePrivateDocument = async (id: string): Promise<void> => {
  await initDB();
  return new Promise((resolve, reject) => {
    const database = getDB();
    const transaction = database.transaction(STORES.PRIVATE_DOCS, 'readwrite');
    const store = transaction.objectStore(STORES.PRIVATE_DOCS);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Clear all data from IndexedDB
 */
export const clearAllData = async (): Promise<void> => {
  await initDB();
  const database = getDB();

  const stores = Object.values(STORES);
  for (const storeName of stores) {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    store.clear();
  }
};

/**
 * Get storage usage estimate
 */
export const getStorageEstimate = async (): Promise<{ usage: number; quota: number } | null> => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0
    };
  }
  return null;
};

/**
 * Check if database exists and has data
 */
export const checkDatabaseHealth = async (): Promise<{
  healthy: boolean;
  documentCount: number;
  settingsExist: boolean;
}> => {
  try {
    await initDB();
    const docs = await getAllDocuments();
    const settings = await getSettings();

    return {
      healthy: true,
      documentCount: docs.length,
      settingsExist: !!settings
    };
  } catch (e) {
    console.error('Database health check failed:', e);
    return {
      healthy: false,
      documentCount: 0,
      settingsExist: false
    };
  }
};
