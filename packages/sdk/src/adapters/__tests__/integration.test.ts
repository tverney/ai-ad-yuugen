import { describe, it, expect, beforeEach, afterEach, vi, expect } from 'vitest';
import { AIAdapterFactory } from '../adapter-factory';
import { AdapterTestUtils } from './test-utils';
import {
  AIPlatform,
  DeploymentEnvironment,
  IntegrationPattern
} from '../types';

// Mock the AI Ad Yuugen SDK
vi.mock('../../core/sdk', () => ({
  AIYuugenSDK: vi.fn().mockImplementation(() => AdapterTestUtils.createMockAIYuugenSDK())
}));

describe('Multi-Platform Integration Tests', () => {
  let factory: AIAdapterFactory;
  let mockFetch: jest.Mock;
  let consoleSpy: any;

  beforeEach(() => {
    factory = AIAdapterFactory.getInstance();
    consoleSpy = AdapterTestUtils.createConsoleSpy();
    
    // Mock successful API responses for all platforms
    mockFetch = AdapterTestUtils.createMockFetch({
      // OpenAI
      'GET https://api.openai.com/v1/models': { data: [{ id: 'gpt-3.5-turbo' }] },
      'POST https://api.openai.com/v1/chat/completions': AdapterTestUtils.createMockOpenAIResponse(),
      
      // Anthropic
      'POST https://api.anthropic.com/v1/messages': AdapterTestUtils.createMockAnthropicResponse(),
      
      // Google AI
      'POST https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=test-google-ai-key-123456789': AdapterTestUtils.createMockGoogleAIResponse(),
      
      // AI Ad Yuugen
      'POST https://dev-api.ai-yuugen.com/auth/validate': { success: true, permissions: ['ads'] }
    });
    global.fetch = mockFetch;
  });

  afterEach(() => {
    consoleSpy.restore();
    vi.clearAllMocks();
  });

  describe('Cross-Platform Compatibility', () => {
    it('should create and initialize all platform adapters', async () => {
      const configs = [
        AdapterTestUtils.createMockOpenAIConfig(),
        AdapterTestUtils.createMockAnthropicConfig(),
        AdapterTestUtils.createMockGoogleAIConfig()
      ];

      const adapters = factory.createMultiPlatformAdapters(configs);

      expect(adapters.size).toBe(3);

      // Initialize all adapters
      const initPromises = Array.from(adapters.entries()).map(async ([platform, adapter]) => {
        const config = configs.find(c => c.platform === platform);
        if (config) {
          await adapter.initialize(config);
          expect(adapter.platform).toBe(platform);
        }
      });

      await Promise.all(initPromises);

      // Clean up
      adapters.forEach(adapter => adapter.destroy());
    });

    it('should handle different deployment environments', async () => {
      const environments = [
        DeploymentEnvironment.CLIENT_SIDE,
        DeploymentEnvironment.SERVER_SIDE,
        DeploymentEnvironment.SERVERLESS
      ];

      for (const environment of environments) {
        const config = AdapterTestUtils.createMockOpenAIConfig({ environment });
        const adapter = factory.createAdapter(config);
        
        expect(adapter.environment).toBe(environment);
        
        await adapter.initialize(config);
        adapter.destroy();
      }
    });

    it('should maintain consistent API across platforms', async () => {
      const platforms = [AIPlatform.OPENAI, AIPlatform.ANTHROPIC, AIPlatform.GOOGLE_AI];
      const adapters = [];

      for (const platform of platforms) {
        let config;
        switch (platform) {
          case AIPlatform.OPENAI:
            config = AdapterTestUtils.createMockOpenAIConfig();
            break;
          case AIPlatform.ANTHROPIC:
            config = AdapterTestUtils.createMockAnthropicConfig();
            break;
          case AIPlatform.GOOGLE_AI:
            config = AdapterTestUtils.createMockGoogleAIConfig();
            break;
        }

        const adapter = factory.createAdapter(config);
        await adapter.initialize(config);
        adapters.push(adapter);

        // Test consistent API
        expect(typeof adapter.interceptMessage).toBe('function');
        expect(typeof adapter.processResponse).toBe('function');
        expect(typeof adapter.extractConversationContext).toBe('function');
        expect(typeof adapter.extractUserContext).toBe('function');
        expect(typeof adapter.shouldShowAd).toBe('function');
        expect(typeof adapter.destroy).toBe('function');
      }

      // Clean up
      adapters.forEach(adapter => adapter.destroy());
    });
  });

  describe('Message Processing Pipeline', () => {
    it('should process messages consistently across platforms', async () => {
      const testMessage = 'I need help with React state management';
      const platforms = [
        { platform: AIPlatform.OPENAI, config: AdapterTestUtils.createMockOpenAIConfig() },
        { platform: AIPlatform.ANTHROPIC, config: AdapterTestUtils.createMockAnthropicConfig() },
        { platform: AIPlatform.GOOGLE_AI, config: AdapterTestUtils.createMockGoogleAIConfig() }
      ];

      for (const { platform, config } of platforms) {
        const adapter = factory.createAdapter(config);
        await adapter.initialize(config);

        // Create platform-specific message format
        let platformMessage;
        switch (platform) {
          case AIPlatform.OPENAI:
            platformMessage = { role: 'user' as const, content: testMessage };
            break;
          case AIPlatform.ANTHROPIC:
            platformMessage = { role: 'user' as const, content: testMessage };
            break;
          case AIPlatform.GOOGLE_AI:
            platformMessage = { role: 'user' as const, parts: [{ text: testMessage }] };
            break;
        }

        // Test message transformation
        const standardMessage = adapter.transformToStandardMessage(platformMessage);
        expect(standardMessage.content).toContain('React state management');
        expect(standardMessage.role).toBe('user');
        expect(standardMessage.metadata?.platform).toBe(platform.toLowerCase().replace('_', '_'));

        // Test message interception
        const interceptedMessage = await adapter.interceptMessage(platformMessage);
        expect(interceptedMessage).toBeDefined();

        adapter.destroy();
      }
    });

    it('should extract context consistently across platforms', async () => {
      const platforms = [
        { platform: AIPlatform.OPENAI, config: AdapterTestUtils.createMockOpenAIConfig(), conversation: AdapterTestUtils.createMockOpenAIConversation() },
        { platform: AIPlatform.ANTHROPIC, config: AdapterTestUtils.createMockAnthropicConfig(), conversation: AdapterTestUtils.createMockAnthropicConversation() },
        { platform: AIPlatform.GOOGLE_AI, config: AdapterTestUtils.createMockGoogleAIConfig(), conversation: AdapterTestUtils.createMockGoogleAIConversation() }
      ];

      for (const { platform, config, conversation } of platforms) {
        const adapter = factory.createAdapter(config);
        await adapter.initialize(config);

        const context = adapter.extractConversationContext(conversation);

        // Verify consistent context structure
        expect(context).toHaveProperty('topics');
        expect(context).toHaveProperty('intent');
        expect(context).toHaveProperty('sentiment');
        expect(context).toHaveProperty('conversationStage');
        expect(context).toHaveProperty('userEngagement');
        expect(context).toHaveProperty('confidence');
        expect(context).toHaveProperty('extractedAt');

        // Verify context quality
        expect(Array.isArray(context.topics)).toBe(true);
        expect(typeof context.confidence).toBe('number');
        expect(context.confidence).toBeGreaterThan(0);
        expect(context.confidence).toBeLessThanOrEqual(1);

        adapter.destroy();
      }
    });
  });

  describe('Ad Injection Consistency', () => {
    it('should inject ads consistently across platforms', async () => {
      const mockAd = AdapterTestUtils.createMockAd().content;
      const platforms = [
        { platform: AIPlatform.OPENAI, config: AdapterTestUtils.createMockOpenAIConfig(), response: AdapterTestUtils.createMockOpenAIResponse() },
        { platform: AIPlatform.ANTHROPIC, config: AdapterTestUtils.createMockAnthropicConfig(), response: AdapterTestUtils.createMockAnthropicResponse() },
        { platform: AIPlatform.GOOGLE_AI, config: AdapterTestUtils.createMockGoogleAIConfig(), response: AdapterTestUtils.createMockGoogleAIResponse() }
      ];

      for (const { platform, config, response } of platforms) {
        const adapter = factory.createAdapter(config);
        await adapter.initialize(config);

        const modifiedResponse = adapter.injectAd(response, mockAd);

        // Verify ad content is present
        const responseText = JSON.stringify(modifiedResponse);
        expect(responseText).toContain(mockAd.title);
        expect(responseText).toContain(mockAd.brandName);
        expect(responseText).toContain(mockAd.ctaText);

        adapter.destroy();
      }
    });

    it('should apply platform-specific ad display logic', async () => {
      const contexts = [
        // Short conversation - should be rejected by all
        {
          confidence: 0.8,
          userEngagement: { score: 0.7 },
          topics: [{ name: 'technology', confidence: 0.8 }],
          conversationStage: { messageCount: 1 }
        },
        // Technical content with high engagement - should be rejected by Google AI
        {
          confidence: 0.8,
          userEngagement: { score: 0.7 },
          topics: [{ name: 'programming tutorial', confidence: 0.8 }],
          conversationStage: { messageCount: 3 }
        },
        // Creative writing with high engagement - should be rejected by Anthropic
        {
          confidence: 0.8,
          userEngagement: { score: 0.8 },
          topics: [{ name: 'creative writing', confidence: 0.8 }],
          conversationStage: { messageCount: 5 }
        }
      ];

      const platforms = [
        { platform: AIPlatform.OPENAI, config: AdapterTestUtils.createMockOpenAIConfig() },
        { platform: AIPlatform.ANTHROPIC, config: AdapterTestUtils.createMockAnthropicConfig() },
        { platform: AIPlatform.GOOGLE_AI, config: AdapterTestUtils.createMockGoogleAIConfig() }
      ];

      for (const { platform, config } of platforms) {
        const adapter = factory.createAdapter(config);
        await adapter.initialize(config);

        // Test each context
        const results = contexts.map(context => adapter.shouldShowAd(context));

        // All platforms should reject short conversations
        expect(results[0]).toBe(false);

        // Platform-specific behavior
        if (platform === AIPlatform.GOOGLE_AI) {
          expect(results[1]).toBe(false); // Should reject technical content
        }
        
        if (platform === AIPlatform.ANTHROPIC) {
          expect(results[2]).toBe(false); // Should reject creative writing
        }

        adapter.destroy();
      }
    });
  });

  describe('Error Handling Consistency', () => {
    it('should handle initialization errors consistently', async () => {
      const invalidConfigs = [
        { ...AdapterTestUtils.createMockOpenAIConfig(), platformConfig: { apiKey: 'invalid' } },
        { ...AdapterTestUtils.createMockAnthropicConfig(), platformConfig: { apiKey: 'invalid' } },
        { ...AdapterTestUtils.createMockGoogleAIConfig(), platformConfig: { apiKey: '' } }
      ];

      for (const config of invalidConfigs) {
        const adapter = factory.createAdapter(config);
        
        await expect(adapter.initialize(config)).rejects.toThrow();
        
        adapter.destroy();
      }
    });

    it('should handle network errors gracefully', async () => {
      global.fetch = AdapterTestUtils.createMockNetworkErrorFetch();

      const configs = [
        AdapterTestUtils.createMockOpenAIConfig(),
        AdapterTestUtils.createMockAnthropicConfig(),
        AdapterTestUtils.createMockGoogleAIConfig()
      ];

      for (const config of configs) {
        const adapter = factory.createAdapter(config);
        
        await expect(adapter.initialize(config)).rejects.toThrow();
        
        adapter.destroy();
      }
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent adapter operations', async () => {
      const configs = [
        AdapterTestUtils.createMockOpenAIConfig(),
        AdapterTestUtils.createMockAnthropicConfig(),
        AdapterTestUtils.createMockGoogleAIConfig()
      ];

      const adapters = factory.createMultiPlatformAdapters(configs);

      // Initialize all adapters concurrently
      const initPromises = Array.from(adapters.entries()).map(async ([platform, adapter]) => {
        const config = configs.find(c => c.platform === platform);
        if (config) {
          await adapter.initialize(config);
        }
      });

      await Promise.all(initPromises);

      // Perform concurrent operations
      const operationPromises = Array.from(adapters.values()).map(async (adapter) => {
        const testMessage = { role: 'user' as const, content: 'Test message' };
        return adapter.interceptMessage(testMessage);
      });

      const results = await Promise.all(operationPromises);
      expect(results).toHaveLength(3);

      // Clean up
      adapters.forEach(adapter => adapter.destroy());
    });

    it('should handle rapid adapter creation and destruction', async () => {
      const iterations = 10;
      const config = AdapterTestUtils.createMockOpenAIConfig();

      for (let i = 0; i < iterations; i++) {
        const adapter = factory.createAdapter(config);
        await adapter.initialize(config);
        
        // Perform a quick operation
        const context = adapter.extractUserContext({ id: `session-${i}` });
        expect(context.sessionId).toBe(`session-${i}`);
        
        adapter.destroy();
      }
    });
  });

  describe('Integration Patterns', () => {
    it('should support different integration patterns', () => {
      const patterns = [
        IntegrationPattern.MIDDLEWARE,
        IntegrationPattern.WRAPPER,
        IntegrationPattern.PROXY,
        IntegrationPattern.WEBHOOK
      ];

      for (const pattern of patterns) {
        const config = {
          ...AdapterTestUtils.createMockOpenAIConfig(),
          pattern
        };

        const adapter = factory.createAdapter(config);
        expect(adapter).toBeDefined();
        adapter.destroy();
      }
    });

    it('should provide platform-specific integration helpers', () => {
      // Test static factory methods exist
      const { OpenAIAdapter } = require('../openai-adapter');
      const { AnthropicAdapter } = require('../anthropic-adapter');
      const { GoogleAIAdapter } = require('../google-ai-adapter');

      expect(typeof OpenAIAdapter.createExpressMiddleware).toBe('function');
      expect(typeof OpenAIAdapter.createClientWrapper).toBe('function');
      
      expect(typeof AnthropicAdapter.createWebhookHandler).toBe('function');
      expect(typeof AnthropicAdapter.createStreamHandler).toBe('function');
      
      expect(typeof GoogleAIAdapter.createCloudFunctionHandler).toBe('function');
      expect(typeof GoogleAIAdapter.createVertexAIHandler).toBe('function');
    });
  });

  describe('Configuration Compatibility', () => {
    it('should handle environment-specific configurations', () => {
      const environments = [
        DeploymentEnvironment.CLIENT_SIDE,
        DeploymentEnvironment.SERVER_SIDE,
        DeploymentEnvironment.EDGE,
        DeploymentEnvironment.SERVERLESS
      ];

      for (const environment of environments) {
        for (const platform of [AIPlatform.OPENAI, AIPlatform.ANTHROPIC, AIPlatform.GOOGLE_AI]) {
          if (factory.isCompatible(platform, environment)) {
            const recommendedConfig = factory.getRecommendedConfig(platform, environment);
            
            expect(recommendedConfig.platform).toBe(platform);
            expect(recommendedConfig.environment).toBe(environment);
            expect(recommendedConfig.adSenseConfig).toBeDefined();
            expect(recommendedConfig.platformConfig).toBeDefined();
          }
        }
      }
    });

    it('should validate cross-platform configuration consistency', () => {
      const platforms = [AIPlatform.OPENAI, AIPlatform.ANTHROPIC, AIPlatform.GOOGLE_AI];
      
      for (const platform of platforms) {
        const requirements = factory.getPlatformRequirements(platform);
        
        // All platforms should require API key
        expect(requirements.apiKey).toBeDefined();
        expect(requirements.apiKey.required).toBe(true);
        
        // All platforms should have model configuration
        expect(requirements.model).toBeDefined();
        expect(requirements.model.default).toBeDefined();
      }
    });
  });
});