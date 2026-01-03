import { describe, it, expect } from 'vitest';
import { generateElsterXml, downloadElsterXml } from './elsterExport';
import type { ElsterExportRequest, UstvaExportData } from './elsterExport';

describe('elsterExport', () => {
  const createUstvaData = (overrides: Partial<UstvaExportData> = {}): UstvaExportData => ({
    period: '2024Q1',
    base0: 1000.00,
    reverseChargeBase: 0,
    base7: 500.00,
    tax7: 35.00,
    base19: 2000.00,
    tax19: 380.00,
    ...overrides,
  });

  const createRequest = (overrides: Partial<ElsterExportRequest> = {}): ElsterExportRequest => ({
    stammdaten: {
      unternehmensName: 'Solar GmbH',
      land: 'DE',
      plz: '10115',
      ort: 'Berlin',
      strasse: 'Hauptstraße',
      hausnummer: '1',
      eigeneSteuernummer: '1234567890',
      eigeneUstIdNr: 'DE123456789',
      finanzamtName: 'Finanzamt Berlin',
      finanzamtNr: '1234',
      kontaktEmail: 'info@solar-gmbh.de',
      iban: 'DE89370400440532013000',
      ...overrides.stammdaten,
    },
    ustvaData: createUstvaData(overrides.ustvaData),
  });

  describe('generateElsterXml', () => {
    it('should generate valid XML structure', () => {
      const xml = generateElsterXml(createRequest());

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<Elster');
      expect(xml).toContain('<TransferHeader');
      expect(xml).toContain('<DatenTeil');
    });

    it('should include correct namespace', () => {
      const xml = generateElsterXml(createRequest());

      expect(xml).toContain('xmlns="http://www.elster.de/2002/XMLSchema"');
    });

    it('should include company name correctly', () => {
      const xml = generateElsterXml(createRequest());

      expect(xml).toContain('<Name>Solar GmbH</Name>');
    });

    it('should escape special XML characters', () => {
      const xml = generateElsterXml(createRequest({
        stammdaten: {
          unternehmensName: 'Müller & Co. <Special>',
          land: 'DE',
          plz: '10115',
          ort: 'Berlin',
          strasse: 'Teststraße',
          hausnummer: '1',
          eigeneSteuernummer: '1234567890',
        },
      }));

      expect(xml).toContain('Müller &amp; Co. &lt;Special&gt;');
      expect(xml).not.toContain('&<>"');
    });

    it('should handle quarterly period correctly', () => {
      const xml = generateElsterXml(createRequest({
        ustvaData: createUstvaData({ period: '2024Q1' }),
      }));

      expect(xml).toContain('<Jahr>2024</Jahr>');
      expect(xml).toContain('<Zeitraum>41</Zeitraum>'); // Q1 = 41
    });

    it('should handle Q2 period correctly', () => {
      const xml = generateElsterXml(createRequest({
        ustvaData: createUstvaData({ period: '2024Q2' }),
      }));

      expect(xml).toContain('<Zeitraum>42</Zeitraum>'); // Q2 = 42
    });

    it('should handle Q3 period correctly', () => {
      const xml = generateElsterXml(createRequest({
        ustvaData: createUstvaData({ period: '2024Q3' }),
      }));

      expect(xml).toContain('<Zeitraum>43</Zeitraum>'); // Q3 = 43
    });

    it('should handle Q4 period correctly', () => {
      const xml = generateElsterXml(createRequest({
        ustvaData: createUstvaData({ period: '2024Q4' }),
      }));

      expect(xml).toContain('<Zeitraum>44</Zeitraum>'); // Q4 = 44
    });

    it('should handle monthly period correctly', () => {
      const xml = generateElsterXml(createRequest({
        ustvaData: createUstvaData({ period: '202401' }),
      }));

      expect(xml).toContain('<Jahr>2024</Jahr>');
      expect(xml).toContain('<Zeitraum>01</Zeitraum>');
    });

    it('should format currency with German comma separator', () => {
      const xml = generateElsterXml(createRequest({
        ustvaData: createUstvaData({ base19: 1234.56 }),
      }));

      expect(xml).toContain('<Kz86>1234,56</Kz86>');
    });

    it('should format tax values with German comma separator', () => {
      const xml = generateElsterXml(createRequest({
        ustvaData: createUstvaData({ tax19: 234.56 }),
      }));

      expect(xml).toContain('<Kz89>234,56</Kz89>');
    });

    it('should include UstId if present', () => {
      const xml = generateElsterXml(createRequest());

      expect(xml).toContain('<UstId>DE123456789</UstId>');
    });

    it('should include optional email if present', () => {
      const xml = generateElsterXml(createRequest());

      expect(xml).toContain('<Email>info@solar-gmbh.de</Email>');
    });

    it('should include IBAN if present', () => {
      const xml = generateElsterXml(createRequest());

      expect(xml).toContain('<IBAN>DE89370400440532013000</IBAN>');
    });

    it('should calculate Kz93 (total tax) correctly', () => {
      const xml = generateElsterXml(createRequest({
        ustvaData: createUstvaData({ tax7: 35.00, tax19: 380.00 }),
      }));

      expect(xml).toContain('<Kz93>415,00</Kz93>');
    });

    it('should include product name and version', () => {
      const xml = generateElsterXml(createRequest());

      expect(xml).toContain('<ProduktName>ZOE Solar Accounting OCR</ProduktName>');
      expect(xml).toContain('<ProduktVersion>1.0</ProduktVersion>');
    });

    it('should include steuernummer', () => {
      const xml = generateElsterXml(createRequest());

      expect(xml).toContain('<Steuernummer>1234567890</Steuernummer>');
    });

    it('should use default finanzamtNr if not provided', () => {
      const xml = generateElsterXml(createRequest({
        stammdaten: {
          ...createRequest().stammdaten,
          finanzamtNr: undefined,
        },
      }));

      expect(xml).toContain('<Empfaenger id="F">0000</Empfaenger>');
    });

    it('should handle optional fields gracefully when missing', () => {
      const minimalRequest: ElsterExportRequest = {
        stammdaten: {
          unternehmensName: 'Minimal GmbH',
          land: 'DE',
          plz: '10115',
          ort: 'Berlin',
          strasse: 'Teststraße',
          hausnummer: '1',
          eigeneSteuernummer: '1234567890',
        },
        ustvaData: createUstvaData(),
      };

      const xml = generateElsterXml(minimalRequest);

      expect(xml).not.toContain('<Email>');
      expect(xml).not.toContain('<IBAN>');
      expect(xml).not.toContain('<UstId>');
    });
  });

  describe('downloadElsterXml', () => {
    it('should create a blob and trigger download', () => {
      const xml = '<?xml version="1.0"?><Elster/>';

      // This test verifies the function doesn't throw
      // In a real browser environment, it would create a download
      expect(() => downloadElsterXml(xml, 'test.xml')).not.toThrow();
    });
  });
});
