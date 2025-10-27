import {
  AIAdapter,
  AdapterIntegrationConfig,
  AIPlatform,
  DeploymentEnvironment,
  AdapterError,
  AdapterErrorType
} from './types';
import {
  AIContext,
  UserContext,
  AIConversation,
  AIMessage,
  Topic,
  UserIntent,
  SentimentScore,
  // ConversationStage,
  // EngagementLevel,
  IntentCategory,
  SentimentLabel,
  ConversationPhase,
  EngagementTier,
  // EngagementType,
  EngagementTrend,
  AdType,
  AdFormat,
  AdPosition
} from '@ai-yuugen/types';
import { AIYuugenSDK } from '../core/sdk';

/**
 * Base implementation for AI platform adapters
 */
export abstract class BaseAIAdapter implements AIAdapter {
  protected config: AdapterIntegrationConfig | null = null;
  protected adSenseSDK: AIYuugenSDK | null = null;
  protected initialized = false;

  abstract readonly platform: AIPlatform;
  abstract readonly environment: DeploymentEnvironment;

  /**
   * Initialize the adapter with configuration
   */
  async initialize(config: AdapterIntegrationConfig): Promise<void> {
    try {
      this.validateConfig(config);
      this.config = config;

      // Initialize AI Ad Yuugen SDK
      this.adSenseSDK = new AIYuugenSDK();
      await this.adSenseSDK.initialize({
        apiKey: config.adSenseConfig.apiKey,
        environment: config.platformConfig.environment,
        baseUrl: config.platformConfig.baseUrl,
        timeout: config.platformConfig.timeout,
        retryAttempts: config.platformConfig.retryAttempts,
        enableAnalytics: config.adSenseConfig.enableAnalytics,
        enablePrivacyMode: config.adSenseConfig.enablePrivacyMode,
        debugMode: config.platformConfig.debugMode
      });

      // Platform-specific initialization
      await this.initializePlatform(config);

      this.initialized = true;

      if (config.platformConfig.debugMode) {
        console.log(`[${this.platform} Adapter] Successfully initialized`);
      }
    } catch (error) {
      throw new AdapterError(
        AdapterErrorType.INITIALIZATION_FAILED,
        this.platform,
        `Failed to initialize ${this.platform} adapter: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ADAPTER_INIT_001',
        { originalError: error, config: this.sanitizeConfig(config) }
      );
    }
  }

  /**
   * Platform-specific initialization (to be implemented by subclasses)
   */
  protected abstract initializePlatform(config: AdapterIntegrationConfig): Promise<void>;

  /**
   * Intercept and process incoming messages
   */
  async interceptMessage(message: any): Promise<any> {
    this.ensureInitialized();

    try {
      // Transform platform message to standard format
      const standardMessage = this.transformToStandardMessage(message);
      
      // Extract context from the message
      const context = this.extractMessageContext(standardMessage);
      
      // Check if we should show an ad
      if (this.shouldShowAd(context)) {
        // Request ad from Ad Yuugen
        const ad = await this.requestAd(context);
        if (ad) {
          // Inject ad into the message flow
          return this.injectAdIntoMessage(message, ad);
        }
      }

      return message;
    } catch (error) {
      if (this.config?.platformConfig.debugMode) {
        console.error(`[${this.platform} Adapter] Error intercepting message:`, error);
      }
      
      // Return original message on error to avoid breaking the conversation
      return message;
    }
  }

  /**
   * Process AI response and potentially inject ads
   */
  async processResponse(response: any, context: AIContext): Promise<any> {
    this.ensureInitialized();

    try {
      // Check if we should show an ad in the response
      if (this.shouldShowAd(context)) {
        const ad = await this.requestAd(context);
        if (ad) {
          return this.injectAd(response, ad);
        }
      }

      return response;
    } catch (error) {
      if (this.config?.platformConfig.debugMode) {
        console.error(`[${this.platform} Adapter] Error processing response:`, error);
      }
      
      // Return original response on error
      return response;
    }
  }

  /**
   * Extract conversation context from platform-specific format
   */
  extractConversationContext(conversation: any): AIContext {
    this.ensureInitialized();

    try {
      // Transform to standard conversation format
      const standardConversation = this.transformToStandardConversation(conversation);
      
      // Use AI Ad Yuugen SDK's context analyzer
      if (this.adSenseSDK) {
        return this.adSenseSDK.analyzeContext(standardConversation);
      }

      // Fallback context extraction
      return this.createFallbackContext(standardConversation);
    } catch (error) {
      throw new AdapterError(
        AdapterErrorType.CONTEXT_EXTRACTION_ERROR,
        this.platform,
        `Failed to extract conversation context: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ADAPTER_CONTEXT_001',
        { originalError: error }
      );
    }
  }

