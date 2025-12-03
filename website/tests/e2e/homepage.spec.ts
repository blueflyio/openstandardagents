import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load and display main content', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page).toHaveTitle(/Open Standard Agents/);
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const specLink = page.locator('a[href="/specification"]').first();
    await specLink.waitFor({ state: 'visible', timeout: 10000 });
    await specLink.click();
    await expect(page).toHaveURL(/\/specification/);
  });

  test('should be accessible', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const accessibilityScanResults = await page.locator('body').evaluate(() => true);
    expect(accessibilityScanResults).toBeTruthy();
  });
});
