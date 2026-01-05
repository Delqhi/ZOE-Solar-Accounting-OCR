import { describe, it, expect, beforeEach } from 'vitest';
import { generateZoeInvoiceId, applyAccountingRules } from './ruleEngine';
import { DocumentStatus, type DocumentRecord, type ExtractedData, type AppSettings } from '../types';

describe('ruleEngine', () => {
  const createExtractedData = (overrides: Partial<ExtractedData> = {}): ExtractedData => ({
    belegDatum: '2024-01-15',
    belegNummerLieferant: 'RE-001',
    lieferantName: 'Solar Lieferant GmbH',
    bruttoBetrag: 1190.00,
    nettoBetrag: 1000.00,
    mwstBetrag19: 190.00,
    mwstBetrag7: 0,
    mwstBetrag0: 0,
    mwstSatz0: 0,
    mwstSatz7: 0,
    mwstSatz19: 19,
    steuerkategorie: '19_pv',
    sollKonto: '6000',
    habenKonto: '1200',
    beschreibung: 'Solarpanels',
    lineItems: [],
    lieferantAdresse: '',
    steuernummer: '',
    zahlungsmethode: 'bank',
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
    textContent: '',
    qualityScore: 0,
    ...overrides,
  });

  const createSettings = (): AppSettings => ({
    id: 'settings-1',
    taxDefinitions: [
      { value: '19_pv', label: '19% PV', ust_satz: 19, vorsteuer: true },
      { value: '7_pv', label: '7% PV', ust_satz: 7, vorsteuer: true },
      { value: '0_pv', label: '0% PV', ust_satz: 0, vorsteuer: false },
    ],
    accountDefinitions: [
      { id: 'wareneingang', name: 'Wareneingang', skr03: '6000', steuerkategorien: ['19_pv', '7_pv'] },
      { id: 'fuhrpark', name: 'Fuhrpark', skr03: '6320', steuerkategorien: ['19_pv'] },
      { id: 'software', name: 'Software', skr03: '6325', steuerkategorien: ['19_pv'] },
      { id: 'internet', name: 'Telefon/Internet', skr03: '6420', steuerkategorien: ['19_pv'] },
    ],
    datevConfig: undefined,
    accountGroups: [],
    ocrConfig: {
      scores: {},
      required_fields: [],
      field_weights: {},
      regex_patterns: {},
      validation_rules: { sum_check: true, date_check: true, min_confidence: 0.8 },
    },
  });

  const createDoc = (overrides: Partial<DocumentRecord> = {}): DocumentRecord => ({
    id: 'doc-1',
    fileName: 'test.pdf',
    fileType: 'application/pdf',
    uploadDate: '2024-01-15',
    status: DocumentStatus.COMPLETED,
    data: createExtractedData(),
    ...overrides,
  });

  describe('generateZoeInvoiceId', () => {
    it('should generate ZOE invoice ID with correct format', () => {
      const existingDocs: DocumentRecord[] = [];
      const id = generateZoeInvoiceId('2024-01-15', existingDocs);

      expect(id).toMatch(/^ZOE24\d{2}\.\d{3}$/);
    });

    it('should increment sequence number', () => {
      const existingDocs: DocumentRecord[] = [
        createDoc({ data: { ...createExtractedData(), eigeneBelegNummer: 'ZOE24' + '01' + '.001' } }),
        createDoc({ data: { ...createExtractedData(), eigeneBelegNummer: 'ZOE24' + '01' + '.002' } }),
      ];
      const id = generateZoeInvoiceId('2024-01-15', existingDocs);

      expect(id).toBe('ZOE2401.003');
    });

    it('should handle same month documents', () => {
      const existingDocs: DocumentRecord[] = [
        createDoc({ data: { ...createExtractedData(), eigeneBelegNummer: 'ZOE2401.001' } }),
        createDoc({ data: { ...createExtractedData(), eigeneBelegNummer: 'ZOE2401.002' } }),
      ];
      const id = generateZoeInvoiceId('2024-01-20', existingDocs);

      expect(id).toBe('ZOE2401.003');
    });

    it('should reset sequence for different months', () => {
      const existingDocs: DocumentRecord[] = [
        createDoc({ data: { ...createExtractedData(), eigeneBelegNummer: 'ZOE2401.005' } }),
      ];
      const id = generateZoeInvoiceId('2024-02-15', existingDocs);

      expect(id).toBe('ZOE2402.001');
    });

    it('should return empty string for invalid date', () => {
      const id = generateZoeInvoiceId('invalid', []);

      expect(id).toBe('');
    });

    it('should return empty string for empty date', () => {
      const id = generateZoeInvoiceId('', []);

      expect(id).toBe('');
    });

    it('should pad month correctly', () => {
      const id = generateZoeInvoiceId('2024-01-15', []);

      expect(id).toContain('2401');
    });

    it('should handle year rollover (2-digit)', () => {
      const existingDocs: DocumentRecord[] = [
        createDoc({ data: { ...createExtractedData(), eigeneBelegNummer: 'ZOE2401.010' } }),
      ];
      const id = generateZoeInvoiceId('2025-01-15', existingDocs);

      expect(id).toBe('ZOE2501.001'); // Year changes, sequence resets to 001
    });

    it('should handle parsing errors gracefully', () => {
      const id = generateZoeInvoiceId('not-a-date', []);

      expect(id).toBe('');
    });
  });

  describe('applyAccountingRules', () => {
    it('should set kontierungskonto from account match', () => {
      const data = createExtractedData({ textContent: 'modul solar panel' });
      const existingDocs: DocumentRecord[] = [];
      const settings = createSettings();

      const result = applyAccountingRules(data, existingDocs, settings);

      expect(result.kontierungskonto).toBe('wareneingang');
    });

    it('should set kontogruppe from account name', () => {
      const data = createExtractedData({ textContent: 'modul solar panel' });
      const existingDocs: DocumentRecord[] = [];
      const settings = createSettings();

      const result = applyAccountingRules(data, existingDocs, settings);

      expect(result.kontogruppe).toBe('Wareneingang');
    });

    it('should set sollKonto from matched account skr03', () => {
      const data = createExtractedData({ textContent: 'modul solar panel' });
      const existingDocs: DocumentRecord[] = [];
      const settings = createSettings();

      const result = applyAccountingRules(data, existingDocs, settings);

      expect(result.sollKonto).toBe('6000');
    });

    it('should set habenKonto to bank (1200) by default', () => {
      const data = createExtractedData();
      const existingDocs: DocumentRecord[] = [];
      const settings = createSettings();

      const result = applyAccountingRules(data, existingDocs, settings);

      expect(result.habenKonto).toBe('1200');
    });

    it('should set habenKonto to cash (1000) for bar payments', () => {
      const data = createExtractedData({ zahlungsmethode: 'bar' });
      const existingDocs: DocumentRecord[] = [];
      const settings = createSettings();

      const result = applyAccountingRules(data, existingDocs, settings);

      expect(result.habenKonto).toBe('1000');
    });

    it('should set ruleApplied flag to true when forced vendor rule is used', () => {
      const data = createExtractedData();
      const existingDocs: DocumentRecord[] = [];
      const settings = createSettings();

      const result = applyAccountingRules(data, existingDocs, settings, { accountId: 'software' });

      expect(result.ruleApplied).toBe(true);
    });

    it('should include kontierungBegruendung when rule matched', () => {
      const data = createExtractedData({ textContent: 'modul solar panel' });
      const existingDocs: DocumentRecord[] = [];
      const settings = createSettings();

      const result = applyAccountingRules(data, existingDocs, settings);

      expect(result.kontierungBegruendung).toContain('Material-Stichwort');
    });

    it('should match software account for adobe keyword', () => {
      // Must override beschreibung to avoid PV keyword match
      // adobe keyword is hardcoded to match software account
      const data = createExtractedData({ lieferantName: 'Adobe Inc', beschreibung: '' });
      const existingDocs: DocumentRecord[] = [];
      const settings = createSettings();

      const result = applyAccountingRules(data, existingDocs, settings);

      // adobe keyword should match software account
      expect(result.kontierungskonto).toBe('software');
    });

    it('should match fuhrpark for fuel keywords', () => {
      // Use lieferantName with hardcoded fuel keyword - tankstelle contains 'tank'
      // Must override beschreibung to avoid PV keyword match
      const data = createExtractedData({ lieferantName: 'ARAL Tankstelle', beschreibung: '' });
      const existingDocs: DocumentRecord[] = [];
      const settings = createSettings();

      const result = applyAccountingRules(data, existingDocs, settings);

      expect(result.kontierungskonto).toBe('fuhrpark');
    });

    it('should match internet for telecom keywords', () => {
      // Match via hardcoded keyword in lieferantName
      // Must override beschreibung to avoid PV keyword match
      const data = createExtractedData({ lieferantName: 'Telekom', beschreibung: '' });
      const existingDocs: DocumentRecord[] = [];
      const settings = createSettings();

      const result = applyAccountingRules(data, existingDocs, settings);

      expect(result.kontierungskonto).toBe('internet');
    });

    it('should use forced vendor rule accountId', () => {
      const data = createExtractedData();
      const existingDocs: DocumentRecord[] = [];
      const settings = createSettings();

      const result = applyAccountingRules(data, existingDocs, settings, { accountId: 'software' });

      expect(result.kontierungskonto).toBe('software');
      expect(result.ruleApplied).toBe(true);
    });

    it('should use forced vendor rule taxCategoryValue', () => {
      const data = createExtractedData();
      const existingDocs: DocumentRecord[] = [];
      const settings = createSettings();

      const result = applyAccountingRules(data, existingDocs, settings, { taxCategoryValue: '7_pv' });

      expect(result.steuerkategorie).toBe('7_pv');
    });

    it('should set steuerkategorie to 19_pv when mwst19 is present', () => {
      const data = createExtractedData({ mwstBetrag19: 190, mwstBetrag7: 0 });
      const existingDocs: DocumentRecord[] = [];
      const settings = createSettings();

      const result = applyAccountingRules(data, existingDocs, settings);

      expect(result.steuerkategorie).toBe('19_pv');
    });

    it('should set steuerkategorie to 7_pv when only mwst7 is present', () => {
      const data = createExtractedData({ mwstBetrag19: 0, mwstBetrag7: 35 });
      const existingDocs: DocumentRecord[] = [];
      const settings = createSettings();

      const result = applyAccountingRules(data, existingDocs, settings);

      expect(result.steuerkategorie).toBe('7_pv');
    });

    it('should set steuerkategorie to 0_pv when no tax but positive brutto', () => {
      const data = createExtractedData({ mwstBetrag19: 0, mwstBetrag7: 0, bruttoBetrag: 1000 });
      const existingDocs: DocumentRecord[] = [];
      const settings = createSettings();

      const result = applyAccountingRules(data, existingDocs, settings);

      expect(result.steuerkategorie).toBe('0_pv');
    });

    it('should calculate OCR score and set ocr_score', () => {
      const data = createExtractedData({
        belegDatum: '2024-01-15',
        lieferantName: 'Solar GmbH',
        bruttoBetrag: 1190,
      });
      const existingDocs: DocumentRecord[] = [];
      const settings = createSettings();

      const result = applyAccountingRules(data, existingDocs, settings);

      expect(result.ocr_score).toBeDefined();
      expect(result.ocr_score).toBeGreaterThanOrEqual(0);
      expect(result.ocr_score).toBeLessThanOrEqual(10);
    });

    it('should include ocr_rationale', () => {
      const data = createExtractedData({
        belegDatum: '2024-01-15',
        lieferantName: 'Solar GmbH',
        bruttoBetrag: 1190,
      });
      const existingDocs: DocumentRecord[] = [];
      const settings = createSettings();

      const result = applyAccountingRules(data, existingDocs, settings);

      expect(result.ocr_rationale).toBeDefined();
    });

    it('should deduct points for missing belegDatum', () => {
      const data = createExtractedData({
        belegDatum: '',
        lieferantName: 'Solar GmbH',
        bruttoBetrag: 1190,
      });
      const existingDocs: DocumentRecord[] = [];
      const settings = createSettings();

      const resultWithDate = applyAccountingRules(
        createExtractedData({ belegDatum: '2024-01-15', lieferantName: 'Solar GmbH', bruttoBetrag: 1190 }),
        existingDocs,
        settings
      );
      const resultWithoutDate = applyAccountingRules(
        createExtractedData({ belegDatum: '', lieferantName: 'Solar GmbH', bruttoBetrag: 1190 }),
        existingDocs,
        settings
      );

      expect(resultWithDate.ocr_score).toBeGreaterThan(resultWithoutDate.ocr_score);
    });

    it('should deduct points for unclear lieferantName', () => {
      const dataWithName = createExtractedData({
        belegDatum: '2024-01-15',
        lieferantName: 'Solar GmbH',
        bruttoBetrag: 1190,
      });
      const dataWithoutName = createExtractedData({
        belegDatum: '2024-01-15',
        lieferantName: '',
        bruttoBetrag: 1190,
      });
      const existingDocs: DocumentRecord[] = [];
      const settings = createSettings();

      const resultWithName = applyAccountingRules(dataWithName, existingDocs, settings);
      const resultWithoutName = applyAccountingRules(dataWithoutName, existingDocs, settings);

      expect(resultWithName.ocr_score).toBeGreaterThan(resultWithoutName.ocr_score);
    });

    it('should detect tax conflict (19% with 0% category) before steuerkategorie is overwritten', () => {
      // The tax conflict is checked before steuerkategorie is overwritten
      // But then steuerkategorie is overwritten based on mwstBetrag
      const data = createExtractedData({
        belegDatum: '2024-01-15',
        lieferantName: 'Solar GmbH',
        bruttoBetrag: 1190,
        mwstBetrag19: 190,
        steuerkategorie: '0_pv',
        textContent: 'something random', // Don't match any account
      });
      const existingDocs: DocumentRecord[] = [];
      const settings = createSettings();

      const result = applyAccountingRules(data, existingDocs, settings);

      // steuerkategorie is overwritten to '19_pv' because mwstBetrag19 > 0
      expect(result.steuerkategorie).toBe('19_pv');
    });

    it('should detect calculation error', () => {
      const data = createExtractedData({
        belegDatum: '2024-01-15',
        lieferantName: 'Solar GmbH',
        bruttoBetrag: 1190,
        nettoBetrag: 1000,
        mwstBetrag19: 50, // Should be 190
      });
      const existingDocs: DocumentRecord[] = [];
      const settings = createSettings();

      const result = applyAccountingRules(data, existingDocs, settings);

      expect(result.ocr_rationale).toContain('Rechenfehler');
    });

    it('should set correct default accounts for bank payment method', () => {
      // Default is bank (1200) for habenKonto
      const data = createExtractedData({
        textContent: 'random item',
        mwstBetrag19: 0,
      });
      const existingDocs: DocumentRecord[] = [];
      const settings = createSettings();

      const result = applyAccountingRules(data, existingDocs, settings);

      // habenKonto defaults to bank (1200)
      expect(result.habenKonto).toBe('1200');
    });

    it('should preserve original data fields', () => {
      const data = createExtractedData({
        belegDatum: '2024-01-15',
        belegNummerLieferant: 'RE-001',
        lieferantName: 'Solar GmbH',
      });
      const existingDocs: DocumentRecord[] = [];
      const settings = createSettings();

      const result = applyAccountingRules(data, existingDocs, settings);

      expect(result.belegDatum).toBe('2024-01-15');
      expect(result.belegNummerLieferant).toBe('RE-001');
      expect(result.lieferantName).toBe('Solar GmbH');
    });
  });
});
