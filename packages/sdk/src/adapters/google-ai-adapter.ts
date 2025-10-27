import { BaseAIAdapter } from './base-adapter';
import {
  AIPlatform,
  DeploymentEnvironment,
  AdapterIntegrationConfig,
  GoogleAIAdapterConfig,
  GoogleAIMessage,
  GoogleAIConversation,
  GoogleAIResponse,
  AdapterError,
  AdapterErrorType
} from './types';
import {
  AIMessage,
  AIConversation,
  AdContent,
  IntentCategory,
  FormalityLevel,
  ComplexityLevel,
  UrgencyLevel
} from '@ai-yuugen/types';

/**
 * Google AI (Gemini) API adapter for AI Ad Yuugen integration
 */
export class GoogleAIAdapter extends BaseAIAdapter {
  readonly platform = AIPlatform.GOOGLE_AI;
  readonly environment: DeploymentEnvironment;

  private googleAIConfig: GoogleAIAdapterConfig | null = null;

  constructor(environment: DeploymentEnvironment = DeploymentEnvironment.CLIENT_SIDE) {
    super();
    this.environment = environment;
  }

  /**
   * Initialize Google AI-specific configuration
   */
  protected async initializePlatform(config: AdapterIntegrationConfig): Promise<void> {
    this.googleAIConfig = config.platformConfig as GoogleAIAdapterConfig;

    // Validate Google AI API key format
    if (!this.googleAIConfig.apiKey || this.googleAIConfig.apiKey.length < 20) {
      throw new AdapterError(
        AdapterErrorType.AUTHENTICATION_ERROR,
        this.platform,
        'Invalid Google AI API key format. Please provide a valid API key.',
        'GOOGLE_AI_AUTH_001'
      );
    }

    // Test API connection
    await this.testConnection();
  }

