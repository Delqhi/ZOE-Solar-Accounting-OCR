import type { ExtractedData } from '../../types';
import { normalizeExtractedData } from '../extractedDataNormalization';
import { describe, expect, it } from 'vitest';

describe('extractedDataNormalization.ts', () => {
  describe('normalizeExtractedData()', () => {
    it('should return default values for empty input', () => {
      const result = normalizeExtractedData({});

      expect(result.belegDatum).toBe('');
      expect(result.lieferantName).toBe('');
      expect(result.nettoBetrag).toBe(0);
      expect(result.bruttoBetrag).toBe(0);
      expect(result.lineItems).toEqual([]);
      expect(result.quantity).toBe(1);
    });

    it('should preserve provided values', () => {
      const input = {
        belegDatum: '2025-01-15',
        lieferantName: 'Test GmbH',
        nettoBetrag: 100,
        bruttoBetrag: 119,
      };

      const result = normalizeExtractedData(input);

      expect(result.belegDatum).toBe('2025-01-15');
      expect(result.lieferantName).toBe('Test GmbH');
      expect(result.nettoBetrag).toBe(100);
      expect(result.bruttoBetrag).toBe(119);
    });

    it('should default optional string fields to empty string', () => {
      const result = normalizeExtractedData({});

      expect(result.lieferantAdresse).toBe('');
      expect(result.steuernummer).toBe('');
      expect(result.zahlungsmethode).toBe('');
      expect(result.kontierungskonto).toBeUndefined();
      expect(result.steuerkategorie).toBeUndefined();
    });

    it('should default optional boolean fields to false', () => {
      const result = normalizeExtractedData({});

      expect(result.kleinbetrag).toBe(false);
      expect(result.vorsteuerabzug).toBe(false);
      expect(result.reverseCharge).toBe(false);
      expect(result.privatanteil).toBe(false);
    });

    it('should preserve lineItems array', () => {
      const input = {
        lineItems: [
          { description: 'Item 1', amount: 50 },
          { description: 'Item 2', amount: 30 },
        ],
      };

      const result = normalizeExtractedData(input);

      expect(result.lineItems).toHaveLength(2);
      expect(result.lineItems[0].description).toBe('Item 1');
    });

    it('should set default quantity to 1', () => {
      const result = normalizeExtractedData({});

      expect(result.quantity).toBe(1);
    });

    it('should preserve provided quantity', () => {
      const input = { quantity: 5 };

      const result = normalizeExtractedData(input);

      expect(result.quantity).toBe(5);
    });

    it('should preserve ocr_score and ocr_rationale when provided', () => {
      const input = {
        ocr_score: 9.5,
        ocr_rationale: 'High confidence',
      };

      const result = normalizeExtractedData(input);

      expect(result.ocr_score).toBe(9.5);
      expect(result.ocr_rationale).toBe('High confidence');
    });

    it('should handle partial tax data', () => {
      const input = {
        mwstSatz19: 19,
        mwstBetrag19: 19,
      };

      const result = normalizeExtractedData(input);

      expect(result.mwstSatz19).toBe(19);
      expect(result.mwstBetrag19).toBe(19);
      expect(result.mwstSatz7).toBe(0);
      expect(result.mwstBetrag7).toBe(0);
    });

    it('should preserve kontierung fields when provided', () => {
      const input = {
        kontierungskonto: '4964',
        steuerkategorie: '19%',
        kontierungBegruendung: 'Software erkannt',
      };

      const result = normalizeExtractedData(input);

      expect(result.kontierungskonto).toBe('4964');
      expect(result.steuerkategorie).toBe('19%');
      expect(result.kontierungBegruendung).toBe('Software erkannt');
    });
  });
});
