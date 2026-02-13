import { DocumentStatus, type DocumentRecord, type AppSettings } from '../../types';
import { runExportPreflight, formatPreflightForDialog } from '../exportPreflight';
import { describe, expect, it } from 'vitest';

describe('exportPreflight.ts', () => {
  const baseSettings: AppSettings = {
    id: 'test-settings',
    accountGroups: [],
    accountDefinitions: [],
    taxDefinitions: [],
    ocrConfig: {
      scores: {},
      required_fields: [],
      field_weights: {},
      regex_patterns: {},
      validation_rules: { sum_check: true, date_check: true, min_confidence: 0.5 },
    },
  };

  const validDoc: DocumentRecord = {
    id: 'doc-1',
    fileName: 'rechnung.pdf',
    fileType: 'application/pdf',
    uploadDate: '2025-01-15',
    status: DocumentStatus.COMPLETED,
    data: {
      belegDatum: '2025-01-15',
      belegNummerLieferant: 'RE-001',
      lieferantName: 'Test GmbH',
      lieferantAdresse: '',
      steuernummer: '',
      nettoBetrag: 100,
      mwstSatz0: 0,
      mwstBetrag0: 0,
      mwstSatz7: 0,
      mwstBetrag7: 0,
      mwstSatz19: 19,
      mwstBetrag19: 19,
      bruttoBetrag: 119,
      zahlungsmethode: 'Überweisung',
      lineItems: [],
      kontogruppe: '',
      konto_skr03: '',
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
      vorsteuerabzug: false,
      reverseCharge: false,
      privatanteil: false,
      beschreibung: '',
      quantity: 1,
    },
    previewUrl: '',
  };

  describe('runExportPreflight()', () => {
    it('should return no blockers for valid documents', () => {
      const docs = [validDoc];
      const result = runExportPreflight(docs, baseSettings);

      expect(result.blockers).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should add blocker for document without data', () => {
      const docs = [{ ...validDoc, data: null }];
      const result = runExportPreflight(docs, baseSettings);

      expect(result.blockers).toContain('Dokument rechnung.pdf hat keine Daten');
    });

    it('should add warning for document with ERROR status', () => {
      const docs = [{ ...validDoc, status: DocumentStatus.ERROR }];
      const result = runExportPreflight(docs, baseSettings);

      expect(result.warnings).toContain('Dokument rechnung.pdf hat Fehlerstatus');
    });

    it('should handle multiple documents with mixed issues', () => {
      const docs = [
        validDoc,
        { ...validDoc, id: 'doc-2', fileName: 'test.pdf', data: null },
        { ...validDoc, id: 'doc-3', fileName: 'error.pdf', status: DocumentStatus.ERROR },
      ];
      const result = runExportPreflight(docs, baseSettings);

      expect(result.blockers).toHaveLength(1);
      expect(result.warnings).toHaveLength(1);
    });

    it('should handle empty document list', () => {
      const docs: DocumentRecord[] = [];
      const result = runExportPreflight(docs, baseSettings);

      expect(result.blockers).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle documents with PROCESSING status', () => {
      const docs = [{ ...validDoc, status: DocumentStatus.PROCESSING }];
      const result = runExportPreflight(docs, baseSettings);

      expect(result.blockers).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle documents with DUPLICATE status', () => {
      const docs = [{ ...validDoc, status: DocumentStatus.DUPLICATE }];
      const result = runExportPreflight(docs, baseSettings);

      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('formatPreflightForDialog()', () => {
    it('should format blockers correctly', () => {
      const preflight = {
        blockers: ['Blocker 1', 'Blocker 2'],
        warnings: [],
      };
      const result = formatPreflightForDialog(preflight);

      expect(result.title).toBe('Export-Prüfung');
      expect(result.body).toContain('❌ BLOCKIEREND: Blocker 1');
      expect(result.body).toContain('❌ BLOCKIEREND: Blocker 2');
    });

    it('should format warnings correctly', () => {
      const preflight = {
        blockers: [],
        warnings: ['Warning 1'],
      };
      const result = formatPreflightForDialog(preflight);

      expect(result.body).toContain('⚠️ WARNUNG: Warning 1');
    });

    it('should show success message when no issues', () => {
      const preflight = {
        blockers: [],
        warnings: [],
      };
      const result = formatPreflightForDialog(preflight);

      expect(result.body).toContain('✅ Alles klar!');
    });

    it('should not show success message when there are issues', () => {
      const preflight = {
        blockers: ['Blocker'],
        warnings: [],
      };
      const result = formatPreflightForDialog(preflight);

      expect(result.body).not.toContain('✅ Alles klar!');
    });

    it('should filter empty lines', () => {
      const preflight = {
        blockers: [],
        warnings: [],
      };
      const result = formatPreflightForDialog(preflight);

      const lines = result.body.split('\n').filter((l) => l.trim());
      expect(lines.length).toBe(1);
    });
  });
});
