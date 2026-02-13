import { AuditLogEntry } from './types';

export async function sendBatchToBackend(batch: AuditLogEntry[]): Promise<void> {
  const response = await fetch('/api/audit/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ logs: batch }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send audit logs: ${response.status}`);
  }
}

export async function sendToBackend(log: AuditLogEntry): Promise<void> {
  const response = await fetch('/api/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(log),
  });

  if (!response.ok) {
    throw new Error(`Failed to send audit log: ${response.status}`);
  }
}
