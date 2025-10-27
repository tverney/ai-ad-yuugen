import { test, expect, devices } from '@playwright/test';

test.describe('Responsive Behavior', () => {
  const viewports = [
    { name: 'Desktop Large', width: 1920, height: 1080 },
    { name: 'Desktop Medium', width: 1366, height: 768 },
    { name: 'Tablet Landscape', width: 1024, height: 768 },
    { name: 'Tablet Portrait', width: 768, height: 1024 },
    { name: 'Mobile Large', width: 414, height: 896 },
    { name: 'Mobile Medium', width: 375, height: 667 },
    { name: 'Mobile Small', width: 320, height: 568 }
  ];

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => window.testApp?.sdk !== null, { timeout: 10000 });
  });

  test('should adapt ad layouts to different screen sizes', async ({ page }) => {
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500); // Allow for responsive adjustments
      
      // Request an ad
      await page.click('[data-testid="vanilla-request-ad"]');
      await page.waitForSelector('[data-testid="vanilla-ad-content"]', { timeout: 5000 });
      
      // Check ad container responsiveness
      const adContainer = page.locator('[data-testid="vanilla-banner-ad"]');
      const containerBounds = await adContainer.boundingBox();
      
      // Ad should not exceed viewport width
      expect(containerBounds.width).toBeLessThanOrEqual(viewport.width);
      expect(containerBounds.width).toBeGreaterThan(0);
      
      // Ad should be visible
      await expect(adContainer).toBeVisible();
      
      console.log(`${viewport.name} (${viewport.width}x${viewport.height}): Ad width ${containerBounds.width}px`);
      
      // Clear ad for next test
      await page.click('[data-testid="vanilla-ad-close"]');
      await page.waitForTimeout(200);
    }
  });

  test('should handle interstitial ads responsively', async ({ page }) => {
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);
      
      // Show interstitial
      await page.click('[data-testid="vanilla-show-interstitial"]');
      await page.waitForSelector('[data-testid="vanilla-interstitial-ad"]', { timeout: 5000 });
      
      // Check interstitial responsiveness
      const interstitialContainer = page.locator('[data-testid="interstitial-container"]');
      const interstitialAd = page.locator('[data-testid="vanilla-interstitial-ad"]');
      
      // Container should cover full viewport
      const containerBounds = await interstitialContainer.boundingBox();
      expect(containerBounds.width).toBe(viewport.width);
      expect(containerBounds.height).toBe(viewport.height);
      
      // Ad content should be appropriately sized
      const adBounds = await interstitialAd.boundingBox();
      expect(adBounds.width).toBeLessThanOrEqual(viewport.width * 0.9); // Max 90% of viewport
      expect(adBounds.height).toBeLessThanOrEqual(viewport.height * 0.9); // Max 90% of viewport
      
      // Close interstitial
      await page.click('[data-testid="vanilla-interstitial-close"]');
      await expect(interstitialContainer).not.toBeVisible();
      
      console.log(`${viewport.name}: Interstitial ${adBounds.width}x${adBounds.height}px`);
    }
  });

  test('should maintain usability on mobile devices', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Test touch targets are appropriately sized
    await page.click('[data-testid="vanilla-request-ad"]');
    await page.waitForSelector('[data-testid="vanilla-ad-content"]');
    
    const ctaButton = page.locator('[data-testid="vanilla-ad-cta"]');
    const ctaBounds = await ctaButton.boundingBox();
    
    // CTA button should be at least 44px (iOS) or 48px (Android) for touch
    expect(ctaBounds.height).toBeGreaterThanOrEqual(44);
    expect(ctaBounds.width).toBeGreaterThanOrEqual(44);
    
    // Test close button is appropriately sized
    const closeButton = page.locator('[data-testid="vanilla-ad-close"]');
    const closeBounds = await closeButton.boundingBox();
    
    expect(closeBounds.height).toBeGreaterThanOrEqual(44);
    expect(closeBounds.width).toBeGreaterThanOrEqual(44);
    
    // Test touch interaction
    await page.tap('[data-testid="vanilla-ad-cta"]');
    const clicks = await page.textContent('[data-testid="total-clicks"]');
    expect(parseInt(clicks)).toBeGreaterThan(0);
  });

  test('should handle orientation changes', async ({ page }) => {
    // Start in portrait
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.click('[data-testid="vanilla-request-ad"]');
    await page.waitForSelector('[data-testid="vanilla-ad-content"]');
    
    let adContainer = page.locator('[data-testid="vanilla-banner-ad"]');
    let portraitBounds = await adContainer.boundingBox();
    
    // Switch to landscape
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(500); // Allow for responsive adjustments
    
    let landscapeBounds = await adContainer.boundingBox();
    
    // Ad should adapt to new orientation
    expect(landscapeBounds.width).not.toBe(portraitBounds.width);
    expect(landscapeBounds.width).toBeLessThanOrEqual(667);
    
    // Ad should still be visible and functional
    await expect(adContainer).toBeVisible();
    await page.click('[data-testid="vanilla-ad-cta"]');
    
    const clicks = await page.textContent('[data-testid="total-clicks"]');
    expect(parseInt(clicks)).toBeGreaterThan(0);
  });

  test('should handle framework switching on different screen sizes', async ({ page }) => {
    const frameworks = ['vanilla', 'react', 'vue', 'angular'];
    const testViewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 768, height: 1024 },  // Tablet
      { width: 375, height: 667 }    // Mobile
    ];
    
    for (const viewport of testViewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      
      for (const framework of frameworks) {
        // Switch framework
        await page.click(`[data-testid="${framework}-tab"]`);
        await page.waitForSelector(`[data-testid="${framework}-chat"]`);
        
        // Test framework components are responsive
        const chatContainer = page.locator(`[data-testid="${framework}-chat"]`);
        const chatBounds = await chatContainer.boundingBox();
        
        expect(chatBounds.width).toBeLessThanOrEqual(viewport.width);
        expect(chatBounds.width).toBeGreaterThan(0);
        
        // Test ad containers are responsive
        const adContainer = page.locator(`[data-testid="${framework}-banner-ad"]`);
        const adBounds = await adContainer.boundingBox();
        
        expect(adBounds.width).toBeLessThanOrEqual(viewport.width);
        expect(adBounds.width).toBeGreaterThan(0);
        
        // Test functionality works
        await page.click(`[data-testid="${framework}-send-message"]`);
        await page.waitForSelector(`[data-testid="${framework}-chat"] .user-message`);
        
        await page.click(`[data-testid="${framework}-request-ad"]`);
        await page.waitForSelector(`[data-testid="${framework}-ad-content"]`, { timeout: 5000 });
      }
    }
  });

  test('should handle text scaling and accessibility', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    
    // Test with different text scaling levels
    const textScales = [1.0, 1.25, 1.5, 2.0];
    
    for (const scale of textScales) {
      // Simulate text scaling by adjusting font size
      await page.addStyleTag({
        content: `
          * {
            font-size: ${16 * scale}px !important;
          }
        `
      });
      
      await page.waitForTimeout(500);
      
      // Request an ad
      await page.click('[data-testid="vanilla-request-ad"]');
      await page.waitForSelector('[data-testid="vanilla-ad-content"]', { timeout: 5000 });
      
      // Verify ad is still readable and functional
      const adContent = page.locator('[data-testid="vanilla-ad-content"]');
      await expect(adContent).toBeVisible();
      
      const ctaButton = page.locator('[data-testid="vanilla-ad-cta"]');
      await expect(ctaButton).toBeVisible();
      
      // Test interaction still works
      await page.click('[data-testid="vanilla-ad-cta"]');
      
      // Clear ad for next test
      await page.click('[data-testid="vanilla-ad-close"]');
      await page.waitForTimeout(200);
      
      console.log(`Text scale ${scale}x: Ad remains functional`);
    }
  });

  test('should handle high DPI displays', async ({ page }) => {
    // Simulate high DPI display
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    
    // Request an ad
    await page.click('[data-testid="vanilla-request-ad"]');
    await page.waitForSelector('[data-testid="vanilla-ad-content"]', { timeout: 5000 });
    
    // Check if images and text render clearly
    const adContent = page.locator('[data-testid="vanilla-ad-content"]');
    await expect(adContent).toBeVisible();
    
    // Verify ad elements are properly sized
    const ctaButton = page.locator('[data-testid="vanilla-ad-cta"]');
    const ctaBounds = await ctaButton.boundingBox();
    
    expect(ctaBounds.width).toBeGreaterThan(0);
    expect(ctaBounds.height).toBeGreaterThan(0);
    
    // Test interaction works on high DPI
    await page.click('[data-testid="vanilla-ad-cta"]');
    const clicks = await page.textContent('[data-testid="total-clicks"]');
    expect(parseInt(clicks)).toBeGreaterThan(0);
  });

  test('should handle reduced motion preferences', async ({ page }) => {
    // Test with reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await page.click('[data-testid="vanilla-show-interstitial"]');
    await page.waitForSelector('[data-testid="vanilla-interstitial-ad"]', { timeout: 5000 });
    
    // Interstitial should appear without animations when reduced motion is preferred
    const interstitial = page.locator('[data-testid="vanilla-interstitial-ad"]');
    await expect(interstitial).toBeVisible();
    
    // Close interstitial
    await page.click('[data-testid="vanilla-interstitial-close"]');
    await expect(page.locator('[data-testid="interstitial-container"]')).not.toBeVisible();
    
    // Test with normal motion preference
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    
    await page.click('[data-testid="vanilla-show-interstitial"]');
    await page.waitForSelector('[data-testid="vanilla-interstitial-ad"]', { timeout: 5000 });
    
    await expect(interstitial).toBeVisible();
    await page.click('[data-testid="vanilla-interstitial-close"]');
  });
});