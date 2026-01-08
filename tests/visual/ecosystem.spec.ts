import { test, expect } from '@playwright/test';

test.describe('Ecosystem Page Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ecosystem');
    await page.waitForLoadState('networkidle');
  });

  test('all icons load successfully', async ({ page }) => {
    const images = page.locator('img[alt]');
    const count = await images.count();
    
    expect(count).toBeGreaterThan(0);
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const src = await img.getAttribute('src');
      const alt = await img.getAttribute('alt');
      
      // Verify image has valid src
      expect(src).toBeTruthy();
      expect(src).toMatch(/^https?:\/\//);
      
      // Verify image is visible
      await expect(img).toBeVisible();
      
      // Check natural dimensions (image loaded)
      const dimensions = await img.evaluate((el: HTMLImageElement) => ({
        width: el.naturalWidth,
        height: el.naturalHeight,
      }));
      
      expect(dimensions.width).toBeGreaterThan(0);
      expect(dimensions.height).toBeGreaterThan(0);
      
      console.log(`✓ ${alt}: ${src} (${dimensions.width}x${dimensions.height})`);
    }
  });

  test('no broken CDN URLs', async ({ page }) => {
    const cdnImages = page.locator('img[src*="cdn.simpleicons.org"]');
    const count = await cdnImages.count();
    
    for (let i = 0; i < count; i++) {
      const img = cdnImages.nth(i);
      const src = await img.getAttribute('src');
      
      // Verify CDN URL format (no .svg extension)
      expect(src).not.toContain('.svg');
      expect(src).toMatch(/^https:\/\/cdn\.simpleicons\.org\/[a-z]+$/);
      
      await expect(img).toBeVisible();
    }
  });

  test('ecosystem grid visual snapshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('ecosystem-full.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('mobile viewport renders correctly', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
    }
    
    await expect(page).toHaveScreenshot('ecosystem-mobile.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('critical icons are present', async ({ page }) => {
    const criticalIcons = [
      'OpenAI',
      'Anthropic',
      'LangChain',
      'Model Context Protocol',
      'Vercel',
      'Drupal',
    ];
    
    for (const name of criticalIcons) {
      const icon = page.locator(`img[alt="${name}"]`);
      await expect(icon).toBeVisible();
      
      const src = await icon.getAttribute('src');
      expect(src).toBeTruthy();
    }
  });
});
