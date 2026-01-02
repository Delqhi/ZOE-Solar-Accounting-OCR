import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { DocumentRecord, DocumentStatus, ExtractedData } from '../types';

// ============================================
// Environment Configuration
// ============================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// ============================================
// Type Definitions for Supabase Data
// ============================================

interface SupabaseDocument {
  id: string;
  zoe_reference: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_hash: string;
  source_type: string;
  source_id: string;
  gitlab_file_path: string;
  gitlab_project_id: string;
  gitlab_commit_sha: string;
  document_type: string;
  beleg_datum: string;
  beleg_nummer_lieferant: string;
  lieferant_name: string;
  lieferant_adresse: string;
  steuernummer: string;
  netto_betrag: number;
  mwst_satz_0: number;
  mwst_betrag_0: number;
  mwst_satz_7: number;
  mwst_betrag_7: number;
  mwst_satz_19: number;
  mwst_betrag_19: number;
  brutto_betrag: number;
  zahlungsmethode: string;
  steuerkategorie: string;
  kontierungskonto: string;
  soll_konto: string;
  haben_konto: string;
  konto_skr03: string;
  status: string;
  ocr_score: number;
  ocr_rationale: string;
  reverse_charge: boolean;
  vorsteuerabzug: boolean;
  kleinbetrag: boolean;
  privatanteil: boolean;
  raw_data: ExtractedData;
  line_items: ExtractedData['lineItems'];
  created_at: string;
  updated_at: string;
}

interface PendingQueueItem {
  id: string;
  document_id: string | null;
  source_type: string;
  source_message_id: string;
  sender_email: string;
  sender_phone: string;
  preliminary_data: Record<string, unknown>;
  extracted_amount: number;
  extracted_vendor: string;
  extracted_date: string;
  notification_sent_at: string | null;
  notification_id: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_action: string | null;
  review_notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  target_user_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

interface ProcessedMessage {
  id: string;
  message_type: string;
  processing_status: string;
  document_id: string | null;
  created_at: string;
}

// ============================================
// Supabase Service Class
// ============================================

class SupabaseService {
  private client: SupabaseClient | null = null;
  private realtimeChannel: RealtimeChannel | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize the Supabase client
   */
  initialize(): void {
    if (this.isInitialized) return;

    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('[Supabase] Client initialized');
      this.isInitialized = true;
    } else {
      console.warn('[Supabase] Not configured - missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    }
  }

  /**
   * Check if Supabase is configured
   */
  isAvailable(): boolean {
    return this.client !== null && this.isInitialized;
  }

  // ============================================
  // Document Operations
  // ============================================

  /**
   * Get all documents from Supabase
   */
  async getDocuments(filters?: {
    year?: string;
    status?: string;
    source_type?: string;
  }): Promise<DocumentRecord[]> {
    if (!this.client) return [];

    let query = this.client
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.year) {
      query = query.like('zoe_reference', `${filters.year}%`);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.source_type) {
      query = query.eq('source_type', filters.source_type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Supabase] Error fetching documents:', error);
      return [];
    }

    return (data || []).map(this.mapSupabaseToDocumentRecord);
  }

  /**
   * Get a single document by ID
   */
  async getDocument(id: string): Promise<DocumentRecord | null> {
    if (!this.client) return null;

    const { data, error } = await this.client
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('[Supabase] Error fetching document:', error);
      return null;
    }

    return this.mapSupabaseToDocumentRecord(data);
  }

  /**
   * Insert a new document
   */
  async insertDocument(doc: SupabaseDocument): Promise<string | null> {
    if (!this.client) return null;

    const { data, error } = await this.client
      .from('documents')
      .insert(doc)
      .select('id')
      .single();

    if (error) {
      console.error('[Supabase] Error inserting document:', error);
      return null;
    }

    return data?.id || null;
  }

  /**
   * Update an existing document
   */
  async updateDocument(id: string, updates: Partial<SupabaseDocument>): Promise<boolean> {
    if (!this.client) return false;

    const { error } = await this.client
      .from('documents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('[Supabase] Error updating document:', error);
      return false;
    }

    return true;
  }

  /**
   * Upsert a document (insert or update)
   */
  async upsertDocument(doc: SupabaseDocument): Promise<string | null> {
    if (!this.client) return null;

    const { data, error } = await this.client
      .from('documents')
      .upsert({ ...doc, updated_at: new Date().toISOString() })
      .select('id')
      .single();

    if (error) {
      console.error('[Supabase] Error upserting document:', error);
      return null;
    }

    return data?.id || null;
  }

