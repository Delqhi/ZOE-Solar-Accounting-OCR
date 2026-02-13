import { AuditConfig, AuditLogEntry, AuditAction, CRITICAL_ACTIONS, UserId } from './types';
import { storeInIndexedDB, storeInLocalStorage, loadFromIndexedDB, loadFromLocalStorage, saveToLocalStorage } from './storage';
import { sendBatchToBackend, sendToBackend } from './backend';

export class AuditService {
  private static instance: AuditService;
  private logs: AuditLogEntry[] = [];
  private config: AuditConfig;
  private flushTimer: NodeJS.Timeout | null = null;

  private constructor(config: Partial<AuditConfig> = {}) {
    this.config = {
      maxBatchSize: config.maxBatchSize ?? 50,
      flushInterval: config.flushInterval ?? 30000,
      storage: config.storage ?? 'indexeddb',
      retentionDays: config.retentionDays ?? 90,
      encryption: config.encryption ?? false,
    };

    this.startFlushTimer();
    this.loadFromStorage();
  }

  static getInstance(config?: Partial<AuditConfig>): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService(config);
    }
    return AuditService.instance;
  }

  static log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    const instance = this.getInstance();
    const logEntry: AuditLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    instance.logs.push(logEntry);

    if (instance.logs.length >= instance.config.maxBatchSize) {
      instance.flush();
    }

    if (import.meta.env.PROD && this.isCriticalEvent(entry.action)) {
      instance.sendToBackend(logEntry).catch(() => {
        instance.storeLocally(logEntry);
      });
    }

    instance.storeLocally(logEntry);
  }

  static getLogsForUser(userId: UserId, limit = 100): AuditLogEntry[] {
    const instance = this.getInstance();
    return instance.logs
      .filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  static getLogsForResource(resource: string, resourceId: string): AuditLogEntry[] {
    const instance = this.getInstance();
    return instance.logs
      .filter(log => log.resource === resource && log.resourceId === resourceId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  static getLogsByAction(action: AuditAction, limit = 100): AuditLogEntry[] {
    const instance = this.getInstance();
    return instance.logs
      .filter(log => log.action === action)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  static async exportLogs(format: 'json' | 'csv' = 'json'): Promise<string> {
    const instance = this.getInstance();
    await instance.flush();

    if (format === 'json') {
      return JSON.stringify(instance.logs, null, 2);
    }

    const headers = ['id', 'timestamp', 'userId', 'action', 'resource', 'resourceId', 'result'];
    const rows = instance.logs.map(log => [
      log.id,
      log.timestamp.toISOString(),
      log.userId,
      log.action,
      log.resource,
      log.resourceId,
      log.result,
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  static cleanup(): void {
    const instance = this.getInstance();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - instance.config.retentionDays);

    instance.logs = instance.logs.filter(log => log.timestamp >= cutoff);
    instance.saveToStorage();
  }

  static flush(): Promise<void> {
    return this.getInstance().flush();
  }

  static destroy(): void {
    const instance = AuditService.instance;
    if (instance?.flushTimer) {
      clearInterval(instance.flushTimer);
    }
  }

  private async flush(): Promise<void> {
    if (this.logs.length === 0) return;

    const batch = [...this.logs];
    
    if (import.meta.env.PROD) {
      try {
        await sendBatchToBackend(batch);
        this.logs = this.logs.filter(log => !batch.includes(log));
        this.saveToStorage();
      } catch (error) {
        console.error('[Audit] Failed to flush logs:', error);
      }
    } else {
      this.logs = [];
      this.saveToStorage();
    }
  }

  private storeLocally(log: AuditLogEntry): void {
    if (this.config.storage === 'indexeddb') {
      storeInIndexedDB(log);
    } else {
      storeInLocalStorage(log);
    }
  }

  private async loadFromStorage(): Promise<void> {
    if (this.config.storage === 'indexeddb') {
      this.logs = await loadFromIndexedDB();
    } else {
      this.logs = loadFromLocalStorage();
    }
  }

  private saveToStorage(): void {
    if (this.config.storage === 'localstorage') {
      saveToLocalStorage(this.logs);
    }
  }

  private startFlushTimer(): void {
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flushTimer = setInterval(() => this.flush(), this.config.flushInterval);
  }

  private static isCriticalEvent(action: AuditAction): boolean {
    return CRITICAL_ACTIONS.includes(action);
  }
}
