/**
 * Unit Tests for Input Validation & Security Utilities
 * Tests XSS prevention, injection protection, and data validation
 * Production-ready with 2026 best practices
 */

import { describe, it, expect } from 'vitest';
import {
  validateFiles,
  validateText,
  validateEmail,
  validateApiKey,
  sanitizeText,
  sanitizeFilename,
  validateDocumentData,
  validateRateLimitData,
  validatePagination,
  validateDate,
  validateAmount,
  validateOCRResult,
  validateBatch,
  ValidationResult
} from '../../src/utils/validation';

describe('Validation Utilities', () => {
  describe('validateFiles', () => {
    it('should validate files with correct size and type', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

      const result = validateFiles([file] as any);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitized).toHaveLength(1);
    });

    it('should reject files exceeding max size', () => {
      const file = new File(['content'], 'large.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 100 * 1024 * 1024 }); // 100MB

      const result = validateFiles([file] as any, { maxFileSize: 50 * 1024 * 1024 });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('exceeds max size');
    });

    it('should reject files with unsupported extensions', () => {
      const file = new File(['content'], 'test.exe', { type: 'application/octet-stream' });
      Object.defineProperty(file, 'size', { value: 1024 });

      const result = validateFiles([file] as any);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('unsupported extension');
    });

    it('should warn about unusual MIME types but not reject', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      Object.defineProperty(file, 'size', { value: 1024 });

      const result = validateFiles([file] as any);

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('unsupported type');
    });

    it('should reject too many files', () => {
      const files = Array.from({ length: 21 }, (_, i) => {
        const file = new File(['content'], `test${i}.pdf`, { type: 'application/pdf' });
        Object.defineProperty(file, 'size', { value: 1024 });
        return file;
      });

      const result = validateFiles(files as any, { maxFiles: 20 });

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Max 20 files');
    });

    it('should detect suspicious characters in filenames', () => {
      const file = new File(['content'], 'test<script>.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 1024 });

      const result = validateFiles([file] as any);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('special characters');
    });

    it('should handle empty file list', () => {
      const result = validateFiles([] as any);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitized).toHaveLength(0);
    });

    it('should handle FileList', () => {
      const input = {
        length: 1,
        0: new File(['content'], 'test.pdf', { type: 'application/pdf' })
      };
      Object.defineProperty(input[0], 'size', { value: 1024 });

      const result = validateFiles(input as FileList);

      expect(result.valid).toBe(true);
      expect(result.sanitized).toHaveLength(1);
    });
  });

  describe('validateText', () => {
    it('should accept valid text', () => {
      const result = validateText('Hello, this is a normal text');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitized).toBe('Hello, this is a normal text');
    });

    it('should reject text exceeding max length', () => {
      const longText = 'a'.repeat(10001);
      const result = validateText(longText);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('exceeds maximum length');
    });

    it('should detect XSS - script tag', () => {
      const result = validateText('<script>alert("XSS")</script>');

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('XSS attack');
    });

    it('should detect XSS - javascript: protocol', () => {
      const result = validateText('javascript:alert(1)');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('XSS attack');
    });

    it('should detect XSS - event handlers', () => {
      const result = validateText('<img src=x onerror=alert(1)>');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('XSS attack');
    });

    it('should detect XSS - iframe', () => {
      const result = validateText('<iframe src="evil.com"></iframe>');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('XSS attack');
    });

    it('should detect XSS - object tag', () => {
      const result = validateText('<object data="evil.swf"></object>');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('XSS attack');
    });

    it('should detect XSS - embed tag', () => {
      const result = validateText('<embed src="evil.swf">');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('XSS attack');
    });

    it('should detect XSS - expression', () => {
      const result = validateText('expression(alert(1))');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('XSS attack');
    });

    it('should detect XSS - vbscript', () => {
      const result = validateText('vbscript:msgbox(1)');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('XSS attack');
    });

    it('should detect SQL injection - DROP', () => {
      const result = validateText('users; DROP TABLE users; --');

      expect(result.valid).toBe(true); // Warning only
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('SQL injection');
    });

    it('should detect SQL injection - UNION SELECT', () => {
      const result = validateText('UNION SELECT * FROM users');

      expect(result.warnings).toContain('SQL injection');
    });

    it('should detect SQL injection - comment', () => {
      const result = validateText('1 -- comment');

      expect(result.warnings).toContain('SQL injection');
    });

    it('should detect SQL injection - block comment', () => {
      const result = validateText('1 /* comment */');

      expect(result.warnings).toContain('SQL injection');
    });

    it('should sanitize text - remove null bytes', () => {
      const result = validateText('test\x00text');

      expect(result.sanitized).toBe('testtext');
    });

    it('should sanitize text - normalize whitespace', () => {
      const result = validateText('test    text');

      expect(result.sanitized).toBe('test text');
    });

    it('should sanitize text - remove control characters', () => {
      const result = validateText('test\x01\x02text\x1F');

      expect(result.sanitized).toBe('testtext');
    });

    it('should handle empty string', () => {
      const result = validateText('');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid text input');
    });

    it('should handle null input', () => {
      const result = validateText(null as any);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid text input');
    });
  });

  describe('validateEmail', () => {
    it('should accept valid email', () => {
      const result = validateEmail('user@example.com');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitized).toBe('user@example.com');
    });

    it('should normalize email to lowercase', () => {
      const result = validateEmail('User@Example.COM');

      expect(result.sanitized).toBe('user@example.com');
    });

    it('should trim whitespace', () => {
      const result = validateEmail('  user@example.com  ');

      expect(result.sanitized).toBe('user@example.com');
    });

    it('should reject invalid format', () => {
      const result = validateEmail('not-an-email');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('should reject email without @', () => {
      const result = validateEmail('userexample.com');

      expect(result.valid).toBe(false);
    });

    it('should reject email without domain', () => {
      const result = validateEmail('user@');

      expect(result.valid).toBe(false);
    });

    it('should reject email without TLD', () => {
      const result = validateEmail('user@example');

      expect(result.valid).toBe(false);
    });

    it('should reject email exceeding max length', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = validateEmail(longEmail);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Email too long');
    });

    it('should reject email with suspicious characters', () => {
      const result = validateEmail('user<script>@example.com');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('invalid characters');
    });

    it('should handle empty input', () => {
      const result = validateEmail('');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Email is required');
    });

    it('should handle null input', () => {
      const result = validateEmail(null as any);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Email is required');
    });
  });

  describe('validateApiKey', () => {
    it('should accept valid Gemini API key', () => {
      const result = validateApiKey('AIzaSyDummyKey1234567890', 'gemini');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid SiliconFlow API key', () => {
      const result = validateApiKey('sk-1234567890abcdef', 'siliconflow');

      expect(result.valid).toBe(true);
    });

    it('should accept valid GitLab token', () => {
      const result = validateApiKey('glpat-1234567890', 'gitlab');

      expect(result.valid).toBe(true);
    });

    it('should reject placeholder Gemini key', () => {
      const result = validateApiKey('YOUR_GEMINI_API_KEY', 'gemini');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('placeholder detected');
    });

    it('should reject placeholder SiliconFlow key', () => {
      const result = validateApiKey('YOUR_SILICONFLOW_API_KEY', 'siliconflow');

      expect(result.valid).toBe(false);
    });

    it('should reject invalid Gemini key format', () => {
      const result = validateApiKey('invalid-key', 'gemini');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid Gemini API key format');
    });

    it('should reject invalid SiliconFlow key format', () => {
      const result = validateApiKey('invalid-key', 'siliconflow');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid SiliconFlow API key format');
    });

    it('should warn about unusual GitLab token', () => {
      const result = validateApiKey('weird-token', 'gitlab');

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('Unusual GitLab token format');
    });

    it('should trim whitespace from key', () => {
      const result = validateApiKey('  AIzaSyDummyKey  ', 'gemini');

      expect(result.sanitized).toBe('AIzaSyDummyKey');
    });

    it('should reject key with leading/trailing whitespace', () => {
      const result = validateApiKey(' AIzaSyDummyKey ', 'gemini');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('whitespace');
    });

    it('should handle empty input', () => {
      const result = validateApiKey('', 'gemini');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('API key is required');
    });

    it('should handle null input', () => {
      const result = validateApiKey(null as any, 'gemini');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('API key is required');
    });

    it('should reject key containing "example"', () => {
      const result = validateApiKey('example-key-123', 'gemini');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('placeholder detected');
    });
  });

  describe('sanitizeText', () => {
    it('should remove null bytes', () => {
      expect(sanitizeText('test\x00text')).toBe('testtext');
    });

    it('should normalize whitespace', () => {
      expect(sanitizeText('test    text   here')).toBe('test text here');
    });

    it('should remove control characters', () => {
      expect(sanitizeText('test\x01\x02text\x1F')).toBe('testtext');
    });

    it('should trim result', () => {
      expect(sanitizeText('  text  ')).toBe('text');
    });

    it('should handle empty string', () => {
      expect(sanitizeText('')).toBe('');
    });

    it('should handle null', () => {
      expect(sanitizeText(null as any)).toBe('');
    });

    it('should preserve newlines and tabs', () => {
      expect(sanitizeText('line1\nline2\ttab')).toBe('line1\nline2\ttab');
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove path separators', () => {
      expect(sanitizeFilename('path/to/file.pdf')).toBe('path_to_file.pdf');
    });

    it('should remove Windows path separators', () => {
      expect(sanitizeFilename('path\\to\\file.pdf')).toBe('path_to_file.pdf');
    });

    it('should remove dangerous characters', () => {
      expect(sanitizeFilename('file<>"|?*.pdf')).toBe('file.pdf');
    });

    it('should replace multiple underscores', () => {
      expect(sanitizeFilename('file___name.pdf')).toBe('file_name.pdf');
    });

    it('should trim result', () => {
      expect(sanitizeFilename('  file.pdf  ')).toBe('file.pdf');
    });

    it('should handle empty string', () => {
      expect(sanitizeFilename('')).toBe('unnamed');
    });

    it('should handle null', () => {
      expect(sanitizeFilename(null as any)).toBe('unnamed');
    });

    it('should remove control characters', () => {
      expect(sanitizeFilename('file\x00name.pdf')).toBe('filename.pdf');
    });
  });

  describe('validateDocumentData', () => {
    it('should accept valid document', () => {
      const doc = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        fileName: 'test.pdf',
        uploadDate: new Date().toISOString()
      };

      const result = validateDocumentData(doc);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing required fields', () => {
      const result = validateDocumentData({});

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: id');
      expect(result.errors).toContain('Missing required field: fileName');
      expect(result.errors).toContain('Missing required field: uploadDate');
    });

    it('should reject invalid UUID format', () => {
      const doc = {
        id: 'invalid-uuid',
        fileName: 'test.pdf',
        uploadDate: new Date().toISOString()
      };

      const result = validateDocumentData(doc);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid ID format');
    });

    it('should validate filename length', () => {
      const doc = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        fileName: 'a'.repeat(256),
        uploadDate: new Date().toISOString()
      };

      const result = validateDocumentData(doc);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Text exceeds maximum length');
    });

    it('should validate supplier name length', () => {
      const doc = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        fileName: 'test.pdf',
        uploadDate: new Date().toISOString(),
        data: {
          lieferantName: 'a'.repeat(501)
        }
      };

      const result = validateDocumentData(doc);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Supplier name too long');
    });

    it('should validate description length', () => {
      const doc = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        fileName: 'test.pdf',
        uploadDate: new Date().toISOString(),
        data: {
          beschreibung: 'a'.repeat(2001)
        }
      };

      const result = validateDocumentData(doc);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Description too long');
    });

    it('should handle null or undefined input', () => {
      const result = validateDocumentData(null);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid document data');
    });

    it('should handle non-object input', () => {
      const result = validateDocumentData('string' as any);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid document data');
    });
  });

  describe('validateRateLimitData', () => {
    it('should accept valid rate limit data', () => {
      const result = validateRateLimitData('user123', Date.now());

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid user ID', () => {
      const result = validateRateLimitData('', Date.now());

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid user ID');
    });

    it('should reject null user ID', () => {
      const result = validateRateLimitData(null as any, Date.now());

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid user ID');
    });

    it('should reject invalid timestamp', () => {
      const result = validateRateLimitData('user123', NaN);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid timestamp');
    });

    it('should reject timestamp in future', () => {
      const futureTime = Date.now() + 86400000; // 1 day in future
      const result = validateRateLimitData('user123', futureTime);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Timestamp out of valid range');
    });

    it('should reject timestamp too old', () => {
      const oldTime = Date.now() - 172800000; // 2 days ago
      const result = validateRateLimitData('user123', oldTime);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Timestamp out of valid range');
    });

    it('should accept timestamp at boundary', () => {
      const boundaryTime = Date.now() - 86400000; // Exactly 24 hours ago
      const result = validateRateLimitData('user123', boundaryTime);

      expect(result.valid).toBe(true);
    });
  });

  describe('validatePagination', () => {
    it('should accept valid pagination', () => {
      const result = validatePagination(1, 10);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept page 1', () => {
      const result = validatePagination(1, 50);

      expect(result.valid).toBe(true);
    });

    it('should accept max limit', () => {
      const result = validatePagination(5, 100);

      expect(result.valid).toBe(true);
    });

    it('should reject page 0', () => {
      const result = validatePagination(0, 10);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Page must be a positive number');
    });

    it('should reject negative page', () => {
      const result = validatePagination(-1, 10);

      expect(result.valid).toBe(false);
    });

    it('should reject NaN page', () => {
      const result = validatePagination(NaN, 10);

      expect(result.valid).toBe(false);
    });

    it('should reject limit 0', () => {
      const result = validatePagination(1, 0);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Limit must be between 1 and 100');
    });

    it('should reject limit exceeding max', () => {
      const result = validatePagination(1, 101);

      expect(result.valid).toBe(false);
    });

    it('should reject negative limit', () => {
      const result = validatePagination(1, -10);

      expect(result.valid).toBe(false);
    });

    it('should reject NaN limit', () => {
      const result = validatePagination(1, NaN);

      expect(result.valid).toBe(false);
    });
  });

  describe('validateDate', () => {
    it('should accept valid date string', () => {
      const result = validateDate('2024-01-15');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept ISO format', () => {
      const result = validateDate('2024-01-15T10:30:00.000Z');

      expect(result.valid).toBe(true);
    });

    it('should accept German format', () => {
      const result = validateDate('15.01.2024');

      expect(result.valid).toBe(true);
    });

    it('should reject invalid format', () => {
      const result = validateDate('not-a-date');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid date format');
    });

    it('should reject date before 1900', () => {
      const result = validateDate('1899-12-31');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Date out of valid range');
    });

    it('should reject date too far in future', () => {
      const result = validateDate('2100-01-01');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Date out of valid range');
    });

    it('should accept date at boundary (1900)', () => {
      const result = validateDate('1900-01-01');

      expect(result.valid).toBe(true);
    });

    it('should accept date at boundary (current year + 10)', () => {
      const futureYear = new Date().getFullYear() + 10;
      const result = validateDate(`${futureYear}-01-01`);

      expect(result.valid).toBe(true);
    });

    it('should handle empty input', () => {
      const result = validateDate('');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Date is required');
    });

    it('should handle null input', () => {
      const result = validateDate(null as any);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Date is required');
    });

    it('should return sanitized ISO format', () => {
      const result = validateDate('2024-01-15');

      expect(result.sanitized).toBe('2024-01-15T00:00:00.000Z');
    });
  });

  describe('validateAmount', () => {
    it('should accept valid amount as number', () => {
      const result = validateAmount(123.45);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid amount as string', () => {
      const result = validateAmount('123.45');

      expect(result.valid).toBe(true);
    });

    it('should accept zero', () => {
      const result = validateAmount(0);

      expect(result.valid).toBe(true);
    });

    it('should accept large valid amount', () => {
      const result = validateAmount(999999999);

      expect(result.valid).toBe(true);
    });

    it('should reject negative amount', () => {
      const result = validateAmount(-100);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Amount cannot be negative');
    });

    it('should reject amount exceeding max', () => {
      const result = validateAmount(1000000000);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Amount too large');
    });

    it('should reject invalid number format', () => {
      const result = validateAmount('not-a-number');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid number format');
    });

    it('should handle null', () => {
      const result = validateAmount(null as any);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Amount is required');
    });

    it('should handle undefined', () => {
      const result = validateAmount(undefined as any);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Amount is required');
    });

    it('should sanitize to 2 decimal places', () => {
      const result = validateAmount(123.456);

      expect(result.sanitized).toBe('123.46');
    });

    it('should sanitize whole number', () => {
      const result = validateAmount(100);

      expect(result.sanitized).toBe('100.00');
    });
  });

  describe('validateOCRResult', () => {
    it('should accept valid OCR result with text', () => {
      const result = validateOCRResult({ text: 'extracted text' });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid OCR result with data', () => {
      const result = validateOCRResult({ data: { amount: 100 } });

      expect(result.valid).toBe(true);
    });

    it('should accept valid confidence score', () => {
      const result = validateOCRResult({
        text: 'text',
        confidence: 0.95
      });

      expect(result.valid).toBe(true);
    });

    it('should reject missing text and data', () => {
      const result = validateOCRResult({});

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('missing text or data');
    });

    it('should reject invalid confidence - too low', () => {
      const result = validateOCRResult({
        text: 'text',
        confidence: -0.1
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid confidence score');
    });

    it('should reject invalid confidence - too high', () => {
      const result = validateOCRResult({
        text: 'text',
        confidence: 1.5
      });

      expect(result.valid).toBe(false);
    });

    it('should reject invalid confidence - not a number', () => {
      const result = validateOCRResult({
        text: 'text',
        confidence: 'invalid'
      });

      expect(result.valid).toBe(false);
    });

    it('should validate amount in data', () => {
      const result = validateOCRResult({
        data: { amount: 'not-a-number' }
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid amount in OCR data');
    });

    it('should validate date in data', () => {
      const result = validateOCRResult({
        data: { date: 'invalid-date' }
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid date format');
    });

    it('should accept valid data with amount and date', () => {
      const result = validateOCRResult({
        data: {
          amount: 123.45,
          date: '2024-01-15'
        }
      });

      expect(result.valid).toBe(true);
    });

    it('should handle null input', () => {
      const result = validateOCRResult(null);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid OCR result');
    });

    it('should handle non-object input', () => {
      const result = validateOCRResult('string' as any);

      expect(result.valid).toBe(false);
    });
  });

  describe('validateBatch', () => {
    it('should validate array of valid items', () => {
      const items = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' }
      ];

      const validator = (item: any) => ({
        valid: true,
        errors: [],
        sanitized: item
      });

      const result = validateBatch(items, validator);

      expect(result.valid).toBe(true);
      expect(result.sanitized).toHaveLength(2);
    });

    it('should detect invalid items in batch', () => {
      const items = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: '' } // Invalid
      ];

      const validator = (item: any) => {
        if (!item.name) {
          return { valid: false, errors: ['Name required'] };
        }
        return { valid: true, errors: [], sanitized: item };
      };

      const result = validateBatch(items, validator);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Name required');
      expect(result.sanitized).toHaveLength(1);
    });

    it('should collect all errors', () => {
      const items = [
        { id: '1' },
        { id: '2' },
        { id: '3' }
      ];

      const validator = (item: any) => ({
        valid: false,
        errors: [`Error for ${item.id}`]
      });

      const result = validateBatch(items, validator);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain('Error for 1');
      expect(result.errors).toContain('Error for 2');
      expect(result.errors).toContain('Error for 3');
    });

    it('should collect warnings from valid items', () => {
      const items = [
        { id: '1' },
        { id: '2' }
      ];

      const validator = (item: any) => ({
        valid: true,
        errors: [],
        warnings: [`Warning for ${item.id}`],
        sanitized: item
      });

      const result = validateBatch(items, validator);

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(2);
      expect(result.warnings).toContain('Warning for 1');
      expect(result.warnings).toContain('Warning for 2');
    });

    it('should handle empty array', () => {
      const validator = (item: any) => ({
        valid: true,
        errors: [],
        sanitized: item
      });

      const result = validateBatch([], validator);

      expect(result.valid).toBe(true);
      expect(result.sanitized).toHaveLength(0);
    });

    it('should handle mixed valid and invalid', () => {
      const items = [
        { id: '1', valid: true },
        { id: '2', valid: false },
        { id: '3', valid: true }
      ];

      const validator = (item: any) => {
        if (!item.valid) {
          return { valid: false, errors: ['Invalid item'] };
        }
        return { valid: true, errors: [], sanitized: item };
      };

      const result = validateBatch(items, validator);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.sanitized).toHaveLength(2);
    });
  });

  describe('Integration Tests - Combined Validation', () => {
    it('should validate complete document upload scenario', () => {
      // Simulate file validation
      const file = new File(['content'], 'invoice.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 });

      const fileValidation = validateFiles([file] as any);
      expect(fileValidation.valid).toBe(true);

      // Simulate text validation (e.g., notes field)
      const notesValidation = validateText('Customer notes about invoice');
      expect(notesValidation.valid).toBe(true);

      // Simulate document data validation
      const docData = {
        id: crypto.randomUUID(),
        fileName: 'invoice.pdf',
        uploadDate: new Date().toISOString(),
        data: {
          lieferantName: 'Test Supplier GmbH',
          bruttoBetrag: 119.00,
          belegDatum: '2024-01-15'
        }
      };

      const docValidation = validateDocumentData(docData);
      expect(docValidation.valid).toBe(true);

      // Validate amount
      const amountValidation = validateAmount(docData.data.bruttoBetrag);
      expect(amountValidation.valid).toBe(true);

      // Validate date
      const dateValidation = validateDate(docData.data.belegDatum);
      expect(dateValidation.valid).toBe(true);

      // All validations passed
      expect(fileValidation.valid && notesValidation.valid &&
             docValidation.valid && amountValidation.valid &&
             dateValidation.valid).toBe(true);
    });

    it('should detect security issues in complete scenario', () => {
      // File with suspicious name
      const file = new File(['content'], 'test<script>.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 1024 });

      const fileValidation = validateFiles([file] as any);
      expect(fileValidation.warnings).toHaveLength(1);

      // Text with XSS
      const textValidation = validateText('<script>alert("XSS")</script>');
      expect(textValidation.valid).toBe(false);

      // Document with suspicious data
      const docData = {
        id: 'invalid-uuid',
        fileName: 'test; DROP TABLE users; --.pdf',
        uploadDate: new Date().toISOString()
      };

      const docValidation = validateDocumentData(docData);
      expect(docValidation.valid).toBe(false);

      // Amount with SQL injection attempt
      const amountValidation = validateAmount('100; DROP TABLE users');
      expect(amountValidation.valid).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle unicode characters in filenames', () => {
      const file = new File(['content'], 'файл.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 1024 });

      const result = validateFiles([file] as any);

      expect(result.valid).toBe(true);
    });

    it('should handle very long text', () => {
      const longText = 'a'.repeat(10000);
      const result = validateText(longText);

      expect(result.valid).toBe(true);
    });

    it('should handle special characters in email', () => {
      const result = validateEmail('user+tag@example.com');

      expect(result.valid).toBe(true);
    });

    it('should handle decimal amounts', () => {
      const result = validateAmount(0.01);

      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('0.01');
    });

    it('should handle scientific notation', () => {
      const result = validateAmount(1e6);

      expect(result.valid).toBe(true);
    });

    it('should handle dates with time', () => {
      const result = validateDate('2024-01-15T14:30:45.123Z');

      expect(result.valid).toBe(true);
    });
  });

  describe('Type Safety', () => {
    it('should return correct types for validateFiles', () => {
      const result = validateFiles([] as any);

      expect(typeof result.valid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should return correct types for validateText', () => {
      const result = validateText('test');

      expect(typeof result.valid).toBe('boolean');
      expect(typeof result.sanitized).toBe('string');
    });

    it('should return correct types for validateEmail', () => {
      const result = validateEmail('test@example.com');

      expect(typeof result.valid).toBe('boolean');
      expect(typeof result.sanitized).toBe('string');
    });

    it('should return correct types for validateAmount', () => {
      const result = validateAmount(100);

      expect(typeof result.valid).toBe('boolean');
      expect(typeof result.sanitized).toBe('string');
    });

    it('should return correct types for validateBatch', () => {
      const result = validateBatch([], () => ({ valid: true, errors: [] }));

      expect(typeof result.valid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });
});
