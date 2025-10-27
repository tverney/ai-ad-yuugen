import {
	Ad,
	AIContext,
	UserProfile,
	Topic,
	UserIntent,
	IntentCategory,
	SentimentScore,
	EngagementLevel,
	EngagementTier,
	Interest,
	InterestSource,
	PerformanceMetrics,
} from '@ai-yuugen/types';

export interface TargetingCriteria {
	topics: string[];
	intents: IntentCategory[];
	sentimentRange: { min: number; max: number };
	engagementLevels: EngagementTier[];
	demographics?: {
		ageRanges?: string[];
		genders?: string[];
		locations?: string[];
	};
	interests?: string[];
	excludedCategories?: string[];
}

export interface TargetingSegment {
	id: string;
	name: string;
	criteria: TargetingCriteria;
	score: number;
	size: number;
	performance?: PerformanceMetrics;
}

export interface RelevanceFactors {
	topicMatch: number;
	intentAlignment: number;
	sentimentCompatibility: number;
	engagementFit: number;
	interestRelevance: number;
	contextualFit: number;
	semanticSimilarity: number;
}

export interface TargetingStrategy {
	segments: TargetingSegment[];
	weights: {
		topic: number;
		intent: number;
		sentiment: number;
		engagement: number;
		interest: number;
		contextual: number;
		semantic: number;
	};
	optimizationGoal: 'ctr' | 'conversion' | 'engagement' | 'revenue';
}

/**
 * AI-specific targeting engine that provides intelligent ad targeting
 * based on conversation context, user behavior, and semantic analysis
 */
export class TargetingEngine {
	private readonly defaultWeights = {
		topic: 0.25,
		intent: 0.2,
		sentiment: 0.15,
		engagement: 0.15,
		interest: 0.15,
		contextual: 0.05,
		semantic: 0.05,
	};

	/**
	 * Calculate relevance score for an ad based on AI context and user profile
	 */
	async calculateRelevanceScore(
		ad: Ad,
		context: AIContext,
		userProfile?: UserProfile,
		targetingCriteria?: TargetingCriteria,
	): Promise<number> {
		const factors = await this.calculateRelevanceFactors(
			ad,
			context,
			userProfile,
			targetingCriteria,
		);

		// Apply weighted scoring
		const score =
			factors.topicMatch * this.defaultWeights.topic +
			factors.intentAlignment * this.defaultWeights.intent +
			factors.sentimentCompatibility * this.defaultWeights.sentiment +
			factors.engagementFit * this.defaultWeights.engagement +
			factors.interestRelevance * this.defaultWeights.interest +
			factors.contextualFit * this.defaultWeights.contextual +
			factors.semanticSimilarity * this.defaultWeights.semantic;

		// Normalize to 0-1 range and apply confidence penalty
		return Math.min(1, Math.max(0, score * context.confidence));
	}

	/**
	 * Calculate individual relevance factors for detailed analysis
	 */
	private async calculateRelevanceFactors(
		ad: Ad,
		context: AIContext,
		userProfile?: UserProfile,
		targetingCriteria?: TargetingCriteria,
	): Promise<RelevanceFactors> {
		return {
			topicMatch: this.calculateTopicMatch(
				ad,
				context.topics,
				targetingCriteria,
			),
			intentAlignment: this.calculateIntentAlignment(
				ad,
				context.intent,
				targetingCriteria,
			),
			sentimentCompatibility: this.calculateSentimentCompatibility(
				ad,
				context.sentiment,
				targetingCriteria,
			),
			engagementFit: this.calculateEngagementFit(
				ad,
				context.userEngagement,
				targetingCriteria,
			),
			interestRelevance: this.calculateInterestRelevance(
				ad,
				userProfile?.interests || [],
			),
			contextualFit: this.calculateContextualFit(ad, context),
			semanticSimilarity: await this.calculateSemanticSimilarity(ad, context),
		};
	}

	/**
	 * Calculate topic matching score between ad and conversation topics
	 */
	private calculateTopicMatch(
		ad: Ad,
		topics: Topic[],
		criteria?: TargetingCriteria,
	): number {
		if (!topics.length) return 0;

		// Extract keywords from ad content for topic matching
		const adKeywords = this.extractAdKeywords(ad);
		let totalScore = 0;
		let weightSum = 0;

		for (const topic of topics) {
			// Check if topic is in targeting criteria
			if (criteria?.topics && !criteria.topics.includes(topic.name)) {
				continue;
			}

			// Calculate keyword overlap
			const keywordOverlap = this.calculateKeywordOverlap(
				adKeywords,
				topic.keywords,
			);
			const topicScore =
				keywordOverlap * topic.confidence * topic.relevanceScore;

			totalScore += topicScore;
			weightSum += topic.confidence;
		}

		return weightSum > 0 ? totalScore / weightSum : 0;
	}

