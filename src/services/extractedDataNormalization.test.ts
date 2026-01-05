import { describe, it, expect } from 'vitest';
import { normalizeExtractedData } from './extractedDataNormalization';

describe('extractedDataNormalization', () => {
  describe('normalizeExtractedData', () => {
    it('should return complete ExtractedData object', () => {
      const input = {
        belegDatum: '2024-01-15',
        lieferantName: 'Test GmbH',
        bruttoBetrag: 1190,
      };

      const result = normalizeExtractedData(input);

      expect(result).toBeDefined();
      expect(result.belegDatum).toBe('2024-01-15');
      expect(result.lieferantName).toBe('Test GmbH');
    });

    it('should handle null/undefined input gracefully', () => {
      const result = normalizeExtractedData(null);
      const result2 = normalizeExtractedData(undefined);

      expect(result).toBeDefined();
      expect(result2).toBeDefined();
    });

    it('should handle non-object input gracefully', () => {
      const result = normalizeExtractedData('string' as any);
      const result2 = normalizeExtractedData(123 as any);

      expect(result).toBeDefined();
      expect(result2).toBeDefined();
    });

    describe('date parsing', () => {
      it('should accept ISO date format', () => {
        const result = normalizeExtractedData({ belegDatum: '2024-01-15' });

        expect(result.belegDatum).toBe('2024-01-15');
      });

      it('should parse DD.MM.YYYY format', () => {
        const result = normalizeExtractedData({ belegDatum: '15.01.2024' });

        expect(result.belegDatum).toBe('2024-01-15');
      });

      it('should parse D.M.YYYY format', () => {
        const result = normalizeExtractedData({ belegDatum: '5.1.2024' });

        expect(result.belegDatum).toBe('2024-01-05');
      });

      it('should parse DD/MM/YYYY format', () => {
        const result = normalizeExtractedData({ belegDatum: '15/01/2024' });

        expect(result.belegDatum).toBe('2024-01-15');
      });

      it('should parse DD-MM-YYYY format', () => {
        const result = normalizeExtractedData({ belegDatum: '15-01-2024' });

        expect(result.belegDatum).toBe('2024-01-15');
      });

      it('should parse YYYY/MM/DD format', () => {
        const result = normalizeExtractedData({ belegDatum: '2024/01/15' });

        expect(result.belegDatum).toBe('2024-01-15');
      });

      it('should parse YYYY-MM-DD format', () => {
        const result = normalizeExtractedData({ belegDatum: '2024-01-15' });

        expect(result.belegDatum).toBe('2024-01-15');
      });

      it('should parse two-digit year (70+)', () => {
        const result = normalizeExtractedData({ belegDatum: '15.01.85' });

        expect(result.belegDatum).toBe('1985-01-15');
      });

      it('should parse two-digit year (<70) as 2000+', () => {
        const result = normalizeExtractedData({ belegDatum: '15.01.25' });

        expect(result.belegDatum).toBe('2025-01-15');
      });

      it('should reject invalid dates like 2025-02-31', () => {
        const result = normalizeExtractedData({ belegDatum: '31.02.2025' });

        expect(result.belegDatum).not.toBe('2025-02-31');
      });

      it('should default to today if belegDatum is missing', () => {
        const today = new Date().toISOString().split('T')[0];
        const result = normalizeExtractedData({});

        expect(result.belegDatum).toBe(today);
      });
    });

    describe('number parsing', () => {
      it('should parse number directly', () => {
        const result = normalizeExtractedData({ bruttoBetrag: 1190 });

        expect(result.bruttoBetrag).toBe(1190);
      });

      it('should parse German format with comma', () => {
        const result = normalizeExtractedData({ bruttoBetrag: '1.190,00' });

        expect(result.bruttoBetrag).toBe(1190);
      });

      it('should parse US format with dot', () => {
        const result = normalizeExtractedData({ bruttoBetrag: '1190.00' });

        expect(result.bruttoBetrag).toBe(1190);
      });

      it('should parse currency with EUR symbol', () => {
        const result = normalizeExtractedData({ bruttoBetrag: '1.190,00 €' });

        expect(result.bruttoBetrag).toBe(1190);
      });

      it('should parse currency with EUR text', () => {
        const result = normalizeExtractedData({ bruttoBetrag: '1.190,00 EUR' });

        expect(result.bruttoBetrag).toBe(1190);
      });

      it('should parse currency with $ symbol', () => {
        const result = normalizeExtractedData({ bruttoBetrag: '$1,190.00' });

        expect(result.bruttoBetrag).toBe(1190);
      });

      it('should handle thousand separators', () => {
        const result = normalizeExtractedData({ bruttoBetrag: '1.234.567,89' });

        expect(result.bruttoBetrag).toBe(1234567.89);
      });

      it('should handle negative numbers in parentheses', () => {
        const result = normalizeExtractedData({ bruttoBetrag: '(-1190,00)' });

        expect(result.bruttoBetrag).toBe(-1190);
      });

      it('should handle negative with minus sign', () => {
        const result = normalizeExtractedData({ bruttoBetrag: '-1.190,00' });

        expect(result.bruttoBetrag).toBe(-1190);
      });

      it('should parse whitespace around numbers', () => {
        const result = normalizeExtractedData({ bruttoBetrag: '  1.190,00  ' });

        expect(result.bruttoBetrag).toBe(1190);
      });

      it('should handle non-breaking spaces', () => {
        const result = normalizeExtractedData({ bruttoBetrag: '1 190,00' });

        expect(result.bruttoBetrag).toBe(1190);
      });

      it('should default to 0 for missing numbers', () => {
        const result = normalizeExtractedData({ bruttoBetrag: undefined });

        expect(result.bruttoBetrag).toBe(0);
      });

      it('should default to 0 for empty string', () => {
        const result = normalizeExtractedData({ bruttoBetrag: '' });

        expect(result.bruttoBetrag).toBe(0);
      });
    });

    describe('brutto derivation', () => {
      it('should derive brutto from netto + mwst if brutto is missing', () => {
        const result = normalizeExtractedData({
          nettoBetrag: 1000,
          mwstBetrag19: 190,
        });

        expect(result.bruttoBetrag).toBe(1190);
      });

      it('should derive brutto from netto + mwst7', () => {
        const result = normalizeExtractedData({
          nettoBetrag: 1000,
          mwstBetrag7: 70,
        });

        expect(result.bruttoBetrag).toBe(1070);
      });

      it('should derive brutto from netto only if no tax', () => {
        const result = normalizeExtractedData({
          nettoBetrag: 1000,
          mwstBetrag0: 0,
        });

        expect(result.bruttoBetrag).toBe(1000);
      });
    });

    describe('string conversion', () => {
      it('should convert numbers to strings', () => {
        const result = normalizeExtractedData({ lieferantName: 12345 } as any);

        expect(result.lieferantName).toBe('12345');
      });

      it('should convert null to empty string', () => {
        const result = normalizeExtractedData({ lieferantName: null } as any);

        expect(result.lieferantName).toBe('');
      });

      it('should convert undefined to empty string', () => {
        const result = normalizeExtractedData({ lieferantName: undefined } as any);

        expect(result.lieferantName).toBe('');
      });

      it('should preserve whitespace in strings', () => {
        // Note: toStringSafe does not trim, it preserves the original string
        const result = normalizeExtractedData({ lieferantName: '  Test  ' });

        expect(result.lieferantName).toBe('  Test  ');
      });
    });

    describe('boolean conversion', () => {
      it('should convert "true" string to true', () => {
        const result = normalizeExtractedData({ vorsteuerabzug: 'true' } as any);

        expect(result.vorsteuerabzug).toBe(true);
      });

      it('should convert "1" to true', () => {
        const result = normalizeExtractedData({ vorsteuerabzug: '1' } as any);

        expect(result.vorsteuerabzug).toBe(true);
      });

      it('should convert "yes" to true', () => {
        const result = normalizeExtractedData({ vorsteuerabzug: 'yes' } as any);

        expect(result.vorsteuerabzug).toBe(true);
      });

      it('should convert "ja" to true', () => {
        const result = normalizeExtractedData({ vorsteuerabzug: 'ja' } as any);

        expect(result.vorsteuerabzug).toBe(true);
      });

      it('should convert "false" to false', () => {
        const result = normalizeExtractedData({ vorsteuerabzug: 'false' } as any);

        expect(result.vorsteuerabzug).toBe(false);
      });

      it('should convert "0" to false', () => {
        const result = normalizeExtractedData({ vorsteuerabzug: '0' } as any);

        expect(result.vorsteuerabzug).toBe(false);
      });

      it('should convert number 1 to true', () => {
        const result = normalizeExtractedData({ vorsteuerabzug: 1 } as any);

        expect(result.vorsteuerabzug).toBe(true);
      });

      it('should convert number 0 to false', () => {
        const result = normalizeExtractedData({ vorsteuerabzug: 0 } as any);

        expect(result.vorsteuerabzug).toBe(false);
      });

      it('should preserve boolean true', () => {
        const result = normalizeExtractedData({ vorsteuerabzug: true });

        expect(result.vorsteuerabzug).toBe(true);
      });

      it('should preserve boolean false', () => {
        const result = normalizeExtractedData({ vorsteuerabzug: false });

        expect(result.vorsteuerabzug).toBe(false);
      });
    });

    describe('line items', () => {
      it('should parse array of line items', () => {
        const input = {
          lineItems: [
            { description: 'Item 1', amount: 100 },
            { description: 'Item 2', amount: 200 },
          ],
        };

        const result = normalizeExtractedData(input);

        expect(result.lineItems).toHaveLength(2);
        expect(result.lineItems[0].description).toBe('Item 1');
        expect(result.lineItems[0].amount).toBe(100);
      });

      it('should filter out line items without description', () => {
        const input = {
          lineItems: [
            { description: 'Valid Item', amount: 100 },
            { amount: 200 }, // Missing description
            { description: 'Another Valid' },
          ],
        };

        const result = normalizeExtractedData(input);

        expect(result.lineItems).toHaveLength(2);
      });

      it('should handle single object as line items', () => {
        const input = {
          lineItems: { description: 'Single Item', amount: 100 },
        };

        const result = normalizeExtractedData(input);

        expect(result.lineItems).toHaveLength(1);
      });

      it('should handle empty array', () => {
        const result = normalizeExtractedData({ lineItems: [] });

        expect(result.lineItems).toHaveLength(0);
      });

      it('should handle undefined line items', () => {
        const result = normalizeExtractedData({ lineItems: undefined });

        expect(result.lineItems).toHaveLength(0);
      });
    });

    describe('sum validation', () => {
      it('should warn if brutto differs from netto+mwst', () => {
        const result = normalizeExtractedData({
          nettoBetrag: 1000,
          mwstBetrag19: 190,
          bruttoBetrag: 1300, // Wrong: should be 1190
        });

        expect(result.ocr_rationale).toContain('Summen widersprüchlich');
      });

      it('should not warn if within tolerance', () => {
        // Warning only triggers if diff > 0.05 AND (hasAnyTax OR netPlusTax > 0)
        // 1190 - (1000 + 190) = 0, so no warning
        const result = normalizeExtractedData({
          nettoBetrag: 1000,
          mwstBetrag19: 190,
          bruttoBetrag: 1190,
        });

        // No warning when exactly correct
        expect(result.ocr_rationale).toBeUndefined();
      });
    });

    describe('optional fields', () => {
      it('should preserve textContent if provided', () => {
        const result = normalizeExtractedData({
          textContent: 'Full invoice text content',
        });

        expect(result.textContent).toBe('Full invoice text content');
      });

      it('should set textContent to undefined if not provided', () => {
        const result = normalizeExtractedData({});

        // When undefined in input, textContent is set to undefined
        expect(result.textContent).toBeUndefined();
      });

      it('should preserve ruleApplied if provided', () => {
        const result = normalizeExtractedData({
          ruleApplied: true,
        });

        expect(result.ruleApplied).toBe(true);
      });

      it('should set ruleApplied to undefined if not provided', () => {
        const result = normalizeExtractedData({});

        // When undefined in input, ruleApplied remains undefined
        expect(result.ruleApplied).toBeUndefined();
      });
    });
  });
});
