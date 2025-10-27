import { 
  Ad, 
  AdRequest, 
  AdResponse, 
  AdResponseMetadata, 
  AdEvent, 
  AdType, 
  AdFormat,
  AdContent,
  PerformanceMetrics,
  AIContext,
  UserProfile,
  PrivacySettings
} from '@ai-yuugen/types';
import { InventoryManager } from './inventory-manager';

export interface ImpressionContext {
  adId: string;
  userId?: string;
  sessionId: string;
  placementId: string;
  timestamp: Date;
  viewDuration?: number;
  viewabilityScore?: number;
}

export interface ClickContext {
  adId: string;
  userId?: string;
  sessionId: string;
  placementId: string;
  timestamp: Date;
  clickPosition?: { x: number; y: number };
  referrer?: string;
}

export interface ConversionData {
  adId: string;
  userId?: string;
  sessionId: string;
  conversionType: string;
  value?: number;
  currency?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AuctionResult {
  winningAd: Ad;
  bidPrice: number;
  auctionId: string;
  competitorCount: number;
}

/**
 * Ad server for handling ad requests and serving with real-time selection
 */
export class AdServer {
  private inventoryManager: InventoryManager;
  private impressionEvents: Map<string, ImpressionContext> = new Map();
  private clickEvents: Map<string, ClickContext> = new Map();
  private conversionEvents: Map<string, ConversionData> = new Map();
  private performanceMetrics: Map<string, PerformanceMetrics> = new Map();

  constructor(inventoryManager: InventoryManager) {
    this.inventoryManager = inventoryManager;
  }

  /**
   * Request ads with real-time selection and auction logic
   */
  async requestAd(request: AdRequest): Promise<AdResponse> {
    const startTime = Date.now();
    
    try {
      // Validate privacy settings
      if (!this.validatePrivacyCompliance(request.privacySettings)) {
        return this.createFallbackResponse(request, 'Privacy compliance failed');
      }

      // Get available ads from inventory
      const availableAds = await this.inventoryManager.getAvailableAds({
        placementId: request.placementId,
        context: request.context,
        userProfile: request.userProfile,
        privacySettings: request.privacySettings
      });

      if (availableAds.length === 0) {
        return this.createFallbackResponse(request, 'No ads available');
      }

      // Run auction to select best ad
      const auctionResult = await this.runAdAuction(availableAds, request);
      
      // Calculate targeting score
      const targetingScore = this.calculateTargetingScore(auctionResult.winningAd, request.context, request.userProfile);

      const processingTime = Date.now() - startTime;
      
      const metadata: AdResponseMetadata = {
        processingTime,
        targetingScore,
        auctionId: auctionResult.auctionId,
        bidPrice: auctionResult.bidPrice,
        currency: 'USD',
        impressionUrl: this.generateTrackingUrl('impression', auctionResult.winningAd.id, request.sessionId),
        clickUrl: this.generateTrackingUrl('click', auctionResult.winningAd.id, request.sessionId),
        conversionUrl: this.generateTrackingUrl('conversion', auctionResult.winningAd.id, request.sessionId)
      };

      return {
        requestId: request.requestId,
        ads: [auctionResult.winningAd],
        metadata,
        timestamp: new Date(),
        ttl: 300 // 5 minutes
      };

    } catch (error) {
      console.error('Ad request failed:', error);
      return this.createFallbackResponse(request, 'Server error');
    }
  }

  /**
   * Record ad impression with context
   */
  recordImpression(adId: string, context: ImpressionContext): void {
    // Store impression event
    this.impressionEvents.set(`${adId}-${context.sessionId}-${Date.now()}`, context);
    
    // Update performance metrics
    this.updatePerformanceMetrics(adId, 'impression');
    
    // Create ad event for analytics
    const event: AdEvent = {
      id: this.generateEventId(),
      type: 'impression',
      adId,
      userId: context.userId,
      sessionId: context.sessionId,
      timestamp: context.timestamp,
      context: {
        placementId: context.placementId,
        viewDuration: context.viewDuration,
        viewabilityScore: context.viewabilityScore
      }
    };

    this.trackEvent(event);
  }

