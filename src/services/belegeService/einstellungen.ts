import { supabase, Einstellung } from '../supabaseClient';

export async function get(schluessel: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('einstellungen')
    .select('wert')
    .eq('schluessel', schluessel)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data?.wert || null;
}

export async function set(
  schluessel: string,
  wert: string,
  typ: string = 'string'
): Promise<Einstellung> {
  const { data, error } = await supabase
    .from('einstellungen')
    .upsert({ schluessel, wert, typ }, { onConflict: 'schluessel' })
    .select()
    .single();
  if (error) throw error;
  return data as Einstellung;
}

export async function getAll(): Promise<Einstellung[]> {
  const { data, error } = await supabase.from('einstellungen').select('*').order('schluessel');
  if (error) throw error;
  return data as Einstellung[];
}
