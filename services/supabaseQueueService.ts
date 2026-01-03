import { getSupabase } from './supabaseClient';
import { DocumentTypeClassification } from '../types';

export interface QueueEntry {
  id: string;
  documentId: string;
  queueType: 'missing_invoice' | 'missing_receipt' | 'follow_up';
  status: 'pending' | 'processing' | 'completed' | 'expired' | 'cancelled';
  priority: number;
  requiredDocumentType?: DocumentTypeClassification;
  requiredVendorPattern?: string;
  requiredDateRange?: { start: string; end: string };
  requiredAmountRange?: { min: number; max: number };
  searchAttempts: number;
  nextRetryAt?: string;
  resolvedByDocumentId?: string;
  resolvedAt?: string;
  createdAt: string;
  expiresAt?: string;
}

class QueueService {
  private tableName = 'document_queue';

  async createQueueEntry(
    userId: string,
    documentId: string,
    queueType: QueueEntry['queueType'],
    options?: {
      priority?: number;
      requiredDocumentType?: DocumentTypeClassification;
      requiredVendorPattern?: string;
      requiredDateRange?: { start: string; end: string };
      requiredAmountRange?: { min: number; max: number };
      expiresAt?: string;
    }
  ): Promise<QueueEntry> {
    const client = getSupabase();

    const { data, error } = await client
      .from(this.tableName)
      .insert({
        user_id: userId,
        document_id: documentId,
        queue_type: queueType,
        status: 'pending',
        priority: options?.priority || 0,
        required_document_type: options?.requiredDocumentType,
        required_vendor_pattern: options?.requiredVendorPattern,
        required_date_range: options?.requiredDateRange ? JSON.stringify(options.requiredDateRange) : null,
        required_amount_range: options?.requiredAmountRange ? JSON.stringify(options.requiredAmountRange) : null,
        expires_at: options?.expiresAt
      })
      .select()
      .single();

    if (error) throw error;
    return this.fromDbFormat(data);
  }

  async getQueueForDocument(
    userId: string,
    documentId: string
  ): Promise<QueueEntry | null> {
    const client = getSupabase();

    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .eq('document_id', documentId)
      .in('status', ['pending', 'processing'])
      .single();

    if (error) return null;
    return this.fromDbFormat(data);
  }

  async getPendingQueue(userId: string): Promise<QueueEntry[]> {
    const client = getSupabase();

    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(d => this.fromDbFormat(d));
  }

  async getQueueStats(userId: string): Promise<{
    pending: number;
    completed: number;
    expired: number;
  }> {
    const client = getSupabase();

    const [pending, completed, expired] = await Promise.all([
      client
        .from(this.tableName)
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'pending'),
      client
        .from(this.tableName)
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'completed'),
      client
        .from(this.tableName)
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'expired')
    ]);

    return {
      pending: pending.count || 0,
      completed: completed.count || 0,
      expired: expired.count || 0
    };
  }

  async updateQueueEntry(
    queueId: string,
    updates: Partial<QueueEntry>
  ): Promise<QueueEntry> {
    const client = getSupabase();

    const dbUpdates: Record<string, unknown> = {
      status: updates.status,
      search_attempts: updates.searchAttempts,
      next_retry_at: updates.nextRetryAt,
      resolved_by_document_id: updates.resolvedByDocumentId,
      resolved_at: updates.resolvedAt,
      resolution_notes: updates.resolutionNotes
    };

    // Remove undefined values
    Object.keys(dbUpdates).forEach(key => {
      if (dbUpdates[key] === undefined) {
        delete dbUpdates[key];
      }
    });

    const { data, error } = await client
      .from(this.tableName)
      .update(dbUpdates)
      .eq('id', queueId)
      .select()
      .single();

    if (error) throw error;
    return this.fromDbFormat(data);
  }

  async resolveQueueEntry(
    queueId: string,
    resolvedByDocumentId: string
  ): Promise<void> {
    await this.updateQueueEntry(queueId, {
      status: 'completed',
      resolvedByDocumentId,
      resolvedAt: new Date().toISOString()
    });
  }

  async cancelQueueEntry(queueId: string): Promise<void> {
    await this.updateQueueEntry(queueId, {
      status: 'cancelled'
    });
  }

  async expireOldEntries(): Promise<number> {
    const client = getSupabase();

    const { count, error } = await client
      .from(this.tableName)
      .update({ status: 'expired' })
      .lt('expires_at', new Date().toISOString())
      .eq('status', 'pending')
      .select('id', { count: 'exact' });

    if (error) throw error;
    return count || 0;
  }

  // Find matching documents for a queue entry
  async findMatchingDocuments(
    userId: string,
    queueEntry: QueueEntry
  ): Promise<string[]> {
    const client = getSupabase();

    let query = client
      .from('documents')
      .select('id')
      .eq('user_id', userId)
      .neq('id', queueEntry.documentId)
      .eq('status', 'completed');

    if (queueEntry.requiredDocumentType) {
      query = query.eq('document_type', queueEntry.requiredDocumentType);
    }

    if (queueEntry.requiredVendorPattern) {
      query = query.ilike('lieferant_name', `%${queueEntry.requiredVendorPattern}%`);
    }

    if (queueEntry.requiredDateRange) {
      query = query.gte('beleg_datum', queueEntry.requiredDateRange.start);
      query = query.lte('beleg_datum', queueEntry.requiredDateRange.end);
    }

    if (queueEntry.requiredAmountRange) {
      query = query.gte('brutto_betrag', queueEntry.requiredAmountRange.min);
      query = query.lte('brutto_betrag', queueEntry.requiredAmountRange.max);
    }

    const { data, error } = await query.limit(10);
    if (error) throw error;

    return (data || []).map(d => d.id);
  }

  private fromDbFormat(data: Record<string, unknown>): QueueEntry {
    const d = data as any;

    return {
      id: d.id,
      documentId: d.document_id,
      queueType: d.queue_type,
      status: d.status,
      priority: d.priority,
      requiredDocumentType: d.required_document_type,
      requiredVendorPattern: d.required_vendor_pattern,
      requiredDateRange: d.required_date_range
        ? JSON.parse(d.required_date_range)
        : undefined,
      requiredAmountRange: d.required_amount_range
        ? JSON.parse(d.required_amount_range)
        : undefined,
      searchAttempts: d.search_attempts,
      nextRetryAt: d.next_retry_at,
      resolvedByDocumentId: d.resolved_by_document_id,
      resolvedAt: d.resolved_at,
      createdAt: d.created_at,
      expiresAt: d.expires_at
    };
  }
}

export const queueService = new QueueService();