  /**
   * Record ad click with context
   */
  recordClick(adId: string, context: ClickContext): void {
    // Store click event
    this.clickEvents.set(`${adId}-${context.sessionId}-${Date.now()}`, context);
    
    // Update performance metrics
    this.updatePerformanceMetrics(adId, 'click');
    
    // Create ad event for analytics
    const event: AdEvent = {
      id: this.generateEventId(),
      type: 'click',
      adId,
      userId: context.userId,
      sessionId: context.sessionId,
      timestamp: context.timestamp,
      context: {
        placementId: context.placementId,
        clickPosition: context.clickPosition,
        referrer: context.referrer
      }
    };

    this.trackEvent(event);
  }

  /**
   * Record ad conversion with data
   */
  recordConversion(adId: string, conversionData: ConversionData): void {
    // Store conversion event
    this.conversionEvents.set(`${adId}-${conversionData.sessionId}-${Date.now()}`, conversionData);
    
    // Update performance metrics
    this.updatePerformanceMetrics(adId, 'conversion', conversionData.value);
    
    // Create ad event for analytics
    const event: AdEvent = {
      id: this.generateEventId(),
      type: 'conversion',
      adId,
      userId: conversionData.userId,
      sessionId: conversionData.sessionId,
      timestamp: conversionData.timestamp,
      context: {
        conversionType: conversionData.conversionType,
        value: conversionData.value,
        currency: conversionData.currency
      },
      metadata: conversionData.metadata
    };

    this.trackEvent(event);
  }

