/**
 * Local Storage Service
 * Handles IndexedDB operations for local-first storage
 */

import { DocumentRecord, AppSettings, DocumentStatus } from '../types';
import { validateDocumentData, sanitizeFilename } from '../utils/validation';
import { uuidv4, formatDate, toDateString } from '../utils';

const DB_NAME = 'zoe-solar-ocr';
const DB_VERSION = 1;
const STORE_DOCUMENTS = 'documents';
const STORE_SETTINGS = 'settings';

let db: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Initialize IndexedDB connection
 */
export function initDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    // Check if IndexedDB is available
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('❌ IndexedDB error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log('✅ IndexedDB initialized');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const upgradeDb = (event.target as IDBOpenDBRequest).result;

      // Create documents store
      if (!upgradeDb.objectStoreNames.contains(STORE_DOCUMENTS)) {
        const store = upgradeDb.createObjectStore(STORE_DOCUMENTS, { keyPath: 'id' });
        store.createIndex('uploadDate', 'uploadDate', { unique: false });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('fileName', 'fileName', { unique: false });
        store.createIndex('isPrivate', 'isPrivate', { unique: false });
      }

      // Create settings store
      if (!upgradeDb.objectStoreNames.contains(STORE_SETTINGS)) {
        upgradeDb.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }

      console.log('✅ IndexedDB stores created/updated');
    };
  });

  return dbPromise;
}

/**
 * Get database instance (lazy initialization)
 */
export async function getDB(): Promise<IDBDatabase> {
  if (db) return db;
  return initDB();
}

/**
 * Save document to IndexedDB
 */
export async function saveDocument(document: DocumentRecord): Promise<void> {
  try {
    // Validate document data
    const validation = validateDocumentData(document);
    if (!validation.valid) {
      throw new Error(`Document validation failed: ${validation.errors.join(', ')}`);
    }

    const db = await getDB();
    const transaction = db.transaction([STORE_DOCUMENTS], 'readwrite');
    const store = transaction.objectStore(STORE_DOCUMENTS);

    // Add metadata if missing
    if (!document.uploadDate) {
      document.uploadDate = new Date().toISOString();
    }

    if (!document.status) {
      document.status = 'pending';
    }

    const request = store.put(document);

    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log(`✅ Document saved: ${document.fileName}`);
  } catch (error) {
    console.error('❌ saveDocument error:', error);
    throw error;
  }
}

/**
 * Get document by ID
 */
export async function getDocument(id: string): Promise<DocumentRecord | null> {
  try {
    const db = await getDB();
    const transaction = db.transaction([STORE_DOCUMENTS], 'readonly');
    const store = transaction.objectStore(STORE_DOCUMENTS);

    const request = store.get(id);

    return await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ getDocument error:', error);
    return null;
  }
}

/**
 * Get all documents
 */
export async function getAllDocuments(): Promise<DocumentRecord[]> {
  try {
    const db = await getDB();
    const transaction = db.transaction([STORE_DOCUMENTS], 'readonly');
    const store = transaction.objectStore(STORE_DOCUMENTS);

    const request = store.getAll();

    return await new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const docs = request.result || [];
        // Sort by upload date descending
        docs.sort((a, b) => {
          const dateA = new Date(a.uploadDate || 0).getTime();
          const dateB = new Date(b.uploadDate || 0).getTime();
          return dateB - dateA;
        });
        resolve(docs);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ getAllDocuments error:', error);
    return [];
  }
}

/**
 * Get documents with pagination
 */
