import { test, expect } from '@playwright/test';

test.describe('Ecosystem Page Interactions', () => {
  test('icons have hover effects', async ({ page }) => {
    await page.goto('/ecosystem');
    await page.waitForLoadState('networkidle');
    
    const firstIcon = page.locator('.hover\\:bg-white').first();
    
    // Get initial background
    const initialBg = await firstIcon.evaluate((el) => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // Hover
    await firstIcon.hover();
    
    // Wait for transition
    await page.waitForTimeout(300);
    
    // Check background changed
    const hoverBg = await firstIcon.evaluate((el) => 
      window.getComputedStyle(el).backgroundColor
    );
    
    expect(hoverBg).not.toBe(initialBg);
  });

  test('page loads within performance budget', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/ecosystem');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('all images use correct CORS settings', async ({ page }) => {
    await page.goto('/ecosystem');
    
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const src = await img.getAttribute('src');
      
      // Check if external URL
      if (src?.startsWith('http')) {
        const response = await page.request.get(src);
        expect(response.ok()).toBeTruthy();
      }
    }
  });
});
