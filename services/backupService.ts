/**
 * Backup Service for ZOE Solar Accounting OCR
 * Supports both IndexedDB (local) and Supabase (cloud) backups
 */

import { DocumentRecord, AppSettings } from '../types';
import * as storageService from './storageService';
import * as supabaseService from './supabaseService';

export interface BackupData {
  version: string;
  timestamp: string;
  documents: DocumentRecord[];
  settings: AppSettings | null;
  source: 'local' | 'cloud';
}

export interface RestoreResult {
  success: boolean;
  documentsRestored: number;
  settingsRestored: boolean;
  error?: string;
}

const BACKUP_VERSION = '1.0.0';

/**
 * Create backup from IndexedDB (local-first)
 */
export const createBackup = async (): Promise<BackupData> => {
  const [documents, settings] = await Promise.all([
    storageService.getAllDocuments(),
    storageService.getSettings()
  ]);

  return {
    version: BACKUP_VERSION,
    timestamp: new Date().toISOString(),
    documents,
    settings,
    source: 'local'
  };
};

/**
 * Download backup as JSON file
 */
export const downloadBackupJSON = async (): Promise<void> => {
  const backup = await createBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const date = new Date().toISOString().split('T')[0];
  a.download = `zoe_backup_${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Download backup as SQL file
 */
export const downloadBackupSQL = async (): Promise<void> => {
  const [documents, settings] = await Promise.all([
    storageService.getAllDocuments(),
    storageService.getSettings()
  ]);
  const sql = supabaseService.exportDocumentsToSQL(documents, settings);
  const blob = new Blob([sql], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const date = new Date().toISOString().split('T')[0];
  a.download = `zoe_backup_${date}.sql`;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Restore backup from JSON file (to IndexedDB)
 */
export const restoreFromBackup = async (file: File): Promise<RestoreResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const backup: BackupData = JSON.parse(content);

        // Validate backup format
        if (!backup.version || !backup.documents) {
          resolve({
            success: false,
            documentsRestored: 0,
            settingsRestored: false,
            error: 'Ungültiges Backup-Format.'
          });
          return;
        }

        let documentsRestored = 0;
        let settingsRestored = false;

        // Restore settings first
        if (backup.settings) {
          await storageService.saveSettings(backup.settings);
          settingsRestored = true;
        }

        // Restore documents
        for (const doc of backup.documents) {
          try {
            await storageService.saveDocument(doc);
            documentsRestored++;
          } catch (err) {
            console.warn(`Failed to restore document ${doc.id}:`, err);
          }
        }

        // Optionally sync to Supabase if configured
        if (supabaseService.isSupabaseConfigured()) {
          try {
            if (settingsRestored && backup.settings) {
              await supabaseService.saveSettings(backup.settings);
            }
            for (const doc of backup.documents) {
              await supabaseService.saveDocument(doc);
            }
          } catch (syncErr) {
            console.warn('Failed to sync restored data to Supabase:', syncErr);
          }
        }

        resolve({
          success: true,
          documentsRestored,
          settingsRestored
        });

      } catch (err) {
        resolve({
          success: false,
          documentsRestored: 0,
          settingsRestored: false,
          error: `Fehler beim Parsen der Backup-Datei: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        documentsRestored: 0,
        settingsRestored: false,
        error: 'Fehler beim Lesen der Datei.'
      });
    };

    reader.readAsText(file);
  });
};

/**
 * Get backup preview without loading all data
 */
export const getBackupPreview = async (): Promise<{
  documentCount: number;
  hasSettings: boolean;
  yearRange: { min: number; max: number } | null;
  totalAmount: number;
}> => {
  const [documents, settings] = await Promise.all([
    storageService.getAllDocuments(),
    storageService.getSettings()
  ]);

  const years = new Set<number>();
  let totalAmount = 0;

  for (const doc of documents) {
    if (doc.data?.belegDatum) {
      const year = parseInt(doc.data.belegDatum.substring(0, 4), 10);
      if (!isNaN(year)) years.add(year);
    }
    if (doc.data?.bruttoBetrag) {
      totalAmount += doc.data.bruttoBetrag;
    }
  }

  const yearArray = Array.from(years).sort();

  return {
    documentCount: documents.length,
    hasSettings: !!settings,
    yearRange: yearArray.length > 0
      ? { min: yearArray[0], max: yearArray[yearArray.length - 1] }
      : null,
    totalAmount: Math.round(totalAmount * 100) / 100
  };
};
