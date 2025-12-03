import { test, expect } from '@playwright/test';

test.describe('Specification Page', () => {
  test('should display v0.2.8 version', async ({ page }) => {
    await page.goto('/specification', { waitUntil: 'networkidle' });
    const versionText = page.locator('text=/v?0\\.2\\.8/i').first();
    await versionText.waitFor({ state: 'attached', timeout: 10000 });
    await expect(versionText).toBeVisible({ timeout: 10000 });
  });

  test('should have download links', async ({ page }) => {
    await page.goto('/specification', { waitUntil: 'networkidle' });
    const downloadLinks = page.locator('a[href*=".json"], a[href*="download"]').first();
    await downloadLinks.waitFor({ state: 'attached', timeout: 10000 });
    await expect(downloadLinks).toBeVisible({ timeout: 10000 });
  });
});