  /**
   * Extract user context from session data
   */
  extractUserContext(session: any): UserContext {
    this.ensureInitialized();

    // Default implementation - can be overridden by platform-specific adapters
    return {
      sessionId: session.id || this.generateSessionId(),
      currentConversation: session.conversationId,
      recentTopics: session.recentTopics || [],
      currentIntent: session.currentIntent,
      engagementLevel: session.engagementLevel || {
        score: 0.5,
        level: EngagementTier.MEDIUM,
        indicators: [],
        trend: EngagementTrend.STABLE
      },
      timeOnPlatform: session.timeOnPlatform || 0,
      interactionCount: session.interactionCount || 0,
      behaviorPatterns: session.behaviorPatterns || []
    };
  }

  /**
   * Determine if an ad should be shown based on context
   */
  shouldShowAd(context: AIContext): boolean {
    if (!this.config?.adSenseConfig.enableContextAnalysis) {
      return false;
    }

    // Basic ad showing logic - can be overridden by platform-specific adapters
    const minConfidence = 0.3;
    const minEngagement = 0.4;

    return (
      context.confidence >= minConfidence &&
      context.userEngagement.score >= minEngagement &&
      context.topics.length > 0
    );
  }

  /**
   * Clean up adapter resources
   */
  destroy(): void {
    if (this.config?.platformConfig.debugMode) {
      console.log(`[${this.platform} Adapter] Destroying adapter instance`);
    }

    this.initialized = false;
    this.config = null;
    
    if (this.adSenseSDK) {
      this.adSenseSDK.destroy();
      this.adSenseSDK = null;
    }
  }

  // Abstract methods to be implemented by platform-specific adapters
  abstract transformToStandardMessage(platformMessage: any): AIMessage;
  abstract transformToStandardConversation(platformConversation: any): AIConversation;
  abstract injectAd(response: any, ad: any): any;
  abstract injectAdIntoMessage(message: any, ad: any): any;

  /**
   * Request an ad from AI Ad Yuugen
   */
  protected async requestAd(context: AIContext): Promise<any> {
    if (!this.adSenseSDK || !this.config) {
      return null;
    }

    try {
      // Use the first placement ID for now
      const placementId = this.config.adSenseConfig.placementIds[0];
      if (!placementId) {
        return null;
      }

      const placement = {
        id: placementId,
        type: AdType.NATIVE,
        format: AdFormat.TEXT,
        size: { width: 300, height: 250 },
        position: AdPosition.INLINE
      };

      return await this.adSenseSDK.requestAd(placement, context);
    } catch (error) {
      if (this.config.platformConfig.debugMode) {
        console.error(`[${this.platform} Adapter] Error requesting ad:`, error);
      }
      return null;
    }
  }

  /**
   * Extract context from a single message
   */
  protected extractMessageContext(message: AIMessage): AIContext {
    // Simple context extraction from a single message
    const topics = this.extractTopicsFromText(message.content);
    const sentiment = this.analyzeSentiment(message.content);
    const intent = this.detectIntent(message.content);

    return {
      topics,
      intent,
      sentiment,
      conversationStage: {
        stage: ConversationPhase.EXPLORATION,
        progress: 0.5,
        duration: 0,
        messageCount: 1
      },
      userEngagement: {
        score: 0.5,
        level: EngagementTier.MEDIUM,
        indicators: [],
        trend: EngagementTrend.STABLE
      },
      confidence: 0.6,
      extractedAt: new Date()
    };
  }

