
import { DocumentRecord, AppSettings, AccountGroupDefinition, VendorRule, TaxCategoryDefinition, AccountDefinition, DatevConfig, ElsterStammdaten, StartupChecklist } from '../types';

const DB_NAME = 'ZoeAccountingDB';
const STORE_DOCUMENTS = 'documents';
const STORE_SETTINGS = 'settings';
const STORE_VENDOR_RULES = 'vendor_rules';
const DB_VERSION = 5; // Bumped for new schema

// --- New Default Configurations ---

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

const DEFAULT_ACCOUNT_GROUPS: AccountGroupDefinition[] = [
  // Keeping these for legacy support / fallback reference
  { id: 'pv', name: 'Photovoltaik', skr03: '8400', taxType: '0%', keywords: ['zoe solar', 'pv-montage', 'nullsteuersatz'], isRevenue: true },
  { id: 'mat', name: 'Wareneingang/Material', skr03: '3400', taxType: '19%', keywords: ['baustoff', 'kabel'], isRevenue: false },
];

const DEFAULT_DATEV_CONFIG: DatevConfig = {
  beraterNr: '',
  mandantNr: '',
  wirtschaftsjahrBeginn: `${new Date().getFullYear()}0101`,
  sachkontenlaenge: 4,
  waehrung: 'EUR',
  herkunftKz: 'RE',
  diktatkuerzel: '',
  stapelBezeichnung: 'Buchungsstapel',
  taxCategoryToBuKey: {
    // Defaults sind bewusst konservativ. Für Sonderfälle (z.B. Reverse Charge) bitte in den Settings prüfen.
    '19_pv': '9',
    '7_pv': '8',
    '0_pv': '0',
    'steuerfrei_kn': '0',
    'keine_pv': '0',
    '0_igl_rc': ''
  },
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
  rechtsform: undefined,
  besteuerungUst: 'unbekannt',
  kleinunternehmer: false,
  iban: '',
  kontaktEmail: '',
};

const DEFAULT_STARTUP_CHECKLIST: StartupChecklist = {
  uploadErsterBeleg: false,
  datevKonfiguriert: false,
  elsterStammdatenKonfiguriert: false,
};

const DEFAULT_SETTINGS: AppSettings = {
  id: 'global',
  taxDefinitions: DEFAULT_TAX_DEFINITIONS,
  accountDefinitions: DEFAULT_ACCOUNT_DEFINITIONS,
  datevConfig: DEFAULT_DATEV_CONFIG,
  elsterStammdaten: DEFAULT_ELSTER_STAMMDATEN,
  startupChecklist: DEFAULT_STARTUP_CHECKLIST,
  accountGroups: DEFAULT_ACCOUNT_GROUPS,
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

// --- IndexedDB Setup ---
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_DOCUMENTS)) {
        db.createObjectStore(STORE_DOCUMENTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_VENDOR_RULES)) {
        db.createObjectStore(STORE_VENDOR_RULES, { keyPath: 'vendorName' });
      }
    };
  });
};

