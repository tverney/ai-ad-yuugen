import { CacheManager } from './cache-manager';
import { PerformanceMonitor } from './performance-monitor';
import { LazyLoader } from './lazy-loader';
import { AdManager } from './ad-manager';
import { 
  AdPlacement, 
  AIContext, 
  AdType, 
  AdFormat, 
  AdPosition,
  IntentCategory,
  SentimentLabel,
  ConversationPhase,
  EngagementTier,
  EngagementTrend
} from '@ai-yuugen/types';
import { type } from 'os';

/**
 * Benchmark results
 */
export interface BenchmarkResult {
  name: string;
  duration: number;
  operations: number;
  opsPerSecond: number;
  memoryUsage: number;
  details?: Record<string, any>;
}

/**
 * Benchmark suite for performance testing
 */
export class PerformanceBenchmark {
  private results: BenchmarkResult[] = [];

  /**
   * Run all benchmarks
   */
  async runAllBenchmarks(): Promise<BenchmarkResult[]> {
    console.log('🚀 Starting Performance Benchmarks...\n');

    await this.benchmarkCacheOperations();
    await this.benchmarkAdRequests();
    await this.benchmarkLazyLoading();
    await this.benchmarkVirtualScrolling();
    await this.benchmarkMemoryUsage();

    this.printResults();
    return this.results;
  }

  /**
   * Benchmark cache operations
   */
  private async benchmarkCacheOperations(): Promise<void> {
    console.log('📦 Benchmarking Cache Operations...');

    const cacheManager = new CacheManager({
      maxSize: 50 * 1024 * 1024, // 50MB
      maxEntries: 50000,
      defaultTtl: 300000
    });

    const operations = 10000;
    const testData = Array.from({ length: operations }, (_, i) => ({
      key: `cache-key-${i}`,
      value: {
        id: i,
        data: `test-data-${i}`,
        timestamp: Date.now(),
        metadata: { type: 'benchmark', size: 'medium' }
      }
    }));

    // Benchmark cache writes
    const writeStartTime = performance.now();
    for (const { key, value } of testData) {
      cacheManager.set(key, value);
    }
    const writeEndTime = performance.now();
    const writeDuration = writeEndTime - writeStartTime;

    // Benchmark cache reads
    const readStartTime = performance.now();
    for (const { key } of testData) {
      cacheManager.get(key);
    }
    const readEndTime = performance.now();
    const readDuration = readEndTime - readStartTime;

    const stats = cacheManager.getStats();

    this.results.push({
      name: 'Cache Writes',
      duration: writeDuration,
      operations,
      opsPerSecond: operations / (writeDuration / 1000),
      memoryUsage: this.getMemoryUsage(),
      details: {
        avgWriteTime: writeDuration / operations,
        cacheSize: stats.totalSize,
        entryCount: stats.entryCount
      }
    });

    this.results.push({
      name: 'Cache Reads',
      duration: readDuration,
      operations,
      opsPerSecond: operations / (readDuration / 1000),
      memoryUsage: this.getMemoryUsage(),
      details: {
        avgReadTime: readDuration / operations,
        hitRate: stats.hitRate,
        hits: stats.hits
      }
    });

    cacheManager.destroy();
    console.log('✅ Cache benchmarks completed\n');
  }

