import { DocumentStatus } from '../../types';
import type { DocumentRecord, ExtractedData } from '../../types';
import {
  validateDocumentData,
  validateForExport,
  isDocumentComplete,
  getMissingFields,
} from '../validation';
import { describe, expect, it } from 'vitest';

describe('validation.ts', () => {
  const validData: ExtractedData = {
    belegDatum: '2025-01-15',
    belegNummerLieferant: 'RE-001',
    lieferantName: 'SolarTech GmbH',
    lieferantAdresse: 'Sonnenallee 1, 12345 Berlin',
    steuernummer: '12 345 67890',
    nettoBetrag: 100.0,
    mwstSatz0: 0,
    mwstBetrag0: 0,
    mwstSatz7: 0,
    mwstBetrag7: 0,
    mwstSatz19: 19,
    mwstBetrag19: 19.0,
    bruttoBetrag: 119.0,
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
    beschreibung: 'Software-Abonnement',
    quantity: 1,
    ocr_score: 9.5,
    ocr_rationale: 'Hochwertige OCR-Erkennung',
  };

  describe('validateDocumentData()', () => {
    it('should return valid for complete document data', () => {
      const result = validateDocumentData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject data missing belegDatum', () => {
      const data = { ...validData, belegDatum: '' };
      const result = validateDocumentData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Belegdatum fehlt');
    });

    it('should reject data missing lieferantName', () => {
      const data = { ...validData, lieferantName: '' };
      const result = validateDocumentData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Lieferantenname fehlt');
    });

    it('should reject data with invalid bruttoBetrag (zero)', () => {
      const data = { ...validData, bruttoBetrag: 0 };
      const result = validateDocumentData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Betrag fehlt oder ist ungültig');
    });

    it('should reject data with negative bruttoBetrag', () => {
      const data = { ...validData, bruttoBetrag: -50 };
      const result = validateDocumentData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Betrag fehlt oder ist ungültig');
    });

    it('should warn about missing belegNummerLieferant', () => {
      const data = { ...validData, belegNummerLieferant: '' };
      const result = validateDocumentData(data);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Belegnummer fehlt');
    });

    it('should warn about missing mwstSatz19', () => {
      const data = { ...validData, mwstSatz19: 0 };
      const result = validateDocumentData(data);

      expect(result.warnings).toContain('Mehrwertsteuersatz nicht angegeben (Standard: 19%)');
    });

    it('should handle whitespace-only strings as empty', () => {
      const data = { ...validData, lieferantName: '   ' };
      const result = validateDocumentData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Lieferantenname fehlt');
    });
  });

  describe('validateForExport()', () => {
    it('should return valid for document with data', () => {
      const doc: DocumentRecord = {
        id: 'doc-1',
        fileName: 'rechnung.pdf',
        fileType: 'application/pdf',
        uploadDate: '2025-01-15',
        status: DocumentStatus.COMPLETED,
        data: validData,
        previewUrl: 'https://example.com/preview',
      };

      const result = validateForExport(doc);
      expect(result.isValid).toBe(true);
    });

    it('should reject document without data', () => {
      const doc: DocumentRecord = {
        id: 'doc-1',
        fileName: 'rechnung.pdf',
        fileType: 'application/pdf',
        uploadDate: '2025-01-15',
        status: DocumentStatus.PROCESSING,
        data: null,
        previewUrl: 'https://example.com/preview',
      };

      const result = validateForExport(doc);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Keine Dokumentdaten vorhanden');
    });
  });

  describe('isDocumentComplete()', () => {
    it('should return true for complete data', () => {
      expect(isDocumentComplete(validData)).toBe(true);
    });

    it('should return false for incomplete data', () => {
      const incomplete = { ...validData, belegDatum: '' };
      expect(isDocumentComplete(incomplete)).toBe(false);
    });
  });

  describe('getMissingFields()', () => {
    it('should return empty array for complete data', () => {
      const missing = getMissingFields(validData);
      expect(missing).toHaveLength(0);
    });

    it('should return missing field names', () => {
      const missing = getMissingFields({ ...validData, belegDatum: '', lieferantName: '' });
      expect(missing).toContain('Belegdatum');
      expect(missing).toContain('Lieferantenname');
    });
  });
});
