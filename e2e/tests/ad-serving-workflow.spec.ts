import { test, expect } from '@playwright/test';

test.describe('Complete Ad Serving Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="vanilla-chat"]');
    
    // Wait for SDK to initialize
    await page.waitForFunction(() => window.testApp?.sdk !== null, { timeout: 10000 });
  });

  test('should complete full ad serving workflow for banner ads', async ({ page }) => {
    // Step 1: Send a message to establish context
    await page.click('[data-testid="vanilla-send-message"]');
    await page.waitForSelector('.user-message');
    await page.waitForSelector('.ai-message:nth-child(2)');

    // Step 2: Request a banner ad
    await page.click('[data-testid="vanilla-request-ad"]');
    
    // Step 3: Verify ad is displayed
    await page.waitForSelector('[data-testid="vanilla-ad-content"]', { timeout: 5000 });
    
    const adContent = page.locator('[data-testid="vanilla-ad-content"]');
    await expect(adContent).toBeVisible();
    
    // Verify ad has required elements
    await expect(adContent.locator('h4')).toBeVisible(); // Title
    await expect(adContent.locator('p')).toBeVisible(); // Description
    await expect(adContent.locator('[data-testid="vanilla-ad-cta"]')).toBeVisible(); // CTA button
    
    // Step 4: Test ad interaction
    await page.click('[data-testid="vanilla-ad-cta"]');
    
    // Step 5: Verify metrics are updated
    const impressions = await page.textContent('[data-testid="total-impressions"]');
    const clicks = await page.textContent('[data-testid="total-clicks"]');
    
    expect(parseInt(impressions)).toBeGreaterThan(0);
    expect(parseInt(clicks)).toBeGreaterThan(0);
    
    // Step 6: Verify CTR calculation
    const ctr = await page.textContent('[data-testid="ctr"]');
    expect(ctr).not.toBe('0%');
  });

  test('should complete full ad serving workflow for interstitial ads', async ({ page }) => {
    // Step 1: Establish context
    await page.click('[data-testid="vanilla-send-message"]');
    await page.waitForSelector('.ai-message:nth-child(2)');

    // Step 2: Request interstitial ad
    await page.click('[data-testid="vanilla-show-interstitial"]');
    
    // Step 3: Verify interstitial is displayed
    await page.waitForSelector('[data-testid="vanilla-interstitial-ad"]', { timeout: 5000 });
    
    const interstitial = page.locator('[data-testid="vanilla-interstitial-ad"]');
    await expect(interstitial).toBeVisible();
    
    // Verify interstitial overlay
    const container = page.locator('[data-testid="interstitial-container"]');
    await expect(container).toBeVisible();
    
    // Step 4: Test interstitial interaction
    await page.click('[data-testid="vanilla-interstitial-cta"]');
    
    // Step 5: Verify interstitial closes after interaction
    await expect(container).not.toBeVisible();
    
    // Step 6: Verify metrics
    const impressions = await page.textContent('[data-testid="total-impressions"]');
    const clicks = await page.textContent('[data-testid="total-clicks"]');
    
    expect(parseInt(impressions)).toBeGreaterThan(0);
    expect(parseInt(clicks)).toBeGreaterThan(0);
  });

  test('should handle ad serving failures gracefully', async ({ page }) => {
    // Simulate network error
    await page.evaluate(() => {
      window.testUtils.simulateError('network');
    });
    
    // Verify error notification appears
    await page.waitForSelector('[data-testid="notification-error"]');
    const errorNotification = page.locator('[data-testid="notification-error"]');
    await expect(errorNotification).toBeVisible();
    await expect(errorNotification).toContainText('Network error simulated');
  });

  test('should track performance metrics accurately', async ({ page }) => {
    // Check initial SDK load time
    const sdkLoadTime = await page.textContent('[data-testid="sdk-load-time"]');
    expect(parseInt(sdkLoadTime)).toBeGreaterThan(0);
    
    // Request an ad and check request time
    await page.click('[data-testid="vanilla-request-ad"]');
    await page.waitForSelector('[data-testid="vanilla-ad-content"]');
    
    const adRequestTime = await page.textContent('[data-testid="ad-request-time"]');
    expect(parseInt(adRequestTime)).toBeGreaterThan(0);
    
    // Verify performance is within acceptable limits
    expect(parseInt(sdkLoadTime)).toBeLessThan(5000); // SDK should load in under 5 seconds
    expect(parseInt(adRequestTime)).toBeLessThan(2000); // Ad requests should complete in under 2 seconds
  });

  test('should handle multiple ad requests efficiently', async ({ page }) => {
    const requestCount = 5;
    const startTime = Date.now();
    
    // Make multiple ad requests
    for (let i = 0; i < requestCount; i++) {
      await page.click('[data-testid="vanilla-request-ad"]');
      await page.waitForTimeout(100); // Small delay between requests
    }
    
    // Wait for all ads to load
    await page.waitForSelector('[data-testid="vanilla-ad-content"]');
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Verify reasonable performance for multiple requests
    expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
    
    // Verify impressions are tracked correctly
    const impressions = await page.textContent('[data-testid="total-impressions"]');
    expect(parseInt(impressions)).toBeGreaterThanOrEqual(1);
  });

  test('should maintain ad quality and brand safety', async ({ page }) => {
    await page.click('[data-testid="vanilla-request-ad"]');
    await page.waitForSelector('[data-testid="vanilla-ad-content"]');
    
    const adContent = page.locator('[data-testid="vanilla-ad-content"]');
    
    // Verify ad has proper labeling
    await expect(adContent.locator('.ad-label')).toContainText('Advertisement');
    
    // Verify ad has close button for user control
    await expect(adContent.locator('[data-testid="vanilla-ad-close"]')).toBeVisible();
    
    // Test ad close functionality
    await page.click('[data-testid="vanilla-ad-close"]');
    await expect(adContent.locator('h4')).not.toBeVisible();
  });
});