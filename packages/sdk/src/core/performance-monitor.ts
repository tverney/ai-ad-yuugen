import { sdkLogger } from './logger';

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  // Timing metrics
  adRequestTime: number;
  adRenderTime: number;
  totalLoadTime: number;
  cacheHitRate: number;
  
  // Resource metrics
  memoryUsage: number;
  bundleSize: number;
  networkRequests: number;
  
  // User experience metrics
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  
  // SDK specific metrics
  initializationTime: number;
  contextAnalysisTime: number;
  targetingTime: number;
  
  // Error metrics
  errorRate: number;
  timeoutRate: number;
  fallbackRate: number;
}

/**
 * Performance thresholds for optimization
 */
export interface PerformanceThresholds {
  adRequestTime: number; // Max acceptable ad request time (ms)
  adRenderTime: number; // Max acceptable ad render time (ms)
  memoryUsage: number; // Max acceptable memory usage (MB)
  errorRate: number; // Max acceptable error rate (0-1)
  cacheHitRate: number; // Min acceptable cache hit rate (0-1)
}

/**
 * Performance optimization suggestions
 */
export interface OptimizationSuggestion {
  type: 'cache' | 'network' | 'rendering' | 'memory' | 'bundle';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  action: string;
  impact: string;
  implementation?: () => void;
}

/**
 * Performance measurement entry
 */
interface PerformanceMeasurement {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

/**
 * Performance monitoring and optimization system
 */
export class PerformanceMonitor {
  private measurements = new Map<string, PerformanceMeasurement>();
  private metrics: Partial<PerformanceMetrics> = {};
  private thresholds: PerformanceThresholds;
  private optimizations: OptimizationSuggestion[] = [];
  private observers: PerformanceObserver[] = [];
  private monitoringEnabled = true;
  private reportingInterval: NodeJS.Timeout | null = null;

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = {
      adRequestTime: 2000, // 2 seconds
      adRenderTime: 500, // 500ms
      memoryUsage: 50, // 50MB
      errorRate: 0.05, // 5%
      cacheHitRate: 0.7, // 70%
      ...thresholds
    };

    this.initializeWebVitals();
    this.startPerformanceReporting();
  }

  /**
   * Start measuring a performance metric
   */
  startMeasurement(name: string, metadata?: Record<string, any>): void {
    if (!this.monitoringEnabled) return;

    const measurement: PerformanceMeasurement = {
      name,
      startTime: performance.now(),
      metadata
    };

    this.measurements.set(name, measurement);
    sdkLogger.debug('Started performance measurement', { name, metadata });
  }

  /**
   * End measuring a performance metric
   */
  endMeasurement(name: string): number | null {
    if (!this.monitoringEnabled) return null;

    const measurement = this.measurements.get(name);
    if (!measurement) {
      sdkLogger.warn('No measurement found for name', { name });
      return null;
    }

    measurement.endTime = performance.now();
    measurement.duration = measurement.endTime - measurement.startTime;

    sdkLogger.debug('Ended performance measurement', {
      name,
      duration: measurement.duration,
      metadata: measurement.metadata
    });

    // Update metrics based on measurement type
    this.updateMetrics(name, measurement.duration);

    // Check for optimization opportunities
    this.checkOptimizations(name, measurement.duration);

    return measurement.duration;
  }

