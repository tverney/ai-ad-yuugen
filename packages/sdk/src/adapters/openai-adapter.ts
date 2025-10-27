import { BaseAIAdapter } from './base-adapter';
import {
  AIPlatform,
  DeploymentEnvironment,
  AdapterIntegrationConfig,
  OpenAIAdapterConfig,
  OpenAIMessage,
  OpenAIConversation,
  OpenAIResponse,
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
 * OpenAI API adapter for AI Ad Yuugen integration
 */
export class OpenAIAdapter extends BaseAIAdapter {
  readonly platform = AIPlatform.OPENAI;
  readonly environment: DeploymentEnvironment;

  private openAIConfig: OpenAIAdapterConfig | null = null;

  constructor(environment: DeploymentEnvironment = DeploymentEnvironment.CLIENT_SIDE) {
    super();
    this.environment = environment;
  }

  /**
   * Initialize OpenAI-specific configuration
   */
  protected async initializePlatform(config: AdapterIntegrationConfig): Promise<void> {
    this.openAIConfig = config.platformConfig as OpenAIAdapterConfig;

    // Validate OpenAI API key format
    if (!this.openAIConfig.apiKey.startsWith('sk-')) {
      throw new AdapterError(
        AdapterErrorType.AUTHENTICATION_ERROR,
        this.platform,
        'Invalid OpenAI API key format. API key should start with "sk-"',
        'OPENAI_AUTH_001'
      );
    }

    // Test API connection
    await this.testConnection();
  }

  /**
   * Test OpenAI API connection
   */
  private async testConnection(): Promise<void> {
    if (!this.openAIConfig) {
      throw new Error('OpenAI config not initialized');
    }

    try {
      const baseUrl = this.openAIConfig.baseUrl || 'https://api.openai.com/v1';
      const response = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.openAIConfig.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new AdapterError(
          AdapterErrorType.AUTHENTICATION_ERROR,
          this.platform,
          `OpenAI API authentication failed: ${response.status} ${response.statusText}`,
          'OPENAI_AUTH_002',
          { status: response.status, statusText: response.statusText }
        );
      }

      if (this.config?.platformConfig.debugMode) {
        console.log('[OpenAI Adapter] API connection test successful');
      }
    } catch (error) {
      if (error instanceof AdapterError) {
        throw error;
      }

      throw new AdapterError(
        AdapterErrorType.NETWORK_ERROR,
        this.platform,
        `Failed to connect to OpenAI API: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'OPENAI_NETWORK_001',
        { originalError: error }
      );
    }
  }

  /**
   * Transform OpenAI message to standard format
   */
  transformToStandardMessage(platformMessage: OpenAIMessage): AIMessage {
    return {
      id: `openai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: platformMessage.role === 'assistant' ? 'assistant' : 
            platformMessage.role === 'system' ? 'system' : 'user',
      content: platformMessage.content,
      timestamp: new Date(),
      metadata: {
        platform: 'openai',
        originalRole: platformMessage.role,
        name: platformMessage.name
      }
    };
  }

  /**
   * Transform OpenAI conversation to standard format
   */
  transformToStandardConversation(platformConversation: OpenAIConversation): AIConversation {
    const messages = platformConversation.messages.map(msg => this.transformToStandardMessage(msg));
    
    return {
      id: `openai_conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
   * Inject ad into OpenAI response
   */
  injectAd(response: OpenAIResponse, ad: AdContent): OpenAIResponse {
    try {
      const modifiedResponse = JSON.parse(JSON.stringify(response));
      
      // Create ad message content
      const adMessage = this.formatAdForOpenAI(ad);
      
      // Inject ad into the first choice's message
      if (modifiedResponse.choices && modifiedResponse.choices.length > 0) {
        const originalContent = modifiedResponse.choices[0].message.content;
        modifiedResponse.choices[0].message.content = `${originalContent}\n\n${adMessage}`;
        
        // Add metadata to indicate ad injection
        if (!modifiedResponse.choices[0].message.metadata) {
          modifiedResponse.choices[0].message.metadata = {};
        }
        modifiedResponse.choices[0].message.metadata.adInjected = true;
        modifiedResponse.choices[0].message.metadata.adId = ad.id;
      }

      return modifiedResponse;
    } catch (error) {
      throw new AdapterError(
        AdapterErrorType.AD_INJECTION_ERROR,
        this.platform,
        `Failed to inject ad into OpenAI response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'OPENAI_AD_001',
        { originalError: error, adId: ad.id }
      );
    }
  }

  /**
   * Inject ad into OpenAI message
   */
  injectAdIntoMessage(message: OpenAIMessage, ad: AdContent): OpenAIMessage {
    try {
      const modifiedMessage = JSON.parse(JSON.stringify(message));
      const adMessage = this.formatAdForOpenAI(ad);
      
      // Append ad to message content
      modifiedMessage.content = `${modifiedMessage.content}\n\n${adMessage}`;
      
      return modifiedMessage;
    } catch (error) {
      throw new AdapterError(
        AdapterErrorType.AD_INJECTION_ERROR,
        this.platform,
        `Failed to inject ad into OpenAI message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'OPENAI_AD_002',
        { originalError: error, adId: ad.id }
      );
    }
  }

  /**
   * Format ad content for OpenAI display
   */
  private formatAdForOpenAI(ad: AdContent): string {
    return `---
📢 **${ad.title}**
${ad.description}

${ad.ctaText}: ${ad.landingUrl}
*Sponsored by ${ad.brandName}*
---`;
  }

  /**
   * Create middleware for Express.js server-side integration
   */
  static createExpressMiddleware(config: AdapterIntegrationConfig) {
    const adapter = new OpenAIAdapter(DeploymentEnvironment.SERVER_SIDE);
    
    return async (req: any, res: any, next: any) => {
      try {
        if (!adapter.initialized) {
          await adapter.initialize(config);
        }

        // Intercept OpenAI API requests
        if (req.path.includes('/chat/completions') && req.method === 'POST') {
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
          console.error('[OpenAI Adapter] Middleware error:', error);
        }
        next(); // Continue without ad injection on error
      }
    };
  }

  /**
   * Create response interceptor for server-side integration
   */
  static createResponseInterceptor(config: AdapterIntegrationConfig) {
    const adapter = new OpenAIAdapter(DeploymentEnvironment.SERVER_SIDE);
    
    return async (req: any, res: any, next: any) => {
      try {
        if (!adapter.initialized) {
          await adapter.initialize(config);
        }

        // Intercept OpenAI API responses
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
              console.error('[OpenAI Adapter] Response interceptor error:', error);
            }
          }
          
          return originalSend.call(this, body);
        };

        next();
      } catch (error) {
        if (config.platformConfig.debugMode) {
          console.error('[OpenAI Adapter] Response interceptor setup error:', error);
        }
        next();
      }
    };
  }

  /**
   * Create client-side wrapper for OpenAI SDK
   */
  static createClientWrapper(config: AdapterIntegrationConfig) {
    const adapter = new OpenAIAdapter(DeploymentEnvironment.CLIENT_SIDE);
    
    return {
      async initialize() {
        await adapter.initialize(config);
      },

      async chat(messages: OpenAIMessage[], options: any = {}) {
        try {
          const conversation: OpenAIConversation = {
            messages,
            model: options.model || 'gpt-3.5-turbo',
            max_tokens: options.max_tokens,
            temperature: options.temperature,
            stream: options.stream
          };

          const context = adapter.extractConversationContext(conversation);
          const modifiedConversation = await adapter.interceptMessage(conversation);
          
          // Make actual OpenAI API call (this would be replaced with actual OpenAI SDK call)
          const response = await this.callOpenAI(modifiedConversation);
          
          // Process response with ad injection
          return await adapter.processResponse(response, context);
        } catch (error) {
          if (config.platformConfig.debugMode) {
            console.error('[OpenAI Adapter] Client wrapper error:', error);
          }
          throw error;
        }
      },

      async callOpenAI(conversation: OpenAIConversation): Promise<OpenAIResponse> {
        const openAIConfig = config.platformConfig as OpenAIAdapterConfig;
        const baseUrl = openAIConfig.baseUrl || 'https://api.openai.com/v1';
        
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIConfig.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(conversation)
        });

        if (!response.ok) {
          throw new AdapterError(
            AdapterErrorType.PLATFORM_ERROR,
            AIPlatform.OPENAI,
            `OpenAI API error: ${response.status} ${response.statusText}`,
            'OPENAI_API_001',
            { status: response.status, statusText: response.statusText }
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
   * Override shouldShowAd for OpenAI-specific logic
   */
  shouldShowAd(context: any): boolean {
    // Don't show ads in system messages or very short conversations
    if (context.conversationStage?.messageCount < 2) {
      return false;
    }

    // Don't show ads if the conversation is about sensitive topics
    const sensitiveTopics = ['medical', 'legal', 'financial', 'personal'];
    const hasSensitiveTopic = context.topics?.some((topic: any) => 
      sensitiveTopics.some(sensitive => topic.name.toLowerCase().includes(sensitive))
    );

    if (hasSensitiveTopic) {
      return false;
    }

    return super.shouldShowAd(context);
  }
}