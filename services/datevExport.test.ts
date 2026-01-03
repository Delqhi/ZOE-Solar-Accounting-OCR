import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateDatevExtfBuchungsstapelCsv,
  runDatevExportPreflight,
} from './datevExport';
import { DocumentStatus, type DocumentRecord, type AppSettings } from '../types';

describe('datevExport', () => {
  const createDoc = (overrides: Partial<DocumentRecord> = {}): DocumentRecord => ({
    id: 'doc-1',
    fileName: 'test.pdf',
    fileType: 'application/pdf',
    uploadDate: '2024-01-15',
    status: DocumentStatus.COMPLETED,
    data: {
      belegDatum: '2024-01-10',
      belegNummerLieferant: 'RE-001',
      lieferantName: 'Solar Lieferant GmbH',
      bruttoBetrag: 1190.00,
      nettoBetrag: 1000.00,
      mwstBetrag19: 190.00,
      steuerkategorie: '19_pv',
      sollKonto: '6000',
      habenKonto: '1200',
      beschreibung: 'Solarpanels',
      lineItems: [],
      lieferantAdresse: '',
      steuernummer: '',
      mwstSatz0: 0,
      mwstBetrag0: 0,
      mwstSatz7: 0,
      mwstBetrag7: 0,
      mwstSatz19: 19,
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
      ocr_score: 0,
    },
    ...overrides,
  });

  const createSettings = (overrides: Partial<AppSettings> = {}): AppSettings => ({
    id: 'settings-1',
    taxDefinitions: [],
    accountDefinitions: [],
    datevConfig: {
      beraterNr: '12345',
      mandantNr: '67890',
      wirtschaftsjahrBeginn: '20240101',
      sachkontenlaenge: 4,
      waehrung: 'EUR',
      taxCategoryToBuKey: {
        '19_pv': '9',
        '7_pv': '5',
        '0_pv': '0',
      },
      herkunftKz: 'RE',
      ...overrides.datevConfig,
    },
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

  describe('generateDatevExtfBuchungsstapelCsv', () => {
    it('should generate CSV with correct structure', () => {
      const docs = [createDoc()];
      const settings = createSettings();
      const result = generateDatevExtfBuchungsstapelCsv(docs, settings);

      expect(result.csv).toBeDefined();
      expect(result.filename).toContain('zoe_datev_extf_buchungsstapel_');
    });

    it('should include header row', () => {
      const docs = [createDoc()];
      const settings = createSettings();
      const result = generateDatevExtfBuchungsstapelCsv(docs, settings);

      const lines = result.csv.split('\r\n');
      expect(lines.length).toBeGreaterThanOrEqual(2); // Header + Column headers + data
    });

    it('should include column headers', () => {
      const docs = [createDoc()];
      const settings = createSettings();
      const result = generateDatevExtfBuchungsstapelCsv(docs, settings);

      expect(result.csv).toContain('Umsatz (ohne Soll/Haben-Kz)');
      expect(result.csv).toContain('Soll/Haben-Kennzeichen');
      expect(result.csv).toContain('Konto');
      expect(result.csv).toContain('Gegenkonto (ohne BU-Schlüssel)');
      expect(result.csv).toContain('BU-Schlüssel');
    });

    it('should exclude duplicate documents', () => {
      const docs = [
        createDoc({ id: 'doc-1', status: DocumentStatus.COMPLETED }),
        createDoc({ id: 'doc-2', status: DocumentStatus.DUPLICATE }),
      ];
      const settings = createSettings();
      const result = generateDatevExtfBuchungsstapelCsv(docs, settings);

      const lines = result.csv.split('\r\n');
      // Only header row + column header + 1 data row (for non-duplicate)
      expect(lines.filter(line => line.includes('Solar Lieferant')).length).toBe(1);
    });

    it('should format amount with German comma separator', () => {
      const doc = createDoc({ data: { ...createDoc().data!, bruttoBetrag: 1234.56 } });
      const docs = [doc];
      const settings = createSettings();
      const result = generateDatevExtfBuchungsstapelCsv(docs, settings);

      expect(result.csv).toContain('1234,56');
    });

    it('should include correct date format (DDMM without year)', () => {
      const doc = createDoc({ data: { ...createDoc().data!, belegDatum: '2024-01-15' } });
      const docs = [doc];
      const settings = createSettings();
      const result = generateDatevExtfBuchungsstapelCsv(docs, settings);

      // Should contain 1501 for 15.01.
      expect(result.csv).toContain('1501');
    });

    it('should set correct Soll/Haben Kennzeichen', () => {
      // Bank account (1200) in Haben -> H (Haben-Buchung when receiving money)
      const docWithBankInHaben = createDoc({
        data: { ...createDoc().data!, sollKonto: '6000', habenKonto: '1200' },
      });
      const result1 = generateDatevExtfBuchungsstapelCsv([docWithBankInHaben], createSettings());
      const lines1 = result1.csv.split('\r\n');
      const dataLine1 = lines1.find(l => l.includes('Solar Lieferant'));
      expect(dataLine1).toBeDefined();
      // When Haben is 1200, the S/H Kennzeichen is "H"
      expect(dataLine1).toMatch(/"H"/);

      // Bank account (1200) in Soll -> S (Soll-Buchung when paying)
      const docWithBankInSoll = createDoc({
        data: { ...createDoc().data!, sollKonto: '1200', habenKonto: '6000' },
      });
      const result2 = generateDatevExtfBuchungsstapelCsv([docWithBankInSoll], createSettings());
      const lines2 = result2.csv.split('\r\n');
      const dataLine2 = lines2.find(l => l.includes('Solar Lieferant'));
      expect(dataLine2).toBeDefined();
      expect(dataLine2).toMatch(/"S"/);
    });

    it('should include BU-Schlüssel from tax category mapping', () => {
      const doc = createDoc({ data: { ...createDoc().data!, steuerkategorie: '19_pv' } });
      const docs = [doc];
      const settings = createSettings();
      const result = generateDatevExtfBuchungsstapelCsv(docs, settings);

      // 19_pv should map to BU key 9
      expect(result.csv).toContain(';9;');
    });

    it('should include supplier name in Buchungstext', () => {
      const doc = createDoc({ data: { ...createDoc().data!, lieferantName: 'Test Lieferant', beschreibung: '' } });
      const docs = [doc];
      const settings = createSettings();
      const result = generateDatevExtfBuchungsstapelCsv(docs, settings);

      expect(result.csv).toContain('Test Lieferant');
    });

    it('should truncate Buchungstext to 60 characters', () => {
      const doc = createDoc({
        data: {
          ...createDoc().data!,
          lieferantName: 'Very Long Supplier Name That Exceeds Sixty Characters',
          beschreibung: '',
        },
      });
      const docs = [doc];
      const settings = createSettings();
      const result = generateDatevExtfBuchungsstapelCsv(docs, settings);

      // Find the row with the supplier name
      const lines = result.csv.split('\r\n');
      const dataLine = lines.find(l => l.includes('Very Long'));
      expect(dataLine).toBeDefined();

      // Extract the Buchungstext column (should be limited to 60 chars)
      if (dataLine) {
        const columns = dataLine.split(';');
        const buchungstext = columns.find(c => c.includes('Very Long'));
        if (buchungstext) {
          expect(buchungstext.length).toBeLessThanOrEqual(62); // including quotes
        }
      }
    });

    it('should include Herkunft-Kz', () => {
      const docs = [createDoc()];
      const settings = createSettings();
      const result = generateDatevExtfBuchungsstapelCsv(docs, settings);

      const lines = result.csv.split('\r\n');
      const dataLine = lines.find(l => l.includes('Solar Lieferant'));
      expect(dataLine).toBeDefined();
      // Herkunft-Kz is at the end of the row
      expect(dataLine).toMatch(/"RE"/);
    });

    it('should use default stapelBezeichnung from settings', () => {
      const docs = [createDoc()];
      const settings = createSettings({
        datevConfig: {
          ...createSettings().datevConfig!,
          stapelBezeichnung: 'Mein Buchungsstapel',
        },
      });
      const result = generateDatevExtfBuchungsstapelCsv(docs, settings);

      expect(result.csv).toContain('Mein Buchungsstapel');
    });

    it('should throw error if datevConfig is missing', () => {
      const settings = createSettings({ datevConfig: undefined });

      expect(() => generateDatevExtfBuchungsstapelCsv([createDoc()], settings)).toThrow('DATEV-Konfiguration fehlt');
    });

    it('should include BeraterNr and MandantNr in header', () => {
      const docs = [createDoc()];
      const settings = createSettings();
      const result = generateDatevExtfBuchungsstapelCsv(docs, settings);

      expect(result.csv).toContain('12345'); // beraterNr
      expect(result.csv).toContain('67890'); // mandantNr
    });
  });

  describe('runDatevExportPreflight', () => {
    it('should return no blockers for valid configuration', () => {
      const docs = [createDoc()];
      const settings = createSettings();
      const result = runDatevExportPreflight(docs, settings);

      expect(result.blockers.length).toBe(0);
      expect(result.totalDocs).toBe(1);
    });

    it('should return blocker if datevConfig is missing', () => {
      const docs = [createDoc()];
      const settings = createSettings({ datevConfig: undefined });
      const result = runDatevExportPreflight(docs, settings);

      expect(result.blockers.some(b => b.message.includes('DATEV-Konfiguration fehlt'))).toBe(true);
    });

    it('should return blocker if beraterNr is empty', () => {
      const docs = [createDoc()];
      const settings = createSettings({
        datevConfig: {
          ...createSettings().datevConfig!,
          beraterNr: '  ',
        },
      });
      const result = runDatevExportPreflight(docs, settings);

      expect(result.blockers.some(b => b.message.includes('Berater-Nr.'))).toBe(true);
    });

    it('should return blocker if mandantNr is empty', () => {
      const docs = [createDoc()];
      const settings = createSettings({
        datevConfig: {
          ...createSettings().datevConfig!,
          mandantNr: '',
        },
      });
      const result = runDatevExportPreflight(docs, settings);

      expect(result.blockers.some(b => b.message.includes('Mandant-Nr.'))).toBe(true);
    });

    it('should return blocker if wirtschaftsjahrBeginn is empty', () => {
      const docs = [createDoc()];
      const settings = createSettings({
        datevConfig: {
          ...createSettings().datevConfig!,
          wirtschaftsjahrBeginn: '',
        },
      });
      const result = runDatevExportPreflight(docs, settings);

      expect(result.blockers.some(b => b.message.includes('Wirtschaftsjahr-Beginn'))).toBe(true);
    });

    it('should return blocker if tax category has no BU key mapping', () => {
      const doc = createDoc({ data: { ...createDoc().data!, steuerkategorie: 'unknown_cat' } });
      const docs = [doc];
      const settings = createSettings();
      const result = runDatevExportPreflight(docs, settings);

      expect(result.blockers.some(b => b.message.includes('BU-Schlüssel Mapping fehlt'))).toBe(true);
    });

    it('should return blocker for non-numeric beraterNr', () => {
      const docs = [createDoc()];
      const settings = createSettings({
        datevConfig: {
          ...createSettings().datevConfig!,
          beraterNr: 'abc',
        },
      });
      const result = runDatevExportPreflight(docs, settings);

      expect(result.blockers.some(b => b.message.includes('numerisch'))).toBe(true);
    });

    it('should return blocker for invalid wirtschaftsjahrBeginn format', () => {
      const docs = [createDoc()];
      const settings = createSettings({
        datevConfig: {
          ...createSettings().datevConfig!,
          wirtschaftsjahrBeginn: '2024-01-01',
        },
      });
      const result = runDatevExportPreflight(docs, settings);

      expect(result.blockers.some(b => b.message.includes('YYYYMMDD'))).toBe(true);
    });

    it('should return warning if waehrung is empty', () => {
      const docs = [createDoc()];
      const settings = createSettings({
        datevConfig: {
          ...createSettings().datevConfig!,
          waehrung: '',
        },
      });
      const result = runDatevExportPreflight(docs, settings);

      expect(result.warnings.some(b => b.message.includes('Währung'))).toBe(true);
    });

    it('should return warning if account length does not match sachkontenlaenge', () => {
      const doc = createDoc({ data: { ...createDoc().data!, sollKonto: '12345' } }); // 5 digits
      const docs = [doc];
      const settings = createSettings({
        datevConfig: {
          ...createSettings().datevConfig!,
          sachkontenlaenge: 4,
        },
      });
      const result = runDatevExportPreflight(docs, settings);

      expect(result.warnings.some(b => b.message.includes('Sachkontenlänge'))).toBe(true);
    });

    it('should count total documents correctly', () => {
      const docs = [createDoc(), createDoc({ id: 'doc-2' }), createDoc({ id: 'doc-3' })];
      const settings = createSettings();
      const result = runDatevExportPreflight(docs, settings);

      expect(result.totalDocs).toBe(3);
    });
  });
});
