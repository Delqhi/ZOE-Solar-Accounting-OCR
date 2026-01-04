import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Beleg, Einstellung, LieferantenRegel } from '../src/services/supabaseClient';

// IndexedDB schema
interface StorageDB extends DBSchema {
  belege: {
    key: string;
    value: Beleg;
    indexes: { 'by-date': string; 'by-status': string };
  };
  einstellungen: {
    key: string;
    value: Einstellung;
  };
  lieferantenRegeln: {
    key: string;
    value: LieferantenRegel;
  };
}

const DB_NAME = 'zoe-solar-storage';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<StorageDB>> | null = null;

function getDB(): Promise<IDBPDatabase<StorageDB>> {
  if (!dbPromise) {
    dbPromise = openDB<StorageDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const belegStore = db.createObjectStore('belege', { keyPath: 'id' });
        belegStore.createIndex('by-date', 'beleg_datum');
        belegStore.createIndex('by-status', 'status');
        db.createObjectStore('einstellungen', { keyPath: 'id' });
        db.createObjectStore('lieferantenRegeln', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

export async function getAllDocuments(): Promise<Beleg[]> {
  const db = await getDB();
  return db.getAll('belege');
}

export async function getDocument(id: string): Promise<Beleg | undefined> {
  const db = await getDB();
  return db.get('belege', id);
}

export async function saveDocument(doc: Beleg): Promise<void> {
  const db = await getDB();
  await db.put('belege', doc);
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('belege', id);
}

export async function getSettings(): Promise<Record<string, string>> {
  const db = await getDB();
  const settings = await db.getAll('einstellungen');
  const result: Record<string, string> = {};
  for (const s of settings) {
    result[s.schluessel] = s.wert;
  }
  return result;
}

export async function saveSettings(settings: Record<string, string>): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('einstellungen', 'readwrite');
  const store = tx.objectStore('einstellungen');
  for (const [key, value] of Object.entries(settings)) {
    await store.put({ id: key, schluessel: key, wert: value, typ: typeof value, created_at: new Date().toISOString(), updated_at: null });
  }
  await tx.done;
}

export async function getVendorRule(vendorName: string): Promise<LieferantenRegel | undefined> {
  const db = await getDB();
  const allRules = await db.getAll('lieferantenRegeln');
  return allRules.find(r => r.lieferant_name_pattern.toLowerCase() === vendorName.toLowerCase() && r.aktiv);
}

export async function saveVendorRule(
  vendorNamePattern: string,
  standardKonto: string | null,
  standardSteuerkategorie: string | null
): Promise<LieferantenRegel> {
  const db = await getDB();
  const id = `${vendorNamePattern}-${Date.now()}`;
  const rule: LieferantenRegel = {
    id,
    lieferant_name_pattern: vendorNamePattern,
    standard_konto: standardKonto,
    standard_steuerkategorie: standardSteuerkategorie,
    prioritaet: 1,
    aktiv: true,
    created_at: new Date().toISOString(),
  };
  await db.put('lieferantenRegeln', rule);
  return rule;
}

export async function getAllVendorRules(): Promise<LieferantenRegel[]> {
  const db = await getDB();
  return db.getAll('lieferantenRegeln');
}

export async function deleteVendorRule(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('lieferantenRegeln', id);
}
