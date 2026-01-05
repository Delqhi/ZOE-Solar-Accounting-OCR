import { supabase, Beleg, BelegPosition, Steuerkategorie, Kontierungskonto, LieferantenRegel, Einstellung } from './supabaseClient';
import { ExtractedData, DocumentStatus } from '../types';

// Convert extracted data to database format
function belegToDb(data: ExtractedData, fileInfo: {
  dateiname: string;
  dateityp?: string;
  dateigroesse?: number;
  file_hash?: string;
  gitlab_storage_url?: string;
}): Partial<Beleg> {
  return {
    dateiname: fileInfo.dateiname,
    dateityp: fileInfo.dateityp || null,
    dateigroesse: fileInfo.dateigroesse || null,
    file_hash: fileInfo.file_hash || null,
    gitlab_storage_url: fileInfo.gitlab_storage_url || null,
    status: 'PROCESSING',
    document_type: data.documentType || null,
    beleg_datum: data.belegDatum || null,
    belegnummer_lieferant: data.belegNummerLieferant || null,
    lieferant_name: data.lieferantName || null,
    lieferant_adresse: data.lieferantAdresse || null,
    steuernummer: data.steuernummer || null,
    netto_betrag: data.nettoBetrag || null,
    brutto_betrag: data.bruttoBetrag || null,
    mwst_satz_0: data.mwstSatz0 || null,
    mwst_betrag_0: data.mwstBetrag0 || null,
    mwst_satz_7: data.mwstSatz7 || null,
    mwst_betrag_7: data.mwstBetrag7 || null,
    mwst_satz_19: data.mwstSatz19 || null,
    mwst_betrag_19: data.mwstBetrag19 || null,
    zahlungsmethode: data.zahlungsmethode || null,
    eigene_beleg_nummer: data.eigeneBelegNummer || null,
    kontierungskonto: data.kontierungskonto || null,
    steuerkategorie: data.steuerkategorie || null,
    kontierung_begruendung: data.kontierungBegruendung || null,
    soll_konto: data.sollKonto || null,
    haben_konto: data.habenKonto || null,
    zahlungs_datum: data.zahlungsDatum || null,
    zahlungs_status: data.zahlungsStatus || null,
    aufbewahrungs_ort: data.aufbewahrungsOrt || null,
    rechnungs_empfaenger: data.rechnungsEmpfaenger || null,
    kleinbetrag: data.kleinbetrag || false,
    vorsteuerabzug: data.vorsteuerabzug || false,
    reverse_charge: data.reverseCharge || false,
    privatanteil: data.privatanteil || false,
    ocr_score: data.ocr_score || null,
    ocr_rationale: data.ocr_rationale || null,
  };
}

// Convert database format to extracted data
function dbToBeleg(beleg: Beleg): Partial<ExtractedData> {
  return {
    documentType: beleg.document_type || undefined,
    belegDatum: beleg.beleg_datum || '',
    belegNummerLieferant: beleg.belegnummer_lieferant || '',
    lieferantName: beleg.lieferant_name || '',
    lieferantAdresse: beleg.lieferant_adresse || '',
    steuernummer: beleg.steuernummer || '',
    nettoBetrag: beleg.netto_betrag || 0,
    bruttoBetrag: beleg.brutto_betrag || 0,
    mwstSatz0: beleg.mwst_satz_0 || undefined,
    mwstBetrag0: beleg.mwst_betrag_0 || undefined,
    mwstSatz7: beleg.mwst_satz_7 || undefined,
    mwstBetrag7: beleg.mwst_betrag_7 || undefined,
    mwstSatz19: beleg.mwst_satz_19 || undefined,
    mwstBetrag19: beleg.mwst_betrag_19 || undefined,
    zahlungsmethode: beleg.zahlungsmethode || '',
    eigeneBelegNummer: beleg.eigene_beleg_nummer || '',
    kontierungskonto: beleg.kontierungskonto || undefined,
    steuerkategorie: beleg.steuerkategorie || undefined,
    kontierungBegruendung: beleg.kontierung_begruendung || undefined,
    sollKonto: beleg.soll_konto || '',
    habenKonto: beleg.haben_konto || '',
    zahlungsDatum: beleg.zahlungs_datum || '',
    zahlungsStatus: beleg.zahlungs_status || '',
    aufbewahrungsOrt: beleg.aufbewahrungs_ort || '',
    rechnungsEmpfaenger: beleg.rechnungs_empfaenger || '',
    kleinbetrag: beleg.kleinbetrag || false,
    vorsteuerabzug: beleg.vorsteuerabzug || false,
    reverseCharge: beleg.reverse_charge || false,
    privatanteil: beleg.privatanteil || false,
    ocr_score: beleg.ocr_score || undefined,
    ocr_rationale: beleg.ocr_rationale || undefined,
  };
}

