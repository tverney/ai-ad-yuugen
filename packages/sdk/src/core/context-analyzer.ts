import {
  ContextAnalyzer as IContextAnalyzer,
  AIConversation,
  AIContext,
  AIMessage,
  Topic,
  UserIntent,
  IntentCategory,
  SentimentScore,
  SentimentLabel,
  ConversationStage,
  ConversationPhase,
  EngagementLevel,
  EngagementTier,
  EngagementIndicator,
  EngagementType,
  EngagementTrend,
  UserContext
} from '@ai-yuugen/types';

/**
 * Context analysis configuration
 */
export interface ContextAnalyzerConfig {
  enableSentimentAnalysis: boolean;
  enableTopicExtraction: boolean;
  enableIntentDetection: boolean;
  enableEngagementTracking: boolean;
  minTopicConfidence: number;
  minIntentConfidence: number;
  maxTopicsPerAnalysis: number;
  debugMode: boolean;
}

/**
 * Default configuration for context analyzer
 */
const DEFAULT_CONFIG: ContextAnalyzerConfig = {
  enableSentimentAnalysis: true,
  enableTopicExtraction: true,
  enableIntentDetection: true,
  enableEngagementTracking: true,
  minTopicConfidence: 0.3,
  minIntentConfidence: 0.4,
  maxTopicsPerAnalysis: 10,
  debugMode: false
};

/**
 * Context analyzer implementation for AI conversations
 */
export class ContextAnalyzer implements IContextAnalyzer {
  private config: ContextAnalyzerConfig;
  private topicKeywords: Map<string, string[]> = new Map();
  private intentPatterns: Map<IntentCategory, RegExp[]> = new Map();
  private sentimentLexicon: Map<string, number> = new Map();

  constructor(config: Partial<ContextAnalyzerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeKeywords();
    this.initializeIntentPatterns();
    this.initializeSentimentLexicon();
  }

  /**
   * Analyze complete conversation context
   */
  analyzeConversation(conversation: AIConversation): AIContext {
    const startTime = Date.now();
    
    try {
      // Extract all text content from conversation
      const conversationText = this.extractConversationText(conversation);
      
      // Perform parallel analysis
      const [topics, intent, sentiment, stage, engagement] = [
        this.config.enableTopicExtraction ? this.extractTopics(conversationText) : [],
        this.config.enableIntentDetection ? this.detectIntent(conversation) : this.getDefaultIntent(),
        this.config.enableSentimentAnalysis ? this.analyzeSentiment(conversationText) : this.getDefaultSentiment(),
        this.detectConversationStage(conversation),
        this.config.enableEngagementTracking ? this.calculateEngagement(conversation) : this.getDefaultEngagement()
      ];

      const context: AIContext = {
        topics,
        intent,
        sentiment,
        conversationStage: stage,
        userEngagement: engagement,
        confidence: this.calculateOverallConfidence(topics, intent, sentiment),
        extractedAt: new Date()
      };

      if (this.config.debugMode) {
        console.log('[ContextAnalyzer] Analysis completed', {
          duration: Date.now() - startTime,
          topicsFound: topics.length,
          intentConfidence: intent.confidence,
          sentimentLabel: sentiment.label,
          engagementLevel: engagement.level
        });
      }

      return context;
    } catch (error) {
      if (this.config.debugMode) {
        console.error('[ContextAnalyzer] Analysis failed', error);
      }
      
      // Return default context on error
      return this.getDefaultContext();
    }
  }

