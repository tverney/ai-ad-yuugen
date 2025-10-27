import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdServer, ImpressionContext, ClickContext, ConversionData } from './ad-server';
import { InventoryManager } from './inventory-manager';
import { 
  AdRequest, 
  AdType, 
  AdFormat, 
  AIContext, 
  UserProfile, 
  PrivacySettings,
  ConsentStatus,
  IntentCategory,
  EngagementLevel,
  EngagementTier,
  ConsentMethod,
  PrivacyLevel,
  DataProcessingBasis,
  ComplianceStatus,
  PrivacyRegulation
} from '@ai-yuugen/types';

describe('AdServer', () => {
  let adServer: AdServer;
  let inventoryManager: InventoryManager;

  beforeEach(() => {
    inventoryManager = new InventoryManager();
    adServer = new AdServer(inventoryManager);
  });

  describe('requestAd', () => {
    it('should return ad response with valid request', async () => {
      const mockRequest: AdRequest = {
        placementId: 'test-placement',
        context: createMockAIContext(),
        privacySettings: createMockPrivacySettings(),
        deviceInfo: {
          userAgent: 'test-agent',
          screenWidth: 1920,
          screenHeight: 1080,
          deviceType: 'desktop',
          platform: 'web',
          language: 'en',
          timezone: 'UTC'
        },
        sessionId: 'test-session',
        timestamp: new Date(),
        requestId: 'test-request'
      };

      const response = await adServer.requestAd(mockRequest);

      expect(response).toBeDefined();
      expect(response.requestId).toBe('test-request');
      expect(response.ads).toHaveLength(1);
      expect(response.metadata).toBeDefined();
      expect(response.metadata.processingTime).toBeGreaterThan(0);
      expect(response.metadata.targetingScore).toBeGreaterThanOrEqual(0);
      expect(response.metadata.targetingScore).toBeLessThanOrEqual(1);
    });

    it('should return fallback response when privacy compliance fails', async () => {
      const mockRequest: AdRequest = {
        placementId: 'test-placement',
        context: createMockAIContext(),
        privacySettings: createNonCompliantPrivacySettings(),
        deviceInfo: {
          userAgent: 'test-agent',
          screenWidth: 1920,
          screenHeight: 1080,
          deviceType: 'desktop',
          platform: 'web',
          language: 'en',
          timezone: 'UTC'
        },
        sessionId: 'test-session',
        timestamp: new Date(),
        requestId: 'test-request'
      };

      const response = await adServer.requestAd(mockRequest);

      expect(response.ads[0].id).toBe('fallback-ad');
      expect(response.metadata.auctionId).toBe('fallback');
    });

    it('should calculate targeting score based on context', async () => {
      const mockRequest: AdRequest = {
        placementId: 'test-placement',
        context: {
          topics: [
            {
              name: 'technology',
              category: 'tech',
              confidence: 0.9,
              keywords: ['AI', 'development', 'tools'],
              relevanceScore: 0.8
            }
          ],
          intent: {
            primary: 'learn',
            confidence: 0.8,
            category: IntentCategory.INFORMATIONAL,
            actionable: true
          },
          sentiment: {
            polarity: 0.5,
            magnitude: 0.7,
            label: 'positive',
            confidence: 0.8
          },
          conversationStage: {
            stage: 'exploration',
            progress: 0.5,
            duration: 30000,
            messageCount: 5
          },
          userEngagement: {
            score: 0.8,
            level: EngagementTier.HIGH,
            indicators: [],
            trend: 'increasing'
          },
          confidence: 0.9,
          extractedAt: new Date()
        },
        privacySettings: createMockPrivacySettings(),
        deviceInfo: {
          userAgent: 'test-agent',
          screenWidth: 1920,
          screenHeight: 1080,
          deviceType: 'desktop',
          platform: 'web',
          language: 'en',
          timezone: 'UTC'
        },
        sessionId: 'test-session',
        timestamp: new Date(),
        requestId: 'test-request'
      };

      const response = await adServer.requestAd(mockRequest);

      expect(response.metadata.targetingScore).toBeGreaterThan(0.5);
    });

    it('should include user profile in targeting calculation', async () => {
      const mockUserProfile: UserProfile = {
        id: 'test-user',
        interests: [
          {
            category: 'technology',
            score: 0.9,
            source: 'behavioral',
            lastUpdated: new Date()
          },
          {
            category: 'AI',
            score: 0.8,
            source: 'explicit',
            lastUpdated: new Date()
          }
        ],
        behaviorHistory: [],
        aiInteractionHistory: [],
        createdAt: new Date(),
        lastUpdated: new Date()
      };

      const mockRequest: AdRequest = {
        placementId: 'test-placement',
        context: createMockAIContext(),
        userProfile: mockUserProfile,
        privacySettings: createMockPrivacySettings(),
        deviceInfo: {
          userAgent: 'test-agent',
          screenWidth: 1920,
          screenHeight: 1080,
          deviceType: 'desktop',
          platform: 'web',
          language: 'en',
          timezone: 'UTC'
        },
        sessionId: 'test-session',
        timestamp: new Date(),
        requestId: 'test-request'
      };

      const response = await adServer.requestAd(mockRequest);

      expect(response.metadata.targetingScore).toBeGreaterThan(0.5);
    });
  });

  describe('recordImpression', () => {
    it('should record impression with context', () => {
      const adId = 'test-ad';
      const context: ImpressionContext = {
        adId,
        sessionId: 'test-session',
        placementId: 'test-placement',
        timestamp: new Date(),
        viewDuration: 5000,
        viewabilityScore: 0.8
      };

      // Should not throw
      expect(() => adServer.recordImpression(adId, context)).not.toThrow();

      // Check performance metrics updated
      const metrics = adServer.getPerformanceMetrics(adId);
      expect(metrics.impressions).toBe(1);
    });

    it('should update performance metrics on impression', () => {
      const adId = 'test-ad';
      const context: ImpressionContext = {
        adId,
        sessionId: 'test-session',
        placementId: 'test-placement',
        timestamp: new Date()
      };

      adServer.recordImpression(adId, context);
      adServer.recordImpression(adId, context);

      const metrics = adServer.getPerformanceMetrics(adId);
      expect(metrics.impressions).toBe(2);
    });
  });

  describe('recordClick', () => {
    it('should record click with context', () => {
      const adId = 'test-ad';
      const context: ClickContext = {
        adId,
        sessionId: 'test-session',
        placementId: 'test-placement',
        timestamp: new Date(),
        clickPosition: { x: 100, y: 200 },
        referrer: 'https://example.com'
      };

      expect(() => adServer.recordClick(adId, context)).not.toThrow();

      const metrics = adServer.getPerformanceMetrics(adId);
      expect(metrics.clicks).toBe(1);
    });

    it('should calculate CTR correctly', () => {
      const adId = 'test-ad';
      
      // Record impressions
      const impressionContext: ImpressionContext = {
        adId,
        sessionId: 'test-session',
        placementId: 'test-placement',
        timestamp: new Date()
      };
      
      for (let i = 0; i < 10; i++) {
        adServer.recordImpression(adId, impressionContext);
      }

      // Record clicks
      const clickContext: ClickContext = {
        adId,
        sessionId: 'test-session',
        placementId: 'test-placement',
        timestamp: new Date()
      };
      
      for (let i = 0; i < 2; i++) {
        adServer.recordClick(adId, clickContext);
      }

      const metrics = adServer.getPerformanceMetrics(adId);
      expect(metrics.ctr).toBe(20); // 2 clicks / 10 impressions * 100
    });
  });

  describe('recordConversion', () => {
    it('should record conversion with data', () => {
      const adId = 'test-ad';
      const conversionData: ConversionData = {
        adId,
        sessionId: 'test-session',
        conversionType: 'purchase',
        value: 99.99,
        currency: 'USD',
        timestamp: new Date(),
        metadata: { productId: 'prod-123' }
      };

      expect(() => adServer.recordConversion(adId, conversionData)).not.toThrow();

      const metrics = adServer.getPerformanceMetrics(adId);
      expect(metrics.conversions).toBe(1);
      expect(metrics.revenue).toBe(99.99);
    });

    it('should calculate CPM correctly', () => {
      const adId = 'test-ad';
      
      // Record 1000 impressions
      const impressionContext: ImpressionContext = {
        adId,
        sessionId: 'test-session',
        placementId: 'test-placement',
        timestamp: new Date()
      };
      
      for (let i = 0; i < 1000; i++) {
        adServer.recordImpression(adId, impressionContext);
      }

      // Record conversion with revenue
      const conversionData: ConversionData = {
        adId,
        sessionId: 'test-session',
        conversionType: 'purchase',
        value: 50.0,
        currency: 'USD',
        timestamp: new Date()
      };
      
      adServer.recordConversion(adId, conversionData);

      const metrics = adServer.getPerformanceMetrics(adId);
      expect(metrics.cpm).toBe(50); // $50 revenue / 1000 impressions * 1000
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should return default metrics for unknown ad', () => {
      const metrics = adServer.getPerformanceMetrics('unknown-ad');
      
      expect(metrics.impressions).toBe(0);
      expect(metrics.clicks).toBe(0);
      expect(metrics.conversions).toBe(0);
      expect(metrics.ctr).toBe(0);
      expect(metrics.cpm).toBe(0);
      expect(metrics.revenue).toBe(0);
      expect(metrics.engagementScore).toBe(0);
    });

    it('should calculate engagement score based on performance', () => {
      const adId = 'test-ad';
      
      // Create high-performing ad metrics
      const impressionContext: ImpressionContext = {
        adId,
        sessionId: 'test-session',
        placementId: 'test-placement',
        timestamp: new Date()
      };
      
      // 100 impressions
      for (let i = 0; i < 100; i++) {
        adServer.recordImpression(adId, impressionContext);
      }

      // 10 clicks (10% CTR)
      const clickContext: ClickContext = {
        adId,
        sessionId: 'test-session',
        placementId: 'test-placement',
        timestamp: new Date()
      };
      
      for (let i = 0; i < 10; i++) {
        adServer.recordClick(adId, clickContext);
      }

      // 2 conversions with revenue
      const conversionData: ConversionData = {
        adId,
        sessionId: 'test-session',
        conversionType: 'purchase',
        value: 25.0,
        currency: 'USD',
        timestamp: new Date()
      };
      
      for (let i = 0; i < 2; i++) {
        adServer.recordConversion(adId, conversionData);
      }

      const metrics = adServer.getPerformanceMetrics(adId);
      expect(metrics.engagementScore).toBeGreaterThan(0);
      expect(metrics.engagementScore).toBeLessThanOrEqual(1);
    });
  });
});