export const getSettings = async (): Promise<AppSettings> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SETTINGS, 'readonly');
    const store = tx.objectStore(STORE_SETTINGS);
    const request = store.get('global');
    request.onsuccess = () => {
      const result = request.result as AppSettings;
      if (result) {
        let needsSave = false;

        // Ensure new fields exist if migrating
        if (!result.taxDefinitions) result.taxDefinitions = DEFAULT_TAX_DEFINITIONS;

        if (!result.datevConfig) {
          result.datevConfig = DEFAULT_DATEV_CONFIG;
          needsSave = true;
        } else {
          // Minimal migration/merge for DATEV config
          result.datevConfig = {
            ...DEFAULT_DATEV_CONFIG,
            ...result.datevConfig,
            taxCategoryToBuKey: {
              ...DEFAULT_DATEV_CONFIG.taxCategoryToBuKey,
              ...(result.datevConfig.taxCategoryToBuKey || {}),
            },
          };
        }

        // ELSTER Stammdaten (Mandant)
        if (!result.elsterStammdaten) {
          result.elsterStammdaten = DEFAULT_ELSTER_STAMMDATEN;
          needsSave = true;
        } else {
          // Minimal merge: keep user values, ensure defaults exist
          result.elsterStammdaten = {
            ...DEFAULT_ELSTER_STAMMDATEN,
            ...result.elsterStammdaten,
          };
        }

        // Startup checklist
        if (!result.startupChecklist) {
          result.startupChecklist = DEFAULT_STARTUP_CHECKLIST;
          needsSave = true;
        } else {
          result.startupChecklist = {
            ...DEFAULT_STARTUP_CHECKLIST,
            ...result.startupChecklist,
          };
        }
        
        // AUTO-MERGE: Ensure critical default accounts exist even if user has saved settings
        if (!result.accountDefinitions) {
            result.accountDefinitions = DEFAULT_ACCOUNT_DEFINITIONS;
        } else {
            // Check specifically for Wareneingang and Fremdleistung, add if missing
            const missingDefaults = DEFAULT_ACCOUNT_DEFINITIONS.filter(def => 
                !result.accountDefinitions.some(existing => existing.id === def.id)
            );
            if (missingDefaults.length > 0) {
                // Merge carefully: Preserve existing, but ensure defaults have SKR03 if they were missing it (migrating old data)
                const updatedDefs = result.accountDefinitions.map(acc => {
                    const def = DEFAULT_ACCOUNT_DEFINITIONS.find(d => d.id === acc.id);
                    if (def && !acc.skr03) return { ...acc, skr03: def.skr03 };
                    return acc;
                });
                
                result.accountDefinitions = [...missingDefaults, ...updatedDefs];
                needsSave = true;
            }
        }

        if (needsSave) {
          saveSettings(result);
        }
        resolve(result);
      } else {
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
    const toSave = { ...settings, id: 'global' };
    const request = store.put(toSave);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const saveDocument = async (doc: DocumentRecord): Promise<void> => {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
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
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_DOCUMENTS, 'readwrite');
    const store = tx.objectStore(STORE_DOCUMENTS);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// --- Memory System: Vendor Rules ---

export const getVendorRule = async (vendorName: string): Promise<VendorRule | undefined> => {
    if (!vendorName || vendorName.length < 2) return undefined;
    
    const db = await openDB();
    const normalized = vendorName.trim().toLowerCase();
    
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_VENDOR_RULES, 'readonly');
        const store = tx.objectStore(STORE_VENDOR_RULES);
        const request = store.get(normalized);
        request.onsuccess = () => resolve(request.result as VendorRule);
        request.onerror = () => reject(request.error);
    });
};

export const saveVendorRule = async (vendorName: string, accountId: string, taxCategoryValue: string): Promise<void> => {
    if (!vendorName || vendorName.length < 2) return;
    
    const db = await openDB();
    const normalized = vendorName.trim().toLowerCase();
    
    // Get existing to increment count
    const existing = await getVendorRule(vendorName);
    
    const rule: VendorRule = {
        vendorName: normalized,
        accountGroupName: 'legacy', // unused
        accountId: accountId,
        taxCategoryValue: taxCategoryValue,
        useCount: (existing?.useCount || 0) + 1,
        lastUpdated: new Date().toISOString()
    };
    
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_VENDOR_RULES, 'readwrite');
        const store = tx.objectStore(STORE_VENDOR_RULES);
        const request = store.put(rule);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// --- SQL Export (Updated for PostgreSQL Extension) ---
