import { describe, it, expect, beforeEach, afterEach, vi, expect } from 'vitest';
import { AnthropicAdapter } from '../anthropic-adapter';
import { AdapterTestUtils } from './test-utils';
import {
  AIPlatform,
  DeploymentEnvironment,
  AdapterError,
  AdapterErrorType
} from '../types';

// Mock the AI Ad Yuugen SDK
vi.mock('../../core/sdk', () => ({
  AIYuugenSDK: vi.fn().mockImplementation(() => AdapterTestUtils.createMockAIYuugenSDK())
}));

describe('AnthropicAdapter', () => {
  let adapter: AnthropicAdapter;
  let mockFetch: jest.Mock;
  let consoleSpy: any;

  beforeEach(() => {
    adapter = new AnthropicAdapter(DeploymentEnvironment.CLIENT_SIDE);
    consoleSpy = AdapterTestUtils.createConsoleSpy();
    
    // Mock successful API responses
    mockFetch = AdapterTestUtils.createMockFetch({
      'POST https://api.anthropic.com/v1/messages': AdapterTestUtils.createMockAnthropicResponse(),
      'POST https://dev-api.ai-yuugen.com/auth/validate': { success: true, permissions: ['ads'] }
    });
    global.fetch = mockFetch;
  });

  afterEach(() => {
    adapter.destroy();
    consoleSpy.restore();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully with valid configuration', async () => {
      const config = AdapterTestUtils.createMockAnthropicConfig();
      
      await expect(adapter.initialize(config)).resolves.not.toThrow();
      expect(adapter.platform).toBe(AIPlatform.ANTHROPIC);
      expect(adapter.environment).toBe(DeploymentEnvironment.CLIENT_SIDE);
    });

    it('should throw error with invalid Anthropic API key format', async () => {
      const config = AdapterTestUtils.createMockAnthropicConfig({
        platformConfig: {
          ...AdapterTestUtils.createMockAnthropicConfig().platformConfig,
          apiKey: 'invalid-key-format'
        }
      });

      await expect(adapter.initialize(config)).rejects.toThrow(AdapterError);
      await expect(adapter.initialize(config)).rejects.toThrow('Invalid Anthropic API key format');
    });

    it('should throw error when API connection fails', async () => {
      global.fetch = AdapterTestUtils.createMockFailedFetch(401, 'Unauthorized');
      const config = AdapterTestUtils.createMockAnthropicConfig();

      await expect(adapter.initialize(config)).rejects.toThrow(AdapterError);
    });

    it('should throw error on network failure', async () => {
      global.fetch = AdapterTestUtils.createMockNetworkErrorFetch();
      const config = AdapterTestUtils.createMockAnthropicConfig();

      await expect(adapter.initialize(config)).rejects.toThrow(AdapterError);
    });
  });

  describe('Message Transformation', () => {
    beforeEach(async () => {
      const config = AdapterTestUtils.createMockAnthropicConfig();
      await adapter.initialize(config);
    });

    it('should transform Anthropic message to standard format', () => {
      const anthropicMessage = {
        role: 'user' as const,
        content: 'Hello, how are you?'
      };

      const standardMessage = adapter.transformToStandardMessage(anthropicMessage);

      expect(standardMessage.role).toBe('user');
      expect(standardMessage.content).toBe('Hello, how are you?');
      expect(standardMessage.metadata?.platform).toBe('anthropic');
      expect(standardMessage.metadata?.originalRole).toBe('user');
      expect(standardMessage.id).toMatch(/^anthropic_/);
    });

    it('should transform assistant role correctly', () => {
      const anthropicMessage = {
        role: 'assistant' as const,
        content: 'I am doing well, thank you!'
      };

      const standardMessage = adapter.transformToStandardMessage(anthropicMessage);

      expect(standardMessage.role).toBe('assistant');
      expect(standardMessage.content).toBe('I am doing well, thank you!');
    });

    it('should transform Anthropic conversation to standard format', () => {
      const anthropicConversation = AdapterTestUtils.createMockAnthropicConversation();
      const standardConversation = adapter.transformToStandardConversation(anthropicConversation);

      expect(standardConversation.messages).toHaveLength(3);
      expect(standardConversation.messages[0].role).toBe('user');
      expect(standardConversation.messages[1].role).toBe('assistant');
      expect(standardConversation.id).toMatch(/^anthropic_conv_/);
      expect(standardConversation.context?.domain).toBe('general');
    });
  });

  describe('Ad Injection', () => {
    beforeEach(async () => {
      const config = AdapterTestUtils.createMockAnthropicConfig();
      await adapter.initialize(config);
    });

    it('should inject ad into Anthropic response', () => {
      const response = AdapterTestUtils.createMockAnthropicResponse();
      const ad = AdapterTestUtils.createMockAd().content;

      const modifiedResponse = adapter.injectAd(response, ad);

      expect(modifiedResponse.content[0].text).toContain('Learn React State Management');
      expect(modifiedResponse.content[0].text).toContain('Start Learning');
      expect(modifiedResponse.content[0].text).toContain('TechEdu');
      expect(modifiedResponse.metadata?.adInjected).toBe(true);
    });

    it('should inject ad into Anthropic message', () => {
      const message = {
        role: 'assistant' as const,
        content: 'Here is my response to your question.'
      };
      const ad = AdapterTestUtils.createMockAd().content;

      const modifiedMessage = adapter.injectAdIntoMessage(message, ad);

      expect(modifiedMessage.content).toContain('Here is my response to your question.');
      expect(modifiedMessage.content).toContain('Learn React State Management');
      expect(modifiedMessage.content).toContain('🎯');
    });

    it('should handle ad injection errors gracefully', () => {
      const invalidResponse = null as any;
      const ad = AdapterTestUtils.createMockAd().content;

      expect(() => adapter.injectAd(invalidResponse, ad)).toThrow(AdapterError);
    });
  });

  describe('Context Analysis', () => {
    beforeEach(async () => {
      const config = AdapterTestUtils.createMockAnthropicConfig();
      await adapter.initialize(config);
    });

    it('should extract conversation context', () => {
      const conversation = AdapterTestUtils.createMockAnthropicConversation();
      const context = adapter.extractConversationContext(conversation);

      expect(context.topics).toBeDefined();
      expect(context.intent).toBeDefined();
      expect(context.sentiment).toBeDefined();
      expect(context.conversationStage).toBeDefined();
      expect(context.userEngagement).toBeDefined();
      expect(context.confidence).toBeGreaterThan(0);
    });

    it('should extract user context from session', () => {
      const session = {
        id: 'test-session-123',
        conversationId: 'conv-123',
        timeOnPlatform: 300000,
        interactionCount: 5
      };

      const userContext = adapter.extractUserContext(session);

      expect(userContext.sessionId).toBe('test-session-123');
      expect(userContext.currentConversation).toBe('conv-123');
      expect(userContext.timeOnPlatform).toBe(300000);
      expect(userContext.interactionCount).toBe(5);
    });
  });

  describe('Ad Display Logic', () => {
    beforeEach(async () => {
      const config = AdapterTestUtils.createMockAnthropicConfig();
      await adapter.initialize(config);
    });

    it('should show ads for appropriate contexts', () => {
      const context = {
        confidence: 0.8,
        userEngagement: { score: 0.7 },
        topics: [{ name: 'technology', confidence: 0.8 }],
        conversationStage: { messageCount: 4 }
      };

      expect(adapter.shouldShowAd(context)).toBe(true);
    });

    it('should not show ads for short conversations', () => {
      const context = {
        confidence: 0.8,
        userEngagement: { score: 0.7 },
        topics: [{ name: 'technology', confidence: 0.8 }],
        conversationStage: { messageCount: 2 }
      };

      expect(adapter.shouldShowAd(context)).toBe(false);
    });

    it('should not show ads for creative writing with high engagement', () => {
      const context = {
        confidence: 0.8,
        userEngagement: { score: 0.8 },
        topics: [{ name: 'creative writing', confidence: 0.8 }],
        conversationStage: { messageCount: 5 }
      };

      expect(adapter.shouldShowAd(context)).toBe(false);
    });

    it('should require higher engagement threshold than base adapter', () => {
      const context = {
        confidence: 0.8,
        userEngagement: { score: 0.5 }, // Below Anthropic's threshold
        topics: [{ name: 'technology', confidence: 0.8 }],
        conversationStage: { messageCount: 4 }
      };

      expect(adapter.shouldShowAd(context)).toBe(false);
    });
  });

  describe('Message Interception', () => {
    beforeEach(async () => {
      const config = AdapterTestUtils.createMockAnthropicConfig();
      await adapter.initialize(config);
    });

    it('should intercept messages and potentially inject ads', async () => {
      const message = {
        role: 'user' as const,
        content: 'I need help with React state management for my e-commerce project'
      };

      const result = await adapter.interceptMessage(message);

      expect(result).toBeDefined();
      expect(result.role).toBe('user');
    });

    it('should handle interception errors gracefully', async () => {
      const invalidMessage = null;

      const result = await adapter.interceptMessage(invalidMessage);

      expect(result).toBe(invalidMessage);
    });
  });

  describe('Response Processing', () => {
    beforeEach(async () => {
      const config = AdapterTestUtils.createMockAnthropicConfig();
      await adapter.initialize(config);
    });

    it('should process responses and inject ads when appropriate', async () => {
      const response = AdapterTestUtils.createMockAnthropicResponse();
      const context = {
        confidence: 0.8,
        userEngagement: { score: 0.7 },
        topics: [{ name: 'technology', confidence: 0.8 }],
        conversationStage: { messageCount: 4 }
      };

      const result = await adapter.processResponse(response, context);

      expect(result).toBeDefined();
    });

    it('should handle processing errors gracefully', async () => {
      const response = AdapterTestUtils.createMockAnthropicResponse();
      const invalidContext = null;

      const result = await adapter.processResponse(response, invalidContext);

      expect(result).toBe(response);
    });
  });

  describe('Static Factory Methods', () => {
    it('should create Express middleware', () => {
      const config = AdapterTestUtils.createMockAnthropicConfig();
      const middleware = AnthropicAdapter.createExpressMiddleware(config);

      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBe(3);
    });

    it('should create response interceptor', () => {
      const config = AdapterTestUtils.createMockAnthropicConfig();
      const interceptor = AnthropicAdapter.createResponseInterceptor(config);

      expect(typeof interceptor).toBe('function');
      expect(interceptor.length).toBe(3);
    });

    it('should create client wrapper', () => {
      const config = AdapterTestUtils.createMockAnthropicConfig();
      const wrapper = AnthropicAdapter.createClientWrapper(config);

      expect(wrapper).toHaveProperty('initialize');
      expect(wrapper).toHaveProperty('messages');
      expect(wrapper).toHaveProperty('destroy');
      expect(typeof wrapper.initialize).toBe('function');
      expect(typeof wrapper.messages).toBe('function');
      expect(typeof wrapper.destroy).toBe('function');
    });

    it('should create webhook handler', () => {
      const config = AdapterTestUtils.createMockAnthropicConfig();
      const handler = AnthropicAdapter.createWebhookHandler(config);

      expect(typeof handler).toBe('function');
      expect(handler.length).toBe(2); // req, res
    });

    it('should create stream handler', () => {
      const config = AdapterTestUtils.createMockAnthropicConfig();
      const handler = AnthropicAdapter.createStreamHandler(config);

      expect(typeof handler).toBe('function');
    });
  });

  describe('Streaming Support', () => {
    beforeEach(async () => {
      const config = AdapterTestUtils.createMockAnthropicConfig();
      await adapter.initialize(config);
    });

    it('should handle streaming responses', async () => {
      const config = AdapterTestUtils.createMockAnthropicConfig();
      const streamHandler = AnthropicAdapter.createStreamHandler(config);

      // Mock stream data
      const mockStream = async function* () {
        yield { type: 'content_block_start', content_block: { type: 'text' } };
        yield { type: 'content_block_delta', delta: { text: 'Hello' } };
        yield { type: 'content_block_delta', delta: { text: ' world' } };
        yield { type: 'content_block_stop' };
      };

      const results = [];
      for await (const chunk of streamHandler(mockStream())) {
        results.push(chunk);
      }

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should throw appropriate errors for initialization failures', async () => {
      const config = AdapterTestUtils.createMockAnthropicConfig({
        platformConfig: {
          ...AdapterTestUtils.createMockAnthropicConfig().platformConfig,
          apiKey: ''
        }
      });

      await expect(adapter.initialize(config)).rejects.toThrow(AdapterError);
    });

    it('should handle API rate limiting', async () => {
      global.fetch = AdapterTestUtils.createMockFailedFetch(429, 'Too Many Requests');
      const config = AdapterTestUtils.createMockAnthropicConfig();

      await expect(adapter.initialize(config)).rejects.toThrow(AdapterError);
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources on destroy', async () => {
      const config = AdapterTestUtils.createMockAnthropicConfig();
      await adapter.initialize(config);

      expect(() => adapter.destroy()).not.toThrow();
    });

    it('should handle multiple destroy calls gracefully', async () => {
      const config = AdapterTestUtils.createMockAnthropicConfig();
      await adapter.initialize(config);

      adapter.destroy();
      expect(() => adapter.destroy()).not.toThrow();
    });
  });
});