export async function getDocumentsPaginated(
  page: number = 1,
  limit: number = 20,
  filters?: {
    status?: DocumentStatus;
    isPrivate?: boolean;
    search?: string;
  }
): Promise<{ documents: DocumentRecord[]; total: number; hasMore: boolean }> {
  try {
    const allDocs = await getAllDocuments();
    let filtered = allDocs;

    // Apply filters
    if (filters?.status) {
      filtered = filtered.filter(d => d.status === filters.status);
    }

    if (filters?.isPrivate !== undefined) {
      filtered = filtered.filter(d => d.isPrivate === filters.isPrivate);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(d =>
        d.fileName.toLowerCase().includes(search) ||
        (d.data?.lieferantName?.toLowerCase().includes(search)) ||
        (d.data?.beschreibung?.toLowerCase().includes(search))
      );
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const documents = filtered.slice(start, end);
    const hasMore = end < total;

    return { documents, total, hasMore };
  } catch (error) {
    console.error('❌ getDocumentsPaginated error:', error);
    return { documents: [], total: 0, hasMore: false };
  }
}

/**
 * Delete document by ID
 */
export async function deleteDocument(id: string): Promise<void> {
  try {
    const db = await getDB();
    const transaction = db.transaction([STORE_DOCUMENTS], 'readwrite');
    const store = transaction.objectStore(STORE_DOCUMENTS);

    const request = store.delete(id);

    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log(`✅ Document deleted: ${id}`);
  } catch (error) {
    console.error('❌ deleteDocument error:', error);
    throw error;
  }
}

/**
 * Delete multiple documents
 */
export async function deleteDocuments(ids: string[]): Promise<void> {
  for (const id of ids) {
    await deleteDocument(id);
  }
}

/**
 * Update document status
 */
export async function updateDocumentStatus(
  id: string,
  status: DocumentStatus,
  error?: string
): Promise<void> {
  try {
    const doc = await getDocument(id);
    if (!doc) {
      throw new Error(`Document not found: ${id}`);
    }

    doc.status = status;
    if (error) {
      doc.error = error;
    }
    doc.processedDate = new Date().toISOString();

    await saveDocument(doc);
  } catch (error) {
    console.error('❌ updateDocumentStatus error:', error);
    throw error;
  }
}

/**
 * Update document data (OCR result)
 */
export async function updateDocumentData(
  id: string,
  data: any,
  status: DocumentStatus = 'processed'
): Promise<void> {
  try {
    const doc = await getDocument(id);
    if (!doc) {
      throw new Error(`Document not found: ${id}`);
    }

    doc.data = data;
    doc.status = status;
    doc.processedDate = new Date().toISOString();

    await saveDocument(doc);
    console.log(`✅ Document data updated: ${id}`);
  } catch (error) {
    console.error('❌ updateDocumentData error:', error);
    throw error;
  }
}

/**
 * Bulk update documents
 */
export async function bulkUpdateDocuments(
  updates: Array<{ id: string; data: any; status: DocumentStatus }>
): Promise<void> {
  for (const update of updates) {
    await updateDocumentData(update.id, update.data, update.status);
  }
}

/**
 * Save settings
 */
export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    const db = await getDB();
    const transaction = db.transaction([STORE_SETTINGS], 'readwrite');
    const store = transaction.objectStore(STORE_SETTINGS);

    const settingsRecord = {
      key: 'app-settings',
      ...settings,
      updatedAt: new Date().toISOString(),
    };

    const request = store.put(settingsRecord);

    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log('✅ Settings saved');
  } catch (error) {
    console.error('❌ saveSettings error:', error);
    throw error;
  }
}

/**
 * Get settings
 */
export async function getSettings(): Promise<AppSettings | null> {
  try {
    const db = await getDB();
    const transaction = db.transaction([STORE_SETTINGS], 'readonly');
    const store = transaction.objectStore(STORE_SETTINGS);

    const request = store.get('app-settings');

    return await new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result) {
          const { key, updatedAt, ...settings } = request.result;
          resolve(settings as AppSettings);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ getSettings error:', error);
    return null;
  }
}

/**
 * Get default settings
 */
export function getDefaultSettings(): AppSettings {
  return {
    theme: 'system',
    language: 'de',
    autoProcess: true,
    fallBackEnabled: true,
    backupEnabled: false,
    exportFormat: 'datev',
    notificationEnabled: true,
    maxUploadSize: 50 * 1024 * 1024, // 50MB
    maxConcurrentUploads: 5,
  };
}

/**
 * Get or create settings
 */
export async function getOrCreateSettings(): Promise<AppSettings> {
  const existing = await getSettings();
  if (existing) {
    return existing;
  }

  const defaults = getDefaultSettings();
  await saveSettings(defaults);
  return defaults;
}

/**
 * Count documents
 */
export async function countDocuments(): Promise<number> {
  try {
    const allDocs = await getAllDocuments();
    return allDocs.length;
  } catch (error) {
    console.error('❌ countDocuments error:', error);
    return 0;
  }
}

/**
 * Get document statistics
 */
export async function getDocumentStats(): Promise<{
  total: number;
  pending: number;
  processed: number;
  failed: number;
  private: number;
}> {
  try {
    const allDocs = await getAllDocuments();

    return {
      total: allDocs.length,
      pending: allDocs.filter(d => d.status === 'pending').length,
      processed: allDocs.filter(d => d.status === 'processed').length,
      failed: allDocs.filter(d => d.status === 'failed').length,
      private: allDocs.filter(d => d.isPrivate).length,
    };
  } catch (error) {
    console.error('❌ getDocumentStats error:', error);
    return { total: 0, pending: 0, processed: 0, failed: 0, private: 0 };
  }
}

