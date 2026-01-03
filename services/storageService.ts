import { DocumentRecord, AppSettings, ExtractedData } from '../types';

// IndexedDB Database Name and Version
const DB_NAME = 'zoe-solar-ocr-db';
const DB_VERSION = 1;

// Store Names
const STORAGE_DOCUMENTS = 'documents';
const STORAGE_SETTINGS = 'settings';

interface DB {
  documents: DocumentRecord[];
  settings: AppSettings | null;
}

// --- IndexedDB Helper Functions ---

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[StorageService] Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create documents store
      if (!db.objectStoreNames.contains(STORAGE_DOCUMENTS)) {
        const docStore = db.createObjectStore(STORAGE_DOCUMENTS, { keyPath: 'id' });
        docStore.createIndex('uploadDate', 'uploadDate', { unique: false });
        docStore.createIndex('status', 'status', { unique: false });
      }

      // Create settings store (single object with id 'app-settings')
      if (!db.objectStoreNames.contains(STORAGE_SETTINGS)) {
        db.createObjectStore(STORAGE_SETTINGS, { keyPath: 'id' });
      }
    };
  });
}

async function getFromStore<T>(storeName: string, key?: string): Promise<T | T[] | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      let request: IDBRequest;

      if (key) {
        request = store.get(key);
      } else {
        request = store.getAll();
      }

      request.onerror = () => {
        console.error(`[StorageService] Error reading from ${storeName}:`, request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  } catch (error) {
    console.error(`[StorageService] Failed to get from ${storeName}:`, error);
    throw error;
  }
}

async function saveToStore<T>(storeName: string, data: T): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onerror = () => {
        console.error(`[StorageService] Error saving to ${storeName}:`, request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  } catch (error) {
    console.error(`[StorageService] Failed to save to ${storeName}:`, error);
    throw error;
  }
}

async function deleteFromStore(storeName: string, key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onerror = () => {
        console.error(`[StorageService] Error deleting from ${storeName}:`, request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  } catch (error) {
    console.error(`[StorageService] Failed to delete from ${storeName}:`, error);
    throw error;
  }
}

// --- Document Operations ---

export const getAllDocuments = async (): Promise<DocumentRecord[]> => {
  console.log('[StorageService] Loading all documents from IndexedDB...');
  try {
    const docs = await getFromStore<DocumentRecord>(STORAGE_DOCUMENTS);
    const result = (docs as DocumentRecord[]) || [];
    console.log(`[StorageService] Loaded ${result.length} documents from IndexedDB`);
    return result;
  } catch (error) {
    console.error('[StorageService] Failed to load documents:', error);
    return [];
  }
};

export const saveDocument = async (doc: DocumentRecord): Promise<void> => {
  console.log(`[StorageService] Saving document: ${doc.id} - ${doc.fileName}`);
  try {
    await saveToStore(STORAGE_DOCUMENTS, doc);
    console.log(`[StorageService] Document saved successfully: ${doc.id}`);
  } catch (error) {
    console.error(`[StorageService] Failed to save document ${doc.id}:`, error);
    throw error;
  }
};

export const deleteDocument = async (id: string): Promise<void> => {
  console.log(`[StorageService] Deleting document: ${id}`);
  try {
    await deleteFromStore(STORAGE_DOCUMENTS, id);
    console.log(`[StorageService] Document deleted successfully: ${id}`);
  } catch (error) {
    console.error(`[StorageService] Failed to delete document ${id}:`, error);
    throw error;
  }
};

// --- Settings Operations ---

const SETTINGS_ID = 'app-settings';

export const getSettings = async (): Promise<AppSettings | null> => {
  console.log('[StorageService] Loading settings from IndexedDB...');
  try {
    const settings = await getFromStore<AppSettings>(STORAGE_SETTINGS, SETTINGS_ID);
    const result = settings as AppSettings | null;
    console.log('[StorageService] Settings loaded:', result ? 'found' : 'not found');
    return result;
  } catch (error) {
    console.error('[StorageService] Failed to load settings:', error);
    return null;
  }
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  console.log('[StorageService] Saving settings to IndexedDB...');
  try {
    const settingsWithId = { ...settings, id: SETTINGS_ID };
    await saveToStore(STORAGE_SETTINGS, settingsWithId);
    console.log('[StorageService] Settings saved successfully');
  } catch (error) {
    console.error('[StorageService] Failed to save settings:', error);
    throw error;
  }
};

// --- Utility Functions ---

export const clearAllDocuments = async (): Promise<void> => {
  console.log('[StorageService] Clearing all documents...');
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORAGE_DOCUMENTS, 'readwrite');
      const store = transaction.objectStore(STORAGE_DOCUMENTS);
      const request = store.clear();

      request.onerror = () => {
        console.error('[StorageService] Error clearing documents:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log('[StorageService] All documents cleared');
        resolve();
      };
    });
  } catch (error) {
    console.error('[StorageService] Failed to clear documents:', error);
    throw error;
  }
};

export const getDocumentCount = async (): Promise<number> => {
  try {
    const docs = await getAllDocuments();
    return docs.length;
  } catch {
    return 0;
  }
};
