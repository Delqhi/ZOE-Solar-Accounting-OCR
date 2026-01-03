import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DocumentRecord, DocumentStatus, ExtractedData, AppSettings } from '../types';

// Environment variables (must be set in .env)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseClient: SupabaseClient | null = null;

// --- Supabase Client ---

export const initSupabase = (): SupabaseClient | null => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
};

export const isSupabaseConfigured = (): boolean => {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
};

// --- Authentication ---

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export const signUp = async (email: string, password: string): Promise<{ user: User | null; error: string | null }> => {
  const client = initSupabase();
  if (!client) {
    return { user: null, error: 'Supabase not configured' };
  }

  const { data, error } = await client.auth.signUp({
    email,
    password
  });

  if (error) {
    return { user: null, error: error.message };
  }

  if (data.user) {
    return {
      user: {
        id: data.user.id,
        email: data.user.email || '',
        createdAt: data.user.created_at
      },
      error: null
    };
  }

  return { user: null, error: 'Unknown error' };
};

export const signIn = async (email: string, password: string): Promise<{ user: User | null; error: string | null }> => {
  const client = initSupabase();
  if (!client) {
    return { user: null, error: 'Supabase not configured' };
  }

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return { user: null, error: error.message };
  }

  if (data.user) {
    return {
      user: {
        id: data.user.id,
        email: data.user.email || '',
        createdAt: data.user.created_at
      },
      error: null
    };
  }

  return { user: null, error: 'Unknown error' };
};

export const signOut = async (): Promise<{ error: string | null }> => {
  const client = initSupabase();
  if (!client) {
    return { error: 'Supabase not configured' };
  }

  const { error } = await client.auth.signOut();
  return { error: error?.message || null };
};

export const getCurrentUser = async (): Promise<{ user: User | null; error: string | null }> => {
  const client = initSupabase();
  if (!client) {
    return { user: null, error: 'Supabase not configured' };
  }

  const { data, error } = await client.auth.getUser();

  if (error) {
    return { user: null, error: error.message };
  }

  if (data.user) {
    return {
      user: {
        id: data.user.id,
        email: data.user.email || '',
        createdAt: data.user.created_at
      },
      error: null
    };
  }

  return { user: null, error: 'No user' };
};

export const onAuthStateChange = (callback: (user: User | null) => void): (() => void) => {
  const client = initSupabase();
  if (!client) {
    callback(null);
    return () => {};
  }

  return client.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      callback({
        id: session.user.id,
        email: session.user.email || '',
        createdAt: session.user.created_at
      });
    } else {
      callback(null);
    }
  });
};

// --- Document Operations ---

export interface SupabaseDocument {
  id: string;
  file_data: string; // base64 encoded
  file_name: string;
  file_type: string;
  lieferant_name: string | null;
  lieferant_adresse: string | null;
  beleg_datum: string | null;
  brutto_betrag: number | null;
  mwst_betrag: number | null;
  mwst_satz: number | null;
  steuerkategorie: string | null;
  skr03_konto: string | null;
  line_items: any | null;
  status: string;
  score: number | null;
  created_at: string;
}

export interface PrivateDocumentRecord {
  id: string;
  file_data: string;
  file_name: string;
  file_type: string;
  vendor_name: string | null;
  document_date: string | null;
  total_amount: number | null;
  line_items: any | null;
  private_reason: string;
  created_at: string;
}

// --- Settings Operations ---

interface SupabaseSettings {
  id: string;
  settings_data: any;
  created_at: string;
  updated_at: string;
}

export const getSettings = async (): Promise<AppSettings> => {
  const client = initSupabase();
  if (!client) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await client
    .from('app_settings')
    .select('settings_data')
    .eq('id', 'global')
    .single();

  if (error || !data) {
    // Return default settings if none exist
    return getDefaultSettings();
  }

  return data.settings_data as AppSettings;
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  const client = initSupabase();
  if (!client) {
    throw new Error('Supabase not configured');
  }

  const { error } = await client
    .from('app_settings')
    .upsert({
      id: 'global',
      settings_data: settings,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

  if (error) {
    throw new Error(`Failed to save settings: ${error.message}`);
  }
};

// --- Helper: Get Default Settings (for migration/fallback) ---

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
    'steuerfrei_kn': '0',
    'keine_pv': '0',
    '0_igl_rc': ''
  }
};

