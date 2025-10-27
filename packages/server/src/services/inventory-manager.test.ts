import { describe, it, expect, beforeEach } from 'vitest';
import { 
  InventoryManager, 
  InventoryCriteria, 
  Advertiser,
  AdvertiserStatus,
  ContentModerationRule,
  ModerationRuleType,
  ModerationSeverity,
  ModerationAction,
  AdCampaign,
  CampaignType,
  CampaignStatus
} from './inventory-manager';
import { 
  Ad, 
  AdType, 
  AdFormat, 
  AIContext, 
  PrivacySettings,
  ConsentStatus,
  IntentCategory,
  EngagementLevel,
  EngagementTier,
  ConsentMethod,
  PrivacyLevel,
  DataProcessingBasis,
  ComplianceStatus,
  PrivacyRegulation,
  AdFormat
} from '@ai-yuugen/types';

describe('InventoryManager', () => {
  let inventoryManager: InventoryManager;

  beforeEach(() => {
    inventoryManager = new InventoryManager();
  });

  describe('getAvailableAds', () => {
    it('should return available ads based on criteria', async () => {
      const criteria: InventoryCriteria = {
        placementId: 'test-placement',
        context: createMockAIContext(),
        privacySettings: createMockPrivacySettings()
      };

      const ads = await inventoryManager.getAvailableAds(criteria);

      expect(ads).toBeDefined();
      expect(Array.isArray(ads)).toBe(true);
      expect(ads.length).toBeGreaterThan(0);
      expect(ads.length).toBeLessThanOrEqual(10); // Should limit to 10 ads
    });

    it('should filter out expired ads', async () => {
      // Add an expired ad
      const expiredAd: Ad = {
        id: 'expired-ad',
        type: AdType.BANNER,
        format: AdFormat.DISPLAY,
        content: {
          title: 'Expired Ad',
          description: 'This ad has expired',
          ctaText: 'Click',
          landingUrl: 'https://example.com',
          brandName: 'ExpiredBrand'
        },
        createdAt: new Date('2023-01-01'),
        expiresAt: new Date('2023-01-02') // Expired
      };

      inventoryManager.addAd(expiredAd);

      const criteria: InventoryCriteria = {
        placementId: 'test-placement',
        context: createMockAIContext(),
        privacySettings: createMockPrivacySettings()
      };

      const ads = await inventoryManager.getAvailableAds(criteria);

      // Should not include the expired ad
      expect(ads.find(ad => ad.id === 'expired-ad')).toBeUndefined();
    });

    it('should filter out blacklisted brands', async () => {
      // Add brand to blacklist
      await inventoryManager.addToBlacklist('TechCorp');

      const criteria: InventoryCriteria = {
        placementId: 'test-placement',
        context: createMockAIContext(),
        privacySettings: createMockPrivacySettings()
      };

      const ads = await inventoryManager.getAvailableAds(criteria);

      // Should not include ads from blacklisted brand
      expect(ads.find(ad => ad.content.brandName.toLowerCase() === 'techcorp')).toBeUndefined();
    });

    it('should filter out ads that fail moderation', async () => {
      // Add an ad with problematic content
      const problematicAd: Ad = {
        id: 'problematic-filter-ad',
        type: AdType.BANNER,
        format: AdFormat.DISPLAY,
        content: {
          title: 'Scam Alert',
          description: 'This is definitely a scam product',
          ctaText: 'Click Now',
          landingUrl: 'https://example.com',
          brandName: 'ScamBrand'
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      inventoryManager.addAd(problematicAd);
      await inventoryManager.moderateContent('problematic-filter-ad');

      const criteria: InventoryCriteria = {
        placementId: 'test-placement',
        context: createMockAIContext(),
        privacySettings: createMockPrivacySettings()
      };

      const ads = await inventoryManager.getAvailableAds(criteria);

      // Should not include the problematic ad
      expect(ads.find(ad => ad.id === 'problematic-filter-ad')).toBeUndefined();
    });

    it('should respect privacy settings', async () => {
      const noAdConsentSettings: PrivacySettings = {
        ...createMockPrivacySettings(),
        consentStatus: {
          ...createMockPrivacySettings().consentStatus,
          advertising: false // User opted out of advertising
        }
      };

      const criteria: InventoryCriteria = {
        placementId: 'test-placement',
        context: createMockAIContext(),
        privacySettings: noAdConsentSettings
      };

      const ads = await inventoryManager.getAvailableAds(criteria);

      // Should return no ads when user opted out
      expect(ads).toHaveLength(0);
    });

    it('should only include whitelisted brands when whitelist is not empty', async () => {
      // Add brand to whitelist
      await inventoryManager.addToWhitelist('EduPlatform');

      const criteria: InventoryCriteria = {
        placementId: 'test-placement',
        context: createMockAIContext(),
        privacySettings: createMockPrivacySettings()
      };

      const ads = await inventoryManager.getAvailableAds(criteria);

      // Should only include ads from whitelisted brands
      ads.forEach(ad => {
        expect(ad.content.brandName.toLowerCase()).toBe('eduplatform');
      });
    });

    it('should sort ads by relevance score', async () => {
      const contextWithTechTopics: AIContext = {
        topics: [
          {
            name: 'artificial intelligence',
            category: 'technology',
            confidence: 0.9,
            keywords: ['AI', 'machine learning', 'development', 'tools'],
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
      };

      const criteria: InventoryCriteria = {
        placementId: 'test-placement',
        context: contextWithTechTopics,
        privacySettings: createMockPrivacySettings()
      };

      const ads = await inventoryManager.getAvailableAds(criteria);

      expect(ads.length).toBeGreaterThan(1);
      
      // First ad should have higher relevance (tech-related ad should be first)
      const firstAd = ads[0];
      expect(firstAd.content.title.toLowerCase()).toContain('ai');
    });
  });

  describe('addToWhitelist', () => {
    it('should add brand to whitelist', async () => {
      await inventoryManager.addToWhitelist('TestBrand');

      // Test by checking if only whitelisted brand ads are returned
      const criteria: InventoryCriteria = {
        placementId: 'test-placement',
        context: createMockAIContext(),
        privacySettings: createMockPrivacySettings()
      };

      const ads = await inventoryManager.getAvailableAds(criteria);
      
      // Should only return ads from whitelisted brand (if any exist)
      ads.forEach(ad => {
        expect(ad.content.brandName.toLowerCase()).toBe('testbrand');
      });
    });
  });

  describe('addToBlacklist', () => {
    it('should add brand to blacklist', async () => {
      await inventoryManager.addToBlacklist('TechCorp');

      const criteria: InventoryCriteria = {
        placementId: 'test-placement',
        context: createMockAIContext(),
        privacySettings: createMockPrivacySettings()
      };

      const ads = await inventoryManager.getAvailableAds(criteria);

      // Should not include ads from blacklisted brand
      expect(ads.find(ad => ad.content.brandName.toLowerCase() === 'techcorp')).toBeUndefined();
    });
  });

  describe('moderateContent', () => {
    it('should approve clean content', async () => {
      const cleanAd: Ad = {
        id: 'clean-ad',
        type: AdType.BANNER,
        format: AdFormat.DISPLAY,
        content: {
          title: 'Great Software Tools',
          description: 'Professional development tools for modern applications',
          ctaText: 'Learn More',
          landingUrl: 'https://example.com',
          brandName: 'CleanBrand'
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      inventoryManager.addAd(cleanAd);

      const result = await inventoryManager.moderateContent('clean-ad');
      expect(result.approved).toBe(true);
      expect(result.score).toBeGreaterThan(80);
      expect(result.flags).toHaveLength(0);
    });

    it('should reject content with prohibited words', async () => {
      const problematicAd: Ad = {
        id: 'problematic-ad',
        type: AdType.BANNER,
        format: AdFormat.DISPLAY,
        content: {
          title: 'Spam Software',
          description: 'This is definitely not a scam product',
          ctaText: 'Click Now',
          landingUrl: 'https://example.com',
          brandName: 'ProblematicBrand'
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      inventoryManager.addAd(problematicAd);

      const result = await inventoryManager.moderateContent('problematic-ad');
      expect(result.approved).toBe(false);
      expect(result.flags.length).toBeGreaterThan(0);
      expect(result.blockedReasons.length).toBeGreaterThan(0);
    });

    it('should flag content requiring review', async () => {
      const gamblingAd: Ad = {
        id: 'gambling-ad',
        type: AdType.BANNER,
        format: AdFormat.DISPLAY,
        content: {
          title: 'Online Casino',
          description: 'Try your luck at our casino games',
          ctaText: 'Play Now',
          landingUrl: 'https://example.com',
          brandName: 'CasinoBrand'
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      inventoryManager.addAd(gamblingAd);

      const result = await inventoryManager.moderateContent('gambling-ad');
      expect(result.reviewRequired).toBe(true);
      expect(result.flags.some(f => f.severity === ModerationSeverity.MEDIUM)).toBe(true);
    });

    it('should throw error for non-existent ad', async () => {
      await expect(inventoryManager.moderateContent('non-existent-ad')).rejects.toThrow();
    });
  });

  describe('Advertiser Management', () => {
    it('should add advertiser', async () => {
      const advertiser: Omit<Advertiser, 'id' | 'createdAt' | 'lastReviewed'> = {
        name: 'TestAdvertiser',
        domain: 'testadvertiser.com',
        category: 'Technology',
        trustScore: 85,
        status: AdvertiserStatus.PENDING
      };

      const advertiserId = await inventoryManager.addAdvertiser(advertiser);
      expect(advertiserId).toBeDefined();
      expect(typeof advertiserId).toBe('string');

      const retrievedAdvertiser = inventoryManager.getAdvertiser(advertiserId);
      expect(retrievedAdvertiser).toBeDefined();
      expect(retrievedAdvertiser?.name).toBe('TestAdvertiser');
    });

    it('should update advertiser status', async () => {
      const advertiser: Omit<Advertiser, 'id' | 'createdAt' | 'lastReviewed'> = {
        name: 'StatusTestAdvertiser',
        domain: 'statustest.com',
        category: 'Technology',
        trustScore: 75,
        status: AdvertiserStatus.PENDING
      };

      const advertiserId = await inventoryManager.addAdvertiser(advertiser);
      await inventoryManager.updateAdvertiserStatus(advertiserId, AdvertiserStatus.APPROVED);

      const updatedAdvertiser = inventoryManager.getAdvertiser(advertiserId);
      expect(updatedAdvertiser?.status).toBe(AdvertiserStatus.APPROVED);
    });

    it('should get advertisers by status', () => {
      const approvedAdvertisers = inventoryManager.getAdvertisers(AdvertiserStatus.APPROVED);
      expect(approvedAdvertisers.length).toBeGreaterThan(0);
      approvedAdvertisers.forEach(advertiser => {
        expect(advertiser.status).toBe(AdvertiserStatus.APPROVED);
      });
    });
  });

  describe('Whitelist/Blacklist Management', () => {
    it('should manage whitelist', async () => {
      await inventoryManager.addToWhitelist('WhitelistBrand');
      expect(inventoryManager.getWhitelist()).toContain('whitelistbrand');

      await inventoryManager.removeFromWhitelist('WhitelistBrand');
      expect(inventoryManager.getWhitelist()).not.toContain('whitelistbrand');
    });

    it('should manage blacklist', async () => {
      await inventoryManager.addToBlacklist('BlacklistBrand');
      expect(inventoryManager.getBlacklist()).toContain('blacklistbrand');

      await inventoryManager.removeFromBlacklist('BlacklistBrand');
      expect(inventoryManager.getBlacklist()).not.toContain('blacklistbrand');
    });

    it('should manage category blacklist', async () => {
      await inventoryManager.addCategoryToBlacklist('Adult');
      expect(inventoryManager.getCategoryBlacklist()).toContain('adult');

      await inventoryManager.removeCategoryFromBlacklist('Adult');
      expect(inventoryManager.getCategoryBlacklist()).not.toContain('adult');
    });
  });

  describe('Moderation Rules', () => {
    it('should add moderation rule', async () => {
      const rule: Omit<ContentModerationRule, 'id' | 'createdAt' | 'lastUpdated'> = {
        name: 'Test Rule',
        type: ModerationRuleType.KEYWORD_BLACKLIST,
        pattern: 'testword',
        severity: ModerationSeverity.MEDIUM,
        action: ModerationAction.FLAG,
        enabled: true
      };

      const ruleId = await inventoryManager.addModerationRule(rule);
      expect(ruleId).toBeDefined();

      const rules = inventoryManager.getModerationRules();
      expect(rules.find(r => r.id === ruleId)).toBeDefined();
    });

    it('should update moderation rule', async () => {
      const rule: Omit<ContentModerationRule, 'id' | 'createdAt' | 'lastUpdated'> = {
        name: 'Update Test Rule',
        type: ModerationRuleType.KEYWORD_BLACKLIST,
        pattern: 'updatetest',
        severity: ModerationSeverity.LOW,
        action: ModerationAction.FLAG,
        enabled: true
      };

      const ruleId = await inventoryManager.addModerationRule(rule);
      await inventoryManager.updateModerationRule(ruleId, { severity: ModerationSeverity.HIGH });

      const rules = inventoryManager.getModerationRules();
      const updatedRule = rules.find(r => r.id === ruleId);
      expect(updatedRule?.severity).toBe(ModerationSeverity.HIGH);
    });

    it('should delete moderation rule', async () => {
      const rule: Omit<ContentModerationRule, 'id' | 'createdAt' | 'lastUpdated'> = {
        name: 'Delete Test Rule',
        type: ModerationRuleType.KEYWORD_BLACKLIST,
        pattern: 'deletetest',
        severity: ModerationSeverity.LOW,
        action: ModerationAction.FLAG,
        enabled: true
      };

      const ruleId = await inventoryManager.addModerationRule(rule);
      await inventoryManager.deleteModerationRule(ruleId);

      const rules = inventoryManager.getModerationRules();
      expect(rules.find(r => r.id === ruleId)).toBeUndefined();
    });
  });

  describe('Campaign Management', () => {
    it('should create campaign', async () => {
      const campaign: Omit<AdCampaign, 'id' | 'createdAt' | 'lastUpdated'> = {
        advertiserId: 'test-advertiser',
        name: 'Test Campaign',
        type: CampaignType.DIRECT,
        status: CampaignStatus.ACTIVE,
        budget: 10000,
        spent: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        targetingCriteria: {
          interests: ['technology'],
          topics: ['software']
        }
      };

      const campaignId = await inventoryManager.createCampaign(campaign);
      expect(campaignId).toBeDefined();

      const retrievedCampaign = inventoryManager.getCampaign(campaignId);
      expect(retrievedCampaign).toBeDefined();
      expect(retrievedCampaign?.name).toBe('Test Campaign');
    });

    it('should update campaign', async () => {
      const campaign: Omit<AdCampaign, 'id' | 'createdAt' | 'lastUpdated'> = {
        advertiserId: 'test-advertiser-2',
        name: 'Update Test Campaign',
        type: CampaignType.PROGRAMMATIC,
        status: CampaignStatus.DRAFT,
        budget: 5000,
        spent: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        targetingCriteria: {}
      };

      const campaignId = await inventoryManager.createCampaign(campaign);
      await inventoryManager.updateCampaign(campaignId, { status: CampaignStatus.ACTIVE });

      const updatedCampaign = inventoryManager.getCampaign(campaignId);
      expect(updatedCampaign?.status).toBe(CampaignStatus.ACTIVE);
    });

    it('should get campaigns by advertiser', async () => {
      const advertiserId = 'specific-advertiser';
      const campaign: Omit<AdCampaign, 'id' | 'createdAt' | 'lastUpdated'> = {
        advertiserId,
        name: 'Advertiser Campaign',
        type: CampaignType.DIRECT,
        status: CampaignStatus.ACTIVE,
        budget: 8000,
        spent: 1000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        targetingCriteria: {}
      };

      await inventoryManager.createCampaign(campaign);
      const campaigns = inventoryManager.getCampaignsByAdvertiser(advertiserId);
      
      expect(campaigns.length).toBeGreaterThan(0);
      campaigns.forEach(c => {
        expect(c.advertiserId).toBe(advertiserId);
      });
    });

    it('should get active campaigns', () => {
      const activeCampaigns = inventoryManager.getActiveCampaigns();
      activeCampaigns.forEach(campaign => {
        expect(campaign.status).toBe(CampaignStatus.ACTIVE);
      });
    });
  });

  describe('Manual Review', () => {
    it('should approve ad after manual review', async () => {
      const testAd: Ad = {
        id: 'manual-review-ad',
        type: AdType.BANNER,
        format: AdFormat.DISPLAY,
        content: {
          title: 'Manual Review Test',
          description: 'This ad needs manual review',
          ctaText: 'Click',
          landingUrl: 'https://example.com',
          brandName: 'ReviewBrand'
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      inventoryManager.addAd(testAd);
      await inventoryManager.moderateContent('manual-review-ad');
      await inventoryManager.approveAd('manual-review-ad', 'reviewer-123');

      const result = inventoryManager.getModerationResult('manual-review-ad');
      expect(result?.approved).toBe(true);
      expect(result?.reviewRequired).toBe(false);
      expect(result?.moderatedBy).toBe('reviewer-123');
    });

    it('should reject ad after manual review', async () => {
      const testAd: Ad = {
        id: 'manual-reject-ad',
        type: AdType.BANNER,
        format: AdFormat.DISPLAY,
        content: {
          title: 'Manual Reject Test',
          description: 'This ad will be rejected',
          ctaText: 'Click',
          landingUrl: 'https://example.com',
          brandName: 'RejectBrand'
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      inventoryManager.addAd(testAd);
      await inventoryManager.moderateContent('manual-reject-ad');
      await inventoryManager.rejectAd('manual-reject-ad', 'Inappropriate content', 'reviewer-456');

      const result = inventoryManager.getModerationResult('manual-reject-ad');
      expect(result?.approved).toBe(false);
      expect(result?.reviewRequired).toBe(false);
      expect(result?.moderatedBy).toBe('reviewer-456');
      expect(result?.blockedReasons).toContain('Inappropriate content');
    });
  });

  describe('addAd', () => {
    it('should add ad to inventory', () => {
      const newAd: Ad = {
        id: 'new-ad',
        type: AdType.NATIVE,
        format: AdFormat.TEXT,
        content: {
          title: 'New Product',
          description: 'Amazing new product for developers',
          ctaText: 'Try Now',
          landingUrl: 'https://example.com',
          brandName: 'NewBrand'
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      inventoryManager.addAd(newAd);

      const retrievedAd = inventoryManager.getAd('new-ad');
      expect(retrievedAd).toBeDefined();
      expect(retrievedAd?.id).toBe('new-ad');
    });
  });

  describe('removeAd', () => {
    it('should remove ad from inventory', () => {
      const adToRemove: Ad = {
        id: 'remove-me',
        type: AdType.BANNER,
        format: AdFormat.DISPLAY,
        content: {
          title: 'Remove Me',
          description: 'This ad will be removed',
          ctaText: 'Click',
          landingUrl: 'https://example.com',
          brandName: 'RemoveBrand'
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      inventoryManager.addAd(adToRemove);
      expect(inventoryManager.getAd('remove-me')).toBeDefined();

      inventoryManager.removeAd('remove-me');
      expect(inventoryManager.getAd('remove-me')).toBeUndefined();
    });
  });

  describe('getAd', () => {
    it('should return ad by ID', () => {
      const testAd: Ad = {
        id: 'get-test-ad',
        type: AdType.INTERSTITIAL,
        format: AdFormat.RICH_MEDIA,
        content: {
          title: 'Get Test Ad',
          description: 'This is a test ad for retrieval',
          ctaText: 'Test',
          landingUrl: 'https://example.com',
          brandName: 'TestBrand'
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      inventoryManager.addAd(testAd);

      const retrievedAd = inventoryManager.getAd('get-test-ad');
      expect(retrievedAd).toBeDefined();
      expect(retrievedAd?.id).toBe('get-test-ad');
      expect(retrievedAd?.content.title).toBe('Get Test Ad');
    });

    it('should return undefined for non-existent ad', () => {
      const retrievedAd = inventoryManager.getAd('non-existent');
      expect(retrievedAd).toBeUndefined();
    });
  });

  describe('getInventoryStats', () => {
    it('should return comprehensive inventory statistics', async () => {
      // Add some test ads
      const activeAd: Ad = {
        id: 'active-stats-ad',
        type: AdType.BANNER,
        format: AdFormat.DISPLAY,
        content: {
          title: 'Active Ad',
          description: 'This ad is active',
          ctaText: 'Click',
          landingUrl: 'https://example.com',
          brandName: 'ActiveBrand'
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Future date
      };

      const expiredAd: Ad = {
        id: 'expired-stats-ad',
        type: AdType.BANNER,
        format: AdFormat.DISPLAY,
        content: {
          title: 'Expired Ad',
          description: 'This ad is expired',
          ctaText: 'Click',
          landingUrl: 'https://example.com',
          brandName: 'ExpiredBrand'
        },
        createdAt: new Date('2023-01-01'),
        expiresAt: new Date('2023-01-02') // Past date
      };

      inventoryManager.addAd(activeAd);
      inventoryManager.addAd(expiredAd);

      // Moderate the active ad to generate moderation data
      await inventoryManager.moderateContent('active-stats-ad');

      const stats = inventoryManager.getInventoryStats();

      expect(stats.totalAds).toBeGreaterThanOrEqual(2);
      expect(stats.activeAds).toBeGreaterThanOrEqual(1);
      expect(stats.expiredAds).toBeGreaterThanOrEqual(1);
      expect(stats.totalAds).toBe(stats.activeAds + stats.expiredAds);
      expect(stats.approvedAdvertisers).toBeGreaterThan(0);
      expect(typeof stats.pendingReview).toBe('number');
      expect(typeof stats.blockedAds).toBe('number');
      expect(typeof stats.moderationFlags).toBe('number');
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
        keywords: ['software', 'development'],
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