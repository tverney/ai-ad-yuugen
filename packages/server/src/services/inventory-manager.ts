import { 
  Ad, 
  AdType, 
  AdFormat, 
  AIContext, 
  UserProfile, 
  PrivacySettings 
} from '@ai-yuugen/types';

export interface InventoryCriteria {
  placementId: string;
  context: AIContext;
  userProfile?: UserProfile;
  privacySettings: PrivacySettings;
}

export interface Advertiser {
  id: string;
  name: string;
  domain: string;
  category: string;
  trustScore: number; // 0-100
  status: AdvertiserStatus;
  createdAt: Date;
  lastReviewed: Date;
  metadata?: Record<string, any>;
}

export enum AdvertiserStatus {
  APPROVED = 'approved',
  PENDING = 'pending',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
  UNDER_REVIEW = 'under_review'
}

export interface ContentModerationRule {
  id: string;
  name: string;
  type: ModerationRuleType;
  pattern: string | RegExp;
  severity: ModerationSeverity;
  action: ModerationAction;
  enabled: boolean;
  createdAt: Date;
  lastUpdated: Date;
}

export enum ModerationRuleType {
  KEYWORD_BLACKLIST = 'keyword_blacklist',
  CONTENT_CATEGORY = 'content_category',
  BRAND_SAFETY = 'brand_safety',
  REGULATORY_COMPLIANCE = 'regulatory_compliance',
  CUSTOM_FILTER = 'custom_filter'
}

export enum ModerationSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ModerationAction {
  BLOCK = 'block',
  FLAG = 'flag',
  REQUIRE_REVIEW = 'require_review',
  AUTO_APPROVE = 'auto_approve'
}

export interface ModerationResult {
  adId: string;
  approved: boolean;
  score: number; // 0-100 safety score
  flags: ModerationFlag[];
  reviewRequired: boolean;
  blockedReasons: string[];
  moderatedAt: Date;
  moderatedBy: string; // 'system' or user ID
}

export interface ModerationFlag {
  ruleId: string;
  ruleName: string;
  severity: ModerationSeverity;
  reason: string;
  confidence: number; // 0-1
}

export interface AdCampaign {
  id: string;
  advertiserId: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  budget: number;
  spent: number;
  startDate: Date;
  endDate: Date;
  targetingCriteria: TargetingCriteria;
  createdAt: Date;
  lastUpdated: Date;
}

export enum CampaignType {
  PROGRAMMATIC = 'programmatic',
  DIRECT = 'direct',
  HOUSE = 'house'
}

export enum CampaignStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  DRAFT = 'draft'
}

export interface TargetingCriteria {
  demographics?: {
    ageRanges?: string[];
    genders?: string[];
    locations?: string[];
  };
  interests?: string[];
  topics?: string[];
  contextual?: {
    keywords?: string[];
    categories?: string[];
    sentiments?: string[];
  };
  behavioral?: {
    patterns?: string[];
    engagementLevels?: string[];
  };
}

export interface InventoryStats {
  totalAds: number;
  activeAds: number;
  expiredAds: number;
  pendingReview: number;
  blockedAds: number;
  approvedAdvertisers: number;
  pendingAdvertisers: number;
  moderationFlags: number;
}

/**
 * Comprehensive inventory manager with brand safety and content moderation
 */
export class InventoryManager {
  private adInventory: Map<string, Ad> = new Map();
  private advertisers: Map<string, Advertiser> = new Map();
  private campaigns: Map<string, AdCampaign> = new Map();
  private moderationRules: Map<string, ContentModerationRule> = new Map();
  private moderationResults: Map<string, ModerationResult> = new Map();
  private whitelist: Set<string> = new Set();
  private blacklist: Set<string> = new Set();
  private categoryBlacklist: Set<string> = new Set();

  constructor() {
    // Initialize with sample ad inventory for testing
    this.initializeSampleInventory();
    this.initializeModerationRules();
    this.initializeSampleAdvertisers();
  }

