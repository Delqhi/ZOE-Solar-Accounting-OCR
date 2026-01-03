/**
 * Local-First Storage Service using IndexedDB
 * Provides offline-first document and settings storage
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { DocumentRecord, AppSettings, VendorRule, ElsterStammdaten } from '../types';

// ============== DEFAULT SETTINGS ==============

const DEFAULT_TAX_DEFINITIONS = [
  { value: "19_pv", label: "19% Vorsteuer", ust_satz: 0.19, vorsteuer: true },
  { value: "7_pv", label: "7% Vorsteuer", ust_satz: 0.07, vorsteuer: true },
  { value: "0_pv", label: "0% PV (Steuerfrei)", ust_satz: 0.00, vorsteuer: true },
  { value: "0_igl_rc", label: "0% IGL / Reverse Charge", ust_satz: 0.00, vorsteuer: false, reverse_charge: true },
  { value: "steuerfrei_kn", label: "Steuerfrei (Kleinunternehmer)", ust_satz: 0.00, vorsteuer: false },
  { value: "keine_pv", label: "Keine Vorsteuer (Privatanteil)", ust_satz: 0.00, vorsteuer: false }
];

const DEFAULT_ACCOUNT_DEFINITIONS = [
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

const DEFAULT_DATEV_CONFIG = {
  beraterNr: '',
  mandantNr: '',
  wirtschaftsjahrBeginn: `${new Date().getFullYear()}0101`,
  sachkontenlaenge: 4,
  waehrung: 'EUR',
  herkunftKz: 'RE',
  diktatkuerzel: '',
  stapelBezeichnung: 'Buchungsstapel',
  taxCategoryToBuKey: {
    '19_pv': '9',
    '7_pv': '8',
    '0_pv': '0',
    '0_igl_rc': '0',
    'steuerfrei_kn': '0',
    'keine_pv': '0'
  }
};

const DEFAULT_ELSTER_STAMMDATEN: ElsterStammdaten = {
  unternehmensName: '',
  land: 'DE',
  plz: '',
  ort: '',
  strasse: '',
  hausnummer: '',
  eigeneSteuernummer: '',
  eigeneUstIdNr: '',
  finanzamtName: '',
  finanzamtNr: '',
  rechtsform: 'einzelunternehmen',
  besteuerungUst: 'ist',
  kleinunternehmer: false,
  iban: '',
  kontaktEmail: '',
};

function getDefaultSettings(): AppSettings {
  return {
    id: 'global',
    taxDefinitions: DEFAULT_TAX_DEFINITIONS,
    accountDefinitions: DEFAULT_ACCOUNT_DEFINITIONS,
    datevConfig: DEFAULT_DATEV_CONFIG,
    elsterStammdaten: DEFAULT_ELSTER_STAMMDATEN,
    accountGroups: [],
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
}

// ============== INDEXEDDB SCHEMA ==============

interface ZoeDBSchema extends DBSchema {
  documents: {
    key: string;
    value: DocumentRecord;
    indexes: { 'by-date': string };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
  vendorRules: {
    key: string;
    value: VendorRule;
  };
}

// ============== DATABASE CONNECTION ==============

let dbPromise: Promise<IDBPDatabase<ZoeDBSchema>> | null = null;

export function getDB(): Promise<IDBPDatabase<ZoeDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<ZoeDBSchema>('zoe-solar-db', 1, {
      upgrade(db) {
        const docStore = db.createObjectStore('documents', { keyPath: 'id' });
        docStore.createIndex('by-date', 'uploadDate');
        db.createObjectStore('settings', { keyPath: 'id' });
        db.createObjectStore('vendorRules', { keyPath: 'vendorName' });
      },
    });
  }
  return dbPromise;
}

// ============== DOCUMENT OPERATIONS ==============

export async function getAllDocuments(): Promise<DocumentRecord[]> {
  const db = await getDB();
  return db.getAll('documents');
}

export async function saveDocument(doc: DocumentRecord): Promise<void> {
  const db = await getDB();
  await db.put('documents', doc);
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('documents', id);
}

export async function getDocumentById(id: string): Promise<DocumentRecord | undefined> {
  const db = await getDB();
  return db.get('documents', id);
}

// ============== SETTINGS OPERATIONS ==============

export async function getSettings(): Promise<AppSettings> {
  const db = await getDB();
  const settings = await db.get('settings', 'global');
  if (settings) return settings;
  // Return default settings if none exist
  return getDefaultSettings();
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', { ...settings, id: 'global' });
}

// ============== VENDOR RULES ==============

export async function getVendorRule(vendorName: string): Promise<{ accountId?: string; taxCategoryValue?: string } | undefined> {
  const db = await getDB();
  const rule = await db.get('vendorRules', vendorName.toLowerCase());
  if (!rule) return undefined;

  // Increment use count
  await db.put('vendorRules', { ...rule, useCount: rule.useCount + 1 });

  return { accountId: rule.accountId, taxCategoryValue: rule.taxCategoryValue };
}

export async function saveVendorRule(vendorName: string, accountId: string, taxCategoryValue: string): Promise<void> {
  const db = await getDB();
  const existingRule = await db.get('vendorRules', vendorName.toLowerCase());

  await db.put('vendorRules', {
    vendorName: vendorName.toLowerCase(),
    accountId,
    taxCategoryValue,
    lastUpdated: new Date().toISOString(),
    useCount: existingRule?.useCount || 0,
    accountGroupName: existingRule?.accountGroupName || ''
  });
}

// ============== UTILITY ==============

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  await db.clear('documents');
  await db.clear('settings');
  await db.clear('vendorRules');
}

export async function getStorageStats(): Promise<{ documentCount: number; hasSettings: boolean; vendorRuleCount: number }> {
  const db = await getDB();
  const docs = await db.getAll('documents');
  const settings = await db.get('settings', 'global');
  const rules = await db.getAll('vendorRules');

  return {
    documentCount: docs.length,
    hasSettings: !!settings,
    vendorRuleCount: rules.length
  };
}
