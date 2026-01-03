/**
 * PDF Report Service for ZOE Solar Accounting OCR
 * Generates EÜR (Einnahmen-Überschuss-Rechnung) and UStVA reports
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DocumentRecord, AppSettings } from '../types';

export interface ReportData {
  title: string;
  period: string;
  generatedAt: string;
  documents: DocumentRecord[];
  settings: AppSettings | null;
}

export interface EUERData {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  vatPaid: number;
  vatCollected: number;
  netVat: number;
  byAccount: { account: string; amount: number; type: 'income' | 'expense' }[];
}

export interface USTVAData {
  period: string;
  vatCollected19: number;
  vatCollected7: number;
  vatCollected0: number;
  vatDeductible19: number;
  vatDeductible7: number;
  vatDeductible0: number;
  netVat19: number;
  netVat7: number;
  netVat0: number;
  totalPayable: number;
  totalRefundable: number;
}

/**
 * Calculate EÜR data from documents
 */
export const calculateEUER = (docs: DocumentRecord[], year: number): EUERData => {
  const yearDocs = docs.filter(d => {
    if (!d.data?.belegDatum) return false;
    return d.data.belegDatum.startsWith(year.toString());
  });

  let totalIncome = 0;
  let totalExpenses = 0;
  const byAccountMap = new Map<string, { income: number; expense: number }>();

  for (const doc of yearDocs) {
    if (!doc.data) continue;
    const isRevenue = doc.data.konto_skr03?.startsWith('8');
    const amount = doc.data.bruttoBetrag || 0;

    if (isRevenue) {
      totalIncome += amount;
    } else {
      totalExpenses += amount;
    }

    // Group by account
    const account = doc.data.konto_skr03 || 'Unbekannt';
    const existing = byAccountMap.get(account) || { income: 0, expense: 0 };
    if (isRevenue) {
      existing.income += amount;
    } else {
      existing.expense += amount;
    }
    byAccountMap.set(account, existing);
  }

  // Calculate VAT
  let vatPaid = 0;
  let vatCollected = 0;

  for (const doc of yearDocs) {
    if (!doc.data) continue;
    const isRevenue = doc.data.konto_skr03?.startsWith('8');

    if (isRevenue) {
      vatCollected += (doc.data.mwstBetrag19 || 0) + (doc.data.mwstBetrag7 || 0);
    } else {
      vatPaid += (doc.data.mwstBetrag19 || 0) + (doc.data.mwstBetrag7 || 0);
    }
  }

  const byAccount = Array.from(byAccountMap.entries()).map(([account, data]) => ({
    account,
    amount: data.income + data.expense,
    type: data.income > data.expense ? 'income' as const : 'expense' as const
  }));

  return {
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    netProfit: Math.round((totalIncome - totalExpenses) * 100) / 100,
    vatPaid: Math.round(vatPaid * 100) / 100,
    vatCollected: Math.round(vatCollected * 100) / 100,
    netVat: Math.round((vatCollected - vatPaid) * 100) / 100,
    byAccount
  };
};

/**
 * Calculate UStVA data from documents
 */
export const calculateUSTVA = (docs: DocumentRecord[], year: number, quarter: number): USTVAData => {
  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = quarter * 3;

  const periodDocs = docs.filter(d => {
    if (!d.data?.belegDatum) return false;
    const month = parseInt(d.data.belegDatum.substring(5, 7), 10);
    const docYear = parseInt(d.data.belegDatum.substring(0, 4), 10);
    return docYear === year && month >= startMonth && month <= endMonth;
  });

  let vatCollected19 = 0;
  let vatCollected7 = 0;
  let vatCollected0 = 0;
  let vatDeductible19 = 0;
  let vatDeductible7 = 0;
  let vatDeductible0 = 0;

  for (const doc of periodDocs) {
    if (!doc.data) continue;
    const isRevenue = doc.data.konto_skr03?.startsWith('8');

    if (isRevenue) {
      // Sales - collect VAT
      vatCollected19 += doc.data.mwstBetrag19 || 0;
      vatCollected7 += doc.data.mwstBetrag7 || 0;
      if (!(doc.data.mwstBetrag19 || doc.data.mwstBetrag7)) {
        vatCollected0 += doc.data.mwstBetrag0 || 0;
      }
    } else {
      // Expenses - deduct VAT
      vatDeductible19 += doc.data.mwstBetrag19 || 0;
      vatDeductible7 += doc.data.mwstBetrag7 || 0;
      if (!(doc.data.mwstBetrag19 || doc.data.mwstBetrag7)) {
        vatDeductible0 += doc.data.mwstBetrag0 || 0;
      }
    }
  }

  const netVat19 = Math.round((vatCollected19 - vatDeductible19) * 100) / 100;
  const netVat7 = Math.round((vatCollected7 - vatDeductible7) * 100) / 100;
  const netVat0 = Math.round((vatCollected0 - vatDeductible0) * 100) / 100;
  const totalPayable = Math.max(0, netVat19 + netVat7 + netVat0);
  const totalRefundable = Math.max(0, -(netVat19 + netVat7 + netVat0));

  return {
    period: `Q${quarter} ${year}`,
    vatCollected19: Math.round(vatCollected19 * 100) / 100,
    vatCollected7: Math.round(vatCollected7 * 100) / 100,
    vatCollected0: Math.round(vatCollected0 * 100) / 100,
    vatDeductible19: Math.round(vatDeductible19 * 100) / 100,
    vatDeductible7: Math.round(vatDeductible7 * 100) / 100,
    vatDeductible0: Math.round(vatDeductible0 * 100) / 100,
    netVat19,
    netVat7,
    netVat0,
    totalPayable,
    totalRefundable
  };
};

