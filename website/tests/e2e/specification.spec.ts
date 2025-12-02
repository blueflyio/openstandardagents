import { test, expect } from '@playwright/test';

test.describe('Specification Page', () => {
  test('should display v0.2.8 version', async ({ page }) => {
    await page.goto('/specification');
    await expect(page.locator('text=v0.2.8')).toBeVisible();
  });

  test('should have download links', async ({ page }) => {
    await page.goto('/specification');
    const downloadLinks = page.locator('a[href*="spec"]');
    await expect(downloadLinks.first()).toBeVisible();
  });
});
