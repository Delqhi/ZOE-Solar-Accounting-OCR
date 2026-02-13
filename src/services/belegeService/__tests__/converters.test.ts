import { describe, it, expect } from 'vitest';
import { belegToDb, dbToBeleg } from '../converters';
import type { ExtractedData } from '../../../types';
import type { Beleg } from '../../supabaseClient';

describe('belegToDb', () => {
  const mockExtractedData: ExtractedData = {
    documentType: 'invoice',
    belegDatum: '2024-01-15',
    belegNummerLieferant: 'INV-001',
    lieferantName: 'Muster GmbH',
    lieferantAdresse: 'Musterstraße 1, 12345 Berlin',
    steuernummer: 'DE123456789',
    nettoBetrag: 100.00,
    bruttoBetrag: 119.00,
    mwstSatz19: 19,
    mwstBetrag19: 19.00,
    kontierungskonto: '3400',
    steuerkategorie: '19_pv',
    lineItems: [
      { description: 'Product A', amount: 50.00 },
      { description: 'Product B', amount: 50.00 }
    ]
  };

  const mockFileInfo = {
    dateiname: 'invoice.pdf',
    dateityp: 'application/pdf',
    dateigroesse: 1024000,
    file_hash: 'abc123',
    gitlab_storage_url: 'https://gitlab.com/docs/invoice.pdf'
  };

  it('should convert extracted data to database format', () => {
    const result = belegToDb(mockExtractedData, mockFileInfo);

    expect(result.dateiname).toBe('invoice.pdf');
    expect(result.dateityp).toBe('application/pdf');
    expect(result.dateigroesse).toBe(1024000);
    expect(result.file_hash).toBe('abc123');
    expect(result.gitlab_storage_url).toBe('https://gitlab.com/docs/invoice.pdf');
    expect(result.status).toBe('PROCESSING');
    expect(result.document_type).toBe('invoice');
    expect(result.beleg_datum).toBe('2024-01-15');
    expect(result.belegnummer_lieferant).toBe('INV-001');
    expect(result.lieferant_name).toBe('Muster GmbH');
    expect(result.lieferant_adresse).toBe('Musterstraße 1, 12345 Berlin');
    expect(result.steuernummer).toBe('DE123456789');
    expect(result.netto_betrag).toBe(100.00);
    expect(result.brutto_betrag).toBe(119.00);
    expect(result.mwst_satz_19).toBe(19);
    expect(result.mwst_betrag_19).toBe(19.00);
    expect(result.kontierungskonto).toBe('3400');
    expect(result.steuerkategorie).toBe('19_pv');
  });

  it('should handle null values', () => {
    const partialData: ExtractedData = {
      ...mockExtractedData,
      belegNummerLieferant: undefined,
      steuernummer: undefined
    };

    const result = belegToDb(partialData, mockFileInfo);

    expect(result.belegnummer_lieferant).toBeNull();
    expect(result.steuernummer).toBeNull();
  });
});

describe('dbToBeleg', () => {
  const mockBeleg: Beleg = {
    id: '123',
    zoe_id: 'ZOE-001',
    dateiname: 'invoice.pdf',
    dateityp: 'application/pdf',
    dateigroesse: 1024000,
    file_hash: 'abc123',
    gitlab_storage_url: 'https://gitlab.com/docs/invoice.pdf',
    status: 'COMPLETED',
    document_type: 'invoice',
    beleg_datum: '2024-01-15',
    belegnummer_lieferant: 'INV-001',
    lieferant_name: 'Muster GmbH',
    lieferant_adresse: 'Musterstraße 1, 12345 Berlin',
    steuernummer: 'DE123456789',
    netto_betrag: 100.00,
    brutto_betrag: 119.00,
    mwst_satz_0: null,
    mwst_betrag_0: null,
    mwst_satz_7: null,
    mwst_betrag_7: null,
    mwst_satz_19: 19,
    mwst_betrag_19: 19.00,
    uploaded_at: '2024-01-15T10:00:00Z',
    created_at: '2024-01-15T10:00:00Z'
  } as Beleg;

  it('should convert database format to extracted data', () => {
    const result = dbToBeleg(mockBeleg);

    expect(result.documentType).toBe('invoice');
    expect(result.belegDatum).toBe('2024-01-15');
    expect(result.belegNummerLieferant).toBe('INV-001');
    expect(result.lieferantName).toBe('Muster GmbH');
    expect(result.lieferantAdresse).toBe('Musterstraße 1, 12345 Berlin');
    expect(result.steuernummer).toBe('DE123456789');
    expect(result.nettoBetrag).toBe(100.00);
    expect(result.bruttoBetrag).toBe(119.00);
    expect(result.mwstSatz19).toBe(19);
    expect(result.mwstBetrag19).toBe(19.00);
  });

  it('should handle null values', () => {
    const partialBeleg = {
      ...mockBeleg,
      belegnummer_lieferant: null,
      steuernummer: null
    } as Beleg;

    const result = dbToBeleg(partialBeleg);

    expect(result.belegNummerLieferant).toBe('');
    expect(result.steuernummer).toBe('');
  });
});