  /**
   * Delete a document
   */
  async deleteDocument(id: string): Promise<boolean> {
    if (!this.client) return false;

    const { error } = await this.client
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Supabase] Error deleting document:', error);
      return false;
    }

    return true;
  }

  // ============================================
  // Pending Queue Operations
  // ============================================

  /**
   * Get all pending queue items
   */
  async getPendingQueue(): Promise<PendingQueueItem[]> {
    if (!this.client) return [];

    const { data, error } = await this.client
      .from('pending_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase] Error fetching pending queue:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get a single queue item by ID
   */
  async getPendingQueueItem(id: string): Promise<PendingQueueItem | null> {
    if (!this.client) return null;

    const { data, error } = await this.client
      .from('pending_queue')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data;
  }

  /**
   * Confirm a pending queue item (move to documents)
   */
  async confirmPendingQueueItem(id: string): Promise<boolean> {
    if (!this.client) return false;

    const { error } = await this.client
      .from('pending_queue')
      .update({
        status: 'confirmed',
        reviewed_at: new Date().toISOString(),
        review_action: 'confirmed'
      })
      .eq('id', id);

    if (error) {
      console.error('[Supabase] Error confirming queue item:', error);
      return false;
    }

    return true;
  }

  /**
   * Reject a pending queue item
   */
  async rejectPendingQueueItem(id: string, notes?: string): Promise<boolean> {
    if (!this.client) return false;

    const { error } = await this.client
      .from('pending_queue')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        review_action: 'rejected',
        review_notes: notes || null
      })
      .eq('id', id);

    if (error) {
      console.error('[Supabase] Error rejecting queue item:', error);
      return false;
    }

    return true;
  }

  /**
   * Create a new pending queue entry
   */
  async createPendingQueueEntry(entry: Omit<PendingQueueItem, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
    if (!this.client) return null;

    const { data, error } = await this.client
      .from('pending_queue')
      .insert(entry)
      .select('id')
      .single();

    if (error) {
      console.error('[Supabase] Error creating queue entry:', error);
      return null;
    }

    return data?.id || null;
  }

  // ============================================
  // Notification Operations
  // ============================================

  /**
   * Get unread notifications
   */
  async getUnreadNotifications(): Promise<Notification[]> {
    if (!this.client) return [];

    const { data, error } = await this.client
      .from('notifications')
      .select('*')
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase] Error fetching notifications:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Mark a notification as read
   */
  async markNotificationRead(id: string): Promise<boolean> {
    if (!this.client) return false;

    const { error } = await this.client
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('[Supabase] Error marking notification read:', error);
      return false;
    }

    return true;
  }

  /**
   * Create a notification
   */
  async createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'is_read' | 'read_at'>): Promise<string | null> {
    if (!this.client) return null;

    const { data, error } = await this.client
      .from('notifications')
      .insert({
        ...notification,
        is_read: false,
        read_at: null
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Supabase] Error creating notification:', error);
      return null;
    }

    return data?.id || null;
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsRead(): Promise<boolean> {
    if (!this.client) return false;

    const { error } = await this.client
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('is_read', false);

    if (error) {
      console.error('[Supabase] Error marking all notifications read:', error);
      return false;
    }

    return true;
  }

  // ============================================
  // Processed Message Tracking (Idempotency)
  // ============================================

  /**
   * Check if a message has already been processed
   */
  async isMessageProcessed(messageId: string): Promise<boolean> {
    if (!this.client) return false;

    const { data, error } = await this.client
      .from('processed_messages')
      .select('id')
      .eq('id', messageId)
      .single();

    if (error || !data) return false;
    return true;
  }

  /**
   * Mark a message as processed
   */
  async markMessageProcessed(
    messageId: string,
    messageType: string,
    documentId?: string
  ): Promise<boolean> {
    if (!this.client) return false;

    const { error } = await this.client
      .from('processed_messages')
      .insert({
        id: messageId,
        message_type: messageType,
        processing_status: documentId ? 'completed' : 'queued',
        document_id: documentId || null
      });

    if (error) {
      console.error('[Supabase] Error marking message processed:', error);
      return false;
    }

    return true;
  }

  // ============================================
  // Real-time Subscriptions
  // ============================================

  /**
   * Subscribe to new notifications (real-time)
   */
  subscribeToNotifications(
    callback: (notification: Notification) => void
  ): void {
    if (!this.client) return;

    // Unsubscribe from existing channel
    this.unsubscribe();

    this.realtimeChannel = this.client
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: 'is_read=eq.false'
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();

    console.log('[Supabase] Subscribed to notifications');
  }

  /**
   * Subscribe to pending queue changes
   */
  subscribeToPendingQueue(
    callback: (item: PendingQueueItem) => void,
    event: 'INSERT' | 'UPDATE' | 'DELETE' = 'INSERT'
  ): void {
    if (!this.client) return;

    this.realtimeChannel = this.client
      .channel('pending-queue-changes')
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table: 'pending_queue',
          filter: 'status=eq.pending'
        },
        (payload) => {
          callback(payload.new as PendingQueueItem);
        }
      )
      .subscribe();

    console.log('[Supabase] Subscribed to pending queue');
  }

  /**
   * Subscribe to document changes
   */
  subscribeToDocuments(
    callback: (doc: SupabaseDocument) => void,
    event: 'INSERT' | 'UPDATE' = 'INSERT'
  ): void {
    if (!this.client) return;

    this.realtimeChannel = this.client
      .channel('documents-changes')
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table: 'documents'
        },
        (payload) => {
          callback(payload.new as SupabaseDocument);
        }
      )
      .subscribe();

    console.log('[Supabase] Subscribed to documents');
  }

  /**
   * Unsubscribe from all real-time channels
   */
  unsubscribe(): void {
    if (this.realtimeChannel && this.client) {
      this.client.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
      console.log('[Supabase] Unsubscribed from channels');
    }
  }

  // ============================================
  // Storage Operations (File Uploads)
  // ============================================

  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(
    bucket: string,
    path: string,
    file: File | Blob,
    options?: { contentType?: string }
  ): Promise<string | null> {
    if (!this.client) return null;

    const { data, error } = await this.client
      .storage
      .from(bucket)
      .upload(path, file, {
        contentType: options?.contentType || 'application/octet-stream',
        upsert: true
      });

    if (error) {
      console.error('[Supabase] Error uploading file:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = this.client
      .storage
      .from(bucket)
      .getPublicUrl(data.path);

    return urlData?.publicUrl || null;
  }

  /**
   * Get a file from Supabase Storage
   */
  async getFile(bucket: string, path: string): Promise<Blob | null> {
    if (!this.client) return null;

    const { data, error } = await this.client
      .storage
      .from(bucket)
      .download(path);

    if (error) {
      console.error('[Supabase] Error downloading file:', error);
      return null;
    }

    return data;
  }

  /**
   * Delete a file from Supabase Storage
   */
  async deleteFile(bucket: string, path: string): Promise<boolean> {
    if (!this.client) return false;

    const { error } = await this.client
      .storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('[Supabase] Error deleting file:', error);
      return false;
    }

    return true;
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Map Supabase document to DocumentRecord
   */
  private mapSupabaseToDocumentRecord(data: SupabaseDocument): DocumentRecord {
    return {
      id: data.id,
      fileName: data.file_name || '',
      fileType: data.file_type || '',
      uploadDate: data.created_at,
      status: this.mapStatus(data.status),
      data: data.raw_data || null,
      previewUrl: data.gitlab_file_path || undefined,
      fileHash: data.file_hash,
      duplicateOfId: undefined,
      duplicateConfidence: undefined,
      duplicateReason: undefined
    };
  }

  /**
   * Map string status to DocumentStatus enum
   */
  private mapStatus(status: string): DocumentStatus {
    switch (status) {
      case 'processing':
        return DocumentStatus.PROCESSING;
      case 'review_needed':
        return DocumentStatus.REVIEW_NEEDED;
      case 'completed':
        return DocumentStatus.COMPLETED;
      case 'error':
        return DocumentStatus.ERROR;
      case 'duplicate':
        return DocumentStatus.DUPLICATE;
      default:
        return DocumentStatus.PROCESSING;
    }
  }

  /**
   * Convert DocumentRecord to Supabase format
   */
  documentRecordToSupabase(doc: DocumentRecord): Partial<SupabaseDocument> {
    const data = doc.data || {};

    return {
      id: doc.id,
      file_name: doc.fileName,
      file_type: doc.fileType,
      file_size: 0,
      file_hash: doc.fileHash,
      source_type: 'upload',
      source_id: doc.id,
      status: doc.status.toLowerCase(),
      raw_data: data,
      line_items: data.lineItems || [],
      created_at: doc.uploadDate,
      updated_at: new Date().toISOString()
    };
  }
}

// ============================================
// Export Singleton Instance
// ============================================

export const supabaseService = new SupabaseService();
export type { SupabaseDocument, PendingQueueItem, Notification, ProcessedMessage };
