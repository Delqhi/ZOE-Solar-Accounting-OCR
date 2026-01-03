/**
 * Tests for pdfReport service
 */

import { describe, it, expect, vi } from 'vitest';
import { DocumentRecord, AppSettings } from '../types';
import { calculateEUER, calculateUSTVA } from '../services/pdfReport';

describe('calculateEUER', () => {
  it('should calculate correct EÜR data for empty documents', () => {
    const docs: DocumentRecord[] = [];
    const result = calculateEUER(docs, 2024);

    expect(result.totalIncome).toBe(0);
    expect(result.totalExpenses).toBe(0);
    expect(result.netProfit).toBe(0);
    expect(result.vatPaid).toBe(0);
    expect(result.vatCollected).toBe(0);
    expect(result.netVat).toBe(0);
  });

  it('should calculate correct EÜR data with documents', () => {
    const docs: DocumentRecord[] = [
      {
        id: '1',
        fileName: 'rechnung.pdf',
        fileType: 'application/pdf',
        uploadDate: '2024-01-15T10:00:00Z',
        status: 'completed',
        data: {
          belegDatum: '2024-01-10',
          belegNummerLieferant: 'R-001',
          lieferantName: 'Revenue Corp',
          lieferantAdresse: '',
          steuernummer: '',
          nettoBetrag: 1000,
          mwstSatz0: 0,
          mwstBetrag0: 0,
          mwstSatz7: 0,
          mwstBetrag7: 0,
          mwstSatz19: 19,
          mwstBetrag19: 190,
          bruttoBetrag: 1190,
          zahlungsmethode: '',
          lineItems: [],
          kontogruppe: 'Erloes',
          konto_skr03: '8400', // Revenue account starts with 8
          ust_typ: '',
          sollKonto: '',
          habenKonto: '',
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
          beschreibung: ''
        }
      },
      {
        id: '2',
        fileName: 'einkauf.pdf',
        fileType: 'application/pdf',
        uploadDate: '2024-01-20T11:00:00Z',
        status: 'completed',
        data: {
          belegDatum: '2024-01-15',
          belegNummerLieferant: 'B-001',
          lieferantName: 'Expense Ltd',
          lieferantAdresse: '',
          steuernummer: '',
          nettoBetrag: 500,
          mwstSatz0: 0,
          mwstBetrag0: 0,
          mwstSatz7: 0,
          mwstBetrag7: 0,
          mwstSatz19: 19,
          mwstBetrag19: 95,
          bruttoBetrag: 595,
          zahlungsmethode: '',
          lineItems: [],
          kontogruppe: 'Aufwand',
          konto_skr03: '3400', // Expense account starts with 3
          ust_typ: '',
          sollKonto: '',
          habenKonto: '',
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
          beschreibung: ''
        }
      }
    ];

    const result = calculateEUER(docs, 2024);

    expect(result.totalIncome).toBe(1190);
    expect(result.totalExpenses).toBe(595);
    expect(result.netProfit).toBe(595);
    expect(result.vatCollected).toBe(190);
    expect(result.vatPaid).toBe(95);
    expect(result.netVat).toBe(95);
  });

  it('should filter documents by year', () => {
    const docs: DocumentRecord[] = [
      {
        id: '1',
        fileName: 'doc2023.pdf',
        fileType: 'application/pdf',
        uploadDate: '2023-12-15T10:00:00Z',
        status: 'completed',
        data: {
          belegDatum: '2023-12-10',
          belegNummerLieferant: 'R-001',
          lieferantName: 'Corp',
          lieferantAdresse: '',
          steuernummer: '',
          nettoBetrag: 1000,
          mwstSatz0: 0,
          mwstBetrag0: 0,
          mwstSatz7: 0,
          mwstBetrag7: 0,
          mwstSatz19: 19,
          mwstBetrag19: 190,
          bruttoBetrag: 1190,
          zahlungsmethode: '',
          lineItems: [],
          kontogruppe: 'Erloes',
          konto_skr03: '8400',
          ust_typ: '',
          sollKonto: '',
          habenKonto: '',
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
          beschreibung: ''
        }
      },
      {
        id: '2',
        fileName: 'doc2024.pdf',
        fileType: 'application/pdf',
        uploadDate: '2024-01-15T10:00:00Z',
        status: 'completed',
        data: {
          belegDatum: '2024-01-10',
          belegNummerLieferant: 'R-002',
          lieferantName: 'Corp',
          lieferantAdresse: '',
          steuernummer: '',
          nettoBetrag: 500,
          mwstSatz0: 0,
          mwstBetrag0: 0,
          mwstSatz7: 0,
          mwstBetrag7: 0,
          mwstSatz19: 19,
          mwstBetrag19: 95,
          bruttoBetrag: 595,
          zahlungsmethode: '',
          lineItems: [],
          kontogruppe: 'Erloes',
          konto_skr03: '8400',
          ust_typ: '',
          sollKonto: '',
          habenKonto: '',
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
          beschreibung: ''
        }
      }
    ];

    const result2023 = calculateEUER(docs, 2023);
    const result2024 = calculateEUER(docs, 2024);

    expect(result2023.totalIncome).toBe(1190);
    expect(result2024.totalIncome).toBe(595);
  });
});