  /**
   * Get available ads based on criteria with comprehensive filtering
   */
  async getAvailableAds(criteria: InventoryCriteria): Promise<Ad[]> {
    const allAds = Array.from(this.adInventory.values());
    
    // Filter ads based on comprehensive criteria
    const filteredAds = allAds.filter(ad => {
      // Check if ad is not expired
      if (ad.expiresAt < new Date()) {
        return false;
      }

      // Check moderation status
      const moderationResult = this.moderationResults.get(ad.id);
      if (!moderationResult || !moderationResult.approved) {
        return false;
      }

      // Brand safety checks
      if (!this.passesBrandSafetyChecks(ad)) {
        return false;
      }

      // Privacy compliance check
      if (!this.passesPrivacyCompliance(ad, criteria.privacySettings)) {
        return false;
      }

      // Context relevance check
      if (!this.passesContextRelevance(ad, criteria.context)) {
        return false;
      }

      return true;
    });

    // Sort by relevance and safety score
    filteredAds.sort((a, b) => {
      const scoreA = this.calculateComprehensiveScore(a, criteria);
      const scoreB = this.calculateComprehensiveScore(b, criteria);
      return scoreB - scoreA;
    });

    // Return top 10 ads to avoid overwhelming the auction
    return filteredAds.slice(0, 10);
  }

  // ===== ADVERTISER MANAGEMENT =====

  /**
   * Add advertiser to the system
   */
  async addAdvertiser(advertiser: Omit<Advertiser, 'id' | 'createdAt' | 'lastReviewed'>): Promise<string> {
    const id = `advertiser-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newAdvertiser: Advertiser = {
      ...advertiser,
      id,
      createdAt: new Date(),
      lastReviewed: new Date()
    };
    
    this.advertisers.set(id, newAdvertiser);
    return id;
  }

  /**
   * Update advertiser status
   */
  async updateAdvertiserStatus(advertiserId: string, status: AdvertiserStatus): Promise<void> {
    const advertiser = this.advertisers.get(advertiserId);
    if (!advertiser) {
      throw new Error(`Advertiser ${advertiserId} not found`);
    }
    
    advertiser.status = status;
    advertiser.lastReviewed = new Date();
    this.advertisers.set(advertiserId, advertiser);
  }

  /**
   * Get advertiser by ID
   */
  getAdvertiser(advertiserId: string): Advertiser | undefined {
    return this.advertisers.get(advertiserId);
  }

  /**
   * Get all advertisers with optional status filter
   */
  getAdvertisers(status?: AdvertiserStatus): Advertiser[] {
    const advertisers = Array.from(this.advertisers.values());
    return status ? advertisers.filter(a => a.status === status) : advertisers;
  }

  // ===== WHITELIST/BLACKLIST MANAGEMENT =====

  /**
   * Add brand to whitelist
   */
  async addToWhitelist(brandName: string): Promise<void> {
    this.whitelist.add(brandName.toLowerCase());
  }

  /**
   * Remove brand from whitelist
   */
  async removeFromWhitelist(brandName: string): Promise<void> {
    this.whitelist.delete(brandName.toLowerCase());
  }

  /**
   * Add brand to blacklist
   */
  async addToBlacklist(brandName: string): Promise<void> {
    this.blacklist.add(brandName.toLowerCase());
  }

  /**
   * Remove brand from blacklist
   */
  async removeFromBlacklist(brandName: string): Promise<void> {
    this.blacklist.delete(brandName.toLowerCase());
  }

  /**
   * Add category to blacklist
   */
  async addCategoryToBlacklist(category: string): Promise<void> {
    this.categoryBlacklist.add(category.toLowerCase());
  }

  /**
   * Remove category from blacklist
   */
  async removeCategoryFromBlacklist(category: string): Promise<void> {
    this.categoryBlacklist.delete(category.toLowerCase());
  }

  /**
   * Get whitelist
   */
  getWhitelist(): string[] {
    return Array.from(this.whitelist);
  }

  /**
   * Get blacklist
   */
  getBlacklist(): string[] {
    return Array.from(this.blacklist);
  }

  /**
   * Get category blacklist
   */
  getCategoryBlacklist(): string[] {
    return Array.from(this.categoryBlacklist);
  }

  // ===== CONTENT MODERATION =====

  /**
   * Add moderation rule
   */
  async addModerationRule(rule: Omit<ContentModerationRule, 'id' | 'createdAt' | 'lastUpdated'>): Promise<string> {
    const id = `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newRule: ContentModerationRule = {
      ...rule,
      id,
      createdAt: new Date(),
      lastUpdated: new Date()
    };
    
    this.moderationRules.set(id, newRule);
    return id;
  }

