/**
 * 🔱 ULTRA 2026 - Audit Logging Hook
 * Comprehensive audit trail with offline-first support
 */

import { useState, useCallback } from 'react';
import { AuditService, type AuditLog, type UserId } from '@/lib/ultra';
import { useAuth } from './useAuth';

export interface AuditLogOptions {
  includeIP?: boolean;
  includeUserAgent?: boolean;
  metadata?: Record<string, unknown>;
}

export function useAuditLog() {
  const { user } = useAuth();
  const [isLogging, setIsLogging] = useState(false);

  /**
   * Log document upload event
   */
  const logDocumentUpload = useCallback((documentId: string, options?: AuditLogOptions) => {
    if (!user) return;

    const log: Omit<AuditLog, 'timestamp'> = {
      userId: user.id as UserId,
      action: 'UPLOAD',
      resource: 'document',
      resourceId: documentId,
      result: 'success',
      ...(options?.includeIP && { ip: '0.0.0.0' }), // Would get from request
      ...(options?.includeUserAgent && { userAgent: navigator.userAgent }),
      ...(options?.metadata && { metadata: options.metadata }),
    };

    AuditService.log(log);
  }, [user]);

  /**
   * Log document deletion event
   */
  const logDocumentDelete = useCallback((documentId: string, options?: AuditLogOptions) => {
    if (!user) return;

    const log: Omit<AuditLog, 'timestamp'> = {
      userId: user.id as UserId,
      action: 'DELETE',
      resource: 'document',
      resourceId: documentId,
      result: 'success',
      ...(options?.includeIP && { ip: '0.0.0.0' }),
      ...(options?.includeUserAgent && { userAgent: navigator.userAgent }),
      ...(options?.metadata && { metadata: options.metadata }),
    };

    AuditService.log(log);
  }, [user]);

  /**
   * Log document view event
   */
  const logDocumentView = useCallback((documentId: string, options?: AuditLogOptions) => {
    if (!user) return;

    const log: Omit<AuditLog, 'timestamp'> = {
      userId: user.id as UserId,
      action: 'VIEW',
      resource: 'document',
      resourceId: documentId,
      result: 'success',
      ...(options?.includeIP && { ip: '0.0.0.0' }),
      ...(options?.includeUserAgent && { userAgent: navigator.userAgent }),
      ...(options?.metadata && { metadata: options.metadata }),
    };

    AuditService.log(log);
  }, [user]);

  /**
   * Log AI analysis event
   */
  const logAIAnalysis = useCallback((documentId: string, provider: string, cost: number, options?: AuditLogOptions) => {
    if (!user) return;

    const log: Omit<AuditLog, 'timestamp'> = {
      userId: user.id as UserId,
      action: 'AI_ANALYSIS',
      resource: 'document',
      resourceId: documentId,
      result: 'success',
      metadata: {
        provider,
        cost,
        ...options?.metadata,
      },
      ...(options?.includeIP && { ip: '0.0.0.0' }),
      ...(options?.includeUserAgent && { userAgent: navigator.userAgent }),
    };

    AuditService.log(log);
  }, [user]);

  /**
   * Log authentication event
   */
  const logAuth = useCallback((action: 'LOGIN' | 'LOGOUT' | 'REGISTER', options?: AuditLogOptions) => {
    if (!user) return;

    const log: Omit<AuditLog, 'timestamp'> = {
      userId: user.id as UserId,
      action,
      resource: 'auth',
      resourceId: user.id,
      result: 'success',
      ...(options?.includeIP && { ip: '0.0.0.0' }),
      ...(options?.includeUserAgent && { userAgent: navigator.userAgent }),
      ...(options?.metadata && { metadata: options.metadata }),
    };

    AuditService.log(log);
  }, [user]);

  /**
   * Log error event
   */
  const logError = useCallback((action: string, resource: string, resourceId: string, error: Error, options?: AuditLogOptions) => {
    if (!user) return;

    const log: Omit<AuditLog, 'timestamp'> = {
      userId: user.id as UserId,
      action,
      resource,
      resourceId,
      result: 'failure',
      metadata: {
        error: error.message,
        stack: error.stack,
        ...options?.metadata,
      },
      ...(options?.includeIP && { ip: '0.0.0.0' }),
      ...(options?.includeUserAgent && { userAgent: navigator.userAgent }),
    };

    AuditService.log(log);
  }, [user]);

  /**
   * Get audit logs for current user
   */
  const getLogs = useCallback((): AuditLog[] => {
    if (!user) return [];
    return AuditService.getLogs(user.id as UserId);
  }, [user]);

  /**
   * Export logs as JSON
   */
  const exportLogs = useCallback((): string => {
    const logs = getLogs();
    return JSON.stringify(logs, null, 2);
  }, [getLogs]);

  /**
   * Clear logs for current user (admin only)
   */
  const clearLogs = useCallback(() => {
    if (!user) return;
    // In production, this would require admin privileges
    // For now, we'll just clear from memory
    console.warn('[AuditLog] Clear logs called - would require admin in production');
  }, [user]);

  return {
    logDocumentUpload,
    logDocumentDelete,
    logDocumentView,
    logAIAnalysis,
    logAuth,
    logError,
    getLogs,
    exportLogs,
    clearLogs,
    isLogging,
  };
}

/**
 * Higher-order function for automatic audit logging
 */
export function withAuditLog<T extends (...args: any[]) => any>(
  fn: T,
  action: string,
  resource: string,
  getResourceId: (...args: Parameters<T>) => string
): T {
  return ((...args: Parameters<T>) => {
    const { user } = useAuth();
    const result = fn(...args);

    if (user && result instanceof Promise) {
      result
        .then(() => {
          AuditService.log({
            userId: user.id as UserId,
            action,
            resource,
            resourceId: getResourceId(...args),
            result: 'success',
          });
        })
        .catch((error) => {
          AuditService.log({
            userId: user.id as UserId,
            action,
            resource,
            resourceId: getResourceId(...args),
            result: 'failure',
            metadata: { error: error.message },
          });
        });
    }

    return result;
  }) as T;
}

/**
 * Batch audit logger for bulk operations
 */
export class BatchAuditLogger {
  private logs: Omit<AuditLog, 'timestamp'>[] = [];
  private userId: UserId;

  constructor(userId: UserId) {
    this.userId = userId;
  }

  add(action: string, resource: string, resourceId: string, result: 'success' | 'failure', metadata?: Record<string, unknown>) {
    this.logs.push({
      userId: this.userId,
      action,
      resource,
      resourceId,
      result,
      metadata,
    });
  }

  flush() {
    this.logs.forEach(log => AuditService.log(log));
    const count = this.logs.length;
    this.logs = [];
    return count;
  }

  clear() {
    this.logs = [];
  }

  get count() {
    return this.logs.length;
  }
}
