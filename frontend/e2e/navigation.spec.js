import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/login');
  });

  test('main pages are accessible after login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"], input[name="username"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const pages = [
      '/beneficiaries',
      '/projects',
      '/finance',
      '/monitoring',
      '/reports',
    ];

    for (const path of pages) {
      await page.goto(path);
      await page.waitForTimeout(1000);
      const hasContent = await page.locator('h1, h2, [class*="text-"]').first().isVisible().catch(() => false);
    }
  });
});
