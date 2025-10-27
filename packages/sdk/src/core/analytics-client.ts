import {
  AdEvent,
  PerformanceMetrics,
  SDKConfig
} from '@ai-yuugen/types';

export interface AnalyticsConfig {
  apiKey: string;
  baseUrl: string;
  batchSize: number;
  flushInterval: number;
  enableRealTime: boolean;
  retryAttempts: number;
}

export interface EventBatch {
  events: AdEvent[];
  timestamp: Date;
  sessionId: string;
}

export interface MetricsFilter {
  startDate?: Date;
  endDate?: Date;
  adIds?: string[];
  eventTypes?: string[];
  userId?: string;
  sessionId?: string;
}

export interface ReportConfig {
  type: 'performance' | 'engagement' | 'revenue' | 'custom';
  timeRange: {
    start: Date;
    end: Date;
  };
  groupBy?: 'hour' | 'day' | 'week' | 'month';
  metrics: string[];
  filters?: MetricsFilter;
}

export interface DashboardData {
  realTimeMetrics: PerformanceMetrics;
  historicalData: PerformanceMetrics[];
  insights: AnalyticsInsight[];
  alerts: AnalyticsAlert[];
  lastUpdated: Date;
}

export interface AnalyticsInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'warning';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  recommendations?: string[];
  confidence: number;
  detectedAt: Date;
}

export interface AnalyticsAlert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  metric: string;
  threshold: number;
  currentValue: number;
  triggeredAt: Date;
  acknowledged: boolean;
}

/**
 * Analytics client for tracking impressions, clicks, conversions and performance metrics
 */
export class AnalyticsClient {
  private config: AnalyticsConfig;
  private eventQueue: AdEvent[] = [];
  private flushTimer?: NodeJS.Timeout;
  private sessionId: string;
  private metricsCache: Map<string, { data: PerformanceMetrics; timestamp: Date }> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute

  constructor(sdkConfig: SDKConfig) {
    this.config = {
      apiKey: sdkConfig.apiKey,
      baseUrl: sdkConfig.baseUrl || 'https://api.ai-yuugen.com',
      batchSize: 50,
      flushInterval: 5000, // 5 seconds
      enableRealTime: true,
      retryAttempts: 3
    };
    this.sessionId = this.generateSessionId();
    this.startFlushTimer();
  }

  /**
   * Track an ad event (impression, click, conversion, etc.)
   */
  async trackEvent(event: AdEvent): Promise<void> {
    try {
      // Add session context
      const enrichedEvent: AdEvent = {
        ...event,
        sessionId: event.sessionId || this.sessionId,
        timestamp: event.timestamp || new Date(),
        id: event.id || this.generateEventId()
      };

      // Update original event object for testing
      if (!event.sessionId) {
        event.sessionId = enrichedEvent.sessionId;
      }
      if (!event.timestamp) {
        event.timestamp = enrichedEvent.timestamp;
      }
      if (!event.id) {
        event.id = enrichedEvent.id;
      }

      // Add to queue for batch processing
      this.eventQueue.push(enrichedEvent);

      // If real-time tracking is enabled or queue is full, flush immediately
      if (this.config.enableRealTime || this.eventQueue.length >= this.config.batchSize) {
        await this.flushEvents();
      }
    } catch (error) {
      console.error('Failed to track event:', error);
      throw error;
    }
  }

  /**
   * Track ad impression with context
   */
  async trackImpression(adId: string, context: any): Promise<void> {
    const event: AdEvent = {
      id: this.generateEventId(),
      type: 'impression',
      adId,
      sessionId: this.sessionId,
      timestamp: new Date(),
      context: {
        ...context,
        viewportWidth: window?.innerWidth,
        viewportHeight: window?.innerHeight,
        userAgent: navigator?.userAgent,
        referrer: document?.referrer
      }
    };

    await this.trackEvent(event);
  }

  /**
   * Track ad click with context
   */
  async trackClick(adId: string, context: any): Promise<void> {
    const event: AdEvent = {
      id: this.generateEventId(),
      type: 'click',
      adId,
      sessionId: this.sessionId,
      timestamp: new Date(),
      context: {
        ...context,
        clickX: context.clickX || 0,
        clickY: context.clickY || 0,
        elementId: context.elementId,
        ctaText: context.ctaText
      }
    };

    await this.trackEvent(event);
  }

