import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// Environment variables (add to .env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseClient: SupabaseClient | null = null;

export const initSupabase = (): SupabaseClient => {
  if (!supabaseClient && supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  }
  if (!supabaseClient) {
    throw new Error('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  }
  return supabaseClient;
};

export const getSupabase = (): SupabaseClient => {
  if (!supabaseClient) {
    return initSupabase();
  }
  return supabaseClient;
};

export const getCurrentUser = async (): Promise<User | null> => {
  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();
  return user;
};

export const signIn = async (email: string, password: string) => {
  const client = getSupabase();
  return client.auth.signInWithPassword({ email, password });
};

export const signUp = async (email: string, password: string) => {
  const client = getSupabase();
  return client.auth.signUp({ email, password });
};

export const signOut = async () => {
  const client = getSupabase();
  return client.auth.signOut();
};

// File upload to Supabase Storage
export const uploadDocumentFile = async (
  userId: string,
  file: File,
  documentId: string
): Promise<string> => {
  const client = getSupabase();
  const filePath = `${userId}/${documentId}/${file.name}`;

  const { data, error } = await client.storage
    .from('documents')
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type
    });

  if (error) throw error;

  const { data: { publicUrl } } = client.storage
    .from('documents')
    .getPublicUrl(filePath);

  return publicUrl;
};

export const deleteDocumentFile = async (
  userId: string,
  documentId: string
): Promise<void> => {
  const client = getSupabase();

  // List all files in the document folder
  const { data: files } = await client.storage
    .from('documents')
    .list(`${userId}/${documentId}/`);

  if (files && files.length > 0) {
    const filePaths = files.map(f => `${userId}/${documentId}/${f.name}`);
    await client.storage
      .from('documents')
      .remove(filePaths);
  }
};

// Subscribe to auth changes
export const subscribeToAuthChanges = (
  callback: (user: User | null) => void
) => {
  const client = getSupabase();
  return client.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
};
