import { BaseAIAdapter } from './base-adapter';
import {
  AIPlatform,
  DeploymentEnvironment,
  AdapterIntegrationConfig,
  AnthropicAdapterConfig,
  AnthropicMessage,
  AnthropicConversation,
  AnthropicResponse,
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
 * Anthropic Claude API adapter for AI Ad Yuugen integration
 */
export class AnthropicAdapter extends BaseAIAdapter {
  readonly platform = AIPlatform.ANTHROPIC;
  readonly environment: DeploymentEnvironment;

  private anthropicConfig: AnthropicAdapterConfig | null = null;

  constructor(environment: DeploymentEnvironment = DeploymentEnvironment.CLIENT_SIDE) {
    super();
    this.environment = environment;
  }

  /**
   * Initialize Anthropic-specific configuration
   */
  protected async initializePlatform(config: AdapterIntegrationConfig): Promise<void> {
    this.anthropicConfig = config.platformConfig as AnthropicAdapterConfig;

    // Validate Anthropic API key format
    if (!this.anthropicConfig.apiKey.startsWith('sk-ant-')) {
      throw new AdapterError(
        AdapterErrorType.AUTHENTICATION_ERROR,
        this.platform,
        'Invalid Anthropic API key format. API key should start with "sk-ant-"',
        'ANTHROPIC_AUTH_001'
      );
    }

    // Test API connection
    await this.testConnection();
  }

  /**
   * Test Anthropic API connection
   */
  private async testConnection(): Promise<void> {
    if (!this.anthropicConfig) {
      throw new Error('Anthropic config not initialized');
    }

    try {
      const baseUrl = this.anthropicConfig.baseUrl || 'https://api.anthropic.com';
      
      // Test with a minimal message to verify API access
      const testPayload = {
        model: this.anthropicConfig.model || 'claude-3-sonnet-20240229',
        max_tokens: 10,
        messages: [
          { role: 'user', content: 'Hi' }
        ]
      };

      const response = await fetch(`${baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.anthropicConfig.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(testPayload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AdapterError(
          AdapterErrorType.AUTHENTICATION_ERROR,
          this.platform,
          `Anthropic API authentication failed: ${response.status} ${response.statusText}`,
          'ANTHROPIC_AUTH_002',
          { status: response.status, statusText: response.statusText, error: errorData }
        );
      }

      if (this.config?.platformConfig.debugMode) {
        console.log('[Anthropic Adapter] API connection test successful');
      }
    } catch (error) {
      if (error instanceof AdapterError) {
        throw error;
      }

      throw new AdapterError(
        AdapterErrorType.NETWORK_ERROR,
        this.platform,
        `Failed to connect to Anthropic API: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ANTHROPIC_NETWORK_001',
        { originalError: error }
      );
    }
  }

  /**
   * Transform Anthropic message to standard format
   */
  transformToStandardMessage(platformMessage: AnthropicMessage): AIMessage {
    return {
      id: `anthropic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: platformMessage.role === 'assistant' ? 'assistant' : 'user',
      content: platformMessage.content,
      timestamp: new Date(),
      metadata: {
        platform: 'anthropic',
        originalRole: platformMessage.role
      }
    };
  }

  /**
   * Transform Anthropic conversation to standard format
   */
  transformToStandardConversation(platformConversation: AnthropicConversation): AIConversation {
    const messages = platformConversation.messages.map(msg => this.transformToStandardMessage(msg));
    
    return {
      id: `anthropic_conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
   * Inject ad into Anthropic response
   */
  injectAd(response: AnthropicResponse, ad: AdContent): AnthropicResponse {
    try {
      const modifiedResponse = JSON.parse(JSON.stringify(response));
      
      // Create ad message content
      const adMessage = this.formatAdForAnthropic(ad);
      
      // Inject ad into the response content
      if (modifiedResponse.content && modifiedResponse.content.length > 0) {
        const originalText = modifiedResponse.content[0].text;
        modifiedResponse.content[0].text = `${originalText}\n\n${adMessage}`;
        
        // Add metadata to indicate ad injection
        if (!modifiedResponse.metadata) {
          modifiedResponse.metadata = {};
        }
        modifiedResponse.metadata.adInjected = true;
        modifiedResponse.metadata.adId = ad.id;
      }

      return modifiedResponse;
    } catch (error) {
      throw new AdapterError(
        AdapterErrorType.AD_INJECTION_ERROR,
        this.platform,
        `Failed to inject ad into Anthropic response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ANTHROPIC_AD_001',
        { originalError: error, adId: ad.id }
      );
    }
  }

  /**
   * Inject ad into Anthropic message
   */
  injectAdIntoMessage(message: AnthropicMessage, ad: AdContent): AnthropicMessage {
    try {
      const modifiedMessage = JSON.parse(JSON.stringify(message));
      const adMessage = this.formatAdForAnthropic(ad);
      
      // Append ad to message content
      modifiedMessage.content = `${modifiedMessage.content}\n\n${adMessage}`;
      
      return modifiedMessage;
    } catch (error) {
      throw new AdapterError(
        AdapterErrorType.AD_INJECTION_ERROR,
        this.platform,
        `Failed to inject ad into Anthropic message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ANTHROPIC_AD_002',
        { originalError: error, adId: ad.id }
      );
    }
  }

  /**
   * Format ad content for Anthropic display
   */
  private formatAdForAnthropic(ad: AdContent): string {
    return `---
🎯 **${ad.title}**

${ad.description}

[${ad.ctaText}](${ad.landingUrl})

*Advertisement by ${ad.brandName}*
---`;
  }

  /**
   * Create middleware for Express.js server-side integration
   */
  static createExpressMiddleware(config: AdapterIntegrationConfig) {
    const adapter = new AnthropicAdapter(DeploymentEnvironment.SERVER_SIDE);
    
    return async (req: any, res: any, next: any) => {
      try {
        if (!adapter.initialized) {
          await adapter.initialize(config);
        }

        // Intercept Anthropic API requests
        if (req.path.includes('/v1/messages') && req.method === 'POST') {
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
          console.error('[Anthropic Adapter] Middleware error:', error);
        }
        next(); // Continue without ad injection on error
      }
    };
  }

  /**
   * Create response interceptor for server-side integration
   */
  static createResponseInterceptor(config: AdapterIntegrationConfig) {
    const adapter = new AnthropicAdapter(DeploymentEnvironment.SERVER_SIDE);
    
    return async (req: any, res: any, next: any) => {
      try {
        if (!adapter.initialized) {
          await adapter.initialize(config);
        }

        // Intercept Anthropic API responses
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
              console.error('[Anthropic Adapter] Response interceptor error:', error);
            }
          }
          
          return originalSend.call(this, body);
        };

        next();
      } catch (error) {
        if (config.platformConfig.debugMode) {
          console.error('[Anthropic Adapter] Response interceptor setup error:', error);
        }
        next();
      }
    };
  }

  /**
   * Create client-side wrapper for Anthropic SDK
   */
  static createClientWrapper(config: AdapterIntegrationConfig) {
    const adapter = new AnthropicAdapter(DeploymentEnvironment.CLIENT_SIDE);
    
    return {
      async initialize() {
        await adapter.initialize(config);
      },

      async messages(messages: AnthropicMessage[], options: any = {}) {
        try {
          const conversation: AnthropicConversation = {
            model: options.model || 'claude-3-sonnet-20240229',
            messages,
            max_tokens: options.max_tokens || 1000,
            temperature: options.temperature,
            top_p: options.top_p,
            stream: options.stream
          };

          const context = adapter.extractConversationContext(conversation);
          const modifiedConversation = await adapter.interceptMessage(conversation);
          
          // Make actual Anthropic API call
          const response = await this.callAnthropic(modifiedConversation);
          
          // Process response with ad injection
          return await adapter.processResponse(response, context);
        } catch (error) {
          if (config.platformConfig.debugMode) {
            console.error('[Anthropic Adapter] Client wrapper error:', error);
          }
          throw error;
        }
      },

      async callAnthropic(conversation: AnthropicConversation): Promise<AnthropicResponse> {
        const anthropicConfig = config.platformConfig as AnthropicAdapterConfig;
        const baseUrl = anthropicConfig.baseUrl || 'https://api.anthropic.com';
        
        const response = await fetch(`${baseUrl}/v1/messages`, {
          method: 'POST',
          headers: {
            'x-api-key': anthropicConfig.apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify(conversation)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new AdapterError(
            AdapterErrorType.PLATFORM_ERROR,
            AIPlatform.ANTHROPIC,
            `Anthropic API error: ${response.status} ${response.statusText}`,
            'ANTHROPIC_API_001',
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
   * Create webhook handler for server-side integration
   */
  static createWebhookHandler(config: AdapterIntegrationConfig) {
    const adapter = new AnthropicAdapter(DeploymentEnvironment.SERVER_SIDE);
    
    return async (req: any, res: any) => {
      try {
        if (!adapter.initialized) {
          await adapter.initialize(config);
        }

        const webhookData = req.body;
        
        // Extract conversation context from webhook data
        const context = adapter.extractConversationContext(webhookData);
        
        // Process the webhook data and potentially inject ads
        const processedData = await adapter.processResponse(webhookData, context);
        
        res.json(processedData);
      } catch (error) {
        if (config.platformConfig.debugMode) {
          console.error('[Anthropic Adapter] Webhook handler error:', error);
        }
        
        // Return original data on error
        res.json(req.body);
      }
    };
  }

  /**
   * Override shouldShowAd for Anthropic-specific logic
   */
  shouldShowAd(context: any): boolean {
    // Claude tends to have longer, more thoughtful responses
    // Show ads less frequently to maintain conversation quality
    if (context.conversationStage?.messageCount < 3) {
      return false;
    }

    // Don't show ads if the conversation involves creative writing or analysis
    const creativeTopics = ['creative', 'writing', 'analysis', 'research', 'academic'];
    const hasCreativeTopic = context.topics?.some((topic: any) => 
      creativeTopics.some(creative => topic.name.toLowerCase().includes(creative))
    );

    if (hasCreativeTopic && context.userEngagement?.score > 0.7) {
      return false; // High engagement creative work shouldn't be interrupted
    }

    // Show ads more selectively based on conversation depth
    const minEngagement = 0.6; // Higher threshold than base adapter
    return context.userEngagement?.score >= minEngagement && super.shouldShowAd(context);
  }

  /**
   * Create streaming response handler
   */
  static createStreamHandler(config: AdapterIntegrationConfig) {
    const adapter = new AnthropicAdapter(DeploymentEnvironment.SERVER_SIDE);
    
    return async function* (stream: AsyncIterable<any>) {
      try {
        if (!adapter.initialized) {
          await adapter.initialize(config);
        }

        let messageBuffer = '';
        let shouldInjectAd = false;
        let adContent: AdContent | null = null;

        for await (const chunk of stream) {
          // Buffer the streaming content
          if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
            messageBuffer += chunk.delta.text;
          }

          // Check if we should inject an ad after a certain amount of content
          if (!shouldInjectAd && messageBuffer.length > 200) {
            const context = adapter.extractMessageContext({
              id: 'stream',
              role: 'assistant',
              content: messageBuffer,
              timestamp: new Date()
            });

            if (adapter.shouldShowAd(context)) {
              shouldInjectAd = true;
              adContent = await adapter.requestAd(context) as AdContent;
            }
          }

          yield chunk;

          // Inject ad at natural break points
          if (shouldInjectAd && adContent && chunk.type === 'content_block_stop') {
            const adMessage = adapter.formatAdForAnthropic(adContent);
            yield {
              type: 'content_block_delta',
              delta: { text: `\n\n${adMessage}` }
            };
            shouldInjectAd = false;
          }
        }
      } catch (error) {
        if (config.platformConfig.debugMode) {
          console.error('[Anthropic Adapter] Stream handler error:', error);
        }
        // Continue streaming without ads on error
        for await (const chunk of stream) {
          yield chunk;
        }
      }
    };
  }
}