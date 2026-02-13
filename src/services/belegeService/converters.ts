/**
 * Belege Service - Converters
 * Data conversion utilities between app and database formats
 */

import { Beleg } from '../supabaseClient';
import { ExtractedData } from '../../types';

export function belegToDb(
  data: ExtractedData,
  fileInfo: {
    dateiname: string;
    dateityp?: string;
    dateigroesse?: number;
    file_hash?: string;
    gitlab_storage_url?: string;
  }
): Partial<Beleg> {
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

export function dbToBeleg(beleg: Beleg): Partial<ExtractedData> {
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
