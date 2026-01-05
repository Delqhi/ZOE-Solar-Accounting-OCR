/**
 * E2E Test Suite: Upload Flow & OCR Pipeline
 * Tests complete workflow from file upload to data extraction
 */
import { test, expect } from '@playwright/test';

test.describe('OCR Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clean localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('complete upload to export pipeline', async ({ page }) => {
    test.setTimeout(120000); // 2 min for OCR processing

    // Step 1: Login
    await page.goto('/auth');
    await expect(page).toHaveTitle(/ZOE/);

    // Check if already logged in or use test credentials
    const authState = await page.evaluate(() => {
      const stored = localStorage.getItem('sb-...'); // Supabase auth key pattern
      return stored !== null;
    });

    if (!authState) {
      // Fill auth form if needed
      const emailInput = page.locator('input[type="email"]');
      if (await emailInput.isVisible()) {
        await emailInput.fill('test@example.com');
        await page.locator('input[type="password"]').fill('testpassword123');
        await page.locator('button[type="submit"]').click();
        await expect(page.locator('#upload-area')).toBeVisible();
      }
    }

    // Step 2: Navigate to upload
    await page.goto('/');
    await expect(page.locator('#upload-area')).toBeVisible();

    // Step 3: Upload PDF
    const fileChooser = page.waitForEvent('filechooser');
    await page.click('#upload-area');
    (await fileChooser).setFiles('./e2e/fixtures/test-invoice.pdf');

    // Step 4: Wait for processing
    const processingIndicator = page.locator('.status-processing');
    await expect(processingIndicator).toBeVisible();

    // Wait for processing to complete (max 90 seconds)
    await expect(processingIndicator).toBeHidden({ timeout: 90000 });

    // Step 5: Verify extracted data
    await page.waitForSelector('.document-row', { timeout: 10000 });

    // Check if document appears in grid
    const documentRow = page.locator('.document-row').first();
    await expect(documentRow).toBeVisible();

    // Verify key fields
    const nettoInput = page.locator('#amount-netto');
    const mwstInput = page.locator('#amount-mwst');
    const bruttoInput = page.locator('#amount-brutto');

    if (await nettoInput.isVisible()) {
      const nettoValue = await nettoInput.inputValue();
      const mwstValue = await mwstInput.inputValue();
      const bruttoValue = await bruttoInput.inputValue();

      // Verify math: netto + mwst = brutto
      const netto = parseFloat(nettoValue);
      const mwst = parseFloat(mwstValue);
      const brutto = parseFloat(bruttoValue);

      expect(netto + mwst).toBeCloseTo(brutto, 2);
    }

    // Step 6: Export to ELSTER
    await page.click('text=ELSTER Export');

    // Wait for export modal or download
    const exportSuccess = page.locator('text=Export erfolgreich');
    await expect(exportSuccess).toBeVisible({ timeout: 30000 });

    // Verify file downloaded
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toMatch(/elster.*\.xml$/i);
  });

  test('duplicate detection works correctly', async ({ page }) => {
    test.setTimeout(180000);

    await page.goto('/');

    // Upload first document
    const fileChooser1 = await page.waitForEvent('filechooser');
    await page.click('#upload-area');
    (await fileChooser1).setFiles('./e2e/fixtures/duplicate-test.pdf');

    // Wait for processing
    await expect(page.locator('.status-processing')).toBeHidden({ timeout: 60000 });

    // Upload same document again
    const fileChooser2 = await page.waitForEvent('filechooser');
    await page.click('#upload-area');
    (await fileChooser2).setFiles('./e2e/fixtures/duplicate-test.pdf');

    // Should show duplicate warning
    const duplicateWarning = page.locator('text=Duplikat erkannt');
    await expect(duplicateWarning).toBeVisible({ timeout: 30000 });

    // Check that second document is marked as duplicate
    const duplicateRow = page.locator('.status-duplicate');
    await expect(duplicateRow).toBeVisible();
  });

  test('multiple file upload batch processing', async ({ page }) => {
    test.setTimeout(180000);

    await page.goto('/');

    // Upload 3 files at once
    const fileChooser = page.waitForEvent('filechooser');
    await page.click('#upload-area');
    (await fileChooser).setFiles([
      './e2e/fixtures/invoice-001.pdf',
      './e2e/fixtures/invoice-002.pdf',
      './e2e/fixtures/invoice-003.pdf'
    ]);

    // Check batch progress
    const progressBar = page.locator('.batch-progress');
    await expect(progressBar).toBeVisible();

    // Wait for all to complete
    await expect(progressBar).toBeHidden({ timeout: 120000 });

    // Verify 3 documents in grid
    const rows = page.locator('.document-row');
    await expect(rows).toHaveCount(3, { timeout: 10000 });
  });

  test('invalid file type handling', async ({ page }) => {
    await page.goto('/');

    // Try to upload invalid file
    const fileChooser = page.waitForEvent('filechooser');
    await page.click('#upload-area');
    (await fileChooser).setFiles('./e2e/fixtures/invalid.txt');

    // Should show error message
    const errorMsg = page.locator('text=Ungültiges Dateiformat');
    await expect(errorMsg).toBeVisible();
  });
});
