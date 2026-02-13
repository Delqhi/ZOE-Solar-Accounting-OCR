/**
 * 🔱 ULTRA 2026 - Type Guards & Validation
 * Zero-cost abstractions with runtime + compile-time safety
 */

import { z } from 'zod';
import { DocumentSchema, type Document, type DocumentId, type UserId, type Money, type Email } from '../../ULTRA_UPGRADE_2026';

// ============================================================================
// 🎯 VIEW MODE - Database display modes
// ============================================================================

export type ViewMode = 'grid' | 'list';

// ============================================================================
// 🎯 BRANDED TYPE GUARDS - Zero-cost validation
// ============================================================================

export function isDocumentId(value: unknown): value is DocumentId {
  return typeof value === 'string' && value.length > 0;
}

export function isUserId(value: unknown): value is UserId {
  return typeof value === 'string' && value.length > 0;
}

export function isMoney(value: unknown): value is Money {
  return (
    typeof value === 'number' &&
    value >= 0 &&
    value <= 1000000 &&
    Number.isFinite(value)
  );
}

export function isEmail(value: unknown): value is Email {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// ============================================================================
// 🛡️ DOCUMENT VALIDATION - Runtime + Compile-time
// ============================================================================

export function isDocument(data: unknown): data is Document {
  return DocumentSchema.safeParse(data).success;
}

export function validateDocument(data: unknown): { success: true; data: Document } | { success: false; error: z.ZodError } {
  const result = DocumentSchema.safeParse(data);
  return result.success ? { success: true, data: result.data } : { success: false, error: result.error };
}

// ============================================================================
// 💰 MONEY VALIDATION - Financial safety
// ============================================================================

export function validateMoney(value: unknown): { success: true; data: Money } | { success: false; error: string } {
  if (typeof value !== 'number') {
    return { success: false, error: 'Must be a number' };
  }
  if (!Number.isFinite(value)) {
    return { success: false, error: 'Must be finite' };
  }
  if (value < 0) {
    return { success: false, error: 'Must be non-negative' };
  }
  if (value > 1000000) {
    return { success: false, error: 'Exceeds maximum allowed (1,000,000)' };
  }
  return { success: true, data: value as Money };
}

// ============================================================================
// 📧 EMAIL VALIDATION - Zero-trust
// ============================================================================

export function validateEmail(value: unknown): { success: true; data: Email } | { success: false; error: string } {
  if (typeof value !== 'string') {
    return { success: false, error: 'Must be a string' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return { success: false, error: 'Invalid email format' };
  }
  return { success: true, data: value as Email };
}

// ============================================================================
// 🆔 UUID VALIDATION - Document & User IDs
// ============================================================================

export function isValidUUID(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export function validateDocumentId(value: unknown): { success: true; data: DocumentId } | { success: false; error: string } {
  if (typeof value !== 'string') {
    return { success: false, error: 'Must be a string' };
  }
  if (!isValidUUID(value)) {
    return { success: false, error: 'Invalid UUID format' };
  }
  return { success: true, data: value as DocumentId };
}

export function validateUserId(value: unknown): { success: true; data: UserId } | { success: false; error: string } {
  if (typeof value !== 'string') {
    return { success: false, error: 'Must be a string' };
  }
  if (!isValidUUID(value)) {
    return { success: false, error: 'Invalid UUID format' };
  }
  return { success: true, data: value as UserId };
}

// ============================================================================
// 📋 IBAN VALIDATION - Financial compliance
// ============================================================================

export function validateIBAN(iban: unknown): { success: true; data: string } | { success: false; error: string } {
  if (typeof iban !== 'string') {
    return { success: false, error: 'Must be a string' };
  }
  
  const cleaned = iban.replace(/\s/g, '');
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{4,}$/.test(cleaned)) {
    return { success: false, error: 'Invalid IBAN format' };
  }
  
  return { success: true, data: cleaned };
}

// ============================================================================
// 🧾 DOCUMENT TYPE VALIDATION - German accounting types
// ============================================================================

const VALID_DOCUMENT_TYPES = ['RECHNUNG', 'QUITTUNG', 'KAUFBELEG', 'LOHNABRECHNUNG'] as const;

export function isValidDocumentType(value: unknown): value is typeof VALID_DOCUMENT_TYPES[number] {
  return typeof value === 'string' && VALID_DOCUMENT_TYPES.includes(value as any);
}

export function validateDocumentType(value: unknown): { success: true; data: typeof VALID_DOCUMENT_TYPES[number] } | { success: false; error: string } {
  if (!isValidDocumentType(value)) {
    return { success: false, error: `Must be one of: ${VALID_DOCUMENT_TYPES.join(', ')}` };
  }
  return { success: true, data: value };
}

// ============================================================================
// 📄 FILE VALIDATION - Upload safety
// ============================================================================

const VALID_FILE_TYPES = ['pdf', 'png', 'jpg', 'jpeg'] as const;
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function isValidFileType(value: unknown): value is typeof VALID_FILE_TYPES[number] {
  return typeof value === 'string' && VALID_FILE_TYPES.includes(value as any);
}

export function validateFileUpload(file: File): { success: true; data: { type: typeof VALID_FILE_TYPES[number]; size: number } } | { success: false; error: string } {
  // Check file type
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !VALID_FILE_TYPES.includes(extension as any)) {
    return { success: false, error: `Invalid file type. Allowed: ${VALID_FILE_TYPES.join(', ')}` };
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: `File too large. Max: ${MAX_FILE_SIZE / (1024 * 1024)}MB` };
  }
  
  return { success: true, data: { type: extension as typeof VALID_FILE_TYPES[number], size: file.size } };
}

