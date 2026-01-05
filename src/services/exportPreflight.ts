/**
 * Export Preflight Service
 * Validates documents before export to ELSTER or DATEV
 */

import { DocumentRecord, AppSettings, ValidationResult } from '../types';
import { validateDocumentData, validateExportData } from './validation';

/**
 * Runs preflight checks before export
 */
export function runExportPreflight(
  documents: DocumentRecord[],
  format: 'ELSTER' | 'DATEV',
  settings: AppSettings
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Check if documents exist
  if (!documents || documents.length === 0) {
    result.isValid = false;
    result.errors.push('Keine Dokumente zum Export ausgewählt');
    return result;
  }

  // Validate each document
  for (const doc of documents) {
    if (!doc.data) {
      result.isValid = false;
      result.errors.push(`Dokument ${doc.fileName}: Keine Daten extrahiert`);
      continue;
    }

    const docValidation = validateDocumentData(doc.data);
    if (!docValidation.isValid) {
      result.isValid = false;
      result.errors.push(
        `Dokument ${doc.fileName}: ${docValidation.errors.join(', ')}`
      );
    }

    if (docValidation.warnings.length > 0) {
      result.warnings.push(
        `Dokument ${doc.fileName}: ${docValidation.warnings.join(', ')}`
      );
    }
  }

  // Format-specific checks
  const formatValidation = validateExportData(documents, format);
  if (!formatValidation.isValid) {
    result.isValid = false;
    result.errors.push(...formatValidation.errors);
  }

  if (formatValidation.warnings.length > 0) {
    result.warnings.push(...formatValidation.warnings);
  }

  // Additional ELSTER checks
  if (format === 'ELSTER') {
    const elsterResult = runElsterPreflight(documents, settings);
    if (!elsterResult.isValid) {
      result.isValid = false;
      result.errors.push(...elsterResult.errors);
    }
    result.warnings.push(...elsterResult.warnings);
  }

  // Additional DATEV checks
  if (format === 'DATEV') {
    const datevResult = runDatevPreflight(documents, settings);
    if (!datevResult.isValid) {
      result.isValid = false;
      result.errors.push(...datevResult.errors);
    }
    result.warnings.push(...datevResult.warnings);
  }

  return result;
}

/**
 * ELSTER-specific preflight checks
 */
export function runElsterPreflight(
  documents: DocumentRecord[],
  settings: AppSettings
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Check for required ELSTER settings
  if (!settings.elsterStammdaten) {
    result.isValid = false;
    result.errors.push('ELSTER Stammdaten nicht konfiguriert');
  } else {
    const stammdaten = settings.elsterStammdaten;

    if (!stammdaten.unternehmensName) {
      result.errors.push('Unternehmensname fehlt in ELSTER Stammdaten');
    }

    if (!stammdaten.eigeneSteuernummer) {
      result.errors.push('Steuernummer fehlt in ELSTER Stammdaten');
    }

    if (!stammdaten.land || !stammdaten.plz || !stammdaten.ort) {
      result.errors.push('Adresse (Land/PLZ/Ort) unvollständig in ELSTER Stammdaten');
    }
  }

  // Check for 0% tax documents
  const zeroTaxDocs = documents.filter(d => {
    const data = d.data;
    if (!data) return false;
    const taxAmount = (data.mwstBetrag19 || 0) + (data.mwstBetrag7 || 0);
    return taxAmount === 0;
  });

  if (zeroTaxDocs.length > 0) {
    result.warnings.push(
      `${zeroTaxDocs.length} Dokument(e) mit 0% Steuer - prüfen Sie Berechtigung für Vorsteuerabzug`
    );
  }

  // Check for reverse charge documents
  const rcDocs = documents.filter(d => d.data?.reverseCharge);
  if (rcDocs.length > 0) {
    result.warnings.push(
      `${rcDocs.length} Reverse Charge Dokument(e) - sicherstellen, dass ELSTER korrekt konfiguriert ist`
    );
  }

  // Check date range
  const dates = documents
    .map(d => d.data?.belegDatum)
    .filter(Boolean)
    .map(d => new Date(d as string));

  if (dates.length > 0) {
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    // Check if all dates are in same quarter
    const quarter = (date: Date) => Math.floor(date.getMonth() / 3);
    const quarters = dates.map(quarter);
    const uniqueQuarters = [...new Set(quarters)];

    if (uniqueQuarters.length > 1) {
      result.warnings.push(
        'Dokumente aus verschiedenen Quartalen - ELSTER meldet pro Quartal'
      );
    }
  }

  return result;
}

