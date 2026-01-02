import { describe, it, expect, beforeEach } from 'vitest';
import { runExportPreflight, formatPreflightForDialog } from './exportPreflight';
import { DocumentStatus, type DocumentRecord, type AppSettings } from '../types';

describe('exportPreflight', () => {
  const createDoc = (overrides: Partial<DocumentRecord> = {}): DocumentRecord => ({
    id: 'doc-1',
    fileName: 'test.pdf',
    fileType: 'application/pdf',
    uploadDate: '2024-01-15',
    status: DocumentStatus.COMPLETED,
    data: {
      belegDatum: '2024-01-15',
      lieferantName: 'Test GmbH',
      bruttoBetrag: 1190,
      nettoBetrag: 1000,
      mwstBetrag19: 190,
      mwstBetrag7: 0,
      mwstBetrag0: 0,
      mwstSatz0: 0,
      mwstSatz7: 0,
      mwstSatz19: 19,
      lineItems: [],
      lieferantAdresse: '',
      steuernummer: '',
      belegNummerLieferant: '',
      zahlungsmethode: '',
      kontogruppe: '',
      konto_skr03: '',
      ust_typ: '',
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
      beschreibung: '',
      textContent: '',
      qualityScore: 0,
      ocr_score: 0,
      sollKonto: '',
      habenKonto: '',
      steuerkategorie: '',
    },
    ...overrides,
  });

  const createSettings = (overrides: Partial<AppSettings> = {}): AppSettings => ({
    id: 'settings-1',
    taxDefinitions: [],
    accountDefinitions: [],
    datevConfig: undefined,
    accountGroups: [],
    ocrConfig: {
      scores: {},
      required_fields: ['belegDatum', 'bruttoBetrag', 'lieferantName'],
      field_weights: {},
      regex_patterns: {},
      validation_rules: {
        sum_check: true,
        date_check: true,
        min_confidence: 0.8,
      },
    },
    ...overrides,
  });

  describe('runExportPreflight', () => {
    it('should return no blockers for valid documents', () => {
      const docs = [createDoc()];
      const result = runExportPreflight(docs);

      expect(result.blockers.length).toBe(0);
      expect(result.totalDocs).toBe(1);
    });

    it('should return blocker for PROCESSING status', () => {
      const docs = [createDoc({ status: DocumentStatus.PROCESSING })];
      const result = runExportPreflight(docs);

      expect(result.blockers.some(b => b.message.includes('PROCESSING'))).toBe(true);
    });

    it('should return blocker for ERROR status', () => {
      const docs = [createDoc({ status: DocumentStatus.ERROR })];
      const result = runExportPreflight(docs);

      expect(result.blockers.some(b => b.message.includes('ERROR'))).toBe(true);
    });

    it('should return blocker for REVIEW_NEEDED status', () => {
      const docs = [createDoc({ status: DocumentStatus.REVIEW_NEEDED })];
      const result = runExportPreflight(docs);

      expect(result.blockers.some(b => b.message.includes('REVIEW_NEEDED'))).toBe(true);
    });

    it('should return blocker for DUPLICATE status', () => {
      const docs = [createDoc({ status: DocumentStatus.DUPLICATE })];
      const result = runExportPreflight(docs);

      expect(result.blockers.some(b => b.message.includes('DUPLICATE'))).toBe(true);
    });

    it('should return blocker if data is missing', () => {
      const docs = [createDoc({ data: null })];
      const result = runExportPreflight(docs);

      expect(result.blockers.some(b => b.message.includes('Keine extrahierten Daten'))).toBe(true);
    });

    it('should return blocker if belegDatum is missing', () => {
      const docs = [createDoc({ data: { ...createDoc().data!, belegDatum: '' } })];
      const result = runExportPreflight(docs);

      expect(result.blockers.some(b => b.message.includes('Pflichtfeld') && b.message.includes('belegDatum'))).toBe(true);
    });

    it('should return blocker if bruttoBetrag is missing or invalid', () => {
      const docs = [createDoc({ data: { ...createDoc().data!, bruttoBetrag: undefined as any } })];
      const result = runExportPreflight(docs);

      expect(result.blockers.some(b => b.message.includes('Pflichtfeld') && b.message.includes('bruttoBetrag'))).toBe(true);
    });

    it('should return blocker if lieferantName is missing', () => {
      const docs = [createDoc({ data: { ...createDoc().data!, lieferantName: '' } })];
      const result = runExportPreflight(docs);

      expect(result.blockers.some(b => b.message.includes('Pflichtfeld') && b.message.includes('lieferantName'))).toBe(true);
    });

    it('should return blocker if belegDatum is not ISO format', () => {
      const docs = [createDoc({ data: { ...createDoc().data!, belegDatum: '15.01.2024' } })];
      const result = runExportPreflight(docs);

      expect(result.blockers.some(b => b.message.includes('belegDatum') && b.message.includes('ISO'))).toBe(true);
    });

    it('should return blocker for sum mismatch > 0.50', () => {
      const docs = [createDoc({
        data: { ...createDoc().data!, bruttoBetrag: 1300, nettoBetrag: 1000, mwstBetrag19: 190 },
      })];
      const result = runExportPreflight(docs);

      expect(result.blockers.some(b => b.message.includes('Summenprüfung'))).toBe(true);
    });

    it('should return warning for sum mismatch > 0.05 but <= 0.50', () => {
      const docs = [createDoc({
        data: { ...createDoc().data!, bruttoBetrag: 1190.30, nettoBetrag: 1000, mwstBetrag19: 190 },
      })];
      const result = runExportPreflight(docs);

      expect(result.warnings.some(b => b.message.includes('Summenprüfung'))).toBe(true);
      expect(result.blockers.some(b => b.message.includes('Summenprüfung'))).toBe(false);
    });

    it('should not return issues for correct sum', () => {
      const docs = [createDoc()];
      const result = runExportPreflight(docs);

      expect(result.blockers.filter(b => b.message.includes('Summenprüfung'))).toHaveLength(0);
      expect(result.warnings.filter(b => b.message.includes('Summenprüfung'))).toHaveLength(0);
    });

    it('should count total documents correctly', () => {
      const docs = [createDoc(), createDoc({ id: 'doc-2' }), createDoc({ id: 'doc-3' })];
      const result = runExportPreflight(docs);

      expect(result.totalDocs).toBe(3);
    });

    it('should include docId in blocker message', () => {
      const docs = [createDoc({ id: 'custom-id', status: DocumentStatus.ERROR })];
      const result = runExportPreflight(docs);

      expect(result.blockers.some(b => b.docId === 'custom-id')).toBe(true);
    });

    it('should include filename in blocker message', () => {
      const docs = [createDoc({ fileName: 'custom-file.pdf', status: DocumentStatus.ERROR })];
      const result = runExportPreflight(docs);

      expect(result.blockers.some(b => b.fileName === 'custom-file.pdf')).toBe(true);
    });

    it('should use id as fallback for missing filename', () => {
      const docs = [createDoc({ fileName: '', id: 'fallback-id', status: DocumentStatus.ERROR })];
      const result = runExportPreflight(docs);

      expect(result.blockers.some(b => b.fileName === 'fallback-id')).toBe(true);
    });

    it('should allow custom required_fields from settings', () => {
      const settings = createSettings({
        ocrConfig: {
          ...createSettings().ocrConfig!,
          required_fields: ['belegDatum', 'bruttoBetrag', 'lieferantName', 'customField'],
        },
      });
      const docs = [createDoc()];
      const result = runExportPreflight(docs, settings);

      expect(result.blockers.some(b => b.message.includes('customField'))).toBe(true);
    });

    it('should handle multiple blockers for same document', () => {
      const docs = [createDoc({
        data: { ...createDoc().data!, belegDatum: '', lieferantName: '' },
        status: DocumentStatus.ERROR, // This will add a blocker
      })];
      const result = runExportPreflight(docs);

      const docBlockers = result.blockers.filter(b => b.docId === 'doc-1');
      expect(docBlockers.length).toBeGreaterThanOrEqual(3); // ERROR + missing belegDatum + missing lieferantName
    });

    it('should handle mixed document statuses', () => {
      const docs = [
        createDoc({ id: 'doc-1' }),
        createDoc({ id: 'doc-2', status: DocumentStatus.ERROR }),
        createDoc({ id: 'doc-3' }),
      ];
      const result = runExportPreflight(docs);

      expect(result.blockers.length).toBeGreaterThanOrEqual(1);
      expect(result.totalDocs).toBe(3);
    });
  });

  describe('formatPreflightForDialog', () => {
    it('should return Export OK title when no blockers or warnings', () => {
      const result = runExportPreflight([createDoc()]);
      const formatted = formatPreflightForDialog(result);

      expect(formatted.title).toContain('Export OK');
    });

    it('should return Export blockiert title when blockers exist', () => {
      const docs = [createDoc({ status: DocumentStatus.ERROR })];
      const result = runExportPreflight(docs);
      const formatted = formatPreflightForDialog(result);

      expect(formatted.title).toContain('blockiert');
    });

    it('should return Export mit Warnungen title when only warnings exist', () => {
      const docs = [createDoc({
        data: { ...createDoc().data!, bruttoBetrag: 1190.30, nettoBetrag: 1000, mwstBetrag19: 190 },
      })];
      const result = runExportPreflight(docs);
      const formatted = formatPreflightForDialog(result);

      expect(formatted.title).toContain('Warnungen');
    });

    it('should include totalDocs in body', () => {
      const docs = [createDoc(), createDoc({ id: 'doc-2' })];
      const result = runExportPreflight(docs);
      const formatted = formatPreflightForDialog(result);

      expect(formatted.body).toContain('Belege geprüft: 2');
    });

    it('should list blocker messages', () => {
      const docs = [createDoc({ status: DocumentStatus.ERROR })];
      const result = runExportPreflight(docs);
      const formatted = formatPreflightForDialog(result);

      expect(formatted.body).toContain('BLOCKER');
      expect(formatted.body).toContain('ERROR');
    });

    it('should list warning messages', () => {
      const docs = [createDoc({
        data: { ...createDoc().data!, bruttoBetrag: 1190.30, nettoBetrag: 1000, mwstBetrag19: 190 },
      })];
      const result = runExportPreflight(docs);
      const formatted = formatPreflightForDialog(result);

      expect(formatted.body).toContain('WARNUNGEN');
    });

    it('should limit displayed items to 5', () => {
      const docs = Array.from({ length: 10 }, (_, i) =>
        createDoc({ id: `doc-${i}`, status: DocumentStatus.ERROR })
      );
      const result = runExportPreflight(docs);
      const formatted = formatPreflightForDialog(result);

      // Count blocker lines
      const blockerMatches = formatted.body.match(/BLOCKER/g);
      expect(blockerMatches).toHaveLength(1);

      // Should mention "und X weitere"
      expect(formatted.body).toContain('weitere');
    });

    it('should not show more text when under limit', () => {
      const docs = [createDoc(), createDoc({ id: 'doc-2' })];
      const result = runExportPreflight(docs);
      const formatted = formatPreflightForDialog(result);

      expect(formatted.body).not.toContain('weitere');
    });
  });
});