  /**
   * Update moderation rule
   */
  async updateModerationRule(ruleId: string, updates: Partial<ContentModerationRule>): Promise<void> {
    const rule = this.moderationRules.get(ruleId);
    if (!rule) {
      throw new Error(`Moderation rule ${ruleId} not found`);
    }
    
    Object.assign(rule, updates, { lastUpdated: new Date() });
    this.moderationRules.set(ruleId, rule);
  }

  /**
   * Delete moderation rule
   */
  async deleteModerationRule(ruleId: string): Promise<void> {
    this.moderationRules.delete(ruleId);
  }

  /**
   * Get all moderation rules
   */
  getModerationRules(): ContentModerationRule[] {
    return Array.from(this.moderationRules.values());
  }

  /**
   * Comprehensive content moderation
   */
  async moderateContent(adId: string, moderatedBy: string = 'system'): Promise<ModerationResult> {
    const ad = this.adInventory.get(adId);
    if (!ad) {
      throw new Error(`Ad ${adId} not found`);
    }

    const flags: ModerationFlag[] = [];
    let approved = true;
    let score = 100; // Start with perfect score
    const blockedReasons: string[] = [];

    // Apply all active moderation rules
    for (const rule of this.moderationRules.values()) {
      if (!rule.enabled) continue;

      const flagResult = this.applyModerationRule(ad, rule);
      if (flagResult) {
        flags.push(flagResult);
        
        // Reduce score based on severity
        const scoreReduction = this.getSeverityScoreReduction(rule.severity);
        score = Math.max(0, score - scoreReduction);
        
        // Determine if ad should be blocked
        if (rule.action === ModerationAction.BLOCK) {
          approved = false;
          blockedReasons.push(flagResult.reason);
        }
      }
    }

    // Additional brand safety checks
    const brandSafetyResult = this.performBrandSafetyCheck(ad);
    if (!brandSafetyResult.passed) {
      approved = false;
      blockedReasons.push(...brandSafetyResult.reasons);
      score = Math.max(0, score - 30);
    }

    const result: ModerationResult = {
      adId,
      approved,
      score,
      flags,
      reviewRequired: flags.some(f => 
        f.severity === ModerationSeverity.HIGH || 
        f.severity === ModerationSeverity.CRITICAL ||
        this.moderationRules.get(f.ruleId)?.action === ModerationAction.REQUIRE_REVIEW
      ),
      blockedReasons,
      moderatedAt: new Date(),
      moderatedBy
    };

    this.moderationResults.set(adId, result);
    return result;
  }

  /**
   * Get moderation result for an ad
   */
  getModerationResult(adId: string): ModerationResult | undefined {
    return this.moderationResults.get(adId);
  }

  /**
   * Approve ad after manual review
   */
  async approveAd(adId: string, reviewedBy: string): Promise<void> {
    const result = this.moderationResults.get(adId);
    if (!result) {
      throw new Error(`No moderation result found for ad ${adId}`);
    }
    
    result.approved = true;
    result.reviewRequired = false;
    result.moderatedBy = reviewedBy;
    result.moderatedAt = new Date();
    
    this.moderationResults.set(adId, result);
  }

