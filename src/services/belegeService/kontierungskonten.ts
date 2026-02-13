import { supabase, Kontierungskonto } from '../supabaseClient';

export async function getAll(): Promise<Kontierungskonto[]> {
  const { data, error } = await supabase
    .from('kontierungskonten')
    .select('*')
    .eq('aktiv', true)
    .order('konto_nr');
  if (error) throw error;
  return data as Kontierungskonto[];
}

export async function create(konto: Omit<Kontierungskonto, 'id'>): Promise<Kontierungskonto> {
  const { data, error } = await supabase.from('kontierungskonten').insert(konto).select().single();
  if (error) throw error;
  return data as Kontierungskonto;
}

export async function seedDefault(): Promise<void> {
  const defaults = [
    { konto_nr: '3400', name: 'Wareneingang (SKR03)', steuerkategorie: '19_pv', aktiv: true },
    { konto_nr: '3100', name: 'Fremdleistung (SKR03)', steuerkategorie: '19_pv', aktiv: true },
    { konto_nr: '4964', name: 'Software (SKR03)', steuerkategorie: '19_pv', aktiv: true },
    { konto_nr: '4920', name: 'Internet/Telefon (SKR03)', steuerkategorie: '19_pv', aktiv: true },
    { konto_nr: '4210', name: 'Miete (SKR03)', steuerkategorie: '19_pv', aktiv: true },
    { konto_nr: '4900', name: 'Sonstiges (SKR03)', steuerkategorie: '19_pv', aktiv: true },
    { konto_nr: '1800', name: 'Privatentnahme (SKR03)', steuerkategorie: 'keine_pv', aktiv: true },
  ];

  for (const konto of defaults) {
    const { error } = await supabase
      .from('kontierungskonten')
      .upsert(konto, { onConflict: 'konto_nr' });
    if (error) console.error('Error seeding kontierungskonto:', error);
  }
}