/**
 * Clear all documents (with confirmation check)
 */
export async function clearAllDocuments(): Promise<void> {
  try {
    const db = await getDB();
    const transaction = db.transaction([STORE_DOCUMENTS], 'readwrite');
    const store = transaction.objectStore(STORE_DOCUMENTS);

    const request = store.clear();

    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log('✅ All documents cleared');
  } catch (error) {
    console.error('❌ clearAllDocuments error:', error);
    throw error;
  }
}

/**
 * Export all documents as JSON
 */
export async function exportAllDocuments(): Promise<string> {
  try {
    const allDocs = await getAllDocuments();
    return JSON.stringify(allDocs, null, 2);
  } catch (error) {
    console.error('❌ exportAllDocuments error:', error);
    throw error;
  }
}

/**
 * Import documents from JSON
 */
export async function importDocuments(jsonString: string): Promise<number> {
  try {
    const documents = JSON.parse(jsonString) as DocumentRecord[];
    let imported = 0;

    for (const doc of documents) {
      // Validate before importing
      const validation = validateDocumentData(doc);
      if (validation.valid) {
        await saveDocument(doc);
        imported++;
      }
    }

    console.log(`✅ Imported ${imported} documents`);
    return imported;
  } catch (error) {
    console.error('❌ importDocuments error:', error);
    throw error;
  }
}

/**
 * Get documents by date range
 */
export async function getDocumentsByDateRange(
  startDate: Date,
  endDate: Date
): Promise<DocumentRecord[]> {
  try {
    const allDocs = await getAllDocuments();
    const startTimestamp = startDate.getTime();
    const endTimestamp = endDate.getTime();

    return allDocs.filter(doc => {
      if (!doc.uploadDate) return false;
      const docTimestamp = new Date(doc.uploadDate).getTime();
      return docTimestamp >= startTimestamp && docTimestamp <= endTimestamp;
    });
  } catch (error) {
    console.error('❌ getDocumentsByDateRange error:', error);
    return [];
  }
}

/**
 * Get documents by status
 */
export async function getDocumentsByStatus(
  status: DocumentStatus
): Promise<DocumentRecord[]> {
  try {
    const allDocs = await getAllDocuments();
    return allDocs.filter(doc => doc.status === status);
  } catch (error) {
    console.error('❌ getDocumentsByStatus error:', error);
    return [];
  }
}

/**
 * Get private documents
 */
export async function getPrivateDocuments(): Promise<DocumentRecord[]> {
  try {
    const allDocs = await getAllDocuments();
    return allDocs.filter(doc => doc.isPrivate);
  } catch (error) {
    console.error('❌ getPrivateDocuments error:', error);
    return [];
  }
}

/**
 * Get duplicate documents (by filename)
 */
export async function getDuplicateDocuments(): Promise<DocumentRecord[]> {
  try {
    const allDocs = await getAllDocuments();
    const filenameCount = new Map<string, number>();

    // Count occurrences of each filename
    for (const doc of allDocs) {
      const count = filenameCount.get(doc.fileName) || 0;
      filenameCount.set(doc.fileName, count + 1);
    }

    // Filter documents with duplicates
    const duplicates = allDocs.filter(doc => (filenameCount.get(doc.fileName) || 0) > 1);

    return duplicates;
  } catch (error) {
    console.error('❌ getDuplicateDocuments error:', error);
    return [];
  }
}

/**
 * Find documents by similar filename (for duplicate detection)
 */
export async function findSimilarDocuments(
  filename: string,
  threshold: number = 0.8
): Promise<DocumentRecord[]> {
  try {
    const allDocs = await getAllDocuments();
    const filtered = allDocs.filter(doc => {
      const similarity = calculateSimilarity(filename, doc.fileName);
      return similarity >= threshold && doc.fileName !== filename;
    });
    return filtered;
  } catch (error) {
    console.error('❌ findSimilarDocuments error:', error);
    return [];
  }
}

/**
 * Calculate string similarity (Levenshtein-based)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Levenshtein distance calculation
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Export as CSV format
 */
