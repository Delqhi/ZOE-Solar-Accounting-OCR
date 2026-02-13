/**
 * Audit Service - Main Entry Point
 * Re-exports from modular architecture for backward compatibility
 * @deprecated Import from './auditService/' submodules for better tree-shaking
 */

export {
  AuditService,
  AuditLoggers,
} from './auditService';

export type {
  AuditLogEntry,
  AuditAction,
  AuditResource,
  AuditConfig,
  UserId,
  DocumentId,
} from './auditService';

export { CRITICAL_ACTIONS } from './auditService';
