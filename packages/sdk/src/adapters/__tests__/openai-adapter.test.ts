import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OpenAIAdapter } from '../openai-adapter';
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

describe('OpenAIAdapter', () => {
  let adapter: OpenAIAdapter;
  let mockFetch: jest.Mock;
  let consoleSpy: any;

  beforeEach(() => {
    adapter = new OpenAIAdapter(DeploymentEnvironment.CLIENT_SIDE);
    consoleSpy = AdapterTestUtils.createConsoleSpy();
    
    // Mock successful API responses
    mockFetch = AdapterTestUtils.createMockFetch({
      'GET https://api.openai.com/v1/models': { data: [{ id: 'gpt-3.5-turbo' }] },
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
      const config = AdapterTestUtils.createMockOpenAIConfig();
      
      await expect(adapter.initialize(config)).resolves.not.toThrow();
      expect(adapter.platform).toBe(AIPlatform.OPENAI);
      expect(adapter.environment).toBe(DeploymentEnvironment.CLIENT_SIDE);
    });

    it('should throw error with invalid OpenAI API key format', async () => {
      const config = AdapterTestUtils.createMockOpenAIConfig({
        platformConfig: {
          ...AdapterTestUtils.createMockOpenAIConfig().platformConfig,
          apiKey: 'invalid-key-format'
        }
      });

      await expect(adapter.initialize(config)).rejects.toThrow(AdapterError);
      await expect(adapter.initialize(config)).rejects.toThrow('Invalid OpenAI API key format');
    });

    it('should throw error when API connection fails', async () => {
      global.fetch = AdapterTestUtils.createMockFailedFetch(401, 'Unauthorized');
      const config = AdapterTestUtils.createMockOpenAIConfig();

      await expect(adapter.initialize(config)).rejects.toThrow(AdapterError);
    });

    it('should throw error on network failure', async () => {
      global.fetch = AdapterTestUtils.createMockNetworkErrorFetch();
      const config = AdapterTestUtils.createMockOpenAIConfig();

      await expect(adapter.initialize(config)).rejects.toThrow(AdapterError);
    });
  });

  describe('Message Transformation', () => {
    beforeEach(async () => {
      const config = AdapterTestUtils.createMockOpenAIConfig();
      await adapter.initialize(config);
    });

    it('should transform OpenAI message to standard format', () => {
      const openAIMessage = {
        role: 'user' as const,
        content: 'Hello, how are you?',
        name: 'test-user'
      };

      const standardMessage = adapter.transformToStandardMessage(openAIMessage);

      expect(standardMessage.role).toBe('user');
      expect(standardMessage.content).toBe('Hello, how are you?');
      expect(standardMessage.metadata?.platform).toBe('openai');
      expect(standardMessage.metadata?.originalRole).toBe('user');
      expect(standardMessage.metadata?.name).toBe('test-user');
      expect(standardMessage.id).toMatch(/^openai_/);
    });

    it('should transform assistant role correctly', () => {
      const openAIMessage = {
        role: 'assistant' as const,
        content: 'I am doing well, thank you!'
      };

      const standardMessage = adapter.transformToStandardMessage(openAIMessage);

      expect(standardMessage.role).toBe('assistant');
      expect(standardMessage.content).toBe('I am doing well, thank you!');
    });

    it('should transform OpenAI conversation to standard format', () => {
      const openAIConversation = AdapterTestUtils.createMockOpenAIConversation();
      const standardConversation = adapter.transformToStandardConversation(openAIConversation);

      expect(standardConversation.messages).toHaveLength(3);
      expect(standardConversation.messages[0].role).toBe('user');
      expect(standardConversation.messages[1].role).toBe('assistant');
      expect(standardConversation.id).toMatch(/^openai_conv_/);
      expect(standardConversation.context?.domain).toBe('general');
    });
  });

  describe('Ad Injection', () => {
    beforeEach(async () => {
      const config = AdapterTestUtils.createMockOpenAIConfig();
      await adapter.initialize(config);
    });

    it('should inject ad into OpenAI response', () => {
      const response = AdapterTestUtils.createMockOpenAIResponse();
      const ad = AdapterTestUtils.createMockAd().content;

      const modifiedResponse = adapter.injectAd(response, ad);

      expect(modifiedResponse.choices[0].message.content).toContain('Learn React State Management');
      expect(modifiedResponse.choices[0].message.content).toContain('Start Learning');
      expect(modifiedResponse.choices[0].message.content).toContain('TechEdu');
      expect(modifiedResponse.choices[0].message.metadata?.adInjected).toBe(true);
    });

    it('should inject ad into OpenAI message', () => {
      const message = {
        role: 'assistant' as const,
        content: 'Here is my response to your question.'
      };
      const ad = AdapterTestUtils.createMockAd().content;

      const modifiedMessage = adapter.injectAdIntoMessage(message, ad);

      expect(modifiedMessage.content).toContain('Here is my response to your question.');
      expect(modifiedMessage.content).toContain('Learn React State Management');
      expect(modifiedMessage.content).toContain('---');
    });

    it('should handle ad injection errors gracefully', () => {
      const invalidResponse = null as any;
      const ad = AdapterTestUtils.createMockAd().content;

      expect(() => adapter.injectAd(invalidResponse, ad)).toThrow(AdapterError);
    });
  });

  describe('Context Analysis', () => {
    beforeEach(async () => {
      const config = AdapterTestUtils.createMockOpenAIConfig();
      await adapter.initialize(config);
    });

    it('should extract conversation context', () => {
      const conversation = AdapterTestUtils.createMockOpenAIConversation();
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
      const config = AdapterTestUtils.createMockOpenAIConfig();
      await adapter.initialize(config);
    });

    it('should show ads for appropriate contexts', () => {
      const context = {
        confidence: 0.8,
        userEngagement: { score: 0.7 },
        topics: [{ name: 'technology', confidence: 0.8 }],
        conversationStage: { messageCount: 3 }
      };

      expect(adapter.shouldShowAd(context)).toBe(true);
    });

    it('should not show ads for short conversations', () => {
      const context = {
        confidence: 0.8,
        userEngagement: { score: 0.7 },
        topics: [{ name: 'technology', confidence: 0.8 }],
        conversationStage: { messageCount: 1 }
      };

      expect(adapter.shouldShowAd(context)).toBe(false);
    });

    it('should not show ads for sensitive topics', () => {
      const context = {
        confidence: 0.8,
        userEngagement: { score: 0.7 },
        topics: [{ name: 'medical advice', confidence: 0.8 }],
        conversationStage: { messageCount: 3 }
      };

      expect(adapter.shouldShowAd(context)).toBe(false);
    });

    it('should not show ads for low confidence contexts', () => {
      const context = {
        confidence: 0.2,
        userEngagement: { score: 0.7 },
        topics: [{ name: 'technology', confidence: 0.8 }],
        conversationStage: { messageCount: 3 }
      };

      expect(adapter.shouldShowAd(context)).toBe(false);
    });
  });

  describe('Message Interception', () => {
    beforeEach(async () => {
      const config = AdapterTestUtils.createMockOpenAIConfig();
      await adapter.initialize(config);
    });

    it('should intercept messages and potentially inject ads', async () => {
      const message = {
        role: 'user' as const,
        content: 'I need help with React state management for my e-commerce project'
      };

      const result = await adapter.interceptMessage(message);

      // Should return the message (potentially modified)
      expect(result).toBeDefined();
      expect(result.role).toBe('user');
    });

    it('should handle interception errors gracefully', async () => {
      const invalidMessage = null;

      const result = await adapter.interceptMessage(invalidMessage);

      // Should return original message on error
      expect(result).toBe(invalidMessage);
    });
  });

  describe('Response Processing', () => {
    beforeEach(async () => {
      const config = AdapterTestUtils.createMockOpenAIConfig();
      await adapter.initialize(config);
    });

    it('should process responses and inject ads when appropriate', async () => {
      const response = AdapterTestUtils.createMockOpenAIResponse();
      const context = {
        confidence: 0.8,
        userEngagement: { score: 0.7 },
        topics: [{ name: 'technology', confidence: 0.8 }],
        conversationStage: { messageCount: 3 }
      };

      const result = await adapter.processResponse(response, context);

      expect(result).toBeDefined();
      // Should potentially contain ad content
    });

    it('should handle processing errors gracefully', async () => {
      const response = AdapterTestUtils.createMockOpenAIResponse();
      const invalidContext = null;

      const result = await adapter.processResponse(response, invalidContext);

      // Should return original response on error
      expect(result).toBe(response);
    });
  });

  describe('Static Factory Methods', () => {
    it('should create Express middleware', () => {
      const config = AdapterTestUtils.createMockOpenAIConfig();
      const middleware = OpenAIAdapter.createExpressMiddleware(config);

      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBe(3); // req, res, next
    });

    it('should create response interceptor', () => {
      const config = AdapterTestUtils.createMockOpenAIConfig();
      const interceptor = OpenAIAdapter.createResponseInterceptor(config);

      expect(typeof interceptor).toBe('function');
      expect(interceptor.length).toBe(3); // req, res, next
    });

    it('should create client wrapper', () => {
      const config = AdapterTestUtils.createMockOpenAIConfig();
      const wrapper = OpenAIAdapter.createClientWrapper(config);

      expect(wrapper).toHaveProperty('initialize');
      expect(wrapper).toHaveProperty('chat');
      expect(wrapper).toHaveProperty('destroy');
      expect(typeof wrapper.initialize).toBe('function');
      expect(typeof wrapper.chat).toBe('function');
      expect(typeof wrapper.destroy).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should throw appropriate errors for initialization failures', async () => {
      const config = AdapterTestUtils.createMockOpenAIConfig({
        platformConfig: {
          ...AdapterTestUtils.createMockOpenAIConfig().platformConfig,
          apiKey: '' // Invalid empty API key
        }
      });

      await expect(adapter.initialize(config)).rejects.toThrow(AdapterError);
    });

    it('should handle network timeouts', async () => {
      global.fetch = vi.fn(() => new Promise(resolve => {
        setTimeout(() => resolve({
          ok: false,
          status: 408,
          statusText: 'Request Timeout',
          json: () => Promise.resolve({ error: 'Timeout' })
        }), 100);
      }));

      const config = AdapterTestUtils.createMockOpenAIConfig({
        platformConfig: {
          ...AdapterTestUtils.createMockOpenAIConfig().platformConfig,
          timeout: 50 // Very short timeout
        }
      });

      await expect(adapter.initialize(config)).rejects.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources on destroy', async () => {
      const config = AdapterTestUtils.createMockOpenAIConfig();
      await adapter.initialize(config);

      expect(() => adapter.destroy()).not.toThrow();
    });

    it('should handle multiple destroy calls gracefully', async () => {
      const config = AdapterTestUtils.createMockOpenAIConfig();
      await adapter.initialize(config);

      adapter.destroy();
      expect(() => adapter.destroy()).not.toThrow();
    });
  });
});