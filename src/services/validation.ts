/**
 * Validation Service
 * Input validation and sanitization
 */

// ==================== File Validation ====================

export function validateFileSize(file: File, maxSizeMB: number = 50): boolean {
  const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
  return file.size <= maxSize;
}

export function validateFileType(file: File): boolean {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];
  return allowedTypes.includes(file.type);
}

export function validateFileCount(files: FileList, maxCount: number = 10): boolean {
  return files.length <= maxCount;
}

// ==================== Text Validation & Sanitization ====================

export function sanitizeUserInput(input: string): string {
  if (!input) return '';

  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent XSS
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+="/g, '') // Remove event handlers
    .trim();
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with _
    .replace(/_+/g, '_') // Collapse multiple underscores
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .substring(0, 100); // Limit length
}

// ==================== Financial Validation ====================

export function validateAmount(amount: number): boolean {
  return !isNaN(amount) && amount >= 0 && amount < 999999999.99;
}

export function validateTaxRate(rate: number): boolean {
  return [0, 7, 19].includes(rate);
}

export function validateSumCheck(netto: number, mwst: number, brutto: number, tolerance: number = 0.01): boolean {
  const calculated = netto + mwst;
  return Math.abs(calculated - brutto) <= tolerance;
}

export function validateIBAN(iban: string): boolean {
  const cleaned = iban.replace(/\s/g, '');
  return /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,}$/.test(cleaned) && cleaned.length >= 15;
}

export function validateVATNumber(vat: string): boolean {
  // German VAT number format: DE123456789
  return /^DE\d{9}$/.test(vat);
}

// ==================== Date Validation ====================

export function isIsoDate(str: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(str);
}

export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString === date.toISOString().split('T')[0];
}

export function validateDateRange(start: string, end: string): boolean {
  if (!isValidDate(start) || !isValidDate(end)) return false;
  return new Date(start) <= new Date(end);
}

// ==================== Account & SKR03 Validation ====================

export function validateSKR03Account(account: string): boolean {
  // SKR03 accounts are 4 digits
  return /^\d{4}$/.test(account);
}

export function validateZOEId(id: string): boolean {
  // Format: ZOEYYMM.XXX (e.g., ZOE2601.001)
  return /^ZOE\d{6}\.\d{3}$/.test(id);
}

// ==================== String Helpers ====================

export function isEmpty(str: string | null | undefined): boolean {
  return !str || str.trim().length === 0;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

// ==================== Missing Exports for Compatibility ====================

export function isPresent(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '';
}

export function getErrorNextSteps(errorType: string): string[] {
  const steps = {
    'api_key': ['Check environment variables', 'Verify API key is valid', 'Regenerate API key if needed'],
    'network': ['Check internet connection', 'Verify firewall settings', 'Try again in a moment'],
    'validation': ['Review input data', 'Check required fields', 'Verify data formats'],
    'default': ['Try again', 'Contact support if issue persists', 'Check logs for details']
  };
  return steps[errorType as keyof typeof steps] || steps.default;
}

// ==================== Complex Object Validation ====================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateDocumentData(data: unknown): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Required fields
  const required = ['lieferantName', 'nettoBetrag', 'bruttoBetrag', 'belegDatum', 'kontierungskonto'];
  for (const field of required) {
    if (!data[field]) {
      result.isValid = false;
      result.errors.push(`Feld "${field}" ist erforderlich`);
    }
  }

  // Type checks
  if (data.nettoBetrag && !validateAmount(data.nettoBetrag)) {
    result.isValid = false;
    result.errors.push('Ungültiger Nettobetrag');
  }

  if (data.kontierungskonto && !validateSKR03Account(data.kontierungskonto)) {
    result.isValid = false;
    result.errors.push('Ungültiges SKR03 Konto');
  }

  // Sum check
  if (data.nettoBetrag && data.mwstBetrag19 && data.bruttoBetrag) {
    if (!validateSumCheck(data.nettoBetrag, data.mwstBetrag19, data.bruttoBetrag)) {
      result.warnings.push('Summenprüfung fehlgeschlagen (Netto + MwSt ≠ Brutto)');
    }
  }

  return result;
}