// ============================================================================
// 🔍 SANITIZATION - XSS prevention
// ============================================================================

export function sanitizeHTML(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[<>:"/\\|?*]/g, '_').substring(0, 255);
}

// ============================================================================
// ✅ COMPOSITE VALIDATORS - Complex rules
// ============================================================================

export function validateDocumentInput(input: any): { success: true; data: Partial<Document> } | { success: false; errors: string[] } {
  const errors: string[] = [];
  
  // Validate fileName
  if (!input.fileName || typeof input.fileName !== 'string') {
    errors.push('fileName is required and must be a string');
  } else if (input.fileName.length < 1 || input.fileName.length > 500) {
    errors.push('fileName must be between 1 and 500 characters');
  }
  
  // Validate fileType
  if (!isValidFileType(input.fileType)) {
    errors.push(`fileType must be one of: ${VALID_FILE_TYPES.join(', ')}`);
  }
  
  // Validate fileSize
  if (typeof input.fileSize !== 'number' || input.fileSize < 0 || input.fileSize > MAX_FILE_SIZE) {
    errors.push(`fileSize must be between 0 and ${MAX_FILE_SIZE} bytes`);
  }
  
  // Validate documentDate
  if (!input.documentDate || isNaN(Date.parse(input.documentDate))) {
    errors.push('documentDate is required and must be a valid date');
  }
  
  // Validate type
  if (!isValidDocumentType(input.type)) {
    errors.push(`type must be one of: ${VALID_DOCUMENT_TYPES.join(', ')}`);
  }
  
  // Validate amounts
  const totalResult = validateMoney(input.totalAmount);
  if (!totalResult.success) errors.push(`totalAmount: ${totalResult.error}`);
  
  const vatResult = validateMoney(input.vatAmount);
  if (!vatResult.success) errors.push(`vatAmount: ${vatResult.error}`);
  
  const netResult = validateMoney(input.netAmount);
  if (!netResult.success) errors.push(`netAmount: ${netResult.error}`);
  
  // Validate creditor
  if (!input.creditor || typeof input.creditor !== 'string') {
    errors.push('creditor is required and must be a string');
  } else if (input.creditor.length < 1 || input.creditor.length > 200) {
    errors.push('creditor must be between 1 and 200 characters');
  }
  
  // Validate vatRate
  if (typeof input.vatRate !== 'number' || input.vatRate < 0 || input.vatRate > 100) {
    errors.push('vatRate must be between 0 and 100');
  }
  
  // Optional: IBAN
  if (input.iban) {
    const ibanResult = validateIBAN(input.iban);
    if (!ibanResult.success) errors.push(`iban: ${ibanResult.error}`);
  }
  
  if (errors.length > 0) {
    return { success: false, errors };
  }
  
  return { success: true, data: input };
}

// ============================================================================
// 🎯 BATCH VALIDATION - Multiple documents
// ============================================================================

export function validateDocumentsBatch(documents: unknown[]): { valid: Document[]; invalid: Array<{ data: unknown; errors: string[] }> } {
  const valid: Document[] = [];
  const invalid: Array<{ data: unknown; errors: string[] }> = [];
  
  for (const doc of documents) {
    const result = validateDocument(doc);
    if (result.success) {
      valid.push(result.data);
    } else {
      invalid.push({
        data: doc,
        errors: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
      });
    }
  }
  
  return { valid, invalid };
}