  /**
   * Measure a function execution time
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    this.startMeasurement(name, metadata);
    try {
      const result = await fn();
      return result;
    } finally {
      this.endMeasurement(name);
    }
  }

  /**
   * Measure a synchronous function execution time
   */
  measure<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    this.startMeasurement(name, metadata);
    try {
      const result = fn();
      return result;
    } finally {
      this.endMeasurement(name);
    }
  }

  /**
   * Record a custom metric
   */
  recordMetric(name: keyof PerformanceMetrics, value: number): void {
    if (!this.monitoringEnabled) return;

    this.metrics[name] = value;
    sdkLogger.debug('Recorded custom metric', { name, value });

    // Check thresholds
    this.checkThreshold(name, value);
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  /**
   * Get optimization suggestions
   */
  getOptimizationSuggestions(): OptimizationSuggestion[] {
    return [...this.optimizations];
  }

  /**
   * Apply automatic optimizations
   */
  applyAutomaticOptimizations(): void {
    const autoOptimizations = this.optimizations.filter(opt => opt.implementation);
    
    for (const optimization of autoOptimizations) {
      try {
        optimization.implementation!();
        sdkLogger.info('Applied automatic optimization', {
          type: optimization.type,
          message: optimization.message
        });
      } catch (error) {
        sdkLogger.error('Failed to apply optimization', {
          type: optimization.type,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Remove applied optimizations
    this.optimizations = this.optimizations.filter(opt => !opt.implementation);
  }

  /**
   * Initialize Web Vitals monitoring
   */
  private initializeWebVitals(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return;
    }

    try {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        this.recordMetric('largestContentfulPaint', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          this.recordMetric('firstInputDelay', (entry as any).processingStart - entry.startTime);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        for (const entry of entries) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        this.recordMetric('cumulativeLayoutShift', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);

      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric('firstContentfulPaint', entry.startTime);
          }
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(fcpObserver);

    } catch (error) {
      sdkLogger.warn('Failed to initialize Web Vitals monitoring', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update metrics based on measurement
   */
  private updateMetrics(name: string, duration: number): void {
    switch (name) {
      case 'ad-request':
        this.metrics.adRequestTime = duration;
        break;
      case 'ad-render':
        this.metrics.adRenderTime = duration;
        break;
      case 'sdk-initialization':
        this.metrics.initializationTime = duration;
        break;
      case 'context-analysis':
        this.metrics.contextAnalysisTime = duration;
        break;
      case 'targeting':
        this.metrics.targetingTime = duration;
        break;
      case 'total-load':
        this.metrics.totalLoadTime = duration;
        break;
    }
  }

  /**
   * Check for optimization opportunities
   */
  private checkOptimizations(name: string, duration: number): void {
    switch (name) {
      case 'ad-request':
        if (duration > this.thresholds.adRequestTime) {
          this.addOptimization({
            type: 'network',
            severity: duration > this.thresholds.adRequestTime * 2 ? 'high' : 'medium',
            message: `Ad request time (${Math.round(duration)}ms) exceeds threshold (${this.thresholds.adRequestTime}ms)`,
            action: 'Enable request caching and preloading',
            impact: 'Reduce ad request latency by 50-80%'
          });
        }
        break;

      case 'ad-render':
        if (duration > this.thresholds.adRenderTime) {
          this.addOptimization({
            type: 'rendering',
            severity: duration > this.thresholds.adRenderTime * 2 ? 'high' : 'medium',
            message: `Ad render time (${Math.round(duration)}ms) exceeds threshold (${this.thresholds.adRenderTime}ms)`,
            action: 'Implement lazy loading and virtual scrolling',
            impact: 'Improve render performance by 30-60%'
          });
        }
        break;

      case 'sdk-initialization':
        if (duration > 1000) { // 1 second threshold for initialization
          this.addOptimization({
            type: 'bundle',
            severity: 'medium',
            message: `SDK initialization time (${Math.round(duration)}ms) is slow`,
            action: 'Split SDK into smaller chunks and lazy load components',
            impact: 'Reduce initialization time by 40-70%'
          });
        }
        break;
    }
  }

  /**
   * Check threshold violations
   */
  private checkThreshold(name: keyof PerformanceMetrics, value: number): void {
    const threshold = this.thresholds[name as keyof PerformanceThresholds];
    if (threshold === undefined) return;

    const isViolation = name === 'cacheHitRate' ? value < threshold : value > threshold;
    
    if (isViolation) {
      const severity = this.calculateSeverity(name, value, threshold);
      this.addOptimization({
        type: this.getOptimizationType(name),
        severity,
        message: `${name} (${value}) violates threshold (${threshold})`,
        action: this.getOptimizationAction(name),
        impact: this.getOptimizationImpact(name)
      });
    }
  }

  /**
   * Calculate severity based on threshold violation
   */
  private calculateSeverity(name: keyof PerformanceMetrics, value: number, threshold: number): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = name === 'cacheHitRate' ? threshold / value : value / threshold;
    
    if (ratio > 3) return 'critical';
    if (ratio > 2) return 'high';
    if (ratio > 1.5) return 'medium';
    return 'low';
  }

  /**
   * Get optimization type for metric
   */
  private getOptimizationType(name: keyof PerformanceMetrics): OptimizationSuggestion['type'] {
    switch (name) {
      case 'cacheHitRate':
        return 'cache';
      case 'memoryUsage':
        return 'memory';
      case 'bundleSize':
        return 'bundle';
      case 'adRequestTime':
      case 'networkRequests':
        return 'network';
      default:
        return 'rendering';
    }
  }

  /**
   * Get optimization action for metric
   */
  private getOptimizationAction(name: keyof PerformanceMetrics): string {
    switch (name) {
      case 'cacheHitRate':
        return 'Improve cache strategy and preloading';
      case 'memoryUsage':
        return 'Implement memory cleanup and object pooling';
      case 'bundleSize':
        return 'Enable code splitting and tree shaking';
      case 'adRequestTime':
        return 'Optimize network requests and enable caching';
      case 'errorRate':
        return 'Improve error handling and fallback mechanisms';
      default:
        return 'Optimize rendering performance';
    }
  }

  /**
   * Get optimization impact for metric
   */
  private getOptimizationImpact(name: keyof PerformanceMetrics): string {
    switch (name) {
      case 'cacheHitRate':
        return 'Reduce load times by 60-90%';
      case 'memoryUsage':
        return 'Reduce memory usage by 30-50%';
      case 'bundleSize':
        return 'Reduce bundle size by 20-40%';
      case 'adRequestTime':
        return 'Improve request speed by 40-80%';
      default:
        return 'Improve overall performance by 20-50%';
    }
  }

  /**
   * Add optimization suggestion
   */
  private addOptimization(optimization: OptimizationSuggestion): void {
    // Avoid duplicate suggestions
    const exists = this.optimizations.some(opt => 
      opt.type === optimization.type && opt.message === optimization.message
    );
    
    if (!exists) {
      this.optimizations.push(optimization);
      sdkLogger.info('Added optimization suggestion', optimization);
    }
  }

  /**
   * Monitor memory usage
   */
  private monitorMemoryUsage(): void {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / (1024 * 1024);
      this.recordMetric('memoryUsage', usedMB);
    }
  }

  /**
   * Monitor bundle size
   */
  private monitorBundleSize(): void {
    if (typeof navigator !== 'undefined' && (navigator as any).connection) {
      const connection = (navigator as any).connection;
      // Estimate bundle size based on transfer size
      if (connection.transferSize) {
        this.recordMetric('bundleSize', connection.transferSize / 1024); // KB
      }
    }
  }

  /**
   * Start performance reporting
   */
  private startPerformanceReporting(): void {
    this.reportingInterval = setInterval(() => {
      this.monitorMemoryUsage();
      this.monitorBundleSize();
      this.generatePerformanceReport();
    }, 30000); // Report every 30 seconds
  }

  /**
   * Generate performance report
   */
  private generatePerformanceReport(): void {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      optimizations: this.getOptimizationSuggestions(),
      thresholdViolations: this.getThresholdViolations()
    };

    sdkLogger.info('Performance report generated', report);

    // Apply automatic optimizations if enabled
    if (this.optimizations.length > 0) {
      this.applyAutomaticOptimizations();
    }
  }

  /**
   * Get threshold violations
   */
  private getThresholdViolations(): Array<{ metric: string; value: number; threshold: number }> {
    const violations: Array<{ metric: string; value: number; threshold: number }> = [];

    for (const [metric, value] of Object.entries(this.metrics)) {
      const threshold = this.thresholds[metric as keyof PerformanceThresholds];
      if (threshold !== undefined && value !== undefined) {
        const isViolation = metric === 'cacheHitRate' ? value < threshold : value > threshold;
        if (isViolation) {
          violations.push({ metric, value, threshold });
        }
      }
    }

    return violations;
  }

  /**
   * Enable/disable monitoring
   */
  setMonitoringEnabled(enabled: boolean): void {
    this.monitoringEnabled = enabled;
    sdkLogger.info('Performance monitoring', { enabled });
  }

  /**
   * Reset all metrics and measurements
   */
  reset(): void {
    this.measurements.clear();
    this.metrics = {};
    this.optimizations = [];
    sdkLogger.info('Performance monitor reset');
  }

  /**
   * Destroy performance monitor
   */
  destroy(): void {
    // Clear reporting interval
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
      this.reportingInterval = null;
    }

    // Disconnect observers
    for (const observer of this.observers) {
      observer.disconnect();
    }
    this.observers = [];

    // Clear data
    this.reset();
    
    sdkLogger.info('Performance monitor destroyed');
  }
}