	/**
	 * Calculate intent alignment between ad and user intent
	 */
	private calculateIntentAlignment(
		ad: Ad,
		intent: UserIntent,
		criteria?: TargetingCriteria,
	): number {
		if (criteria?.intents && !criteria.intents.includes(intent.category)) {
			return 0;
		}

		// Map intent categories to ad compatibility scores
		const intentCompatibility: Record<IntentCategory, number> = {
			[IntentCategory.COMMERCIAL]: 0.9,
			[IntentCategory.TRANSACTIONAL]: 0.8,
			[IntentCategory.INFORMATIONAL]: 0.6,
			[IntentCategory.NAVIGATIONAL]: 0.4,
			[IntentCategory.ENTERTAINMENT]: 0.5,
			[IntentCategory.SUPPORT]: 0.3,
		};

		const baseScore = intentCompatibility[intent.category] || 0.5;

		// Boost score for actionable intents
		const actionableBoost = intent.actionable ? 1.2 : 1.0;

		return Math.min(1, baseScore * intent.confidence * actionableBoost);
	}

	/**
	 * Calculate sentiment compatibility between ad and conversation sentiment
	 */
	private calculateSentimentCompatibility(
		ad: Ad,
		sentiment: SentimentScore,
		criteria?: TargetingCriteria,
	): number {
		if (criteria?.sentimentRange) {
			const { min, max } = criteria.sentimentRange;
			if (sentiment.polarity < min || sentiment.polarity > max) {
				return 0;
			}
		}

		// Positive sentiment generally better for ads
		const polarityScore = Math.max(0, (sentiment.polarity + 1) / 2);

		// Higher magnitude indicates stronger sentiment (good or bad)
		const magnitudeScore = sentiment.magnitude;

		// Combine polarity and magnitude with confidence
		return (polarityScore * 0.7 + magnitudeScore * 0.3) * sentiment.confidence;
	}

	/**
	 * Calculate engagement fit between ad and user engagement level
	 */
	private calculateEngagementFit(
		ad: Ad,
		engagement: EngagementLevel,
		criteria?: TargetingCriteria,
	): number {
		if (
			criteria?.engagementLevels &&
			!criteria.engagementLevels.includes(engagement.level)
		) {
			return 0;
		}

		// Higher engagement users are more valuable for ads
		const engagementScores: Record<EngagementTier, number> = {
			[EngagementTier.VERY_HIGH]: 1.0,
			[EngagementTier.HIGH]: 0.8,
			[EngagementTier.MEDIUM]: 0.6,
			[EngagementTier.LOW]: 0.3,
		};

		const baseScore = engagementScores[engagement.level];

		// Apply trend modifier
		const trendModifier =
			engagement.trend === 'increasing'
				? 1.1
				: engagement.trend === 'decreasing'
				? 0.9
				: 1.0;

		return Math.min(1, baseScore * engagement.score * trendModifier);
	}

	/**
	 * Calculate interest relevance between ad and user interests
	 */
	private calculateInterestRelevance(ad: Ad, interests: Interest[]): number {
		if (!interests.length) return 0.5; // Neutral score for no interest data

		const adKeywords = this.extractAdKeywords(ad);
		let totalScore = 0;
		let weightSum = 0;

		for (const interest of interests) {
			// Check if ad keywords match interest category
			const categoryMatch = adKeywords.some(
				(keyword) =>
					keyword.toLowerCase().includes(interest.category.toLowerCase()) ||
					interest.category.toLowerCase().includes(keyword.toLowerCase()),
			);

			if (categoryMatch) {
				// Weight by interest score and recency
				const recencyFactor = this.calculateRecencyFactor(interest.lastUpdated);
				const interestScore = interest.score * recencyFactor;

				totalScore += interestScore;
				weightSum += 1;
			}
		}

		return weightSum > 0 ? totalScore / weightSum : 0.3;
	}

	/**
	 * Calculate contextual fit based on conversation context
	 */
	private calculateContextualFit(ad: Ad, context: AIContext): number {
		let score = 0.5; // Base score

		// Boost score for high-confidence contexts
		score *= context.confidence;

		// Consider conversation stage
		if (context.conversationStage) {
			const stageScores = {
				greeting: 0.3,
				exploration: 0.7,
				problem_solving: 0.8,
				decision_making: 0.9,
				conclusion: 0.6,
				follow_up: 0.4,
			};

			const stageScore =
				stageScores[
					context.conversationStage.stage as keyof typeof stageScores
				] || 0.5;
			score = (score + stageScore) / 2;
		}

		return Math.min(1, score);
	}

