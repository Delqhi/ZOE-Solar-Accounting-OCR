import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables (imported via import.meta.env for Vite)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate configuration
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase configuration missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
}

// Create Supabase client for browser-side usage
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: false, // We don't need session persistence for this app
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'x-application-name': 'zoe-solar-accounting-ocr',
    },
  },
});

// Database types based on our schema
export interface Beleg {
  id: string;
  dateiname: string;
  dateityp: string | null;
  dateigroesse: number | null;
  file_hash: string | null;
  gitlab_storage_url: string | null;
  status: 'PROCESSING' | 'REVIEW_NEEDED' | 'COMPLETED' | 'ERROR' | 'DUPLICATE';
  fehler: string | null;
  ocr_score: number | null;
  ocr_rationale: string | null;
  document_type: string | null;
  beleg_datum: string | null;
  belegnummer_lieferant: string | null;
  lieferant_name: string | null;
  lieferant_adresse: string | null;
  steuernummer: string | null;
  netto_betrag: number | null;
  brutto_betrag: number | null;
  mwst_satz_0: number | null;
  mwst_betrag_0: number | null;
  mwst_satz_7: number | null;
  mwst_betrag_7: number | null;
  mwst_satz_19: number | null;
  mwst_betrag_19: number | null;
  zahlungsmethode: string | null;
  eigene_beleg_nummer: string | null;
  kontierungskonto: string | null;
  steuerkategorie: string | null;
  kontierung_begruendung: string | null;
  soll_konto: string | null;
  haben_konto: string | null;
  zahlungs_datum: string | null;
  zahlungs_status: string | null;
  aufbewahrungs_ort: string | null;
  rechnungs_empfaenger: string | null;
  kleinbetrag: boolean;
  vorsteuerabzug: boolean;
  reverse_charge: boolean;
  privatanteil: boolean;
  duplicate_of_id: string | null;
  duplicate_confidence: number | null;
  duplicate_reason: string | null;
  uploaded_at: string;
  processed_at: string | null;
  updated_at: string | null;
  // Line items (joined)
  positionen?: BelegPosition[];
}

export interface BelegPosition {
  id: string;
  beleg_id: string;
  position_index: number;
  beschreibung: string | null;
  menge: number | null;
  einzelpreis: number | null;
  gesamtbetrag: number | null;
  mwst_satz: number | null;
  konto: string | null;
  steuerkategorie: string | null;
}

export interface Steuerkategorie {
  id: string;
  wert: string;
  label: string;
  ust_satz: number;
  vorsteuer: boolean;
  reverse_charge: boolean;
  aktiv: boolean;
}

export interface Kontierungskonto {
  id: string;
  konto_nr: string;
  name: string;
  steuerkategorie: string | null;
  aktiv: boolean;
}

export interface LieferantenRegel {
  id: string;
  lieferant_name_pattern: string;
  standard_konto: string | null;
  standard_steuerkategorie: string | null;
  prioritaet: number;
  aktiv: boolean;
  created_at: string;
}

export interface Einstellung {
  id: string;
  schluessel: string;
  wert: string;
  typ: string;
  created_at: string;
  updated_at: string | null;
}

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
