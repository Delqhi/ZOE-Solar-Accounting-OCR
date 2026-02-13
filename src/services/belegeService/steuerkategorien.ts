import { supabase, Steuerkategorie } from '../supabaseClient';

export async function getAll(): Promise<Steuerkategorie[]> {
  const { data, error } = await supabase
    .from('steuerkategorien')
    .select('*')
    .eq('aktiv', true)
    .order('label');
  if (error) throw error;
  return data as Steuerkategorie[];
}

export async function create(kategorie: Omit<Steuerkategorie, 'id'>): Promise<Steuerkategorie> {
  const { data, error } = await supabase
    .from('steuerkategorien')
    .insert(kategorie)
    .select()
    .single();
  if (error) throw error;
  return data as Steuerkategorie;
}

export async function seedDefault(): Promise<void> {
  const defaults = [
    {
      wert: '19_pv',
      label: '19% Vorsteuer',
      ust_satz: 0.19,
      vorsteuer: true,
      reverse_charge: false,
      aktiv: true,
    },
    {
      wert: '7_pv',
      label: '7% Vorsteuer',
      ust_satz: 0.07,
      vorsteuer: true,
      reverse_charge: false,
      aktiv: true,
    },
    {
      wert: '0_pv',
      label: '0% PV (Steuerfrei)',
      ust_satz: 0,
      vorsteuer: true,
      reverse_charge: false,
      aktiv: true,
    },
    {
      wert: '0_igl_rc',
      label: '0% IGL / Reverse Charge',
      ust_satz: 0,
      vorsteuer: false,
      reverse_charge: true,
      aktiv: true,
    },
    {
      wert: 'steuerfrei_kn',
      label: 'Steuerfrei (Kleinunternehmer)',
      ust_satz: 0,
      vorsteuer: false,
      reverse_charge: false,
      aktiv: true,
    },
    {
      wert: 'keine_pv',
      label: 'Keine Vorsteuer (Privatanteil)',
      ust_satz: 0,
      vorsteuer: false,
      reverse_charge: false,
      aktiv: true,
    },
  ];

  for (const cat of defaults) {
    const { error } = await supabase.from('steuerkategorien').upsert(cat, { onConflict: 'wert' });
    if (error) console.error('Error seeding steuerkategorie:', error);
  }
}
