import {
  AdEvent,
  PerformanceMetrics
} from '@ai-yuugen/types';

export interface AnalyticsServiceConfig {
  enableRealTimeProcessing: boolean;
  aggregationInterval: number;
  retentionPeriod: number;
  alertThresholds: AlertThresholds;
}

export interface AlertThresholds {
  lowCTR: number;
  highCPM: number;
  lowRevenue: number;
  errorRate: number;
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

export interface AggregatedMetrics {
  timeWindow: Date;
  metrics: PerformanceMetrics;
  breakdown: {
    byAdId: Map<string, PerformanceMetrics>;
    byEventType: Map<string, number>;
    byHour: Map<number, PerformanceMetrics>;
  };
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
 * Server-side analytics service for processing events and generating insights
 */
export class AnalyticsService {
  private config: AnalyticsServiceConfig;
  private eventStore: AdEvent[] = [];
  private metricsCache: Map<string, AggregatedMetrics> = new Map();
  private alertsCache: AnalyticsAlert[] = [];
  private insightsCache: AnalyticsInsight[] = [];
  private aggregationTimer?: NodeJS.Timeout;

  constructor(config: AnalyticsServiceConfig) {
    this.config = config;
    this.startAggregationTimer();
  }

  /**
   * Process incoming event batch
   */
  async processEventBatch(batch: EventBatch): Promise<void> {
    try {
      // Validate events
      const validEvents = batch.events.filter(this.validateEvent);
      
      // Store events
      this.eventStore.push(...validEvents);
      
      // Process real-time if enabled
      if (this.config.enableRealTimeProcessing) {
        await this.processRealTimeEvents(validEvents);
      }
      
      // Clean up old events based on retention period
      this.cleanupOldEvents();
      
    } catch (error) {
      console.error('Failed to process event batch:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics with filtering
   */
  async getMetrics(filters?: MetricsFilter): Promise<PerformanceMetrics> {
    try {
      const filteredEvents = this.filterEvents(this.eventStore, filters);
      return this.calculateMetrics(filteredEvents);
    } catch (error) {
      console.error('Failed to get metrics:', error);
      throw error;
    }
  }

  /**
   * Get aggregated metrics for dashboard
   */
  async getAggregatedMetrics(timeWindow: Date): Promise<AggregatedMetrics | null> {
    const cacheKey = timeWindow.toISOString();
    return this.metricsCache.get(cacheKey) || null;
  }

  /**
   * Generate analytics insights
   */
  async generateInsights(): Promise<AnalyticsInsight[]> {
    try {
      const insights: AnalyticsInsight[] = [];
      
      // Analyze trends
      const trendInsights = await this.analyzeTrends();
      insights.push(...trendInsights);
      
      // Detect anomalies
      const anomalyInsights = await this.detectAnomalies();
      insights.push(...anomalyInsights);
      
      // Identify opportunities
      const opportunityInsights = await this.identifyOpportunities();
      insights.push(...opportunityInsights);
      
      // Cache insights
      this.insightsCache = insights;
      
      return insights;
    } catch (error) {
      console.error('Failed to generate insights:', error);
      throw error;
    }
  }

  /**
   * Get active alerts
   */
  async getAlerts(): Promise<AnalyticsAlert[]> {
    return this.alertsCache.filter(alert => !alert.acknowledged);
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    const alert = this.alertsCache.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  /**
   * Calculate performance metrics from events
   */
  private calculateMetrics(events: AdEvent[]): PerformanceMetrics {
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
    
    // Calculate engagement score
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
   * Process real-time events for immediate insights
   */
  private async processRealTimeEvents(events: AdEvent[]): Promise<void> {
    // Check for alert conditions
    await this.checkAlertConditions(events);
    
    // Update real-time metrics
    await this.updateRealTimeMetrics(events);
  }

  /**
   * Check for alert conditions in events
   */
  private async checkAlertConditions(events: AdEvent[]): Promise<void> {
    const metrics = this.calculateMetrics(events);
    
    // Check CTR threshold
    if (metrics.ctr < this.config.alertThresholds.lowCTR) {
      this.createAlert('warning', 'Low CTR Detected', 
        `CTR has dropped to ${metrics.ctr.toFixed(2)}%`, 'ctr', 
        this.config.alertThresholds.lowCTR, metrics.ctr);
    }
    
    // Check CPM threshold
    if (metrics.cpm > this.config.alertThresholds.highCPM) {
      this.createAlert('warning', 'High CPM Detected', 
        `CPM has increased to $${metrics.cpm.toFixed(2)}`, 'cpm', 
        this.config.alertThresholds.highCPM, metrics.cpm);
    }
    
    // Check revenue threshold
    if (metrics.revenue < this.config.alertThresholds.lowRevenue) {
      this.createAlert('error', 'Low Revenue Alert', 
        `Revenue has dropped to $${metrics.revenue.toFixed(2)}`, 'revenue', 
        this.config.alertThresholds.lowRevenue, metrics.revenue);
    }
  }

  /**
   * Create analytics alert
   */
  private createAlert(severity: 'info' | 'warning' | 'error' | 'critical', 
                     title: string, message: string, metric: string, 
                     threshold: number, currentValue: number): void {
    const alert: AnalyticsAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      severity,
      title,
      message,
      metric,
      threshold,
      currentValue,
      triggeredAt: new Date(),
      acknowledged: false
    };
    
    this.alertsCache.push(alert);
  }

  /**
   * Update real-time metrics cache
   */
  private async updateRealTimeMetrics(events: AdEvent[]): Promise<void> {
    const now = new Date();
    const timeWindow = new Date(now.getTime() - (now.getTime() % (60 * 1000))); // Round to minute
    
    const cacheKey = timeWindow.toISOString();
    let aggregated = this.metricsCache.get(cacheKey);
    
    if (!aggregated) {
      aggregated = {
        timeWindow,
        metrics: this.calculateMetrics([]),
        breakdown: {
          byAdId: new Map(),
          byEventType: new Map(),
          byHour: new Map()
        }
      };
    }
    
    // Update with new events
    const allEvents = [...this.getEventsInTimeWindow(timeWindow), ...events];
    aggregated.metrics = this.calculateMetrics(allEvents);
    
    // Update breakdowns
    this.updateBreakdowns(aggregated, events);
    
    this.metricsCache.set(cacheKey, aggregated);
  }

  /**
   * Update metric breakdowns
   */
  private updateBreakdowns(aggregated: AggregatedMetrics, events: AdEvent[]): void {
    // By Ad ID
    events.forEach(event => {
      const existing = aggregated.breakdown.byAdId.get(event.adId) || this.getEmptyMetrics();
      const adEvents = events.filter(e => e.adId === event.adId);
      aggregated.breakdown.byAdId.set(event.adId, this.calculateMetrics(adEvents));
    });
    
    // By Event Type
    events.forEach(event => {
      const count = aggregated.breakdown.byEventType.get(event.type) || 0;
      aggregated.breakdown.byEventType.set(event.type, count + 1);
    });
    
    // By Hour
    events.forEach(event => {
      const hour = event.timestamp.getHours();
      const existing = aggregated.breakdown.byHour.get(hour) || this.getEmptyMetrics();
      const hourEvents = events.filter(e => e.timestamp.getHours() === hour);
      aggregated.breakdown.byHour.set(hour, this.calculateMetrics(hourEvents));
    });
  }

  /**
   * Analyze trends in metrics
   */
  private async analyzeTrends(): Promise<AnalyticsInsight[]> {
    const insights: AnalyticsInsight[] = [];
    
    // Get metrics for last 24 hours
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentEvents = this.filterEvents(this.eventStore, {
      startDate: yesterday,
      endDate: now
    });
    
    const recentMetrics = this.calculateMetrics(recentEvents);
    
    // Compare with previous period
    const twoDaysAgo = new Date(yesterday.getTime() - 24 * 60 * 60 * 1000);
    const previousEvents = this.filterEvents(this.eventStore, {
      startDate: twoDaysAgo,
      endDate: yesterday
    });
    
    const previousMetrics = this.calculateMetrics(previousEvents);
    
    // Analyze CTR trend
    if (previousMetrics.ctr > 0) {
      const ctrChange = ((recentMetrics.ctr - previousMetrics.ctr) / previousMetrics.ctr) * 100;
      if (Math.abs(ctrChange) > 10) {
        insights.push({
          id: `trend_ctr_${Date.now()}`,
          type: 'trend',
          title: `CTR ${ctrChange > 0 ? 'Increase' : 'Decrease'} Detected`,
          description: `CTR has ${ctrChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(ctrChange).toFixed(1)}% in the last 24 hours`,
          impact: Math.abs(ctrChange) > 25 ? 'high' : 'medium',
          actionable: true,
          recommendations: ctrChange > 0 ? 
            ['Continue current ad strategy', 'Consider scaling successful campaigns'] :
            ['Review ad creative', 'Check targeting parameters', 'A/B test new formats'],
          confidence: 0.8,
          detectedAt: new Date()
        });
      }
    }
    
    return insights;
  }

  /**
   * Detect anomalies in metrics
   */
  private async detectAnomalies(): Promise<AnalyticsInsight[]> {
    const insights: AnalyticsInsight[] = [];
    
    // Simple anomaly detection based on standard deviation
    const recentMetrics = Array.from(this.metricsCache.values())
      .slice(-24) // Last 24 data points
      .map(a => a.metrics);
    
    if (recentMetrics.length < 5) return insights;
    
    const ctrValues = recentMetrics.map(m => m.ctr);
    const ctrMean = ctrValues.reduce((sum, val) => sum + val, 0) / ctrValues.length;
    const ctrStdDev = Math.sqrt(
      ctrValues.reduce((sum, val) => sum + Math.pow(val - ctrMean, 2), 0) / ctrValues.length
    );
    
    const latestCTR = recentMetrics[recentMetrics.length - 1]?.ctr || 0;
    
    if (Math.abs(latestCTR - ctrMean) > 2 * ctrStdDev) {
      insights.push({
        id: `anomaly_ctr_${Date.now()}`,
        type: 'anomaly',
        title: 'CTR Anomaly Detected',
        description: `Current CTR (${latestCTR.toFixed(2)}%) is significantly different from the average (${ctrMean.toFixed(2)}%)`,
        impact: 'high',
        actionable: true,
        recommendations: [
          'Investigate recent changes to ad campaigns',
          'Check for technical issues',
          'Review targeting settings'
        ],
        confidence: 0.9,
        detectedAt: new Date()
      });
    }
    
    return insights;
  }

  /**
   * Identify optimization opportunities
   */
  private async identifyOpportunities(): Promise<AnalyticsInsight[]> {
    const insights: AnalyticsInsight[] = [];
    
    // Analyze ad performance by ID
    const adPerformance = new Map<string, PerformanceMetrics>();
    
    this.eventStore.forEach(event => {
      if (!adPerformance.has(event.adId)) {
        const adEvents = this.eventStore.filter(e => e.adId === event.adId);
        adPerformance.set(event.adId, this.calculateMetrics(adEvents));
      }
    });
    
    // Find high-performing ads
    const highPerformers = Array.from(adPerformance.entries())
      .filter(([_, metrics]) => metrics.ctr > 2.0 && metrics.impressions > 100)
      .sort((a, b) => b[1].ctr - a[1].ctr)
      .slice(0, 3);
    
    if (highPerformers.length > 0) {
      insights.push({
        id: `opportunity_scale_${Date.now()}`,
        type: 'opportunity',
        title: 'High-Performing Ads Identified',
        description: `${highPerformers.length} ads are showing exceptional performance`,
        impact: 'high',
        actionable: true,
        recommendations: [
          'Increase budget allocation to high-performing ads',
          'Create similar ad variations',
          'Expand targeting for successful campaigns'
        ],
        confidence: 0.85,
        detectedAt: new Date()
      });
    }
    
    return insights;
  }

  /**
   * Filter events based on criteria
   */
  private filterEvents(events: AdEvent[], filters?: MetricsFilter): AdEvent[] {
    if (!filters) return events;
    
    return events.filter(event => {
      if (filters.startDate && event.timestamp < filters.startDate) return false;
      if (filters.endDate && event.timestamp > filters.endDate) return false;
      if (filters.adIds && !filters.adIds.includes(event.adId)) return false;
      if (filters.eventTypes && !filters.eventTypes.includes(event.type)) return false;
      if (filters.userId && event.userId !== filters.userId) return false;
      if (filters.sessionId && event.sessionId !== filters.sessionId) return false;
      return true;
    });
  }

  /**
   * Get events within a specific time window
   */
  private getEventsInTimeWindow(timeWindow: Date): AdEvent[] {
    const windowEnd = new Date(timeWindow.getTime() + 60 * 1000); // 1 minute window
    return this.eventStore.filter(event => 
      event.timestamp >= timeWindow && event.timestamp < windowEnd
    );
  }

  /**
   * Validate event structure
   */
  private validateEvent(event: AdEvent): boolean {
    return !!(
      event.id &&
      event.type &&
      event.adId &&
      event.sessionId &&
      event.timestamp
    );
  }

  /**
   * Clean up old events based on retention period
   */
  private cleanupOldEvents(): void {
    const cutoffDate = new Date(Date.now() - this.config.retentionPeriod);
    this.eventStore = this.eventStore.filter(event => event.timestamp > cutoffDate);
  }

  /**
   * Get empty metrics object
   */
  private getEmptyMetrics(): PerformanceMetrics {
    return {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      cpm: 0,
      revenue: 0,
      engagementScore: 0
    };
  }

  /**
   * Start aggregation timer
   */
  private startAggregationTimer(): void {
    this.aggregationTimer = setInterval(() => {
      this.generateInsights().catch(console.error);
    }, this.config.aggregationInterval);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer);
    }
    
    this.eventStore = [];
    this.metricsCache.clear();
    this.alertsCache = [];
    this.insightsCache = [];
  }
}