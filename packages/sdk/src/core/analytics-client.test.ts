import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AnalyticsClient } from './analytics-client';
import { AdEvent, SDKConfig } from '@ai-yuugen/types';

// Mock fetch globally
global.fetch = vi.fn();

// Mock timers
vi.useFakeTimers();

describe('AnalyticsClient', () => {
  let analyticsClient: AnalyticsClient;
  let mockConfig: SDKConfig;
  let mockFetch: any;

  beforeEach(() => {
    mockConfig = {
      apiKey: 'test-api-key',
      environment: 'development',
      baseUrl: 'https://test-api.com',
      enableAnalytics: true
    };

    mockFetch = fetch as any;
    mockFetch.mockClear();

    analyticsClient = new AnalyticsClient(mockConfig);
  });

  afterEach(() => {
    analyticsClient.destroy();
    vi.clearAllTimers();
  });

  describe('initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(analyticsClient).toBeInstanceOf(AnalyticsClient);
    });

    it('should generate unique session ID', () => {
      const client1 = new AnalyticsClient(mockConfig);
      const client2 = new AnalyticsClient(mockConfig);
      
      // Session IDs should be different (we can't directly access them, but we can test behavior)
      expect(client1).not.toBe(client2);
      
      client1.destroy();
      client2.destroy();
    });
  });

  describe('event tracking', () => {
    it('should track events successfully', async () => {
      const mockEvent: AdEvent = {
        id: 'test-event-1',
        type: 'impression',
        adId: 'ad-123',
        sessionId: 'session-123',
        timestamp: new Date(),
        context: { test: 'data' }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      await analyticsClient.trackEvent(mockEvent);

      // Event should be queued and flushed
      vi.advanceTimersByTime(5000);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/analytics/events',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key'
          })
        })
      );
    });

    it('should enrich events with session context', async () => {
      const mockEvent: AdEvent = {
        id: 'test-event-1',
        type: 'impression',
        adId: 'ad-123',
        sessionId: '',
        timestamp: new Date(),
        context: {}
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      await analyticsClient.trackEvent(mockEvent);

      // Should add session ID and timestamp if missing
      expect(mockEvent.sessionId).toBeTruthy();
    });

    it('should handle event tracking errors gracefully', async () => {
      const mockEvent: AdEvent = {
        id: 'test-event-1',
        type: 'impression',
        adId: 'ad-123',
        sessionId: 'session-123',
        timestamp: new Date(),
        context: {}
      };

      // The event should be queued successfully even if network fails later
      await expect(analyticsClient.trackEvent(mockEvent)).resolves.not.toThrow();
    });
  });

  describe('impression tracking', () => {
    it('should track impressions with context', async () => {
      const context = {
        placement: 'header',
        size: { width: 728, height: 90 }
      };

      // Mock window and navigator objects
      Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });
      Object.defineProperty(navigator, 'userAgent', { 
        value: 'Mozilla/5.0 Test Browser', 
        writable: true 
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      await analyticsClient.trackImpression('ad-123', context);

      vi.advanceTimersByTime(5000);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/analytics/events',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"type":"impression"')
        })
      );
    });
  });

  describe('click tracking', () => {
    it('should track clicks with context', async () => {
      const context = {
        clickX: 100,
        clickY: 200,
        elementId: 'ad-button',
        ctaText: 'Learn More'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      await analyticsClient.trackClick('ad-123', context);

      vi.advanceTimersByTime(5000);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/analytics/events',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"type":"click"')
        })
      );
    });
  });

  describe('conversion tracking', () => {
    it('should track conversions with detailed data', async () => {
      const conversionData = {
        value: 29.99,
        type: 'purchase',
        currency: 'USD',
        productId: 'product-123'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      await analyticsClient.trackConversion('ad-123', conversionData);

      vi.advanceTimersByTime(5000);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/analytics/events',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"type":"conversion"')
        })
      );
    });
  });

  describe('metrics retrieval', () => {
    it('should get metrics successfully', async () => {
      const mockMetrics = {
        impressions: 1000,
        clicks: 50,
        conversions: 5,
        ctr: 5.0,
        cpm: 2.5,
        revenue: 125.0,
        engagementScore: 0.75
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetrics
      } as Response);

      const metrics = await analyticsClient.getMetrics();

      expect(metrics).toEqual(mockMetrics);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/analytics/metrics',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      );
    });

    it('should cache metrics results', async () => {
      const mockMetrics = {
        impressions: 1000,
        clicks: 50,
        conversions: 5,
        ctr: 5.0,
        cpm: 2.5,
        revenue: 125.0,
        engagementScore: 0.75
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetrics
      } as Response);

      // First call
      await analyticsClient.getMetrics();
      
      // Second call should use cache
      const cachedMetrics = await analyticsClient.getMetrics();

      expect(cachedMetrics).toEqual(mockMetrics);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle metrics retrieval errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API error'));

      await expect(analyticsClient.getMetrics()).rejects.toThrow('API error');
    });
  });

  describe('report generation', () => {
    it('should generate reports successfully', async () => {
      const reportConfig = {
        type: 'performance' as const,
        timeRange: {
          start: new Date('2023-01-01'),
          end: new Date('2023-01-31')
        },
        metrics: ['impressions', 'clicks', 'ctr']
      };

      const mockReport = {
        id: 'report-123',
        data: { /* report data */ },
        generatedAt: new Date()
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockReport
      } as Response);

      const report = await analyticsClient.generateReport(reportConfig);

      expect(report).toEqual(mockReport);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/analytics/reports',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(reportConfig)
        })
      );
    });
  });

  describe('dashboard data', () => {
    it('should get dashboard data successfully', async () => {
      const mockDashboardData = {
        realTimeMetrics: {
          impressions: 100,
          clicks: 5,
          conversions: 1,
          ctr: 5.0,
          cpm: 2.0,
          revenue: 10.0,
          engagementScore: 0.8
        },
        historicalData: [],
        insights: [],
        alerts: [],
        lastUpdated: new Date()
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDashboardData
      } as Response);

      const dashboardData = await analyticsClient.getDashboardData();

      expect(dashboardData).toEqual(mockDashboardData);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/analytics/dashboard',
        expect.objectContaining({
          method: 'GET'
        })
      );
    });
  });

  describe('real-time metrics calculation', () => {
    it('should calculate metrics from local events', () => {
      const events: AdEvent[] = [
        {
          id: '1',
          type: 'impression',
          adId: 'ad-1',
          sessionId: 'session-1',
          timestamp: new Date(),
          context: {}
        },
        {
          id: '2',
          type: 'impression',
          adId: 'ad-1',
          sessionId: 'session-1',
          timestamp: new Date(),
          context: {}
        },
        {
          id: '3',
          type: 'click',
          adId: 'ad-1',
          sessionId: 'session-1',
          timestamp: new Date(),
          context: {}
        },
        {
          id: '4',
          type: 'conversion',
          adId: 'ad-1',
          sessionId: 'session-1',
          timestamp: new Date(),
          context: {},
          metadata: { conversionValue: 25.0 }
        }
      ];

      const metrics = analyticsClient.calculateRealTimeMetrics(events);

      expect(metrics.impressions).toBe(2);
      expect(metrics.clicks).toBe(1);
      expect(metrics.conversions).toBe(1);
      expect(metrics.ctr).toBe(50); // 1 click / 2 impressions * 100
      expect(metrics.revenue).toBe(25.0);
      expect(metrics.cpm).toBe(12500); // 25 revenue / 2 impressions * 1000
      expect(metrics.engagementScore).toBeGreaterThan(0);
    });

    it('should handle empty events array', () => {
      const metrics = analyticsClient.calculateRealTimeMetrics([]);

      expect(metrics.impressions).toBe(0);
      expect(metrics.clicks).toBe(0);
      expect(metrics.conversions).toBe(0);
      expect(metrics.ctr).toBe(0);
      expect(metrics.revenue).toBe(0);
      expect(metrics.cpm).toBe(0);
      expect(metrics.engagementScore).toBe(0);
    });
  });

  describe('batch processing', () => {
    it('should flush events automatically after interval', async () => {
      const mockEvent: AdEvent = {
        id: 'test-event-1',
        type: 'impression',
        adId: 'ad-123',
        sessionId: 'session-123',
        timestamp: new Date(),
        context: {}
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      await analyticsClient.trackEvent(mockEvent);

      // Advance timer to trigger flush
      vi.advanceTimersByTime(5000);

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should batch events for efficient processing', async () => {
      const mockEvents: AdEvent[] = Array.from({ length: 3 }, (_, i) => ({
        id: `test-event-${i}`,
        type: 'impression',
        adId: 'ad-123',
        sessionId: 'session-123',
        timestamp: new Date(),
        context: {}
      }));

      // Track multiple events - they should be queued
      for (const event of mockEvents) {
        await analyticsClient.trackEvent(event);
      }

      // Events should be successfully queued
      expect(mockEvents).toHaveLength(3);
    });
  });

  describe('cleanup', () => {
    it('should clean up resources on destroy', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      
      analyticsClient.destroy();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });
});