  /**
   * Extract topics from text using keyword matching and frequency analysis
   */
  extractTopics(text: string): Topic[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const normalizedText = this.normalizeText(text);
    const words = this.tokenizeText(normalizedText);
    const topicScores = new Map<string, number>();
    const topicKeywords = new Map<string, Set<string>>();

    // Calculate topic scores based on keyword matches
    for (const [category, keywords] of this.topicKeywords) {
      let score = 0;
      const matchedKeywords = new Set<string>();

      for (const keyword of keywords) {
        const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = normalizedText.match(keywordRegex);
        if (matches) {
          score += matches.length * this.getKeywordWeight(keyword);
          matchedKeywords.add(keyword);
        }
      }

      if (score > 0) {
        topicScores.set(category, score);
        topicKeywords.set(category, matchedKeywords);
      }
    }

    // Convert scores to topics with confidence
    const topics: Topic[] = [];
    const totalScore = Array.from(topicScores.values()).reduce((sum, score) => sum + score, 0);

    for (const [category, score] of topicScores) {
      const confidence = totalScore > 0 ? score / totalScore : 0;
      
      if (confidence >= this.config.minTopicConfidence) {
        topics.push({
          name: category,
          category: this.getTopicCategory(category),
          confidence,
          keywords: Array.from(topicKeywords.get(category) || []),
          relevanceScore: this.calculateRelevanceScore(category, score, words.length)
        });
      }
    }

    // Sort by confidence and limit results
    return topics
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.config.maxTopicsPerAnalysis);
  }

  /**
   * Detect user intent from conversation
   */
  detectIntent(conversation: AIConversation): UserIntent {
    const recentMessages = this.getRecentUserMessages(conversation, 5);
    const combinedText = recentMessages.map(m => m.content).join(' ');
    
    if (!combinedText.trim()) {
      return this.getDefaultIntent();
    }

    const normalizedText = this.normalizeText(combinedText);
    const intentScores = new Map<IntentCategory, number>();

    // Match against intent patterns
    for (const [category, patterns] of this.intentPatterns) {
      let score = 0;
      
      for (const pattern of patterns) {
        const matches = normalizedText.match(pattern);
        if (matches) {
          score += matches.length;
        }
      }
      
      if (score > 0) {
        intentScores.set(category, score);
      }
    }

    // Find primary intent
    let primaryIntent = IntentCategory.INFORMATIONAL;
    let maxScore = 0;
    let totalScore = 0;

    for (const [category, score] of intentScores) {
      totalScore += score;
      if (score > maxScore) {
        maxScore = score;
        primaryIntent = category;
      }
    }

    const confidence = totalScore > 0 ? maxScore / totalScore : 0;
    
    // Get secondary intents
    const secondary = Array.from(intentScores.entries())
      .filter(([category, score]) => category !== primaryIntent && score > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([category]) => category);

    return {
      primary: primaryIntent,
      secondary: secondary.length > 0 ? secondary : undefined,
      confidence: Math.max(confidence, this.config.minIntentConfidence),
      category: primaryIntent,
      actionable: this.isActionableIntent(primaryIntent, normalizedText)
    };
  }

  /**
   * Analyze sentiment of text
   */
  analyzeSentiment(text: string): SentimentScore {
    if (!text || text.trim().length === 0) {
      return this.getDefaultSentiment();
    }

    const words = this.tokenizeText(this.normalizeText(text));
    let totalScore = 0;
    let scoredWords = 0;

    // Calculate sentiment based on lexicon
    for (const word of words) {
      const score = this.sentimentLexicon.get(word.toLowerCase());
      if (score !== undefined) {
        totalScore += score;
        scoredWords++;
      }
    }

    if (scoredWords === 0) {
      return this.getDefaultSentiment();
    }

    const polarity = totalScore / scoredWords;
    const magnitude = Math.abs(polarity);
    const label = this.getSentimentLabel(polarity);
    const confidence = Math.min(scoredWords / words.length, 1.0);

    return {
      polarity: Math.max(-1, Math.min(1, polarity)),
      magnitude: Math.max(0, Math.min(1, magnitude)),
      label,
      confidence
    };
  }

  /**
   * Detect conversation stage
   */
  detectConversationStage(conversation: AIConversation): ConversationStage {
    const messageCount = conversation.messages.length;
    const duration = Date.now() - conversation.startTime.getTime();
    const recentMessages = conversation.messages.slice(-5);
    
    let stage = ConversationPhase.GREETING;
    let progress = 0;

    // Determine stage based on message patterns and count
    if (messageCount <= 2) {
      stage = ConversationPhase.GREETING;
      progress = messageCount / 2;
    } else if (messageCount <= 5) {
      stage = ConversationPhase.EXPLORATION;
      progress = (messageCount - 2) / 3;
    } else if (this.hasDecisionIndicators(recentMessages)) {
      stage = ConversationPhase.DECISION_MAKING;
      progress = 0.8;
    } else if (this.hasConclusionIndicators(recentMessages)) {
      stage = ConversationPhase.CONCLUSION;
      progress = 0.9;
    } else if (this.hasFollowUpIndicators(recentMessages)) {
      stage = ConversationPhase.FOLLOW_UP;
      progress = 1.0;
    } else {
      stage = ConversationPhase.PROBLEM_SOLVING;
      progress = Math.min(0.7, messageCount / 20);
    }

    return {
      stage,
      progress: Math.max(0, Math.min(1, progress)),
      duration,
      messageCount
    };
  }

  /**
   * Calculate user engagement level
   */
  calculateEngagement(conversation: AIConversation, userContext?: UserContext): EngagementLevel {
    const indicators: EngagementIndicator[] = [];
    
    // Message length indicator
    const avgMessageLength = this.calculateAverageMessageLength(conversation);
    indicators.push({
      type: EngagementType.MESSAGE_LENGTH,
      value: Math.min(avgMessageLength / 100, 1), // Normalize to 0-1
      weight: 0.2
    });

    // Response time indicator
    const avgResponseTime = this.calculateAverageResponseTime(conversation);
    indicators.push({
      type: EngagementType.RESPONSE_TIME,
      value: Math.max(0, 1 - (avgResponseTime / 60000)), // Faster = higher engagement
      weight: 0.15
    });

    // Question frequency indicator
    const questionFrequency = this.calculateQuestionFrequency(conversation);
    indicators.push({
      type: EngagementType.QUESTION_FREQUENCY,
      value: Math.min(questionFrequency, 1),
      weight: 0.25
    });

    // Session duration indicator
    const sessionDuration = Date.now() - conversation.startTime.getTime();
    indicators.push({
      type: EngagementType.SESSION_DURATION,
      value: Math.min(sessionDuration / 600000, 1), // 10 minutes = max
      weight: 0.2
    });

    // Interaction depth indicator
    const interactionDepth = conversation.messages.length / 20; // 20 messages = high depth
    indicators.push({
      type: EngagementType.INTERACTION_DEPTH,
      value: Math.min(interactionDepth, 1),
      weight: 0.2
    });

    // Calculate weighted score
    const score = indicators.reduce((sum, indicator) => 
      sum + (indicator.value * indicator.weight), 0
    );

    const level = this.getEngagementTier(score);
    const trend = this.calculateEngagementTrend(conversation, userContext);

    return {
      score: Math.max(0, Math.min(1, score)),
      level,
      indicators,
      trend
    };
  }

  /**
   * Update existing context with new message
   */
  updateContext(currentContext: AIContext, newMessage: AIMessage): AIContext {
    // For incremental updates, we'll re-analyze with the new message
    // In a production system, this could be optimized to update incrementally
    const mockConversation: AIConversation = {
      id: 'temp',
      messages: [newMessage],
      topics: currentContext.topics,
      intent: currentContext.intent,
      startTime: new Date(Date.now() - 300000), // 5 minutes ago
      lastActivity: new Date()
    };

    const newContext = this.analyzeConversation(mockConversation);
    
    // Merge with existing context, giving more weight to recent analysis
    return {
      ...currentContext,
      topics: this.mergeTopics(currentContext.topics, newContext.topics),
      intent: newContext.intent,
      sentiment: this.mergeSentiment(currentContext.sentiment, newContext.sentiment),
      extractedAt: new Date()
    };
  }

  // Private helper methods

  private initializeKeywords(): void {
    this.topicKeywords = new Map([
      ['technology', ['computer', 'software', 'app', 'digital', 'tech', 'programming', 'code', 'ai', 'artificial intelligence', 'machine learning', 'data']],
      ['business', ['company', 'business', 'market', 'sales', 'revenue', 'profit', 'strategy', 'management', 'corporate', 'enterprise']],
      ['health', ['health', 'medical', 'doctor', 'medicine', 'wellness', 'fitness', 'exercise', 'nutrition', 'healthcare', 'treatment']],
      ['education', ['learn', 'study', 'education', 'school', 'university', 'course', 'training', 'knowledge', 'academic', 'research']],
      ['entertainment', ['movie', 'music', 'game', 'fun', 'entertainment', 'show', 'video', 'streaming', 'media', 'content']],
      ['finance', ['money', 'finance', 'investment', 'bank', 'loan', 'credit', 'payment', 'budget', 'financial', 'economy']],
      ['travel', ['travel', 'trip', 'vacation', 'hotel', 'flight', 'destination', 'tourism', 'journey', 'adventure', 'explore']],
      ['food', ['food', 'restaurant', 'recipe', 'cooking', 'meal', 'cuisine', 'dining', 'nutrition', 'ingredients', 'taste']],
      ['shopping', ['buy', 'purchase', 'shop', 'store', 'product', 'price', 'discount', 'sale', 'retail', 'ecommerce']],
      ['sports', ['sport', 'game', 'team', 'player', 'match', 'competition', 'athletic', 'fitness', 'exercise', 'training']]
    ]);
  }

  private initializeIntentPatterns(): void {
    this.intentPatterns = new Map([
      [IntentCategory.INFORMATIONAL, [
        /\b(what|how|why|when|where|who|explain|tell me|information about)\b/gi,
        /\b(learn|understand|know|find out)\b/gi
      ]],
      [IntentCategory.TRANSACTIONAL, [
        /\b(buy|purchase|order|pay|checkout|subscribe|sign up)\b/gi,
        /\b(price|cost|fee|payment|billing)\b/gi
      ]],
      [IntentCategory.NAVIGATIONAL, [
        /\b(go to|navigate|find|locate|search for|looking for)\b/gi,
        /\b(website|page|section|menu|link)\b/gi
      ]],
      [IntentCategory.COMMERCIAL, [
        /\b(compare|review|best|recommend|suggest|advice)\b/gi,
        /\b(product|service|solution|option|alternative)\b/gi
      ]],
      [IntentCategory.SUPPORT, [
        /\b(help|support|problem|issue|error|bug|fix)\b/gi,
        /\b(not working|broken|trouble|difficulty)\b/gi
      ]],
      [IntentCategory.ENTERTAINMENT, [
        /\b(fun|entertainment|game|joke|story|interesting)\b/gi,
        /\b(watch|listen|play|enjoy|amusing)\b/gi
      ]]
    ]);
  }

  private initializeSentimentLexicon(): void {
    this.sentimentLexicon = new Map([
      // Positive words
      ['good', 0.5], ['great', 0.8], ['excellent', 0.9], ['amazing', 0.9], ['wonderful', 0.8],
      ['love', 0.7], ['like', 0.4], ['enjoy', 0.6], ['happy', 0.7], ['pleased', 0.6],
      ['satisfied', 0.6], ['perfect', 0.8], ['awesome', 0.8], ['fantastic', 0.9], ['brilliant', 0.8],
      
      // Negative words
      ['bad', -0.5], ['terrible', -0.8], ['awful', -0.9], ['horrible', -0.9], ['hate', -0.8],
      ['dislike', -0.4], ['angry', -0.7], ['frustrated', -0.7], ['disappointed', -0.6], ['sad', -0.6],
      ['upset', -0.6], ['annoyed', -0.5], ['worried', -0.4], ['concerned', -0.3], ['problem', -0.4],
      ['crashing', -0.6], ['crash', -0.6], ['crashes', -0.6], ['issue', -0.3], ['issues', -0.3],
      ['error', -0.4], ['errors', -0.4], ['fail', -0.5], ['failed', -0.5], ['failing', -0.5],
      
      // Neutral/context words
      ['okay', 0.1], ['fine', 0.2], ['normal', 0.0], ['average', 0.0], ['maybe', 0.0],
      ['help', 0.2], ['support', 0.2], ['question', 0.0], ['information', 0.0], ['thanks', 0.4],
      ['computer', 0.0], ['software', 0.0], ['technology', 0.0], ['application', 0.0]
    ]);
  }

  private extractConversationText(conversation: AIConversation): string {
    return conversation.messages
      .filter(m => m.role === 'user') // Focus on user messages for context
      .map(m => m.content)
      .join(' ');
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private tokenizeText(text: string): string[] {
    return text.split(/\s+/).filter(word => word.length > 2);
  }

  private getKeywordWeight(keyword: string): number {
    // Longer keywords get higher weight
    return Math.min(keyword.length / 10, 2);
  }

  private getTopicCategory(topic: string): string {
    // Map topics to broader categories
    const categoryMap: Record<string, string> = {
      'technology': 'tech',
      'business': 'business',
      'health': 'lifestyle',
      'education': 'learning',
      'entertainment': 'entertainment',
      'finance': 'finance',
      'travel': 'lifestyle',
      'food': 'lifestyle',
      'shopping': 'commerce',
      'sports': 'entertainment'
    };
    
    return categoryMap[topic] || 'general';
  }

  private calculateRelevanceScore(category: string, score: number, textLength: number): number {
    // Normalize score by text length and apply category weights
    const categoryWeights: Record<string, number> = {
      'technology': 1.2,
      'business': 1.1,
      'shopping': 1.3,
      'finance': 1.1,
      'default': 1.0
    };
    
    const weight = categoryWeights[category] || categoryWeights.default;
    return Math.min((score / textLength) * weight * 10, 1);
  }

  private getRecentUserMessages(conversation: AIConversation, count: number): AIMessage[] {
    return conversation.messages
      .filter(m => m.role === 'user')
      .slice(-count);
  }

  private isActionableIntent(_intent: IntentCategory, text: string): boolean {
    const actionablePatterns = [
      /\b(buy|purchase|order|subscribe|sign up|download|install)\b/gi,
      /\b(help|support|fix|solve|resolve)\b/gi,
      /\b(find|search|locate|navigate)\b/gi
    ];
    
    return actionablePatterns.some(pattern => pattern.test(text));
  }

  private getSentimentLabel(polarity: number): SentimentLabel {
    if (polarity <= -0.6) return SentimentLabel.VERY_NEGATIVE;
    if (polarity <= -0.2) return SentimentLabel.NEGATIVE;
    if (polarity >= 0.6) return SentimentLabel.VERY_POSITIVE;
    if (polarity >= 0.2) return SentimentLabel.POSITIVE;
    return SentimentLabel.NEUTRAL;
  }

  private hasDecisionIndicators(messages: AIMessage[]): boolean {
    const decisionPatterns = /\b(decide|choose|select|pick|option|alternative|compare)\b/gi;
    return messages.some(m => decisionPatterns.test(m.content));
  }

  private hasConclusionIndicators(messages: AIMessage[]): boolean {
    const conclusionPatterns = /\b(thanks|thank you|goodbye|bye|done|finished|complete)\b/gi;
    return messages.some(m => conclusionPatterns.test(m.content));
  }

  private hasFollowUpIndicators(messages: AIMessage[]): boolean {
    const followUpPatterns = /\b(also|additionally|furthermore|another|more|else)\b/gi;
    return messages.some(m => followUpPatterns.test(m.content));
  }

  private calculateAverageMessageLength(conversation: AIConversation): number {
    const userMessages = conversation.messages.filter(m => m.role === 'user');
    if (userMessages.length === 0) return 0;
    
    const totalLength = userMessages.reduce((sum, m) => sum + m.content.length, 0);
    return totalLength / userMessages.length;
  }

  private calculateAverageResponseTime(conversation: AIConversation): number {
    const messages = conversation.messages;
    if (messages.length < 2) return 0;
    
    let totalTime = 0;
    let intervals = 0;
    
    for (let i = 1; i < messages.length; i++) {
      if (messages[i].role === 'user' && messages[i-1].role === 'assistant') {
        totalTime += messages[i].timestamp.getTime() - messages[i-1].timestamp.getTime();
        intervals++;
      }
    }
    
    return intervals > 0 ? totalTime / intervals : 0;
  }

  private calculateQuestionFrequency(conversation: AIConversation): number {
    const userMessages = conversation.messages.filter(m => m.role === 'user');
    if (userMessages.length === 0) return 0;
    
    const questionCount = userMessages.filter(m => m.content.includes('?')).length;
    return questionCount / userMessages.length;
  }

  private getEngagementTier(score: number): EngagementTier {
    if (score >= 0.8) return EngagementTier.VERY_HIGH;
    if (score >= 0.6) return EngagementTier.HIGH;
    if (score >= 0.4) return EngagementTier.MEDIUM;
    return EngagementTier.LOW;
  }

  private calculateEngagementTrend(conversation: AIConversation, _userContext?: UserContext): EngagementTrend {
    // Simple trend calculation based on recent vs older messages
    const messages = conversation.messages.filter(m => m.role === 'user');
    if (messages.length < 4) return EngagementTrend.STABLE;
    
    const midPoint = Math.floor(messages.length / 2);
    const recentMessages = messages.slice(midPoint);
    const olderMessages = messages.slice(0, midPoint);
    
    const recentAvgLength = recentMessages.reduce((sum, m) => sum + m.content.length, 0) / recentMessages.length;
    const olderAvgLength = olderMessages.reduce((sum, m) => sum + m.content.length, 0) / olderMessages.length;
    
    const lengthRatio = recentAvgLength / olderAvgLength;
    
    if (lengthRatio > 1.2) return EngagementTrend.INCREASING;
    if (lengthRatio < 0.8) return EngagementTrend.DECREASING;
    return EngagementTrend.STABLE;
  }

  private calculateOverallConfidence(topics: Topic[], intent: UserIntent, sentiment: SentimentScore): number {
    const topicConfidence = topics.length > 0 ? topics.reduce((sum, t) => sum + t.confidence, 0) / topics.length : 0;
    const intentConfidence = intent.confidence;
    const sentimentConfidence = sentiment.confidence;
    
    return (topicConfidence + intentConfidence + sentimentConfidence) / 3;
  }

  private mergeTopics(existing: Topic[], newTopics: Topic[]): Topic[] {
    const merged = new Map<string, Topic>();
    
    // Add existing topics with reduced weight
    existing.forEach(topic => {
      merged.set(topic.name, {
        ...topic,
        confidence: topic.confidence * 0.7 // Reduce confidence of older topics
      });
    });
    
    // Add or update with new topics
    newTopics.forEach(topic => {
      const existing = merged.get(topic.name);
      if (existing) {
        merged.set(topic.name, {
          ...topic,
          confidence: (existing.confidence + topic.confidence) / 2,
          keywords: [...new Set([...existing.keywords, ...topic.keywords])]
        });
      } else {
        merged.set(topic.name, topic);
      }
    });
    
    return Array.from(merged.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.config.maxTopicsPerAnalysis);
  }

  private mergeSentiment(existing: SentimentScore, newSentiment: SentimentScore): SentimentScore {
    // Weight recent sentiment more heavily
    const polarity = (existing.polarity * 0.3) + (newSentiment.polarity * 0.7);
    const magnitude = (existing.magnitude * 0.3) + (newSentiment.magnitude * 0.7);
    
    return {
      polarity,
      magnitude,
      label: this.getSentimentLabel(polarity),
      confidence: (existing.confidence + newSentiment.confidence) / 2
    };
  }

  // Default value getters

  private getDefaultContext(): AIContext {
    return {
      topics: [],
      intent: this.getDefaultIntent(),
      sentiment: this.getDefaultSentiment(),
      conversationStage: {
        stage: ConversationPhase.GREETING,
        progress: 0,
        duration: 0,
        messageCount: 0
      },
      userEngagement: this.getDefaultEngagement(),
      confidence: 0,
      extractedAt: new Date()
    };
  }

  private getDefaultIntent(): UserIntent {
    return {
      primary: IntentCategory.INFORMATIONAL,
      confidence: this.config.minIntentConfidence,
      category: IntentCategory.INFORMATIONAL,
      actionable: false
    };
  }

  private getDefaultSentiment(): SentimentScore {
    return {
      polarity: 0,
      magnitude: 0,
      label: SentimentLabel.NEUTRAL,
      confidence: 0
    };
  }

  private getDefaultEngagement(): EngagementLevel {
    return {
      score: 0.5,
      level: EngagementTier.MEDIUM,
      indicators: [],
      trend: EngagementTrend.STABLE
    };
  }
}