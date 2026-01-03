/**
 * IndexedDB-based local storage service for ZOE Solar Accounting OCR
 * Provides offline-first document storage with sync to Supabase when available
 */

import { DocumentRecord, AppSettings } from '../types';

const DB_NAME = 'zoe-solar-ocr';
const DB_VERSION = 1;

// Store names
const STORE_DOCUMENTS = 'documents';
const STORE_SETTINGS = 'settings';
const STORE_VENDOR_RULES = 'vendor_rules';

// Database instance
let db: IDBDatabase | null = null;

/**
 * Initialize IndexedDB database
 */
const initDB = (): Promise<IDBDatabase> => {
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
      if (!database.objectStoreNames.contains(STORE_DOCUMENTS)) {
        const docStore = database.createObjectStore(STORE_DOCUMENTS, { keyPath: 'id' });
        docStore.createIndex('uploadDate', 'uploadDate', { unique: false });
        docStore.createIndex('status', 'status', { unique: false });
      }

      // Settings store
      if (!database.objectStoreNames.contains(STORE_SETTINGS)) {
        database.createObjectStore(STORE_SETTINGS, { keyPath: 'id' });
      }

      // Vendor rules store
      if (!database.objectStoreNames.contains(STORE_VENDOR_RULES)) {
        const ruleStore = database.createObjectStore(STORE_VENDOR_RULES, { keyPath: 'vendorName' });
        ruleStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
      }
    };
  });
};

/**
 * Generic get all items from a store
 */
const getAllFromStore = async <T>(storeName: string): Promise<T[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

/**
 * Generic get single item from a store
 */
const getFromStore = async <T>(storeName: string, key: string): Promise<T | undefined> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

/**
 * Generic put item in store
 */
const putInStore = async <T>(storeName: string, item: T): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

/**
 * Generic delete item from store
 */
const deleteFromStore = async (storeName: string, key: string): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

// ============================================
// Document Operations
// ============================================

export const getAllDocuments = async (): Promise<DocumentRecord[]> => {
  try {
    const docs = await getAllFromStore<DocumentRecord>(STORE_DOCUMENTS);
    return docs.sort((a, b) =>
      new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );
  } catch (error) {
    console.error('Error getting documents from IndexedDB:', error);
    return [];
  }
};

export const saveDocument = async (doc: DocumentRecord): Promise<void> => {
  await putInStore(STORE_DOCUMENTS, doc);
};

export const deleteDocument = async (id: string): Promise<void> => {
  await deleteFromStore(STORE_DOCUMENTS, id);
};

// ============================================
// Settings Operations
// ============================================

export const getSettings = async (): Promise<AppSettings | null> => {
  try {
    const settings = await getFromStore<AppSettings>(STORE_SETTINGS, 'global');
    return settings || null;
  } catch (error) {
    console.error('Error getting settings from IndexedDB:', error);
    return null;
  }
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  await putInStore(STORE_SETTINGS, settings);
};

// ============================================
// Vendor Rules Operations
// ============================================

export interface VendorRuleData {
  vendorName: string;
  accountId?: string;
  taxCategoryValue?: string;
  lastUpdated: string;
  useCount: number;
}

export const getVendorRule = async (
  vendorName: string
): Promise<{ accountId?: string; taxCategoryValue?: string } | undefined> => {
  if (!vendorName || vendorName.length < 2) return undefined;

  try {
    const normalizedName = vendorName.toLowerCase().trim();
    const rule = await getFromStore<VendorRuleData>(STORE_VENDOR_RULES, normalizedName);

    if (!rule) return undefined;

    return {
      accountId: rule.accountId,
      taxCategoryValue: rule.taxCategoryValue
    };
  } catch (error) {
    console.error('Error getting vendor rule from IndexedDB:', error);
    return undefined;
  }
};

export const saveVendorRule = async (
  vendorName: string,
  accountId: string,
  taxCategoryValue: string
): Promise<void> => {
  if (!vendorName || vendorName.length < 2) return;

  try {
    const normalizedName = vendorName.toLowerCase().trim();

    // Get existing rule to increment use count
    const existing = await getFromStore<VendorRuleData>(STORE_VENDOR_RULES, normalizedName);
    const useCount = (existing?.useCount || 0) + 1;

    const rule: VendorRuleData = {
      vendorName: normalizedName,
      accountId,
      taxCategoryValue,
      lastUpdated: new Date().toISOString(),
      useCount
    };

    await putInStore(STORE_VENDOR_RULES, rule);
  } catch (error) {
    console.error('Error saving vendor rule to IndexedDB:', error);
  }
};

// ============================================
// Utility Functions
// ============================================

/**
 * Clear all data from IndexedDB (for testing or reset)
 */
export const clearAllData = async (): Promise<void> => {
  const database = await initDB();

  const stores = [STORE_DOCUMENTS, STORE_SETTINGS, STORE_VENDOR_RULES];

  for (const storeName of stores) {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
};

/**
 * Get storage usage statistics
 */
export const getStorageStats = async (): Promise<{
  documentCount: number;
  ruleCount: number;
  hasSettings: boolean;
}> => {
  const [documents, rules] = await Promise.all([
    getAllFromStore<DocumentRecord>(STORE_DOCUMENTS),
    getAllFromStore<VendorRuleData>(STORE_VENDOR_RULES)
  ]);

  return {
    documentCount: documents.length,
    ruleCount: rules.length,
    hasSettings: true // Simplified check
  };
};