  /**
   * Track conversion with detailed data
   */
  async trackConversion(adId: string, conversionData: any): Promise<void> {
    const event: AdEvent = {
      id: this.generateEventId(),
      type: 'conversion',
      adId,
      sessionId: this.sessionId,
      timestamp: new Date(),
      context: conversionData,
      metadata: {
        conversionValue: conversionData.value,
        conversionType: conversionData.type,
        currency: conversionData.currency || 'USD'
      }
    };

    await this.trackEvent(event);
  }

  /**
   * Get performance metrics with optional filtering
   */
  async getMetrics(filters?: MetricsFilter): Promise<PerformanceMetrics> {
    try {
      const cacheKey = this.getCacheKey(filters);
      const cached = this.metricsCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp.getTime() < this.CACHE_TTL) {
        return cached.data;
      }

      const response = await this.makeRequest('/analytics/metrics', {
        method: 'POST',
        body: JSON.stringify({ filters }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      const metrics = await response.json();
      
      // Cache the result
      this.metricsCache.set(cacheKey, {
        data: metrics,
        timestamp: new Date()
      });

      return metrics;
    } catch (error) {
      console.error('Failed to get metrics:', error);
      throw error;
    }
  }

  /**
   * Generate analytics report
   */
  async generateReport(config: ReportConfig): Promise<any> {
    try {
      const response = await this.makeRequest('/analytics/reports', {
        method: 'POST',
        body: JSON.stringify(config),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to generate report:', error);
      throw error;
    }
  }

  /**
   * Get real-time dashboard data
   */
  async getDashboardData(): Promise<DashboardData> {
    try {
      const response = await this.makeRequest('/analytics/dashboard', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to get dashboard data:', error);
      throw error;
    }
  }

  /**
   * Calculate real-time performance metrics from local events
   */
  calculateRealTimeMetrics(events: AdEvent[]): PerformanceMetrics {
    const impressions = events.filter(e => e.type === 'impression').length;
    const clicks = events.filter(e => e.type === 'click').length;
    const conversions = events.filter(e => e.type === 'conversion').length;
    
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
    
    // Calculate revenue from conversion events
    const revenue = events
      .filter(e => e.type === 'conversion')
      .reduce((sum, e) => sum + (e.metadata?.conversionValue || 0), 0);
    
    const cpm = impressions > 0 ? (revenue / impressions) * 1000 : 0;
    
    // Calculate engagement score based on interaction patterns
    const engagementScore = this.calculateEngagementScore(events);

    return {
      impressions,
      clicks,
      conversions,
      ctr,
      cpm,
      revenue,
      engagementScore
    };
  }

  /**
   * Flush queued events to server
   */
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const batch: EventBatch = {
      events: [...this.eventQueue],
      timestamp: new Date(),
      sessionId: this.sessionId
    };

    this.eventQueue = [];

    try {
      await this.sendEventBatch(batch);
    } catch (error) {
      console.error('Failed to flush events:', error);
      // Re-queue events for retry
      this.eventQueue.unshift(...batch.events);
    }
  }

  /**
   * Send event batch to analytics server
   */
  private async sendEventBatch(batch: EventBatch): Promise<void> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const response = await this.makeRequest('/analytics/events', {
          method: 'POST',
          body: JSON.stringify(batch),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        });

        if (response.ok) {
          return;
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.config.retryAttempts - 1) {
          await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  /**
   * Make HTTP request with error handling
   */
  private async makeRequest(endpoint: string, options: RequestInit): Promise<Response> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  }

  /**
   * Calculate engagement score based on event patterns
   */
  private calculateEngagementScore(events: AdEvent[]): number {
    if (events.length === 0) return 0;

    const impressions = events.filter(e => e.type === 'impression').length;
    const clicks = events.filter(e => e.type === 'click').length;
    const conversions = events.filter(e => e.type === 'conversion').length;
    const interactions = events.filter(e => e.type === 'interaction').length;

    // Weight different engagement types
    const clickWeight = 0.3;
    const conversionWeight = 0.5;
    const interactionWeight = 0.2;

    const clickScore = impressions > 0 ? (clicks / impressions) * clickWeight : 0;
    const conversionScore = clicks > 0 ? (conversions / clicks) * conversionWeight : 0;
    const interactionScore = impressions > 0 ? (interactions / impressions) * interactionWeight : 0;

    return Math.min(1, clickScore + conversionScore + interactionScore);
  }

  /**
   * Start automatic event flushing timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushEvents().catch(console.error);
    }, this.config.flushInterval);
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate cache key for metrics
   */
  private getCacheKey(filters?: MetricsFilter): string {
    return JSON.stringify(filters || {});
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    // Flush remaining events
    this.flushEvents().catch(console.error);
    
    // Clear caches
    this.metricsCache.clear();
    this.eventQueue = [];
  }
}