  /**
   * Reject ad after manual review
   */
  async rejectAd(adId: string, reason: string, reviewedBy: string): Promise<void> {
    const result = this.moderationResults.get(adId);
    if (!result) {
      throw new Error(`No moderation result found for ad ${adId}`);
    }
    
    result.approved = false;
    result.reviewRequired = false;
    result.blockedReasons.push(reason);
    result.moderatedBy = reviewedBy;
    result.moderatedAt = new Date();
    
    this.moderationResults.set(adId, result);
  }

  // ===== CAMPAIGN MANAGEMENT =====

  /**
   * Create ad campaign
   */
  async createCampaign(campaign: Omit<AdCampaign, 'id' | 'createdAt' | 'lastUpdated'>): Promise<string> {
    const id = `campaign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newCampaign: AdCampaign = {
      ...campaign,
      id,
      createdAt: new Date(),
      lastUpdated: new Date()
    };
    
    this.campaigns.set(id, newCampaign);
    return id;
  }

  /**
   * Update campaign
   */
  async updateCampaign(campaignId: string, updates: Partial<AdCampaign>): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }
    
    Object.assign(campaign, updates, { lastUpdated: new Date() });
    this.campaigns.set(campaignId, campaign);
  }

  /**
   * Get campaign by ID
   */
  getCampaign(campaignId: string): AdCampaign | undefined {
    return this.campaigns.get(campaignId);
  }

  /**
   * Get campaigns by advertiser
   */
  getCampaignsByAdvertiser(advertiserId: string): AdCampaign[] {
    return Array.from(this.campaigns.values()).filter(c => c.advertiserId === advertiserId);
  }

  /**
   * Get active campaigns
   */
  getActiveCampaigns(): AdCampaign[] {
    return Array.from(this.campaigns.values()).filter(c => c.status === CampaignStatus.ACTIVE);
  }

  /**
   * Add ad to inventory
   */
  addAd(ad: Ad): void {
    this.adInventory.set(ad.id, ad);
  }

  /**
   * Remove ad from inventory
   */
  removeAd(adId: string): void {
    this.adInventory.delete(adId);
  }

  /**
   * Get ad by ID
   */
  getAd(adId: string): Ad | undefined {
    return this.adInventory.get(adId);
  }

  /**
   * Get comprehensive inventory statistics
   */
  getInventoryStats(): InventoryStats {
    const allAds = Array.from(this.adInventory.values());
    const now = new Date();
    
    const activeAds = allAds.filter(ad => ad.expiresAt > now).length;
    const expiredAds = allAds.length - activeAds;
    
    const moderationResults = Array.from(this.moderationResults.values());
    const pendingReview = moderationResults.filter(r => r.reviewRequired).length;
    const blockedAds = moderationResults.filter(r => !r.approved).length;
    const moderationFlags = moderationResults.reduce((sum, r) => sum + r.flags.length, 0);
    
    const advertisers = Array.from(this.advertisers.values());
    const approvedAdvertisers = advertisers.filter(a => a.status === AdvertiserStatus.APPROVED).length;
    const pendingAdvertisers = advertisers.filter(a => a.status === AdvertiserStatus.PENDING).length;

    return {
      totalAds: allAds.length,
      activeAds,
      expiredAds,
      pendingReview,
      blockedAds,
      approvedAdvertisers,
      pendingAdvertisers,
      moderationFlags
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Check if ad passes brand safety checks
   */
  private passesBrandSafetyChecks(ad: Ad): boolean {
    const brandName = ad.content.brandName.toLowerCase();
    
    // Check blacklist
    if (this.blacklist.has(brandName)) {
      return false;
    }
    
    // Check whitelist (if not empty, only allow whitelisted brands)
    if (this.whitelist.size > 0 && !this.whitelist.has(brandName)) {
      return false;
    }
    
    return true;
  }

  /**
   * Check if ad passes privacy compliance
   */
  private passesPrivacyCompliance(ad: Ad, privacySettings: PrivacySettings): boolean {
    // If user has opted out of advertising, don't show ads
    if (!privacySettings.consentStatus.advertising) {
      return false;
    }
    
    // Additional privacy checks can be added here
    return true;
  }

  /**
   * Check if ad passes context relevance
   */
  private passesContextRelevance(ad: Ad, context: AIContext): boolean {
    // Basic relevance check - can be enhanced with ML models
    if (context.topics && context.topics.length > 0) {
      const adText = `${ad.content.title} ${ad.content.description}`.toLowerCase();
      const hasMatchingTopic = context.topics.some(topic => 
        topic.keywords.some(keyword => adText.includes(keyword.toLowerCase()))
      );
      
      // For now, allow ads even without perfect topic match to ensure availability
      return true;
    }
    
    return true;
  }

  /**
   * Calculate comprehensive score including safety and relevance
   */
  private calculateComprehensiveScore(ad: Ad, criteria: InventoryCriteria): number {
    let score = 0.5; // Base score

    // Relevance score
    const relevanceScore = this.calculateBasicRelevanceScore(ad, criteria.context);
    score += relevanceScore * 0.4;

    // Safety score from moderation
    const moderationResult = this.moderationResults.get(ad.id);
    if (moderationResult) {
      score += (moderationResult.score / 100) * 0.3;
    }

    // Advertiser trust score
    const advertiser = Array.from(this.advertisers.values())
      .find(a => a.name.toLowerCase() === ad.content.brandName.toLowerCase());
    if (advertiser) {
      score += (advertiser.trustScore / 100) * 0.2;
    }

    // Engagement boost
    if (criteria.context.userEngagement) {
      score += criteria.context.userEngagement.score * 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate basic relevance score for ad matching
   */
  private calculateBasicRelevanceScore(ad: Ad, context: AIContext): number {
    let score = 0.5; // Base score

    if (context.topics && context.topics.length > 0) {
      const adText = `${ad.content.title} ${ad.content.description}`.toLowerCase();
      const matchingTopics = context.topics.filter(topic =>
        topic.keywords.some(keyword => adText.includes(keyword.toLowerCase()))
      );
      
      score += (matchingTopics.length / context.topics.length) * 0.3;
    }

    // Boost score for higher engagement contexts
    if (context.userEngagement) {
      score += context.userEngagement.score * 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Apply a moderation rule to an ad
   */
  private applyModerationRule(ad: Ad, rule: ContentModerationRule): ModerationFlag | null {
    const content = `${ad.content.title} ${ad.content.description}`.toLowerCase();
    let matches = false;
    let confidence = 0;

    switch (rule.type) {
      case ModerationRuleType.KEYWORD_BLACKLIST:
        if (typeof rule.pattern === 'string') {
          matches = content.includes(rule.pattern.toLowerCase());
          confidence = matches ? 0.9 : 0;
        } else {
          matches = rule.pattern.test(content);
          confidence = matches ? 0.8 : 0;
        }
        break;
        
      case ModerationRuleType.CONTENT_CATEGORY:
        // Category matching with regex support
        if (typeof rule.pattern === 'string') {
          matches = content.includes(rule.pattern.toLowerCase());
          confidence = matches ? 0.7 : 0;
        } else {
          matches = rule.pattern.test(content);
          confidence = matches ? 0.8 : 0;
        }
        break;
        
      case ModerationRuleType.BRAND_SAFETY:
        matches = this.checkBrandSafetyViolation(ad, rule.pattern.toString());
        confidence = matches ? 0.85 : 0;
        break;
        
      default:
        // Custom filter or other types
        if (typeof rule.pattern === 'string') {
          matches = content.includes(rule.pattern.toLowerCase());
        } else {
          matches = rule.pattern.test(content);
        }
        confidence = matches ? 0.6 : 0;
    }

    if (matches) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        reason: `Content violates ${rule.name} rule`,
        confidence
      };
    }

    return null;
  }

  /**
   * Check for brand safety violations
   */
  private checkBrandSafetyViolation(ad: Ad, pattern: string): boolean {
    const content = `${ad.content.title} ${ad.content.description}`.toLowerCase();
    const brandSafetyKeywords = [
      'violence', 'hate', 'discrimination', 'illegal', 'drugs', 'gambling',
      'adult', 'explicit', 'controversial', 'misleading', 'scam', 'fraud'
    ];
    
    return brandSafetyKeywords.some(keyword => content.includes(keyword)) ||
           content.includes(pattern.toLowerCase());
  }

  /**
   * Perform comprehensive brand safety check
   */
  private performBrandSafetyCheck(ad: Ad): { passed: boolean; reasons: string[] } {
    const reasons: string[] = [];
    
    // Check brand blacklist
    if (this.blacklist.has(ad.content.brandName.toLowerCase())) {
      reasons.push('Brand is blacklisted');
    }
    
    // Check category blacklist
    const advertiser = Array.from(this.advertisers.values())
      .find(a => a.name.toLowerCase() === ad.content.brandName.toLowerCase());
    if (advertiser && this.categoryBlacklist.has(advertiser.category.toLowerCase())) {
      reasons.push('Advertiser category is blacklisted');
    }
    
    // Check content for unsafe keywords
    const content = `${ad.content.title} ${ad.content.description}`.toLowerCase();
    const unsafeKeywords = ['scam', 'fraud', 'illegal', 'hate', 'violence'];
    const foundUnsafeKeywords = unsafeKeywords.filter(keyword => content.includes(keyword));
    if (foundUnsafeKeywords.length > 0) {
      reasons.push(`Contains unsafe keywords: ${foundUnsafeKeywords.join(', ')}`);
    }
    
    return {
      passed: reasons.length === 0,
      reasons
    };
  }

  /**
   * Get score reduction based on severity
   */
  private getSeverityScoreReduction(severity: ModerationSeverity): number {
    switch (severity) {
      case ModerationSeverity.LOW: return 10;
      case ModerationSeverity.MEDIUM: return 25;
      case ModerationSeverity.HIGH: return 50;
      case ModerationSeverity.CRITICAL: return 80;
      default: return 10;
    }
  }

  /**
   * Initialize default moderation rules
   */
  private initializeModerationRules(): void {
    const defaultRules: Omit<ContentModerationRule, 'id' | 'createdAt' | 'lastUpdated'>[] = [
      {
        name: 'Prohibited Keywords',
        type: ModerationRuleType.KEYWORD_BLACKLIST,
        pattern: /\b(scam|fraud|illegal|hate|violence|explicit)\b/i,
        severity: ModerationSeverity.HIGH,
        action: ModerationAction.BLOCK,
        enabled: true
      },
      {
        name: 'Adult Content',
        type: ModerationRuleType.CONTENT_CATEGORY,
        pattern: /\b(adult|explicit|sexual|porn)\b/i,
        severity: ModerationSeverity.CRITICAL,
        action: ModerationAction.BLOCK,
        enabled: true
      },
      {
        name: 'Gambling Content',
        type: ModerationRuleType.CONTENT_CATEGORY,
        pattern: /\b(casino|gambling|bet|poker|lottery)\b/i,
        severity: ModerationSeverity.MEDIUM,
        action: ModerationAction.REQUIRE_REVIEW,
        enabled: true
      },
      {
        name: 'Brand Safety Check',
        type: ModerationRuleType.BRAND_SAFETY,
        pattern: 'controversial',
        severity: ModerationSeverity.MEDIUM,
        action: ModerationAction.FLAG,
        enabled: true
      }
    ];

    defaultRules.forEach(rule => {
      const id = `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newRule: ContentModerationRule = {
        ...rule,
        id,
        createdAt: new Date(),
        lastUpdated: new Date()
      };
      this.moderationRules.set(id, newRule);
    });
  }

  /**
   * Initialize sample advertisers for testing
   */
  private initializeSampleAdvertisers(): void {
    const sampleAdvertisers: Omit<Advertiser, 'id' | 'createdAt' | 'lastReviewed'>[] = [
      {
        name: 'TechCorp',
        domain: 'techcorp.com',
        category: 'Technology',
        trustScore: 85,
        status: AdvertiserStatus.APPROVED
      },
      {
        name: 'EduPlatform',
        domain: 'eduplatform.com',
        category: 'Education',
        trustScore: 92,
        status: AdvertiserStatus.APPROVED
      },
      {
        name: 'CloudProvider',
        domain: 'cloudprovider.com',
        category: 'Technology',
        trustScore: 88,
        status: AdvertiserStatus.APPROVED
      },
      {
        name: 'DevTools',
        domain: 'devtools.com',
        category: 'Software',
        trustScore: 90,
        status: AdvertiserStatus.APPROVED
      },
      {
        name: 'DataCorp',
        domain: 'datacorp.com',
        category: 'Analytics',
        trustScore: 87,
        status: AdvertiserStatus.APPROVED
      }
    ];

    sampleAdvertisers.forEach(advertiser => {
      const id = `advertiser-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newAdvertiser: Advertiser = {
        ...advertiser,
        id,
        createdAt: new Date(),
        lastReviewed: new Date()
      };
      this.advertisers.set(id, newAdvertiser);
    });
  }

  /**
   * Initialize sample ad inventory for testing
   */
  private initializeSampleInventory(): void {
    const sampleAds: Ad[] = [
      {
        id: 'ad-tech-1',
        type: AdType.BANNER,
        format: AdFormat.DISPLAY,
        content: {
          title: 'Advanced AI Development Tools',
          description: 'Boost your AI development with cutting-edge tools and frameworks',
          imageUrl: 'https://example.com/ai-tools.jpg',
          ctaText: 'Try Free',
          landingUrl: 'https://example.com/ai-tools',
          brandName: 'TechCorp'
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      },
      {
        id: 'ad-edu-1',
        type: AdType.NATIVE,
        format: AdFormat.TEXT,
        content: {
          title: 'Learn Machine Learning Online',
          description: 'Master ML concepts with interactive courses and real-world projects',
          ctaText: 'Start Learning',
          landingUrl: 'https://example.com/ml-course',
          brandName: 'EduPlatform'
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'ad-cloud-1',
        type: AdType.INTERSTITIAL,
        format: AdFormat.RICH_MEDIA,
        content: {
          title: 'Cloud Computing Solutions',
          description: 'Scale your applications with reliable cloud infrastructure',
          imageUrl: 'https://example.com/cloud.jpg',
          ctaText: 'Get Started',
          landingUrl: 'https://example.com/cloud',
          brandName: 'CloudProvider'
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'ad-software-1',
        type: AdType.BANNER,
        format: AdFormat.DISPLAY,
        content: {
          title: 'Professional Software Development',
          description: 'Build better software faster with our development platform',
          imageUrl: 'https://example.com/software.jpg',
          ctaText: 'Learn More',
          landingUrl: 'https://example.com/software',
          brandName: 'DevTools'
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'ad-data-1',
        type: AdType.NATIVE,
        format: AdFormat.TEXT,
        content: {
          title: 'Data Analytics Platform',
          description: 'Transform your data into actionable insights with advanced analytics',
          ctaText: 'Try Demo',
          landingUrl: 'https://example.com/analytics',
          brandName: 'DataCorp'
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    ];

    sampleAds.forEach(ad => {
      this.addAd(ad);
      // Auto-moderate sample ads
      this.moderateContent(ad.id, 'system').catch(console.error);
    });
  }
}