const DEFAULT_ELSTER_STAMMDATEN = {
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

const getDefaultSettings = (): AppSettings => ({
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
});

// --- Document CRUD ---

export const getAllDocuments = async (): Promise<DocumentRecord[]> => {
  const client = initSupabase();
  if (!client) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await client
    .from('belege')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
    return [];
  }

  return (data || []).map(doc => transformSupabaseToDocument(doc));
};

export const getDocumentsPaginated = async (
  page: number = 1,
  pageSize: number = 50
): Promise<{ documents: DocumentRecord[]; total: number; hasMore: boolean }> => {
  const client = initSupabase();
  if (!client) {
    throw new Error('Supabase not configured');
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Get total count
  const { count } = await client
    .from('belege')
    .select('*', { count: 'exact', head: true });

  // Get paginated data
  const { data, error } = await client
    .from('belege')
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching documents:', error);
    return { documents: [], total: count || 0, hasMore: false };
  }

  const documents = (data || []).map(doc => transformSupabaseToDocument(doc));
  const total = count || 0;
  const hasMore = to < total - 1;

  return { documents, total, hasMore };
};

export const saveDocument = async (doc: DocumentRecord): Promise<void> => {
  const client = initSupabase();
  if (!client) {
    throw new Error('Supabase not configured');
  }

  const supabaseDoc = transformDocumentToSupabase(doc);

  const { error } = await client
    .from('belege')
    .upsert(supabaseDoc, { onConflict: 'id' });

  if (error) {
    throw new Error(`Failed to save document: ${error.message}`);
  }
};

