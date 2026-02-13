import { supabase, Beleg } from '../supabaseClient';
import { ExtractedData, DocumentStatus } from '../../types';
import { belegToDb } from './converters';

export interface GetAllOptions {
  status?: DocumentStatus;
  fromDate?: string;
  toDate?: string;
  lieferant?: string;
  limit?: number;
  offset?: number;
}

export async function getAll(options?: GetAllOptions): Promise<{ data: Beleg[]; count: number }> {
  let query = supabase
    .from('belege')
    .select('*', { count: 'exact' })
    .order('uploaded_at', { ascending: false });

  if (options?.status) query = query.eq('status', options.status);
  if (options?.fromDate) query = query.gte('beleg_datum', options.fromDate);
  if (options?.toDate) query = query.lte('beleg_datum', options.toDate);
  if (options?.lieferant) query = query.ilike('lieferant_name', `%${options.lieferant}%`);
  if (options?.limit) query = query.limit(options.limit);
  if (options?.offset)
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data as Beleg[], count: count || 0 };
}

export async function getById(id: string): Promise<Beleg | null> {
  const { data, error } = await supabase
    .from('belege')
    .select('*, positionen(*)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as Beleg;
}

export async function create(
  data: ExtractedData,
  fileInfo: {
    dateiname: string;
    dateityp?: string;
    dateigroesse?: number;
    file_hash?: string;
    gitlab_storage_url?: string;
  }
): Promise<Beleg> {
  const belegData = belegToDb(data, fileInfo);
  const { data: beleg, error } = await supabase.from('belege').insert(belegData).select().single();

  if (error) throw error;

  if (data.lineItems?.length) {
    await createPositionen(beleg.id, data.lineItems);
  }

  return beleg as Beleg;
}

export async function update(id: string, data: Partial<ExtractedData>): Promise<Beleg> {
  const updateData: Partial<Beleg> = {};

  if (data.documentType !== undefined) updateData.document_type = data.documentType;
  if (data.belegDatum !== undefined) updateData.beleg_datum = data.belegDatum;
  if (data.belegNummerLieferant !== undefined)
    updateData.belegnummer_lieferant = data.belegNummerLieferant;
  if (data.lieferantName !== undefined) updateData.lieferant_name = data.lieferantName;
  if (data.lieferantAdresse !== undefined) updateData.lieferant_adresse = data.lieferantAdresse;
  if (data.steuernummer !== undefined) updateData.steuernummer = data.steuernummer;
  if (data.nettoBetrag !== undefined) updateData.netto_betrag = data.nettoBetrag;
  if (data.bruttoBetrag !== undefined) updateData.brutto_betrag = data.bruttoBetrag;
  if (data.mwstSatz0 !== undefined) updateData.mwst_satz_0 = data.mwstSatz0;
  if (data.mwstBetrag0 !== undefined) updateData.mwst_betrag_0 = data.mwstBetrag0;
  if (data.mwstSatz7 !== undefined) updateData.mwst_satz_7 = data.mwstSatz7;
  if (data.mwstBetrag7 !== undefined) updateData.mwst_betrag_7 = data.mwstBetrag7;
  if (data.mwstSatz19 !== undefined) updateData.mwst_satz_19 = data.mwstSatz19;
  if (data.mwstBetrag19 !== undefined) updateData.mwst_betrag_19 = data.mwstBetrag19;
  if (data.zahlungsmethode !== undefined) updateData.zahlungsmethode = data.zahlungsmethode;
  if (data.kontierungskonto !== undefined) updateData.kontierungskonto = data.kontierungskonto;
  if (data.steuerkategorie !== undefined) updateData.steuerkategorie = data.steuerkategorie;
  if (data.kontierungBegruendung !== undefined)
    updateData.kontierung_begruendung = data.kontierungBegruendung;
  if (data.sollKonto !== undefined) updateData.soll_konto = data.sollKonto;
  if (data.habenKonto !== undefined) updateData.haben_konto = data.habenKonto;
  if (data.zahlungsDatum !== undefined) updateData.zahlungs_datum = data.zahlungsDatum;
  if (data.zahlungsStatus !== undefined) updateData.zahlungs_status = data.zahlungsStatus;
  if (data.aufbewahrungsOrt !== undefined) updateData.aufbewahrungs_ort = data.aufbewahrungsOrt;
  if (data.rechnungsEmpfaenger !== undefined)
    updateData.rechnungs_empfaenger = data.rechnungsEmpfaenger;
  if (data.kleinbetrag !== undefined) updateData.kleinbetrag = data.kleinbetrag;
  if (data.vorsteuerabzug !== undefined) updateData.vorsteuerabzug = data.vorsteuerabzug;
  if (data.reverseCharge !== undefined) updateData.reverse_charge = data.reverseCharge;
  if (data.privatanteil !== undefined) updateData.privatanteil = data.privatanteil;

  const { data: beleg, error } = await supabase
    .from('belege')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  if (data.lineItems !== undefined) {
    await updatePositionen(id, data.lineItems);
  }

  return beleg as Beleg;
}

export async function updateStatus(
  id: string,
  status: DocumentStatus,
  errorMsg?: string
): Promise<Beleg> {
  const updateData: Partial<Beleg> = {
    status,
    processed_at: new Date().toISOString(),
  };
  if (errorMsg) updateData.fehler = errorMsg;

  const { data: beleg, error } = await supabase
    .from('belege')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return beleg as Beleg;
}

export async function remove(id: string): Promise<void> {
  const { error } = await supabase.from('belege').delete().eq('id', id);
  if (error) throw error;
}

export async function findByFileHash(fileHash: string): Promise<Beleg | null> {
  const { data, error } = await supabase
    .from('belege')
    .select('*')
    .eq('file_hash', fileHash)
    .order('uploaded_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as Beleg;
}

export async function findSemanticDuplicates(
  belegNummer: string,
  lieferant: string,
  betrag: number
): Promise<Beleg[]> {
  const { data, error } = await supabase
    .from('belege')
    .select('*')
    .eq('belegnummer_lieferant', belegNummer)
    .eq('lieferant_name', lieferant)
    .eq('brutto_betrag', betrag)
    .neq('status', 'DUPLICATE')
    .order('uploaded_at', { ascending: false })
    .limit(5);

  if (error) throw error;
  return data as Beleg[];
}

export async function createPositionen(
  belegId: string,
  positionen: ExtractedData['lineItems']
): Promise<void> {
  const positionData =
    positionen?.map((pos, index) => ({
      beleg_id: belegId,
      position_index: index,
      beschreibung: pos.description || null,
      menge: pos.quantity || null,
      einzelpreis: null,
      gesamtbetrag: pos.amount || null,
      mwst_satz: null,
      konto: null,
      steuerkategorie: null,
    })) || [];

  const { error } = await supabase.from('beleg_positionen').insert(positionData);
  if (error) throw error;
}

export async function deletePositionen(belegId: string): Promise<void> {
  const { error } = await supabase.from('beleg_positionen').delete().eq('beleg_id', belegId);
  if (error) throw error;
}

export async function updatePositionen(
  belegId: string,
  positionen: ExtractedData['lineItems']
): Promise<void> {
  await deletePositionen(belegId);
  if (positionen?.length) {
    await createPositionen(belegId, positionen);
  }
}

export async function getStats(): Promise<{
  total: number;
  byStatus: Record<string, number>;
  totalAmount: number;
}> {
  const { data: allData, error } = await supabase.from('belege').select('status, brutto_betrag');
  if (error) throw error;

  const byStatus: Record<string, number> = {};
  let totalAmount = 0;

  for (const row of allData) {
    byStatus[row.status] = (byStatus[row.status] || 0) + 1;
    if (row.brutto_betrag) totalAmount += row.brutto_betrag;
  }

  return { total: allData.length, byStatus, totalAmount };
}
