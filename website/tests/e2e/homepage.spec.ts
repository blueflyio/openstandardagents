import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load and display main content', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Open Standard for Scalable AI Agents/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Specification');
    await expect(page).toHaveURL(/\/specification/);
  });

  test('should be accessible', async ({ page }) => {
    await page.goto('/');
    const accessibilityScanResults = await page.accessibility.snapshot();
    expect(accessibilityScanResults).toBeTruthy();
  });
});
