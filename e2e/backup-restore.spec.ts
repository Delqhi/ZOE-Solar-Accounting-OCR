/**
 * E2E Test Suite: Backup & Restore
 * Tests export/import functionality
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('Backup & Restore', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('export all data to JSON', async ({ page }) => {
    // Setup test data
    await page.evaluate(() => {
      const testData = [
        { id: 'EXP-001', vendor: 'Test GmbH', amountBrutto: 119.00 },
        { id: 'EXP-002', vendor: 'Test AG', amountBrutto: 238.00 },
      ];
      localStorage.setItem('zoe-documents', JSON.stringify(testData));
    });
    await page.reload();

    // Navigate to backup
    await page.click('text=Backup');
    await page.click('text=Export JSON');

    // Download and verify
    const download = await page.waitForEvent('download', { timeout: 30000 });
    const path = await download.path();

    const content = JSON.parse(fs.readFileSync(path, 'utf8'));

    expect(content.documents).toHaveLength(2);
    expect(content.documents[0].vendor).toBe('Test GmbH');
    expect(content.appVersion).toBeDefined();
    expect(content.exportDate).toBeDefined();
  });

  test('export to SQL format', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('zoe-documents', JSON.stringify([
        { id: 'SQL-001', vendor: 'Vendor A', netto: 100, mwst: 19, brutto: 119 }
      ]));
    });
    await page.reload();

    await page.click('text=Backup');
    await page.click('text=Export SQL');

    const download = await page.waitForEvent('download', { timeout: 30000 });
    const path = await download.path();
    const sql = fs.readFileSync(path, 'utf8');

    expect(sql).toContain('INSERT INTO');
    expect(sql).toContain('zoe_documents');
    expect(sql).toContain('SQL-001');
  });

  test('restore from JSON backup', async ({ page }) => {
    // Create backup file
    const backupData = {
      appVersion: '1.0.0',
      exportDate: new Date().toISOString(),
      documents: [
        { id: 'REST-001', vendor: 'Restored GmbH', amountBrutto: 119.00 }
      ]
    };
    const backupPath = '/tmp/test-backup.json';
    fs.writeFileSync(backupPath, JSON.stringify(backupData));

    // Upload backup
    await page.click('text=Backup');
    const fileChooser = await page.waitForEvent('filechooser');
    await page.click('text=Import JSON');
    (await fileChooser).setFiles(backupPath);

    // Should show success message
    await expect(page.locator('text=Daten erfolgreich wiederhergestellt')).toBeVisible({ timeout: 30000 });

    // Verify data restored
    const restored = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('zoe-documents') || '[]');
    });
    expect(restored).toHaveLength(1);
    expect(restored[0].vendor).toBe('Restored GmbH');
  });

  test('merge duplicate IDs on restore', async ({ page }) => {
    // Existing data
    await page.evaluate(() => {
      localStorage.setItem('zoe-documents', JSON.stringify([
        { id: 'MERGE-001', vendor: 'Original', amountBrutto: 119.00, date: '2025-01-01' }
      ]));
    });

    // Restore with same ID but different data
    const backupData = {
      documents: [
        { id: 'MERGE-001', vendor: 'Updated', amountBrutto: 238.00, date: '2025-02-01' }
      ]
    };
    const backupPath = '/tmp/merge-test.json';
    fs.writeFileSync(backupPath, JSON.stringify(backupData));

    await page.click('text=Backup');
    const fileChooser = await page.waitForEvent('filechooser');
    await page.click('text=Import JSON');
    (await fileChooser).setFiles(backupPath);

    // Should show merge option
    await expect(page.locator('text=Duplikate gefunden')).toBeVisible();

    // Choose to update existing
    await page.click('text=Vorhandene aktualisieren');

    // Verify updated
    const data = await page.evaluate(() => JSON.parse(localStorage.getItem('zoe-documents') || '[]'));
    expect(data[0].vendor).toBe('Updated');
    expect(data[0].amountBrutto).toBe(238.00);
  });

  test('backup includes settings', async ({ page }) => {
    await page.goto('/settings');

    // Configure settings
    await page.locator('#tax-category').selectOption('PV-Anlage');
    await page.locator('#export-format').selectOption('DATEV');
    await page.click('text=Speichern');

    // Export backup
    await page.click('text=Backup');
    await page.click('text=Export JSON');

    const download = await page.waitForEvent('download', { timeout: 30000 });
    const path = await download.path();
    const content = JSON.parse(fs.readFileSync(path, 'utf8'));

    expect(content.settings).toBeDefined();
    expect(content.settings.taxCategory).toBe('PV-Anlage');
    expect(content.settings.exportFormat).toBe('DATEV');
  });
});