describe('calculateUSTVA', () => {
  it('should calculate correct UStVA data for empty documents', () => {
    const docs: DocumentRecord[] = [];
    const result = calculateUSTVA(docs, 2024, 1);

    expect(result.vatCollected19).toBe(0);
    expect(result.vatCollected7).toBe(0);
    expect(result.vatDeductible19).toBe(0);
    expect(result.vatDeductible7).toBe(0);
    expect(result.totalPayable).toBe(0);
    expect(result.totalRefundable).toBe(0);
  });

  it('should calculate correct UStVA for Q1 2024', () => {
    const docs: DocumentRecord[] = [
      {
        id: '1',
        fileName: 'sale.pdf',
        fileType: 'application/pdf',
        uploadDate: '2024-02-15T10:00:00Z',
        status: 'completed',
        data: {
          belegDatum: '2024-02-10',
          belegNummerLieferant: 'S-001',
          lieferantName: 'Sales Corp',
          lieferantAdresse: '',
          steuernummer: '',
          nettoBetrag: 1000,
          mwstSatz0: 0,
          mwstBetrag0: 0,
          mwstSatz7: 0,
          mwstBetrag7: 0,
          mwstSatz19: 19,
          mwstBetrag19: 190,
          bruttoBetrag: 1190,
          zahlungsmethode: '',
          lineItems: [],
          kontogruppe: 'Erloes',
          konto_skr03: '8400', // Revenue
          ust_typ: '',
          sollKonto: '',
          habenKonto: '',
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
          beschreibung: ''
        }
      },
      {
        id: '2',
        fileName: 'purchase.pdf',
        fileType: 'application/pdf',
        uploadDate: '2024-02-20T11:00:00Z',
        status: 'completed',
        data: {
          belegDatum: '2024-02-15',
          belegNummerLieferant: 'P-001',
          lieferantName: 'Supplier Ltd',
          lieferantAdresse: '',
          steuernummer: '',
          nettoBetrag: 500,
          mwstSatz0: 0,
          mwstBetrag0: 0,
          mwstSatz7: 0,
          mwstBetrag7: 0,
          mwstSatz19: 19,
          mwstBetrag19: 95,
          bruttoBetrag: 595,
          zahlungsmethode: '',
          lineItems: [],
          kontogruppe: 'Aufwand',
          konto_skr03: '3400', // Expense
          ust_typ: '',
          sollKonto: '',
          habenKonto: '',
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
          beschreibung: ''
        }
      }
    ];

    const result = calculateUSTVA(docs, 2024, 1);

    expect(result.vatCollected19).toBe(190);
    expect(result.vatDeductible19).toBe(95);
    expect(result.netVat19).toBe(95);
    expect(result.totalPayable).toBe(95);
    expect(result.totalRefundable).toBe(0);
  });

  it('should calculate refund when expenses exceed income', () => {
    const docs: DocumentRecord[] = [
      {
        id: '1',
        fileName: 'purchase.pdf',
        fileType: 'application/pdf',
        uploadDate: '2024-02-15T10:00:00Z',
        status: 'completed',
        data: {
          belegDatum: '2024-02-10',
          belegNummerLieferant: 'P-001',
          lieferantName: 'Supplier',
          lieferantAdresse: '',
          steuernummer: '',
          nettoBetrag: 2000,
          mwstSatz0: 0,
          mwstBetrag0: 0,
          mwstSatz7: 0,
          mwstBetrag7: 0,
          mwstSatz19: 19,
          mwstBetrag19: 380,
          bruttoBetrag: 2380,
          zahlungsmethode: '',
          lineItems: [],
          kontogruppe: 'Aufwand',
          konto_skr03: '3400',
          ust_typ: '',
          sollKonto: '',
          habenKonto: '',
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
          beschreibung: ''
        }
      }
    ];

    const result = calculateUSTVA(docs, 2024, 1);

    expect(result.vatDeductible19).toBe(380);
    expect(result.vatCollected19).toBe(0);
    expect(result.netVat19).toBe(-380);
    expect(result.totalPayable).toBe(0);
    expect(result.totalRefundable).toBe(380);
  });

  it('should filter documents by quarter', () => {
    const docs: DocumentRecord[] = [
      {
        id: '1',
        fileName: 'jan.pdf',
        fileType: 'application/pdf',
        uploadDate: '2024-01-15T10:00:00Z',
        status: 'completed',
        data: {
          belegDatum: '2024-01-10',
          belegNummerLieferant: 'R-001',
          lieferantName: 'Corp',
          lieferantAdresse: '',
          steuernummer: '',
          nettoBetrag: 1000,
          mwstSatz0: 0,
          mwstBetrag0: 0,
          mwstSatz7: 0,
          mwstBetrag7: 0,
          mwstSatz19: 19,
          mwstBetrag19: 190,
          bruttoBetrag: 1190,
          zahlungsmethode: '',
          lineItems: [],
          kontogruppe: 'Erloes',
          konto_skr03: '8400',
          ust_typ: '',
          sollKonto: '',
          habenKonto: '',
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
          beschreibung: ''
        }
      },
      {
        id: '2',
        fileName: 'apr.pdf',
        fileType: 'application/pdf',
        uploadDate: '2024-04-15T10:00:00Z',
        status: 'completed',
        data: {
          belegDatum: '2024-04-10',
          belegNummerLieferant: 'R-002',
          lieferantName: 'Corp',
          lieferantAdresse: '',
          steuernummer: '',
          nettoBetrag: 500,
          mwstSatz0: 0,
          mwstBetrag0: 0,
          mwstSatz7: 0,
          mwstBetrag7: 0,
          mwstSatz19: 19,
          mwstBetrag19: 95,
          bruttoBetrag: 595,
          zahlungsmethode: '',
          lineItems: [],
          kontogruppe: 'Erloes',
          konto_skr03: '8400',
          ust_typ: '',
          sollKonto: '',
          habenKonto: '',
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
          beschreibung: ''
        }
      }
    ];

    const q1 = calculateUSTVA(docs, 2024, 1);
    const q2 = calculateUSTVA(docs, 2024, 2);

    expect(q1.vatCollected19).toBe(190);
    expect(q2.vatCollected19).toBe(95);
  });
});
