import {
  Signal,
  ScoredSignal,
  SignalScores,
  AIContext,
  Topic,
  UserIntent,
  Demographics,
} from '@ai-yuugen/types';

/**
 * Configuration for signal scoring
 */
export interface SignalScorerConfig {
  /** Weight for relevance score (default: 0.4) */
  relevanceWeight?: number;
  /** Weight for quality score (default: 0.3) */
  qualityWeight?: number;
  /** Weight for cost efficiency score (default: 0.2) */
  costWeight?: number;
  /** Weight for reach score (default: 0.1) */
  reachWeight?: number;
  /** Industry average CPM for cost comparison (default: 5.0) */
  averageCPM?: number;
  /** Maximum reach for normalization (default: 10000000) */
  maxReach?: number;
}

/**
 * Signal scorer for ranking discovered signals
 * Implements scoring algorithm based on relevance, quality, cost efficiency, and reach
 */
export class SignalScorer {
  private config: Required<SignalScorerConfig>;

  constructor(config: SignalScorerConfig = {}) {
    this.config = {
      relevanceWeight: config.relevanceWeight ?? 0.4,
      qualityWeight: config.qualityWeight ?? 0.3,
      costWeight: config.costWeight ?? 0.2,
      reachWeight: config.reachWeight ?? 0.1,
      averageCPM: config.averageCPM ?? 5.0,
      maxReach: config.maxReach ?? 10000000,
    };
  }

  /**
   * Score and rank multiple signals based on AI context
   */
  async scoreSignals(signals: Signal[], context: AIContext): Promise<ScoredSignal[]> {
    const scoredSignals = await Promise.all(
      signals.map((signal) => this.scoreSignal(signal, context))
    );

    // Sort by total score descending
    return scoredSignals.sort((a, b) => b.scores.total - a.scores.total);
  }

  /**
   * Score a single signal
   */
  private async scoreSignal(signal: Signal, context: AIContext): Promise<ScoredSignal> {
    const relevance = this.calculateRelevance(signal, context);
    const quality = this.calculateQuality(signal);
    const costEfficiency = this.calculateCostEfficiency(signal);
    const reach = this.calculateReach(signal);

    // Calculate weighted total score
    const total =
      relevance * this.config.relevanceWeight +
      quality * this.config.qualityWeight +
      costEfficiency * this.config.costWeight +
      reach * this.config.reachWeight;

    const scores: SignalScores = {
      relevance,
      quality,
      costEfficiency,
      reach,
      total,
    };

    return {
      ...signal,
      scores,
    };
  }

  /**
   * Calculate relevance score based on topic overlap, intent alignment, and demographics
   * Score range: 0-1
   */
  private calculateRelevance(signal: Signal, context: AIContext): number {
    let score = 0;
    let componentCount = 0;

    // Topic overlap (33% of relevance)
    if (context.topics && context.topics.length > 0 && signal.metadata.topics) {
      const topicScore = this.calculateTopicOverlap(context.topics, signal.metadata.topics);
      score += topicScore;
      componentCount++;
    }

    // Intent alignment (33% of relevance)
    if (context.intent && signal.metadata.intents) {
      const intentScore = this.calculateIntentAlignment(context.intent, signal.metadata.intents);
      score += intentScore;
      componentCount++;
    }

    // Demographics match (33% of relevance)
    if (signal.metadata.demographics) {
      const demoScore = this.calculateDemographicsMatch(signal.metadata.demographics);
      score += demoScore;
      componentCount++;
    }

    // Return average of available components, or 0.5 if no components
    return componentCount > 0 ? score / componentCount : 0.5;
  }

  /**
   * Calculate topic overlap between context topics and signal topics
   */
  private calculateTopicOverlap(contextTopics: Topic[], signalTopics: string[]): number {
    if (signalTopics.length === 0) return 0;

    const contextKeywords = new Set(
      contextTopics.flatMap((topic) => [
        topic.name.toLowerCase(),
        topic.category.toLowerCase(),
        ...topic.keywords.map((k) => k.toLowerCase()),
      ])
    );

    const signalKeywords = new Set(signalTopics.map((t) => t.toLowerCase()));

    // Calculate Jaccard similarity
    const intersection = new Set([...contextKeywords].filter((k) => signalKeywords.has(k)));
    const union = new Set([...contextKeywords, ...signalKeywords]);

    const jaccardSimilarity = union.size > 0 ? intersection.size / union.size : 0;

    // Weight by context topic confidence
    const avgConfidence =
      contextTopics.reduce((sum, topic) => sum + topic.confidence, 0) / contextTopics.length;

    return jaccardSimilarity * avgConfidence;
  }

  /**
   * Calculate intent alignment between context intent and signal intents
   */
  private calculateIntentAlignment(contextIntent: UserIntent, signalIntents: string[]): number {
    if (signalIntents.length === 0) return 0;

    const intentCategories = [contextIntent.primary, ...(contextIntent.secondary || [])].map((i) =>
      i.toLowerCase()
    );

    const signalIntentSet = new Set(signalIntents.map((i) => i.toLowerCase()));

    // Check for exact matches
    const matches = intentCategories.filter((intent) => signalIntentSet.has(intent));

    // Calculate match ratio weighted by confidence
    const matchRatio = matches.length / intentCategories.length;
    return matchRatio * contextIntent.confidence;
  }

  /**
   * Calculate demographics match score
   * For now, returns a baseline score since we don't have user demographics in context
   */
  private calculateDemographicsMatch(signalDemographics: Demographics): number {
    // In a real implementation, this would compare signal demographics
    // with user demographics from the context or user profile
    // For now, return a neutral score
    return 0.5;
  }

  /**
   * Calculate quality score based on confidence and data freshness
   * Score range: 0-1
   */
  private calculateQuality(signal: Signal): number {
    // Confidence component (70% of quality)
    const confidenceScore = signal.confidence;

    // Data freshness component (30% of quality)
    const freshnessScore = signal.metadata.dataFreshness ?? 0.5;

    return confidenceScore * 0.7 + freshnessScore * 0.3;
  }

  /**
   * Calculate cost efficiency score based on CPM relative to industry average
   * Score range: 0-1 (higher is better, meaning lower cost)
   */
  private calculateCostEfficiency(signal: Signal): number {
    const cpmRatio = signal.cpm / this.config.averageCPM;

    // Inverse relationship: lower CPM = higher score
    // Use exponential decay to penalize high CPM
    if (cpmRatio <= 1) {
      // Below or at average: score 0.5 to 1.0
      return 0.5 + 0.5 * (1 - cpmRatio);
    } else {
      // Above average: score 0 to 0.5
      return 0.5 * Math.exp(-(cpmRatio - 1));
    }
  }

  /**
   * Calculate reach score based on normalized audience size
   * Score range: 0-1
   */
  private calculateReach(signal: Signal): number {
    // Normalize reach to 0-1 range using logarithmic scale
    // This prevents very large audiences from dominating the score
    const normalizedReach = Math.min(signal.reach / this.config.maxReach, 1);

    // Apply logarithmic scaling to give diminishing returns for larger audiences
    return Math.log10(1 + normalizedReach * 9) / Math.log10(10);
  }

  /**
   * Update scoring configuration
   */
  updateConfig(config: Partial<SignalScorerConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Get current scoring configuration
   */
  getConfig(): Required<SignalScorerConfig> {
    return { ...this.config };
  }
}
