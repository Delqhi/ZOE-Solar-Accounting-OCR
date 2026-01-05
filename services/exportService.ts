/**
 * ZOE Export Service - PDF & CSV Generation
 * Uses jsPDF with autoTable for PDF exports
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DocumentRecord, ExtractedData } from '../types';

// ========================================
// PDF EXPORT - Professional Accounting Reports
// ========================================
export async function generatePDFReport(
  documents: DocumentRecord[],
  options?: { includeHeader?: boolean; includeSummary?: boolean }
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // PDF Metadata
  doc.setProperties({
    title: 'ZOE Solar Accounting Export',
    subject: 'Document Report',
    author: 'ZOE Solar OCR',
    keywords: 'accounting, invoices, receipts, DATEV',
    creator: 'ZOE Solar OCR v1.0'
  });

  // Add title
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text('ZOE Solar Accounting - Document Report', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString('de-DE')}`, 14, 28);
  doc.text(`Total Documents: ${documents.length}`, 14, 34);

  // Prepare table data
  const headers = [
    'ZOE-ID', 'Datum', 'Lieferant', 'Netto', 'MwSt', 'Brutto', 'Status'
  ];

  const data = documents.map(doc => {
    const d = doc.data;
    if (!d) return [doc.id.slice(0, 8), '-', '-', '-', '-', '-', doc.status];

    return [
      doc.id.slice(0, 8),
      d.belegDatum || '-',
      d.lieferantName?.slice(0, 20) || '-',
      formatCurrency(d.nettoBetrag),
      formatCurrency(d.mwstBetrag19 + d.mwstBetrag7 + d.mwstBetrag0),
      formatCurrency(d.bruttoBetrag),
      translateStatus(doc.status)
    ];
  });

  // Generate table starting at y=40
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: 40,
    theme: 'striped',
    styles: {
      fontSize: 8,
      cellPadding: 2
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    }
  });

  // Add summary if requested
  if (options?.includeSummary !== false && (doc as any).lastAutoTable) {
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    const totals = calculateTotals(documents);

    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text('ZUSAMMENFASSUNG', 14, finalY + 10);
    doc.setFontSize(9);
    doc.text(`Gesamt Brutto: ${formatCurrency(totals.brutto)}`, 14, finalY + 16);
    doc.text(`Gesamt Netto: ${formatCurrency(totals.netto)}`, 14, finalY + 21);
    doc.text(`Gesamt MwSt: ${formatCurrency(totals.tax)}`, 14, finalY + 26);
  }

  // Trigger download
  const fileName = `ZOE_Export_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

// ========================================
// CSV EXPORT - For DATEV/Excel Import
// ========================================
export async function generateCSVExport(
  documents: DocumentRecord[]
): Promise<void> {
  const headers = [
    'ZOE_ID',
    'DATEI_NAME',
    'DATUM',
    'LIEFERANT',
    'ADRESSE',
    'NETTO',
    'MWST_7',
    'MWST_19',
    'BRUTTO',
    'KONTO_SKR03',
    'STATUS'
  ];

  const rows = documents.map(doc => {
    const d = doc.data;
    if (!d) {
      return [
        doc.id,
        doc.fileName,
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        doc.status
      ];
    }

    return [
      doc.id,
      doc.fileName.replace(/,/g, ';'),
      d.belegDatum,
      d.lieferantName.replace(/,/g, ';'),
      d.lieferantAdresse.replace(/,/g, ';'),
      d.nettoBetrag.toFixed(2).replace('.', ','),
      d.mwstBetrag7.toFixed(2).replace('.', ','),
      d.mwstBetrag19.toFixed(2).replace('.', ','),
      d.bruttoBetrag.toFixed(2).replace('.', ','),
      d.konto_skr03 || '',
      doc.status
    ];
  });

  // Build CSV
  let csv = headers.join(',') + '\n';
  rows.forEach(row => {
    csv += row.join(',') + '\n';
  });

  // Download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `ZOE_Export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ========================================
// HELPERS
// ========================================
function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || isNaN(amount)) return '€ 0,00';
  return `€ ${amount.toFixed(2).replace('.', ',')}`;
}

function translateStatus(status: string): string {
  const mapping: Record<string, string> = {
    'PROCESSING': 'In Bearbeitung',
    'REVIEW_NEEDED': 'Prüfung nötig',
    'COMPLETED': 'Abgeschlossen',
    'ERROR': 'Fehler',
    'DUPLICATE': 'Duplikat'
  };
  return mapping[status] || status;
}

function calculateTotals(documents: DocumentRecord[]) {
  return documents.reduce((acc, doc) => {
    if (doc.data) {
      acc.brutto += doc.data.bruttoBetrag || 0;
      acc.netto += doc.data.nettoBetrag || 0;
      acc.tax += (doc.data.mwstBetrag19 || 0) + (doc.data.mwstBetrag7 || 0) + (doc.data.mwstBetrag0 || 0);
    }
    return acc;
  }, { brutto: 0, netto: 0, tax: 0 });
}
