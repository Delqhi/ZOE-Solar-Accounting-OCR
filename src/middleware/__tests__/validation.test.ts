/**
 * 🔱 ULTRA 2026 - Validation Middleware Tests
 * Comprehensive test coverage for security validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationMiddleware } from '../validation';
import { TestFactory } from '@/lib/ultra';

describe('ValidationMiddleware', () => {
  describe('validateDocumentUpload', () => {
    it('should validate correct document upload', () => {
      const validInput = TestFactory.createDocument({
        fileName: 'test-invoice.pdf',
        creditor: 'Test GmbH',
        totalAmount: 119.00,
        vatAmount: 19.00,
        netAmount: 100.00,
        iban: 'DE89370400440532013000',
      });

      const result = ValidationMiddleware.validateDocumentUpload(validInput, {
        sanitize: true,
        validateIBAN: true,
        validateMoney: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fileName).toBe('test-invoice.pdf');
        expect(result.data.creditor).toBe('Test GmbH');
      }
    });

    it('should reject invalid IBAN', () => {
      const input = {
        fileName: 'test.pdf',
        creditor: 'Test',
        totalAmount: 100,
        iban: 'INVALID-IBAN',
      };

      const result = ValidationMiddleware.validateDocumentUpload(input, {
        validateIBAN: true,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toContain('Invalid IBAN format');
      }
    });

    it('should reject invalid money amounts', () => {
      const input = {
        fileName: 'test.pdf',
        creditor: 'Test',
        totalAmount: -100,
        vatAmount: 9999999,
      };

      const result = ValidationMiddleware.validateDocumentUpload(input, {
        validateMoney: true,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it('should sanitize HTML in text fields', () => {
      const input = {
        fileName: 'test<script>alert(1)</script>.pdf',
        creditor: 'Test<script>alert(2)</script>',
        totalAmount: 100,
      };

      const result = ValidationMiddleware.validateDocumentUpload(input, {
        sanitize: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fileName).not.toContain('<script>');
        expect(result.data.creditor).not.toContain('<script>');
      }
    });

    it('should handle missing optional fields', () => {
      const input = {
        fileName: 'test.pdf',
        totalAmount: 100,
      };

      const result = ValidationMiddleware.validateDocumentUpload(input, {
        validateMoney: true,
      });

      expect(result.success).toBe(true);
    });

    it('should reject excessive file size', () => {
      const input = {
        fileName: 'test.pdf',
        fileSize: 200 * 1024 * 1024, // 200MB
        totalAmount: 100,
      };

      const result = ValidationMiddleware.validateDocumentUpload(input, {
        maxFileSize: 100 * 1024 * 1024,
      });

      expect(result.success).toBe(false);
    });

    it('should sanitize special characters', () => {
      const input = {
        fileName: 'test&file<name>.pdf',
        creditor: 'Test & Co. <GmbH>',
        description: 'Test "quoted" value',
        totalAmount: 100,
      };

      const result = ValidationMiddleware.validateDocumentUpload(input, {
        sanitize: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fileName).toBe('test&file<name>.pdf');
        expect(result.data.creditor).toBe('Test & Co. <GmbH>');
      }
    });
  });

  describe('validateBatchDocuments', () => {
    it('should validate multiple documents', () => {
      const documents = [
        { fileName: 'doc1.pdf', totalAmount: 100 },
        { fileName: 'doc2.pdf', totalAmount: 200 },
        { fileName: 'doc3.pdf', totalAmount: 300 },
      ];

      const result = ValidationMiddleware.validateDocumentsBatch(documents);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(3);
      }
    });

    it('should fail if any document is invalid', () => {
      const documents = [
        { fileName: 'doc1.pdf', totalAmount: 100 },
        { fileName: 'doc2.pdf', totalAmount: -50 }, // Invalid
        { fileName: 'doc3.pdf', totalAmount: 300 },
      ];

      const result = ValidationMiddleware.validateDocumentsBatch(documents);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('sanitizeHTML', () => {
    it('should escape dangerous HTML', () => {
      const input = '<script>alert("xss")</script>';
      const result = ValidationMiddleware.sanitizeHTML(input);
      
      expect(result).not.toContain('<script>');
      expect(result).toContain('<script>');
    });

    it('should handle null and undefined', () => {
      expect(ValidationMiddleware.sanitizeHTML(null as any)).toBe('');
      expect(ValidationMiddleware.sanitizeHTML(undefined as any)).toBe('');
    });

    it('should preserve safe characters', () => {
      const input = 'Test & Co. GmbH - 123';
      const result = ValidationMiddleware.sanitizeHTML(input);
      
      expect(result).toBe(input);
    });
  });

  describe('validateIBAN', () => {
    it('should accept valid German IBAN', () => {
      const validIBAN = 'DE89370400440532013000';
      const result = ValidationMiddleware.validateIBAN(validIBAN);
      expect(result).toBe(true);
    });

    it('should reject invalid IBAN', () => {
      const invalidIBAN = 'DE123';
      const result = ValidationMiddleware.validateIBAN(invalidIBAN);
      expect(result).toBe(false);
    });

    it('should handle IBAN with spaces', () => {
      const ibanWithSpaces = 'DE89 3704 0044 0532 0130 00';
      const result = ValidationMiddleware.validateIBAN(ibanWithSpaces);
      expect(result).toBe(true);
    });
  });

  describe('validateMoney', () => {
    it('should accept valid amounts', () => {
      expect(ValidationMiddleware.validateMoney(0)).toBe(true);
      expect(ValidationMiddleware.validateMoney(100)).toBe(true);
      expect(ValidationMiddleware.validateMoney(999999.99)).toBe(true);
    });

    it('should reject invalid amounts', () => {
      expect(ValidationMiddleware.validateMoney(-1)).toBe(false);
      expect(ValidationMiddleware.validateMoney(1000001)).toBe(false);
      expect(ValidationMiddleware.validateMoney(Infinity)).toBe(false);
      expect(ValidationMiddleware.validateMoney(NaN)).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
      ];

      validEmails.forEach(email => {
        expect(ValidationMiddleware.validateEmail(email as any)).toBe(true);
      });
    });

    it('should reject invalid emails', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user@.com',
      ];

      invalidEmails.forEach(email => {
        expect(ValidationMiddleware.validateEmail(email as any)).toBe(false);
      });
    });
  });

  describe('validateUUID', () => {
    it('should accept valid UUIDs', () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000';
      expect(ValidationMiddleware.validateUUID(validUUID)).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '123e4567-e89b-12d3-a456',
        '',
      ];

      invalidUUIDs.forEach(uuid => {
        expect(ValidationMiddleware.validateUUID(uuid)).toBe(false);
      });
    });
  });

  describe('validateDocumentType', () => {
    it('should accept valid document types', () => {
      const validTypes = ['RECHNUNG', 'QUITTUNG', 'KAUFBELEG', 'LOHNABRECHNUNG'];
      
      validTypes.forEach(type => {
        const result = ValidationMiddleware.validateDocumentType(type);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid document types', () => {
      const result = ValidationMiddleware.validateDocumentType('INVALID_TYPE');
      expect(result.success).toBe(false);
    });
  });

  describe('validateFileUpload', () => {
    it('should validate file type', () => {
      const result = ValidationMiddleware.validateFileUpload({
        name: 'test.pdf',
        type: 'application/pdf',
        size: 1024,
      });

      expect(result.success).toBe(true);
    });

    it('should reject unsupported file types', () => {
      const result = ValidationMiddleware.validateFileUpload({
        name: 'test.exe',
        type: 'application/x-msdownload',
        size: 1024,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toContain('Unsupported file type');
      }
    });

    it('should reject oversized files', () => {
      const result = ValidationMiddleware.validateFileUpload({
        name: 'test.pdf',
        type: 'application/pdf',
        size: 200 * 1024 * 1024, // 200MB
      }, 100 * 1024 * 1024); // 100MB limit

      expect(result.success).toBe(false);
    });
  });
});
