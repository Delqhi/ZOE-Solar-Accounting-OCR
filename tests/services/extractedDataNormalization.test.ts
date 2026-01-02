import { describe, it, expect } from 'vitest';
import { normalizeExtractedData } from '../../services/extractedDataNormalization';

describe('extractedDataNormalization', () => {
  describe('normalizeExtractedData', () => {
    it('should normalize valid OCR data', () => {
      const input = {
        belegDatum: '15.03.2025',
        lieferantName: 'Test Company',
        bruttoBetrag: '119.00',
        nettoBetrag: '100.00',
        mwstBetrag19: '19.00',
      };

      const result = normalizeExtractedData(input);

      expect(result.belegDatum).toBe('2025-03-15');
      expect(result.lieferantName).toBe('Test Company');
      expect(result.bruttoBetrag).toBe(119);
      expect(result.nettoBetrag).toBe(100);
      expect(result.mwstBetrag19).toBe(19);
    });

    it('should handle missing fields gracefully', () => {
      const result = normalizeExtractedData({});
      expect(result.belegDatum).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.lieferantName).toBe('');
    });

    it('should normalize line items', () => {
      const input = {
        lineItems: [
          { description: 'Item 1', amount: '100.00' },
          { description: 'Item 2', amount: 50 },
        ],
      };

      const result = normalizeExtractedData(input);

      expect(result.lineItems).toHaveLength(2);
      expect(result.lineItems[0]).toEqual({ description: 'Item 1', amount: 100 });
    });
  });
});
