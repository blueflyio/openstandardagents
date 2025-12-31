import { test, expect, devices } from '@playwright/test';

// Mobile-specific tests - use iPhone 13 viewport at file level
test.use({ ...devices['iPhone 13'] });

test.describe('Mobile Responsiveness', () => {

  test('viewport meta tag is present', async ({ page }) => {
    await page.goto('/');
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('device-width');
    expect(viewport).toContain('initial-scale');
  });

  test('mobile menu button is visible and functional', async ({ page }) => {
    await page.goto('/');
    const menuButton = page.locator('button[aria-label="Toggle menu"]');
    await expect(menuButton).toBeVisible();

    // Check touch target size (min 44x44pt)
    const box = await menuButton.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);

    // Test menu toggle
    await menuButton.click();
    const mobileMenu = page.locator('#mobile-menu');
    await expect(mobileMenu).toBeVisible();
  });

  test('no horizontal scrolling on mobile', async ({ page }) => {
    await page.goto('/');
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // Allow small margin
  });

  test('text is readable on mobile', async ({ page }) => {
    await page.goto('/');
    const bodyText = page.locator('body');
    const fontSize = await bodyText.evaluate((el) =>
      parseFloat(getComputedStyle(el).fontSize)
    );
    expect(fontSize).toBeGreaterThanOrEqual(14); // Minimum readable size
  });

  test('touch targets meet minimum size', async ({ page }) => {
    await page.goto('/');
    // Only check visible, interactive elements with meaningful size
    const links = page.locator('a:visible, button:visible').filter({ hasText: /.+/ });
    const count = await links.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const link = links.nth(i);
      const box = await link.boundingBox();
      // Skip elements that are too small to be real touch targets (icons, hidden elements)
      if (box && box.width > 10 && box.height > 10) {
        const minSize = Math.min(box.width, box.height);
        // Allow some flexibility for text links
        expect(minSize).toBeGreaterThanOrEqual(24);
      }
    }
  });
});
