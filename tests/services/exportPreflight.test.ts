import { describe, it, expect } from 'vitest';
import { runExportPreflight, formatPreflightForDialog, ExportPreflightResult } from '../../services/exportPreflight';
import { DocumentStatus, ExtractedData, DocumentRecord } from '../../types';

describe('exportPreflight', () => {
  const createTestDoc = (overrides: Partial<ExtractedData> & { id?: string; status?: DocumentStatus } = {}): DocumentRecord => ({
    id: 'test-123',
    uploadDate: new Date().toISOString(),
    fileName: 'test.pdf',
    fileType: 'application/pdf',
    status: DocumentStatus.COMPLETED,
    data: {
      documentType: 'INVOICE',
      belegDatum: '2025-03-15',
      belegNummerLieferant: 'RE-001',
      lieferantName: 'Test Company',
      lieferantAdresse: 'Test Str. 1, 12345 Test City',
      steuernummer: '123/456/78901',
      nettoBetrag: 100,
      mwstSatz0: 0,
      mwstBetrag0: 0,
      mwstSatz7: 0,
      mwstBetrag7: 0,
      mwstSatz19: 19,
      mwstBetrag19: 19,
      bruttoBetrag: 119,
      zahlungsmethode: 'bank_transfer',
      lineItems: [],
      kontogruppe: 'Sonstiges',
      konto_skr03: '4900',
      ust_typ: 'vorsteuerabzug',
      sollKonto: '4900',
      habenKonto: '1800',
      steuerKategorie: '19% USt',
      eigeneBelegNummer: 'ZOE-2025-0001',
      zahlungsDatum: '',
      zahlungsStatus: 'open',
      aufbewahrungsOrt: '',
      rechnungsEmpfaenger: '',
      kleinbetrag: false,
      vorsteuerabzug: true,
      reverseCharge: false,
      privatanteil: false,
      beschreibung: 'Test invoice',
      ...overrides,
    },
  });

  describe('runExportPreflight', () => {
    it('should return no blockers for valid documents', () => {
      const docs = [createTestDoc()];
      const result = runExportPreflight(docs);
      expect(result.blockers).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const docs = [createTestDoc({ lieferantName: undefined })];
      const result = runExportPreflight(docs);
      expect(result.blockers.some(i => i.message.includes('Pflichtfeld'))).toBe(true);
    });

    it('should detect invalid date format', () => {
      const docs = [createTestDoc({ belegDatum: '15/03/2025' })];
      const result = runExportPreflight(docs);
      expect(result.blockers.some(i => i.message.includes('belegDatum'))).toBe(true);
    });
  });

  describe('formatPreflightForDialog', () => {
    it('should format valid result', () => {
      const result: ExportPreflightResult = { blockers: [], warnings: [], totalDocs: 2 };
      const formatted = formatPreflightForDialog(result);
      expect(formatted.title).toBe('Export OK (Preflight)');
    });

    it('should format result with blockers', () => {
      const result: ExportPreflightResult = {
        blockers: [{ level: 'blocker', docId: 'test', fileName: 'test.pdf', message: 'Error' }],
        warnings: [],
        totalDocs: 1,
      };
      const formatted = formatPreflightForDialog(result);
      expect(formatted.title).toBe('Export blockiert (Preflight)');
    });
  });
});
