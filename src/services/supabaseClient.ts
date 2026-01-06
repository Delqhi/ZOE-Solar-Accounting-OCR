import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables (imported via import.meta.env for Vite)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate configuration
const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Connection test cache
let connectionTestCache: { timestamp: number; result: boolean } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Create Supabase client for browser-side usage
// Only create client if properly configured to avoid connection errors
let supabaseInstance: SupabaseClient | null = null;

if (isConfigured) {
  supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: false, // We don't need session persistence for this app
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'x-application-name': 'zoe-solar-accounting-ocr',
      },
      // Enhanced fetch with better error handling
      fetch: async (url: string, options?: RequestInit) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            // Add CORS headers for self-hosted Supabase
            mode: 'cors',
            credentials: 'omit',
          });
          clearTimeout(timeoutId);
          return response;
        } catch (error) {
          clearTimeout(timeoutId);

          // Enhanced error handling
          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              throw new Error(`Supabase request timeout after 15s - URL: ${url}`);
            }
            if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
              throw new Error(
                `Connection refused to Supabase. Please check:\n` +
                `1. Supabase instance is running at ${SUPABASE_URL}\n` +
                `2. Network connectivity to the server\n` +
                `3. CORS settings if self-hosted\n` +
                `4. Firewall rules blocking the connection`
              );
            }
            if (error.message.includes('TypeError')) {
              throw new Error(`Network error: ${error.message}. Check your internet connection.`);
            }
          }
          throw error;
        }
      },
    },
  });
}

export const supabase: SupabaseClient = supabaseInstance as any;

/**
 * Test Supabase connectivity with caching
 * Returns true if connection is working, false otherwise
 */
export async function testSupabaseConnection(): Promise<boolean> {
  // Return cached result if recent
  const now = Date.now();
  if (connectionTestCache && (now - connectionTestCache.timestamp) < CACHE_DURATION) {
    return connectionTestCache.result;
  }

  if (!isConfigured || !supabaseInstance) {
    connectionTestCache = { timestamp: now, result: false };
    return false;
  }

  try {
    // Try a simple query to test connectivity
    const { error } = await supabaseInstance
      .from('einstellungen')
      .select('schluessel')
      .limit(1);

    // If we get here without a network error, connection works
    // (even if table doesn't exist, that's a different issue)
    const success = error === null || error.code !== 'PGRST116'; // PGRST116 = table not found

    connectionTestCache = { timestamp: now, result: success };
    return success;
  } catch (error) {
    // Network error or connection refused
    console.warn('Supabase connection test failed:', error);
    connectionTestCache = { timestamp: now, result: false };
    return false;
  }
}

/**
 * Get connection status with detailed information
 */
export async function getSupabaseStatus(): Promise<{
  configured: boolean;
  reachable: boolean;
  url: string;
  error?: string;
  timestamp: number;
}> {
  const timestamp = Date.now();

  if (!isConfigured) {
    return {
      configured: false,
      reachable: false,
      url: SUPABASE_URL || 'not set',
      error: 'Supabase URL or ANON_KEY not configured',
      timestamp,
    };
  }

  const reachable = await testSupabaseConnection();

  return {
    configured: true,
    reachable,
    url: SUPABASE_URL,
    error: reachable ? undefined : 'Unable to connect to Supabase instance',
    timestamp,
  };
}

// Database types based on our schema
export interface Beleg {
  id: string;
  dateiname: string;
  dateityp: string | null;
  dateigroesse: number | null;
  file_hash: string | null;
  gitlab_storage_url: string | null;
  status: 'PROCESSING' | 'REVIEW_NEEDED' | 'COMPLETED' | 'ERROR' | 'DUPLICATE' | 'PRIVATE';
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
  // Additional fields for compatibility
  kontogruppe?: string | null;
  konto_skr03?: string | null;
  ust_typ?: string | null;
  steuerKategorie?: string | null;
  beschreibung?: string | null;
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
  // Alternative field names used in code
  kontierungskonto?: string;
  steuerkategorie?: string;
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
