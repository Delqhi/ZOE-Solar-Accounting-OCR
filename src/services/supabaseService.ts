/**
 * Supabase Service
 * Cloud sync and authentication layer
 * Falls back to local storage if Supabase is not configured
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DocumentRecord, AppSettings, VendorRule } from '../types';

// Types
export interface User {
  id: string;
  email: string;
  displayName?: string;
}

// Supabase client instance (can be null if not configured)
let supabase: SupabaseClient | null = null;
let isInitialized = false;

// Initialize Supabase client
function initSupabase(): SupabaseClient | null {
  if (isInitialized) return supabase;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.warn('Supabase not configured: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing');
    supabase = null;
  } else {
    try {
      supabase = createClient(url, anonKey);
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      supabase = null;
    }
  }

  isInitialized = true;
  return supabase;
}

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  initSupabase();
  return supabase !== null;
}

// ==================== Authentication ====================

export async function signIn(email: string, password: string): Promise<User | null> {
  initSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  if (!data.user) return null;

  return {
    id: data.user.id,
    email: data.user.email!,
    displayName: data.user.user_metadata?.display_name,
  };
}

export async function signUp(email: string, password: string, displayName?: string): Promise<User | null> {
  initSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });

  if (error) throw error;
  if (!data.user) return null;

  return {
    id: data.user.id,
    email: data.user.email!,
    displayName: data.user.user_metadata?.display_name,
  };
}

export async function signOut(): Promise<void> {
  initSupabase();
  if (!supabase) return;

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  initSupabase();
  if (!supabase) return null;

  const { data } = await supabase.auth.getSession();
  const session = data.session;

  if (!session?.user) return null;

  return {
    id: session.user.id,
    email: session.user.email!,
    displayName: session.user.user_metadata?.display_name,
  };
}

// ==================== Document Operations ====================

export async function getDocuments(): Promise<DocumentRecord[]> {
  initSupabase();
  if (!supabase) return [];

  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('uploadDate', { ascending: false });

    if (error) {
      console.error('Supabase getDocuments error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('getDocuments failed:', error);
    return [];
  }
}

export async function saveDocument(document: DocumentRecord): Promise<DocumentRecord> {
  initSupabase();
  if (!supabase) return document;

  try {
    const user = await getCurrentUser();
    if (!user) return document;

    const docWithUser = {
      ...document,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from('documents')
      .upsert(docWithUser)
      .select()
      .single();

    if (error) {
      console.error('Supabase saveDocument error:', error);
      return document;
    }

    return data || document;
  } catch (error) {
    console.error('saveDocument failed:', error);
    return document;
  }
}

export async function deleteDocument(id: string): Promise<void> {
  initSupabase();
  if (!supabase) return;

  try {
    const user = await getCurrentUser();
    if (!user) return;

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Supabase deleteDocument error:', error);
    }
  } catch (error) {
    console.error('deleteDocument failed:', error);
  }
}

export async function savePrivateDocument(document: DocumentRecord): Promise<DocumentRecord> {
  initSupabase();
  if (!supabase) return document;

  try {
    const user = await getCurrentUser();
    if (!user) return document;

    const docWithUser = {
      ...document,
      user_id: user.id,
      isPrivate: true,
    };

    const { data, error } = await supabase
      .from('private_documents')
      .upsert(docWithUser)
      .select()
      .single();

    if (error) {
      console.error('Supabase savePrivateDocument error:', error);
      return document;
    }

    return data || document;
  } catch (error) {
    console.error('savePrivateDocument failed:', error);
    return document;
  }
}

// ==================== Settings Operations ====================

export async function getSettings(): Promise<AppSettings | null> {
  initSupabase();
  if (!supabase) return null;

  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Row not found
      console.error('Supabase getSettings error:', error);
      return null;
    }

    return data?.settings || null;
  } catch (error) {
    console.error('getSettings failed:', error);
    return null;
  }
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  initSupabase();
  if (!supabase) return settings;

  try {
    const user = await getCurrentUser();
    if (!user) return settings;

    const { data, error } = await supabase
      .from('settings')
      .upsert({
        user_id: user.id,
        settings,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase saveSettings error:', error);
      return settings;
    }

    return data?.settings || settings;
  } catch (error) {
    console.error('saveSettings failed:', error);
    return settings;
  }
}

// ==================== Vendor Rules Operations ====================

export async function getVendorRule(vendorName: string): Promise<VendorRule | null> {
  initSupabase();
  if (!supabase) return null;

  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('vendor_rules')
      .select('*')
      .eq('user_id', user.id)
      .eq('vendorName', vendorName)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Supabase getVendorRule error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('getVendorRule failed:', error);
    return null;
  }
}

export async function saveVendorRule(
  vendorName: string,
  accountId: string,
  taxCategoryValue: string
): Promise<VendorRule | null> {
  initSupabase();
  if (!supabase) return null;

  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const rule: VendorRule = {
      vendorName,
      accountId,
      taxCategoryValue,
      lastUpdated: new Date().toISOString(),
      useCount: 1,
      accountGroupName: '',
    };

    const { data, error } = await supabase
      .from('vendor_rules')
      .upsert({
        ...rule,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase saveVendorRule error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('saveVendorRule failed:', error);
    return null;
  }
}

// ==================== Export Operations ====================

export function exportDocumentsToSQL(
  documents: DocumentRecord[],
  settings: AppSettings
): string {
  const tableName = 'zoe_documents';
  const statements: string[] = [];

  for (const doc of documents) {
    const data = doc.data;
    if (!data) continue;

    const values = [
      `'${doc.id}'`,
      `'${doc.uploadDate}'`,
      `'${doc.fileName.replace(/'/g, "''")}'`,
      `'${data.lieferantName.replace(/'/g, "''")}'`,
      data.nettoBetrag || 0,
      data.bruttoBetrag || 0,
      data.mwstBetrag19 || 0,
      `'${data.konto_skr03 || data.kontierungskonto || ''}'`,
      `'${doc.status}'`,
    ].join(', ');

    statements.push(`INSERT INTO ${tableName} VALUES (${values});`);
  }

  return statements.join('\n');
}

// ==================== Utility Functions ====================

export async function syncWithCloud(): Promise<{
  synced: number;
  conflicts: number;
  errors: number;
}> {
  initSupabase();
  if (!supabase) return { synced: 0, conflicts: 0, errors: 0 };

  try {
    const user = await getCurrentUser();
    if (!user) return { synced: 0, conflicts: 0, errors: 0 };

    // Get local documents (would need access to storageService)
    // Get cloud documents
    // Compare and sync
    // This is a placeholder for the full sync logic

    return { synced: 0, conflicts: 0, errors: 0 };
  } catch (error) {
    console.error('syncWithCloud failed:', error);
    return { synced: 0, conflicts: 0, errors: 1 };
  }
}

// Re-export types
export type { SupabaseClient };
