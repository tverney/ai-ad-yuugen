import {
  AIContext,
  SignalQuery,
  SignalCategory,
  Topic,
  UserIntent,
  IntentCategory,
  EngagementLevel,
  Demographics,
} from '@ai-yuugen/types';

/**
 * Configuration for context analyzer
 */
export interface ContextAnalyzerConfig {
  /** Maximum number of topics to extract (default: 10) */
  maxTopics?: number;
  /** Minimum topic confidence threshold (default: 0.3) */
  minTopicConfidence?: number;
  /** Maximum number of keywords per topic (default: 5) */
  maxKeywordsPerTopic?: number;
  /** Enable demographic extraction (default: false) */
  enableDemographics?: boolean;
}

/**
 * Context analyzer for creating signal queries from AI context
 * Extracts topics, intent, and demographics to build optimal signal queries
 */
export class ContextAnalyzer {
  private config: Required<ContextAnalyzerConfig>;

  constructor(config: ContextAnalyzerConfig = {}) {
    this.config = {
      maxTopics: config.maxTopics ?? 10,
      minTopicConfidence: config.minTopicConfidence ?? 0.3,
      maxKeywordsPerTopic: config.maxKeywordsPerTopic ?? 5,
      enableDemographics: config.enableDemographics ?? false,
    };
  }

  /**
   * Create a signal query from AI context
   */
  createSignalQuery(context: AIContext): SignalQuery {
    const topics = this.extractTopics(context);
    const intent = this.extractIntent(context);
    const demographics = this.extractDemographics(context);

    // Build signal query
    const query: SignalQuery = {
      topics,
      categories: this.mapIntentToCategories(context.intent),
      limit: 50, // Default limit for signal discovery
    };

    // Add intent-related keywords to text query
    if (intent) {
      query.text = intent;
    }

    // Add demographics if available and enabled
    if (this.config.enableDemographics && demographics) {
      query.demographics = demographics;
    }

    return query;
  }

  /**
   * Extract topics from AI context
   */
  extractTopics(context: AIContext): string[] {
    if (!context.topics || context.topics.length === 0) {
      return [];
    }

    // Filter topics by confidence threshold
    const relevantTopics = context.topics.filter(
      (topic) => topic.confidence >= this.config.minTopicConfidence
    );

    // Sort by relevance score and confidence
    const sortedTopics = relevantTopics.sort((a, b) => {
      const scoreA = a.relevanceScore * a.confidence;
      const scoreB = b.relevanceScore * b.confidence;
      return scoreB - scoreA;
    });

    // Take top N topics
    const topTopics = sortedTopics.slice(0, this.config.maxTopics);

    // Extract topic names and categories
    const topicStrings = new Set<string>();

    for (const topic of topTopics) {
      topicStrings.add(topic.name);
      topicStrings.add(topic.category);

      // Add top keywords
      const topKeywords = topic.keywords.slice(0, this.config.maxKeywordsPerTopic);
      topKeywords.forEach((keyword) => topicStrings.add(keyword));
    }

    return Array.from(topicStrings);
  }

  /**
   * Extract intent from AI context
   */
  extractIntent(context: AIContext): string {
    if (!context.intent) {
      return '';
    }

    const intentParts: string[] = [];

    // Add primary intent
    intentParts.push(context.intent.primary);

    // Add secondary intents if available
    if (context.intent.secondary && context.intent.secondary.length > 0) {
      intentParts.push(...context.intent.secondary);
    }

    // Add intent category
    intentParts.push(context.intent.category);

    return intentParts.join(' ');
  }

  /**
   * Extract demographics from user engagement
   * Note: This is a placeholder implementation since demographics
   * are not directly available in AIContext
   */
  extractDemographics(context: AIContext): Demographics | undefined {
    if (!this.config.enableDemographics) {
      return undefined;
    }

    // In a real implementation, this would extract demographics from:
    // - User profile (if available)
    // - Inferred from conversation patterns
    // - Engagement behavior analysis
    
    // For now, return undefined as we don't have this data in AIContext
    return undefined;
  }

  /**
   * Map user intent category to signal categories
   */
  private mapIntentToCategories(intent: UserIntent): SignalCategory[] {
    const categories: SignalCategory[] = [];

    switch (intent.category) {
      case IntentCategory.COMMERCIAL:
      case IntentCategory.TRANSACTIONAL:
        // Commercial intent maps to behavioral and demographic signals
        categories.push(SignalCategory.BEHAVIORAL, SignalCategory.DEMOGRAPHIC);
        break;

      case IntentCategory.INFORMATIONAL:
        // Informational intent maps to contextual signals
        categories.push(SignalCategory.CONTEXTUAL);
        break;

      case IntentCategory.NAVIGATIONAL:
        // Navigational intent maps to behavioral signals
        categories.push(SignalCategory.BEHAVIORAL);
        break;

      case IntentCategory.ENTERTAINMENT:
        // Entertainment intent maps to psychographic and contextual signals
        categories.push(SignalCategory.CONTEXTUAL);
        break;

      case IntentCategory.SUPPORT:
        // Support intent maps to contextual signals
        categories.push(SignalCategory.CONTEXTUAL);
        break;

      default:
        // Default to contextual signals
        categories.push(SignalCategory.CONTEXTUAL);
    }

    return categories;
  }

  /**
   * Analyze engagement level to determine signal priority
   */
  analyzeEngagementPriority(engagement: EngagementLevel): number {
    // Higher engagement = higher priority for premium signals
    switch (engagement.level) {
      case 'very_high':
        return 10;
      case 'high':
        return 8;
      case 'medium':
        return 5;
      case 'low':
        return 3;
      default:
        return 5;
    }
  }

  /**
   * Update analyzer configuration
   */
  updateConfig(config: Partial<ContextAnalyzerConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Get current analyzer configuration
   */
  getConfig(): Required<ContextAnalyzerConfig> {
    return { ...this.config };
  }
}
