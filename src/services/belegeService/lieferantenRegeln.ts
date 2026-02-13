import { supabase, LieferantenRegel } from '../supabaseClient';

export async function getAll(): Promise<LieferantenRegel[]> {
  const { data, error } = await supabase
    .from('lieferanten_regeln')
    .select('*')
    .eq('aktiv', true)
    .order('prioritaet', { ascending: true });
  if (error) throw error;
  return data as LieferantenRegel[];
}

export async function create(
  regel: Omit<LieferantenRegel, 'id' | 'created_at'>
): Promise<LieferantenRegel> {
  const { data, error } = await supabase.from('lieferanten_regeln').insert(regel).select().single();
  if (error) throw error;
  return data as LieferantenRegel;
}

export async function findMatching(lieferantName: string): Promise<LieferantenRegel | null> {
  const { data, error } = await supabase
    .from('lieferanten_regeln')
    .select('*')
    .eq('aktiv', true)
    .ilike('lieferant_name_pattern', `%${lieferantName}%`)
    .order('prioritaet', { ascending: true })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as LieferantenRegel;
}