// ==================== Export Validation ====================

export function validateExportData(documents: any[], format: string): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  if (documents.length === 0) {
    result.isValid = false;
    result.errors.push('Keine Dokumente zum Export ausgewählt');
  }

  // ELSTER specific
  if (format === 'ELSTER') {
    if (documents.some(d => !d.data?.steuerkategorie || d.data.steuerkategorie === '0')) {
      result.warnings.push('Einige Dokumente haben 0% Steuer - prüfen Sie Berechtigung');
    }
  }

  // DATEV specific
  if (format === 'DATEV') {
    documents.forEach((doc, index) => {
      if (!doc.data?.kontierungskonto || !validateSKR03Account(doc.data?.kontierungskonto)) {
        result.errors.push(`Dokument ${index + 1}: Fehlendes/ungültiges Konto`);
      }
    });
  }

  return result;
}

// ==================== Bulk Validation ====================

export function validateBatchUpload(files: FileList): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Check count
  if (!validateFileCount(files)) {
    result.isValid = false;
    result.errors.push('Maximal 10 Dateien auf einmal erlaubt');
  }

  // Check individual files
  Array.from(files).forEach((file, index) => {
    if (!validateFileType(file)) {
      result.isValid = false;
      result.errors.push(`Datei ${index + 1}: Ungültiger Dateityp`);
    }

    if (!validateFileSize(file)) {
      result.isValid = false;
      result.errors.push(`Datei ${index + 1}: Datei zu groß (>50MB)`);
    }

    // Warning for large files
    if (file.size > 10 * 1024 * 1024) {
      result.warnings.push(`Datei ${index + 1}: Großes Datei, Verarbeitung kann länger dauern`);
    }
  });

  return result;
}

// ==================== API Response Validation ====================

export function validateOCRResponse(response: unknown): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  if (!response || typeof response !== 'object') {
    result.isValid = false;
    result.errors.push('Ungültige Antwort vom OCR-Service');
    return result;
  }

  // Check required OCR fields
  const required = ['lieferantName', 'nettoBetrag', 'bruttoBetrag', 'belegDatum'];
  for (const field of required) {
    if (!response[field]) {
      result.warnings.push(`Feld "${field}" fehlt in OCR-Ergebnis`);
    }
  }

  // Quality score
  if (response.quality && response.quality < 5) {
    result.warnings.push('Niedrige Qualitätserkennung - manuelle Prüfung empfohlen');
  }

  return result;
}

// ==================== User Input Validation ====================

export function validateManualInput(input: {
  vendor?: string;
  amountNetto?: string;
  amountMwSt?: string;
  amountBrutto?: string;
  account?: string;
}): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Vendor validation
  if (input.vendor) {
    const sanitized = sanitizeUserInput(input.vendor);
    if (sanitized.length < 2) {
      result.isValid = false;
      result.errors.push('Lieferantname zu kurz');
    }
    if (sanitized.length > 100) {
      result.warnings.push('Lieferantname sehr lang - wird gekürzt');
    }
  }

  // Amount validation
  ['amountNetto', 'amountMwSt', 'amountBrutto'].forEach(field => {
    if (input[field as keyof typeof input]) {
      const num = parseFloat(input[field as keyof typeof input]!);
      if (isNaN(num) || num < 0) {
        result.isValid = false;
        result.errors.push(`Ungültiger Betrag: ${field}`);
      }
    }
  });

  // Account validation
  if (input.account && !validateSKR03Account(input.account)) {
    result.isValid = false;
    result.errors.push('Ungültiges SKR03 Konto (4 Ziffern)');
  }

  return result;
}