	/**
	 * Calculate semantic similarity using simple keyword-based approach
	 * In production, this would use more sophisticated NLP models
	 */
	private async calculateSemanticSimilarity(
		ad: Ad,
		context: AIContext,
	): Promise<number> {
		const adText =
			`${ad.content.title} ${ad.content.description}`.toLowerCase();
		const contextKeywords = context.topics.flatMap((topic) => topic.keywords);

		if (!contextKeywords.length) return 0;

		let matches = 0;
		for (const keyword of contextKeywords) {
			if (adText.includes(keyword.toLowerCase())) {
				matches++;
			}
		}

		return Math.min(1, matches / contextKeywords.length);
	}

	/**
	 * Generate targeting segments based on user profile
	 */
	async getTargetingSegments(
		userProfile: UserProfile,
	): Promise<TargetingSegment[]> {
		const segments: TargetingSegment[] = [];

		// Interest-based segments
		const interestSegments = this.generateInterestSegments(
			userProfile.interests,
		);
		segments.push(...interestSegments);

		// Behavior-based segments
		const behaviorSegments = this.generateBehaviorSegments(
			userProfile.behaviorHistory,
		);
		segments.push(...behaviorSegments);

		// AI interaction-based segments
		const aiSegments = this.generateAIInteractionSegments(
			userProfile.aiInteractionHistory,
		);
		segments.push(...aiSegments);

		// Demographic segments
		if (userProfile.demographics) {
			const demoSegments = this.generateDemographicSegments(
				userProfile.demographics,
			);
			segments.push(...demoSegments);
		}

		return segments.sort((a, b) => b.score - a.score);
	}

	/**
	 * Generate interest-based targeting segments
	 */
	private generateInterestSegments(interests: Interest[]): TargetingSegment[] {
		const segments: TargetingSegment[] = [];

		// Group interests by category
		const interestGroups = interests.reduce((groups, interest) => {
			if (!groups[interest.category]) {
				groups[interest.category] = [];
			}
			groups[interest.category].push(interest);
			return groups;
		}, {} as Record<string, Interest[]>);

		// Create segments for each interest category
		Object.entries(interestGroups).forEach(([category, categoryInterests]) => {
			const avgScore =
				categoryInterests.reduce((sum, interest) => sum + interest.score, 0) /
				categoryInterests.length;

			if (avgScore > 0.3) {
				// Only create segments for significant interests
				segments.push({
					id: `interest_${category.toLowerCase().replace(/\s+/g, '_')}`,
					name: `${category} Interest`,
					criteria: {
						topics: [category],
						intents: [IntentCategory.COMMERCIAL, IntentCategory.INFORMATIONAL],
						sentimentRange: { min: -0.5, max: 1.0 },
						engagementLevels: [
							EngagementTier.MEDIUM,
							EngagementTier.HIGH,
							EngagementTier.VERY_HIGH,
						],
						interests: [category],
					},
					score: avgScore,
					size: categoryInterests.length,
				});
			}
		});

		return segments;
	}

	/**
	 * Generate behavior-based targeting segments
	 */
	private generateBehaviorSegments(behaviorHistory: any[]): TargetingSegment[] {
		// This would analyze behavior patterns to create segments
		// For now, return a simple high-engagement segment
		return [
			{
				id: 'high_engagement_users',
				name: 'High Engagement Users',
				criteria: {
					topics: [],
					intents: [IntentCategory.COMMERCIAL, IntentCategory.TRANSACTIONAL],
					sentimentRange: { min: 0, max: 1.0 },
					engagementLevels: [EngagementTier.HIGH, EngagementTier.VERY_HIGH],
				},
				score: 0.8,
				size: behaviorHistory.length,
			},
		];
	}

	/**
	 * Generate AI interaction-based targeting segments
	 */
	private generateAIInteractionSegments(aiHistory: any[]): TargetingSegment[] {
		if (!aiHistory.length) return [];

		return [
			{
				id: 'ai_power_users',
				name: 'AI Power Users',
				criteria: {
					topics: ['technology', 'ai', 'automation'],
					intents: [IntentCategory.INFORMATIONAL, IntentCategory.COMMERCIAL],
					sentimentRange: { min: -0.2, max: 1.0 },
					engagementLevels: [EngagementTier.HIGH, EngagementTier.VERY_HIGH],
				},
				score: 0.7,
				size: aiHistory.length,
			},
		];
	}

