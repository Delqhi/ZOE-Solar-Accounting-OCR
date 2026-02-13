import type { UserId } from '../types/branded';

export interface AuditLog {
  timestamp: Date;
  userId: UserId;
  action: string;
  resource: string;
  resourceId: string;
  ip?: string;
  userAgent?: string;
  result: 'success' | 'failure';
  metadata?: Record<string, unknown>;
}

export class AuditService {
  private static logs: AuditLog[] = [];
  private static maxLogs = 1000;

  static log(log: Omit<AuditLog, 'timestamp'>): void {
    const entry: AuditLog = { ...log, timestamp: new Date() };
    this.logs.push(entry);

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    if (import.meta.env.PROD) {
      fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      }).catch(() => {
        this.storeOffline(entry);
      });
    }
  }

  private static storeOffline(log: AuditLog): void {
    navigator.storage?.persist?.();
  }

  static getLogs(userId: UserId): AuditLog[] {
    return this.logs.filter((l) => l.userId === userId);
  }

  static getAllLogs(): readonly AuditLog[] {
    return this.logs;
  }

  static clearLogs(): void {
    this.logs = [];
  }
}
