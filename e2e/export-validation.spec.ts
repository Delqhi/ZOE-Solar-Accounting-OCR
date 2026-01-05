/**
 * E2E Test Suite: Export Validation
 * Tests all export formats (ELSTER, DATEV, CSV, PDF)
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Export Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Create test data in localStorage
    await page.goto('/');
    await page.evaluate(() => {
      const testData = [{
        id: 'TEST-001',
        vendor: 'Test GmbH',
        amountNetto: 100.00,
        amountMwSt: 19.00,
        amountBrutto: 119.00,
        taxRate: 19,
        account: '3400',
        date: '2026-01-15',
        invoiceNumber: 'INV-2026-001',
        belegDatum: '2026-01-15',
        lieferantName: 'Test GmbH',
        category: 'Wareneingang'
      }];
      localStorage.setItem('zoe-documents', JSON.stringify(testData));
    });
    await page.reload();
  });

  test('ELSTER XML export format validation', async ({ page }) => {
    await page.goto('/');

    // Select documents
    await page.locator('.document-checkbox').first().check();

    // Click ELSTER Export
    await page.click('text=ELSTER Export');

    // Wait for download
    const download = await page.waitForEvent('download', { timeout: 30000 });
    const downloadPath = await download.path();
    const filename = download.suggestedFilename();

    // Verify filename pattern
    expect(filename).toMatch(/elster.*\.xml$/i);

    // Read and validate XML content
    const xmlContent = fs.readFileSync(downloadPath, 'utf8');

    // Check XML structure
    expect(xmlContent).toContain('<?xml version="1.0"');
    expect(xmlContent).toContain('UStVA');
    expect(xmlContent).toContain('Kz21'); // VAT fields
    expect(xmlContent).toContain('Kz35');
    expect(xmlContent).toContain('Kz81');

    // Validate namespace
    expect(xmlContent).toContain('http://www.elster.de/2002/XMLSchema');

    // Check date format
    expect(xmlContent).toMatch(/\d{4}-\d{2}-\d{2}/);

    console.log('✅ ELSTER XML validation passed');
  });

  test('DATEV EXTF CSV export format', async ({ page }) => {
    await page.goto('/');

    // Select documents
    await page.locator('.document-checkbox').first().check();

    // Click DATEV Export
    await page.click('text=DATEV Export');

    const download = await page.waitForEvent('download', { timeout: 30000 });
    const downloadPath = await download.path();
    const filename = download.suggestedFilename();

    // Verify filename
    expect(filename).toMatch(/datev.*\.csv$/i);

    // Read CSV content
    const csvContent = fs.readFileSync(downloadPath, 'utf8');
    const lines = csvContent.split('\n');

    // Check header format
    expect(lines[0]).toMatch(/^[0-9]{4};/); // DATEV format: YYYYMMDD;

    // Check number of columns (should be 43)
    const firstLine = lines[0].split(';');
    expect(firstLine.length).toBeGreaterThanOrEqual(40);

    // Check for mandatory fields
    expect(csvContent).toContain(';S;'); // Soll/Haben
    expect(csvContent).toMatch(/\d{4}/); // Account numbers

    console.log('✅ DATEV EXTF validation passed');
  });

  test('CSV export for Excel', async ({ page }) => {
    await page.goto('/');

    await page.locator('.document-checkbox').first().check();
    await page.click('text=CSV Export');

    const download = await page.waitForEvent('download', { timeout: 30000 });
    const csvPath = await download.path();

    const content = fs.readFileSync(csvPath, 'utf8');

    // Check CSV format
    expect(content).toContain(',');
    expect(content).toContain('Lieferant'); // Header
    expect(content).toContain('Netto');     // Header

    // Parse and validate structure
    const lines = content.split('\n');
    expect(lines.length).toBeGreaterThan(1); // Header + data

    console.log('✅ CSV export validation passed');
  });

  test('PDF Report (EÜR) generation', async ({ page }) => {
    await page.goto('/');

    await page.locator('.document-checkbox').first().check();
    await page.click('text=EÜR Report');

    const download = await page.waitForEvent('download', { timeout: 30000 });
    const pdfPath = await download.path();
    const filename = download.suggestedFilename();

    expect(filename).toMatch(/euer.*\.pdf$/i);

    // Verify PDF file header
    const buffer = fs.readFileSync(pdfPath);
    const pdfHeader = buffer.toString('utf8', 0, 5);
    expect(pdfHeader).toBe('%PDF-'); // PDF magic number

    console.log('✅ PDF Report validation passed');
  });

  test('SQL export for database', async ({ page }) => {
    await page.goto('/');

    await page.locator('.document-checkbox').first().check();
    await page.click('text=SQL Export');

    const download = await page.waitForEvent('download', { timeout: 30000 });
    const sqlPath = await download.path();

    const content = fs.readFileSync(sqlPath, 'utf8');

    // Check SQL structure
    expect(content).toContain('INSERT INTO');
    expect(content).toMatch(/VALUES/gi);
    expect(content).toContain('zoe_documents');

    console.log('✅ SQL export validation passed');
  });

  test('Bulk export multiple documents', async ({ page }) => {
    await page.goto('/');

    // Select multiple documents
    const checkboxes = page.locator('.document-checkbox');
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();
    await checkboxes.nth(2).check();

    // Export all
    await page.click('text=ELSTER Export');

    const download = await page.waitForEvent('download', { timeout: 30000 });
    const xmlPath = await download.path();

    const content = fs.readFileSync(xmlPath, 'utf8');

    // Should contain data from all 3 documents
    const matches = content.match(/Kz21/g);
    expect(matches?.length).toBeGreaterThanOrEqual(3);

    console.log('✅ Bulk export validation passed');
  });
});
