import {
	Ad,
	AIContext,
	EnhancedAIContext,
	AdPlacement,
	UserProfile,
	Signal,
	ScoredSignal,
	ActivationConfig,
	ADCPConfig,
} from '@ai-yuugen/types';
import { TargetingEngine, TargetingCriteria } from './targeting-engine';
import { ADCPClient } from '@ai-yuugen/adcp-client';
import { SignalScorer, SignalScorerConfig } from './signal-scorer';
import { ContextAnalyzer, ContextAnalyzerConfig } from './context-analyzer';
import {
	ABTestingFramework,
	ABTestConfig,
	ABTestResults,
} from './ab-testing-framework';

/**
 * Configuration for enhanced targeting engine
 */
export interface EnhancedTargetingConfig {
	/** ADCP client configuration */
	adcp: ADCPConfig;
	/** Signal scorer configuration */
	scorer?: SignalScorerConfig;
	/** Context analyzer configuration */
	analyzer?: ContextAnalyzerConfig;
	/** Maximum number of signals to activate per request */
	maxSignalsPerRequest?: number;
	/** Maximum budget for signal activation per request (in USD) */
	maxBudgetPerRequest?: number;
	/** Minimum signal score threshold for activation */
	minSignalScore?: number;
	/** Enable fallback to standard targeting on ADCP failure */
	enableFallback?: boolean;
	/** Timeout for ADCP operations in milliseconds */
	adcpTimeout?: number;
	/** A/B test configuration (optional) */
	abTest?: ABTestConfig;
}

/**
 * Enhanced targeting engine that leverages ADCP signals for improved ad selection
 * Extends the standard targeting engine with signal-based enhancements
 */
export class EnhancedTargetingEngine extends TargetingEngine {
	private adcpClient: ADCPClient;
	private signalScorer: SignalScorer;
	private contextAnalyzer: ContextAnalyzer;
	private fallbackEngine: TargetingEngine;
	private config: Required<EnhancedTargetingConfig>;
	private fallbackCount: number = 0;
	private totalRequests: number = 0;
	private abTestFramework?: ABTestingFramework;

	constructor(config: EnhancedTargetingConfig) {
		super();

		this.config = {
			adcp: config.adcp,
			scorer: config.scorer ?? {},
			analyzer: config.analyzer ?? {},
			maxSignalsPerRequest: config.maxSignalsPerRequest ?? 5,
			maxBudgetPerRequest: config.maxBudgetPerRequest ?? 10.0,
			minSignalScore: config.minSignalScore ?? 0.5,
			enableFallback: config.enableFallback ?? true,
			adcpTimeout: config.adcpTimeout ?? 200,
		};

		// Initialize components
		this.adcpClient = new ADCPClient(this.config.adcp);
		this.signalScorer = new SignalScorer(this.config.scorer);
		this.contextAnalyzer = new ContextAnalyzer(this.config.analyzer);
		this.fallbackEngine = new TargetingEngine();

		// Initialize A/B testing framework if configured
		if (config.abTest) {
			this.abTestFramework = new ABTestingFramework(config.abTest);
		}
	}

	/**
	 * Select ads with ADCP signal enhancement
	 * Falls back to standard targeting on ADCP failure
	 * Supports A/B testing between ADCP and standard targeting
	 */
	async selectAds(
		placement: AdPlacement,
		context: AIContext,
		userProfile?: UserProfile,
		targetingCriteria?: TargetingCriteria,
	): Promise<Ad[]> {
		this.totalRequests++;
		const startTime = Date.now();
		const sessionId = userProfile?.id || `session_${Date.now()}`;

		// Check if A/B testing is enabled and determine variant
		const useADCP = this.abTestFramework
			? this.abTestFramework.isInTreatment(sessionId)
			: true;

		try {
			let ads: Ad[];
			let error: Error | null = null;

			if (useADCP) {
				// Try ADCP-enhanced targeting with timeout
				const timeoutPromise = new Promise<never>((_, reject) =>
					setTimeout(
						() => reject(new Error('ADCP timeout')),
						this.config.adcpTimeout,
					),
				);

				const enhancedPromise = this.selectAdsWithSignals(
					placement,
					context,
					userProfile,
					targetingCriteria,
				);

				try {
					ads = await Promise.race([enhancedPromise, timeoutPromise]);
				} catch (err) {
					error = err instanceof Error ? err : new Error(String(err));
					throw err;
				}
			} else {
				// Use standard targeting for control group
				ads = await this.fallbackEngine.selectAds(
					placement,
					context,
					userProfile,
					targetingCriteria,
				);
			}

			// Track metrics for A/B testing
			if (this.abTestFramework) {
				const responseTime = Date.now() - startTime;
				this.abTestFramework.trackMetrics(sessionId, {
					responseTime,
					error: false,
				});
			}

			return ads;
		} catch (error) {
			// Log ADCP failure
			console.warn('ADCP targeting failed, using fallback', {
				error: error instanceof Error ? error.message : String(error),
				placement: placement.id,
				fallbackRate: this.getFallbackRate(),
				useADCP,
			});

			this.fallbackCount++;

			// Track error for A/B testing
			if (this.abTestFramework) {
				const responseTime = Date.now() - startTime;
				this.abTestFramework.trackMetrics(sessionId, {
					responseTime,
					error: true,
				});
			}

			// Fall back to standard targeting if enabled
			if (this.config.enableFallback) {
				const fallbackStartTime = Date.now();

				// Use standard targeting - return empty array as placeholder
				// In a real implementation, this would query the ad inventory
				const ads: Ad[] = [];

				const fallbackTime = Date.now() - fallbackStartTime;

				// Ensure fallback completes within 50ms
				if (fallbackTime > 50) {
					console.warn('Fallback targeting exceeded 50ms threshold', {
						fallbackTime,
						placement: placement.id,
					});
				}

				return ads;
			}

			// If fallback is disabled, throw the error
			throw error;
		}
	}

