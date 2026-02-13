import {
  DocumentStatus,
  type ExtractedData,
  type DocumentRecord,
  type AppSettings,
} from '../../types';
import {
  applyAccountingRules,
  validateInvoiceData,
  generateZoeInvoiceId,
  suggestTaxCategory,
  SKR03_ACCOUNTS,
  TAX_CATEGORIES,
} from '../ruleEngine';
import { describe, expect, it } from 'vitest';

describe('ruleEngine.ts', () => {
  const baseData: ExtractedData = {
    belegDatum: '2025-01-15',
    belegNummerLieferant: 'RE-001',
    lieferantName: 'SolarTech GmbH',
    lieferantAdresse: 'Sonnenallee 1, 12345 Berlin',
    steuernummer: '12 345 67890',
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
    kontierungskonto: '4964',
    steuerkategorie: '19%',
    kontogruppe: '',
    konto_skr03: '4964',
    ust_typ: 'VSt',
    sollKonto: '4964',
    habenKonto: '1200',
    steuerKategorie: '19% Vorsteuer',
    eigeneBelegNummer: '',
    zahlungsDatum: '',
    zahlungsStatus: '',
    aufbewahrungsOrt: '',
    rechnungsEmpfaenger: '',
    kleinbetrag: false,
    vorsteuerabzug: true,
    reverseCharge: false,
    privatanteil: false,
    beschreibung: 'Software',
    quantity: 1,
  };

  const mockDocuments: DocumentRecord[] = [];
  const mockSettings: AppSettings = {
    id: 'test-settings',
    accountGroups: [],
    accountDefinitions: [],
    taxDefinitions: [],
    ocrConfig: {
      scores: {},
      required_fields: [],
      field_weights: {},
      regex_patterns: {},
      validation_rules: {
        sum_check: true,
        date_check: true,
        min_confidence: 0.5,
      },
    },
  };

  describe('SKR03_ACCOUNTS', () => {
    it('should have valid account definitions', () => {
      expect(SKR03_ACCOUNTS.length).toBeGreaterThan(0);
      SKR03_ACCOUNTS.forEach((account) => {
        expect(account.id).toBeDefined();
        expect(account.name).toBeDefined();
        expect(account.skr03).toBeDefined();
        expect(account.steuerkategorien.length).toBeGreaterThan(0);
      });
    });

    it('should include expected accounts', () => {
      const accountIds = SKR03_ACCOUNTS.map((a) => a.id);
      expect(accountIds).toContain('3400');
      expect(accountIds).toContain('4964');
      expect(accountIds).toContain('4400');
    });
  });

  describe('TAX_CATEGORIES', () => {
    it('should have all required tax categories', () => {
      const values = TAX_CATEGORIES.map((t) => t.value);
      expect(values).toContain('19%');
      expect(values).toContain('7%');
      expect(values).toContain('0%');
      expect(values).toContain('RC');
    });
  });

  describe('applyAccountingRules()', () => {
    it('should apply override rule when provided', () => {
      const result = applyAccountingRules(baseData, mockDocuments, mockSettings, {
        accountId: '4400',
        taxCategoryValue: '7%',
      });

      expect(result.kontierungskonto).toBe('4400');
      expect(result.steuerkategorie).toBe('7%');
    });

    it('should auto-classify software vendors', () => {
      const softwareData = { ...baseData, lieferantName: 'Microsoft Deutschland GmbH' };
      const result = applyAccountingRules(softwareData, mockDocuments, mockSettings);

      expect(result.kontierungskonto).toBe('4964');
      expect(result.steuerkategorie).toBe('19%');
    });

    it('should auto-classify office supplies', () => {
      const officeData = {
        ...baseData,
        lieferantName: 'Staples GmbH',
        beschreibung: 'Büromaterial Papier Stifte',
      };
      delete officeData.kontierungskonto;
      delete officeData.steuerkategorie;

      const result = applyAccountingRules(officeData, mockDocuments, mockSettings);

      expect(result.kontierungskonto).toBe('4400');
    });

    it('should auto-classify travel costs', () => {
      const travelData = {
        ...baseData,
        lieferantName: 'Deutsche Bahn AG',
        beschreibung: 'Zugticket Berlin Hamburg',
      };
      delete travelData.kontierungskonto;
      delete travelData.steuerkategorie;

      const result = applyAccountingRules(travelData, mockDocuments, mockSettings);

      expect(result.kontierungskonto).toBe('5410');
    });

    it('should set sollKonto and habenKonto', () => {
      const result = applyAccountingRules(baseData, mockDocuments, mockSettings);

      expect(result.sollKonto).toBeDefined();
      expect(result.habenKonto).toBe('1200');
    });

    it('should include kontierungBegruendung when auto-classifying', () => {
      const softwareData = { ...baseData };
      delete softwareData.kontierungskonto;
      delete softwareData.steuerkategorie;

      const result = applyAccountingRules(softwareData, mockDocuments, mockSettings);

      expect(result.kontierungBegruendung).toBeDefined();
      expect(result.kontierungBegruendung).toContain('Confidence:');
    });
  });

  describe('validateInvoiceData()', () => {
    it('should pass valid invoice data', () => {
      const result = validateInvoiceData(baseData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when sum check is incorrect', () => {
      const invalidData = { ...baseData, bruttoBetrag: 200 };
      const result = validateInvoiceData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Summenprüfung');
    });

    it('should fail when supplier name is too short', () => {
      const invalidData = { ...baseData, lieferantName: 'A' };
      const result = validateInvoiceData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Lieferantenname fehlt oder ungültig');
    });

    it('should fail when date format is invalid', () => {
      const invalidData = { ...baseData, belegDatum: '01-01-2025' };
      const result = validateInvoiceData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Belegdatum');
    });

    it('should fail when bruttoBetrag is zero', () => {
      const invalidData = { ...baseData, bruttoBetrag: 0 };
      const result = validateInvoiceData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Bruttobetrag muss größer als 0 sein');
    });
  });

  describe('generateZoeInvoiceId()', () => {
    it('should generate correct ZOE invoice ID format', () => {
      const id = generateZoeInvoiceId('2025-01-15', []);

      expect(id).toMatch(/^ZOE-2025-\d{4}$/);
    });

    it('should increment number based on existing documents', () => {
      const existingDocs: DocumentRecord[] = [
        {
          id: '1',
          fileName: 'a.pdf',
          fileType: 'pdf',
          uploadDate: '2025-01-01',
          status: DocumentStatus.COMPLETED,
          data: { ...baseData, belegDatum: '2025-01-01' },
          previewUrl: '',
        },
        {
          id: '2',
          fileName: 'b.pdf',
          fileType: 'pdf',
          uploadDate: '2025-01-02',
          status: DocumentStatus.COMPLETED,
          data: { ...baseData, belegDatum: '2025-01-02' },
          previewUrl: '',
        },
      ];

      const id = generateZoeInvoiceId('2025-01-15', existingDocs);

      expect(id).toBe('ZOE-2025-0003');
    });

    it('should use current year when date is empty', () => {
      const id = generateZoeInvoiceId('', []);
      const year = new Date().getFullYear().toString();

      expect(id).toMatch(new RegExp(`^ZOE-${year}-\\d{4}$`));
    });
  });

  describe('suggestTaxCategory()', () => {
    it('should suggest 19% for standard invoice', () => {
      const result = suggestTaxCategory(baseData);

      expect(result?.value).toBe('19%');
    });

    it('should suggest 7% for reduced rate', () => {
      const reducedData = { ...baseData, mwstBetrag19: 0, mwstBetrag7: 7 };
      const result = suggestTaxCategory(reducedData);

      expect(result?.value).toBe('7%');
    });

    it('should return default 19% for unrecognized category', () => {
      const unknownData = { ...baseData, mwstBetrag19: 0, mwstBetrag7: 0 };
      const result = suggestTaxCategory(unknownData);

      expect(result?.value).toBe('19%');
    });
  });
});