// Belege Service
export const belegeService = {
  // Get all documents with optional filtering
  async getAll(options?: {
    status?: DocumentStatus;
    fromDate?: string;
    toDate?: string;
    lieferant?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Beleg[]; count: number }> {
    let query = supabase
      .from('belege')
      .select('*', { count: 'exact' })
      .order('uploaded_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.fromDate) {
      query = query.gte('beleg_datum', options.fromDate);
    }
    if (options?.toDate) {
      query = query.lte('beleg_datum', options.toDate);
    }
    if (options?.lieferant) {
      query = query.ilike('lieferant_name', `%${options.lieferant}%`);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching belege:', error);
      throw error;
    }

    return { data: data as Beleg[], count: count || 0 };
  },

  // Get single document by ID
  async getById(id: string): Promise<Beleg | null> {
    const { data, error } = await supabase
      .from('belege')
      .select('*, positionen(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching beleg:', error);
      throw error;
    }

    return data as Beleg;
  },

  // Create new document
  async create(data: ExtractedData, fileInfo: {
    dateiname: string;
    dateityp?: string;
    dateigroesse?: number;
    file_hash?: string;
    gitlab_storage_url?: string;
  }): Promise<Beleg> {
    const belegData = belegToDb(data, fileInfo);

    const { data: beleg, error } = await supabase
      .from('belege')
      .insert(belegData)
      .select()
      .single();

    if (error) {
      console.error('Error creating beleg:', error);
      throw error;
    }

    // Create line items if present
    if (data.lineItems && data.lineItems.length > 0) {
      await this.createPositionen(beleg.id, data.lineItems);
    }

    return beleg as Beleg;
  },

  // Update document
  async update(id: string, data: Partial<ExtractedData>): Promise<Beleg> {
    // Build update object with only defined fields
    const updateData: Partial<Beleg> = {};

    if (data.documentType !== undefined) updateData.document_type = data.documentType;
    if (data.belegDatum !== undefined) updateData.beleg_datum = data.belegDatum;
    if (data.belegNummerLieferant !== undefined) updateData.belegnummer_lieferant = data.belegNummerLieferant;
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
    if (data.kontierungBegruendung !== undefined) updateData.kontierung_begruendung = data.kontierungBegruendung;
    if (data.sollKonto !== undefined) updateData.soll_konto = data.sollKonto;
    if (data.habenKonto !== undefined) updateData.haben_konto = data.habenKonto;
    if (data.zahlungsDatum !== undefined) updateData.zahlungs_datum = data.zahlungsDatum;
    if (data.zahlungsStatus !== undefined) updateData.zahlungs_status = data.zahlungsStatus;
    if (data.aufbewahrungsOrt !== undefined) updateData.aufbewahrungs_ort = data.aufbewahrungsOrt;
    if (data.rechnungsEmpfaenger !== undefined) updateData.rechnungs_empfaenger = data.rechnungsEmpfaenger;
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

    if (error) {
      console.error('Error updating beleg:', error);
      throw error;
    }

    // Update line items if present
    if (data.lineItems !== undefined) {
      await this.updatePositionen(id, data.lineItems);
    }

    return beleg as Beleg;
  },

  // Update status
  async updateStatus(id: string, status: DocumentStatus, error?: string): Promise<Beleg> {
    const updateData: Partial<Beleg> = {
      status,
      processed_at: new Date().toISOString(),
    };

    if (error) {
      updateData.fehler = error;
    }

    const { data: beleg, error: updateError } = await supabase
      .from('belege')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating beleg status:', updateError);
      throw updateError;
    }

    return beleg as Beleg;
  },

  // Delete document
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('belege')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting beleg:', error);
      throw error;
    }
  },

  // Check for duplicate by file hash
  async findByFileHash(fileHash: string): Promise<Beleg | null> {
    const { data, error } = await supabase
      .from('belege')
      .select('*')
      .eq('file_hash', fileHash)
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error checking for duplicate:', error);
      throw error;
    }

    return data as Beleg;
  },

  // Check for semantic duplicates (same invoice number + supplier + amount)
  async findSemanticDuplicates(belegNummer: string, lieferant: string, betrag: number): Promise<Beleg[]> {
    const { data, error } = await supabase
      .from('belege')
      .select('*')
      .eq('belegnummer_lieferant', belegNummer)
      .eq('lieferant_name', lieferant)
      .eq('brutto_betrag', betrag)
      .neq('status', 'DUPLICATE')
      .order('uploaded_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error checking for semantic duplicates:', error);
      throw error;
    }

    return data as Beleg[];
  },

  // Create positionen (line items)
  async createPositionen(belegId: string, positionen: ExtractedData['lineItems']): Promise<void> {
    const positionData = positionen.map((pos, index) => ({
      beleg_id: belegId,
      position_index: index,
      beschreibung: pos.description || null,
      menge: pos.quantity || null,
      einzelpreis: null,
      gesamtbetrag: pos.amount || null,
      mwst_satz: null,
      konto: null,
      steuerkategorie: null,
    }));

    const { error } = await supabase
      .from('beleg_positionen')
      .insert(positionData);

    if (error) {
      console.error('Error creating positionen:', error);
      throw error;
    }
  },

  // Delete positionen
  async deletePositionen(belegId: string): Promise<void> {
    const { error } = await supabase
      .from('beleg_positionen')
      .delete()
      .eq('beleg_id', belegId);

    if (error) {
      console.error('Error deleting positionen:', error);
      throw error;
    }
  },

  // Update positionen
  async updatePositionen(belegId: string, positionen: ExtractedData['lineItems']): Promise<void> {
    // Delete existing
    await this.deletePositionen(belegId);

    // Create new
    if (positionen.length > 0) {
      await this.createPositionen(belegId, positionen);
    }
  },

  // Get statistics
  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    totalAmount: number;
  }> {
    const { data: allData, error } = await supabase
      .from('belege')
      .select('status, brutto_betrag');

    if (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }

    const byStatus: Record<string, number> = {};
    let totalAmount = 0;

    for (const row of allData) {
      byStatus[row.status] = (byStatus[row.status] || 0) + 1;
      if (row.brutto_betrag) {
        totalAmount += row.brutto_betrag;
      }
    }

    return {
      total: allData.length,
      byStatus,
      totalAmount,
    };
  },
};

