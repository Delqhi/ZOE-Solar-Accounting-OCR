/**
 * E2E Test Suite: SKR03 Rules Engine
 * Tests automatic accounting categorization
 */
import { test, expect } from '@playwright/test';

test.describe('SKR03 Rules Engine', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('auto-categorize vendors to correct SKR03 accounts', async ({ page }) => {
    // Test cases: Vendor name → Expected SKR03 Account
    const testCases = [
      { vendor: 'Adobe GmbH', expected: '4964', category: 'Software' },
      { vendor: 'Microsoft', expected: '4964', category: 'Software' },
      { vendor: 'Bürobedarf GmbH', expected: '4930', category: 'Büromaterial' },
      { vendor: 'Druckerei Schmidt', expected: '4930', category: 'Drucksachen' },
      { vendor: 'Stromnetz Hamburg', expected: '4400', category: 'Energie' },
      { vendor: 'Deutsche Bahn', expected: '4940', category: 'Reisekosten' },
      { vendor: 'Telefonica', expected: '4940', category: 'Telekommunikation' },
      { vendor: 'Softwareentwicklung GmbH', expected: '4964', category: 'Dienstleistungen' },
      { vendor: 'Beratungsfirm AG', expected: '4920', category: 'Beratung' },
      { vendor: 'Hardware Shop', expected: '4930', category: 'Hardware' },
    ];

    for (const tc of testCases) {
      // Upload document with specific vendor
      const fileChooser = await page.waitForEvent('filechooser');
      await page.click('#upload-area');
      (await fileChooser).setFiles(`./e2e/fixtures/vendors/${tc.vendor.replace(/\s+/g, '_')}.pdf`);

      // Wait for processing
      await expect(page.locator('.status-processing')).toBeHidden({ timeout: 60000 });

      // Find the row with this vendor
      const row = page.locator(`text=${tc.vendor}`).first();

      // Verify account number
      const accountCell = row.locator('.account-number');
      await expect(accountCell).toHaveText(tc.expected, { timeout: 10000 });

      // Verify category
      const categoryCell = row.locator('.category');
      await expect(categoryCell).toContainText(tc.category);

      // Cleanup: Remove test document
      await row.locator('.delete-btn').click();
      await page.locator('text=Bestätigen').click();
    }
  });

  test('tax rate auto-detection', async ({ page }) => {
    const taxTests = [
      { amount: 119.00, netto: 100.00, mwst: 19.00, rate: 19, description: '19% Standard' },
      { amount: 107.00, netto: 100.00, mwst: 7.00, rate: 7, description: '7% Reduced (PV)' },
      { amount: 100.00, netto: 100.00, mwst: 0.00, rate: 0, description: '0% Exempt' },
      { amount: 119.00, netto: 100.00, mwst: 19.00, rate: 19, description: 'Reverse Charge' },
    ];

    for (const test of taxTests) {
      const fileChooser = await page.waitForEvent('filechooser');
      await page.click('#upload-area');
      (await fileChooser).setFiles(`./e2e/fixtures/tax/tax_${test.rate}.pdf`);

      await expect(page.locator('.status-processing')).toBeHidden({ timeout: 60000 });

      // Verify tax calculation
      const nettoCell = page.locator('.amount-netto').first();
      const mwstCell = page.locator('.amount-mwst').first();
      const bruttoCell = page.locator('.amount-brutto').first();

      await expect(nettoCell).toHaveValue(test.netto.toString());
      await expect(mwstCell).toHaveValue(test.mwst.toString());
      await expect(bruttoCell).toHaveValue(test.amount.toString());

      // Verify tax rate displayed
      const rateCell = page.locator('.tax-rate').first();
      await expect(rateCell).toContainText(`${test.rate}%`);
    }
  });

  test('vendor ML learning improvement', async ({ page }) => {
    // Upload from unknown vendor first time
    const unknownFile = await page.waitForEvent('filechooser');
    await page.click('#upload-area');
    (await unknownFile).setFiles('./e2e/fixtures/vendors/new_vendor.pdf');

    await expect(page.locator('.status-processing')).toBeHidden({ timeout: 60000 });

    // Manually categorize
    const row = page.locator('.document-row').first();
    await row.locator('.edit-btn').click();

    // Select correct account
    await page.locator('#account-select').selectOption('4920');
    await page.locator('#category-select').selectOption('Beratung');
    await page.locator('text=Speichern').click();

    // Upload second document from same vendor
    const knownFile = await page.waitForEvent('filechooser');
    await page.click('#upload-area');
    (await knownFile).setFiles('./e2e/fixtures/vendors/new_vendor_2.pdf');

    await expect(page.locator('.status-processing')).toBeHidden({ timeout: 60000 });

    // Should auto-categorize to 4920 based on ML learning
    const secondRow = page.locator('.document-row').nth(1);
    const accountCell = secondRow.locator('.account-number');
    await expect(accountCell).toHaveText('4920', { timeout: 10000 });
  });

  test('private document detection', async ({ page }) => {
    // Test with private items
    const privateDocs = [
      'private-shopping.pdf',
      'groceries.pdf',
      'alcohol-beverage.pdf',
      'tobacco-products.pdf',
      'personal-care.pdf',
    ];

    for (const doc of privateDocs) {
      const fileChooser = await page.waitForEvent('filechooser');
      await page.click('#upload-area');
      (await fileChooser).setFiles(`./e2e/fixtures/private/${doc}`);

      await expect(page.locator('.status-processing')).toBeHidden({ timeout: 60000 });

      // Should be marked as private
      const row = page.locator('.document-row').first();
      await expect(row).toHaveClass(/private/);
      await expect(row.locator('.status')).toContainText('Privat');
    }
  });

  test('complex multi-line invoice processing', async ({ page }) => {
    const fileChooser = await page.waitForEvent('filechooser');
    await page.click('#upload-area');
    (await fileChooser).setFiles('./e2e/fixtures/complex-invoice.pdf');

    await expect(page.locator('.status-processing')).toBeHidden({ timeout: 120000 });

    // Should extract multiple line items
    const lineItems = page.locator('.line-item');
    const count = await lineItems.count();
    expect(count).toBeGreaterThan(1);

    // Verify sum calculation matches
    const sumNetto = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.line-item .netto'));
      return items.reduce((sum, el) => sum + parseFloat(el.textContent || '0'), 0);
    });

    const totalNetto = await page.locator('#total-netto').inputValue();
    expect(parseFloat(totalNetto)).toBeCloseTo(sumNetto, 2);
  });
});
