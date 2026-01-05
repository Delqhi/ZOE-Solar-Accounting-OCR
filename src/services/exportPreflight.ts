/** Export Preflight - Placeholder */

import { DocumentRecord, AppSettings } from '../types';

export interface PreflightResult {
  blockers: string[];
  warnings: string[];
}

export function runExportPreflight(documents: DocumentRecord[], _settings: AppSettings | null): PreflightResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  for (const doc of documents) {
    if (!doc.data) {
      blockers.push(`Dokument ${doc.fileName} hat keine Daten`);
    }
    if (doc.status === 'ERROR') {
      warnings.push(`Dokument ${doc.fileName} hat Fehlerstatus`);
    }
  }

  return { blockers, warnings };
}

export function formatPreflightForDialog(preflight: PreflightResult): { title: string; body: string } {
  const title = 'Export-Prüfung';
  const body = [
    ...preflight.blockers.map(b => `❌ BLOCKIEREND: ${b}`),
    ...preflight.warnings.map(w => `⚠️ WARNUNG: ${w}`),
    preflight.blockers.length === 0 && preflight.warnings.length === 0 ? '✅ Alles klar!' : ''
  ].filter(Boolean).join('\n');

  return { title, body };
}