export async function exportToCSV(): Promise<string> {
  try {
    const allDocs = await getAllDocuments();

    const headers = [
      'ID',
      'Dateiname',
      'Upload-Datum',
      'Status',
      'Lieferant',
      'Betrag',
      'Rechnungsnummer',
      'Datum',
      'Privat',
      'Fehler',
    ];

    const rows = allDocs.map(doc => [
      doc.id,
      doc.fileName,
      doc.uploadDate || '',
      doc.status,
      doc.data?.lieferantName || '',
      doc.data?.betrag || '',
      doc.data?.rechnungsnummer || '',
      doc.data?.datum || '',
      doc.isPrivate ? 'Ja' : 'Nein',
      doc.error || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return csv;
  } catch (error) {
    console.error('❌ exportToCSV error:', error);
    throw error;
  }
}

/**
 * Get documents with missing data
 */
export async function getIncompleteDocuments(): Promise<DocumentRecord[]> {
  const allDocs = await getAllDocuments();
  return allDocs.filter(doc => {
    const hasRequiredData = doc.data && (
      doc.data.lieferantName ||
      doc.data.betrag ||
      doc.data.rechnungsnummer ||
      doc.data.datum
    );
    return !hasRequiredData || doc.status === 'pending';
  });
}

/**
 * Merge duplicate documents
 */
export async function mergeDuplicates(sourceId: string, targetId: string): Promise<void> {
  try {
    const sourceDoc = await getDocument(sourceId);
    const targetDoc = await getDocument(targetId);

    if (!sourceDoc || !targetDoc) {
      throw new Error('One or both documents not found');
    }

    // Merge data
    const mergedData = {
      ...targetDoc.data,
      ...(sourceDoc.data || {}),
    };

    // Update target
    targetDoc.data = mergedData;
    targetDoc.mergedFrom = [...(targetDoc.mergedFrom || []), sourceId];

    await saveDocument(targetDoc);
    await deleteDocument(sourceId);

    console.log(`✅ Merged ${sourceId} into ${targetId}`);
  } catch (error) {
    console.error('❌ mergeDuplicates error:', error);
    throw error;
  }
}

/**
 * Get database status info
 */
export async function getDBStatus(): Promise<{
  isOpen: boolean;
  documentCount: number;
  lastError?: string;
}> {
  try {
    const docs = await countDocuments();
    return {
      isOpen: db !== null,
      documentCount: docs,
    };
  } catch (error) {
    return {
      isOpen: false,
      documentCount: 0,
      lastError: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Close database connection
 */
export function closeDB(): void {
  if (db) {
    db.close();
    db = null;
    dbPromise = null;
    console.log('✅ Database closed');
  }
}

/**
 * Delete entire database (nuclear option)
 */
export async function deleteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    closeDB();

    const request = window.indexedDB.deleteDatabase(DB_NAME);

    request.onsuccess = () => {
      console.log('✅ Database deleted');
      resolve();
    };

    request.onerror = () => {
      console.error('❌ Error deleting database:', request.error);
      reject(request.error);
    };

    request.onblocked = () => {
      console.warn('⚠️ Database deletion blocked - close other tabs');
    };
  });
}

/**
 * Initialize database with sample data (for development)
 */
export async function initSampleData(): Promise<void> {
  // Check if already has data
  const existing = await countDocuments();
  if (existing > 0) return;

  // Create sample documents (without sensitive data)
  const sampleDocs: DocumentRecord[] = [];

  for (let i = 1; i <= 5; i++) {
    sampleDocs.push({
      id: uuidv4(),
      fileName: `Rechnung_${i}.pdf`,
      uploadDate: toDateString(new Date(Date.now() - i * 86400000)),
      status: i % 2 === 0 ? 'processed' : 'pending',
      isPrivate: i === 1,
      data: i % 2 === 0 ? {
        lieferantName: `Beispiel GmbH ${i}`,
        rechnungsnummer: `INV-${2024000 + i}`,
        datum: toDateString(new Date(Date.now() - i * 86400000)),
        betrag: (Math.random() * 1000 + 100).toFixed(2),
      } : undefined,
    });
  }

  for (const doc of sampleDocs) {
    await saveDocument(doc);
  }

  console.log('✅ Sample data initialized');
}

// Export all functions
export const storageService = {
  initDB,
  getDB,
  saveDocument,
  getDocument,
  getAllDocuments,
  getDocumentsPaginated,
  deleteDocument,
  deleteDocuments,
  updateDocumentStatus,
  updateDocumentData,
  bulkUpdateDocuments,
  saveSettings,
  getSettings,
  getDefaultSettings,
  getOrCreateSettings,
  countDocuments,
  getDocumentStats,
  clearAllDocuments,
  exportAllDocuments,
  importDocuments,
  getDocumentsByDateRange,
  getDocumentsByStatus,
  getPrivateDocuments,
  getDuplicateDocuments,
  findSimilarDocuments,
  exportToCSV,
  getIncompleteDocuments,
  mergeDuplicates,
  getDBStatus,
  closeDB,
  deleteDatabase,
  initSampleData,
};
