import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CacheManager } from '../cache-manager';
import { PerformanceMonitor } from '../performance-monitor';
import { LazyLoader } from '../lazy-loader';
import { AdManager } from '../ad-manager';
import { AdPlacement, AIContext, AdResponse } from '@ai-yuugen/types';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 1024 * 1024 * 10, // 10MB
    totalJSHeapSize: 1024 * 1024 * 50, // 50MB
    jsHeapSizeLimit: 1024 * 1024 * 100 // 100MB
  }
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(private callback: IntersectionObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(global, 'IntersectionObserver', {
  value: MockIntersectionObserver,
  writable: true
});

describe('Performance Optimization', () => {
  describe('CacheManager', () => {
    let cacheManager: CacheManager;

    beforeEach(() => {
      cacheManager = new CacheManager({
        maxSize: 1024 * 1024, // 1MB
        maxEntries: 100,
        defaultTtl: 60000, // 1 minute
        cleanupInterval: 10000
      });
    });

    afterEach(() => {
      cacheManager.destroy();
    });

    it('should cache and retrieve ad responses', () => {
      const placement: AdPlacement = { id: 'test-placement', format: 'banner' };
      const context: AIContext = { topics: ['technology'], intent: 'purchase' };
      const response: AdResponse = {
        requestId: 'test-request',
        ads: [{
          id: 'test-ad',
          type: 'banner',
          format: 'banner',
          content: {
            title: 'Test Ad',
            description: 'Test Description',
            ctaText: 'Click Here',
            landingUrl: 'https://example.com',
            brandName: 'Test Brand'
          },
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 3600000)
        }],
        metadata: { processingTime: 100, targetingScore: 0.8 },
        timestamp: new Date(),
        ttl: 300
      };

      // Cache the response
      cacheManager.cacheAdResponse(placement, context, response);

      // Retrieve from cache
      const cached = cacheManager.getCachedAdResponse(placement, context);
      expect(cached).toEqual(response);
    });

    it('should handle cache eviction when size limit is exceeded', () => {
      const largeData = 'x'.repeat(500 * 1024); // 500KB
      
      // Fill cache beyond limit
      for (let i = 0; i < 5; i++) {
        cacheManager.set(`key-${i}`, largeData);
      }

      const stats = cacheManager.getStats();
      expect(stats.evictions).toBeGreaterThan(0);
      expect(stats.totalSize).toBeLessThanOrEqual(1024 * 1024);
    });

    it('should generate cache keys consistently', () => {
      const placement: AdPlacement = { id: 'test-placement', format: 'banner' };
      const context1: AIContext = { topics: ['tech', 'ai'], intent: 'research' };
      const context2: AIContext = { topics: ['ai', 'tech'], intent: 'research' };
      
      const response: AdResponse = {
        requestId: 'test',
        ads: [],
        metadata: { processingTime: 100, targetingScore: 0.8 },
        timestamp: new Date(),
        ttl: 300
      };

      cacheManager.cacheAdResponse(placement, context1, response);
      const cached = cacheManager.getCachedAdResponse(placement, context2);
      
      // Should find cached response even with different topic order
      expect(cached).toEqual(response);
    });

    it('should track cache hit rate', () => {
      const placement: AdPlacement = { id: 'test-placement', format: 'banner' };
      const context: AIContext = { topics: ['technology'] };
      const response: AdResponse = {
        requestId: 'test',
        ads: [],
        metadata: { processingTime: 100, targetingScore: 0.8 },
        timestamp: new Date(),
        ttl: 300
      };

      // Cache miss
      let cached = cacheManager.getCachedAdResponse(placement, context);
      expect(cached).toBeNull();

      // Cache hit
      cacheManager.cacheAdResponse(placement, context, response);
      cached = cacheManager.getCachedAdResponse(placement, context);
      expect(cached).toEqual(response);

      const stats = cacheManager.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });
  });

  describe('PerformanceMonitor', () => {
    let performanceMonitor: PerformanceMonitor;

    beforeEach(() => {
      performanceMonitor = new PerformanceMonitor({
        adRequestTime: 1000,
        adRenderTime: 200,
        memoryUsage: 20,
        errorRate: 0.1,
        cacheHitRate: 0.8
      });
    });

    afterEach(() => {
      performanceMonitor.destroy();
    });

    it('should measure execution time', async () => {
      const result = await performanceMonitor.measureAsync('test-operation', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'success';
      });

      expect(result).toBe('success');
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toBeDefined();
    });

    it('should record custom metrics', () => {
      performanceMonitor.recordMetric('adRequestTime', 1500);
      performanceMonitor.recordMetric('cacheHitRate', 0.6);

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.adRequestTime).toBe(1500);
      expect(metrics.cacheHitRate).toBe(0.6);
    });

    it('should generate optimization suggestions for threshold violations', () => {
      // Violate thresholds
      performanceMonitor.recordMetric('adRequestTime', 2000); // Above 1000ms threshold
      performanceMonitor.recordMetric('cacheHitRate', 0.5); // Below 0.8 threshold

      const suggestions = performanceMonitor.getOptimizationSuggestions();
      expect(suggestions.length).toBeGreaterThan(0);
      
      const networkSuggestion = suggestions.find(s => s.type === 'network');
      const cacheSuggestion = suggestions.find(s => s.type === 'cache');
      
      expect(networkSuggestion).toBeDefined();
      expect(cacheSuggestion).toBeDefined();
    });

    it('should measure synchronous functions', () => {
      const result = performanceMonitor.measure('sync-operation', () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      });

      expect(result).toBe(499500);
    });
  });

  describe('LazyLoader', () => {
    let lazyLoader: LazyLoader;

    beforeEach(() => {
      lazyLoader = new LazyLoader({
        rootMargin: '50px',
        threshold: 0.1,
        enablePreloading: true,
        chunkSize: 3
      });
    });

    afterEach(() => {
      lazyLoader.destroy();
    });

    it('should register and unregister components', () => {
      const element = document.createElement('div');
      const component = {
        id: 'test-component',
        element,
        loader: vi.fn().mockResolvedValue(undefined),
        loaded: false,
        loading: false,
        priority: 5
      };

      lazyLoader.registerComponent(component);
      expect(() => lazyLoader.unregisterComponent('test-component')).not.toThrow();
    });

    it('should load component with dependencies', async () => {
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      
      const loader1 = vi.fn().mockResolvedValue(undefined);
      const loader2 = vi.fn().mockResolvedValue(undefined);

      const component1 = {
        id: 'component-1',
        element: element1,
        loader: loader1,
        loaded: false,
        loading: false,
        priority: 5
      };

      const component2 = {
        id: 'component-2',
        element: element2,
        loader: loader2,
        loaded: false,
        loading: false,
        priority: 3,
        dependencies: ['component-1']
      };

      lazyLoader.registerComponent(component1);
      lazyLoader.registerComponent(component2);

      await lazyLoader.loadComponent('component-2');

      expect(loader1).toHaveBeenCalled();
      expect(loader2).toHaveBeenCalled();
      expect(component1.loaded).toBe(true);
      expect(component2.loaded).toBe(true);
    });

    it('should create virtual scroller', () => {
      document.body.innerHTML = '<div id="test-container"></div>';
      
      const items = Array.from({ length: 1000 }, (_, i) => ({ id: i, text: `Item ${i}` }));
      const renderItem = (item: any) => {
        const div = document.createElement('div');
        div.textContent = item.text;
        return div;
      };

      const scroller = lazyLoader.createVirtualScroller('test-container', items, renderItem, {
        itemHeight: 50,
        containerHeight: 400
      });

      expect(scroller).toBeDefined();
    });
  });

  describe('AdManager Performance Integration', () => {
    let adManager: AdManager;

    beforeEach(() => {
      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          requestId: 'test-request',
          ads: [{
            id: 'test-ad',
            type: 'banner',
            format: 'banner',
            content: {
              title: 'Test Ad',
              description: 'Test Description',
              ctaText: 'Click Here',
              landingUrl: 'https://example.com',
              brandName: 'Test Brand'
            },
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 3600000).toISOString()
          }],
          metadata: { processingTime: 100, targetingScore: 0.8 },
          timestamp: new Date().toISOString(),
          ttl: 300
        })
      });

      adManager = new AdManager({
        baseUrl: 'https://test-api.com',
        apiKey: 'test-key',
        timeout: 5000,
        retryAttempts: 3,
        fallbackConfig: {
          enabled: true,
          maxRetries: 3,
          retryDelay: 1000,
          fallbackAds: [],
          fallbackStrategy: 'default' as any
        },
        debugMode: true,
        enablePerformanceOptimization: true,
        cacheConfig: {
          maxSize: 1024 * 1024,
          maxEntries: 100,
          defaultTtl: 60000
        }
      });
    });

    afterEach(() => {
      adManager.destroy();
      vi.restoreAllMocks();
    });

    it('should cache ad responses and improve performance', async () => {
      const placement: AdPlacement = { id: 'test-placement', format: 'banner' };
      const context: AIContext = { topics: ['technology'], intent: 'research' };

      // First request - should hit network
      const ad1 = await adManager.requestAd(placement, context);
      expect(ad1).toBeDefined();
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second request - should hit cache
      const ad2 = await adManager.requestAd(placement, context);
      expect(ad2).toBeDefined();
      expect(global.fetch).toHaveBeenCalledTimes(1); // No additional network call
    });

    it('should provide performance metrics', async () => {
      const placement: AdPlacement = { id: 'test-placement', format: 'banner' };
      const context: AIContext = { topics: ['technology'] };

      await adManager.requestAd(placement, context);

      const metrics = adManager.getPerformanceMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.cacheStats).toBeDefined();
      expect(metrics.performanceMetrics).toBeDefined();
    });

    it('should apply performance optimizations', () => {
      expect(() => adManager.applyPerformanceOptimizations()).not.toThrow();
    });
  });

  describe('Performance Benchmarks', () => {
    it('should benchmark cache performance', async () => {
      const cacheManager = new CacheManager({
        maxSize: 10 * 1024 * 1024,
        maxEntries: 10000
      });

      const startTime = performance.now();
      
      // Benchmark cache writes
      for (let i = 0; i < 1000; i++) {
        cacheManager.set(`key-${i}`, { data: `value-${i}`, timestamp: Date.now() });
      }

      // Benchmark cache reads
      for (let i = 0; i < 1000; i++) {
        cacheManager.get(`key-${i}`);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
      
      const stats = cacheManager.getStats();
      expect(stats.hits).toBe(1000);
      expect(stats.hitRate).toBe(1);

      cacheManager.destroy();
    });

    it('should benchmark ad request performance', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          requestId: 'test-request',
          ads: [{
            id: 'test-ad',
            type: 'banner',
            format: 'banner',
            content: {
              title: 'Test Ad',
              description: 'Test Description',
              ctaText: 'Click Here',
              landingUrl: 'https://example.com',
              brandName: 'Test Brand'
            },
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 3600000).toISOString()
          }],
          metadata: { processingTime: 100, targetingScore: 0.8 },
          timestamp: new Date().toISOString(),
          ttl: 300
        })
      });

      const adManager = new AdManager({
        baseUrl: 'https://test-api.com',
        apiKey: 'test-key',
        timeout: 5000,
        retryAttempts: 3,
        fallbackConfig: {
          enabled: true,
          maxRetries: 3,
          retryDelay: 1000,
          fallbackAds: [],
          fallbackStrategy: 'default' as any
        },
        debugMode: false,
        enablePerformanceOptimization: true
      });

      const placement: AdPlacement = { id: 'test-placement', format: 'banner' };
      const context: AIContext = { topics: ['technology'] };

      const startTime = performance.now();
      
      // Benchmark multiple ad requests (sequential to test caching)
      for (let i = 0; i < 10; i++) {
        await adManager.requestAd(placement, context);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      // With caching, subsequent requests should be very fast
      expect(duration).toBeLessThan(500); // Should complete in less than 500ms

      const metrics = adManager.getPerformanceMetrics();
      expect(metrics.cacheStats?.hitRate).toBeGreaterThan(0.5);

      adManager.destroy();
    });

    it('should benchmark virtual scrolling performance', () => {
      document.body.innerHTML = '<div id="benchmark-container"></div>';
      
      const lazyLoader = new LazyLoader();
      const items = Array.from({ length: 10000 }, (_, i) => ({ id: i, text: `Item ${i}` }));
      
      const renderItem = (item: any) => {
        const div = document.createElement('div');
        div.textContent = item.text;
        div.style.height = '50px';
        return div;
      };

      const startTime = performance.now();
      
      const scroller = lazyLoader.createVirtualScroller('benchmark-container', items, renderItem, {
        itemHeight: 50,
        containerHeight: 400,
        overscan: 5
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Should initialize quickly
      expect(scroller).toBeDefined();

      lazyLoader.destroy();
    });
  });
});