/**
 * Generate EÜR PDF Report
 */
export const generateEUERReport = async (
  docs: DocumentRecord[],
  settings: AppSettings | null,
  year: number
): Promise<void> => {
  const doc = new jsPDF();
  const euerData = calculateEUER(docs, year);

  // Title
  doc.setFontSize(20);
  doc.text('Einnahmen-Überschuss-Rechnung (EÜR)', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.text(`Jahr: ${year}`, 105, 30, { align: 'center' });
  doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 105, 38, { align: 'center' });

  // Company info if available
  if (settings?.elsterStammdaten) {
    doc.setFontSize(10);
    doc.text(
      `${settings.elsterStammdaten.unternehmensName}, ${settings.elsterStammdaten.plz} ${settings.elsterStammdaten.ort}`,
      105, 48, { align: 'center' }
    );
  }

  let yPos = 65;

  // Summary
  doc.setFontSize(14);
  doc.text('Zusammenfassung', 14, yPos);
  yPos += 10;

  doc.setFontSize(11);
  const summaryData = [
    ['Gesamteinnahmen', `${euerData.totalIncome.toFixed(2)} €`],
    ['Gesamtausgaben', `${euerData.totalExpenses.toFixed(2)} €`],
    ['', ''],
    ['Gewinn/Verlust', `${euerData.netProfit >= 0 ? '' : '-'}${Math.abs(euerData.netProfit).toFixed(2)} €`],
    ['', ''],
    ['Umsatzsteuer (aus Einnahmen)', `${euerData.vatCollected.toFixed(2)} €`],
    ['Vorsteuer (aus Ausgaben)', `${euerData.vatPaid.toFixed(2)} €`],
    ['', ''],
    ['Saldo Umsatzsteuer', `${euerData.netVat >= 0 ? '' : '-'}${Math.abs(euerData.netVat).toFixed(2)} €`]
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Position', 'Betrag']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: 14, right: 14 }
  });

  // Account breakdown
  if (euerData.byAccount.length > 0) {
    yPos = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text('Buchungsübersicht nach Konten', 14, yPos);
    yPos += 10;

    const accountData = euerData.byAccount.map(item => [
      item.account,
      item.type === 'income' ? 'Einnahme' : 'Ausgabe',
      `${item.amount.toFixed(2)} €`
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Konto', 'Typ', 'Betrag']],
      body: accountData,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: 14, right: 14 }
    });
  }

  // Document list
  const yearDocs = docs.filter(d => d.data?.belegDatum?.startsWith(year.toString()));
  if (yearDocs.length > 0) {
    (doc as any).addPage();
    doc.setFontSize(14);
    doc.text('Belegübersicht', 14, 20);
    yPos = 30;

    const documentData = yearDocs.map(d => [
      d.data?.eigeneBelegNummer || '-',
      d.data?.belegDatum || '-',
      d.data?.lieferantName || '-',
      `${(d.data?.bruttoBetrag || 0).toFixed(2)} €`,
      d.data?.konto_skr03 || '-'
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Beleg-Nr.', 'Datum', 'Lieferant', 'Betrag', 'Konto']],
      body: documentData,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8 }
    });
  }

  // Download
  doc.save(`euer_${year}_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Generate UStVA PDF Report
 */
export const generateUSTVAReport = async (
  docs: DocumentRecord[],
  settings: AppSettings | null,
  year: number,
  quarter: number
): Promise<void> => {
  const doc = new jsPDF();
  const ustvaData = calculateUSTVA(docs, year, quarter);

  // Title
  doc.setFontSize(20);
  doc.text('Umsatzsteuervoranmeldung (UStVA)', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.text(`Berichtszeitraum: ${ustvaData.period}`, 105, 30, { align: 'center' });
  doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 105, 38, { align: 'center' });

  // Company info if available
  if (settings?.elsterStammdaten) {
    doc.setFontSize(10);
    doc.text(
      `${settings.elsterStammdaten.unternehmensName}`,
      105, 48, { align: 'center' }
    );
    doc.text(
      `Steuernummer: ${settings.elsterStammdaten.eigeneSteuernummer || 'N/A'}`,
      105, 56, { align: 'center' }
    );
  }

  let yPos = 75;

  // VAT Collected
  doc.setFontSize(14);
  doc.text('Umsatzsteuer (aus Ausgangslieferungen und -leistungen)', 14, yPos);
  yPos += 10;

  const collectedData = [
    ['19% USt', `${ustvaData.vatCollected19.toFixed(2)} €`],
    ['7% USt', `${ustvaData.vatCollected7.toFixed(2)} €`],
    ['0% USt', `${ustvaData.vatCollected0.toFixed(2)} €`]
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Satz', 'Betrag']],
    body: collectedData,
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: 14, right: 14 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // VAT Deductible
  doc.setFontSize(14);
  doc.text('Vorsteuer (aus Eingangslieferungen und -leistungen)', 14, yPos);
  yPos += 10;

  const deductibleData = [
    ['19% VSt', `${ustvaData.vatDeductible19.toFixed(2)} €`],
    ['7% VSt', `${ustvaData.vatDeductible7.toFixed(2)} €`],
    ['0% VSt', `${ustvaData.vatDeductible0.toFixed(2)} €`]
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Satz', 'Betrag']],
    body: deductibleData,
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: 14, right: 14 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Net VAT Summary
  doc.setFontSize(14);
  doc.text('Saldo Umsatzsteuer', 14, yPos);
  yPos += 10;

  const netData = [
    ['19% USt Saldo', `${ustvaData.netVat19.toFixed(2)} €`],
    ['7% USt Saldo', `${ustvaData.netVat7.toFixed(2)} €`],
    ['0% USt Saldo', `${ustvaData.netVat0.toFixed(2)} €`]
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Satz', 'Saldo']],
    body: netData,
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: 14, right: 14 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Final Result
  const resultBgColor: [number, number, number] = ustvaData.totalPayable > 0 ? [255, 200, 200] : [200, 255, 200];
  const resultText = ustvaData.totalPayable > 0
    ? `Zu zahlen: ${ustvaData.totalPayable.toFixed(2)} €`
    : `Erstattung: ${ustvaData.totalRefundable.toFixed(2)} €`;

  doc.setFontSize(16);
  doc.setFillColor(resultBgColor[0], resultBgColor[1], resultBgColor[2]);
  doc.rect(14, yPos, 182, 20, 'F');
  doc.setTextColor(0, 0, 0);
  doc.text(resultText, 105, yPos + 13, { align: 'center' });

  // Download
  doc.save(`ustva_${year}_q${quarter}_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Generate yearly summary PDF
 */
export const generateYearlyReport = async (
  docs: DocumentRecord[],
  settings: AppSettings | null,
  year: number
): Promise<void> => {
  const doc = new jsPDF();
  const euerData = calculateEUER(docs, year);

  // Title
  doc.setFontSize(20);
  doc.text('Jahresabschluss', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.text(`Jahr: ${year}`, 105, 30, { align: 'center' });
  doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 105, 38, { align: 'center' });

  // Company info
  if (settings?.elsterStammdaten) {
    doc.setFontSize(10);
    doc.text(
      `${settings.elsterStammdaten.unternehmensName}`,
      105, 48, { align: 'center' }
    );
  }

  let yPos = 65;

  // Statistics
  doc.setFontSize(14);
  doc.text('Jahresstatistik', 14, yPos);
  yPos += 10;

  const statsData = [
    ['Verarbeitete Belege', docs.filter(d => d.data?.belegDatum?.startsWith(year.toString())).length.toString()],
    ['Dokumente gesamt', docs.length.toString()],
    ['Davon Einnahmen', euerData.byAccount.filter(a => a.type === 'income').length.toString()],
    ['Davon Ausgaben', euerData.byAccount.filter(a => a.type === 'expense').length.toString()]
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Metrik', 'Wert']],
    body: statsData,
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: 14, right: 14 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Monthly breakdown
  const monthlyData: { [key: string]: { income: number; expense: number } } = {};
  for (let m = 1; m <= 12; m++) {
    const monthKey = `${year}-${m.toString().padStart(2, '0')}`;
    monthlyData[monthKey] = { income: 0, expense: 0 };
  }

  docs.forEach(d => {
    if (!d.data?.belegDatum?.startsWith(year.toString())) return;
    const month = d.data.belegDatum.substring(0, 7);
    const isRevenue = d.data.konto_skr03?.startsWith('8');
    const amount = d.data.bruttoBetrag || 0;

    if (monthlyData[month]) {
      if (isRevenue) {
        monthlyData[month].income += amount;
      } else {
        monthlyData[month].expense += amount;
      }
    }
  });

  const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const monthlyTableData = Object.entries(monthlyData).map(([month, data]) => {
    const m = parseInt(month.substring(5), 10);
    return [
      monthNames[m - 1],
      `${data.income.toFixed(2)} €`,
      `${data.expense.toFixed(2)} €`,
      `${(data.income - data.expense).toFixed(2)} €`
    ];
  });

  doc.setFontSize(14);
  doc.text('Monatliche Übersicht', 14, yPos);
  yPos += 10;

  autoTable(doc, {
    startY: yPos,
    head: [['Monat', 'Einnahmen', 'Ausgaben', 'Saldo']],
    body: monthlyTableData,
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: 14, right: 14 }
  });

  // Download
  doc.save(`jahresbericht_${year}_${new Date().toISOString().split('T')[0]}.pdf`);
};
