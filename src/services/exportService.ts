/**
 * Export Service
 * PDF and CSV export functionality
 */

import { DocumentRecord, ExtractedData, AppSettings } from '../types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// ==================== PDF Export ====================

export async function generatePDFReport(
  documents: DocumentRecord[],
  settings?: AppSettings
): Promise<Blob> {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.text('ZOE Accounting OCR - Export', 20, 20);

  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString('de-DE')}`, 20, 28);

  let yPos = 40;

  for (let i = 0; i < documents.length; i++) {
    const document = documents[i];
    const data = document.data;

    if (!data) continue;

    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // Document header
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`Document ${i + 1}: ${document.fileName}`, 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    // Basic info
    doc.text(`Status: ${document.status}`, 20, yPos);
    yPos += 6;
    doc.text(`Upload Date: ${new Date(document.uploadDate).toLocaleDateString('de-DE')}`, 20, yPos);
    yPos += 6;

    // Vendor info
    if (data.lieferantName) {
      doc.text(`Vendor: ${data.lieferantName}`, 20, yPos);
      yPos += 6;
    }

    if (data.lieferantAdresse) {
      doc.text(`Address: ${data.lieferantAdresse}`, 20, yPos);
      yPos += 6;
    }

    // Dates
    if (data.belegDatum) {
      doc.text(`Document Date: ${data.belegDatum}`, 20, yPos);
      yPos += 6;
    }

    if (data.zahlungsDatum) {
      doc.text(`Payment Date: ${data.zahlungsDatum}`, 20, yPos);
      yPos += 6;
    }

    // Financial data
    yPos += 4;
    doc.setFont(undefined, 'bold');
    doc.text('Financial Data:', 20, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 6;

    const financialData = [
      ['Net Amount', `${data.nettoBetrag?.toFixed(2) || '0.00'} €`],
      ['Tax 7%', `${data.mwstBetrag7?.toFixed(2) || '0.00'} €`],
      ['Tax 19%', `${data.mwstBetrag19?.toFixed(2) || '0.00'} €`],
      ['Gross Amount', `${data.bruttoBetrag?.toFixed(2) || '0.00'} €`],
    ];

    financialData.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, 20, yPos);
      yPos += 6;
    });

    // Account info
    yPos += 4;
    if (data.konto_skr03 || data.kontierungskonto) {
      doc.text(`Account: ${data.konto_skr03 || data.kontierungskonto}`, 20, yPos);
      yPos += 6;
    }

    if (data.steuerkategorie) {
      doc.text(`Tax Category: ${data.steuerkategorie}`, 20, yPos);
      yPos += 6;
    }

    // Line items
    if (data.lineItems && data.lineItems.length > 0) {
      yPos += 4;
      doc.setFont(undefined, 'bold');
      doc.text('Line Items:', 20, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 6;

      data.lineItems.forEach((item) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        const itemText = `${item.description}${item.amount ? `: ${item.amount.toFixed(2)} €` : ''}`;
        doc.text(`• ${itemText}`, 25, yPos);
        yPos += 5;
      });
    }

    // Notes
    if (data.beschreibung) {
      yPos += 4;
      doc.setFont(undefined, 'bold');
      doc.text('Description:', 20, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 6;

      const splitDesc = doc.splitTextToSize(data.beschreibung, 170);
      doc.text(splitDesc, 20, yPos);
      yPos += splitDesc.length * 5;
    }

    // OCR Quality
    if (data.ocr_score !== undefined) {
      yPos += 4;
      doc.setFont(undefined, 'italic');
      doc.text(`OCR Quality: ${data.ocr_score}/10`, 20, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 6;
    }

    // Separator
    yPos += 8;
    doc.setDrawColor(200);
    doc.line(20, yPos, 190, yPos);
    yPos += 8;
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount} - ZOE Accounting OCR`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  return doc.output('blob');
}

// ==================== CSV Export ====================