// Steuerkategorien Service
export const steuerkategorienService = {
  async getAll(): Promise<Steuerkategorie[]> {
    const { data, error } = await supabase
      .from('steuerkategorien')
      .select('*')
      .eq('aktiv', true)
      .order('label');

    if (error) {
      console.error('Error fetching steuerkategorien:', error);
      throw error;
    }

    return data as Steuerkategorie[];
  },

  async create(kategorie: Omit<Steuerkategorie, 'id'>): Promise<Steuerkategorie> {
    const { data, error } = await supabase
      .from('steuerkategorien')
      .insert(kategorie)
      .select()
      .single();

    if (error) {
      console.error('Error creating steuerkategorie:', error);
      throw error;
    }

    return data as Steuerkategorie;
  },

  async seedDefault(): Promise<void> {
    const defaultCategories = [
      { wert: '19_pv', label: '19% Vorsteuer', ust_satz: 0.19, vorsteuer: true, reverse_charge: false, aktiv: true },
      { wert: '7_pv', label: '7% Vorsteuer', ust_satz: 0.07, vorsteuer: true, reverse_charge: false, aktiv: true },
      { wert: '0_pv', label: '0% PV (Steuerfrei)', ust_satz: 0, vorsteuer: true, reverse_charge: false, aktiv: true },
      { wert: '0_igl_rc', label: '0% IGL / Reverse Charge', ust_satz: 0, vorsteuer: false, reverse_charge: true, aktiv: true },
      { wert: 'steuerfrei_kn', label: 'Steuerfrei (Kleinunternehmer)', ust_satz: 0, vorsteuer: false, reverse_charge: false, aktiv: true },
      { wert: 'keine_pv', label: 'Keine Vorsteuer (Privatanteil)', ust_satz: 0, vorsteuer: false, reverse_charge: false, aktiv: true },
    ];

    for (const cat of defaultCategories) {
      const { error } = await supabase
        .from('steuerkategorien')
        .upsert(cat, { onConflict: 'wert' });

      if (error) {
        console.error('Error seeding steuerkategorie:', error);
      }
    }
  },
};

