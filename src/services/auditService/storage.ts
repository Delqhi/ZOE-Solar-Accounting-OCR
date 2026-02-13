import { AuditLogEntry } from './types';

export function storeInIndexedDB(log: AuditLogEntry): void {
  const request = indexedDB.open('AuditDB', 1);

  request.onupgradeneeded = (event) => {
    const db = (event.target as IDBOpenDBRequest).result;
    if (!db.objectStoreNames.contains('auditLogs')) {
      db.createObjectStore('auditLogs', { keyPath: 'id' });
    }
  };

  request.onsuccess = (event) => {
    const db = (event.target as IDBOpenDBRequest).result;
    const tx = db.transaction('auditLogs', 'readwrite');
    tx.objectStore('auditLogs').put(log);
  };
}

export function storeInLocalStorage(log: AuditLogEntry): void {
  const logs = JSON.parse(localStorage.getItem('audit-logs') || '[]');
  logs.push(log);
  localStorage.setItem('audit-logs', JSON.stringify(logs.slice(-1000)));
}

export async function loadFromIndexedDB(): Promise<AuditLogEntry[]> {
  return new Promise((resolve) => {
    const request = indexedDB.open('AuditDB', 1);

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('auditLogs')) {
        resolve([]);
        return;
      }

      const tx = db.transaction('auditLogs', 'readonly');
      const store = tx.objectStore('auditLogs');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
    };

    request.onerror = () => resolve([]);
  });
}

export function loadFromLocalStorage(): AuditLogEntry[] {
  try {
    const logs = JSON.parse(localStorage.getItem('audit-logs') || '[]');
    return logs.map((log: AuditLogEntry) => ({
      ...log,
      timestamp: new Date(log.timestamp),
    }));
  } catch {
    return [];
  }
}

export function saveToLocalStorage(logs: AuditLogEntry[]): void {
  localStorage.setItem('audit-logs', JSON.stringify(logs));
}
