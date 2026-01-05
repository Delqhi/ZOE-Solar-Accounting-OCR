/**
 * E2E Test Suite: Authentication Flow
 * Tests login, signup, and session management
 */
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('user login with valid credentials', async ({ page }) => {
    await page.goto('/auth');

    // Fill login form
    await page.fill('input[type="email"]', 'test@zoe-tax.de');
    await page.fill('input[type="password"]', 'SecurePass123!');

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard|\/$/);
    await expect(page.locator('#upload-area')).toBeVisible();

    // Verify session is stored
    const storage = await page.evaluate(() => localStorage.getItem('sb-...'));
    expect(storage).toBeTruthy();
  });

  test('login validation - empty fields', async ({ page }) => {
    await page.goto('/auth');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('text=Email ist erforderlich')).toBeVisible();
    await expect(page.locator('text=Passwort ist erforderlich')).toBeVisible();
  });

  test('login validation - invalid email format', async ({ page }) => {
    await page.goto('/auth');

    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Ungültiges E-Mail-Format')).toBeVisible();
  });

  test('logout functionality', async ({ page }) => {
    // First login
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@zoe-tax.de');
    await page.fill('input[type="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('#upload-area')).toBeVisible();

    // Then logout
    await page.click('text=Profil');
    await page.click('text=Abmelden');

    // Should redirect to auth
    await expect(page).toHaveURL(/.*\/auth$/);
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // Verify session cleared
    const storage = await page.evaluate(() => localStorage.getItem('sb-...'));
    expect(storage).toBeNull();
  });

  test('protected routes redirect to login', async ({ page }) => {
    // Try to access protected route without auth
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*\/auth$/);

    await page.goto('/settings');
    await expect(page).toHaveURL(/.*\/auth$/);
  });
});