  /**
   * Benchmark ad requests with caching
   */
  private async benchmarkAdRequests(): Promise<void> {
    console.log('🎯 Benchmarking Ad Requests...');

    // Mock fetch for consistent testing
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        requestId: 'benchmark-request',
        ads: [{
          id: 'benchmark-ad',
          type: 'banner',
          format: AdFormat.DISPLAY,
          content: {
            title: 'Benchmark Ad',
            description: 'Test ad for benchmarking',
            ctaText: 'Click Here',
            landingUrl: 'https://example.com',
            brandName: 'Benchmark Brand'
          },
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        }],
        metadata: { processingTime: 50, targetingScore: 0.9 },
        timestamp: new Date().toISOString(),
        ttl: 300
      })
    });

    const adManager = new AdManager({
      baseUrl: 'https://benchmark-api.com',
      apiKey: 'benchmark-key',
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

    const placement: AdPlacement = { 
      id: 'benchmark-placement', 
      type: AdType.BANNER,
      format: AdFormat.DISPLAY,
      size: { width: 728, height: 90 },
      position: AdPosition.TOP
    };
    const contexts: AIContext[] = [
      { 
        topics: [{ name: 'technology', category: 'tech', confidence: 0.9, keywords: ['tech'], relevanceScore: 0.9 }], 
        intent: { primary: 'research', confidence: 0.8, category: IntentCategory.INFORMATIONAL, actionable: true },
        sentiment: { polarity: 0.5, magnitude: 0.5, label: SentimentLabel.NEUTRAL, confidence: 0.8 },
        conversationStage: { stage: ConversationPhase.EXPLORATION, progress: 0.5, duration: 1000, messageCount: 5 },
        userEngagement: { score: 0.7, level: EngagementTier.MEDIUM, indicators: [], trend: EngagementTrend.STABLE },
        confidence: 0.8,
        extractedAt: new Date()
      },
      { 
        topics: [{ name: 'sports', category: 'entertainment', confidence: 0.9, keywords: ['sports'], relevanceScore: 0.9 }], 
        intent: { primary: 'entertainment', confidence: 0.8, category: IntentCategory.ENTERTAINMENT, actionable: false },
        sentiment: { polarity: 0.5, magnitude: 0.5, label: SentimentLabel.NEUTRAL, confidence: 0.8 },
        conversationStage: { stage: ConversationPhase.EXPLORATION, progress: 0.5, duration: 1000, messageCount: 5 },
        userEngagement: { score: 0.7, level: EngagementTier.MEDIUM, indicators: [], trend: EngagementTrend.STABLE },
        confidence: 0.8,
        extractedAt: new Date()
      },
      { 
        topics: [{ name: 'finance', category: 'business', confidence: 0.9, keywords: ['finance'], relevanceScore: 0.9 }], 
        intent: { primary: 'purchase', confidence: 0.8, category: IntentCategory.TRANSACTIONAL, actionable: true },
        sentiment: { polarity: 0.5, magnitude: 0.5, label: SentimentLabel.NEUTRAL, confidence: 0.8 },
        conversationStage: { stage: ConversationPhase.DECISION_MAKING, progress: 0.7, duration: 1000, messageCount: 5 },
        userEngagement: { score: 0.8, level: EngagementTier.HIGH, indicators: [], trend: EngagementTrend.INCREASING },
        confidence: 0.8,
        extractedAt: new Date()
      },
      { 
        topics: [{ name: 'health', category: 'wellness', confidence: 0.9, keywords: ['health'], relevanceScore: 0.9 }], 
        intent: { primary: 'information', confidence: 0.8, category: IntentCategory.INFORMATIONAL, actionable: false },
        sentiment: { polarity: 0.5, magnitude: 0.5, label: SentimentLabel.NEUTRAL, confidence: 0.8 },
        conversationStage: { stage: ConversationPhase.EXPLORATION, progress: 0.5, duration: 1000, messageCount: 5 },
        userEngagement: { score: 0.6, level: EngagementTier.MEDIUM, indicators: [], trend: EngagementTrend.STABLE },
        confidence: 0.8,
        extractedAt: new Date()
      },
      { 
        topics: [{ name: 'travel', category: 'lifestyle', confidence: 0.9, keywords: ['travel'], relevanceScore: 0.9 }], 
        intent: { primary: 'booking', confidence: 0.8, category: IntentCategory.TRANSACTIONAL, actionable: true },
        sentiment: { polarity: 0.6, magnitude: 0.6, label: SentimentLabel.POSITIVE, confidence: 0.8 },
        conversationStage: { stage: ConversationPhase.DECISION_MAKING, progress: 0.8, duration: 1000, messageCount: 5 },
        userEngagement: { score: 0.8, level: EngagementTier.HIGH, indicators: [], trend: EngagementTrend.INCREASING },
        confidence: 0.8,
        extractedAt: new Date()
      }
    ];

    const operations = 1000;
    const requests: Array<{ placement: AdPlacement; context: AIContext }> = [];

    // Generate requests (some will be duplicates for cache testing)
    for (let i = 0; i < operations; i++) {
      requests.push({
        placement,
        context: contexts[i % contexts.length]
      });
    }

    // Benchmark ad requests
    const startTime = performance.now();
    const promises = requests.map(({ placement, context }) => 
      adManager.requestAd(placement, context)
    );
    await Promise.allSettled(promises);
    const endTime = performance.now();
    const duration = endTime - startTime;

    const metrics = adManager.getPerformanceMetrics();

    this.results.push({
      name: 'Ad Requests',
      duration,
      operations,
      opsPerSecond: operations / (duration / 1000),
      memoryUsage: this.getMemoryUsage(),
      details: {
        avgRequestTime: duration / operations,
        cacheHitRate: metrics.cacheStats?.hitRate || 0,
        networkRequests: (global.fetch as jest.Mock).mock.calls.length,
        performanceMetrics: metrics.performanceMetrics
      }
    });

    adManager.destroy();
    global.fetch = originalFetch;
    console.log('✅ Ad request benchmarks completed\n');
  }

  /**
   * Benchmark lazy loading
   */
  private async benchmarkLazyLoading(): Promise<void> {
    console.log('⚡ Benchmarking Lazy Loading...');

    const lazyLoader = new LazyLoader({
      rootMargin: '50px',
      threshold: 0.1,
      enablePreloading: true,
      chunkSize: 10
    });

    const componentCount = 1000;
    const components = Array.from({ length: componentCount }, (_, i) => {
      const element = document.createElement('div');
      element.id = `component-${i}`;
      document.body.appendChild(element);

      return {
        id: `component-${i}`,
        element,
        loader: async () => {
          await new Promise(resolve => setTimeout(resolve, 1));
          element.textContent = `Loaded Component ${i}`;
        },
        loaded: false,
        loading: false,
        priority: Math.floor(Math.random() * 10)
      };
    });

    // Benchmark component registration
    const registerStartTime = performance.now();
    for (const component of components) {
      lazyLoader.registerComponent(component);
    }
    const registerEndTime = performance.now();
    const registerDuration = registerEndTime - registerStartTime;

    // Benchmark component loading
    const loadStartTime = performance.now();
    const loadPromises = components.slice(0, 100).map(c => 
      lazyLoader.loadComponent(c.id)
    );
    await Promise.allSettled(loadPromises);
    const loadEndTime = performance.now();
    const loadDuration = loadEndTime - loadStartTime;

    this.results.push({
      name: 'Component Registration',
      duration: registerDuration,
      operations: componentCount,
      opsPerSecond: componentCount / (registerDuration / 1000),
      memoryUsage: this.getMemoryUsage(),
      details: {
        avgRegistrationTime: registerDuration / componentCount
      }
    });

    this.results.push({
      name: 'Component Loading',
      duration: loadDuration,
      operations: 100,
      opsPerSecond: 100 / (loadDuration / 1000),
      memoryUsage: this.getMemoryUsage(),
      details: {
        avgLoadTime: loadDuration / 100,
        loadedComponents: components.filter(c => c.loaded).length
      }
    });

    // Cleanup
    for (const component of components) {
      component.element.remove();
    }
    lazyLoader.destroy();
    console.log('✅ Lazy loading benchmarks completed\n');
  }

  /**
   * Benchmark virtual scrolling
   */
  private async benchmarkVirtualScrolling(): Promise<void> {
    console.log('📜 Benchmarking Virtual Scrolling...');

    document.body.innerHTML = '<div id="virtual-container" style="height: 400px; overflow: auto;"></div>';

    const lazyLoader = new LazyLoader();
    const itemCount = 100000;
    const items = Array.from({ length: itemCount }, (_, i) => ({
      id: i,
      text: `Virtual Item ${i}`,
      data: `Data for item ${i}`
    }));

    const renderItem = (item: any) => {
      const div = document.createElement('div');
      div.textContent = item.text;
      div.style.height = '50px';
      div.style.padding = '10px';
      div.style.borderBottom = '1px solid #eee';
      return div;
    };

    // Benchmark virtual scroller creation
    const createStartTime = performance.now();
    const scroller = lazyLoader.createVirtualScroller('virtual-container', items, renderItem, {
      itemHeight: 50,
      containerHeight: 400,
      overscan: 10,
      enableDynamicHeight: false
    });
    const createEndTime = performance.now();
    const createDuration = createEndTime - createStartTime;

    // Benchmark scrolling performance
    const container = document.getElementById('virtual-container')!;
    const scrollStartTime = performance.now();
    
    // Simulate scrolling
    for (let i = 0; i < 100; i++) {
      container.scrollTop = i * 50;
      await new Promise(resolve => setTimeout(resolve, 1));
    }
    
    const scrollEndTime = performance.now();
    const scrollDuration = scrollEndTime - scrollStartTime;

    this.results.push({
      name: 'Virtual Scroller Creation',
      duration: createDuration,
      operations: 1,
      opsPerSecond: 1 / (createDuration / 1000),
      memoryUsage: this.getMemoryUsage(),
      details: {
        itemCount,
        containerHeight: 400,
        itemHeight: 50
      }
    });

    this.results.push({
      name: 'Virtual Scrolling',
      duration: scrollDuration,
      operations: 100,
      opsPerSecond: 100 / (scrollDuration / 1000),
      memoryUsage: this.getMemoryUsage(),
      details: {
        avgScrollTime: scrollDuration / 100,
        renderedElements: container.children.length
      }
    });

    lazyLoader.destroy();
    console.log('✅ Virtual scrolling benchmarks completed\n');
  }

  /**
   * Benchmark memory usage
   */
  private async benchmarkMemoryUsage(): Promise<void> {
    console.log('💾 Benchmarking Memory Usage...');

    const initialMemory = this.getMemoryUsage();

    // Create multiple components to test memory usage
    const cacheManager = new CacheManager({
      maxSize: 100 * 1024 * 1024,
      maxEntries: 100000
    });

    const performanceMonitor = new PerformanceMonitor();
    const lazyLoader = new LazyLoader();

    // Fill cache with data
    for (let i = 0; i < 10000; i++) {
      cacheManager.set(`memory-test-${i}`, {
        id: i,
        data: 'x'.repeat(1000), // 1KB per entry
        metadata: { created: Date.now(), type: 'memory-test' }
      });
    }

    const afterCacheMemory = this.getMemoryUsage();

    // Create performance measurements
    for (let i = 0; i < 1000; i++) {
      performanceMonitor.startMeasurement(`test-${i}`);
      await new Promise(resolve => setTimeout(resolve, 1));
      performanceMonitor.endMeasurement(`test-${i}`);
    }

    const afterMonitorMemory = this.getMemoryUsage();

    // Create lazy components
    const components = Array.from({ length: 1000 }, (_, i) => ({
      id: `memory-component-${i}`,
      element: document.createElement('div'),
      loader: async () => {},
      loaded: false,
      loading: false,
      priority: 5
    }));

    for (const component of components) {
      lazyLoader.registerComponent(component);
    }

    const finalMemory = this.getMemoryUsage();

    this.results.push({
      name: 'Memory Usage',
      duration: 0,
      operations: 1,
      opsPerSecond: 0,
      memoryUsage: finalMemory,
      details: {
        initialMemory,
        afterCacheMemory,
        afterMonitorMemory,
        finalMemory,
        cacheMemoryIncrease: afterCacheMemory - initialMemory,
        monitorMemoryIncrease: afterMonitorMemory - afterCacheMemory,
        lazyLoaderMemoryIncrease: finalMemory - afterMonitorMemory,
        totalMemoryIncrease: finalMemory - initialMemory
      }
    });

    // Cleanup
    cacheManager.destroy();
    performanceMonitor.destroy();
    lazyLoader.destroy();

    console.log('✅ Memory usage benchmarks completed\n');
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize / (1024 * 1024); // MB
    }
    return 0;
  }

  /**
   * Print benchmark results
   */
  private printResults(): void {
    console.log('📊 Benchmark Results:');
    console.log('=' .repeat(80));
    
    for (const result of this.results) {
      console.log(`\n🎯 ${result.name}`);
      console.log(`   Duration: ${result.duration.toFixed(2)}ms`);
      console.log(`   Operations: ${result.operations.toLocaleString()}`);
      console.log(`   Ops/sec: ${result.opsPerSecond.toFixed(0).toLocaleString()}`);
      console.log(`   Memory: ${result.memoryUsage.toFixed(2)}MB`);
      
      if (result.details) {
        console.log('   Details:');
        for (const [key, value] of Object.entries(result.details)) {
          if (typeof value === 'number') {
            console.log(`     ${key}: ${value.toFixed(2)}`);
          } else {
            console.log(`     ${key}: ${value}`);
          }
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('🏁 All benchmarks completed!');
  }

  /**
   * Export results to JSON
   */
  exportResults(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      environment: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
        platform: typeof navigator !== 'undefined' ? navigator.platform : process.platform,
        memory: this.getMemoryUsage()
      },
      results: this.results
    }, null, 2);
  }
}

// Export for use in tests and standalone execution
export default PerformanceBenchmark;