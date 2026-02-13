/**
 * 🔱 ULTRA 2026 - Input Validation Middleware
 * Zero-trust architecture with comprehensive sanitization
 */

import { validateDocumentInput, sanitizeHTML, validateIBAN, validateMoney } from '@/lib/ultra';
import { type Document, type UserId } from '@/lib/ultra';

export interface ValidationOptions {
  sanitize?: boolean;
  validateIBAN?: boolean;
  validateMoney?: boolean;
  maxFileSize?: number;
}

export class ValidationMiddleware {
  /**
   * Sanitize and validate document upload input
   */
  static validateDocumentUpload(input: any, options: ValidationOptions = {}): {
    success: true;
    data: Partial<Document>;
  } | {
    success: false;
    errors: string[];
  } {
    const errors: string[] = [];
    const sanitized = { ...input };

    // Sanitize all string fields
    if (options.sanitize !== false) {
      if (sanitized.fileName) {
        sanitized.fileName = sanitizeHTML(sanitized.fileName);
      }
      if (sanitized.creditor) {
        sanitized.creditor = sanitizeHTML(sanitized.creditor);
      }
      if (sanitized.description) {
        sanitized.description = sanitizeHTML(sanitized.description);
      }
    }

    // Validate IBAN if present
    if (options.validateIBAN && sanitized.iban) {
      if (!validateIBAN(sanitized.iban)) {
        errors.push('Invalid IBAN format');
      }
    }

    // Validate money amounts
    if (options.validateMoney) {
      if (sanitized.totalAmount && !validateMoney(sanitized.totalAmount)) {
        errors.push('Invalid total amount');
      }
      if (sanitized.vatAmount && !validateMoney(sanitized.vatAmount)) {
        errors.push('Invalid VAT amount');
      }
      if (sanitized.netAmount && !validateMoney(sanitized.netAmount)) {
        errors.push('Invalid net amount');
      }
    }

    // Validate file size
    if (options.maxFileSize && sanitized.fileSize > options.maxFileSize) {
      errors.push(`File size exceeds ${options.maxFileSize} bytes`);
    }

    // Validate document type
    const validTypes = ['RECHNUNG', 'QUITTUNG', 'KAUFBELEG', 'LOHNABRECHNUNG'];
    if (sanitized.type && !validTypes.includes(sanitized.type)) {
      errors.push('Invalid document type');
    }

    // Validate file type
    const validFileTypes = ['pdf', 'png', 'jpg', 'jpeg'];
    if (sanitized.fileType && !validFileTypes.includes(sanitized.fileType)) {
      errors.push('Invalid file type');
    }

    // Validate VAT rate
    if (sanitized.vatRate && (sanitized.vatRate < 0 || sanitized.vatRate > 100)) {
      errors.push('Invalid VAT rate');
    }

    // Validate dates
    if (sanitized.documentDate) {
      const date = new Date(sanitized.documentDate);
      if (isNaN(date.getTime())) {
        errors.push('Invalid document date');
      }
    }

    return errors.length > 0
      ? { success: false, errors }
      : { success: true, data: sanitized };
  }

  /**
   * Sanitize user input for display
   */
  static sanitizeForDisplay(input: string): string {
    return sanitizeHTML(input);
  }

  /**
   * Validate batch document uploads
   */
  static validateBatchUpload(documents: any[], userId: UserId): {
    success: true;
    valid: Partial<Document>[];
    invalid: Array<{ data: any; errors: string[] }>;
  } | {
    success: false;
    errors: string[];
  } {
    if (!Array.isArray(documents)) {
      return { success: false, errors: ['Input must be an array'] };
    }

    const valid: Partial<Document>[] = [];
    const invalid: Array<{ data: any; errors: string[] }> = [];

    for (const doc of documents) {
      const result = this.validateDocumentUpload(doc, {
        sanitize: true,
        validateIBAN: true,
        validateMoney: true,
        maxFileSize: 100 * 1024 * 1024, // 100MB
      });

      if (result.success) {
        valid.push({ ...result.data, userId });
      } else {
        invalid.push({ data: doc, errors: result.errors });
      }
    }

    return {
      success: true,
      valid,
      invalid,
    };
  }

  /**
   * Validate API request payload
   */
  static validateApiPayload(payload: any, schema: any): {
    success: true;
    data: any;
  } | {
    success: false;
    error: string;
  } {
    const result = schema.safeParse(payload);

    if (!result.success) {
      return {
        success: false,
        error: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }

    return { success: true, data: result.data };
  }

  /**
   * Rate limiting helper
   */
  static checkRateLimit(userId: string, windowMs: number = 60000): boolean {
    const key = `rate_limit:${userId}`;
    const now = Date.now();
    const request = {
      timestamp: now,
      count: 1,
    };

    // In production, this would use Redis or similar
    // For now, we'll use localStorage (client-side) or memory (server-side)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        if (now - data.timestamp < windowMs) {
          if (data.count >= 10) { // 10 requests per minute
            return false;
          }
          data.count++;
          localStorage.setItem(key, JSON.stringify(data));
          return true;
        }
      }
      localStorage.setItem(key, JSON.stringify(request));
      return true;
    }

    return true; // Server-side would need proper implementation
  }
}

/**
 * Express-style middleware for validation
 */
export function createValidationMiddleware(options: ValidationOptions = {}) {
  return (req: any, res: any, next: () => void) => {
    const result = ValidationMiddleware.validateDocumentUpload(req.body, options);

    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.errors,
      });
    }

    req.validated = result.data;
    next();
  };
}

/**
 * Batch validation middleware
 */
export function createBatchValidationMiddleware(userId: UserId) {
  return (req: any, res: any, next: () => void) => {
    const result = ValidationMiddleware.validateBatchUpload(req.body.documents, userId);

    if (!result.success) {
      return res.status(400).json({
        error: 'Batch validation failed',
        details: result.errors,
      });
    }

    req.validated = {
      valid: result.valid,
      invalid: result.invalid,
    };
    next();
  };
}
