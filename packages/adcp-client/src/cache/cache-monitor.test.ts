/**
 * Tests for cache monitor
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CacheMonitor, CacheStatsEndpoint } from './cache-monitor';
import { CacheStats } from '../types/adcp-types';
import { createLogger } from '../utils/logger';

describe('CacheMonitor', () => {
  let monitor: CacheMonitor;
  let logger: ReturnType<typeof createLogger>;

  beforeEach(() => {
    logger = createLogger({ prefix: 'test' });
    monitor = new CacheMonitor(logger);
  });

  afterEach(() => {
    monitor.destroy();
  });

  describe('recordLatency', () => {
    it('should record latency values', () => {
      monitor.recordLatency(10);
      monitor.recordLatency(20);
      monitor.recordLatency(30);

      const baseStats: CacheStats = {
        hits: 3,
        misses: 0,
        hitRatio: 1,
        size: 10,
        evictions: 0
      };

      const metrics = monitor.getMetrics(baseStats);

      expect(metrics.avgLatency).toBe(20);
    });

    it('should limit stored samples', () => {
      // Record more than max samples
      for (let i = 0; i < 1500; i++) {
        monitor.recordLatency(i);
      }

      const baseStats: CacheStats = {
        hits: 1500,
        misses: 0,
        hitRatio: 1,
        size: 10,
        evictions: 0
      };

      const metrics = monitor.getMetrics(baseStats);

      // Should only keep last 1000 samples
      expect(metrics.avgLatency).toBeGreaterThan(500);
    });
  });

  describe('recordError', () => {
    it('should record error count', () => {
      monitor.recordError(new Error('Test error 1'));
      monitor.recordError('Test error 2');

      const baseStats: CacheStats = {
        hits: 0,
        misses: 0,
        hitRatio: 0,
        size: 0,
        evictions: 0
      };

      const metrics = monitor.getMetrics(baseStats);

      expect(metrics.errorCount).toBe(2);
      expect(metrics.lastError).toBe('Test error 2');
    });
  });

  describe('getMetrics', () => {
    it('should calculate average latency', () => {
      monitor.recordLatency(10);
      monitor.recordLatency(20);
      monitor.recordLatency(30);

      const baseStats: CacheStats = {
        hits: 3,
        misses: 0,
        hitRatio: 1,
        size: 10,
        evictions: 0
      };

      const metrics = monitor.getMetrics(baseStats);

      expect(metrics.avgLatency).toBe(20);
    });

    it('should calculate p95 latency', () => {
      for (let i = 1; i <= 100; i++) {
        monitor.recordLatency(i);
      }

      const baseStats: CacheStats = {
        hits: 100,
        misses: 0,
        hitRatio: 1,
        size: 10,
        evictions: 0
      };

      const metrics = monitor.getMetrics(baseStats);

      expect(metrics.p95Latency).toBe(95);
    });

    it('should calculate p99 latency', () => {
      for (let i = 1; i <= 100; i++) {
        monitor.recordLatency(i);
      }

      const baseStats: CacheStats = {
        hits: 100,
        misses: 0,
        hitRatio: 1,
        size: 10,
        evictions: 0
      };

      const metrics = monitor.getMetrics(baseStats);

      expect(metrics.p99Latency).toBe(99);
    });

    it('should handle zero latency samples', () => {
      const baseStats: CacheStats = {
        hits: 0,
        misses: 0,
        hitRatio: 0,
        size: 0,
        evictions: 0
      };

      const metrics = monitor.getMetrics(baseStats);

      expect(metrics.avgLatency).toBe(0);
      expect(metrics.p95Latency).toBe(0);
      expect(metrics.p99Latency).toBe(0);
    });

    it('should include timestamp', () => {
      const baseStats: CacheStats = {
        hits: 0,
        misses: 0,
        hitRatio: 0,
        size: 0,
        evictions: 0
      };

      const metrics = monitor.getMetrics(baseStats);

      expect(metrics.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('checkAlerts', () => {
    beforeEach(() => {
      monitor = new CacheMonitor(logger, {
        alertThresholds: {
          hitRatio: 0.8,
          errorRate: 0.01,
          latency: 100
        }
      });
    });

    it('should alert on low hit ratio', () => {
      const metrics = {
        hits: 70,
        misses: 30,
        hitRatio: 0.7,
        size: 100,
        evictions: 0,
        avgLatency: 50,
        p95Latency: 80,
        p99Latency: 90,
        errorCount: 0,
        timestamp: new Date()
      };

      const alerts = monitor.checkAlerts(metrics);

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toContain('hit ratio');
    });

    it('should alert on high error rate', () => {
      const metrics = {
        hits: 95,
        misses: 5,
        hitRatio: 0.95,
        size: 100,
        evictions: 0,
        avgLatency: 50,
        p95Latency: 80,
        p99Latency: 90,
        errorCount: 5,
        timestamp: new Date()
      };

      const alerts = monitor.checkAlerts(metrics);

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toContain('error rate');
    });

    it('should alert on high latency', () => {
      const metrics = {
        hits: 90,
        misses: 10,
        hitRatio: 0.9,
        size: 100,
        evictions: 0,
        avgLatency: 80,
        p95Latency: 150,
        p99Latency: 200,
        errorCount: 0,
        timestamp: new Date()
      };

      const alerts = monitor.checkAlerts(metrics);

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toContain('latency');
    });

    it('should return no alerts when all metrics are healthy', () => {
      const metrics = {
        hits: 90,
        misses: 10,
        hitRatio: 0.9,
        size: 100,
        evictions: 0,
        avgLatency: 50,
        p95Latency: 80,
        p99Latency: 90,
        errorCount: 0,
        timestamp: new Date()
      };

      const alerts = monitor.checkAlerts(metrics);

      expect(alerts).toHaveLength(0);
    });

    it('should return multiple alerts when multiple thresholds exceeded', () => {
      const metrics = {
        hits: 70,
        misses: 30,
        hitRatio: 0.7,
        size: 100,
        evictions: 0,
        avgLatency: 80,
        p95Latency: 150,
        p99Latency: 200,
        errorCount: 5,
        timestamp: new Date()
      };

      const alerts = monitor.checkAlerts(metrics);

      expect(alerts.length).toBeGreaterThan(1);
    });
  });

  describe('reset', () => {
    it('should reset all metrics', () => {
      monitor.recordLatency(10);
      monitor.recordLatency(20);
      monitor.recordError(new Error('Test'));

      monitor.reset();

      const baseStats: CacheStats = {
        hits: 0,
        misses: 0,
        hitRatio: 0,
        size: 0,
        evictions: 0
      };

      const metrics = monitor.getMetrics(baseStats);

      expect(metrics.avgLatency).toBe(0);
      expect(metrics.errorCount).toBe(0);
      expect(metrics.lastError).toBeUndefined();
    });
  });

  describe('periodic reporting', () => {
    it('should start periodic reporting', () => {
      vi.useFakeTimers();

      const reportMonitor = new CacheMonitor(logger, {
        reportInterval: 1000
      });

      monitor.recordLatency(10);

      vi.advanceTimersByTime(1000);

      reportMonitor.destroy();
      vi.useRealTimers();
    });

    it('should stop periodic reporting', () => {
      vi.useFakeTimers();

      const reportMonitor = new CacheMonitor(logger, {
        reportInterval: 1000
      });

      reportMonitor.stopPeriodicReporting();

      vi.advanceTimersByTime(2000);

      reportMonitor.destroy();
      vi.useRealTimers();
    });
  });
});

describe('CacheStatsEndpoint', () => {
  let endpoint: CacheStatsEndpoint;
  let monitor: CacheMonitor;
  let logger: ReturnType<typeof createLogger>;

  beforeEach(() => {
    logger = createLogger({ prefix: 'test' });
    monitor = new CacheMonitor(logger, {
      alertThresholds: {
        hitRatio: 0.8,
        errorRate: 0.01,
        latency: 100
      }
    });

    const getStats = async (): Promise<CacheStats> => ({
      hits: 90,
      misses: 10,
      hitRatio: 0.9,
      size: 100,
      evictions: 5
    });

    endpoint = new CacheStatsEndpoint(getStats, monitor);
  });

  afterEach(() => {
    monitor.destroy();
  });

  describe('getStats', () => {
    it('should return comprehensive metrics', async () => {
      // Create a new monitor for this test
      const testMonitor = new CacheMonitor(logger);
      testMonitor.recordLatency(10);
      testMonitor.recordLatency(20);

      const getStats = async (): Promise<CacheStats> => ({
        hits: 90,
        misses: 10,
        hitRatio: 0.9,
        size: 100,
        evictions: 5
      });

      const testEndpoint = new CacheStatsEndpoint(getStats, testMonitor);
      const stats = await testEndpoint.getStats();

      expect(stats.hits).toBe(90);
      expect(stats.misses).toBe(10);
      expect(stats.hitRatio).toBe(0.9);
      expect(stats.avgLatency).toBeDefined();
      expect(stats.p95Latency).toBeDefined();
      expect(stats.p99Latency).toBeDefined();
      expect(stats.timestamp).toBeInstanceOf(Date);
      
      testMonitor.destroy();
    });
  });

  describe('getHealth', () => {
    it('should return healthy status when all metrics are good', async () => {
      const health = await endpoint.getHealth();

      expect(health.healthy).toBe(true);
      expect(health.alerts).toHaveLength(0);
      expect(health.metrics).toBeDefined();
    });

    it('should return unhealthy status when alerts are triggered', async () => {
      // Create a new monitor with thresholds for this test
      const alertMonitor = new CacheMonitor(logger, {
        alertThresholds: {
          hitRatio: 0.8,
          errorRate: 0.01,
          latency: 100
        }
      });

      const getStatsWithLowHitRatio = async (): Promise<CacheStats> => ({
        hits: 70,
        misses: 30,
        hitRatio: 0.7,
        size: 100,
        evictions: 5
      });

      const alertEndpoint = new CacheStatsEndpoint(getStatsWithLowHitRatio, alertMonitor);

      const health = await alertEndpoint.getHealth();

      expect(health.healthy).toBe(false);
      expect(health.alerts.length).toBeGreaterThan(0);
      
      alertMonitor.destroy();
    });
  });

  describe('reset', () => {
    it('should reset monitor statistics', () => {
      monitor.recordLatency(10);
      monitor.recordError(new Error('Test'));

      endpoint.reset();

      const baseStats: CacheStats = {
        hits: 0,
        misses: 0,
        hitRatio: 0,
        size: 0,
        evictions: 0
      };

      const metrics = monitor.getMetrics(baseStats);

      expect(metrics.errorCount).toBe(0);
    });
  });
});
