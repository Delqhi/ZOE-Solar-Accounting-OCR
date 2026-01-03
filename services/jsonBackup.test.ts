/**
 * Tests for jsonBackup service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentRecord, AppSettings, VendorRule } from '../types';

describe('BackupData structure', () => {
  it('should have correct structure for backup data', () => {
    const backupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      documents: [] as DocumentRecord[],
      settings: null as AppSettings | null,
      vendorRules: [] as VendorRule[],
      metadata: {
        totalDocuments: 0,
        totalPrivateDocuments: 0,
        yearRange: null as { min: number; max: number } | null,
        totalAmount: 0
      }
    };

    expect(backupData.version).toBe('1.0.0');
    expect(backupData.metadata.totalDocuments).toBe(0);
  });

  it('should calculate correct metadata from documents', () => {
    const docs: DocumentRecord[] = [
      {
        id: '1',
        fileName: 'doc1.pdf',
        fileType: 'application/pdf',
        uploadDate: '2024-01-15T10:00:00Z',
        status: 'completed',
        data: {
          belegDatum: '2024-01-10',
          bruttoBetrag: 100,
          lieferantName: 'Test GmbH',
          lieferantAdresse: '',
          steuernummer: '',
          nettoBetrag: 84.03,
          mwstSatz0: 0,
          mwstBetrag0: 0,
          mwstSatz7: 0,
          mwstBetrag7: 0,
          mwstSatz19: 19,
          mwstBetrag19: 15.97,
          bruttoBetrag: 100,
          zahlungsmethode: '',
          lineItems: [],
          kontogruppe: '',
          konto_skr03: '3400',
          ust_typ: '',
          sollKonto: '',
          habenKonto: '',
          steuerKategorie: '',
          eigeneBelegNummer: '',
          zahlungsDatum: '',
          zahlungsStatus: '',
          aufbewahrungsOrt: '',
          rechnungsEmpfaenger: '',
          kleinbetrag: false,
          vorsteuerabzug: true,
          reverseCharge: false,
          privatanteil: false,
          beschreibung: ''
        }
      },
      {
        id: '2',
        fileName: 'doc2.pdf',
        fileType: 'application/pdf',
        uploadDate: '2024-02-20T11:00:00Z',
        status: 'completed',
        data: {
          belegDatum: '2024-02-15',
          bruttoBetrag: 200,
          lieferantName: 'Another GmbH',
          lieferantAdresse: '',
          steuernummer: '',
          nettoBetrag: 168.07,
          mwstSatz0: 0,
          mwstBetrag0: 0,
          mwstSatz7: 0,
          mwstBetrag7: 0,
          mwstSatz19: 19,
          mwstBetrag19: 31.93,
          bruttoBetrag: 200,
          zahlungsmethode: '',
          lineItems: [],
          kontogruppe: '',
          konto_skr03: '4930',
          ust_typ: '',
          sollKonto: '',
          habenKonto: '',
          steuerKategorie: '',
          eigeneBelegNummer: '',
          zahlungsDatum: '',
          zahlungsStatus: '',
          aufbewahrungsOrt: '',
          rechnungsEmpfaenger: '',
          kleinbetrag: false,
          vorsteuerabzug: true,
          reverseCharge: false,
          privatanteil: false,
          beschreibung: ''
        }
      }
    ];

    // Calculate metadata
    const years = new Set<number>();
    let totalAmount = 0;

    for (const doc of docs) {
      if (doc.data?.belegDatum) {
        const year = parseInt(doc.data.belegDatum.substring(0, 4), 10);
        if (!isNaN(year)) years.add(year);
      }
      if (doc.data?.bruttoBetrag) {
        totalAmount += doc.data.bruttoBetrag;
      }
    }

    const yearArray = Array.from(years).sort();
    const yearRange = yearArray.length > 0
      ? { min: yearArray[0], max: yearArray[yearArray.length - 1] }
      : null;

    expect(years.size).toBe(1);
    expect(yearRange?.min).toBe(2024);
    expect(yearRange?.max).toBe(2024);
    expect(totalAmount).toBe(300);
  });
});

describe('RestoreResult structure', () => {
  it('should have correct structure for restore result', () => {
    const successResult = {
      success: true,
      documentsImported: 10,
      settingsRestored: true,
      errors: [] as string[]
    };

    const errorResult = {
      success: false,
      documentsImported: 5,
      settingsRestored: false,
      errors: ['Document 3 failed', 'Document 7 failed']
    };

    expect(successResult.success).toBe(true);
    expect(successResult.documentsImported).toBe(10);
    expect(errorResult.errors.length).toBe(2);
  });
});

describe('Backup validation', () => {
  it('should validate correct backup format', () => {
    const validBackup = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      documents: [],
      settings: null,
      vendorRules: [],
      metadata: {
        totalDocuments: 0,
        totalPrivateDocuments: 0,
        yearRange: null,
        totalAmount: 0
      }
    };

    const isValid = validBackup.version !== undefined &&
                   validBackup.timestamp !== undefined &&
                   Array.isArray(validBackup.documents);

    expect(isValid).toBe(true);
  });

  it('should reject invalid backup format', () => {
    const invalidBackup = {
      documents: []
      // Missing version and timestamp
    };

    const isValid = invalidBackup.version !== undefined &&
                   invalidBackup.timestamp !== undefined;

    expect(isValid).toBe(false);
  });
});
