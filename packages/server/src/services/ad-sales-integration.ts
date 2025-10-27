import { InventoryManager, AdCampaign, CampaignType, CampaignStatus, AdvertiserStatus } from './inventory-manager';
import { Ad, AdType, AdFormat } from '@ai-yuugen/types';

/**
 * Integration service for programmatic and direct ad sales
 * Demonstrates how the inventory manager works with different sales channels
 */
export class AdSalesIntegration {
  constructor(private inventoryManager: InventoryManager) {}

  /**
   * Programmatic ad sales integration
   * Simulates integration with demand-side platforms (DSPs) and ad exchanges
   */
  async handleProgrammaticBid(bidRequest: ProgrammaticBidRequest): Promise<ProgrammaticBidResponse> {
    // Get available ads that match the bid request criteria
    const availableAds = await this.inventoryManager.getAvailableAds({
      placementId: bidRequest.placementId,
      context: bidRequest.context,
      privacySettings: bidRequest.privacySettings
    });

    if (availableAds.length === 0) {
      return {
        requestId: bidRequest.requestId,
        success: false,
        reason: 'No available ads matching criteria'
      };
    }

    // Select the highest scoring ad for programmatic auction
    const selectedAd = availableAds[0];
    
    // Calculate bid price based on ad performance and targeting
    const bidPrice = this.calculateProgrammaticBidPrice(selectedAd, bidRequest);

    return {
      requestId: bidRequest.requestId,
      success: true,
      ad: selectedAd,
      bidPrice,
      currency: 'USD',
      dealId: `prog-${Date.now()}`
    };
  }

  /**
   * Direct ad sales integration
   * Handles direct deals with advertisers
   */
  async createDirectCampaign(directDeal: DirectAdDeal): Promise<string> {
    // Create advertiser if not exists
    let advertiserId = directDeal.advertiserId;
    if (!this.inventoryManager.getAdvertiser(advertiserId)) {
      advertiserId = await this.inventoryManager.addAdvertiser({
        name: directDeal.advertiserName,
        domain: directDeal.advertiserDomain,
        category: directDeal.category,
        trustScore: 95, // Direct deals typically have high trust scores
        status: AdvertiserStatus.APPROVED // Direct deals are pre-approved
      });
    }

    // Create campaign for direct deal
    const campaignId = await this.inventoryManager.createCampaign({
      advertiserId,
      name: directDeal.campaignName,
      type: CampaignType.DIRECT,
      status: CampaignStatus.ACTIVE,
      budget: directDeal.budget,
      spent: 0,
      startDate: directDeal.startDate,
      endDate: directDeal.endDate,
      targetingCriteria: directDeal.targetingCriteria
    });

    // Add ads to inventory
    for (const adData of directDeal.ads) {
      const ad: Ad = {
        id: `direct-${campaignId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: adData.type,
        format: adData.format,
        content: adData.content,
        createdAt: new Date(),
        expiresAt: directDeal.endDate
      };

      this.inventoryManager.addAd(ad);
      
      // Auto-moderate direct ads (they typically have higher trust)
      await this.inventoryManager.moderateContent(ad.id, `direct-sales-${directDeal.salesRepId}`);
    }

    return campaignId;
  }

  /**
   * House ad management
   * For internal promotional content
   */
  async createHouseAdCampaign(houseAdConfig: HouseAdConfig): Promise<string> {
    // Create internal advertiser entry
    const advertiserId = await this.inventoryManager.addAdvertiser({
      name: 'Internal',
      domain: 'internal.ai-yuugen.com',
      category: 'House',
      trustScore: 100,
      status: AdvertiserStatus.APPROVED
    });

    // Create house ad campaign
    const campaignId = await this.inventoryManager.createCampaign({
      advertiserId,
      name: houseAdConfig.campaignName,
      type: CampaignType.HOUSE,
      status: CampaignStatus.ACTIVE,
      budget: 0, // House ads don't have budget constraints
      spent: 0,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      targetingCriteria: houseAdConfig.targetingCriteria
    });

    // Add house ads
    for (const adData of houseAdConfig.ads) {
      const ad: Ad = {
        id: `house-${campaignId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: adData.type,
        format: adData.format,
        content: adData.content,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      };

      this.inventoryManager.addAd(ad);
      
      // House ads are automatically approved
      await this.inventoryManager.moderateContent(ad.id, 'house-ads-system');
      await this.inventoryManager.approveAd(ad.id, 'house-ads-system');
    }

    return campaignId;
  }

  /**
   * Calculate bid price for programmatic auctions
   */
  private calculateProgrammaticBidPrice(ad: Ad, bidRequest: ProgrammaticBidRequest): number {
    let basePrice = 2.50; // Base CPM

    // Adjust based on targeting relevance
    if (bidRequest.context.topics && bidRequest.context.topics.length > 0) {
      const adText = `${ad.content.title} ${ad.content.description}`.toLowerCase();
      const relevanceScore = bidRequest.context.topics.reduce((score: number, topic: any) => {
        const keywordMatches = topic.keywords.filter((keyword: string) => 
          adText.includes(keyword.toLowerCase())
        ).length;
        return score + (keywordMatches / topic.keywords.length) * topic.confidence;
      }, 0) / bidRequest.context.topics.length;

      basePrice *= (1 + relevanceScore);
    }

    // Adjust based on user engagement
    if (bidRequest.context.userEngagement) {
      basePrice *= (1 + bidRequest.context.userEngagement.score * 0.5);
    }

    // Floor price
    return Math.max(basePrice, 0.50);
  }
}

// Type definitions for sales integration

export interface ProgrammaticBidRequest {
  requestId: string;
  placementId: string;
  context: any; // AIContext
  privacySettings: any; // PrivacySettings
  floorPrice?: number;
  dealIds?: string[];
}

export interface ProgrammaticBidResponse {
  requestId: string;
  success: boolean;
  ad?: Ad;
  bidPrice?: number;
  currency?: string;
  dealId?: string;
  reason?: string;
}

export interface DirectAdDeal {
  advertiserId: string;
  advertiserName: string;
  advertiserDomain: string;
  category: string;
  campaignName: string;
  budget: number;
  startDate: Date;
  endDate: Date;
  salesRepId: string;
  targetingCriteria: any; // TargetingCriteria
  ads: DirectAdData[];
}

export interface DirectAdData {
  type: AdType;
  format: AdFormat;
  content: {
    title: string;
    description: string;
    imageUrl?: string;
    videoUrl?: string;
    ctaText: string;
    landingUrl: string;
    brandName: string;
  };
}

export interface HouseAdConfig {
  campaignName: string;
  targetingCriteria: any; // TargetingCriteria
  ads: DirectAdData[];
}