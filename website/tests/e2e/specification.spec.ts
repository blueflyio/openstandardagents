import { test, expect } from '@playwright/test';

test.describe('Specification Page', () => {
  test('should display current version', async ({ page }) => {
    await page.goto('/specification', { waitUntil: 'networkidle' });
    // Check for v0.2.x version pattern (current is v0.2.9)
    const versionText = page.locator('text=/v0\\.2\\.[0-9]+/i').first();
    await versionText.waitFor({ state: 'attached', timeout: 10000 });
    await expect(versionText).toBeVisible({ timeout: 10000 });
  });

  test('should have schema link', async ({ page, isMobile }) => {
    await page.goto('/specification', { waitUntil: 'networkidle' });

    // On mobile, the nav links may be in a hamburger menu
    // Look for schema link in main content area (not nav) which is always visible
    const mainContentSchemaLink = page.locator('main a[href*="/schema"], section a[href*="/schema"]').first();

    if (await mainContentSchemaLink.isVisible()) {
      await expect(mainContentSchemaLink).toBeVisible({ timeout: 10000 });
    } else {
      // Fallback: on mobile, open menu to find nav link
      if (isMobile) {
        const menuButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]').first();
        if (await menuButton.isVisible()) {
          await menuButton.click();
          await page.waitForTimeout(300);
        }
      }
      const schemaLink = page.locator('a[href*="/schema"]').first();
      await schemaLink.waitFor({ state: 'attached', timeout: 10000 });
      await expect(schemaLink).toBeVisible({ timeout: 10000 });
    }
  });
});