	/**
	 * Generate demographic-based targeting segments
	 */
	private generateDemographicSegments(demographics: any): TargetingSegment[] {
		const segments: TargetingSegment[] = [];

		if (demographics.ageRange) {
			segments.push({
				id: `age_${demographics.ageRange}`,
				name: `Age ${demographics.ageRange.replace('_', '-')}`,
				criteria: {
					topics: [],
					intents: [IntentCategory.COMMERCIAL],
					sentimentRange: { min: -1.0, max: 1.0 },
					engagementLevels: [EngagementTier.MEDIUM, EngagementTier.HIGH],
					demographics: {
						ageRanges: [demographics.ageRange],
					},
				},
				score: 0.6,
				size: 1000, // Estimated segment size
			});
		}

		return segments;
	}

	/**
	 * Optimize targeting strategy based on performance data
	 */
	async optimizeTargeting(
		performanceData: PerformanceMetrics,
	): Promise<TargetingStrategy> {
		// Analyze performance to adjust targeting weights
		const weights = { ...this.defaultWeights };

		// If CTR is low, increase intent and engagement weights
		if (performanceData.ctr < 0.02) {
			weights.intent *= 1.2;
			weights.engagement *= 1.2;
			weights.topic *= 0.9;
		}

		// If engagement is low, focus more on interest matching
		if (performanceData.engagementScore < 0.5) {
			weights.interest *= 1.3;
			weights.sentiment *= 1.1;
		}

		// Normalize weights
		const totalWeight = Object.values(weights).reduce(
			(sum, weight) => sum + weight,
			0,
		);
		Object.keys(weights).forEach((key) => {
			weights[key as keyof typeof weights] /= totalWeight;
		});

		return {
			segments: [], // Would be populated with optimized segments
			weights,
			optimizationGoal: performanceData.ctr > 0.03 ? 'conversion' : 'ctr',
		};
	}

	/**
	 * Validate targeting criteria for compliance and effectiveness
	 */
	async validateTargeting(criteria: TargetingCriteria): Promise<{
		valid: boolean;
		issues: string[];
		suggestions: string[];
	}> {
		const issues: string[] = [];
		const suggestions: string[] = [];

		// Check for overly restrictive criteria
		if (criteria.topics.length === 0 && criteria.intents.length === 0) {
			issues.push('No targeting criteria specified');
			suggestions.push('Add at least one topic or intent for targeting');
		}

		// Check sentiment range validity
		if (criteria.sentimentRange.min >= criteria.sentimentRange.max) {
			issues.push('Invalid sentiment range');
			suggestions.push('Ensure minimum sentiment is less than maximum');
		}

		// Check for conflicting criteria
		if (
			criteria.intents.includes(IntentCategory.COMMERCIAL) &&
			criteria.sentimentRange.max < 0
		) {
			issues.push(
				'Commercial intent with negative sentiment may perform poorly',
			);
			suggestions.push(
				'Consider allowing neutral to positive sentiment for commercial ads',
			);
		}

		return {
			valid: issues.length === 0,
			issues,
			suggestions,
		};
	}

	/**
	 * Helper method to extract keywords from ad content
	 */
	private extractAdKeywords(ad: Ad): string[] {
		const text = `${ad.content.title} ${ad.content.description} ${ad.content.brandName}`;
		return text
			.toLowerCase()
			.split(/\W+/)
			.filter((word) => word.length > 2)
			.slice(0, 20); // Limit to top 20 keywords
	}

	/**
	 * Calculate keyword overlap between two sets of keywords
	 */
	private calculateKeywordOverlap(
		keywords1: string[],
		keywords2: string[],
	): number {
		if (!keywords1.length || !keywords2.length) return 0;

		const set1 = new Set(keywords1.map((k) => k.toLowerCase()));
		const set2 = new Set(keywords2.map((k) => k.toLowerCase()));

		const intersection = new Set([...set1].filter((k) => set2.has(k)));
		const union = new Set([...set1, ...set2]);

		return intersection.size / union.size; // Jaccard similarity
	}

	/**
	 * Calculate recency factor for interests based on last update
	 */
	private calculateRecencyFactor(lastUpdated: Date): number {
		const daysSinceUpdate =
			(Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);

		// Decay factor: interests become less relevant over time
		if (daysSinceUpdate < 7) return 1.0;
		if (daysSinceUpdate < 30) return 0.8;
		if (daysSinceUpdate < 90) return 0.6;
		return 0.4;
	}
}
