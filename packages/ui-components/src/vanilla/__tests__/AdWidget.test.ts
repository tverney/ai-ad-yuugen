import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { AdWidget, AdWidgetConfig } from '../AdWidget';
import { Ad, AdType, AdFormat } from '@ai-yuugen/types';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock window.open
const mockWindowOpen = vi.fn();
window.open = mockWindowOpen;

describe('AdWidget', () => {
  let container: HTMLElement;
  let config: AdWidgetConfig;

  beforeEach(() => {
    // Create a container element
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    // Basic config
    config = {
      container: container,
      placementId: 'test-placement',
      autoInit: false, // Prevent auto-initialization in tests
    };

    // Clear any existing instances
    AdWidget.destroyAll();

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';
    
    // Destroy all instances
    AdWidget.destroyAll();

    // Reset document.body styles
    document.body.style.overflow = '';
  });

  describe('Constructor', () => {
    it('should create an instance with valid config', () => {
      const widget = new AdWidget(config);
      expect(widget).toBeInstanceOf(AdWidget);
      expect(widget.getConfig().placementId).toBe('test-placement');
    });

    it('should throw error if container is not provided', () => {
      expect(() => {
        new AdWidget({ ...config, container: undefined as any });
      }).toThrow('Container is required');
    });

    it('should throw error if placementId is not provided', () => {
      expect(() => {
        new AdWidget({ ...config, placementId: undefined as any });
      }).toThrow('Placement ID is required');
    });

    it('should throw error if container element is not found', () => {
      expect(() => {
        new AdWidget({ ...config, container: 'non-existent-id' });
      }).toThrow('Container element not found or invalid');
    });

    it('should resolve container by ID string', () => {
      const widget = new AdWidget({ ...config, container: 'test-container' });
      expect(widget).toBeInstanceOf(AdWidget);
    });

    it('should resolve container by query selector', () => {
      container.className = 'test-class';
      const widget = new AdWidget({ ...config, container: '.test-class' });
      expect(widget).toBeInstanceOf(AdWidget);
    });

    it('should auto-initialize by default', () => {
      const widget = new AdWidget({ ...config, autoInit: true });
      expect(container.innerHTML).not.toBe('');
    });

    it('should not auto-initialize when autoInit is false', () => {
      const widget = new AdWidget({ ...config, autoInit: false });
      expect(container.innerHTML).toBe('');
    });

    it('should set up namespace protection', () => {
      new AdWidget(config);
      expect(window.AIAd Yuugen).toBeDefined();
      expect(window.AIAd Yuugen?.AdWidget).toBe(AdWidget);
      expect(window.AIAd Yuugen?.version).toBe('1.0.0');
    });

    it('should register instance in instances map', () => {
      const widget = new AdWidget(config);
      const instances = AdWidget.getAllInstances();
      expect(instances).toContain(widget);
    });
  });

  describe('Configuration', () => {
    it('should apply default configuration values', () => {
      const widget = new AdWidget(config);
      const widgetConfig = widget.getConfig();
      
      expect(widgetConfig.type).toBe('banner');
      expect(widgetConfig.layout).toBe('banner');
      expect(widgetConfig.showLoading).toBe(true);
      expect(widgetConfig.showFallback).toBe(true);
      expect(widgetConfig.showAdLabel).toBe(true);
      expect(widgetConfig.adLabelText).toBe('Ad');
      expect(widgetConfig.ariaLabel).toBe('Advertisement');
      expect(widgetConfig.testId).toBe('ad-widget');
    });

    it('should merge custom configuration with defaults', () => {
      const customConfig: AdWidgetConfig = {
        ...config,
        layout: 'native-card',
        showLoading: false,
        adLabelText: 'Sponsored',
        theme: {
          backgroundColor: '#ffffff',
          textColor: '#333333',
        },
      };

      const widget = new AdWidget(customConfig);
      const widgetConfig = widget.getConfig();

      expect(widgetConfig.layout).toBe('native-card');
      expect(widgetConfig.showLoading).toBe(false);
      expect(widgetConfig.adLabelText).toBe('Sponsored');
      expect(widgetConfig.theme?.backgroundColor).toBe('#ffffff');
      expect(widgetConfig.theme?.textColor).toBe('#333333');
    });

    it('should update configuration', () => {
      const widget = new AdWidget(config);
      widget.updateConfig({ layout: 'native-inline', showAdLabel: false });
      
      const updatedConfig = widget.getConfig();
      expect(updatedConfig.layout).toBe('native-inline');
      expect(updatedConfig.showAdLabel).toBe(false);
    });
  });

  describe('Initialization', () => {
    it('should initialize and load ad', async () => {
      const widget = new AdWidget(config);
      widget.init();

      // Should show loading state initially
      expect(container.innerHTML).toContain('Loading ad...');

      // Wait for ad to load
      await new Promise(resolve => setTimeout(resolve, 900));

      // Should show ad content
      expect(container.innerHTML).not.toContain('Loading ad...');
      expect(container.querySelector('[data-testid="ad-widget"]')).toBeTruthy();
    });

    it('should set up intersection observer', () => {
      const widget = new AdWidget(config);
      widget.init();

      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        { threshold: 0.5 }
      );
    });

    it('should throw error when initializing destroyed instance', () => {
      const widget = new AdWidget(config);
      widget.destroy();

      expect(() => widget.init()).toThrow('Cannot initialize destroyed AdWidget instance');
    });
  });

  describe('Ad Loading', () => {
    it('should show loading state when showLoading is true', () => {
      const widget = new AdWidget({ ...config, showLoading: true });
      widget.init();

      expect(container.innerHTML).toContain('Loading ad...');
      expect(container.querySelector('.ai-yuugen-loading')).toBeTruthy();
    });

    it('should not show loading state when showLoading is false', () => {
      const widget = new AdWidget({ ...config, showLoading: false });
      widget.init();

      expect(container.innerHTML).not.toContain('Loading ad...');
    });

    it('should generate mock ad data based on layout', async () => {
      const widget = new AdWidget({ ...config, layout: 'native-card' });
      widget.init();

      await new Promise(resolve => setTimeout(resolve, 900));

      const currentAd = widget.getCurrentAd();
      expect(currentAd).toBeTruthy();
      expect(currentAd?.content.title).toContain('AI Tools');
    });

    it('should call onAdLoad callback when ad loads successfully', async () => {
      const onAdLoad = vi.fn();
      const widget = new AdWidget({ ...config, onAdLoad });
      widget.init();

      await new Promise(resolve => setTimeout(resolve, 900));

      expect(onAdLoad).toHaveBeenCalledWith(expect.objectContaining({
        id: expect.stringContaining('banner-test-placement'),
        content: expect.objectContaining({
          title: expect.any(String),
          description: expect.any(String),
        }),
      }));
    });
  });

  describe('Ad Rendering', () => {
    let widget: AdWidget;

    beforeEach(async () => {
      widget = new AdWidget(config);
      widget.init();
      await new Promise(resolve => setTimeout(resolve, 900));
    });

    it('should render banner layout', () => {
      const adElement = container.querySelector('[data-testid="ad-widget"]');
      expect(adElement).toBeTruthy();
      expect(adElement?.getAttribute('data-layout')).toBe('banner');
    });

    it('should render ad label when showAdLabel is true', () => {
      const adLabel = container.querySelector('div');
      const hasAdLabel = Array.from(container.querySelectorAll('div')).some(
        div => div.textContent === 'Ad'
      );
      expect(hasAdLabel).toBe(true);
    });

    it('should not render ad label when showAdLabel is false', async () => {
      widget.destroy();
      widget = new AdWidget({ ...config, showAdLabel: false });
      widget.init();
      await new Promise(resolve => setTimeout(resolve, 900));

      const hasAdLabel = Array.from(container.querySelectorAll('div')).some(
        div => div.textContent === 'Ad'
      );
      expect(hasAdLabel).toBe(false);
    });

    it('should apply custom theme styles', async () => {
      widget.destroy();
      widget = new AdWidget({
        ...config,
        theme: {
          backgroundColor: '#ff0000',
          textColor: '#ffffff',
          borderRadius: '10px',
        },
      });
      widget.init();
      await new Promise(resolve => setTimeout(resolve, 900));

      const adElement = container.querySelector('[data-testid="ad-widget"]') as HTMLElement;
      expect(adElement.style.backgroundColor).toBe('rgb(255, 0, 0)');
      expect(adElement.style.color).toBe('rgb(255, 255, 255)');
      expect(adElement.style.borderRadius).toBe('10px');
    });
  });

  describe('Native Layouts', () => {
    it('should render native-card layout', async () => {
      const widget = new AdWidget({ ...config, layout: 'native-card' });
      widget.init();
      await new Promise(resolve => setTimeout(resolve, 900));

      const adElement = container.querySelector('[data-testid="ad-widget"]');
      expect(adElement?.getAttribute('data-layout')).toBe('native-card');
      expect(adElement?.getAttribute('role')).toBe('article');
    });

    it('should render native-inline layout', async () => {
      const widget = new AdWidget({ ...config, layout: 'native-inline' });
      widget.init();
      await new Promise(resolve => setTimeout(resolve, 900));

      const adElement = container.querySelector('[data-testid="ad-widget"]');
      expect(adElement?.getAttribute('data-layout')).toBe('native-inline');
    });

    it('should render native-minimal layout', async () => {
      const widget = new AdWidget({ ...config, layout: 'native-minimal' });
      widget.init();
      await new Promise(resolve => setTimeout(resolve, 900));

      const adElement = container.querySelector('[data-testid="ad-widget"]');
      expect(adElement?.getAttribute('data-layout')).toBe('native-minimal');
    });
  });

  describe('Interstitial Layout', () => {
    let widget: AdWidget;

    beforeEach(async () => {
      widget = new AdWidget({ ...config, layout: 'interstitial' });
      widget.init();
      await new Promise(resolve => setTimeout(resolve, 900));
    });

    it('should render interstitial layout as hidden initially', () => {
      const adElement = container.querySelector('[data-testid="ad-widget"]') as HTMLElement;
      expect(adElement.style.display).toBe('none');
    });

    it('should show interstitial when show() is called', () => {
      widget.show();
      const adElement = container.querySelector('[data-testid="ad-widget"]') as HTMLElement;
      expect(adElement.style.display).toBe('flex');
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should hide interstitial when hide() is called', () => {
      widget.show();
      widget.hide();
      const adElement = container.querySelector('[data-testid="ad-widget"]') as HTMLElement;
      expect(adElement.style.display).toBe('none');
      expect(document.body.style.overflow).toBe('');
    });

    it('should render close button when showCloseButton is true', () => {
      widget.show();
      const closeButton = container.querySelector('button[aria-label="Close advertisement"]');
      expect(closeButton).toBeTruthy();
    });

    it('should not render close button when showCloseButton is false', async () => {
      widget.destroy();
      widget = new AdWidget({ ...config, layout: 'interstitial', showCloseButton: false });
      widget.init();
      await new Promise(resolve => setTimeout(resolve, 900));
      widget.show();

      const closeButton = container.querySelector('button[aria-label="Close advertisement"]');
      expect(closeButton).toBeFalsy();
    });
  });

  describe('Event Handling', () => {
    let widget: AdWidget;
    let onAdClick: Mock;

    beforeEach(async () => {
      onAdClick = vi.fn();
      widget = new AdWidget({ ...config, onAdClick });
      widget.init();
      await new Promise(resolve => setTimeout(resolve, 900));
    });

    it('should handle ad click events', () => {
      const adElement = container.querySelector('[data-testid="ad-widget"]') as HTMLElement;
      adElement.click();

      expect(onAdClick).toHaveBeenCalledWith(expect.objectContaining({
        id: expect.stringContaining('banner-test-placement'),
      }));
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://example.com',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should handle keyboard navigation (Enter key)', () => {
      const adElement = container.querySelector('[data-testid="ad-widget"]') as HTMLElement;
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      adElement.dispatchEvent(enterEvent);

      expect(onAdClick).toHaveBeenCalled();
    });

    it('should handle keyboard navigation (Space key)', () => {
      const adElement = container.querySelector('[data-testid="ad-widget"]') as HTMLElement;
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      adElement.dispatchEvent(spaceEvent);

      expect(onAdClick).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should show fallback state when showFallback is true', async () => {
      // Mock ad loading to fail
      const originalSetTimeout = window.setTimeout;
      window.setTimeout = vi.fn((callback, delay) => {
        if (delay === 800) {
          // Simulate error during ad loading
          throw new Error('Network error');
        }
        return originalSetTimeout(callback, delay);
      }) as any;

      const onAdError = vi.fn();
      const widget = new AdWidget({ ...config, onAdError, showFallback: true });
      
      try {
        widget.init();
        await new Promise(resolve => setTimeout(resolve, 900));
      } catch (error) {
        // Expected error
      }

      // Should show fallback content
      expect(container.innerHTML).toContain('Advertisement');
      expect(container.querySelector('.ai-yuugen-fallback')).toBeTruthy();

      // Restore setTimeout
      window.setTimeout = originalSetTimeout;
    });

    it('should not show fallback when showFallback is false', async () => {
      // Mock ad loading to fail
      const originalSetTimeout = window.setTimeout;
      window.setTimeout = vi.fn((callback, delay) => {
        if (delay === 800) {
          throw new Error('Network error');
        }
        return originalSetTimeout(callback, delay);
      }) as any;

      const widget = new AdWidget({ ...config, showFallback: false });
      
      try {
        widget.init();
        await new Promise(resolve => setTimeout(resolve, 900));
      } catch (error) {
        // Expected error
      }

      // Should not show fallback content
      expect(container.innerHTML).not.toContain('Advertisement');

      // Restore setTimeout
      window.setTimeout = originalSetTimeout;
    });
  });

  describe('Accessibility', () => {
    let widget: AdWidget;

    beforeEach(async () => {
      widget = new AdWidget({ ...config, ariaLabel: 'Custom Ad Label' });
      widget.init();
      await new Promise(resolve => setTimeout(resolve, 900));
    });

    it('should set proper ARIA attributes', () => {
      const adElement = container.querySelector('[data-testid="ad-widget"]');
      expect(adElement?.getAttribute('aria-label')).toBe('Custom Ad Label');
      expect(adElement?.getAttribute('tabIndex')).toBe('0');
    });

    it('should set proper role for banner ads', () => {
      const adElement = container.querySelector('[data-testid="ad-widget"]');
      expect(adElement?.getAttribute('role')).toBe('img');
    });

    it('should set proper role for native ads', async () => {
      widget.destroy();
      widget = new AdWidget({ ...config, layout: 'native-card' });
      widget.init();
      await new Promise(resolve => setTimeout(resolve, 900));

      const adElement = container.querySelector('[data-testid="ad-widget"]');
      expect(adElement?.getAttribute('role')).toBe('article');
    });
  });

  describe('Responsive Design', () => {
    it('should apply responsive styles when responsive is true', async () => {
      const widget = new AdWidget({
        ...config,
        size: { width: 728, height: 90, responsive: true },
      });
      widget.init();
      await new Promise(resolve => setTimeout(resolve, 900));

      const adElement = container.querySelector('[data-testid="ad-widget"]') as HTMLElement;
      expect(adElement.style.width).toBe('100%');
      expect(adElement.style.maxWidth).toBe('728px');
    });

    it('should apply fixed styles when responsive is false', async () => {
      const widget = new AdWidget({
        ...config,
        size: { width: 300, height: 250, responsive: false },
      });
      widget.init();
      await new Promise(resolve => setTimeout(resolve, 900));

      const adElement = container.querySelector('[data-testid="ad-widget"]') as HTMLElement;
      expect(adElement.style.width).toBe('300px');
      expect(adElement.style.height).toBe('250px');
    });
  });

  describe('Lifecycle Management', () => {
    it('should destroy instance and clean up resources', async () => {
      const widget = new AdWidget(config);
      widget.init();
      await new Promise(resolve => setTimeout(resolve, 900));

      const instancesBefore = AdWidget.getAllInstances();
      expect(instancesBefore).toContain(widget);

      widget.destroy();

      const instancesAfter = AdWidget.getAllInstances();
      expect(instancesAfter).not.toContain(widget);
      expect(container.innerHTML).toBe('');
    });

    it('should prevent operations on destroyed instance', () => {
      const widget = new AdWidget(config);
      widget.destroy();

      expect(() => widget.init()).toThrow('Cannot initialize destroyed AdWidget instance');
      expect(() => widget.updateConfig({ layout: 'native-card' })).toThrow('Cannot update config of destroyed AdWidget instance');
    });

    it('should clean up event listeners on destroy', async () => {
      const widget = new AdWidget(config);
      widget.init();
      await new Promise(resolve => setTimeout(resolve, 900));

      const adElement = container.querySelector('[data-testid="ad-widget"]') as HTMLElement;
      const clickHandler = vi.fn();
      adElement.addEventListener('click', clickHandler);

      widget.destroy();

      // Event listeners should be cleaned up
      adElement.click();
      expect(clickHandler).not.toHaveBeenCalled();
    });
  });

  describe('Static Methods', () => {
    it('should get instance by container ID', () => {
      const widget = new AdWidget(config);
      const instanceId = container.getAttribute('data-ai-yuugen-id');
      
      if (instanceId) {
        const retrievedWidget = AdWidget.getInstance(instanceId);
        expect(retrievedWidget).toBe(widget);
      }
    });

    it('should return null for non-existent instance', () => {
      const widget = AdWidget.getInstance('non-existent-id');
      expect(widget).toBeNull();
    });

    it('should get all instances', () => {
      const widget1 = new AdWidget(config);
      
      const container2 = document.createElement('div');
      container2.id = 'test-container-2';
      document.body.appendChild(container2);
      const widget2 = new AdWidget({ ...config, container: container2 });

      const instances = AdWidget.getAllInstances();
      expect(instances).toContain(widget1);
      expect(instances).toContain(widget2);
      expect(instances).toHaveLength(2);
    });

    it('should destroy all instances', () => {
      new AdWidget(config);
      
      const container2 = document.createElement('div');
      container2.id = 'test-container-2';
      document.body.appendChild(container2);
      new AdWidget({ ...config, container: container2 });

      expect(AdWidget.getAllInstances()).toHaveLength(2);

      AdWidget.destroyAll();

      expect(AdWidget.getAllInstances()).toHaveLength(0);
    });

    it('should return version', () => {
      expect(AdWidget.getVersion()).toBe('1.0.0');
    });
  });

  describe('Namespace Protection', () => {
    it('should not conflict with existing global variables', () => {
      // Simulate existing global variable
      (window as any).someExistingVar = 'existing';

      new AdWidget(config);

      expect((window as any).someExistingVar).toBe('existing');
      expect(window.AIAd Yuugen).toBeDefined();
    });

    it('should maintain namespace across multiple instances', () => {
      const widget1 = new AdWidget(config);
      
      const container2 = document.createElement('div');
      container2.id = 'test-container-2';
      document.body.appendChild(container2);
      const widget2 = new AdWidget({ ...config, container: container2 });

      expect(window.AIAd Yuugen?.AdWidget).toBe(AdWidget);
      expect(AdWidget.getAllInstances()).toContain(widget1);
      expect(AdWidget.getAllInstances()).toContain(widget2);
    });
  });

  describe('DOM Manipulation', () => {
    it('should create elements with proper attributes', async () => {
      const widget = new AdWidget({
        ...config,
        testId: 'custom-test-id',
        ariaLabel: 'Custom Aria Label',
      });
      widget.init();
      await new Promise(resolve => setTimeout(resolve, 900));

      const adElement = container.querySelector('[data-testid="custom-test-id"]');
      expect(adElement).toBeTruthy();
      expect(adElement?.getAttribute('aria-label')).toBe('Custom Aria Label');
      expect(adElement?.getAttribute('data-ad-id')).toBeTruthy();
      expect(adElement?.getAttribute('data-placement-id')).toBe('test-placement');
    });

    it('should inject spinner styles only once', () => {
      const widget1 = new AdWidget(config);
      widget1.init();

      const container2 = document.createElement('div');
      container2.id = 'test-container-2';
      document.body.appendChild(container2);
      const widget2 = new AdWidget({ ...config, container: container2 });
      widget2.init();

      const spinnerStyles = document.querySelectorAll('#ai-yuugen-spinner-styles');
      expect(spinnerStyles).toHaveLength(1);
    });
  });
});