  /**
   * Test Google AI API connection
   */
  private async testConnection(): Promise<void> {
    if (!this.googleAIConfig) {
      throw new Error('Google AI config not initialized');
    }

    try {
      const baseUrl = this.googleAIConfig.baseUrl || 'https://generativelanguage.googleapis.com';
      const model = this.googleAIConfig.model || 'gemini-pro';
      
      // Test with a minimal request to verify API access
      const testPayload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Hi' }]
          }
        ],
        generationConfig: {
          maxOutputTokens: 10
        }
      };

      const response = await fetch(`${baseUrl}/v1/models/${model}:generateContent?key=${this.googleAIConfig.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AdapterError(
          AdapterErrorType.AUTHENTICATION_ERROR,
          this.platform,
          `Google AI API authentication failed: ${response.status} ${response.statusText}`,
          'GOOGLE_AI_AUTH_002',
          { status: response.status, statusText: response.statusText, error: errorData }
        );
      }

      if (this.config?.platformConfig.debugMode) {
        console.log('[Google AI Adapter] API connection test successful');
      }
    } catch (error) {
      if (error instanceof AdapterError) {
        throw error;
      }

      throw new AdapterError(
        AdapterErrorType.NETWORK_ERROR,
        this.platform,
        `Failed to connect to Google AI API: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GOOGLE_AI_NETWORK_001',
        { originalError: error }
      );
    }
  }

  /**
   * Transform Google AI message to standard format
   */
  transformToStandardMessage(platformMessage: GoogleAIMessage): AIMessage {
    const content = platformMessage.parts.map(part => part.text).join(' ');
    
    return {
      id: `google_ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: platformMessage.role === 'model' ? 'assistant' : 'user',
      content,
      timestamp: new Date(),
      metadata: {
        platform: 'google_ai',
        originalRole: platformMessage.role,
        parts: platformMessage.parts
      }
    };
  }

  /**
   * Transform Google AI conversation to standard format
   */
  transformToStandardConversation(platformConversation: GoogleAIConversation): AIConversation {
    const messages = platformConversation.contents.map(msg => this.transformToStandardMessage(msg));
    
    return {
      id: `google_ai_conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      messages,
      topics: [], // Will be populated by context analyzer
      intent: {
        primary: 'general',
        confidence: 0.5,
        category: IntentCategory.INFORMATIONAL,
        actionable: false
      },
      startTime: new Date(Date.now() - (messages.length * 30000)), // Estimate start time
      lastActivity: new Date(),
      context: {
        domain: 'general',
        language: 'en',
        formality: FormalityLevel.NEUTRAL,
        complexity: ComplexityLevel.MODERATE,
        urgency: UrgencyLevel.MEDIUM
      }
    };
  }

  /**
   * Inject ad into Google AI response
   */
  injectAd(response: GoogleAIResponse, ad: AdContent): GoogleAIResponse {
    try {
      const modifiedResponse = JSON.parse(JSON.stringify(response));
      
      // Create ad message content
      const adMessage = this.formatAdForGoogleAI(ad);
      
      // Inject ad into the first candidate's content
      if (modifiedResponse.candidates && modifiedResponse.candidates.length > 0) {
        const candidate = modifiedResponse.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          const originalText = candidate.content.parts[0].text;
          candidate.content.parts[0].text = `${originalText}\n\n${adMessage}`;
          
          // Add metadata to indicate ad injection
          if (!candidate.metadata) {
            candidate.metadata = {};
          }
          candidate.metadata.adInjected = true;
          candidate.metadata.adId = ad.id;
        }
      }

      return modifiedResponse;
    } catch (error) {
      throw new AdapterError(
        AdapterErrorType.AD_INJECTION_ERROR,
        this.platform,
        `Failed to inject ad into Google AI response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GOOGLE_AI_AD_001',
        { originalError: error, adId: ad.id }
      );
    }
  }

  /**
   * Inject ad into Google AI message
   */
  injectAdIntoMessage(message: GoogleAIMessage, ad: AdContent): GoogleAIMessage {
    try {
      const modifiedMessage = JSON.parse(JSON.stringify(message));
      const adMessage = this.formatAdForGoogleAI(ad);
      
      // Append ad to the first part's text
      if (modifiedMessage.parts && modifiedMessage.parts.length > 0) {
        modifiedMessage.parts[0].text = `${modifiedMessage.parts[0].text}\n\n${adMessage}`;
      } else {
        modifiedMessage.parts = [{ text: adMessage }];
      }
      
      return modifiedMessage;
    } catch (error) {
      throw new AdapterError(
        AdapterErrorType.AD_INJECTION_ERROR,
        this.platform,
        `Failed to inject ad into Google AI message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GOOGLE_AI_AD_002',
        { originalError: error, adId: ad.id }
      );
    }
  }

  /**
   * Format ad content for Google AI display
   */
  private formatAdForGoogleAI(ad: AdContent): string {
    return `---
🚀 **${ad.title}**

${ad.description}

👉 ${ad.ctaText}: ${ad.landingUrl}

*Sponsored content by ${ad.brandName}*
---`;
  }

  /**
   * Create middleware for Express.js server-side integration
   */
  static createExpressMiddleware(config: AdapterIntegrationConfig) {
    const adapter = new GoogleAIAdapter(DeploymentEnvironment.SERVER_SIDE);
    
    return async (req: any, res: any, next: any) => {
      try {
        if (!adapter.initialized) {
          await adapter.initialize(config);
        }

        // Intercept Google AI API requests
        if (req.path.includes('generateContent') && req.method === 'POST') {
          const originalBody = req.body;
          const context = adapter.extractConversationContext(originalBody);
          
          // Store context for response processing
          req.adSenseContext = context;
          
          // Modify request if needed
          req.body = await adapter.interceptMessage(originalBody);
        }

        next();
      } catch (error) {
        if (config.platformConfig.debugMode) {
          console.error('[Google AI Adapter] Middleware error:', error);
        }
        next(); // Continue without ad injection on error
      }
    };
  }

  /**
   * Create response interceptor for server-side integration
   */
  static createResponseInterceptor(config: AdapterIntegrationConfig) {
    const adapter = new GoogleAIAdapter(DeploymentEnvironment.SERVER_SIDE);
    
    return async (req: any, res: any, next: any) => {
      try {
        if (!adapter.initialized) {
          await adapter.initialize(config);
        }

        // Intercept Google AI API responses
        const originalSend = res.send;
        res.send = async function(body: any) {
          try {
            if (req.adSenseContext && typeof body === 'string') {
              const responseData = JSON.parse(body);
              const modifiedResponse = await adapter.processResponse(responseData, req.adSenseContext);
              return originalSend.call(this, JSON.stringify(modifiedResponse));
            }
          } catch (error) {
            if (config.platformConfig.debugMode) {
              console.error('[Google AI Adapter] Response interceptor error:', error);
            }
          }
          
          return originalSend.call(this, body);
        };

        next();
      } catch (error) {
        if (config.platformConfig.debugMode) {
          console.error('[Google AI Adapter] Response interceptor setup error:', error);
        }
        next();
      }
    };
  }

  /**
   * Create client-side wrapper for Google AI SDK
   */
  static createClientWrapper(config: AdapterIntegrationConfig) {
    const adapter = new GoogleAIAdapter(DeploymentEnvironment.CLIENT_SIDE);
    
    return {
      async initialize() {
        await adapter.initialize(config);
      },

      async generateContent(contents: GoogleAIMessage[], options: any = {}) {
        try {
          const conversation: GoogleAIConversation = {
            contents,
            generationConfig: {
              maxOutputTokens: options.maxOutputTokens,
              temperature: options.temperature,
              topP: options.topP
            }
          };

          const context = adapter.extractConversationContext(conversation);
          const modifiedConversation = await adapter.interceptMessage(conversation);
          
          // Make actual Google AI API call
          const response = await this.callGoogleAI(modifiedConversation);
          
          // Process response with ad injection
          return await adapter.processResponse(response, context);
        } catch (error) {
          if (config.platformConfig.debugMode) {
            console.error('[Google AI Adapter] Client wrapper error:', error);
          }
          throw error;
        }
      },

      async callGoogleAI(conversation: GoogleAIConversation): Promise<GoogleAIResponse> {
        const googleAIConfig = config.platformConfig as GoogleAIAdapterConfig;
        const baseUrl = googleAIConfig.baseUrl || 'https://generativelanguage.googleapis.com';
        const model = googleAIConfig.model || 'gemini-pro';
        
        const response = await fetch(`${baseUrl}/v1/models/${model}:generateContent?key=${googleAIConfig.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(conversation)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new AdapterError(
            AdapterErrorType.PLATFORM_ERROR,
            AIPlatform.GOOGLE_AI,
            `Google AI API error: ${response.status} ${response.statusText}`,
            'GOOGLE_AI_API_001',
            { status: response.status, statusText: response.statusText, error: errorData }
          );
        }

        return await response.json();
      },

      destroy() {
        adapter.destroy();
      }
    };
  }

  /**
   * Create Cloud Functions handler for serverless integration
   */
  static createCloudFunctionHandler(config: AdapterIntegrationConfig) {
    const adapter = new GoogleAIAdapter(DeploymentEnvironment.SERVERLESS);
    
    return async (req: any, res: any) => {
      try {
        if (!adapter.initialized) {
          await adapter.initialize(config);
        }

        const requestData = req.body;
        
        // Extract conversation context
        const context = adapter.extractConversationContext(requestData);
        
        // Process the request and potentially inject ads
        const processedData = await adapter.processResponse(requestData, context);
        
        res.json(processedData);
      } catch (error) {
        if (config.platformConfig.debugMode) {
          console.error('[Google AI Adapter] Cloud Function handler error:', error);
        }
        
        // Return original data on error
        res.status(500).json({ error: 'Internal server error' });
      }
    };
  }

  /**
   * Create Firebase Functions integration
   */
  static createFirebaseFunctionHandler(config: AdapterIntegrationConfig) {
    const adapter = new GoogleAIAdapter(DeploymentEnvironment.SERVERLESS);
    
    return async (data: any, context: any) => {
      try {
        if (!adapter.initialized) {
          await adapter.initialize(config);
        }

        // Extract conversation context from Firebase function data
        const aiContext = adapter.extractConversationContext(data);
        
        // Process the data and potentially inject ads
        const processedData = await adapter.processResponse(data, aiContext);
        
        return processedData;
      } catch (error) {
        if (config.platformConfig.debugMode) {
          console.error('[Google AI Adapter] Firebase Function handler error:', error);
        }
        
        // Return original data on error
        return data;
      }
    };
  }

  /**
   * Override shouldShowAd for Google AI-specific logic
   */
  shouldShowAd(context: any): boolean {
    // Google AI (Gemini) is often used for complex reasoning tasks
    // Be more conservative with ad placement
    if (context.conversationStage?.messageCount < 2) {
      return false;
    }

    // Don't show ads for technical or educational content
    const technicalTopics = ['code', 'programming', 'technical', 'education', 'learning', 'tutorial'];
    const hasTechnicalTopic = context.topics?.some((topic: any) => 
      technicalTopics.some(tech => topic.name.toLowerCase().includes(tech))
    );

    if (hasTechnicalTopic && context.userEngagement?.score > 0.6) {
      return false; // High engagement technical content shouldn't be interrupted
    }

    // Consider conversation complexity
    if (context.conversationContext?.complexity === 'very_complex') {
      return false;
    }

    return super.shouldShowAd(context);
  }

  /**
   * Create streaming response handler for Google AI
   */
  static createStreamHandler(config: AdapterIntegrationConfig) {
    const adapter = new GoogleAIAdapter(DeploymentEnvironment.SERVER_SIDE);
    
    return async function* (stream: AsyncIterable<any>) {
      try {
        if (!adapter.initialized) {
          await adapter.initialize(config);
        }

        let contentBuffer = '';
        let shouldInjectAd = false;
        let adContent: AdContent | null = null;

        for await (const chunk of stream) {
          // Buffer the streaming content
          if (chunk.candidates && chunk.candidates[0]?.content?.parts?.[0]?.text) {
            contentBuffer += chunk.candidates[0].content.parts[0].text;
          }

          // Check if we should inject an ad after sufficient content
          if (!shouldInjectAd && contentBuffer.length > 300) {
            const context = adapter.extractMessageContext({
              id: 'stream',
              role: 'assistant',
              content: contentBuffer,
              timestamp: new Date()
            });

            if (adapter.shouldShowAd(context)) {
              shouldInjectAd = true;
              adContent = await adapter.requestAd(context) as AdContent;
            }
          }

          yield chunk;

          // Inject ad at natural break points
          if (shouldInjectAd && adContent && chunk.candidates?.[0]?.finishReason) {
            const adMessage = adapter.formatAdForGoogleAI(adContent);
            yield {
              candidates: [{
                content: {
                  role: 'model',
                  parts: [{ text: `\n\n${adMessage}` }]
                },
                finishReason: 'STOP',
                index: 0
              }]
            };
            shouldInjectAd = false;
          }
        }
      } catch (error) {
        if (config.platformConfig.debugMode) {
          console.error('[Google AI Adapter] Stream handler error:', error);
        }
        // Continue streaming without ads on error
        for await (const chunk of stream) {
          yield chunk;
        }
      }
    };
  }

  /**
   * Create Vertex AI integration for enterprise deployments
   */
  static createVertexAIHandler(config: AdapterIntegrationConfig) {
    const adapter = new GoogleAIAdapter(DeploymentEnvironment.SERVER_SIDE);
    
    return {
      async initialize() {
        await adapter.initialize(config);
      },

      async predict(instances: any[], parameters: any = {}) {
        try {
          // Transform Vertex AI format to standard conversation format
          const conversation = this.transformVertexAIToConversation(instances);
          const context = adapter.extractConversationContext(conversation);
          
          // Make prediction with ad injection
          const modifiedInstances = await adapter.interceptMessage(instances);
          
          // This would integrate with actual Vertex AI prediction
          // For now, return processed instances
          return await adapter.processResponse(modifiedInstances, context);
        } catch (error) {
          if (config.platformConfig.debugMode) {
            console.error('[Google AI Adapter] Vertex AI handler error:', error);
          }
          throw error;
        }
      },

      transformVertexAIToConversation(instances: any[]): GoogleAIConversation {
        // Transform Vertex AI instances to Google AI conversation format
        const contents = instances.map(instance => ({
          role: 'user' as const,
          parts: [{ text: instance.content || instance.prompt || '' }]
        }));

        return { contents };
      },

      destroy() {
        adapter.destroy();
      }
    };
  }
}