/**
 * DATEV-specific preflight checks
 */
export function runDatevPreflight(
  documents: DocumentRecord[],
  settings: AppSettings
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Check for required DATEV settings
  if (!settings.datevConfig) {
    result.isValid = false;
    result.errors.push('DATEV Konfiguration nicht vorhanden');
  } else {
    const config = settings.datevConfig;

    if (!config.beraterNr || !config.mandantNr) {
      result.errors.push('Berater- oder Mandantennummer fehlt');
    }

    if (!config.wirtschaftsjahrBeginn) {
      result.errors.push('Wirtschaftsjahr Beginn fehlt');
    }

    if (!config.sachkontenlaenge) {
      result.errors.push('Sachkontenlänge fehlt');
    }
  }

  // Check for missing SKR03 accounts
  const missingAccounts = documents.filter(d => {
    const data = d.data;
    if (!data) return true;
    const account = data.konto_skr03 || data.kontierungskonto;
    return !account || account === '';
  });

  if (missingAccounts.length > 0) {
    result.isValid = false;
    result.errors.push(
      `${missingAccounts.length} Dokument(e) ohne SKR03 Konto - Zuordnung erforderlich`
    );
  }

  // Check for invalid account numbers
  const invalidAccounts = documents.filter(d => {
    const data = d.data;
    if (!data) return false;
    const account = data.konto_skr03 || data.kontierungskonto;
    return account && !/^\d{4}$/.test(account);
  });

  if (invalidAccounts.length > 0) {
    result.isValid = false;
    result.errors.push(
      `${invalidAccounts.length} Dokument(e) mit ungültigen SKR03 Kontonummern`
    );
  }

  // Check for missing tax categories
  const missingTaxCats = documents.filter(d => {
    const data = d.data;
    if (!data) return true;
    return !data.steuerkategorie;
  });

  if (missingTaxCats.length > 0) {
    result.warnings.push(
      `${missingTaxCats.length} Dokument(e) ohne Steuerkategorie - wird als Standard exportiert`
    );
  }

  // Check for duplicate invoice numbers
  const invoiceNumbers = documents
    .map(d => d.data?.belegNummerLieferant)
    .filter(Boolean) as string[];

  const duplicates = invoiceNumbers.filter(
    (item, index) => invoiceNumbers.indexOf(item) !== index
  );

  if (duplicates.length > 0) {
    result.warnings.push(
      `Doppelte Belegnummern gefunden: ${[...new Set(duplicates)].join(', ')}`
    );
  }

  return result;
}

/**
 * Formats preflight result for dialog display
 */
export function formatPreflightForDialog(
  preflight: ValidationResult
): {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'success';
  details: string[];
} {
  if (!preflight.isValid) {
    return {
      title: 'Export gestoppt',
      message: 'Es wurden kritische Fehler gefunden. Bitte korrigieren Sie diese vor dem Export.',
      type: 'error',
      details: preflight.errors,
    };
  }

  if (preflight.warnings.length > 0) {
    return {
      title: 'Export mit Warnungen',
      message: 'Der Export kann fortgesetzt werden, aber bitte prüfen Sie die Warnungen.',
      type: 'warning',
      details: preflight.warnings,
    };
  }

  return {
    title: 'Export freigegeben',
    message: 'Alle Prüfungen erfolgreich. Der Export kann durchgeführt werden.',
    type: 'success',
    details: [],
  };
}

/**
 * Validates a single document for export readiness
 */
export function validateDocumentForExport(
  doc: DocumentRecord,
  format: 'ELSTER' | 'DATEV'
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!doc.data) {
    errors.push('Keine Daten');
    return { isValid: false, errors, warnings };
  }

  // Required fields for both formats
  const required = ['lieferantName', 'nettoBetrag', 'bruttoBetrag', 'belegDatum'];
  for (const field of required) {
    if (!doc.data[field as keyof typeof doc.data]) {
      errors.push(`Feld "${field}" fehlt`);
    }
  }

  // Format-specific requirements
  if (format === 'DATEV') {
    if (!doc.data.konto_skr03 && !doc.data.kontierungskonto) {
      errors.push('SKR03 Konto fehlt');
    }
  }

  if (format === 'ELSTER') {
    if ((doc.data.mwstBetrag19 || 0) === 0 && (doc.data.mwstBetrag7 || 0) === 0) {
      warnings.push('0% Steuer - prüfen Berechtigung');
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}
