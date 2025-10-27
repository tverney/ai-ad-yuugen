import { test, expect } from '@playwright/test';

test.describe('SDK Integration with AI Applications', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="vanilla-chat"]');
  });

  test('should initialize SDK successfully', async ({ page }) => {
    // Wait for SDK initialization
    await page.waitForFunction(() => window.testApp?.sdk !== null, { timeout: 10000 });
    
    // Verify SDK is available
    const sdk = await page.evaluate(() => window.testUtils.getSDK());
    expect(sdk).not.toBeNull();
    
    // Verify SDK load time is recorded
    const loadTime = await page.textContent('[data-testid="sdk-load-time"]');
    expect(parseInt(loadTime)).toBeGreaterThan(0);
  });

  test('should integrate with vanilla JavaScript applications', async ({ page }) => {
    await page.waitForFunction(() => window.testApp?.sdk !== null);
    
    // Test vanilla JS framework tab is active by default
    const vanillaTab = page.locator('[data-testid="vanilla-tab"]');
    await expect(vanillaTab).toHaveClass(/active/);
    
    // Test vanilla JS components are visible
    await expect(page.locator('[data-testid="vanilla-chat"]')).toBeVisible();
    await expect(page.locator('[data-testid="vanilla-banner-ad"]')).toBeVisible();
    await expect(page.locator('[data-testid="vanilla-native-ad"]')).toBeVisible();
    
    // Test vanilla JS controls work
    await page.click('[data-testid="vanilla-send-message"]');
    await page.waitForSelector('.user-message');
    
    await page.click('[data-testid="vanilla-request-ad"]');
    await page.waitForSelector('[data-testid="vanilla-ad-content"]', { timeout: 5000 });
  });

  test('should integrate with React applications', async ({ page }) => {
    await page.waitForFunction(() => window.testApp?.sdk !== null);
    
    // Switch to React framework
    await page.click('[data-testid="react-tab"]');
    
    // Verify React tab is active
    const reactTab = page.locator('[data-testid="react-tab"]');
    await expect(reactTab).toHaveClass(/active/);
    
    // Wait for React app to load
    await page.waitForSelector('[data-testid="react-app"]');
    await expect(page.locator('[data-testid="react-chat"]')).toBeVisible();
    
    // Test React components
    await expect(page.locator('[data-testid="react-banner-ad"]')).toBeVisible();
    await expect(page.locator('[data-testid="react-native-ad"]')).toBeVisible();
    
    // Test React controls
    await page.click('[data-testid="react-send-message"]');
    await page.waitForSelector('[data-testid="react-chat"] .user-message');
    
    await page.click('[data-testid="react-request-ad"]');
    await page.waitForSelector('[data-testid="react-ad-content"]', { timeout: 5000 });
  });

  test('should integrate with Vue applications', async ({ page }) => {
    await page.waitForFunction(() => window.testApp?.sdk !== null);
    
    // Switch to Vue framework
    await page.click('[data-testid="vue-tab"]');
    
    // Verify Vue tab is active
    const vueTab = page.locator('[data-testid="vue-tab"]');
    await expect(vueTab).toHaveClass(/active/);
    
    // Wait for Vue app to load
    await page.waitForSelector('[data-testid="vue-app"]');
    await expect(page.locator('[data-testid="vue-chat"]')).toBeVisible();
    
    // Test Vue components
    await expect(page.locator('[data-testid="vue-banner-ad"]')).toBeVisible();
    await expect(page.locator('[data-testid="vue-native-ad"]')).toBeVisible();
    
    // Test Vue controls
    await page.click('[data-testid="vue-send-message"]');
    await page.waitForSelector('[data-testid="vue-chat"] .user-message');
    
    await page.click('[data-testid="vue-request-ad"]');
    await page.waitForSelector('[data-testid="vue-ad-content"]', { timeout: 5000 });
  });

  test('should integrate with Angular applications', async ({ page }) => {
    await page.waitForFunction(() => window.testApp?.sdk !== null);
    
    // Switch to Angular framework
    await page.click('[data-testid="angular-tab"]');
    
    // Verify Angular tab is active
    const angularTab = page.locator('[data-testid="angular-tab"]');
    await expect(angularTab).toHaveClass(/active/);
    
    // Wait for Angular app to load
    await page.waitForSelector('[data-testid="angular-app"]');
    await expect(page.locator('[data-testid="angular-chat"]')).toBeVisible();
    
    // Test Angular components
    await expect(page.locator('[data-testid="angular-banner-ad"]')).toBeVisible();
    await expect(page.locator('[data-testid="angular-native-ad"]')).toBeVisible();
    
    // Test Angular controls
    await page.click('[data-testid="angular-send-message"]');
    await page.waitForSelector('[data-testid="angular-chat"] .user-message');
    
    await page.click('[data-testid="angular-request-ad"]');
    await page.waitForSelector('[data-testid="angular-ad-content"]', { timeout: 5000 });
  });

  test('should maintain consistent API across frameworks', async ({ page }) => {
    await page.waitForFunction(() => window.testApp?.sdk !== null);
    
    const frameworks = ['vanilla', 'react', 'vue', 'angular'];
    
    for (const framework of frameworks) {
      // Switch to framework
      await page.click(`[data-testid="${framework}-tab"]`);
      await page.waitForSelector(`[data-testid="${framework}-chat"]`);
      
      // Test message sending
      await page.click(`[data-testid="${framework}-send-message"]`);
      await page.waitForSelector(`[data-testid="${framework}-chat"] .user-message`);
      
      // Test ad requesting
      await page.click(`[data-testid="${framework}-request-ad"]`);
      await page.waitForSelector(`[data-testid="${framework}-ad-content"]`, { timeout: 5000 });
      
      // Verify ad structure is consistent
      const adContent = page.locator(`[data-testid="${framework}-ad-content"]`);
      await expect(adContent.locator('h4')).toBeVisible(); // Title
      await expect(adContent.locator('p')).toBeVisible(); // Description
      await expect(adContent.locator(`[data-testid="${framework}-ad-cta"]`)).toBeVisible(); // CTA
    }
  });

  test('should handle context analysis across frameworks', async ({ page }) => {
    await page.waitForFunction(() => window.testApp?.sdk !== null);
    
    const frameworks = ['vanilla', 'react', 'vue', 'angular'];
    
    for (const framework of frameworks) {
      // Switch to framework
      await page.click(`[data-testid="${framework}-tab"]`);
      await page.waitForSelector(`[data-testid="${framework}-chat"]`);
      
      // Send message with specific context
      await page.click(`[data-testid="${framework}-send-message"]`);
      await page.waitForSelector(`[data-testid="${framework}-chat"] .ai-message:nth-child(2)`);
      
      // Request ad based on context
      await page.click(`[data-testid="${framework}-request-ad"]`);
      await page.waitForSelector(`[data-testid="${framework}-ad-content"]`);
      
      // Verify ad is contextually relevant (should contain tech-related content)
      const adContent = await page.textContent(`[data-testid="${framework}-ad-content"]`);
      expect(adContent.toLowerCase()).toMatch(/(tech|learn|algorithm|machine|ai|software|computer)/);
    }
  });

  test('should handle SDK errors gracefully across frameworks', async ({ page }) => {
    await page.waitForFunction(() => window.testApp?.sdk !== null);
    
    const frameworks = ['vanilla', 'react', 'vue', 'angular'];
    
    for (const framework of frameworks) {
      // Switch to framework
      await page.click(`[data-testid="${framework}-tab"]`);
      await page.waitForSelector(`[data-testid="${framework}-chat"]`);
      
      // Simulate error
      await page.evaluate(() => {
        window.testUtils.simulateError('network');
      });
      
      // Verify error handling
      await page.waitForSelector('[data-testid="notification-error"]');
      const errorNotification = page.locator('[data-testid="notification-error"]');
      await expect(errorNotification).toBeVisible();
      
      // Wait for error notification to disappear
      await page.waitForSelector('[data-testid="notification-error"]', { state: 'detached', timeout: 6000 });
    }
  });

  test('should maintain performance across framework switches', async ({ page }) => {
    await page.waitForFunction(() => window.testApp?.sdk !== null);
    
    const frameworks = ['vanilla', 'react', 'vue', 'angular'];
    const performanceData = [];
    
    for (const framework of frameworks) {
      const startTime = Date.now();
      
      // Switch to framework
      await page.click(`[data-testid="${framework}-tab"]`);
      await page.waitForSelector(`[data-testid="${framework}-chat"]`);
      
      // Request ad
      await page.click(`[data-testid="${framework}-request-ad"]`);
      await page.waitForSelector(`[data-testid="${framework}-ad-content"]`);
      
      const endTime = Date.now();
      const switchTime = endTime - startTime;
      
      performanceData.push({ framework, switchTime });
      
      // Verify reasonable performance
      expect(switchTime).toBeLessThan(3000); // Should switch and load ad within 3 seconds
    }
    
    // Log performance data for analysis
    console.log('Framework switch performance:', performanceData);
  });
});