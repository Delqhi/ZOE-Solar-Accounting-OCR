import { getSupabase } from './supabaseClient';

export interface AppNotification {
  id: string;
  userId: string;
  notificationType: 'orphan_alert' | 'related_found' | 'queue_reminder' | 'processing_complete';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  relatedDocumentId?: string;
  relatedQueueId?: string;
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
}

class NotificationService {
  private tableName = 'notifications';

  async createNotification(
    userId: string,
    notification: Omit<AppNotification, 'id' | 'userId' | 'isRead' | 'createdAt'>
  ): Promise<AppNotification> {
    const client = getSupabase();

    const { data, error } = await client
      .from(this.tableName)
      .insert({
        user_id: userId,
        notification_type: notification.notificationType,
        title: notification.title,
        message: notification.message,
        severity: notification.severity,
        related_document_id: notification.relatedDocumentId,
        related_queue_id: notification.relatedQueueId,
        action_url: notification.actionUrl,
        action_label: notification.actionLabel
      })
      .select()
      .single();

    if (error) throw error;
    return this.fromDbFormat(data);
  }

  async getUnreadNotifications(userId: string): Promise<AppNotification[]> {
    const client = getSupabase();

    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(d => this.fromDbFormat(d));
  }

  async getAllNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<AppNotification[]> {
    const client = getSupabase();

    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
      .offset(offset);

    if (error) throw error;
    return (data || []).map(d => this.fromDbFormat(d));
  }

  async markAsRead(notificationId: string): Promise<void> {
    const client = getSupabase();

    const { error } = await client
      .from(this.tableName)
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    if (error) throw error;
  }

  async markAllAsRead(userId: string): Promise<void> {
    const client = getSupabase();

    const { error } = await client
      .from(this.tableName)
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const client = getSupabase();

    const { error } = await client
      .from(this.tableName)
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  }

  async deleteOldNotifications(userId: string, daysOld: number = 30): Promise<number> {
    const client = getSupabase();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { count, error } = await client
      .from(this.tableName)
      .delete()
      .eq('user_id', userId)
      .eq('is_read', true)
      .lt('created_at', cutoffDate.toISOString())
      .select('id', { count: 'exact' });

    if (error) throw error;
    return count || 0;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const client = getSupabase();

    const { count, error } = await client
      .from(this.tableName)
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  }

  // Subscribe to real-time notifications
  subscribeToNotifications(
    userId: string,
    callback: (notification: AppNotification) => void
  ): () => void {
    const client = getSupabase();

    const subscription = client
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new) {
            callback(this.fromDbFormat(payload.new as any));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  private fromDbFormat(data: Record<string, unknown>): AppNotification {
    const d = data as any;

    return {
      id: d.id,
      userId: d.user_id,
      notificationType: d.notification_type,
      title: d.title,
      message: d.message,
      severity: d.severity,
      relatedDocumentId: d.related_document_id,
      relatedQueueId: d.related_queue_id,
      isRead: d.is_read,
      readAt: d.read_at,
      actionUrl: d.action_url,
      actionLabel: d.action_label,
      createdAt: d.created_at
    };
  }
}

export const notificationService = new NotificationService();
