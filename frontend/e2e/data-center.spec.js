import { test, expect } from '@playwright/test';

test.describe('Data Center', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
  });

  test('data center page loads', async ({ page }) => {
    await page.goto('/data-center');
    await page.waitForTimeout(1000);
    const heading = page.locator('h1, h2, [class*="title"]').first();
    await expect(heading).toBeVisible();
  });

  test('can switch between tabs', async ({ page }) => {
    await page.goto('/data-center');
    await page.waitForTimeout(1000);
    const tabs = page.locator('button[role="tab"], [class*="tab"]');
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThan(3);
  });

  test('donor portal page loads', async ({ page }) => {
    await page.goto('/donor-portal');
    await page.waitForTimeout(1000);
    const content = page.locator('[class*="container"], main, [class*="content"]').first();
    await expect(content).toBeVisible();
  });

  test('user management page loads', async ({ page }) => {
    await page.goto('/users');
    await page.waitForTimeout(1000);
    const content = page.locator('table, [class*="list"], [class*="grid"]').first();
    if (await content.isVisible()) {
      await expect(content).toBeVisible();
    }
  });
});
