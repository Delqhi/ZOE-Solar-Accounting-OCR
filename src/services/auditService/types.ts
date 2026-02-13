export type UserId = string;
export type DocumentId = string;

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: UserId;
  action: AuditAction;
  resource: AuditResource;
  resourceId: string;
  result: 'success' | 'failure';
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  sessionId?: string;
  correlationId?: string;
}

export type AuditAction = 
  | 'UPLOAD'
  | 'DELETE'
  | 'VIEW'
  | 'UPDATE'
  | 'EXPORT'
  | 'AI_ANALYSIS'
  | 'LOGIN'
  | 'LOGOUT'
  | 'REGISTER'
  | 'PASSWORD_RESET'
  | 'ROLE_CHANGE'
  | 'API_CALL'
  | 'ERROR'
  | 'SECURITY_VIOLATION';

export type AuditResource = 
  | 'document'
  | 'user'
  | 'session'
  | 'api_key'
  | 'ai_request'
  | 'export'
  | 'system';

export interface AuditConfig {
  maxBatchSize: number;
  flushInterval: number;
  storage: 'indexeddb' | 'localstorage' | 'api';
  retentionDays: number;
  encryption?: boolean;
}

export const CRITICAL_ACTIONS: AuditAction[] = [
  'DELETE',
  'PASSWORD_RESET',
  'ROLE_CHANGE',
  'SECURITY_VIOLATION',
  'ERROR',
];