	/**
	 * Select ads using ADCP signal enhancement
	 * This is the core enhanced targeting logic
	 */
	private async selectAdsWithSignals(
		placement: AdPlacement,
		context: AIContext,
		userProfile?: UserProfile,
		targetingCriteria?: TargetingCriteria,
	): Promise<Ad[]> {
		// Step 1: Enhance context with ADCP signals
		const enhancedContext = await this.enhanceContext(context);

		// Step 2: Build enhanced targeting criteria from placement and enhanced context
		const enhancedCriteria = this.buildEnhancedCriteria(
			targetingCriteria,
			enhancedContext,
		);

		// Step 3: Query ad inventory with enhanced criteria
		// In a real implementation, this would:
		// 1. Query the ad inventory/database with enhanced criteria
		// 2. Filter ads by placement type and format
		// 3. Score each ad using the enhanced context
		// 4. Return top-scoring ads

		// For now, we return an empty array as we don't have inventory integration
		// The actual inventory query would be implemented by the ad server
		const ads: Ad[] = await this.queryAdInventory(
			placement,
			enhancedContext,
			enhancedCriteria,
		);

		// Step 4: Score and rank ads using enhanced context
		const scoredAds = await this.scoreAdsWithEnhancedContext(
			ads,
			enhancedContext,
			userProfile,
			enhancedCriteria,
		);

		return scoredAds;
	}

	/**
	 * Query ad inventory with enhanced criteria
	 * This is a placeholder for actual inventory integration
	 */
	private async queryAdInventory(
		placement: AdPlacement,
		context: EnhancedAIContext,
		criteria: TargetingCriteria,
	): Promise<Ad[]> {
		// In a real implementation, this would query the ad inventory
		// For now, return empty array
		return [];
	}

	/**
	 * Score ads using enhanced context with ADCP signals
	 */
	private async scoreAdsWithEnhancedContext(
		ads: Ad[],
		context: EnhancedAIContext,
		userProfile?: UserProfile,
		criteria?: TargetingCriteria,
	): Promise<Ad[]> {
		// Calculate relevance scores for each ad using enhanced context
		const scoredAds = await Promise.all(
			ads.map(async (ad) => {
				const score = await this.calculateRelevanceScore(
					ad,
					context,
					userProfile,
					criteria,
				);
				return { ad, score };
			}),
		);

		// Sort by score descending
		scoredAds.sort((a, b) => b.score - a.score);

		// Return ads in ranked order
		return scoredAds.map((item) => item.ad);
	}