  /**
   * Create fallback context when SDK context analyzer is not available
   */
  protected createFallbackContext(conversation: AIConversation): AIContext {
    const allText = conversation.messages.map(m => m.content).join(' ');
    const topics = this.extractTopicsFromText(allText);
    const sentiment = this.analyzeSentiment(allText);
    const intent = this.detectIntent(allText);

    return {
      topics,
      intent,
      sentiment,
      conversationStage: {
        stage: ConversationPhase.EXPLORATION,
        progress: 0.5,
        duration: Date.now() - conversation.startTime.getTime(),
        messageCount: conversation.messages.length
      },
      userEngagement: {
        score: Math.min(conversation.messages.length / 10, 1),
        level: conversation.messages.length > 5 ? EngagementTier.HIGH : EngagementTier.MEDIUM,
        indicators: [],
        trend: EngagementTrend.STABLE
      },
      confidence: 0.5,
      extractedAt: new Date()
    };
  }

  /**
   * Simple topic extraction from text
   */
  protected extractTopicsFromText(text: string): Topic[] {
    const keywords = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const topicMap = new Map<string, number>();

    keywords.forEach(keyword => {
      topicMap.set(keyword, (topicMap.get(keyword) || 0) + 1);
    });

    return Array.from(topicMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        category: 'general',
        confidence: Math.min(count / keywords.length * 2, 1),
        keywords: [name],
        relevanceScore: Math.min(count / keywords.length * 2, 1)
      }));
  }

  /**
   * Simple sentiment analysis
   */
  protected analyzeSentiment(text: string): SentimentScore {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'happy', 'pleased'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'sad', 'angry', 'frustrated', 'disappointed'];

    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });

    const totalSentimentWords = positiveCount + negativeCount;
    const polarity = totalSentimentWords > 0 ? (positiveCount - negativeCount) / totalSentimentWords : 0;
    const magnitude = totalSentimentWords / words.length;

    let label: SentimentLabel;
    if (polarity > 0.5) label = SentimentLabel.VERY_POSITIVE;
    else if (polarity > 0.1) label = SentimentLabel.POSITIVE;
    else if (polarity < -0.5) label = SentimentLabel.VERY_NEGATIVE;
    else if (polarity < -0.1) label = SentimentLabel.NEGATIVE;
    else label = SentimentLabel.NEUTRAL;

    return {
      polarity,
      magnitude,
      label,
      confidence: Math.min(magnitude * 2, 1)
    };
  }

  /**
   * Simple intent detection
   */
  protected detectIntent(text: string): UserIntent {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('buy') || lowerText.includes('purchase') || lowerText.includes('order')) {
      return {
        primary: 'purchase',
        confidence: 0.8,
        category: IntentCategory.TRANSACTIONAL,
        actionable: true
      };
    }
    
    if (lowerText.includes('how') || lowerText.includes('what') || lowerText.includes('why') || lowerText.includes('?')) {
      return {
        primary: 'information_seeking',
        confidence: 0.7,
        category: IntentCategory.INFORMATIONAL,
        actionable: true
      };
    }
    
    if (lowerText.includes('help') || lowerText.includes('support') || lowerText.includes('problem')) {
      return {
        primary: 'support',
        confidence: 0.8,
        category: IntentCategory.SUPPORT,
        actionable: true
      };
    }

    return {
      primary: 'general',
      confidence: 0.5,
      category: IntentCategory.INFORMATIONAL,
      actionable: false
    };
  }

  /**
   * Generate a unique session ID
   */
  protected generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate adapter configuration
   */
  protected validateConfig(config: AdapterIntegrationConfig): void {
    if (!config.adSenseConfig?.apiKey) {
      throw new Error('Ad Yuugen API key is required');
    }

    if (!config.platformConfig?.apiKey) {
      throw new Error('Platform API key is required');
    }

    if (!config.adSenseConfig?.placementIds?.length) {
      throw new Error('At least one placement ID is required');
    }
  }

  /**
   * Sanitize config for logging (remove sensitive data)
   */
  protected sanitizeConfig(config: AdapterIntegrationConfig): any {
    const sanitized = JSON.parse(JSON.stringify(config));
    
    if (sanitized.adSenseConfig?.apiKey) {
      sanitized.adSenseConfig.apiKey = '***';
    }
    
    if (sanitized.platformConfig?.apiKey) {
      sanitized.platformConfig.apiKey = '***';
    }

    return sanitized;
  }

  /**
   * Ensure adapter is initialized
   */
  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new AdapterError(
        AdapterErrorType.INITIALIZATION_FAILED,
        this.platform,
        'Adapter must be initialized before use',
        'ADAPTER_NOT_INIT_001'
      );
    }
  }
}