export const deleteDocument = async (id: string): Promise<void> => {
  const client = initSupabase();
  if (!client) {
    throw new Error('Supabase not configured');
  }

  const { error } = await client
    .from('belege')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete document: ${error.message}`);
  }
};

// --- Private Documents ---

export const savePrivateDocument = async (
  id: string,
  fileName: string,
  fileType: string,
  base64Data: string,
  extractedData: ExtractedData,
  privateReason: string
): Promise<void> => {
  const client = initSupabase();
  if (!client) {
    throw new Error('Supabase not configured');
  }

  const { error } = await client
    .from('belege_privat')
    .insert({
      id,
      file_data: base64Data,
      file_name: fileName,
      file_type: fileType,
      vendor_name: extractedData.lieferantName || null,
      document_date: extractedData.belegDatum || null,
      total_amount: extractedData.bruttoBetrag || null,
      line_items: extractedData.lineItems || [],
      private_reason: privateReason
    });

  if (error) {
    throw new Error(`Failed to save private document: ${error.message}`);
  }
};

// --- Transformations ---

function transformSupabaseToDocument(doc: SupabaseDocument): DocumentRecord {
  return {
    id: doc.id,
    fileName: doc.file_name,
    fileType: doc.file_type,
    uploadDate: doc.created_at,
    status: doc.status as DocumentStatus,
    data: {
      lieferantName: doc.lieferant_name || '',
      lieferantAdresse: doc.lieferant_adresse || '',
      belegDatum: doc.beleg_datum || '',
      bruttoBetrag: doc.brutto_betrag || 0,
      mwstBetrag: doc.mwst_betrag || 0,
      mwstSatz19: doc.mwst_satz || 0,
      steuerkategorie: doc.steuerkategorie || '',
      kontierungskonto: doc.skr03_konto || '',
      lineItems: doc.line_items || [],
      kontogruppe: '',
      konto_skr03: doc.skr03_konto || '',
      ust_typ: '',
      sollKonto: '',
      habenKonto: '',
      steuerKategorie: doc.steuerkategorie || '',
      belegNummerLieferant: '',
      steuernummer: '',
      nettoBetrag: 0,
      mwstSatz0: 0,
      mwstBetrag0: 0,
      mwstSatz7: 0,
      mwstBetrag7: 0,
      zahlungsmethode: '',
      eigeneBelegNummer: '',
      zahlungsDatum: '',
      zahlungsStatus: '',
      rechnungsEmpfaenger: '',
      aufbewahrungsOrt: '',
      kleinbetrag: false,
      vorsteuerabzug: false,
      reverseCharge: false,
      privatanteil: false,
      beschreibung: '',
      documentType: undefined,
      kontierungBegruendung: undefined,
      qualityScore: doc.score || undefined,
      ocr_score: doc.score || undefined,
      textContent: undefined,
      ruleApplied: undefined
    },
    previewUrl: `data:${doc.file_type};base64,${doc.file_data}`
  };
}

function transformDocumentToSupabase(doc: DocumentRecord): SupabaseDocument {
  const data = doc.data;
  return {
    id: doc.id,
    file_data: doc.previewUrl?.split(',')[1] || '',
    file_name: doc.fileName,
    file_type: doc.fileType,
    lieferant_name: data?.lieferantName || null,
    lieferant_adresse: data?.lieferantAdresse || null,
    beleg_datum: data?.belegDatum || null,
    brutto_betrag: data?.bruttoBetrag || null,
    mwst_betrag: data?.mwstBetrag || null,
    mwst_satz: data?.mwstSatz19 || null,
    steuerkategorie: data?.steuerkategorie || null,
    skr03_konto: data?.konto_skr03 || null,
    line_items: data?.lineItems || null,
    status: doc.status,
    score: data?.ocr_score || null,
    created_at: doc.uploadDate
  };
}

// --- Vendor Rules (Memory System) ---

export const getVendorRule = async (vendorName: string): Promise<{ accountId?: string; taxCategoryValue?: string } | undefined> => {
  if (!vendorName || vendorName.length < 2) return undefined;

  const client = initSupabase();
  if (!client) return undefined;

  const { data, error } = await client
    .from('vendor_rules')
    .select('account_id, tax_category_value')
    .eq('vendor_name', vendorName.toLowerCase().trim())
    .single();

  if (error || !data) return undefined;

  return {
    accountId: data.account_id,
    taxCategoryValue: data.tax_category_value
  };
};

export const saveVendorRule = async (vendorName: string, accountId: string, taxCategoryValue: string): Promise<void> => {
  if (!vendorName || vendorName.length < 2) return;

  const client = initSupabase();
  if (!client) return;

  const normalizedName = vendorName.toLowerCase().trim();

  // Get existing count to increment
  const { data: existing } = await client
    .from('vendor_rules')
    .select('use_count')
    .eq('vendor_name', normalizedName)
    .single();

  const useCount = (existing?.use_count || 0) + 1;

  const { error } = await client
    .from('vendor_rules')
    .upsert({
      vendor_name: normalizedName,
      account_id: accountId,
      tax_category_value: taxCategoryValue,
      use_count: useCount,
      last_updated: new Date().toISOString()
    }, { onConflict: 'vendor_name' });

  if (error) {
    console.error('Failed to save vendor rule:', error);
  }
};

// --- SQL Export ---

export const exportDocumentsToSQL = (docs: DocumentRecord[], settings?: AppSettings): string => {
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

  // 1. Tables Definition
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
    steuerkategorie VARCHAR(50),
    kontierungskonto VARCHAR(50),
    soll_konto VARCHAR(10),
    haben_konto VARCHAR(10),
    konto_ust_satz NUMERIC(5,4),
    kontogruppe VARCHAR(100),
    konto_skr03 VARCHAR(10),
    ust_typ VARCHAR(50),
    steuer_kategorie_legacy VARCHAR(100),
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

  sql += `
CREATE TABLE IF NOT EXISTS beleg_positionen (
    doc_id UUID NOT NULL REFERENCES belege(id) ON DELETE CASCADE,
    line_index INTEGER NOT NULL,
    description TEXT,
    amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (doc_id, line_index)
);\n\n`;

  // 2. Insert Config Data
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
  id, unternehmens_name, land, plz, ort, strasse, hausnummer,
  eigene_steuernummer, eigene_steuernummer_digits, eigene_ust_idnr,
  finanzamt_name, finanzamt_nr, rechtsform, besteuerung_ust,
  kleinunternehmer, iban, kontakt_email, updated_at
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
  updated_at = NOW();\n\n`;

  docs.forEach(doc => {
      const d = doc.data || {} as any;

      sql += `INSERT INTO belege (
    id, document_type, datum, belegnummer_lieferant, eigene_beleg_nummer,
    lieferant, lieferant_adresse, steuernummer,
    zahlungsmethode, zahlungs_datum, zahlungs_status, rechnungs_empfaenger, aufbewahrungs_ort,
    betrag, netto_betrag,
    mwst_satz_0, mwst_betrag_0, mwst_satz_7, mwst_betrag_7, mwst_satz_19, mwst_betrag_19,
    steuerkategorie, kontierungskonto, soll_konto, haben_konto,
    kontogruppe, konto_skr03, ust_typ, steuer_kategorie_legacy,
    reverse_charge, vorsteuerabzug, kleinbetrag, privatanteil,
    ocr_score, ocr_rationale, ocr_text, text_content, beschreibung, status
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
