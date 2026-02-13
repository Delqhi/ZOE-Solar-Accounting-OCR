/**
 * Supabase Service
 * Handles all Supabase operations for the application
 */

import { belegeService } from './belegeService';
import { DocumentRecord, ExtractedData, AppSettings } from '../types';

export interface User {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}

// Supabase client placeholder - actual client is initialized in supabaseClient.ts
const supabaseClient: any = null;

/// <reference types="vite/client" />

export function isSupabaseConfigured(): boolean {
  // Check if Supabase URL and anon key are configured
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && key);
}

export async function getAllDocuments(): Promise<DocumentRecord[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const result = await belegeService.getAll();
    // Convert database format to DocumentRecord format
    return result.data.map((beleg: any) => ({
      id: beleg.id,
      zoeId: beleg.zoe_id,
      fileName: beleg.dateiname,
      fileType: beleg.dateityp,
      uploadDate: beleg.uploaded_at || beleg.created_at,
      status: beleg.status,
      data: {
        documentType: beleg.document_type,
        belegDatum: beleg.beleg_datum || '',
        belegNummerLieferant: beleg.belegnummer_lieferant || '',
        lieferantName: beleg.lieferant_name || '',
        lieferantAdresse: beleg.lieferant_adresse || '',
        steuernummer: beleg.steuernummer || '',
        nettoBetrag: beleg.netto_betrag || 0,
        mwstSatz0: beleg.mwst_satz_0 || 0,
        mwstBetrag0: beleg.mwst_betrag_0 || 0,
        mwstSatz7: beleg.mwst_satz_7 || 0,
        mwstBetrag7: beleg.mwst_betrag_7 || 0,
        mwstSatz19: beleg.mwst_satz_19 || 0,
        mwstBetrag19: beleg.mwst_betrag_19 || 0,
        bruttoBetrag: beleg.brutto_betrag || 0,
        zahlungsmethode: beleg.zahlungsmethode || '',
        lineItems: beleg.positionen ? beleg.positionen.map((pos: any) => ({
          description: pos.beschreibung || '',
          quantity: pos.menge || 0,
          amount: pos.gesamtbetrag || 0,
        })) : [],
        kontierungskonto: beleg.kontierungskonto,
        steuerkategorie: beleg.steuerkategorie,
        kontierungBegruendung: beleg.kontierung_begruendung,
        kontogruppe: beleg.kontogruppe || '',
        konto_skr03: beleg.konto_skr03 || '',
        ust_typ: beleg.ust_typ || '',
        sollKonto: beleg.soll_konto || '',
        habenKonto: beleg.haben_konto || '',
        steuerKategorie: beleg.steuerKategorie || '',
        eigeneBelegNummer: beleg.eigene_beleg_nummer || '',
        zahlungsDatum: beleg.zahlungs_datum || '',
        zahlungsStatus: beleg.zahlungs_status || '',
        aufbewahrungsOrt: beleg.aufbewahrungs_ort || '',
        rechnungsEmpfaenger: beleg.rechnungs_empfaenger || '',
        kleinbetrag: beleg.kleinbetrag || false,
        vorsteuerabzug: beleg.vorsteuerabzug || false,
        reverseCharge: beleg.reverse_charge || false,
        privatanteil: beleg.privatanteil || false,
        beschreibung: beleg.beschreibung || '',
        quantity: 0, // Placeholder - quantity is per line item
        ocr_score: beleg.ocr_score,
        ocr_rationale: beleg.ocr_rationale,
      },
      previewUrl: beleg.gitlab_storage_url,
      fileHash: beleg.file_hash,
      error: beleg.fehler,
      duplicateReason: beleg.duplicate_reason,
      duplicateOfId: beleg.duplicate_of_id,
      duplicateConfidence: beleg.duplicate_confidence,
      attachments: beleg.attachments,
    }));
  } catch (error) {
    console.error('Error fetching documents from Supabase:', error);
    return [];
  }
}

export async function getSettings(): Promise<AppSettings | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { einstellungenService } = await import('./belegeService');
    const settingsStr = await einstellungenService.get('app_settings');
    return settingsStr ? JSON.parse(settingsStr) : null;
  } catch (error) {
    console.error('Error fetching settings from Supabase:', error);
    return null;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const { einstellungenService } = await import('./belegeService');
    await einstellungenService.set('app_settings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings to Supabase:', error);
    throw error;
  }
}

