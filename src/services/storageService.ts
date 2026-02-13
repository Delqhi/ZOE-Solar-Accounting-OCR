/**
 * Storage Service
 * Facade for Supabase operations - provides IndexedDB-like interface
 */

import {
  belegeService,
  steuerkategorienService,
  kontierungskontenService,
  lieferantenRegelnService,
  einstellungenService
} from './belegeService';

import { ExtractedData, DocumentRecord, VendorRule } from '../types';

export async function getAllDocuments(): Promise<DocumentRecord[]> {
  const result = await belegeService.getAll();
  // Convert Beleg[] to DocumentRecord[]
  return result.data.map((beleg: any) => ({
    id: beleg.id,
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
      lineItems: [],
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
  } as DocumentRecord));
}

export async function saveDocument(data: Partial<ExtractedData> & { id?: string }) {
  // Transform to expected format
  const doc = {
    ...data,
    beleg_datum: data.belegDatum,
    lieferant_name: data.lieferantName,
    brutto_betrag: data.bruttoBetrag,
  } as any;

  if (doc.id) {
    return await belegeService.update(doc.id, doc);
  }
  return await belegeService.create(doc, {
    dateiname: doc.fileName || 'unknown',
    dateityp: doc.fileType,
    dateigroesse: doc.fileSize,
    file_hash: doc.fileHash,
    gitlab_storage_url: doc.gitlabStorageUrl
  });
}

export async function deleteDocument(id: string) {
  return await belegeService.delete(id);
}

export async function saveSettings(settings: AppSettings) {
  return await einstellungenService.set('app_settings', JSON.stringify(settings));
}

export async function getSettings() {
  const result = await einstellungenService.get('app_settings');
  return result ? JSON.parse(result) : null;
}

export async function getVendorRule(vendorName: string): Promise<VendorRule | null> {
  const rules = await lieferantenRegelnService.getAll();
  const rule = rules.find(r => r.lieferant_name_pattern === vendorName);
  if (!rule) return null;

  return {
    vendorName: rule.lieferant_name_pattern,
    accountId: rule.kontierungskonto || rule.standard_konto || undefined,
    taxCategoryValue: rule.steuerkategorie || rule.standard_steuerkategorie || undefined,
    lastUpdated: rule.created_at,
    useCount: rule.prioritaet,
  };
}

export async function saveVendorRule(vendorName: string, konto: string, kategorie: string) {
  const existing = await getVendorRule(vendorName);
  if (existing) {
    return await lieferantenRegelnService.create({
      lieferant_name_pattern: vendorName,
      kontierungskonto: konto,
      steuerkategorie: kategorie,
      standard_konto: null,
      standard_steuerkategorie: null,
      prioritaet: 1,
      aktiv: true
    });
  }
  return await lieferantenRegelnService.create({
    lieferant_name_pattern: vendorName,
    kontierungskonto: konto,
    steuerkategorie: kategorie,
    standard_konto: null,
    standard_steuerkategorie: null,
    prioritaet: 1,
    aktiv: true
  });
}

export async function getAllDocumentsAndSettings() {
  const [docs, settings] = await Promise.all([
    getAllDocuments(),
    getSettings()
  ]);
  return { docs, settings };
}