// Helper functions
function createMockAIContext(): AIContext {
  return {
    topics: [
      {
        name: 'technology',
        category: 'tech',
        confidence: 0.8,
        keywords: ['AI', 'development'],
        relevanceScore: 0.7
      }
    ],
    intent: {
      primary: 'learn',
      confidence: 0.7,
      category: IntentCategory.INFORMATIONAL,
      actionable: true
    },
    sentiment: {
      polarity: 0.2,
      magnitude: 0.5,
      label: 'neutral',
      confidence: 0.6
    },
    conversationStage: {
      stage: 'exploration',
      progress: 0.3,
      duration: 15000,
      messageCount: 3
    },
    userEngagement: {
      score: 0.6,
      level: EngagementTier.MEDIUM,
      indicators: [],
      trend: 'stable'
    },
    confidence: 0.8,
    extractedAt: new Date()
  };
}

function createMockPrivacySettings(): PrivacySettings {
  return {
    consentStatus: {
      advertising: true,
      analytics: true,
      personalization: true,
      dataSharing: false,
      timestamp: new Date(),
      jurisdiction: 'US',
      version: '1.0',
      consentMethod: ConsentMethod.EXPLICIT
    },
    dataRetentionPeriod: 365,
    privacyLevel: PrivacyLevel.STANDARD,
    dataProcessingBasis: DataProcessingBasis.CONSENT,
    optOutRequests: [],
    complianceFlags: [
      {
        regulation: PrivacyRegulation.GDPR,
        status: ComplianceStatus.COMPLIANT,
        lastChecked: new Date(),
        issues: []
      }
    ],
    encryptionEnabled: true,
    anonymizationLevel: 'pseudonymization'
  };
}

function createNonCompliantPrivacySettings(): PrivacySettings {
  return {
    consentStatus: {
      advertising: false, // No advertising consent
      analytics: false,
      personalization: false,
      dataSharing: false,
      timestamp: new Date(),
      jurisdiction: 'US',
      version: '1.0',
      consentMethod: ConsentMethod.EXPLICIT
    },
    dataRetentionPeriod: 365,
    privacyLevel: PrivacyLevel.MAXIMUM,
    dataProcessingBasis: DataProcessingBasis.CONSENT,
    optOutRequests: [],
    complianceFlags: [
      {
        regulation: PrivacyRegulation.GDPR,
        status: ComplianceStatus.NON_COMPLIANT,
        lastChecked: new Date(),
        issues: [
          {
            id: 'issue-1',
            type: 'missing_consent',
            severity: 'critical',
            description: 'Missing advertising consent',
            detectedAt: new Date(),
            resolved: false
          }
        ]
      }
    ],
    encryptionEnabled: true,
    anonymizationLevel: 'full_deletion'
  };
}