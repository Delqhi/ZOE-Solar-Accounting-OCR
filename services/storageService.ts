import { DocumentRecord, DocumentStatus, ExtractedData, AppSettings, LineItem, AccountDefinition, TaxCategoryDefinition, AccountGroupDefinition, OCRConfig, ValidationRules, ScoreDefinition } from '../types';

// Database configuration
const DB_NAME = 'zoe-solar-ocr';
const DB_VERSION = 1;

interface BelegeRecord {
  id: string;
  fileName: string;
  fileType: string;
  uploadDate: string;
  status: string;
  data: ExtractedData | null;
  previewUrl?: string;
  fileHash?: string;
  duplicateOfId?: string;
  duplicateConfidence?: number;
  duplicateReason?: string;
  attachments?: any[];
}

interface AppSettingsRecord {
  id: string;
  taxDefinitions: TaxCategoryDefinition[];
  accountDefinitions: AccountDefinition[];
  accountGroups: AccountGroupDefinition[];
  ocrConfig: OCRConfig;
  datevConfig?: any;
  elsterStammdaten?: any;
  startupChecklist?: any;
  submissionConfig?: any;
}

interface VendorRuleRecord {
  vendor_name: string;
  account_id: string;
  tax_category_value: string;
  use_count: number;
  last_updated: string;
}

// --- Database Initialization ---

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // belege store
      if (!db.objectStoreNames.contains('belege')) {
        const belegeStore = db.createObjectStore('belege', { keyPath: 'id' });
        belegeStore.createIndex('by-date', 'uploadDate');
        belegeStore.createIndex('by-status', 'status');
      }

      // settings store
      if (!db.objectStoreNames.contains('app_settings')) {
        db.createObjectStore('app_settings', { keyPath: 'id' });
      }

      // vendor_rules store
      if (!db.objectStoreNames.contains('vendor_rules')) {
        const rulesStore = db.createObjectStore('vendor_rules', { keyPath: 'vendor_name' });
        rulesStore.createIndex('by-name', 'vendor_name');
      }
    };
  });
};

// --- Helper Functions ---

const getStore = async (storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> => {
  const db = await initDB();
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
};

// --- Document Operations ---

export const getAllDocuments = async (): Promise<DocumentRecord[]> => {
  const store = await getStore('belege');
  return new Promise((resolve, reject) => {
    const request = store.index('by-date').getAll();
    request.onsuccess = () => {
      const docs = (request.result as BelegeRecord[]).reverse(); // Newest first
      resolve(docs.map(doc => ({
        ...doc,
        status: doc.status as DocumentStatus
      })) as DocumentRecord[]);
    };
    request.onerror = () => reject(request.error);
  });
};

export const getDocument = async (id: string): Promise<DocumentRecord | undefined> => {
  const store = await getStore('belege');
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => {
      if (request.result) {
        const doc = request.result as BelegeRecord;
        resolve({
          ...doc,
          status: doc.status as DocumentStatus
        } as DocumentRecord);
      } else {
        resolve(undefined);
      }
    };
    request.onerror = () => reject(request.error);
  });
};

export const saveDocument = async (doc: DocumentRecord): Promise<void> => {
  const store = await getStore('belege', 'readwrite');
  return new Promise((resolve, reject) => {
    const record: BelegeRecord = {
      id: doc.id,
      fileName: doc.fileName,
      fileType: doc.fileType,
      uploadDate: doc.uploadDate,
      status: doc.status,
      data: doc.data,
      previewUrl: doc.previewUrl,
      fileHash: doc.fileHash,
      duplicateOfId: doc.duplicateOfId,
      duplicateConfidence: doc.duplicateConfidence,
      duplicateReason: doc.duplicateReason,
      attachments: doc.attachments
    };
    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const deleteDocument = async (id: string): Promise<void> => {
  const store = await getStore('belege', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// --- Settings Operations ---

export const getSettings = async (): Promise<AppSettings> => {
  const store = await getStore('app_settings');
  return new Promise((resolve, reject) => {
    const request = store.get('global');
    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result as AppSettings);
      } else {
        resolve(getDefaultSettings());
      }
    };
    request.onerror = () => reject(request.error);
  });
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  const store = await getStore('app_settings', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.put(settings);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// --- Vendor Rules Operations ---

export const getVendorRule = async (vendorName: string): Promise<{ accountId?: string; taxCategoryValue?: string } | undefined> => {
  if (!vendorName || vendorName.length < 2) return undefined;

  const store = await getStore('vendor_rules');
  const normalizedName = vendorName.toLowerCase().trim();

  return new Promise((resolve, reject) => {
    const request = store.get(normalizedName);
    request.onsuccess = () => {
      if (request.result) {
        const rule = request.result as VendorRuleRecord;
        resolve({
          accountId: rule.account_id,
          taxCategoryValue: rule.tax_category_value
        });
      } else {
        resolve(undefined);
      }
    };
    request.onerror = () => reject(request.error);
  });
};

export const saveVendorRule = async (vendorName: string, accountId: string, taxCategoryValue: string): Promise<void> => {
  if (!vendorName || vendorName.length < 2) return;

  const store = await getStore('vendor_rules', 'readwrite');
  const normalizedName = vendorName.toLowerCase().trim();

  return new Promise((resolve, reject) => {
    // First get existing record to increment use_count
    const getRequest = store.get(normalizedName);
    getRequest.onsuccess = () => {
      const existing = getRequest.result as VendorRuleRecord | undefined;
      const useCount = (existing?.use_count || 0) + 1;

      const record: VendorRuleRecord = {
        vendor_name: normalizedName,
        account_id: accountId,
        tax_category_value: taxCategoryValue,
        use_count: useCount,
        last_updated: new Date().toISOString()
      };

      const putRequest = store.put(record);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

// --- Utility Functions ---

export const clearAllDocuments = async (): Promise<void> => {
  const store = await getStore('belege', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getDocumentCount = async (): Promise<number> => {
  const store = await getStore('belege');
  return new Promise((resolve, reject) => {
    const request = store.count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// --- Default Settings ---

function getDefaultSettings(): AppSettings {
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

  const DEFAULT_OCR_CONFIG: OCRConfig = {
    scores: {
      "0": { min_fields: 0, desc: "Kein gültiger Beleg" },
      "5": { min_fields: 4, desc: "Basisdaten vorhanden" },
      "10": { min_fields: 7, desc: "Perfekt erkannt" }
    },
    required_fields: ["belegDatum", "bruttoBetrag", "lieferantName"],
    field_weights: { bruttoBetrag: 3, belegDatum: 3, lieferantName: 2, belegNummerLieferant: 2 },
    regex_patterns: { belegDatum: "\\d{4}-\\d{2}-\\d{2}" },
    validation_rules: { sum_check: true, date_check: true, min_confidence: 0.8 }
  };

  return {
    id: 'global',
    taxDefinitions: DEFAULT_TAX_DEFINITIONS,
    accountDefinitions: DEFAULT_ACCOUNT_DEFINITIONS,
    accountGroups: [],
    ocrConfig: DEFAULT_OCR_CONFIG
  };
}
