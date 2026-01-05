import { DocumentRecord, AppSettings } from '../types';
import { getAllDocuments, getSettings, initSupabase, exportDocumentsToSQL } from './supabaseService';

export interface BackupData {
  version: string;
  timestamp: string;
  documents: DocumentRecord[];
  settings: AppSettings;
}

const BACKUP_VERSION = '1.0.0';

export const createBackup = async (): Promise<BackupData> => {
  const documents = await getAllDocuments();
  const settings = await getSettings();

  return {
    version: BACKUP_VERSION,
    timestamp: new Date().toISOString(),
    documents,
    settings
  };
};

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

export const downloadBackupSQL = async (): Promise<void> => {
  const documents = await getAllDocuments();
  const settings = await getSettings();
  const sql = exportDocumentsToSQL(documents, settings);
  const blob = new Blob([sql], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `zoe_backup_${date}.sql`;
  a.click();
  URL.revokeObjectURL(url);
};

export const restoreFromBackup = async (file: File): Promise<{
  success: boolean;
  documentsRestored: number;
  error?: string;
}> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const backup: BackupData = JSON.parse(content);

        // Validate backup format
        if (!backup.version || !backup.documents || !backup.settings) {
          resolve({
            success: false,
            documentsRestored: 0,
            error: 'Ungültiges Backup-Format.'
          });
          return;
        }

        const client = initSupabase();
        if (!client) {
          resolve({
            success: false,
            documentsRestored: 0,
            error: 'Supabase nicht konfiguriert.'
          });
          return;
        }

        // Restore settings first
        const { error: settingsError } = await client
          .from('app_settings')
          .upsert({
            id: 'global',
            settings_data: backup.settings,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });

        if (settingsError) {
          resolve({
            success: false,
            documentsRestored: 0,
            error: `Fehler beim Wiederherstellen der Einstellungen: ${settingsError.message}`
          });
          return;
        }

        // Restore documents
        let restoredCount = 0;
        for (const doc of backup.documents) {
          const supabaseDoc = {
            id: doc.id,
            file_data: doc.previewUrl?.split(',')[1] || '',
            file_name: doc.fileName,
            file_type: doc.fileType,
            lieferant_name: doc.data?.lieferantName || null,
            lieferant_adresse: doc.data?.lieferantAdresse || null,
            beleg_datum: doc.data?.belegDatum || null,
            brutto_betrag: doc.data?.bruttoBetrag || null,
            mwst_betrag: (doc.data?.mwstBetrag19 || 0) + (doc.data?.mwstBetrag7 || 0) + (doc.data?.mwstBetrag0 || 0),
            mwst_satz: doc.data?.mwstSatz19 || null,
            steuerkategorie: doc.data?.steuerkategorie || null,
            skr03_konto: doc.data?.konto_skr03 || null,
            line_items: doc.data?.lineItems || null,
            status: doc.status,
            score: doc.data?.ocr_score || null,
            created_at: doc.uploadDate
          };

          const { error: docError } = await client
            .from('belege')
            .upsert(supabaseDoc, { onConflict: 'id' });

          if (!docError) {
            restoredCount++;
          }
        }

        resolve({
          success: true,
          documentsRestored: restoredCount
        });

      } catch (err) {
        resolve({
          success: false,
          documentsRestored: 0,
          error: `Fehler beim Parsen der Backup-Datei: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        documentsRestored: 0,
        error: 'Fehler beim Lesen der Datei.'
      });
    };

    reader.readAsText(file);
  });
};
