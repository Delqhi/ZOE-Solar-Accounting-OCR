import { getSupabase } from './supabaseClient';
import {
  DocumentRecord,
  DocumentStatus,
  ExtractedData,
  DocumentTypeClassification,
  RelatedDocumentMatch,
  LineItem
} from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface DocumentQueryOptions {
  type?: DocumentTypeClassification;
  status?: DocumentStatus;
  vendor?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  limit?: number;
  offset?: number;
}

class SupabaseDocumentService {
  private tableName = 'documents';

  // CRUD Operations
  async createDocument(doc: Partial<DocumentRecord>): Promise<DocumentRecord> {
    const client = getSupabase();

    const { data, error } = await client
      .from(this.tableName)
      .insert(this.toDbFormat(doc))
      .select()
      .single();

    if (error) throw error;
    return this.fromDbFormat(data);
  }

  async updateDocument(id: string, updates: Partial<DocumentRecord>): Promise<DocumentRecord> {
    const client = getSupabase();

    const { data, error } = await client
      .from(this.tableName)
      .update(this.toDbFormat(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.fromDbFormat(data);
  }

  async deleteDocument(id: string): Promise<void> {
    const client = getSupabase();
    const { error } = await client
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getDocument(id: string): Promise<DocumentRecord | null> {
    const client = getSupabase();

    const { data, error } = await client
      .from(this.tableName)
      .select('*, document_line_items(*)')
      .eq('id', id)
      .single();

    if (error) return null;
    return this.fromDbFormat(data);
  }

  async getAllDocuments(options?: DocumentQueryOptions): Promise<DocumentRecord[]> {
    const client = getSupabase();

    let query = client
      .from(this.tableName)
      .select('*, document_line_items(*)')
      .order('created_at', { ascending: false });

    if (options?.type) {
      query = query.eq('document_type', options.type);
    }
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.vendor) {
      query = query.ilike('lieferant_name', `%${options.vendor}%`);
    }
    if (options?.startDate) {
      query = query.gte('beleg_datum', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('beleg_datum', options.endDate);
    }
    if (options?.minAmount) {
      query = query.gte('brutto_betrag', options.minAmount);
    }
    if (options?.maxAmount) {
      query = query.lte('brutto_betrag', options.maxAmount);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(d => this.fromDbFormat(d));
  }

  // Batch operations for migration
  async bulkCreateDocuments(docs: Partial<DocumentRecord>[]): Promise<DocumentRecord[]> {
    const client = getSupabase();

    const formattedDocs = docs.map(doc => this.toDbFormat(doc));

    const { data, error } = await client
      .from(this.tableName)
      .insert(formattedDocs)
      .select();

    if (error) throw error;
    return (data || []).map(d => this.fromDbFormat(d));
  }

  // Duplicate detection
  async findDuplicateByHash(fileHash: string): Promise<DocumentRecord | null> {
    const client = getSupabase();

    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('file_hash', fileHash)
      .single();

    if (error) return null;
    return this.fromDbFormat(data);
  }

  // AI-powered related document discovery
  async findRelatedDocuments(
    documentId: string,
    userId: string
  ): Promise<RelatedDocumentMatch[]> {
    const client = getSupabase();

    // Call the database function
    const { data, error } = await client
      .rpc('find_related_documents', {
        p_document_id: documentId,
        p_user_id: userId,
        p_date_tolerance_days: 7,
        p_amount_tolerance_percent: 0.05
      });

    if (error) throw error;

    return (data || []).map(match => ({
      documentId: match.related_doc_id,
      matchScore: match.match_score,
      matchCriteria: JSON.parse(match.match_criteria)
    }));
  }

  // Create document relationship
  async createDocumentRelationship(
    sourceId: string,
    targetId: string,
    matchScore: number,
    matchCriteria: Record<string, boolean>
  ): Promise<void> {
    const client = getSupabase();

    const { error } = await client
      .from('document_relationships')
      .insert({
        source_document_id: sourceId,
        target_document_id: targetId,
        match_score: matchScore,
        match_criteria: JSON.stringify(matchCriteria)
      });

    if (error) throw error;
  }

  // Get related documents for a document
  async getRelatedDocuments(documentId: string): Promise<DocumentRecord[]> {
    const client = getSupabase();

    const { data, error } = await client
      .from('document_relationships')
      .select(`
        target_document_id,
        match_score,
        match_criteria,
        target:documents!document_relationships_target_document_id_fkey(*)
      `)
      .eq('source_document_id', documentId)
      .eq('confirmed', true);

    if (error) throw error;

    return (data || []).map(d => this.fromDbFormat(d.target));
  }

  // Save line items for a document
  async saveLineItems(documentId: string, lineItems: LineItem[]): Promise<void> {
    const client = getSupabase();

    // Delete existing line items
    await client
      .from('document_line_items')
      .delete()
      .eq('document_id', documentId);

    // Insert new line items
    const formattedItems = lineItems.map((item, index) => ({
      document_id: documentId,
      line_index: index,
      description: item.description,
      amount: item.amount
    }));

    if (formattedItems.length > 0) {
      const { error } = await client
        .from('document_line_items')
        .insert(formattedItems);

      if (error) throw error;
    }
  }

  // Helper: Convert to DB format
  private toDbFormat(doc: Partial<DocumentRecord>): Record<string, unknown> {
    return {
      id: doc.id || uuidv4(),
      file_name: doc.fileName,
      file_type: doc.fileType,
      file_hash: doc.fileHash,
      storage_path: doc.previewUrl,

      // Document type
      document_type: doc.data?.documentType,
      document_type_confidence: doc.data?.documentTypeConfidence,

      // OCR data
      beleg_datum: doc.data?.belegDatum,
      beleg_nummer_lieferant: doc.data?.belegNummerLieferant,
      lieferant_name: doc.data?.lieferantName,
      lieferant_adresse: doc.data?.lieferantAdresse,
      steuernummer: doc.data?.steuernummer,

      // Financial
      netto_betrag: doc.data?.nettoBetrag,
      mwst_satz_0: doc.data?.mwstSatz0,
      mwst_betrag_0: doc.data?.mwstBetrag0,
      mwst_satz_7: doc.data?.mwstSatz7,
      mwst_betrag_7: doc.data?.mwstBetrag7,
      mwst_satz_19: doc.data?.mwstSatz19,
      mwst_betrag_19: doc.data?.mwstBetrag19,
      brutto_betrag: doc.data?.bruttoBetrag,
      zahlungsmethode: doc.data?.zahlungsmethode,

      // Booking
      steuerkategorie: doc.data?.steuerkategorie,
      kontierungskonto: doc.data?.kontierungskonto,
      konto_skr03: doc.data?.konto_skr03,
      soll_konto: doc.data?.sollKonto,
      haben_konto: doc.data?.habenKonto,
      kontierung_begruendung: doc.data?.kontierungBegruendung,

      // Organization
      eigene_beleg_nummer: doc.data?.eigeneBelegNummer,
      aufbewahrungs_ort: doc.data?.aufbewahrungsOrt,
      rechnungs_empfaenger: doc.data?.rechnungsEmpfaenger,
      zahlungs_datum: doc.data?.zahlungsDatum,
      zahlungs_status: doc.data?.zahlungsStatus,

      // Status
      status: doc.status,
      ocr_score: doc.data?.ocr_score,
      ocr_rationale: doc.data?.ocr_rationale,
      text_content: doc.data?.textContent || doc.data?.beschreibung,
      beschreibung: doc.data?.beschreibung,

      // Audit
      uploaded_at: doc.uploadDate,
      created_at: new Date().toISOString()
    };
  }

  // Helper: Convert from DB format
  private fromDbFormat(data: Record<string, unknown>): DocumentRecord {
    const d = data as any;

    return {
      id: d.id,
      fileName: d.file_name,
      fileType: d.file_type,
      uploadDate: d.uploaded_at || d.created_at,
      status: d.status as DocumentStatus,
      previewUrl: d.storage_path || d.text_content,
      fileHash: d.file_hash,

      data: d.beleg_datum ? {
        // Document type
        documentType: d.document_type as DocumentTypeClassification,
        documentTypeConfidence: d.document_type_confidence,
        relatedDocumentIds: d.related_document_ids,
        relatedDocumentMatches: d.related_document_matches,

        // Basic fields
        belegDatum: d.beleg_datum,
        belegNummerLieferant: d.beleg_nummer_lieferant,
        lieferantName: d.lieferant_name,
        lieferantAdresse: d.lieferant_adresse,
        steuernummer: d.steuernummer,

        // Financial
        nettoBetrag: d.netto_betrag,
        mwstSatz0: d.mwst_satz_0,
        mwstBetrag0: d.mwst_betrag_0,
        mwstSatz7: d.mwst_satz_7,
        mwstBetrag7: d.mwst_betrag_7,
        mwstSatz19: d.mwst_satz_19,
        mwstBetrag19: d.mwst_betrag_19,
        bruttoBetrag: d.brutto_betrag,
        zahlungsmethode: d.zahlungsmethode,

        // Line items
        lineItems: (d.document_line_items || []).map((item: any) => ({
          description: item.description,
          amount: item.amount
        })),

        // Booking
        steuerkategorie: d.steuerkategorie,
        kontierungskonto: d.kontierungskonto,
        kontogruppe: d.konto_skr03,
        konto_skr03: d.konto_skr03,
        ust_typ: d.ust_typ || '',
        sollKonto: d.soll_konto,
        habenKonto: d.haben_konto,
        steuerKategorie: d.steuerkategorie,
        kontierungBegruendung: d.kontierung_begruendung,

        // Organization
        eigeneBelegNummer: d.eigene_beleg_nummer,
        aufbewahrungsOrt: d.aufbewahrungs_ort,
        rechnungsEmpfaenger: d.rechnungs_empfaenger,
        zahlungsDatum: d.zahlungs_datum,
        zahlungsStatus: d.zahlungs_status,

        // Flags
        kleinbetrag: false,
        vorsteuerabzug: false,
        reverseCharge: false,
        privatanteil: false,

        // Content
        beschreibung: d.beschreibung || d.text_content,
        textContent: d.text_content,

        // Quality
        ocr_score: d.ocr_score,
        ocr_rationale: d.ocr_rationale
      } : null,

      attachments: d.attachments,
      duplicateOfId: d.duplicate_of_id,
      duplicateConfidence: d.duplicate_confidence,
      duplicateReason: d.duplicate_reason,
      relatedDocumentIds: d.related_document_ids,
      isOrphaned: d.is_orphaned,
      queueStatus: d.queue_status
    };
  }
}

export const documentService = new SupabaseDocumentService();