export async function generateCSVExport(
  documents: DocumentRecord[],
  settings?: AppSettings
): Promise<Blob> {
  const headers = [
    'ID',
    'File Name',
    'Status',
    'Upload Date',
    'Document Date',
    'Vendor',
    'Net Amount',
    'Tax 7%',
    'Tax 19%',
    'Gross Amount',
    'Account',
    'Tax Category',
    'Payment Date',
    'OCR Score',
  ];

  const rows = documents.map((doc) => {
    const data = doc.data || ({} as ExtractedData);
    return [
      doc.id,
      doc.fileName,
      doc.status,
      doc.uploadDate,
      data.belegDatum || '',
      data.lieferantName || '',
      data.nettoBetrag || 0,
      data.mwstBetrag7 || 0,
      data.mwstBetrag19 || 0,
      data.bruttoBetrag || 0,
      data.konto_skr03 || data.kontierungskonto || '',
      data.steuerkategorie || '',
      data.zahlungsDatum || '',
      data.ocr_score || '',
    ];
  });

  // Convert to CSV
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const str = String(cell);
          // Escape quotes and wrap in quotes if contains comma
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    ),
  ].join('\n');

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

// ==================== JSON Export ====================

export async function generateJSONExport(
  documents: DocumentRecord[],
  settings?: AppSettings
): Promise<Blob> {
  const exportData = {
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    count: documents.length,
    documents,
    settings,
  };

  const jsonContent = JSON.stringify(exportData, null, 2);
  return new Blob([jsonContent], { type: 'application/json' });
}

// ==================== SQL Export ====================

export function generateSQLExport(
  documents: DocumentRecord[],
  settings: AppSettings
): string {
  const tableName = 'zoe_documents';
  const statements: string[] = [];

  // Create table statement
  statements.push(`CREATE TABLE IF NOT EXISTS ${tableName} (
  id VARCHAR(255) PRIMARY KEY,
  upload_date TIMESTAMP,
  file_name VARCHAR(500),
  vendor VARCHAR(255),
  net_amount DECIMAL(10, 2),
  gross_amount DECIMAL(10, 2),
  tax_amount DECIMAL(10, 2),
  account VARCHAR(50),
  status VARCHAR(50)
);`);

  // Insert statements
  for (const doc of documents) {
    const data = doc.data;
    if (!data) continue;

    const values = [
      `'${doc.id}'`,
      `'${doc.uploadDate}'`,
      `'${doc.fileName.replace(/'/g, "''")}'`,
      `'${data.lieferantName.replace(/'/g, "''")}'`,
      data.nettoBetrag || 0,
      data.bruttoBetrag || 0,
      data.mwstBetrag19 || data.mwstBetrag7 || 0,
      `'${data.konto_skr03 || data.kontierungskonto || ''}'`,
      `'${doc.status}'`,
    ].join(', ');

    statements.push(`INSERT INTO ${tableName} VALUES (${values});`);
  }

  return statements.join('\n');
}

// ==================== Download Helper ====================

export function downloadBlob(
  blob: Blob,
  filename: string
): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==================== Batch Export ====================

export async function exportDocuments(
  documents: DocumentRecord[],
  format: 'pdf' | 'csv' | 'json' | 'sql',
  settings?: AppSettings
): Promise<void> {
  if (documents.length === 0) {
    throw new Error('No documents to export');
  }

  let blob: Blob;
  let filename: string;

  const timestamp = new Date().toISOString().split('T')[0];

  switch (format) {
    case 'pdf':
      blob = await generatePDFReport(documents, settings);
      filename = `zoe-export-${timestamp}.pdf`;
      break;

    case 'csv':
      blob = await generateCSVExport(documents, settings);
      filename = `zoe-export-${timestamp}.csv`;
      break;

    case 'json':
      blob = await generateJSONExport(documents, settings);
      filename = `zoe-export-${timestamp}.json`;
      break;

    case 'sql':
      const sql = generateSQLExport(documents, settings!);
      blob = new Blob([sql], { type: 'text/sql' });
      filename = `zoe-export-${timestamp}.sql`;
      break;

    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  downloadBlob(blob, filename);
}