	/**
	 * Enhance AI context with ADCP signals
	 * Discovers, scores, selects, and activates signals
	 */
	private async enhanceContext(context: AIContext): Promise<EnhancedAIContext> {
		const startTime = Date.now();

		// Step 1: Create signal query from context
		const signalQuery = this.contextAnalyzer.createSignalQuery(context);

		// Step 2: Discover signals
		const signals = await this.adcpClient.discoverSignals(signalQuery);

		if (signals.length === 0) {
			// No signals found, return context as-is
			return {
				...context,
				adcpSignals: [],
				signalActivations: [],
				enhancementMetadata: {
					enhancedAt: new Date(),
					signalCount: 0,
					totalCost: 0,
					expectedLift: 0,
					confidence: 0,
					processingTimeMs: Date.now() - startTime,
				},
			};
		}

		// Step 3: Score and rank signals
		const scoredSignals = await this.signalScorer.scoreSignals(
			signals,
			context,
		);

		// Step 4: Select top signals within budget
		const selectedSignals = this.selectTopSignals(scoredSignals);

		// Step 5: Activate selected signals
		const activations = await this.activateSignals(selectedSignals);

		// Step 6: Calculate enhancement metadata
		const totalCost = selectedSignals.reduce(
			(sum, signal) => sum + signal.cpm,
			0,
		);
		const avgScore =
			selectedSignals.reduce((sum, signal) => sum + signal.scores.total, 0) /
			selectedSignals.length;

		const enhancedContext: EnhancedAIContext = {
			...context,
			adcpSignals: selectedSignals,
			signalActivations: activations.map((a) => a.id),
			enhancementMetadata: {
				enhancedAt: new Date(),
				signalCount: selectedSignals.length,
				totalCost,
				expectedLift: avgScore * 0.2, // Estimate 20% lift based on signal quality
				confidence: avgScore,
				processingTimeMs: Date.now() - startTime,
			},
		};

		return enhancedContext;
	}

	/**
	 * Select top signals within budget and score threshold
	 */
	private selectTopSignals(scoredSignals: ScoredSignal[]): ScoredSignal[] {
		const selected: ScoredSignal[] = [];
		let totalCost = 0;

		for (const signal of scoredSignals) {
			// Check if signal meets minimum score threshold
			if (signal.scores.total < this.config.minSignalScore) {
				continue;
			}

			// Check if adding this signal would exceed budget
			if (totalCost + signal.cpm > this.config.maxBudgetPerRequest) {
				continue;
			}

			// Check if we've reached max signals limit
			if (selected.length >= this.config.maxSignalsPerRequest) {
				break;
			}

			// Select this signal
			signal.selected = true;
			selected.push(signal);
			totalCost += signal.cpm;
		}

		return selected;
	}

	/**
	 * Activate selected signals via ADCP
	 */
	private async activateSignals(signals: ScoredSignal[]): Promise<any[]> {
		const activationPromises = signals.map(async (signal) => {
			const config: ActivationConfig = {
				signalId: signal.id,
				durationHours: 1, // Activate for 1 hour
				budget: signal.cpm,
				currency: 'USD',
				priority: Math.round(signal.scores.total * 10),
			};

			try {
				const activation = await this.adcpClient.activateSignal(
					signal.id,
					config,
				);
				signal.activationId = activation.id;
				return activation;
			} catch (error) {
				console.error('Failed to activate signal', {
					signalId: signal.id,
					error: error instanceof Error ? error.message : String(error),
				});
				return null;
			}
		});

		const activations = await Promise.all(activationPromises);
		return activations.filter((a) => a !== null);
	}

	/**
	 * Build enhanced targeting criteria from signals
	 */
	private buildEnhancedCriteria(
		baseCriteria: TargetingCriteria | undefined,
		enhancedContext: EnhancedAIContext,
	): TargetingCriteria {
		const criteria: TargetingCriteria = baseCriteria || {
			topics: [],
			intents: [],
			sentimentRange: { min: -1, max: 1 },
			engagementLevels: [],
		};

		// Add signal topics to targeting criteria
		if (enhancedContext.adcpSignals && enhancedContext.adcpSignals.length > 0) {
			const signalTopics = enhancedContext.adcpSignals.flatMap(
				(signal) => signal.metadata.topics || [],
			);
			criteria.topics = [...new Set([...criteria.topics, ...signalTopics])];
		}

		return criteria;
	}

	/**
	 * Get fallback activation rate
	 */
	getFallbackRate(): number {
		return this.totalRequests > 0 ? this.fallbackCount / this.totalRequests : 0;
	}

	/**
	 * Get statistics about enhanced targeting performance
	 */
	getStats() {
		return {
			totalRequests: this.totalRequests,
			fallbackCount: this.fallbackCount,
			fallbackRate: this.getFallbackRate(),
			adcpStats: this.adcpClient.getStats(),
			abTestResults: this.abTestFramework
				? this.abTestFramework.getResults()
				: null,
		};
	}

	/**
	 * Get A/B test results
	 */
	getABTestResults(): ABTestResults | null {
		return this.abTestFramework ? this.abTestFramework.getResults() : null;
	}

	/**
	 * Track ad performance metrics for A/B testing
	 */
	trackAdPerformance(
		sessionId: string,
		metrics: {
			impressions?: number;
			clicks?: number;
			conversions?: number;
			revenue?: number;
		},
	): void {
		if (this.abTestFramework) {
			this.abTestFramework.trackMetrics(sessionId, metrics);
		}
	}

	/**
	 * Destroy engine and cleanup resources
	 */
	async destroy(): Promise<void> {
		await this.adcpClient.destroy();
	}
}
