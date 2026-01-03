/**
 * Unit Tests for storageService.ts (IndexedDB operations)
 * Note: These tests verify function signatures and structure only.
 * Full IndexedDB integration tests should run in a browser environment.
 */

import { describe, it, expect } from 'vitest';
import type { VendorRuleData } from '../services/storageService';
import { DocumentRecord, DocumentStatus, AppSettings } from '../types';

describe('storageService - Function Signatures', () => {
  // Import functions to verify they exist
  it('should export getAllDocuments function', async () => {
    const module = await import('../services/storageService');
    expect(typeof module.getAllDocuments).toBe('function');
  });

  it('should export saveDocument function', async () => {
    const module = await import('../services/storageService');
    expect(typeof module.saveDocument).toBe('function');
  });

  it('should export deleteDocument function', async () => {
    const module = await import('../services/storageService');
    expect(typeof module.deleteDocument).toBe('function');
  });

  it('should export getSettings function', async () => {
    const module = await import('../services/storageService');
    expect(typeof module.getSettings).toBe('function');
  });

  it('should export saveSettings function', async () => {
    const module = await import('../services/storageService');
    expect(typeof module.saveSettings).toBe('function');
  });

  it('should export getVendorRule function', async () => {
    const module = await import('../services/storageService');
    expect(typeof module.getVendorRule).toBe('function');
  });

  it('should export saveVendorRule function', async () => {
    const module = await import('../services/storageService');
    expect(typeof module.saveVendorRule).toBe('function');
  });

  it('should export clearAllData function', async () => {
    const module = await import('../services/storageService');
    expect(typeof module.clearAllData).toBe('function');
  });
});

describe('VendorRuleData Type', () => {
  it('should have correct structure', () => {
    const rule: VendorRuleData = {
      vendorName: 'test vendor',
      accountId: 'wareneingang',
      taxCategoryValue: '19_pv',
      lastUpdated: new Date().toISOString(),
      useCount: 1,
    };

    expect(rule.vendorName).toBe('test vendor');
    expect(rule.accountId).toBe('wareneingang');
    expect(rule.taxCategoryValue).toBe('19_pv');
    expect(typeof rule.useCount).toBe('number');
  });

  it('should allow optional fields', () => {
    const rule: VendorRuleData = {
      vendorName: 'minimal vendor',
      lastUpdated: new Date().toISOString(),
      useCount: 0,
    };

    expect(rule.accountId).toBeUndefined();
    expect(rule.taxCategoryValue).toBeUndefined();
  });
});

describe('storageService - Input Validation', () => {
  it('getVendorRule should return early for empty vendor name', async () => {
    const module = await import('../services/storageService');
    // The function should handle empty strings without calling IndexedDB
    const result = await module.getVendorRule('');
    expect(result).toBeUndefined();
  });

  it('getVendorRule should return early for short vendor name', async () => {
    const module = await import('../services/storageService');
    const result = await module.getVendorRule('a');
    expect(result).toBeUndefined();
  });

  it('saveVendorRule should return early for empty vendor name', async () => {
    const module = await import('../services/storageService');
    // Should not throw for empty vendor name
    await expect(module.saveVendorRule('', 'wareneingang', '19_pv')).resolves.not.toThrow();
  });

  it('saveVendorRule should return early for short vendor name', async () => {
    const module = await import('../services/storageService');
    await expect(module.saveVendorRule('a', 'wareneingang', '19_pv')).resolves.not.toThrow();
  });
});

describe('DocumentRecord Type', () => {
  const mockDocument: DocumentRecord = {
    id: 'test-doc-1',
    fileName: 'test-rechnung.pdf',
    fileType: 'application/pdf',
    uploadDate: '2024-01-15T10:00:00.000Z',
    status: DocumentStatus.COMPLETED,
    data: {
      belegDatum: '2024-01-15',
      belegNummerLieferant: 'RE-123',
      lieferantName: 'Test Lieferant',
      bruttoBetrag: 119.00,
      steuerkategorie: '19_pv',
      kontierungskonto: 'wareneingang',
      konto_skr03: '3400',
      kontogruppe: 'Wareneingang',
      sollKonto: '3400',
      habenKonto: '1200',
      steuerKategorie: '19% Vorsteuer',
      mwstBetrag19: 19.00,
      mwstSatz19: 0.19,
      nettoBetrag: 100.00,
      mwstBetrag0: 0,
      mwstBetrag7: 0,
      mwstSatz0: 0,
      mwstSatz7: 0,
      steuernummer: '',
      lieferantAdresse: '',
      lineItems: [],
      beschreibung: '',
      eigeneBelegNummer: 'ZOE2401.001',
      zahlungsmethode: 'Überweisung',
      zahlungsDatum: '',
      zahlungsStatus: 'offen',
      aufbewahrungsOrt: '',
      rechnungsEmpfaenger: '',
      kleinbetrag: false,
      vorsteuerabzug: true,
      reverseCharge: false,
      privatanteil: false,
      documentType: 'rechnung',
      kontierungBegruendung: 'Test',
    },
  };

  it('should have required fields', () => {
    expect(mockDocument.id).toBe('test-doc-1');
    expect(mockDocument.fileName).toBe('test-rechnung.pdf');
    expect(mockDocument.status).toBe(DocumentStatus.COMPLETED);
  });

  it('should have valid data structure', () => {
    expect(mockDocument.data).toBeDefined();
    expect(mockDocument.data?.bruttoBetrag).toBe(119.00);
    expect(mockDocument.data?.steuerkategorie).toBe('19_pv');
  });
});

describe('AppSettings Type', () => {
  const mockSettings: AppSettings = {
    id: 'global',
    taxDefinitions: [
      { value: '19_pv', label: '19% Vorsteuer', ust_satz: 0.19, vorsteuer: true },
    ],
    accountDefinitions: [
      { id: 'wareneingang', name: 'Wareneingang', skr03: '3400', steuerkategorien: ['19_pv'] },
    ],
    accountGroups: [],
    ocrConfig: {
      scores: {},
      required_fields: [],
      field_weights: {},
      regex_patterns: {},
      validation_rules: { sum_check: true, date_check: true, min_confidence: 0.8 },
    },
  };

  it('should have required fields', () => {
    expect(mockSettings.id).toBe('global');
    expect(mockSettings.taxDefinitions).toHaveLength(1);
    expect(mockSettings.accountDefinitions).toHaveLength(1);
  });

  it('should have valid tax definition', () => {
    const taxDef = mockSettings.taxDefinitions[0];
    expect(taxDef.value).toBe('19_pv');
    expect(taxDef.ust_satz).toBe(0.19);
    expect(taxDef.vorsteuer).toBe(true);
  });

  it('should have valid account definition', () => {
    const accDef = mockSettings.accountDefinitions[0];
    expect(accDef.id).toBe('wareneingang');
    expect(accDef.skr03).toBe('3400');
    expect(accDef.steuerkategorien).toContain('19_pv');
  });
});
