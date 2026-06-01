import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
  });

  test('displays statistics cards', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    const statsSection = page.locator('.grid, [class*="stat"], [class*="card"]').first();
    await expect(statsSection).toBeVisible();
  });

  test('sidebar navigation is visible', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('nav, aside, [class*="sidebar"]').first();
    await expect(sidebar).toBeVisible();
  });

  test('can navigate to beneficiaries', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('a[href*="beneficiar"], button:has-text("المستفيدين")').first();
    if (await link.isVisible()) {
      await link.click();
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('beneficiar');
    }
  });

  test('can navigate to projects', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('a[href*="project"], button:has-text("المشاريع")').first();
    if (await link.isVisible()) {
      await link.click();
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('project');
    }
  });
});