  /**
   * Get performance metrics for an ad
   */
  getPerformanceMetrics(adId: string): PerformanceMetrics {
    return this.performanceMetrics.get(adId) || {
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
   * Run ad auction to select the best ad
   */
  private async runAdAuction(availableAds: Ad[], request: AdRequest): Promise<AuctionResult> {
    const auctionId = this.generateAuctionId();
    let bestAd = availableAds[0];
    let highestScore = 0;
    let bidPrice = 0;

    for (const ad of availableAds) {
      // Calculate relevance score based on context and user profile
      const relevanceScore = this.calculateTargetingScore(ad, request.context, request.userProfile);
      
      // Calculate bid price (simplified auction logic)
      const currentBidPrice = this.calculateBidPrice(ad, relevanceScore);
      
      // Combined score for auction
      const auctionScore = relevanceScore * currentBidPrice;
      
      if (auctionScore > highestScore) {
        highestScore = auctionScore;
        bestAd = ad;
        bidPrice = currentBidPrice;
      }
    }

    return {
      winningAd: bestAd,
      bidPrice,
      auctionId,
      competitorCount: availableAds.length
    };
  }

  /**
   * Calculate targeting score based on context and user profile
   */
  private calculateTargetingScore(ad: Ad, context: AIContext, userProfile?: UserProfile): number {
    let score = 0.5; // Base score

    // Context-based scoring
    if (context.topics && context.topics.length > 0) {
      // Simple keyword matching (in real implementation, this would be more sophisticated)
      const adKeywords = [ad.content.title, ad.content.description, ad.content.brandName]
        .join(' ')
        .toLowerCase()
        .split(' ');
      
      const contextKeywords = context.topics.flatMap(topic => topic.keywords);
      const matchingKeywords = adKeywords.filter(keyword => 
        contextKeywords.some(contextKeyword => 
          contextKeyword.toLowerCase().includes(keyword) || keyword.includes(contextKeyword.toLowerCase())
        )
      );
      
      score += (matchingKeywords.length / adKeywords.length) * 0.3;
    }

    // Intent-based scoring
    if (context.intent) {
      // Boost score for commercial intent
      if (context.intent.category === 'commercial' || context.intent.category === 'transactional') {
        score += 0.2;
      }
      score += context.intent.confidence * 0.1;
    }

    // Engagement-based scoring
    if (context.userEngagement) {
      score += (context.userEngagement.score * 0.2);
    }

    // User profile-based scoring
    if (userProfile && userProfile.interests) {
      const relevantInterests = userProfile.interests.filter(interest => 
        ad.content.title.toLowerCase().includes(interest.category.toLowerCase()) ||
        ad.content.description.toLowerCase().includes(interest.category.toLowerCase())
      );
      
      if (relevantInterests.length > 0) {
        const avgInterestScore = relevantInterests.reduce((sum, interest) => sum + interest.score, 0) / relevantInterests.length;
        score += avgInterestScore * 0.2;
      }
    }

    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Calculate bid price for an ad
   */
  private calculateBidPrice(ad: Ad, relevanceScore: number): number {
    // Base CPM (cost per mille/thousand impressions)
    const baseCPM = 2.0;
    
    // Adjust based on ad type
    let typeMultiplier = 1.0;
    switch (ad.type) {
      case AdType.VIDEO:
        typeMultiplier = 1.5;
        break;
      case AdType.INTERSTITIAL:
        typeMultiplier = 1.3;
        break;
      case AdType.NATIVE:
        typeMultiplier = 1.2;
        break;
      default:
        typeMultiplier = 1.0;
    }

    // Adjust based on relevance score
    const relevanceMultiplier = 0.5 + (relevanceScore * 1.5);

    return baseCPM * typeMultiplier * relevanceMultiplier;
  }

  /**
   * Validate privacy compliance
   */
  private validatePrivacyCompliance(privacySettings: PrivacySettings): boolean {
    // Check if advertising consent is given
    if (!privacySettings.consentStatus.advertising) {
      return false;
    }

    // Check if consent is not expired (assuming 1 year validity)
    const consentAge = Date.now() - privacySettings.consentStatus.timestamp.getTime();
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    
    if (consentAge > oneYear) {
      return false;
    }

    // Check compliance flags
    const hasBlockingIssues = privacySettings.complianceFlags.some(flag => 
      flag.status === 'non_compliant' && 
      flag.issues.some(issue => issue.severity === 'critical' && !issue.resolved)
    );

    return !hasBlockingIssues;
  }

  /**
   * Create fallback response when ad serving fails
   */
  private createFallbackResponse(request: AdRequest, reason: string): AdResponse {
    // Create a simple fallback ad
    const fallbackAd: Ad = {
      id: 'fallback-ad',
      type: AdType.BANNER,
      format: AdFormat.TEXT,
      content: {
        title: 'Advertisement',
        description: 'Sponsored content',
        ctaText: 'Learn More',
        landingUrl: '#',
        brandName: 'AI Ad Yuugen'
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    return {
      requestId: request.requestId,
      ads: [fallbackAd],
      fallbackAds: [fallbackAd],
      metadata: {
        processingTime: 0,
        targetingScore: 0,
        auctionId: 'fallback'
      },
      timestamp: new Date(),
      ttl: 60 // 1 minute for fallback
    };
  }

  /**
   * Update performance metrics for an ad
   */
  private updatePerformanceMetrics(adId: string, eventType: 'impression' | 'click' | 'conversion', value?: number): void {
    const metrics = this.performanceMetrics.get(adId) || {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      cpm: 0,
      revenue: 0,
      engagementScore: 0
    };

    switch (eventType) {
      case 'impression':
        metrics.impressions++;
        break;
      case 'click':
        metrics.clicks++;
        break;
      case 'conversion':
        metrics.conversions++;
        if (value) {
          metrics.revenue += value;
        }
        break;
    }

    // Recalculate derived metrics
    metrics.ctr = metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0;
    metrics.cpm = metrics.impressions > 0 ? (metrics.revenue / metrics.impressions) * 1000 : 0;
    metrics.engagementScore = this.calculateEngagementScore(metrics);

    this.performanceMetrics.set(adId, metrics);
  }

  /**
   * Calculate engagement score based on performance metrics
   */
  private calculateEngagementScore(metrics: PerformanceMetrics): number {
    let score = 0;

    // CTR contribution (0-40 points)
    score += Math.min(metrics.ctr * 4, 40);

    // Conversion rate contribution (0-40 points)
    const conversionRate = metrics.impressions > 0 ? (metrics.conversions / metrics.impressions) * 100 : 0;
    score += Math.min(conversionRate * 400, 40);

    // Revenue contribution (0-20 points)
    const revenueScore = Math.min(metrics.revenue / 10, 20);
    score += revenueScore;

    return Math.min(score, 100) / 100; // Normalize to 0-1
  }

  /**
   * Generate tracking URL for events
   */
  private generateTrackingUrl(eventType: string, adId: string, sessionId: string): string {
    return `/track/${eventType}?adId=${adId}&sessionId=${sessionId}&timestamp=${Date.now()}`;
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique auction ID
   */
  private generateAuctionId(): string {
    return `auction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track ad event (placeholder for analytics integration)
   */
  private trackEvent(event: AdEvent): void {
    // In a real implementation, this would send to analytics service
    console.log('Ad Event Tracked:', event);
  }
}