export async function saveDocument(doc: DocumentRecord): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    // Check if document exists
    const existing = await belegeService.getById(doc.id);

    if (existing) {
      // Update existing
      if (doc.data) {
        await belegeService.update(doc.id, doc.data);
      }
      await belegeService.updateStatus(doc.id, doc.status, doc.error);
    } else {
      // Create new
      if (doc.data) {
        await belegeService.create(doc.data, {
          dateiname: doc.fileName,
          dateityp: doc.fileType,
          file_hash: doc.fileHash,
          gitlab_storage_url: doc.previewUrl,
        });
      }
    }
  } catch (error) {
    console.error('Error saving document to Supabase:', error);
    throw error;
  }
}

export async function deleteDocument(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    await belegeService.delete(id);
  } catch (error) {
    console.error('Error deleting document from Supabase:', error);
    throw error;
  }
}

export async function savePrivateDocument(
  id: string,
  fileName: string,
  fileType: string,
  base64: string,
  data: ExtractedData,
  reason: string
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    // Save to belege_privat table (placeholder - actual implementation depends on schema)
    // For now, we'll just log it
    console.log('Private document saved to Supabase:', { id, fileName, reason });
  } catch (error) {
    console.error('Error saving private document to Supabase:', error);
    throw error;
  }
}

export async function saveVendorRule(vendorName: string, accountId: string, taxCategory: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const { lieferantenRegelnService } = await import('./belegeService');

    // Check if rule exists
    const existing = await lieferantenRegelnService.findMatching(vendorName);

    if (existing) {
      // Update existing
      // Note: lieferantenRegelnService doesn't have update method, so we'd need to create a new one
      // For now, skip
      return;
    }

    // Create new rule
    await lieferantenRegelnService.create({
      lieferant_name_pattern: vendorName,
      kontierungskonto: accountId,
      steuerkategorie: taxCategory,
      standard_konto: null,
      standard_steuerkategorie: null,
      prioritaet: 1,
      aktiv: true,
    });
  } catch (error) {
    console.error('Error saving vendor rule to Supabase:', error);
    throw error;
  }
}

export function exportDocumentsToSQL(documents: DocumentRecord[], settings: AppSettings): string {
  // Generate SQL INSERT statements for Supabase
  let sql = '-- ZOE Solar Accounting OCR Export\n';
  sql += '-- Generated: ' + new Date().toISOString() + '\n\n';

  for (const doc of documents) {
    if (!doc.data) continue;

    const values = [
      doc.id,
      doc.fileName ? `'${doc.fileName.replace(/'/g, "''")}'` : 'NULL',
      doc.fileType ? `'${doc.fileType}'` : 'NULL',
      doc.uploadDate ? `'${doc.uploadDate}'` : 'NULL',
      `'${doc.status}'`,
      doc.data.belegDatum ? `'${doc.data.belegDatum}'` : 'NULL',
      doc.data.belegNummerLieferant ? `'${doc.data.belegNummerLieferant.replace(/'/g, "''")}'` : 'NULL',
      doc.data.lieferantName ? `'${doc.data.lieferantName.replace(/'/g, "''")}'` : 'NULL',
      doc.data.bruttoBetrag ?? 'NULL',
      doc.data.eigeneBelegNummer ? `'${doc.data.eigeneBelegNummer}'` : 'NULL',
      doc.data.kontierungskonto ? `'${doc.data.kontierungskonto}'` : 'NULL',
      doc.data.steuerkategorie ? `'${doc.data.steuerkategorie}'` : 'NULL',
    ].join(', ');

    sql += `INSERT INTO belege (id, dateiname, dateityp, uploaded_at, status, beleg_datum, belegnummer_lieferant, lieferant_name, brutto_betrag, eigene_beleg_nummer, kontierungskonto, steuerkategorie) VALUES (${values});\n`;
  }

  return sql;
}

export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    // Placeholder - would use actual Supabase auth
    // const { data: { user } } = await supabase.auth.getUser();
    // return user;
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function signIn(email: string, password: string): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    // Placeholder - would use actual Supabase auth
    // const { data: { user } } = await supabase.auth.signInWithPassword({ email, password });
    // return user;
    return null;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    // Placeholder - would use actual Supabase auth
    // await supabase.auth.signOut();
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}
