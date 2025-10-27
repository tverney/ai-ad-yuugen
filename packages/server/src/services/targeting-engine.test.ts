import { describe, it, expect, beforeEach } from 'vitest';
import { TargetingEngine, TargetingCriteria } from './targeting-engine';
import {
  Ad,
  AdType,
  AdFormat,
  AIContext,
  UserProfile,
  Topic,
  UserIntent,
  IntentCategory,
  SentimentScore,
  SentimentLabel,
  EngagementLevel,
  EngagementTier,
  Interest,
  InterestSource,
  ConversationStage,
  ConversationPhase,
  PerformanceMetrics
} from '@ai-yuugen/types';

describe('TargetingEngine', () => {
  let targetingEngine: TargetingEngine;
  let mockAd: Ad;
  let mockContext: AIContext;
  let mockUserProfile: UserProfile;

  beforeEach(() => {
    targetingEngine = new TargetingEngine();

    mockAd = {
      id: 'ad-123',
      type: AdType.BANNER,
      format: AdFormat.DISPLAY,
      content: {
        title: 'Best Tech Gadgets 2024',
        description: 'Discover the latest technology gadgets and smart devices for your home',
        ctaText: 'Shop Now',
        landingUrl: 'https://example.com/tech',
        brandName: 'TechStore'
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000) // 24 hours from now
    };

    mockContext = {
      topics: [
        {
          name: 'technology',
          category: 'tech',
          confidence: 0.9,
          keywords: ['gadgets', 'devices', 'smart', 'tech'],
          relevanceScore: 0.8
        },
        {
          name: 'shopping',
          category: 'commerce',
          confidence: 0.7,
          keywords: ['buy', 'purchase', 'shop', 'store'],
          relevanceScore: 0.6
        }
      ],
      intent: {
        primary: 'product_research',
        secondary: ['comparison', 'purchase'],
        confidence: 0.8,
        category: IntentCategory.COMMERCIAL,
        actionable: true
      },
      sentiment: {
        polarity: 0.6,
        magnitude: 0.7,
        label: SentimentLabel.POSITIVE,
        confidence: 0.8
      },
      conversationStage: {
        stage: ConversationPhase.DECISION_MAKING,
        progress: 0.7,
        duration: 300000,
        messageCount: 15
      },
      userEngagement: {
        score: 0.8,
        level: EngagementTier.HIGH,
        indicators: [],
        trend: 'increasing'
      },
      confidence: 0.85,
      extractedAt: new Date()
    };

    mockUserProfile = {
      id: 'user-456',
      interests: [
        {
          category: 'technology',
          subcategory: 'gadgets',
          score: 0.9,
          source: InterestSource.BEHAVIORAL,
          lastUpdated: new Date()
        },
        {
          category: 'shopping',
          score: 0.7,
          source: InterestSource.EXPLICIT,
          lastUpdated: new Date(Date.now() - 86400000) // 1 day ago
        }
      ],
      behaviorHistory: [],
      aiInteractionHistory: [],
      createdAt: new Date(),
      lastUpdated: new Date()
    };
  });

  describe('calculateRelevanceScore', () => {
    it('should calculate high relevance score for matching ad and context', async () => {
      const score = await targetingEngine.calculateRelevanceScore(mockAd, mockContext, mockUserProfile);
      
      expect(score).toBeGreaterThan(0.5);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('should return lower score for mismatched content', async () => {
      const mismatchedAd = {
        ...mockAd,
        content: {
          ...mockAd.content,
          title: 'Cooking Recipes',
          description: 'Delicious recipes for home cooking'
        }
      };

      const score = await targetingEngine.calculateRelevanceScore(mismatchedAd, mockContext, mockUserProfile);
      
      expect(score).toBeLessThan(0.5);
    });

    it('should apply confidence penalty to final score', async () => {
      const lowConfidenceContext = {
        ...mockContext,
        confidence: 0.3
      };

      const score = await targetingEngine.calculateRelevanceScore(mockAd, lowConfidenceContext, mockUserProfile);
      
      expect(score).toBeLessThan(0.4);
    });

    it('should handle missing user profile gracefully', async () => {
      const score = await targetingEngine.calculateRelevanceScore(mockAd, mockContext);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('should respect targeting criteria filters', async () => {
      const restrictiveCriteria: TargetingCriteria = {
        topics: ['cooking'], // Different from ad topics
        intents: [IntentCategory.INFORMATIONAL],
        sentimentRange: { min: -1, max: 0 },
        engagementLevels: [EngagementTier.LOW]
      };

      const score = await targetingEngine.calculateRelevanceScore(
        mockAd, 
        mockContext, 
        mockUserProfile, 
        restrictiveCriteria
      );
      
      expect(score).toBeLessThan(0.3);
    });
  });

  describe('getTargetingSegments', () => {
    it('should generate interest-based segments', async () => {
      const segments = await targetingEngine.getTargetingSegments(mockUserProfile);
      
      expect(segments).toHaveLength(3); // Interest + behavior + AI segments
      expect(segments[0].name).toContain('Interest');
      expect(segments[0].criteria.interests).toBeDefined();
    });

    it('should sort segments by score in descending order', async () => {
      const segments = await targetingEngine.getTargetingSegments(mockUserProfile);
      
      for (let i = 1; i < segments.length; i++) {
        expect(segments[i-1].score).toBeGreaterThanOrEqual(segments[i].score);
      }
    });

    it('should handle empty user profile', async () => {
      const emptyProfile: UserProfile = {
        id: 'empty-user',
        interests: [],
        behaviorHistory: [],
        aiInteractionHistory: [],
        createdAt: new Date(),
        lastUpdated: new Date()
      };

      const segments = await targetingEngine.getTargetingSegments(emptyProfile);
      
      expect(segments).toHaveLength(1); // Only behavior segment
    });

    it('should filter out low-scoring interest segments', async () => {
      const lowInterestProfile: UserProfile = {
        ...mockUserProfile,
        interests: [
          {
            category: 'low-interest',
            score: 0.1, // Below threshold
            source: InterestSource.INFERRED,
            lastUpdated: new Date()
          }
        ]
      };

      const segments = await targetingEngine.getTargetingSegments(lowInterestProfile);
      
      // Should not include the low-scoring interest segment
      const interestSegments = segments.filter(s => s.name.includes('Interest'));
      expect(interestSegments).toHaveLength(0);
    });
  });

  describe('optimizeTargeting', () => {
    it('should adjust weights based on low CTR performance', async () => {
      const lowCTRPerformance: PerformanceMetrics = {
        impressions: 1000,
        clicks: 10,
        conversions: 1,
        ctr: 0.01, // Low CTR
        cpm: 2.5,
        revenue: 5.0,
        engagementScore: 0.6
      };

      const strategy = await targetingEngine.optimizeTargeting(lowCTRPerformance);
      
      expect(strategy.weights.intent).toBeGreaterThan(0.20); // Increased from default
      expect(strategy.weights.engagement).toBeGreaterThan(0.15); // Increased from default
      expect(strategy.optimizationGoal).toBe('ctr');
    });

    it('should adjust weights based on low engagement', async () => {
      const lowEngagementPerformance: PerformanceMetrics = {
        impressions: 1000,
        clicks: 30,
        conversions: 5,
        ctr: 0.03,
        cpm: 2.5,
        revenue: 15.0,
        engagementScore: 0.3 // Low engagement
      };

      const strategy = await targetingEngine.optimizeTargeting(lowEngagementPerformance);
      
      expect(strategy.weights.interest).toBeGreaterThan(0.15); // Increased from default
      expect(strategy.weights.sentiment).toBeGreaterThan(0.15); // Increased from default
    });

    it('should set conversion goal for high-performing campaigns', async () => {
      const highPerformanceMetrics: PerformanceMetrics = {
        impressions: 1000,
        clicks: 40,
        conversions: 8,
        ctr: 0.04, // High CTR
        cpm: 3.0,
        revenue: 25.0,
        engagementScore: 0.8
      };

      const strategy = await targetingEngine.optimizeTargeting(highPerformanceMetrics);
      
      expect(strategy.optimizationGoal).toBe('conversion');
    });

    it('should normalize weights to sum to 1', async () => {
      const performance: PerformanceMetrics = {
        impressions: 1000,
        clicks: 20,
        conversions: 2,
        ctr: 0.02,
        cpm: 2.5,
        revenue: 10.0,
        engagementScore: 0.5
      };

      const strategy = await targetingEngine.optimizeTargeting(performance);
      
      const weightSum = Object.values(strategy.weights).reduce((sum, weight) => sum + weight, 0);
      expect(weightSum).toBeCloseTo(1.0, 5);
    });
  });

  describe('validateTargeting', () => {
    it('should validate correct targeting criteria', async () => {
      const validCriteria: TargetingCriteria = {
        topics: ['technology', 'gadgets'],
        intents: [IntentCategory.COMMERCIAL],
        sentimentRange: { min: 0, max: 1 },
        engagementLevels: [EngagementTier.HIGH]
      };

      const result = await targetingEngine.validateTargeting(validCriteria);
      
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should identify missing targeting criteria', async () => {
      const emptyCriteria: TargetingCriteria = {
        topics: [],
        intents: [],
        sentimentRange: { min: -1, max: 1 },
        engagementLevels: []
      };

      const result = await targetingEngine.validateTargeting(emptyCriteria);
      
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('No targeting criteria specified');
      expect(result.suggestions).toHaveLength(1);
    });

    it('should identify invalid sentiment range', async () => {
      const invalidCriteria: TargetingCriteria = {
        topics: ['technology'],
        intents: [IntentCategory.COMMERCIAL],
        sentimentRange: { min: 0.5, max: 0.2 }, // Invalid range
        engagementLevels: [EngagementTier.HIGH]
      };

      const result = await targetingEngine.validateTargeting(invalidCriteria);
      
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Invalid sentiment range');
    });

    it('should identify conflicting criteria', async () => {
      const conflictingCriteria: TargetingCriteria = {
        topics: ['technology'],
        intents: [IntentCategory.COMMERCIAL],
        sentimentRange: { min: -1, max: -0.5 }, // Negative sentiment for commercial
        engagementLevels: [EngagementTier.HIGH]
      };

      const result = await targetingEngine.validateTargeting(conflictingCriteria);
      
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Commercial intent with negative sentiment may perform poorly');
      expect(result.suggestions).toHaveLength(1);
    });
  });

  describe('Topic Matching', () => {
    it('should calculate high topic match for relevant keywords', async () => {
      const techContext = {
        ...mockContext,
        topics: [
          {
            name: 'technology',
            category: 'tech',
            confidence: 0.9,
            keywords: ['tech', 'gadgets', 'devices', 'smart'],
            relevanceScore: 0.9
          }
        ]
      };

      const score = await targetingEngine.calculateRelevanceScore(mockAd, techContext, mockUserProfile);
      
      expect(score).toBeGreaterThan(0.5);
    });

    it('should calculate low topic match for irrelevant keywords', async () => {
      const cookingContext = {
        ...mockContext,
        topics: [
          {
            name: 'cooking',
            category: 'food',
            confidence: 0.8,
            keywords: ['recipe', 'food', 'cooking', 'kitchen'],
            relevanceScore: 0.8
          }
        ]
      };

      const score = await targetingEngine.calculateRelevanceScore(mockAd, cookingContext, mockUserProfile);
      
      expect(score).toBeLessThan(0.5);
    });
  });

  describe('Intent Alignment', () => {
    it('should score commercial intent highly for product ads', async () => {
      const commercialContext = {
        ...mockContext,
        intent: {
          primary: 'purchase',
          confidence: 0.9,
          category: IntentCategory.COMMERCIAL,
          actionable: true
        }
      };

      const score = await targetingEngine.calculateRelevanceScore(mockAd, commercialContext, mockUserProfile);
      
      expect(score).toBeGreaterThan(0.5);
    });

    it('should score support intent lower for product ads', async () => {
      const supportContext = {
        ...mockContext,
        intent: {
          primary: 'help',
          confidence: 0.8,
          category: IntentCategory.SUPPORT,
          actionable: false
        }
      };

      const score = await targetingEngine.calculateRelevanceScore(mockAd, supportContext, mockUserProfile);
      
      expect(score).toBeLessThan(0.5);
    });
  });

  describe('Sentiment Compatibility', () => {
    it('should score positive sentiment higher', async () => {
      const positiveContext = {
        ...mockContext,
        sentiment: {
          polarity: 0.8,
          magnitude: 0.7,
          label: SentimentLabel.POSITIVE,
          confidence: 0.9
        }
      };

      const score = await targetingEngine.calculateRelevanceScore(mockAd, positiveContext, mockUserProfile);
      
      expect(score).toBeGreaterThan(0.5);
    });

    it('should score negative sentiment lower', async () => {
      const negativeContext = {
        ...mockContext,
        sentiment: {
          polarity: -0.7,
          magnitude: 0.8,
          label: SentimentLabel.NEGATIVE,
          confidence: 0.8
        }
      };

      const score = await targetingEngine.calculateRelevanceScore(mockAd, negativeContext, mockUserProfile);
      
      expect(score).toBeLessThan(0.5);
    });
  });

  describe('Engagement Fit', () => {
    it('should score high engagement users higher', async () => {
      const highEngagementContext = {
        ...mockContext,
        userEngagement: {
          score: 0.9,
          level: EngagementTier.VERY_HIGH,
          indicators: [],
          trend: 'increasing'
        }
      };

      const score = await targetingEngine.calculateRelevanceScore(mockAd, highEngagementContext, mockUserProfile);
      
      expect(score).toBeGreaterThan(0.5);
    });

    it('should score low engagement users lower', async () => {
      const lowEngagementContext = {
        ...mockContext,
        userEngagement: {
          score: 0.2,
          level: EngagementTier.LOW,
          indicators: [],
          trend: 'decreasing'
        }
      };

      const score = await targetingEngine.calculateRelevanceScore(mockAd, lowEngagementContext, mockUserProfile);
      
      expect(score).toBeLessThan(0.5);
    });
  });

  describe('Interest Relevance', () => {
    it('should score matching interests higher', async () => {
      const techProfile = {
        ...mockUserProfile,
        interests: [
          {
            category: 'technology',
            score: 0.9,
            source: InterestSource.EXPLICIT,
            lastUpdated: new Date()
          }
        ]
      };

      const score = await targetingEngine.calculateRelevanceScore(mockAd, mockContext, techProfile);
      
      expect(score).toBeGreaterThan(0.5);
    });

    it('should apply recency factor to interests', async () => {
      const oldInterestProfile = {
        ...mockUserProfile,
        interests: [
          {
            category: 'technology',
            score: 0.9,
            source: InterestSource.EXPLICIT,
            lastUpdated: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) // 100 days ago
          }
        ]
      };

      const recentScore = await targetingEngine.calculateRelevanceScore(mockAd, mockContext, mockUserProfile);
      const oldScore = await targetingEngine.calculateRelevanceScore(mockAd, mockContext, oldInterestProfile);
      
      expect(recentScore).toBeGreaterThan(oldScore);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty topics gracefully', async () => {
      const emptyTopicsContext = {
        ...mockContext,
        topics: []
      };

      const score = await targetingEngine.calculateRelevanceScore(mockAd, emptyTopicsContext, mockUserProfile);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should handle missing ad content fields', async () => {
      const incompleteAd = {
        ...mockAd,
        content: {
          ...mockAd.content,
          title: '',
          description: ''
        }
      };

      const score = await targetingEngine.calculateRelevanceScore(incompleteAd, mockContext, mockUserProfile);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should handle zero confidence context', async () => {
      const zeroConfidenceContext = {
        ...mockContext,
        confidence: 0
      };

      const score = await targetingEngine.calculateRelevanceScore(mockAd, zeroConfidenceContext, mockUserProfile);
      
      expect(score).toBe(0);
    });
  });
});