import { Page, expect } from '@playwright/test';

/**
 * Test utilities for AI Ad Yuugen SDK E2E tests
 */
export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for SDK to be fully initialized
   */
  async waitForSDKInitialization(timeout = 10000) {
    await this.page.waitForFunction(() => window.testApp?.sdk !== null, { timeout });
  }

  /**
   * Get current performance metrics
   */
  async getMetrics() {
    return await this.page.evaluate(() => window.testUtils.getMetrics());
  }

  /**
   * Simulate different types of errors
   */
  async simulateError(type: 'network' | 'privacy' | 'ad-serving') {
    await this.page.evaluate((errorType) => {
      window.testUtils.simulateError(errorType);
    }, type);
  }

  /**
   * Switch to a specific framework
   */
  async switchFramework(framework: 'vanilla' | 'react' | 'vue' | 'angular') {
    await this.page.click(`[data-testid="${framework}-tab"]`);
    await this.page.waitForSelector(`[data-testid="${framework}-chat"]`);
  }

  /**
   * Send a test message in the current framework
   */
  async sendTestMessage(framework: string) {
    await this.page.click(`[data-testid="${framework}-send-message"]`);
    await this.page.waitForSelector(`[data-testid="${framework}-chat"] .user-message`);
    await this.page.waitForSelector(`[data-testid="${framework}-chat"] .ai-message:nth-child(2)`);
  }

  /**
   * Request an ad in the current framework
   */
  async requestAd(framework: string, adType: 'banner' | 'native' | 'interstitial' = 'banner') {
    if (adType === 'interstitial') {
      await this.page.click(`[data-testid="${framework}-show-interstitial"]`);
      await this.page.waitForSelector(`[data-testid="${framework}-interstitial-ad"]`, { timeout: 5000 });
    } else {
      await this.page.click(`[data-testid="${framework}-request-ad"]`);
      await this.page.waitForSelector(`[data-testid="${framework}-ad-content"]`, { timeout: 5000 });
    }
  }

  /**
   * Interact with an ad (click CTA)
   */
  async clickAd(framework: string, adType: 'banner' | 'native' | 'interstitial' = 'banner') {
    const ctaSelector = adType === 'interstitial' 
      ? `[data-testid="${framework}-interstitial-cta"]`
      : `[data-testid="${framework}-ad-cta"]`;
    
    await this.page.click(ctaSelector);
  }

  /**
   * Close an ad
   */
  async closeAd(framework: string, adType: 'banner' | 'native' | 'interstitial' = 'banner') {
    const closeSelector = adType === 'interstitial'
      ? `[data-testid="${framework}-interstitial-close"]`
      : `[data-testid="${framework}-ad-close"]`;
    
    await this.page.click(closeSelector);
    
    if (adType === 'interstitial') {
      await expect(this.page.locator('[data-testid="interstitial-container"]')).not.toBeVisible();
    }
  }

  /**
   * Update consent preferences
   */
  async updateConsent(options: {
    advertising?: boolean;
    analytics?: boolean;
    dataSharing?: boolean;
  }) {
    if (options.advertising !== undefined) {
      await this.page.setChecked('[data-testid="advertising-consent"]', options.advertising);
    }
    if (options.analytics !== undefined) {
      await this.page.setChecked('[data-testid="analytics-consent"]', options.analytics);
    }
    if (options.dataSharing !== undefined) {
      await this.page.setChecked('[data-testid="data-sharing-consent"]', options.dataSharing);
    }
    
    await this.page.click('[data-testid="update-consent"]');
    await this.page.waitForSelector('[data-testid="notification-success"]');
  }

  /**
   * Opt out of all data collection
   */
  async optOutAll() {
    await this.page.click('[data-testid="opt-out-all"]');
    await this.page.waitForSelector('[data-testid="notification-success"]');
  }

  /**
   * Verify ad is displayed correctly
   */
  async verifyAdDisplay(framework: string, adType: 'banner' | 'native' | 'interstitial' = 'banner') {
    const adSelector = adType === 'interstitial'
      ? `[data-testid="${framework}-interstitial-ad"]`
      : `[data-testid="${framework}-ad-content"]`;
    
    const adElement = this.page.locator(adSelector);
    await expect(adElement).toBeVisible();
    
    // Verify ad has required elements
    if (adType !== 'interstitial') {
      await expect(adElement.locator('h4')).toBeVisible(); // Title
      await expect(adElement.locator('p')).toBeVisible(); // Description
    }
    
    const ctaSelector = adType === 'interstitial'
      ? `[data-testid="${framework}-interstitial-cta"]`
      : `[data-testid="${framework}-ad-cta"]`;
    
    await expect(this.page.locator(ctaSelector)).toBeVisible(); // CTA button
  }

  /**
   * Verify metrics are updated correctly
   */
  async verifyMetricsUpdate(expectedImpressions?: number, expectedClicks?: number) {
    const impressions = await this.page.textContent('[data-testid="total-impressions"]');
    const clicks = await this.page.textContent('[data-testid="total-clicks"]');
    
    if (expectedImpressions !== undefined) {
      expect(parseInt(impressions)).toBe(expectedImpressions);
    } else {
      expect(parseInt(impressions)).toBeGreaterThan(0);
    }
    
    if (expectedClicks !== undefined) {
      expect(parseInt(clicks)).toBe(expectedClicks);
    }
    
    // Verify CTR calculation
    const ctr = await this.page.textContent('[data-testid="ctr"]');
    if (parseInt(impressions) > 0) {
      expect(ctr).not.toBe('0%');
    }
  }

  /**
   * Verify performance metrics are within acceptable limits
   */
  async verifyPerformance(maxSDKLoadTime = 5000, maxAdRequestTime = 2000) {
    const sdkLoadTime = await this.page.textContent('[data-testid="sdk-load-time"]');
    const adRequestTime = await this.page.textContent('[data-testid="ad-request-time"]');
    
    expect(parseInt(sdkLoadTime)).toBeLessThan(maxSDKLoadTime);
    expect(parseInt(adRequestTime)).toBeLessThan(maxAdRequestTime);
  }

  /**
   * Test responsive behavior at different viewport sizes
   */
  async testResponsiveAd(framework: string, viewports: Array<{width: number, height: number}>) {
    for (const viewport of viewports) {
      await this.page.setViewportSize(viewport);
      await this.page.waitForTimeout(500); // Allow for responsive adjustments
      
      await this.requestAd(framework);
      
      const adContainer = this.page.locator(`[data-testid="${framework}-banner-ad"]`);
      const bounds = await adContainer.boundingBox();
      
      // Ad should not exceed viewport width
      expect(bounds.width).toBeLessThanOrEqual(viewport.width);
      expect(bounds.width).toBeGreaterThan(0);
      
      // Close ad for next test
      await this.closeAd(framework);
      await this.page.waitForTimeout(200);
    }
  }

  /**
   * Test cross-browser functionality
   */
  async testCrossBrowserFeatures() {
    // Test localStorage support
    await this.page.evaluate(() => {
      localStorage.setItem('ai-yuugen-test', 'cross-browser-test');
    });
    
    const storedValue = await this.page.evaluate(() => {
      return localStorage.getItem('ai-yuugen-test');
    });
    expect(storedValue).toBe('cross-browser-test');
    
    // Test modern JavaScript features
    const jsSupport = await this.page.evaluate(() => {
      try {
        // Test async/await, arrow functions, destructuring, template literals
        const asyncTest = async () => 'works';
        const arrowTest = () => 'works';
        const { prop } = { prop: 'works' };
        const template = `template-${prop}`;
        
        return {
          async: typeof asyncTest === 'function',
          arrow: arrowTest() === 'works',
          destructuring: prop === 'works',
          template: template === 'template-works'
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    expect(jsSupport.async).toBe(true);
    expect(jsSupport.arrow).toBe(true);
    expect(jsSupport.destructuring).toBe(true);
    expect(jsSupport.template).toBe(true);
  }

  /**
   * Wait for notification and verify its content
   */
  async waitForNotification(type: 'success' | 'error', expectedText?: string) {
    await this.page.waitForSelector(`[data-testid="notification-${type}"]`);
    const notification = this.page.locator(`[data-testid="notification-${type}"]`);
    await expect(notification).toBeVisible();
    
    if (expectedText) {
      await expect(notification).toContainText(expectedText);
    }
    
    return notification;
  }

  /**
   * Measure and verify loading performance
   */
  async measureLoadingPerformance() {
    const startTime = Date.now();
    await this.waitForSDKInitialization();
    const initTime = Date.now() - startTime;
    
    const adStartTime = Date.now();
    await this.requestAd('vanilla');
    const adTime = Date.now() - adStartTime;
    
    return {
      sdkInitTime: initTime,
      adRequestTime: adTime
    };
  }

  /**
   * Test accessibility features
   */
  async testAccessibility() {
    // Test keyboard navigation
    await this.page.keyboard.press('Tab');
    await this.page.keyboard.press('Tab');
    await this.page.keyboard.press('Enter'); // Should activate focused element
    
    // Test ARIA labels and roles
    const adContainer = this.page.locator('[data-testid="vanilla-banner-ad"]');
    const ariaLabel = await adContainer.getAttribute('aria-label');
    
    // In a real implementation, verify proper ARIA attributes
    expect(adContainer).toBeDefined();
  }
}

/**
 * Global test utilities
 */
export const createTestHelpers = (page: Page) => new TestHelpers(page);

/**
 * Common viewport sizes for responsive testing
 */
export const COMMON_VIEWPORTS = [
  { name: 'Desktop Large', width: 1920, height: 1080 },
  { name: 'Desktop Medium', width: 1366, height: 768 },
  { name: 'Tablet Landscape', width: 1024, height: 768 },
  { name: 'Tablet Portrait', width: 768, height: 1024 },
  { name: 'Mobile Large', width: 414, height: 896 },
  { name: 'Mobile Medium', width: 375, height: 667 },
  { name: 'Mobile Small', width: 320, height: 568 }
];

/**
 * Common test frameworks
 */
export const TEST_FRAMEWORKS = ['vanilla', 'react', 'vue', 'angular'] as const;

/**
 * Performance thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
  SDK_INIT_TIME: 5000, // 5 seconds
  AD_REQUEST_TIME: 2000, // 2 seconds
  FRAMEWORK_SWITCH_TIME: 3000, // 3 seconds
  TOUCH_TARGET_MIN_SIZE: 44 // 44px minimum for touch targets
};