import { AuditService } from './service';
import { UserId, DocumentId } from './types';

export const AuditLoggers = {
  document: {
    upload: (documentId: DocumentId, userId: UserId, metadata?: Record<string, unknown>) => {
      AuditService.log({
        userId,
        action: 'UPLOAD',
        resource: 'document',
        resourceId: documentId,
        result: 'success',
        metadata,
      });
    },

    delete: (documentId: DocumentId, userId: UserId, reason?: string) => {
      AuditService.log({
        userId,
        action: 'DELETE',
        resource: 'document',
        resourceId: documentId,
        result: 'success',
        metadata: { reason },
      });
    },

    view: (documentId: DocumentId, userId: UserId) => {
      AuditService.log({
        userId,
        action: 'VIEW',
        resource: 'document',
        resourceId: documentId,
        result: 'success',
      });
    },

    export: (documentId: DocumentId, userId: UserId, format: string) => {
      AuditService.log({
        userId,
        action: 'EXPORT',
        resource: 'document',
        resourceId: documentId,
        result: 'success',
        metadata: { format },
      });
    },
  },

  ai: {
    analysis: (userId: UserId, provider: string, cost: number, success: boolean) => {
      AuditService.log({
        userId,
        action: 'AI_ANALYSIS',
        resource: 'ai_request',
        resourceId: `ai-${Date.now()}`,
        result: success ? 'success' : 'failure',
        metadata: { provider, cost },
      });
    },
  },

  auth: {
    login: (userId: UserId, success: boolean) => {
      AuditService.log({
        userId,
        action: 'LOGIN',
        resource: 'session',
        resourceId: `session-${userId}`,
        result: success ? 'success' : 'failure',
      });
    },

    logout: (userId: UserId) => {
      AuditService.log({
        userId,
        action: 'LOGOUT',
        resource: 'session',
        resourceId: `session-${userId}`,
        result: 'success',
      });
    },

    register: (userId: UserId, email: string) => {
      AuditService.log({
        userId,
        action: 'REGISTER',
        resource: 'user',
        resourceId: userId,
        result: 'success',
        metadata: { email },
      });
    },
  },

  security: {
    violation: (userId: UserId, event: string, details: Record<string, unknown>) => {
      AuditService.log({
        userId,
        action: 'SECURITY_VIOLATION',
        resource: 'system',
        resourceId: 'security',
        result: 'failure',
        metadata: { event, ...details },
      });
    },

    error: (userId: UserId, error: Error, context?: string) => {
      AuditService.log({
        userId,
        action: 'ERROR',
        resource: 'system',
        resourceId: 'error',
        result: 'failure',
        metadata: {
          message: error.message,
          stack: error.stack,
          context,
        },
      });
    },
  },
};