const generateSQLForDocuments = (docs: DocumentRecord[], settings?: AppSettings): string => {
  const timestamp = new Date().toISOString();

  const safeText = (v: unknown) => {
    if (v === null || v === undefined) return 'NULL';
    const s = String(v);
    if (s.trim().length === 0) return 'NULL';
    return `'${s.replace(/'/g, "''")}'`;
  };
  const safeNum = (v: unknown) => {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : 'NULL';
  };
  const safeBool = (v: unknown) => {
    if (v === true || v === 'true' || v === 1) return 'TRUE';
    if (v === false || v === 'false' || v === 0) return 'FALSE';
    return 'NULL';
  };
  const safeDate = (dateStr: unknown) => {
    const s = dateStr === null || dateStr === undefined ? '' : String(dateStr);
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? `'${s}'` : 'NULL';
  };

  let sql = `-- ZOE Solar Accounting Export\n-- Generated: ${timestamp}\n\n`;

  // 1. New Tables Definition
  sql += `
CREATE TABLE IF NOT EXISTS steuerkategorien (
  id SERIAL PRIMARY KEY,
  value VARCHAR(50) UNIQUE NOT NULL,
  label VARCHAR(100),
  ust_satz NUMERIC(5,4),
  vorsteuer BOOLEAN DEFAULT TRUE,
  reverse_charge BOOLEAN DEFAULT FALSE
);\n`;

  sql += `
CREATE TABLE IF NOT EXISTS kontierungskonten (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100),
  skr03 VARCHAR(10),
  allowed_tax_categories TEXT[]
);\n`;

  // 1b. ELSTER Stammdaten (1 Row)
  sql += `
CREATE TABLE IF NOT EXISTS elster_stammdaten (
  id VARCHAR(20) PRIMARY KEY,
  unternehmens_name TEXT,
  land VARCHAR(10),
  plz VARCHAR(20),
  ort TEXT,
  strasse TEXT,
  hausnummer TEXT,
  eigene_steuernummer TEXT,
  eigene_steuernummer_digits TEXT,
  eigene_ust_idnr TEXT,
  finanzamt_name TEXT,
  finanzamt_nr TEXT,
  rechtsform TEXT,
  besteuerung_ust TEXT,
  kleinunternehmer BOOLEAN,
  iban TEXT,
  kontakt_email TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);\n`;

  // 2. Belege Table Extension
  sql += `
CREATE TABLE IF NOT EXISTS belege (
    id UUID PRIMARY KEY,
    document_type VARCHAR(100),
    datum DATE,
    belegnummer_lieferant VARCHAR(255),
    eigene_beleg_nummer VARCHAR(255),
    lieferant VARCHAR(255),
    lieferant_adresse TEXT,
    steuernummer VARCHAR(100),

    -- Zahlung / Organisation
    zahlungsmethode VARCHAR(100),
    zahlungs_datum DATE,
    zahlungs_status VARCHAR(50),
    rechnungs_empfaenger VARCHAR(255),
    aufbewahrungs_ort VARCHAR(255),

    betrag DECIMAL(10,2),
    netto_betrag DECIMAL(10,2),
    mwst_satz_0 NUMERIC(5,4),
    mwst_betrag_0 DECIMAL(10,2),
    mwst_satz_7 NUMERIC(5,4),
    mwst_betrag_7 DECIMAL(10,2),
    mwst_satz_19 NUMERIC(5,4),
    mwst_betrag_19 DECIMAL(10,2),
    
    -- New Fields
    steuerkategorie VARCHAR(50),
    kontierungskonto VARCHAR(50),
    soll_konto VARCHAR(10),
    haben_konto VARCHAR(10),
    konto_ust_satz NUMERIC(5,4),

    -- Legacy / Derived (keep for completeness)
    kontogruppe VARCHAR(100),
    konto_skr03 VARCHAR(10),
    ust_typ VARCHAR(50),
    steuer_kategorie_legacy VARCHAR(100),

    -- Flags
    reverse_charge BOOLEAN,
    vorsteuerabzug BOOLEAN,
    kleinbetrag BOOLEAN,
    privatanteil BOOLEAN,
    
    ocr_score INTEGER,
    ocr_rationale TEXT,
    ocr_text TEXT,
    text_content TEXT,
    beschreibung TEXT,
    status VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT NOW()
);\n\n`;

  // Positionen (1:n)
  sql += `
CREATE TABLE IF NOT EXISTS beleg_positionen (
    doc_id UUID NOT NULL REFERENCES belege(id) ON DELETE CASCADE,
    line_index INTEGER NOT NULL,
    description TEXT,
    amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (doc_id, line_index)
);\n\n`;

  // Ensure columns exist even if table already exists (idempotent)
  sql += `
ALTER TABLE belege ADD COLUMN IF NOT EXISTS document_type VARCHAR(100);
ALTER TABLE belege ADD COLUMN IF NOT EXISTS belegnummer_lieferant VARCHAR(255);
ALTER TABLE belege ADD COLUMN IF NOT EXISTS eigene_beleg_nummer VARCHAR(255);
ALTER TABLE belege ADD COLUMN IF NOT EXISTS lieferant_adresse TEXT;
ALTER TABLE belege ADD COLUMN IF NOT EXISTS steuernummer VARCHAR(100);
ALTER TABLE belege ADD COLUMN IF NOT EXISTS netto_betrag DECIMAL(10,2);
ALTER TABLE belege ADD COLUMN IF NOT EXISTS mwst_satz_0 NUMERIC(5,4);
ALTER TABLE belege ADD COLUMN IF NOT EXISTS mwst_betrag_0 DECIMAL(10,2);
ALTER TABLE belege ADD COLUMN IF NOT EXISTS mwst_satz_7 NUMERIC(5,4);
ALTER TABLE belege ADD COLUMN IF NOT EXISTS mwst_betrag_7 DECIMAL(10,2);
ALTER TABLE belege ADD COLUMN IF NOT EXISTS mwst_satz_19 NUMERIC(5,4);
ALTER TABLE belege ADD COLUMN IF NOT EXISTS mwst_betrag_19 DECIMAL(10,2);
ALTER TABLE belege ADD COLUMN IF NOT EXISTS zahlungsmethode VARCHAR(100);
ALTER TABLE belege ADD COLUMN IF NOT EXISTS zahlungs_datum DATE;
ALTER TABLE belege ADD COLUMN IF NOT EXISTS zahlungs_status VARCHAR(50);
ALTER TABLE belege ADD COLUMN IF NOT EXISTS rechnungs_empfaenger VARCHAR(255);
ALTER TABLE belege ADD COLUMN IF NOT EXISTS aufbewahrungs_ort VARCHAR(255);
ALTER TABLE belege ADD COLUMN IF NOT EXISTS reverse_charge BOOLEAN;
ALTER TABLE belege ADD COLUMN IF NOT EXISTS vorsteuerabzug BOOLEAN;
ALTER TABLE belege ADD COLUMN IF NOT EXISTS kleinbetrag BOOLEAN;
ALTER TABLE belege ADD COLUMN IF NOT EXISTS privatanteil BOOLEAN;
ALTER TABLE belege ADD COLUMN IF NOT EXISTS kontogruppe VARCHAR(100);
ALTER TABLE belege ADD COLUMN IF NOT EXISTS konto_skr03 VARCHAR(10);
ALTER TABLE belege ADD COLUMN IF NOT EXISTS ust_typ VARCHAR(50);
ALTER TABLE belege ADD COLUMN IF NOT EXISTS steuer_kategorie_legacy VARCHAR(100);
ALTER TABLE belege ADD COLUMN IF NOT EXISTS ocr_text TEXT;
ALTER TABLE belege ADD COLUMN IF NOT EXISTS text_content TEXT;
ALTER TABLE belege ADD COLUMN IF NOT EXISTS beschreibung TEXT;
ALTER TABLE belege ADD COLUMN IF NOT EXISTS status VARCHAR(50);
\n`;

  // 3. Insert Config Data
  DEFAULT_TAX_DEFINITIONS.forEach(t => {
      sql += `INSERT INTO steuerkategorien (value, label, ust_satz, vorsteuer, reverse_charge) VALUES ('${t.value}', '${t.label}', ${t.ust_satz}, ${t.vorsteuer}, ${t.reverse_charge || false}) ON CONFLICT (value) DO NOTHING;\n`;
  });
  DEFAULT_ACCOUNT_DEFINITIONS.forEach(a => {
      sql += `INSERT INTO kontierungskonten (id, name, skr03, allowed_tax_categories) VALUES ('${a.id}', '${a.name}', '${a.skr03}', ARRAY['${a.steuerkategorien.join("','")}']) ON CONFLICT (id) DO NOTHING;\n`;
  });

  sql += "\n-- Data Insertion\n";

  // ELSTER Stammdaten (Settings)
  const elster = settings?.elsterStammdaten;
  const elsterDigits = (elster?.eigeneSteuernummer || '').replace(/\D/g, '');
  sql += `INSERT INTO elster_stammdaten (
  id,
  unternehmens_name,
  land,
  plz,
  ort,
  strasse,
  hausnummer,
  eigene_steuernummer,
  eigene_steuernummer_digits,
  eigene_ust_idnr,
  finanzamt_name,
  finanzamt_nr,
  rechtsform,
  besteuerung_ust,
  kleinunternehmer,
  iban,
  kontakt_email,
  updated_at
) VALUES (
  'global',
  ${safeText(elster?.unternehmensName)},
  ${safeText(elster?.land)},
  ${safeText(elster?.plz)},
  ${safeText(elster?.ort)},
  ${safeText(elster?.strasse)},
  ${safeText(elster?.hausnummer)},
  ${safeText(elster?.eigeneSteuernummer)},
  ${safeText(elsterDigits)},
  ${safeText(elster?.eigeneUstIdNr)},
  ${safeText(elster?.finanzamtName)},
  ${safeText(elster?.finanzamtNr)},
  ${safeText(elster?.rechtsform)},
  ${safeText(elster?.besteuerungUst)},
  ${safeBool(elster?.kleinunternehmer)},
  ${safeText(elster?.iban)},
  ${safeText(elster?.kontaktEmail)},
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  unternehmens_name = EXCLUDED.unternehmens_name,
  land = EXCLUDED.land,
  plz = EXCLUDED.plz,
  ort = EXCLUDED.ort,
  strasse = EXCLUDED.strasse,
  hausnummer = EXCLUDED.hausnummer,
  eigene_steuernummer = EXCLUDED.eigene_steuernummer,
  eigene_steuernummer_digits = EXCLUDED.eigene_steuernummer_digits,
  eigene_ust_idnr = EXCLUDED.eigene_ust_idnr,
  finanzamt_name = EXCLUDED.finanzamt_name,
  finanzamt_nr = EXCLUDED.finanzamt_nr,
  rechtsform = EXCLUDED.rechtsform,
  besteuerung_ust = EXCLUDED.besteuerung_ust,
  kleinunternehmer = EXCLUDED.kleinunternehmer,
  iban = EXCLUDED.iban,
  kontakt_email = EXCLUDED.kontakt_email,
  updated_at = NOW();\n\n`;

  docs.forEach(doc => {
      const d = doc.data || {} as any;
      
      sql += `INSERT INTO belege (
    id,
    document_type,
    datum,
    belegnummer_lieferant,
    eigene_beleg_nummer,
    lieferant,
    lieferant_adresse,
    steuernummer,
    zahlungsmethode,
    zahlungs_datum,
    zahlungs_status,
    rechnungs_empfaenger,
    aufbewahrungs_ort,
    betrag,
    netto_betrag,
    mwst_satz_0,
    mwst_betrag_0,
    mwst_satz_7,
    mwst_betrag_7,
    mwst_satz_19,
    mwst_betrag_19,
    steuerkategorie,
    kontierungskonto,
    soll_konto,
    haben_konto,
    konto_ust_satz,
    kontogruppe,
    konto_skr03,
    ust_typ,
    steuer_kategorie_legacy,
    reverse_charge,
    vorsteuerabzug,
    kleinbetrag,
    privatanteil,
    ocr_score,
    ocr_rationale,
    ocr_text,
    text_content,
    beschreibung,
    status
) VALUES (
    '${doc.id}',
    ${safeText(d.documentType)},
    ${safeDate(d.belegDatum)},
    ${safeText(d.belegNummerLieferant)},
    ${safeText(d.eigeneBelegNummer)},
    ${safeText(d.lieferantName)},
    ${safeText(d.lieferantAdresse)},
    ${safeText(d.steuernummer)},
    ${safeText(d.zahlungsmethode)},
    ${safeDate(d.zahlungsDatum)},
    ${safeText(d.zahlungsStatus)},
    ${safeText(d.rechnungsEmpfaenger)},
    ${safeText(d.aufbewahrungsOrt)},
    ${safeNum(d.bruttoBetrag)},
    ${safeNum(d.nettoBetrag)},
    ${safeNum(d.mwstSatz0)},
    ${safeNum(d.mwstBetrag0)},
    ${safeNum(d.mwstSatz7)},
    ${safeNum(d.mwstBetrag7)},
    ${safeNum(d.mwstSatz19)},
    ${safeNum(d.mwstBetrag19)},
    ${safeText(d.steuerkategorie)},
    ${safeText(d.kontierungskonto)},
    ${safeText(d.sollKonto)},
    ${safeText(d.habenKonto)},
    NULL,
    ${safeText(d.kontogruppe)},
    ${safeText(d.konto_skr03)},
    ${safeText(d.ust_typ)},
    ${safeText(d.steuerKategorie)},
    ${safeBool(d.reverseCharge)},
    ${safeBool(d.vorsteuerabzug)},
    ${safeBool(d.kleinbetrag)},
    ${safeBool(d.privatanteil)},
    ${safeNum(d.ocr_score)},
    ${safeText(d.ocr_rationale)},
    ${safeText(d.textContent || '')},
    ${safeText(d.textContent || '')},
    ${safeText(d.beschreibung || '')},
    ${safeText(doc.status)}
);\n`;

      // Line items -> beleg_positionen
      const items = (d.lineItems || []) as any[];
      items.forEach((it, idx) => {
        sql += `INSERT INTO beleg_positionen (doc_id, line_index, description, amount) VALUES (
    '${doc.id}',
    ${idx},
    ${safeText(it?.description)},
    ${safeNum(it?.amount)}
  ) ON CONFLICT (doc_id, line_index) DO UPDATE SET
    description = EXCLUDED.description,
    amount = EXCLUDED.amount;\n`;
      });
  });
  
  return sql;
};

export const exportDatabaseToSQL = async (): Promise<string> => {
  const [docs, settings] = await Promise.all([getAllDocuments(), getSettings()]);
  return generateSQLForDocuments(docs, settings);
};

export const exportDocumentsToSQL = (docs: DocumentRecord[], settings?: AppSettings): string => {
  return generateSQLForDocuments(docs, settings);
};
