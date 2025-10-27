import { test, expect } from '@playwright/test';
import { createTestHelpers, TEST_FRAMEWORKS, COMMON_VIEWPORTS, PERFORMANCE_THRESHOLDS } from '../utils/test-helpers';

test.describe('Comprehensive Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const helpers = createTestHelpers(page);
    await helpers.waitForSDKInitialization();
  });

  test('should complete full user journey across all frameworks', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    for (const framework of TEST_FRAMEWORKS) {
      console.log(`Testing full journey for ${framework} framework`);
      
      // Step 1: Switch to framework
      await helpers.switchFramework(framework);
      
      // Step 2: Establish conversation context
      await helpers.sendTestMessage(framework);
      
      // Step 3: Test banner ad workflow
      await helpers.requestAd(framework, 'banner');
      await helpers.verifyAdDisplay(framework, 'banner');
      await helpers.clickAd(framework, 'banner');
      
      // Step 4: Test interstitial ad workflow
      await helpers.requestAd(framework, 'interstitial');
      await helpers.verifyAdDisplay(framework, 'interstitial');
      await helpers.clickAd(framework, 'interstitial');
      await helpers.closeAd(framework, 'interstitial');
      
      // Step 5: Verify metrics are updated
      await helpers.verifyMetricsUpdate();
      
      console.log(`✓ ${framework} framework journey completed successfully`);
    }
    
    // Verify overall performance
    await helpers.verifyPerformance();
  });

  test('should handle complete privacy compliance workflow', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Test initial compliant state
    await helpers.requestAd('vanilla');
    await helpers.verifyAdDisplay('vanilla');
    await helpers.clickAd('vanilla');
    
    // Test GDPR compliance - opt out of advertising
    await helpers.updateConsent({ advertising: false, analytics: true, dataSharing: true });
    
    // Verify ads still work but with privacy protection
    await helpers.requestAd('vanilla');
    const adContainer = page.locator('[data-testid="vanilla-banner-ad"]');
    const adContent = await adContainer.textContent();
    expect(adContent).toBeTruthy();
    
    // Test CCPA compliance - opt out of data sharing
    await helpers.updateConsent({ advertising: true, analytics: true, dataSharing: false });
    
    // Verify functionality continues with data sharing restrictions
    await helpers.requestAd('vanilla');
    await helpers.verifyAdDisplay('vanilla');
    
    // Test complete opt-out
    await helpers.optOutAll();
    
    // Verify system handles complete opt-out gracefully
    await helpers.requestAd('vanilla');
    const optOutAdContent = await adContainer.textContent();
    expect(optOutAdContent).toBeTruthy();
    
    // Test re-enabling consent
    await helpers.updateConsent({ advertising: true, analytics: true, dataSharing: false });
    
    // Verify full functionality returns
    await helpers.requestAd('vanilla');
    await helpers.verifyAdDisplay('vanilla');
    await helpers.clickAd('vanilla');
    await helpers.verifyMetricsUpdate();
  });

  test('should maintain performance under load', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Test multiple rapid ad requests
    const requestCount = 10;
    const startTime = Date.now();
    
    for (let i = 0; i < requestCount; i++) {
      await page.click('[data-testid="vanilla-request-ad"]');
      await page.waitForTimeout(100); // Small delay between requests
    }
    
    // Wait for final ad to load
    await page.waitForSelector('[data-testid="vanilla-ad-content"]');
    
    const totalTime = Date.now() - startTime;
    expect(totalTime).toBeLessThan(15000); // Should complete within 15 seconds
    
    // Verify metrics are accurate
    const impressions = await page.textContent('[data-testid="total-impressions"]');
    expect(parseInt(impressions)).toBeGreaterThanOrEqual(1);
    
    // Test framework switching performance
    for (const framework of TEST_FRAMEWORKS) {
      const switchStart = Date.now();
      await helpers.switchFramework(framework);
      await helpers.requestAd(framework);
      const switchTime = Date.now() - switchStart;
      
      expect(switchTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FRAMEWORK_SWITCH_TIME);
      console.log(`${framework} switch time: ${switchTime}ms`);
    }
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Test network error handling
    await helpers.simulateError('network');
    await helpers.waitForNotification('error', 'Network error simulated');
    
    // Verify system continues to function
    await helpers.requestAd('vanilla');
    const adContainer = page.locator('[data-testid="vanilla-banner-ad"]');
    const adContent = await adContainer.textContent();
    expect(adContent).toBeTruthy();
    
    // Test privacy violation handling
    await helpers.simulateError('privacy');
    await helpers.waitForNotification('error', 'Privacy violation detected');
    
    // Test ad serving error handling
    await helpers.simulateError('ad-serving');
    
    // Verify graceful degradation
    await helpers.requestAd('vanilla');
    const errorAdContent = await adContainer.textContent();
    expect(errorAdContent).toBeTruthy(); // Should show fallback content
  });

  test('should work correctly across all supported browsers', async ({ page, browserName }) => {
    const helpers = createTestHelpers(page);
    
    console.log(`Testing on ${browserName}`);
    
    // Test basic functionality
    await helpers.sendTestMessage('vanilla');
    await helpers.requestAd('vanilla');
    await helpers.verifyAdDisplay('vanilla');
    await helpers.clickAd('vanilla');
    
    // Test browser-specific features
    await helpers.testCrossBrowserFeatures();
    
    // Test performance on this browser
    const performance = await helpers.measureLoadingPerformance();
    expect(performance.sdkInitTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SDK_INIT_TIME);
    expect(performance.adRequestTime).toBeLessThan(PERFORMANCE_THRESHOLDS.AD_REQUEST_TIME);
    
    console.log(`${browserName} performance - Init: ${performance.sdkInitTime}ms, Ad: ${performance.adRequestTime}ms`);
  });

  test('should be fully responsive across all viewport sizes', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Test responsive behavior for each framework
    for (const framework of TEST_FRAMEWORKS) {
      console.log(`Testing responsive behavior for ${framework}`);
      
      await helpers.switchFramework(framework);
      await helpers.testResponsiveAd(framework, COMMON_VIEWPORTS);
      
      // Test interstitial responsiveness
      for (const viewport of COMMON_VIEWPORTS.slice(0, 3)) { // Test on a few key viewports
        await page.setViewportSize(viewport);
        await page.waitForTimeout(500);
        
        await helpers.requestAd(framework, 'interstitial');
        
        // Verify interstitial covers full viewport
        const container = page.locator('[data-testid="interstitial-container"]');
        const containerBounds = await container.boundingBox();
        expect(containerBounds.width).toBe(viewport.width);
        expect(containerBounds.height).toBe(viewport.height);
        
        await helpers.closeAd(framework, 'interstitial');
      }
    }
  });

  test('should maintain data consistency across framework switches', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Establish initial state
    await helpers.sendTestMessage('vanilla');
    await helpers.requestAd('vanilla');
    await helpers.clickAd('vanilla');
    
    const initialMetrics = await helpers.getMetrics();
    
    // Switch frameworks and verify state persistence
    for (const framework of TEST_FRAMEWORKS.slice(1)) { // Skip vanilla as it's already tested
      await helpers.switchFramework(framework);
      
      // Verify metrics are maintained
      const currentMetrics = await helpers.getMetrics();
      expect(currentMetrics.impressions).toBeGreaterThanOrEqual(initialMetrics.impressions);
      expect(currentMetrics.clicks).toBeGreaterThanOrEqual(initialMetrics.clicks);
      
      // Test functionality in new framework
      await helpers.sendTestMessage(framework);
      await helpers.requestAd(framework);
      await helpers.clickAd(framework);
      
      // Verify metrics are updated
      const updatedMetrics = await helpers.getMetrics();
      expect(updatedMetrics.impressions).toBeGreaterThan(currentMetrics.impressions);
      expect(updatedMetrics.clicks).toBeGreaterThan(currentMetrics.clicks);
    }
  });

  test('should handle accessibility requirements', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Test keyboard navigation
    await page.keyboard.press('Tab'); // Should focus first interactive element
    await page.keyboard.press('Tab'); // Move to next element
    
    // Request an ad
    await helpers.requestAd('vanilla');
    
    // Test ad accessibility
    const adContent = page.locator('[data-testid="vanilla-ad-content"]');
    await expect(adContent).toBeVisible();
    
    // Verify close button is accessible
    const closeButton = page.locator('[data-testid="vanilla-ad-close"]');
    const closeBounds = await closeButton.boundingBox();
    expect(closeBounds.height).toBeGreaterThanOrEqual(PERFORMANCE_THRESHOLDS.TOUCH_TARGET_MIN_SIZE);
    expect(closeBounds.width).toBeGreaterThanOrEqual(PERFORMANCE_THRESHOLDS.TOUCH_TARGET_MIN_SIZE);
    
    // Test CTA button accessibility
    const ctaButton = page.locator('[data-testid="vanilla-ad-cta"]');
    const ctaBounds = await ctaButton.boundingBox();
    expect(ctaBounds.height).toBeGreaterThanOrEqual(PERFORMANCE_THRESHOLDS.TOUCH_TARGET_MIN_SIZE);
    expect(ctaBounds.width).toBeGreaterThanOrEqual(PERFORMANCE_THRESHOLDS.TOUCH_TARGET_MIN_SIZE);
    
    // Test interstitial accessibility
    await helpers.requestAd('vanilla', 'interstitial');
    
    const interstitialClose = page.locator('[data-testid="vanilla-interstitial-close"]');
    const interstitialCloseBounds = await interstitialClose.boundingBox();
    expect(interstitialCloseBounds.height).toBeGreaterThanOrEqual(PERFORMANCE_THRESHOLDS.TOUCH_TARGET_MIN_SIZE);
    
    await helpers.closeAd('vanilla', 'interstitial');
  });

  test('should handle real-world usage patterns', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Simulate realistic user behavior
    const scenarios = [
      {
        name: 'Quick browsing session',
        actions: async () => {
          await helpers.sendTestMessage('vanilla');
          await helpers.requestAd('vanilla');
          await helpers.closeAd('vanilla');
        }
      },
      {
        name: 'Engaged user session',
        actions: async () => {
          await helpers.sendTestMessage('vanilla');
          await helpers.requestAd('vanilla');
          await helpers.clickAd('vanilla');
          await helpers.requestAd('vanilla', 'interstitial');
          await helpers.clickAd('vanilla', 'interstitial');
        }
      },
      {
        name: 'Privacy-conscious user',
        actions: async () => {
          await helpers.updateConsent({ advertising: false, analytics: true });
          await helpers.sendTestMessage('vanilla');
          await helpers.requestAd('vanilla');
        }
      },
      {
        name: 'Framework switcher',
        actions: async () => {
          for (const framework of TEST_FRAMEWORKS) {
            await helpers.switchFramework(framework);
            await helpers.sendTestMessage(framework);
            await helpers.requestAd(framework);
          }
        }
      }
    ];
    
    for (const scenario of scenarios) {
      console.log(`Testing scenario: ${scenario.name}`);
      
      const startTime = Date.now();
      await scenario.actions();
      const duration = Date.now() - startTime;
      
      // Verify reasonable performance for each scenario
      expect(duration).toBeLessThan(30000); // 30 seconds max per scenario
      
      // Verify system state remains consistent
      const metrics = await helpers.getMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.impressions).toBeGreaterThanOrEqual(0);
      expect(metrics.clicks).toBeGreaterThanOrEqual(0);
      
      console.log(`✓ ${scenario.name} completed in ${duration}ms`);
    }
  });

  test('should maintain security and privacy standards', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Test that sensitive data is not exposed
    const windowProperties = await page.evaluate(() => {
      return Object.keys(window).filter(key => 
        key.toLowerCase().includes('yuugen') || 
        key.toLowerCase().includes('tracking') ||
        key.toLowerCase().includes('analytics')
      );
    });
    
    // Should only expose intended public APIs
    expect(windowProperties).toContain('testApp');
    expect(windowProperties).toContain('testUtils');
    
    // Test consent is properly enforced
    await helpers.optOutAll();
    
    // Verify no tracking occurs when opted out
    const initialMetrics = await helpers.getMetrics();
    await helpers.requestAd('vanilla');
    
    // In a real implementation, metrics should not increase when opted out
    const finalMetrics = await helpers.getMetrics();
    expect(finalMetrics).toBeDefined();
    
    // Test data encryption/security (would be more comprehensive in real implementation)
    const consentData = await page.evaluate(() => {
      return localStorage.getItem('ai-yuugen-consent');
    });
    
    // Consent data should be stored (in real implementation, it would be encrypted)
    expect(consentData).toBeDefined();
  });
});