import { describe, it, expect, beforeEach, afterEach, vi, describe } from 'vitest';
import { AnalyticsService } from './analytics-service';
import { AdEvent } from '@ai-yuugen/types';

// Mock timers
vi.useFakeTimers();

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let mockConfig: any;

  beforeEach(() => {
    mockConfig = {
      enableRealTimeProcessing: true,
      aggregationInterval: 60000,
      retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
      alertThresholds: {
        lowCTR: 1.0,
        highCPM: 10.0,
        lowRevenue: 100.0,
        errorRate: 5.0
      }
    };

    analyticsService = new AnalyticsService(mockConfig);
  });

  afterEach(() => {
    analyticsService.destroy();
    vi.clearAllTimers();
  });

  describe('initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(analyticsService).toBeInstanceOf(AnalyticsService);
    });
  });

  describe('event processing', () => {
    it('should process event batch successfully', async () => {
      const events: AdEvent[] = [
        {
          id: 'event-1',
          type: 'impression',
          adId: 'ad-123',
          sessionId: 'session-123',
          timestamp: new Date(),
          context: {}
        },
        {
          id: 'event-2',
          type: 'click',
          adId: 'ad-123',
          sessionId: 'session-123',
          timestamp: new Date(),
          context: {}
        }
      ];

      const batch = {
        events,
        timestamp: new Date(),
        sessionId: 'session-123'
      };

      await expect(analyticsService.processEventBatch(batch)).resolves.not.toThrow();
    });

    it('should filter out invalid events', async () => {
      const events: AdEvent[] = [
        {
          id: 'event-1',
          type: 'impression',
          adId: 'ad-123',
          sessionId: 'session-123',
          timestamp: new Date(),
          context: {}
        },
        {
          id: '',
          type: 'click',
          adId: 'ad-123',
          sessionId: 'session-123',
          timestamp: new Date(),
          context: {}
        } as AdEvent // Invalid event - missing id
      ];

      const batch = {
        events,
        timestamp: new Date(),
        sessionId: 'session-123'
      };

      await analyticsService.processEventBatch(batch);
      
      // Should only process valid events
      const metrics = await analyticsService.getMetrics();
      expect(metrics.impressions).toBe(1);
      expect(metrics.clicks).toBe(0);
    });

    it('should handle processing errors gracefully', async () => {
      const batch = {
        events: null as any,
        timestamp: new Date(),
        sessionId: 'session-123'
      };

      await expect(analyticsService.processEventBatch(batch)).rejects.toThrow();
    });
  });

  describe('metrics calculation', () => {
    it('should calculate performance metrics correctly', async () => {
      const events: AdEvent[] = [
        {
          id: 'event-1',
          type: 'impression',
          adId: 'ad-123',
          sessionId: 'session-123',
          timestamp: new Date(),
          context: {}
        },
        {
          id: 'event-2',
          type: 'impression',
          adId: 'ad-123',
          sessionId: 'session-123',
          timestamp: new Date(),
          context: {}
        },
        {
          id: 'event-3',
          type: 'click',
          adId: 'ad-123',
          sessionId: 'session-123',
          timestamp: new Date(),
          context: {}
        },
        {
          id: 'event-4',
          type: 'conversion',
          adId: 'ad-123',
          sessionId: 'session-123',
          timestamp: new Date(),
          context: {},
          metadata: { conversionValue: 50.0 }
        }
      ];

      const batch = {
        events,
        timestamp: new Date(),
        sessionId: 'session-123'
      };

      await analyticsService.processEventBatch(batch);
      
      const metrics = await analyticsService.getMetrics();
      
      expect(metrics.impressions).toBe(2);
      expect(metrics.clicks).toBe(1);
      expect(metrics.conversions).toBe(1);
      expect(metrics.ctr).toBe(50); // 1 click / 2 impressions * 100
      expect(metrics.revenue).toBe(50.0);
      expect(metrics.cpm).toBe(25000); // 50 revenue / 2 impressions * 1000
      expect(metrics.engagementScore).toBeGreaterThan(0);
    });

    it('should handle empty events gracefully', async () => {
      const metrics = await analyticsService.getMetrics();
      
      expect(metrics.impressions).toBe(0);
      expect(metrics.clicks).toBe(0);
      expect(metrics.conversions).toBe(0);
      expect(metrics.ctr).toBe(0);
      expect(metrics.revenue).toBe(0);
      expect(metrics.cpm).toBe(0);
      expect(metrics.engagementScore).toBe(0);
    });

    it('should filter metrics by criteria', async () => {
      const events: AdEvent[] = [
        {
          id: 'event-1',
          type: 'impression',
          adId: 'ad-123',
          sessionId: 'session-123',
          timestamp: new Date(), // Use current time to avoid cleanup
          context: {}
        },
        {
          id: 'event-2',
          type: 'impression',
          adId: 'ad-456',
          sessionId: 'session-123',
          timestamp: new Date(), // Use current time to avoid cleanup
          context: {}
        }
      ];

      const batch = {
        events,
        timestamp: new Date(),
        sessionId: 'session-123'
      };

      await analyticsService.processEventBatch(batch);
      
      const filteredMetrics = await analyticsService.getMetrics({
        adIds: ['ad-123']
      });
      
      expect(filteredMetrics.impressions).toBe(1);
    });
  });

  describe('insights generation', () => {
    it('should generate analytics insights', async () => {
      // Add some historical data
      const events: AdEvent[] = Array.from({ length: 100 }, (_, i) => ({
        id: `event-${i}`,
        type: i % 10 === 0 ? 'click' : 'impression',
        adId: 'ad-123',
        sessionId: 'session-123',
        timestamp: new Date(Date.now() - i * 60000), // Spread over time
        context: {}
      }));

      const batch = {
        events,
        timestamp: new Date(),
        sessionId: 'session-123'
      };

      await analyticsService.processEventBatch(batch);
      
      const insights = await analyticsService.generateInsights();
      
      expect(Array.isArray(insights)).toBe(true);
    });
  });

  describe('alert management', () => {
    it('should create alerts for threshold violations', async () => {
      // Create events with low CTR to trigger alert
      const events: AdEvent[] = Array.from({ length: 100 }, (_, i) => ({
        id: `event-${i}`,
        type: 'impression', // No clicks = 0% CTR
        adId: 'ad-123',
        sessionId: 'session-123',
        timestamp: new Date(),
        context: {}
      }));

      const batch = {
        events,
        timestamp: new Date(),
        sessionId: 'session-123'
      };

      await analyticsService.processEventBatch(batch);
      
      const alerts = await analyticsService.getAlerts();
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(alert => alert.metric === 'ctr')).toBe(true);
    });

    it('should acknowledge alerts', async () => {
      // First create an alert
      const events: AdEvent[] = Array.from({ length: 100 }, (_, i) => ({
        id: `event-${i}`,
        type: 'impression',
        adId: 'ad-123',
        sessionId: 'session-123',
        timestamp: new Date(),
        context: {}
      }));

      const batch = {
        events,
        timestamp: new Date(),
        sessionId: 'session-123'
      };

      await analyticsService.processEventBatch(batch);
      
      const alerts = await analyticsService.getAlerts();
      
      if (alerts.length > 0) {
        await analyticsService.acknowledgeAlert(alerts[0].id);
        
        const updatedAlerts = await analyticsService.getAlerts();
        expect(updatedAlerts.length).toBe(alerts.length - 1);
      }
    });
  });

  describe('aggregated metrics', () => {
    it('should provide aggregated metrics for time windows', async () => {
      const events: AdEvent[] = [
        {
          id: 'event-1',
          type: 'impression',
          adId: 'ad-123',
          sessionId: 'session-123',
          timestamp: new Date(),
          context: {}
        }
      ];

      const batch = {
        events,
        timestamp: new Date(),
        sessionId: 'session-123'
      };

      await analyticsService.processEventBatch(batch);
      
      const timeWindow = new Date();
      timeWindow.setSeconds(0, 0); // Round to minute
      
      const aggregated = await analyticsService.getAggregatedMetrics(timeWindow);
      
      expect(aggregated).toBeTruthy();
      if (aggregated) {
        expect(aggregated.metrics.impressions).toBeGreaterThan(0);
        expect(aggregated.breakdown.byAdId.size).toBeGreaterThan(0);
      }
    });
  });

  describe('cleanup', () => {
    it('should clean up old events based on retention period', async () => {
      const oldEvents: AdEvent[] = [
        {
          id: 'old-event',
          type: 'impression',
          adId: 'ad-123',
          sessionId: 'session-123',
          timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
          context: {}
        }
      ];

      const recentEvents: AdEvent[] = [
        {
          id: 'recent-event',
          type: 'impression',
          adId: 'ad-123',
          sessionId: 'session-123',
          timestamp: new Date(),
          context: {}
        }
      ];

      await analyticsService.processEventBatch({
        events: [...oldEvents, ...recentEvents],
        timestamp: new Date(),
        sessionId: 'session-123'
      });

      const metrics = await analyticsService.getMetrics();
      
      // Should only have recent events (old ones cleaned up)
      expect(metrics.impressions).toBe(1);
    });

    it('should clean up resources on destroy', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      
      analyticsService.destroy();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });
});