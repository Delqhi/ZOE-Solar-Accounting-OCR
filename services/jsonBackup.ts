/**
 * JSON Backup Service for ZOE Solar Accounting OCR
 * Enables export and import of complete backups in JSON format
 */

import { DocumentRecord, AppSettings, VendorRule } from '../types';
import * as storageService from './storageService';

export interface BackupData {
  version: string;
  timestamp: string;
  documents: DocumentRecord[];
  settings: AppSettings | null;
  vendorRules: VendorRule[];
  metadata: BackupMetadata;
}

export interface BackupMetadata {
  totalDocuments: number;
  totalPrivateDocuments: number;
  yearRange: { min: number; max: number } | null;
  totalAmount: number;
}

export interface RestoreResult {
  success: boolean;
  documentsImported: number;
  settingsRestored: boolean;
  vendorRulesImported: number;
  errors: string[];
}

/**
 * Create a complete backup of all data
 */
export const createBackup = async (): Promise<BackupData> => {
  const [documents, settings, vendorRules, privateDocs] = await Promise.all([
    storageService.getAllDocuments(),
    storageService.getSettings(),
    storageService.getAllVendorRules(),
    storageService.getAllPrivateDocuments()
  ]);

  // Calculate metadata
  const years = new Set<number>();
  let totalAmount = 0;

  for (const doc of documents) {
    if (doc.data?.belegDatum) {
      const year = parseInt(doc.data.belegDatum.substring(0, 4), 10);
      if (!isNaN(year)) {
        years.add(year);
      }
    }
    if (doc.data?.bruttoBetrag) {
      totalAmount += doc.data.bruttoBetrag;
    }
  }

  const yearArray = Array.from(years).sort();
  const yearRange = yearArray.length > 0
    ? { min: yearArray[0], max: yearArray[yearArray.length - 1] }
    : null;

  return {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    documents,
    settings,
    vendorRules,
    metadata: {
      totalDocuments: documents.length,
      totalPrivateDocuments: privateDocs.length,
      yearRange,
      totalAmount: Math.round(totalAmount * 100) / 100
    }
  };
};

/**
 * Export backup to JSON string
 */
export const exportToJSON = async (pretty: boolean = true): Promise<string> => {
  const backup = await createBackup();
  return pretty
    ? JSON.stringify(backup, null, 2)
    : JSON.stringify(backup);
};

/**
 * Download backup as file
 */
export const downloadBackup = async (fileName?: string): Promise<void> => {
  const json = await exportToJSON(true);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const name = fileName || `zoe_backup_${timestamp}.json`;

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Parse JSON backup file
 */
export const parseBackupJSON = (jsonString: string): BackupData | null => {
  try {
    const data = JSON.parse(jsonString) as BackupData;

    // Validate basic structure
    if (!data.version || !data.timestamp || !Array.isArray(data.documents)) {
      throw new Error('Invalid backup format: missing required fields');
    }

    return data;
  } catch (e) {
    console.error('Failed to parse backup JSON:', e);
    return null;
  }
};

/**
 * Restore backup from JSON string
 */
export const importFromJSON = async (jsonString: string): Promise<RestoreResult> => {
  const result: RestoreResult = {
    success: false,
    documentsImported: 0,
    settingsRestored: false,
    vendorRulesImported: 0,
    errors: []
  };

  const backup = parseBackupJSON(jsonString);
  if (!backup) {
    result.errors.push('Ungültiges Backup-Format');
    return result;
  }

  try {
    // Import settings first
    if (backup.settings) {
      await storageService.saveSettings(backup.settings);
      result.settingsRestored = true;
    }

    // Import vendor rules
    for (const rule of backup.vendorRules) {
      try {
        await storageService.saveVendorRule(
          rule.vendorName,
          rule.accountId || '',
          rule.taxCategoryValue || ''
        );
        result.vendorRulesImported++;
      } catch (e) {
        result.errors.push(`Vendor-Regel "${rule.vendorName}" konnte nicht importiert werden`);
      }
    }

    // Import documents
    for (const doc of backup.documents) {
      try {
        await storageService.saveDocument(doc);
        result.documentsImported++;
      } catch (e) {
        result.errors.push(`Dokument "${doc.fileName}" konnte nicht importiert werden`);
      }
    }

    // Import private documents if present in metadata
    if (backup.metadata.totalPrivateDocuments > 0) {
      // Private docs are stored separately and should be re-OCR'd if needed
      result.errors.push('Private Dokumente müssen manuell neu hochgeladen werden');
    }

    result.success = result.errors.length === 0;
    return result;
  } catch (e) {
    result.errors.push(e instanceof Error ? e.message : 'Unbekannter Fehler beim Import');
    return result;
  }
};

/**
 * Upload and restore backup from file
 */
export const uploadAndRestoreBackup = async (file: File): Promise<RestoreResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const json = e.target?.result as string;
        const result = await importFromJSON(json);
        resolve(result);
      } catch (e) {
        reject(e);
      }
    };

    reader.onerror = () => {
      reject(new Error('Datei konnte nicht gelesen werden'));
    };

    reader.readAsText(file);
  });
};

