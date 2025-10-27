import { test, expect, devices } from '@playwright/test';

test.describe('Cross-Browser Compatibility', () => {
  // Test across different browsers configured in playwright.config.ts
  
  test('should work correctly in Chromium', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'This test is for Chromium only');
    
    await page.goto('/');
    await page.waitForFunction(() => window.testApp?.sdk !== null, { timeout: 10000 });
    
    // Test basic functionality
    await page.click('[data-testid="vanilla-send-message"]');
    await page.waitForSelector('.user-message');
    
    await page.click('[data-testid="vanilla-request-ad"]');
    await page.waitForSelector('[data-testid="vanilla-ad-content"]', { timeout: 5000 });
    
    // Verify ad interaction
    await page.click('[data-testid="vanilla-ad-cta"]');
    const clicks = await page.textContent('[data-testid="total-clicks"]');
    expect(parseInt(clicks)).toBeGreaterThan(0);
  });

  test('should work correctly in Firefox', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'This test is for Firefox only');
    
    await page.goto('/');
    await page.waitForFunction(() => window.testApp?.sdk !== null, { timeout: 10000 });
    
    // Test basic functionality
    await page.click('[data-testid="vanilla-send-message"]');
    await page.waitForSelector('.user-message');
    
    await page.click('[data-testid="vanilla-request-ad"]');
    await page.waitForSelector('[data-testid="vanilla-ad-content"]', { timeout: 5000 });
    
    // Verify ad interaction
    await page.click('[data-testid="vanilla-ad-cta"]');
    const clicks = await page.textContent('[data-testid="total-clicks"]');
    expect(parseInt(clicks)).toBeGreaterThan(0);
  });

  test('should work correctly in WebKit/Safari', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'This test is for WebKit only');
    
    await page.goto('/');
    await page.waitForFunction(() => window.testApp?.sdk !== null, { timeout: 10000 });
    
    // Test basic functionality
    await page.click('[data-testid="vanilla-send-message"]');
    await page.waitForSelector('.user-message');
    
    await page.click('[data-testid="vanilla-request-ad"]');
    await page.waitForSelector('[data-testid="vanilla-ad-content"]', { timeout: 5000 });
    
    // Verify ad interaction
    await page.click('[data-testid="vanilla-ad-cta"]');
    const clicks = await page.textContent('[data-testid="total-clicks"]');
    expect(parseInt(clicks)).toBeGreaterThan(0);
  });

  test('should handle browser-specific features correctly', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForFunction(() => window.testApp?.sdk !== null, { timeout: 10000 });
    
    // Test localStorage support
    await page.evaluate(() => {
      localStorage.setItem('ai-yuugen-test', 'browser-compatibility');
    });
    
    const storedValue = await page.evaluate(() => {
      return localStorage.getItem('ai-yuugen-test');
    });
    expect(storedValue).toBe('browser-compatibility');
    
    // Test sessionStorage support
    await page.evaluate(() => {
      sessionStorage.setItem('ai-yuugen-session', 'session-test');
    });
    
    const sessionValue = await page.evaluate(() => {
      return sessionStorage.getItem('ai-yuugen-session');
    });
    expect(sessionValue).toBe('session-test');
    
    // Test modern JavaScript features
    const modernJSSupport = await page.evaluate(() => {
      try {
        // Test async/await
        const asyncTest = async () => 'async-works';
        
        // Test arrow functions
        const arrowTest = () => 'arrow-works';
        
        // Test destructuring
        const { testProp } = { testProp: 'destructuring-works' };
        
        // Test template literals
        const templateTest = `template-${testProp}`;
        
        return {
          async: typeof asyncTest === 'function',
          arrow: arrowTest() === 'arrow-works',
          destructuring: testProp === 'destructuring-works',
          template: templateTest === 'template-destructuring-works'
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    expect(modernJSSupport.async).toBe(true);
    expect(modernJSSupport.arrow).toBe(true);
    expect(modernJSSupport.destructuring).toBe(true);
    expect(modernJSSupport.template).toBe(true);
  });

  test('should handle different viewport sizes correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => window.testApp?.sdk !== null, { timeout: 10000 });
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.click('[data-testid="vanilla-request-ad"]');
    await page.waitForSelector('[data-testid="vanilla-ad-content"]');
    
    let adContainer = page.locator('[data-testid="vanilla-banner-ad"]');
    let adBounds = await adContainer.boundingBox();
    expect(adBounds.width).toBeGreaterThan(0);
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500); // Allow for responsive adjustments
    
    adBounds = await adContainer.boundingBox();
    expect(adBounds.width).toBeGreaterThan(0);
    expect(adBounds.width).toBeLessThanOrEqual(768);
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500); // Allow for responsive adjustments
    
    adBounds = await adContainer.boundingBox();
    expect(adBounds.width).toBeGreaterThan(0);
    expect(adBounds.width).toBeLessThanOrEqual(375);
  });

  test('should handle touch interactions on mobile devices', async ({ page, browserName }) => {
    // Skip on desktop browsers
    test.skip(!browserName.includes('Mobile'), 'This test is for mobile browsers only');
    
    await page.goto('/');
    await page.waitForFunction(() => window.testApp?.sdk !== null, { timeout: 10000 });
    
    // Request an ad
    await page.tap('[data-testid="vanilla-request-ad"]');
    await page.waitForSelector('[data-testid="vanilla-ad-content"]');
    
    // Test touch interaction with ad
    await page.tap('[data-testid="vanilla-ad-cta"]');
    
    const clicks = await page.textContent('[data-testid="total-clicks"]');
    expect(parseInt(clicks)).toBeGreaterThan(0);
    
    // Test interstitial touch interaction
    await page.tap('[data-testid="vanilla-show-interstitial"]');
    await page.waitForSelector('[data-testid="vanilla-interstitial-ad"]');
    
    // Test touch close
    await page.tap('[data-testid="vanilla-interstitial-close"]');
    await expect(page.locator('[data-testid="interstitial-container"]')).not.toBeVisible();
  });

  test('should maintain performance across browsers', async ({ page, browserName }) => {
    await page.goto('/');
    
    const startTime = Date.now();
    await page.waitForFunction(() => window.testApp?.sdk !== null, { timeout: 10000 });
    const initTime = Date.now() - startTime;
    
    // SDK should initialize within reasonable time on all browsers
    expect(initTime).toBeLessThan(8000);
    
    // Test ad request performance
    const adStartTime = Date.now();
    await page.click('[data-testid="vanilla-request-ad"]');
    await page.waitForSelector('[data-testid="vanilla-ad-content"]');
    const adTime = Date.now() - adStartTime;
    
    // Ad requests should complete within reasonable time
    expect(adTime).toBeLessThan(5000);
    
    console.log(`${browserName} performance - Init: ${initTime}ms, Ad Request: ${adTime}ms`);
  });

  test('should handle browser-specific privacy settings', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForFunction(() => window.testApp?.sdk !== null, { timeout: 10000 });
    
    // Test privacy controls work in all browsers
    await page.click('[data-testid="opt-out-all"]');
    await page.waitForSelector('[data-testid="notification-success"]');
    
    // Verify consent checkboxes are unchecked
    const advertisingConsent = await page.isChecked('[data-testid="advertising-consent"]');
    const analyticsConsent = await page.isChecked('[data-testid="analytics-consent"]');
    const dataSharingConsent = await page.isChecked('[data-testid="data-sharing-consent"]');
    
    expect(advertisingConsent).toBe(false);
    expect(analyticsConsent).toBe(false);
    expect(dataSharingConsent).toBe(false);
    
    // Test updating consent
    await page.check('[data-testid="advertising-consent"]');
    await page.click('[data-testid="update-consent"]');
    await page.waitForSelector('[data-testid="notification-success"]');
    
    // Verify consent was updated
    const updatedConsent = await page.isChecked('[data-testid="advertising-consent"]');
    expect(updatedConsent).toBe(true);
  });

  test('should handle different network conditions', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => window.testApp?.sdk !== null, { timeout: 10000 });
    
    // Simulate slow network
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 100); // Add 100ms delay
    });
    
    const slowStartTime = Date.now();
    await page.click('[data-testid="vanilla-request-ad"]');
    await page.waitForSelector('[data-testid="vanilla-ad-content"]', { timeout: 10000 });
    const slowTime = Date.now() - slowStartTime;
    
    // Should still work but take longer
    expect(slowTime).toBeGreaterThan(100);
    expect(slowTime).toBeLessThan(8000);
    
    // Reset network conditions
    await page.unroute('**/*');
    
    // Test normal network
    const normalStartTime = Date.now();
    await page.click('[data-testid="vanilla-request-ad"]');
    await page.waitForSelector('[data-testid="vanilla-ad-content"]');
    const normalTime = Date.now() - normalStartTime;
    
    expect(normalTime).toBeLessThan(5000);
  });
});