// Kontierungskonten Service
export const kontierungskontenService = {
  async getAll(): Promise<Kontierungskonto[]> {
    const { data, error } = await supabase
      .from('kontierungskonten')
      .select('*')
      .eq('aktiv', true)
      .order('konto_nr');

    if (error) {
      console.error('Error fetching kontierungskonten:', error);
      throw error;
    }

    return data as Kontierungskonto[];
  },

  async create(konto: Omit<Kontierungskonto, 'id'>): Promise<Kontierungskonto> {
    const { data, error } = await supabase
      .from('kontierungskonten')
      .insert(konto)
      .select()
      .single();

    if (error) {
      console.error('Error creating kontierungskonto:', error);
      throw error;
    }

    return data as Kontierungskonto;
  },

  async seedDefault(): Promise<void> {
    const defaultKonten = [
      { konto_nr: '3400', name: 'Wareneingang (SKR03)', steuerkategorie: '19_pv', aktiv: true },
      { konto_nr: '3100', name: 'Fremdleistung (SKR03)', steuerkategorie: '19_pv', aktiv: true },
      { konto_nr: '4964', name: 'Software (SKR03)', steuerkategorie: '19_pv', aktiv: true },
      { konto_nr: '4920', name: 'Internet/Telefon (SKR03)', steuerkategorie: '19_pv', aktiv: true },
      { konto_nr: '4210', name: 'Miete (SKR03)', steuerkategorie: '19_pv', aktiv: true },
      { konto_nr: '4900', name: 'Sonstiges (SKR03)', steuerkategorie: '19_pv', aktiv: true },
      { konto_nr: '1800', name: 'Privatentnahme (SKR03)', steuerkategorie: 'keine_pv', aktiv: true },
      { konto_nr: '6000', name: 'Buchungskonto 6000 (SKR03)', steuerkategorie: null, aktiv: true },
      { konto_nr: '1400', name: 'Vorsteuer 19% (SKR03)', steuerkategorie: '19_pv', aktiv: true },
      { konto_nr: '1401', name: 'Vorsteuer 7% (SKR03)', steuerkategorie: '7_pv', aktiv: true },
      { konto_nr: '1571', name: 'Abziehbare Vorsteuer (SKR03)', steuerkategorie: null, aktiv: true },
      { konto_nr: '1600', name: 'Forderungen aus LL (SKR03)', steuerkategorie: null, aktiv: true },
      { konto_nr: '1700', name: 'Sonstige Vermögensgegenstände (SKR03)', steuerkategorie: null, aktiv: true },
      { konto_nr: '1800', name: 'Kasse (SKR03)', steuerkategorie: null, aktiv: true },
      { konto_nr: '2100', name: 'Verbindlichkeiten aus LL (SKR03)', steuerkategorie: null, aktiv: true },
      { konto_nr: '2600', name: 'Umsatzsteuer (SKR03)', steuerkategorie: null, aktiv: true },
      { konto_nr: '2610', name: 'Umsatzsteuer 19% (SKR03)', steuerkategorie: null, aktiv: true },
      { konto_nr: '2611', name: 'Umsatzsteuer 7% (SKR03)', steuerkategorie: null, aktiv: true },
    ];

    for (const konto of defaultKonten) {
      const { error } = await supabase
        .from('kontierungskonten')
        .upsert(konto, { onConflict: 'konto_nr' });

      if (error) {
        console.error('Error seeding kontierungskonto:', error);
      }
    }
  },
};

// LieferantenRegeln Service
export const lieferantenRegelnService = {
  async getAll(): Promise<LieferantenRegel[]> {
    const { data, error } = await supabase
      .from('lieferanten_regeln')
      .select('*')
      .eq('aktiv', true)
      .order('prioritaet', { ascending: true });

    if (error) {
      console.error('Error fetching lieferanten_regeln:', error);
      throw error;
    }

    return data as LieferantenRegel[];
  },

  async create(regel: Omit<LieferantenRegel, 'id' | 'created_at'>): Promise<LieferantenRegel> {
    const { data, error } = await supabase
      .from('lieferanten_regeln')
      .insert(regel)
      .select()
      .single();

    if (error) {
      console.error('Error creating lieferanten_regel:', error);
      throw error;
    }

    return data as LieferantenRegel;
  },

  async findMatching(lieferantName: string): Promise<LieferantenRegel | null> {
    const { data, error } = await supabase
      .from('lieferanten_regeln')
      .select('*')
      .eq('aktiv', true)
      .ilike('lieferant_name_pattern', `%${lieferantName}%`)
      .order('prioritaet', { ascending: true })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error finding matching regel:', error);
      throw error;
    }

    return data as LieferantenRegel;
  },
};

// Einstellungen Service
export const einstellungenService = {
  async get(schluessel: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('einstellungen')
      .select('wert')
      .eq('schluessel', schluessel)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching einstellung:', error);
      throw error;
    }

    return data?.wert || null;
  },

  async set(schluessel: string, wert: string, typ: string = 'string'): Promise<Einstellung> {
    const { data, error } = await supabase
      .from('einstellungen')
      .upsert({ schluessel, wert, typ }, { onConflict: 'schluessel' })
      .select()
      .single();

    if (error) {
      console.error('Error setting einstellung:', error);
      throw error;
    }

    return data as Einstellung;
  },

  async getAll(): Promise<Einstellung[]> {
    const { data, error } = await supabase
      .from('einstellungen')
      .select('*')
      .order('schluessel');

    if (error) {
      console.error('Error fetching all einstellungen:', error);
      throw error;
    }

    return data as Einstellung[];
  },
};