/**
 * Get backup preview (without full data)
 */
export const getBackupPreview = async (): Promise<{
  documentCount: number;
  yearRange: { min: number; max: number } | null;
  totalAmount: number;
  settingsExist: boolean;
  hasVendorRules: boolean;
}> => {
  const [documents, settings, vendorRules] = await Promise.all([
    storageService.getAllDocuments(),
    storageService.getSettings(),
    storageService.getAllVendorRules()
  ]);

  const years = new Set<number>();
  let totalAmount = 0;

  for (const doc of documents) {
    if (doc.data?.belegDatum) {
      const year = parseInt(doc.data.belegDatum.substring(0, 4), 10);
      if (!isNaN(year)) {
        years.add(year);
      }
    }
    if (doc.data?.bruttoBetrag) {
      totalAmount += doc.data.bruttoBetrag;
    }
  }

  const yearArray = Array.from(years).sort();

  return {
    documentCount: documents.length,
    yearRange: yearArray.length > 0
      ? { min: yearArray[0], max: yearArray[yearArray.length - 1] }
      : null,
    totalAmount: Math.round(totalAmount * 100) / 100,
    settingsExist: !!settings,
    hasVendorRules: vendorRules.length > 0
  };
};

/**
 * Validate backup file before import
 */
export const validateBackupFile = async (file: File): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const json = e.target?.result as string;
        const backup = parseBackupJSON(json);

        if (!backup) {
          errors.push('Ungültiges JSON-Format');
          resolve({ valid: false, errors, warnings });
          return;
        }

        // Check version
        const versionParts = backup.version.split('.').map(Number);
        if (versionParts[0] > 1) {
          warnings.push('Diese Backup-Version ist neuer als unterstützt. Einige Daten könnten fehlen.');
        }

        // Check for large document count
        if (backup.documents.length > 1000) {
          warnings.push('Das Backup enthält über 1000 Dokumente. Der Import kann einige Zeit dauern.');
        }

        // Check for documents with missing critical data
        let incompleteDocs = 0;
        for (const doc of backup.documents) {
          if (!doc.data?.belegDatum || !doc.data?.lieferantName) {
            incompleteDocs++;
          }
        }
        if (incompleteDocs > 0) {
          warnings.push(`${incompleteDocs} Dokumente haben unvollständige Daten.`);
        }

        resolve({
          valid: errors.length === 0,
          errors,
          warnings
        });
      } catch (e) {
        reject(e);
      }
    };

    reader.onerror = () => {
      errors.push('Datei konnte nicht gelesen werden');
      resolve({ valid: false, errors, warnings });
    };

    reader.readAsText(file);
  });
};
