import { describe, it, expect, beforeEach } from 'vitest';
import { AdSalesIntegration, ProgrammaticBidRequest, DirectAdDeal, HouseAdConfig } from './ad-sales-integration';
import { InventoryManager, CampaignType } from './inventory-manager';
import { AdType, AdFormat } from '@ai-yuugen/types';

describe('AdSalesIntegration', () => {
  let inventoryManager: InventoryManager;
  let adSalesIntegration: AdSalesIntegration;

  beforeEach(() => {
    inventoryManager = new InventoryManager();
    adSalesIntegration = new AdSalesIntegration(inventoryManager);
  });

  describe('Programmatic Ad Sales', () => {
    it('should handle programmatic bid request successfully', async () => {
      const bidRequest: ProgrammaticBidRequest = {
        requestId: 'bid-123',
        placementId: 'test-placement',
        context: createMockAIContext(),
        privacySettings: createMockPrivacySettings(),
        floorPrice: 1.0
      };

      const response = await adSalesIntegration.handleProgrammaticBid(bidRequest);

      expect(response.success).toBe(true);
      expect(response.requestId).toBe('bid-123');
      expect(response.ad).toBeDefined();
      expect(response.bidPrice).toBeGreaterThan(0);
      expect(response.currency).toBe('USD');
      expect(response.dealId).toMatch(/^prog-/);
    });

    it('should return failure when no ads available', async () => {
      // Create a bid request with very restrictive privacy settings
      const bidRequest: ProgrammaticBidRequest = {
        requestId: 'bid-456',
        placementId: 'test-placement',
        context: createMockAIContext(),
        privacySettings: {
          ...createMockPrivacySettings(),
          consentStatus: {
            ...createMockPrivacySettings().consentStatus,
            advertising: false // No ad consent
          }
        }
      };

      const response = await adSalesIntegration.handleProgrammaticBid(bidRequest);

      expect(response.success).toBe(false);
      expect(response.reason).toContain('No available ads');
    });
  });

  describe('Direct Ad Sales', () => {
    it('should create direct campaign successfully', async () => {
      const directDeal: DirectAdDeal = {
        advertiserId: 'direct-advertiser-1',
        advertiserName: 'Direct Advertiser',
        advertiserDomain: 'directadvertiser.com',
        category: 'Technology',
        campaignName: 'Direct Campaign Test',
        budget: 50000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        salesRepId: 'sales-rep-123',
        targetingCriteria: {
          interests: ['technology', 'software'],
          topics: ['development', 'programming']
        },
        ads: [
          {
            type: AdType.BANNER,
            format: AdFormat.DISPLAY,
            content: {
              title: 'Direct Ad Campaign',
              description: 'Premium software development tools',
              imageUrl: 'https://example.com/direct-ad.jpg',
              ctaText: 'Learn More',
              landingUrl: 'https://directadvertiser.com/campaign',
              brandName: 'Direct Advertiser'
            }
          }
        ]
      };

      const campaignId = await adSalesIntegration.createDirectCampaign(directDeal);

      expect(campaignId).toBeDefined();
      expect(typeof campaignId).toBe('string');

      // Verify campaign was created
      const campaign = inventoryManager.getCampaign(campaignId);
      expect(campaign).toBeDefined();
      expect(campaign?.type).toBe(CampaignType.DIRECT);
      expect(campaign?.name).toBe('Direct Campaign Test');
      expect(campaign?.budget).toBe(50000);

      // Verify advertiser was created
      const advertiser = inventoryManager.getAdvertiser(campaign!.advertiserId);
      expect(advertiser).toBeDefined();
      expect(advertiser?.name).toBe('Direct Advertiser');
      expect(advertiser?.trustScore).toBe(95);
    });
  });

  describe('House Ad Management', () => {
    it('should create house ad campaign successfully', async () => {
      const houseAdConfig: HouseAdConfig = {
        campaignName: 'House Ad Campaign',
        targetingCriteria: {
          interests: ['ai-development'],
          topics: ['artificial intelligence']
        },
        ads: [
          {
            type: AdType.NATIVE,
            format: AdFormat.TEXT,
            content: {
              title: 'Try AI Ad Yuugen Pro',
              description: 'Upgrade to our premium features for better ad targeting',
              ctaText: 'Upgrade Now',
              landingUrl: 'https://ai-yuugen.com/pro',
              brandName: 'AI Ad Yuugen'
            }
          }
        ]
      };

      const campaignId = await adSalesIntegration.createHouseAdCampaign(houseAdConfig);

      expect(campaignId).toBeDefined();
      expect(typeof campaignId).toBe('string');

      // Verify campaign was created
      const campaign = inventoryManager.getCampaign(campaignId);
      expect(campaign).toBeDefined();
      expect(campaign?.type).toBe(CampaignType.HOUSE);
      expect(campaign?.name).toBe('House Ad Campaign');
      expect(campaign?.budget).toBe(0); // House ads have no budget

      // Verify internal advertiser was created
      const advertiser = inventoryManager.getAdvertiser(campaign!.advertiserId);
      expect(advertiser).toBeDefined();
      expect(advertiser?.name).toBe('Internal');
      expect(advertiser?.trustScore).toBe(100);
    });
  });

  describe('Integration with Inventory Manager', () => {
    it('should properly moderate direct ads', async () => {
      const directDeal: DirectAdDeal = {
        advertiserId: 'moderation-test-advertiser',
        advertiserName: 'Moderation Test',
        advertiserDomain: 'moderationtest.com',
        category: 'Technology',
        campaignName: 'Moderation Test Campaign',
        budget: 10000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        salesRepId: 'sales-rep-456',
        targetingCriteria: {},
        ads: [
          {
            type: AdType.BANNER,
            format: AdFormat.DISPLAY,
            content: {
              title: 'Clean Direct Ad',
              description: 'Professional software solutions',
              ctaText: 'Learn More',
              landingUrl: 'https://moderationtest.com',
              brandName: 'Moderation Test'
            }
          }
        ]
      };

      await adSalesIntegration.createDirectCampaign(directDeal);

      // Check that ads were moderated
      const stats = inventoryManager.getInventoryStats();
      expect(stats.totalAds).toBeGreaterThan(0);
      
      // Direct ads should be approved after moderation
      const availableAds = await inventoryManager.getAvailableAds({
        placementId: 'test-placement',
        context: createMockAIContext(),
        privacySettings: createMockPrivacySettings()
      });

      const directAd = availableAds.find(ad => ad.content.brandName === 'Moderation Test');
      expect(directAd).toBeDefined();
    });
  });
});

// Helper functions (reused from inventory-manager.test.ts)
function createMockAIContext() {
  return {
    topics: [
      {
        name: 'technology',
        category: 'tech',
        confidence: 0.8,
        keywords: ['software', 'development'],
        relevanceScore: 0.7
      }
    ],
    intent: {
      primary: 'learn',
      confidence: 0.7,
      category: 'informational',
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
      level: 'medium',
      indicators: [],
      trend: 'stable'
    },
    confidence: 0.8,
    extractedAt: new Date()
  };
}

function createMockPrivacySettings() {
  return {
    consentStatus: {
      advertising: true,
      analytics: true,
      personalization: true,
      dataSharing: false,
      timestamp: new Date(),
      jurisdiction: 'US',
      version: '1.0',
      consentMethod: 'explicit'
    },
    dataRetentionPeriod: 365,
    privacyLevel: 'standard',
    dataProcessingBasis: 'consent',
    optOutRequests: [],
    complianceFlags: [
      {
        regulation: 'gdpr',
        status: 'compliant',
        lastChecked: new Date(),
        issues: []
      }
    ],
    encryptionEnabled: true,
    anonymizationLevel: 'pseudonymization'
  };
}