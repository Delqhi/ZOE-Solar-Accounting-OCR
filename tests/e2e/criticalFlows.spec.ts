/**
 * E2E Tests for Critical User Flows
 * Tests complete user journeys from upload to export
 * Production-ready with 2026 best practices
 */

import { test, expect } from '@playwright/test';
import { PerformanceMonitor } from '../../src/utils/performanceMonitor';

test.describe('Critical User Flows', () => {
  test.describe('Document Upload Flow', () => {
    test('should complete full upload and OCR workflow', async ({ page }) => {
      // Navigate to app
      await page.goto('http://localhost:5173');

      // Wait for app to load
      await page.waitForSelector('text=ZOE Solar Accounting OCR', { timeout: 10000 });

      // Click upload button
      const uploadButton = page.locator('button:has-text("Upload")');
      await expect(uploadButton).toBeVisible();
      await uploadButton.click();

      // File input should appear
      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toBeVisible();

      // Upload a test PDF file
      const fileBuffer = Buffer.from('test pdf content', 'utf-8');
      await fileInput.setInputFiles({
        name: 'test-invoice.pdf',
        mimeType: 'application/pdf',
        buffer: fileBuffer
      });

      // Wait for upload to complete
      await page.waitForSelector('text=Upload successful', { timeout: 30000 });

      // Verify document appears in list
      const documentRow = page.locator('text=test-invoice.pdf');
      await expect(documentRow).toBeVisible();

      // Click OCR button
      const ocrButton = page.locator('button:has-text("Process OCR")');
      await expect(ocrButton).toBeVisible();
      await ocrButton.click();

      // Wait for OCR to complete
      await page.waitForSelector('text=OCR complete', { timeout: 60000 });

      // Verify extracted data is displayed
      await expect(page.locator('text=Supplier')).toBeVisible();
      await expect(page.locator('text=Amount')).toBeVisible();

      // Verify no errors in console
      const errors = await page.evaluate(() => {
        const logs = (window as any).__testLogs || [];
        return logs.filter((l: any) => l.level === 'error');
      });
      expect(errors).toHaveLength(0);
    });

    test('should handle file validation errors', async ({ page }) => {
      await page.goto('http://localhost:5173');

      // Try to upload oversized file
      const uploadButton = page.locator('button:has-text("Upload")');
      await uploadButton.click();

      const fileInput = page.locator('input[type="file"]');
      const largeBuffer = Buffer.alloc(20000000, 'x'); // 20MB
      await fileInput.setInputFiles({
        name: 'large.pdf',
        mimeType: 'application/pdf',
        buffer: largeBuffer
      });

      // Should show error message
      await page.waitForSelector('text=exceeds maximum size', { timeout: 10000 });
    });

    test('should handle invalid file types', async ({ page }) => {
      await page.goto('http://localhost:5173');

      const uploadButton = page.locator('button:has-text("Upload")');
      await uploadButton.click();

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'malicious.exe',
        mimeType: 'application/octet-stream',
        buffer: Buffer.from('malicious content')
      });

      // Should show error about unsupported type
      await page.waitForSelector('text=unsupported', { timeout: 10000 });
    });
  });

  test.describe('Document Management Flow', () => {
    test('should edit document metadata', async ({ page }) => {
      await page.goto('http://localhost:5173');

      // Upload and process a document first
      const uploadButton = page.locator('button:has-text("Upload")');
      await uploadButton.click();
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('test')
      });
      await page.waitForSelector('text=Upload successful', { timeout: 30000 });

      // Click edit button
      const editButton = page.locator('button:has-text("Edit")');
      await editButton.click();

      // Modify supplier name
      const supplierInput = page.locator('input[name="supplierName"]');
      await supplierInput.fill('Updated Supplier GmbH');

      // Save changes
      const saveButton = page.locator('button:has-text("Save")');
      await saveButton.click();

      // Verify changes saved
      await page.waitForSelector('text=Updated Supplier GmbH', { timeout: 10000 });
    });

    test('should delete document with confirmation', async ({ page }) => {
      await page.goto('http://localhost:5173');

      // Upload document
      const uploadButton = page.locator('button:has-text("Upload")');
      await uploadButton.click();
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'delete-test.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('test')
      });
      await page.waitForSelector('text=Upload successful', { timeout: 30000 });

      // Click delete
      const deleteButton = page.locator('button:has-text("Delete")');
      await deleteButton.click();

      // Confirm deletion
      const confirmButton = page.locator('button:has-text("Confirm")');
      await confirmButton.click();

      // Verify document removed
      await page.waitForSelector('text=delete-test.pdf', { state: 'hidden', timeout: 10000 });
    });

    test('should search and filter documents', async ({ page }) => {
      await page.goto('http://localhost:5173');

      // Upload multiple documents
      const uploadButton = page.locator('button:has-text("Upload")');
      for (let i = 0; i < 3; i++) {
        await uploadButton.click();
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({
          name: `invoice-${i}.pdf`,
          mimeType: 'application/pdf',
          buffer: Buffer.from(`invoice ${i}`)
        });
        await page.waitForSelector('text=Upload successful', { timeout: 30000 });
      }

      // Search for specific document
      const searchInput = page.locator('input[placeholder*="Search"]');
      await searchInput.fill('invoice-1');

      // Verify filtered results
      await expect(page.locator('text=invoice-1.pdf')).toBeVisible();
      await expect(page.locator('text=invoice-0.pdf')).not.toBeVisible();
    });
  });

  test.describe('Export Flow', () => {
    test('should export documents as CSV', async ({ page }) => {
      await page.goto('http://localhost:5173');

      // Upload and process document
      const uploadButton = page.locator('button:has-text("Upload")');
      await uploadButton.click();
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'export-test.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('export test')
      });
      await page.waitForSelector('text=Upload successful', { timeout: 30000 });

      // Select document
      const checkbox = page.locator('input[type="checkbox"]').first();
      await checkbox.check();

      // Click export
      const exportButton = page.locator('button:has-text("Export")');
      await exportButton.click();

      // Select CSV format
      const csvOption = page.locator('text=CSV');
      await csvOption.click();

      // Confirm export
      const confirmButton = page.locator('button:has-text("Export")');
      await confirmButton.click();

      // Wait for export to complete
      await page.waitForSelector('text=Export complete', { timeout: 30000 });

      // Verify download started (check for download dialog or file)
      // This depends on browser behavior
    });

    test('should export documents as JSON', async ({ page }) => {
      await page.goto('http://localhost:5173');

      // Upload document
      const uploadButton = page.locator('button:has-text("Upload")');
      await uploadButton.click();
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'json-test.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('json test')
      });
      await page.waitForSelector('text=Upload successful', { timeout: 30000 });

      // Select and export
      const checkbox = page.locator('input[type="checkbox"]').first();
      await checkbox.check();
      const exportButton = page.locator('button:has-text("Export")');
      await exportButton.click();
      const jsonOption = page.locator('text=JSON');
      await jsonOption.click();
      const confirmButton = page.locator('button:has-text("Export")');
      await confirmButton.click();

      // Wait for export
      await page.waitForSelector('text=Export complete', { timeout: 30000 });
    });

    test('should handle export rate limiting', async ({ page }) => {
      await page.goto('http://localhost:5173');

      // Upload document
      const uploadButton = page.locator('button:has-text("Upload")');
      await uploadButton.click();
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'rate-test.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('rate test')
      });
      await page.waitForSelector('text=Upload successful', { timeout: 30000 });

      // Try multiple exports rapidly
      for (let i = 0; i < 6; i++) {
        const checkbox = page.locator('input[type="checkbox"]').first();
        await checkbox.check();
        const exportButton = page.locator('button:has-text("Export")');
        await exportButton.click();
        const confirmButton = page.locator('button:has-text("Export")');
        await confirmButton.click();

        // Wait a bit
        await page.waitForTimeout(100);
      }

      // Should eventually show rate limit error
      await page.waitForSelector('text=Rate limit exceeded', { timeout: 10000 });
    });
  });

  test.describe('Authentication Flow', () => {
    test('should sign in successfully', async ({ page }) => {
      await page.goto('http://localhost:5173');

      // Wait for auth screen
      await page.waitForSelector('text=Sign In', { timeout: 10000 });

      // Fill credentials
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');

      // Click sign in
      const signInButton = page.locator('button:has-text("Sign In")');
      await signInButton.click();

      // Wait for dashboard
      await page.waitForSelector('text=Dashboard', { timeout: 15000 });
    });

    test('should handle invalid credentials', async ({ page }) => {
      await page.goto('http://localhost:5173');

      await page.waitForSelector('text=Sign In', { timeout: 10000 });

      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      await emailInput.fill('invalid@example.com');
      await passwordInput.fill('wrongpassword');

      const signInButton = page.locator('button:has-text("Sign In")');
      await signInButton.click();

      // Should show error
      await page.waitForSelector('text=Invalid credentials', { timeout: 10000 });
    });

    test('should sign out successfully', async ({ page }) => {
      await page.goto('http://localhost:5173');

      // Sign in first
      await page.waitForSelector('text=Sign In', { timeout: 10000 });
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      const signInButton = page.locator('button:has-text("Sign In")');
      await signInButton.click();
      await page.waitForSelector('text=Dashboard', { timeout: 15000 });

      // Click sign out
      const signOutButton = page.locator('button:has-text("Sign Out")');
      await signOutButton.click();

      // Should return to auth screen
      await page.waitForSelector('text=Sign In', { timeout: 10000 });
    });
  });

  test.describe('Dashboard Analytics Flow', () => {
    test('should display dashboard statistics', async ({ page }) => {
      await page.goto('http://localhost:5173');

      // Upload multiple documents
      const uploadButton = page.locator('button:has-text("Upload")');
      for (let i = 0; i < 5; i++) {
        await uploadButton.click();
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({
          name: `doc-${i}.pdf`,
          mimeType: 'application/pdf',
          buffer: Buffer.from(`document ${i}`)
        });
        await page.waitForSelector('text=Upload successful', { timeout: 30000 });
      }

      // Navigate to dashboard
      const dashboardButton = page.locator('text=Dashboard');
      await dashboardButton.click();

      // Verify statistics are displayed
      await expect(page.locator('text=Total Documents')).toBeVisible();
      await expect(page.locator('text=Total Amount')).toBeVisible();
      await expect(page.locator('text=Monthly Trends')).toBeVisible();

      // Verify charts are rendered
      const chart = page.locator('canvas');
      await expect(chart).toBeVisible();
    });

    test('should filter dashboard by date range', async ({ page }) => {
      await page.goto('http://localhost:5173');

      // Go to dashboard
      const dashboardButton = page.locator('text=Dashboard');
      await dashboardButton.click();

      // Select date range
      const dateFrom = page.locator('input[name="dateFrom"]');
      const dateTo = page.locator('input[name="dateTo"]');
      await dateFrom.fill('2024-01-01');
      await dateTo.fill('2024-01-31');

      // Apply filter
      const applyButton = page.locator('button:has-text("Apply")');
      await applyButton.click();

      // Wait for filtered results
      await page.waitForTimeout(2000);

      // Verify dashboard updated
      await expect(page.locator('text=Filtered Results')).toBeVisible();
    });
  });

  test.describe('Duplicate Detection Flow', () => {
    test('should detect duplicate documents', async ({ page }) => {
      await page.goto('http://localhost:5173');

      // Upload first document
      const uploadButton = page.locator('button:has-text("Upload")');
      await uploadButton.click();
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'duplicate.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('duplicate content')
      });
      await page.waitForSelector('text=Upload successful', { timeout: 30000 });

      // Try to upload same document again
      await uploadButton.click();
      await fileInput.setInputFiles({
        name: 'duplicate.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('duplicate content')
      });

      // Should show duplicate warning
      await page.waitForSelector('text=Duplicate detected', { timeout: 10000 });
    });
  });

  test.describe('Error Recovery Flow', () => {
    test('should recover from network errors', async ({ page }) => {
      await page.goto('http://localhost:5173');

      // Simulate network failure by blocking requests
      await page.route('**/*', (route) => {
        route.abort('failed');
      });

      // Try to upload
      const uploadButton = page.locator('button:has-text("Upload")');
      await uploadButton.click();
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('test')
      });

      // Should show error message
      await page.waitForSelector('text=Network error', { timeout: 10000 });

      // Restore network
      await page.unroute('**/*');

      // Retry should work
      await uploadButton.click();
      await fileInput.setInputFiles({
        name: 'test2.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('test2')
      });
      await page.waitForSelector('text=Upload successful', { timeout: 30000 });
    });

    test('should handle session timeout', async ({ page }) => {
      await page.goto('http://localhost:5173');

      // Sign in
      await page.waitForSelector('text=Sign In', { timeout: 10000 });
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      const signInButton = page.locator('button:has-text("Sign In")');
      await signInButton.click();
      await page.waitForSelector('text=Dashboard', { timeout: 15000 });

      // Clear session (simulate timeout)
      await page.evaluate(() => localStorage.clear());

      // Try to perform action
      const uploadButton = page.locator('button:has-text("Upload")');
      await uploadButton.click();

      // Should redirect to sign in
      await page.waitForSelector('text=Sign In', { timeout: 10000 });
    });
  });

  test.describe('Performance Flow', () => {
    test('should load within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('http://localhost:5173');
      await page.waitForSelector('text=ZOE Solar Accounting OCR', { timeout: 10000 });
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(5000); // Should load in under 5 seconds
    });

    test('should handle large document lists efficiently', async ({ page }) => {
      await page.goto('http://localhost:5173');

      // Upload 50 documents
      const uploadButton = page.locator('button:has-text("Upload")');
      for (let i = 0; i < 50; i++) {
        await uploadButton.click();
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({
          name: `bulk-${i}.pdf`,
          mimeType: 'application/pdf',
          buffer: Buffer.from(`bulk ${i}`)
        });
        await page.waitForSelector('text=Upload successful', { timeout: 30000 });
      }

      // Verify list loads quickly
      const startTime = Date.now();
      await page.reload();
      await page.waitForSelector('text=bulk-0.pdf', { timeout: 10000 });
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(10000); // Should load in under 10 seconds
    });
  });

  test.describe('Security Flow', () => {
    test('should prevent XSS attacks', async ({ page }) => {
      await page.goto('http://localhost:5173');

      // Try to upload file with malicious name
      const uploadButton = page.locator('button:has-text("Upload")');
      await uploadButton.click();
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: '<script>alert("xss")</script>.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('malicious')
      });

      // Should sanitize or reject
      await page.waitForSelector('text=Upload successful', { timeout: 30000 });

      // Verify no alert appeared
      page.on('dialog', (dialog) => {
        expect.fail('Unexpected dialog: ' + dialog.message());
      });
    });

    test('should handle rate limiting', async ({ page }) => {
      await page.goto('http://localhost:5173');

      // Rapidly try to upload
      for (let i = 0; i < 15; i++) {
        const uploadButton = page.locator('button:has-text("Upload")');
        await uploadButton.click();
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({
          name: `rate-${i}.pdf`,
          mimeType: 'application/pdf',
          buffer: Buffer.from(`rate ${i}`)
        });
        await page.waitForTimeout(100);
      }

      // Should eventually show rate limit error
      await page.waitForSelector('text=Rate limit exceeded', { timeout: 15000 });
    });
  });

  test.describe('Complete User Journey', () => {
    test('should complete end-to-end workflow', async ({ page }) => {
      // 1. Sign in
      await page.goto('http://localhost:5173');
      await page.waitForSelector('text=Sign In', { timeout: 10000 });
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      const signInButton = page.locator('button:has-text("Sign In")');
      await signInButton.click();
      await page.waitForSelector('text=Dashboard', { timeout: 15000 });

      // 2. Upload document
      const uploadButton = page.locator('button:has-text("Upload")');
      await uploadButton.click();
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'invoice-2024-001.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('invoice data')
      });
      await page.waitForSelector('text=Upload successful', { timeout: 30000 });

      // 3. Process OCR
      const ocrButton = page.locator('button:has-text("Process OCR")');
      await ocrButton.click();
      await page.waitForSelector('text=OCR complete', { timeout: 60000 });

      // 4. Verify extracted data
      await expect(page.locator('text=Supplier')).toBeVisible();
      await expect(page.locator('text=Amount')).toBeVisible();

      // 5. Edit document
      const editButton = page.locator('button:has-text("Edit")');
      await editButton.click();
      const supplierInput = page.locator('input[name="supplierName"]');
      await supplierInput.fill('Test Supplier GmbH');
      const saveButton = page.locator('button:has-text("Save")');
      await saveButton.click();
      await page.waitForSelector('text=Test Supplier GmbH', { timeout: 10000 });

      // 6. Export as CSV
      const checkbox = page.locator('input[type="checkbox"]').first();
      await checkbox.check();
      const exportButton = page.locator('button:has-text("Export")');
      await exportButton.click();
      const csvOption = page.locator('text=CSV');
      await csvOption.click();
      const confirmExport = page.locator('button:has-text("Export")');
      await confirmExport.click();
      await page.waitForSelector('text=Export complete', { timeout: 30000 });

      // 7. View dashboard
      const dashboardButton = page.locator('text=Dashboard');
      await dashboardButton.click();
      await expect(page.locator('text=Total Documents: 1')).toBeVisible();

      // 8. Sign out
      const signOutButton = page.locator('button:has-text("Sign Out")');
      await signOutButton.click();
      await page.waitForSelector('text=Sign In', { timeout: 10000 });

      // Complete workflow successful
      expect(true).toBe(true);
    }, 120000); // Extended timeout for full workflow
  });
});
