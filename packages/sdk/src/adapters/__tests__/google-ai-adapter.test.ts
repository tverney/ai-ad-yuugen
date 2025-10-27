import { describe, it, expect, beforeEach, afterEach, vi, expect } from 'vitest';
import { GoogleAIAdapter } from '../google-ai-adapter';
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

describe('GoogleAIAdapter', () => {
  let adapter: GoogleAIAdapter;
  let mockFetch: jest.Mock;
  let consoleSpy: any;

  beforeEach(() => {
    adapter = new GoogleAIAdapter(DeploymentEnvironment.CLIENT_SIDE);
    consoleSpy = AdapterTestUtils.createConsoleSpy();
    
    // Mock successful API responses
    mockFetch = AdapterTestUtils.createMockFetch({
      'POST https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=test-google-ai-key-123456789': AdapterTestUtils.createMockGoogleAIResponse(),
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
      const config = AdapterTestUtils.createMockGoogleAIConfig();
      
      await expect(adapter.initialize(config)).resolves.not.toThrow();
      expect(adapter.platform).toBe(AIPlatform.GOOGLE_AI);
      expect(adapter.environment).toBe(DeploymentEnvironment.CLIENT_SIDE);
    });

    it('should throw error with invalid Google AI API key', async () => {
      const config = AdapterTestUtils.createMockGoogleAIConfig({
        platformConfig: {
          ...AdapterTestUtils.createMockGoogleAIConfig().platformConfig,
          apiKey: 'short'
        }
      });

      await expect(adapter.initialize(config)).rejects.toThrow(AdapterError);
      await expect(adapter.initialize(config)).rejects.toThrow('Invalid Google AI API key format');
    });

    it('should throw error when API connection fails', async () => {
      global.fetch = AdapterTestUtils.createMockFailedFetch(401, 'Unauthorized');
      const config = AdapterTestUtils.createMockGoogleAIConfig();

      await expect(adapter.initialize(config)).rejects.toThrow(AdapterError);
    });

    it('should throw error on network failure', async () => {
      global.fetch = AdapterTestUtils.createMockNetworkErrorFetch();
      const config = AdapterTestUtils.createMockGoogleAIConfig();

      await expect(adapter.initialize(config)).rejects.toThrow(AdapterError);
    });
  });

  describe('Message Transformation', () => {
    beforeEach(async () => {
      const config = AdapterTestUtils.createMockGoogleAIConfig();
      await adapter.initialize(config);
    });

    it('should transform Google AI message to standard format', () => {
      const googleAIMessage = {
        role: 'user' as const,
        parts: [{ text: 'Hello, how are you?' }]
      };

      const standardMessage = adapter.transformToStandardMessage(googleAIMessage);

      expect(standardMessage.role).toBe('user');
      expect(standardMessage.content).toBe('Hello, how are you?');
      expect(standardMessage.metadata?.platform).toBe('google_ai');
      expect(standardMessage.metadata?.originalRole).toBe('user');
      expect(standardMessage.id).toMatch(/^google_ai_/);
    });

    it('should transform model role correctly', () => {
      const googleAIMessage = {
        role: 'model' as const,
        parts: [{ text: 'I am doing well, thank you!' }]
      };

      const standardMessage = adapter.transformToStandardMessage(googleAIMessage);

      expect(standardMessage.role).toBe('assistant');
      expect(standardMessage.content).toBe('I am doing well, thank you!');
    });

    it('should handle multiple parts in message', () => {
      const googleAIMessage = {
        role: 'user' as const,
        parts: [
          { text: 'Hello' },
          { text: ' world' },
          { text: '!' }
        ]
      };

      const standardMessage = adapter.transformToStandardMessage(googleAIMessage);

      expect(standardMessage.content).toBe('Hello world !');
    });

    it('should transform Google AI conversation to standard format', () => {
      const googleAIConversation = AdapterTestUtils.createMockGoogleAIConversation();
      const standardConversation = adapter.transformToStandardConversation(googleAIConversation);

      expect(standardConversation.messages).toHaveLength(3);
      expect(standardConversation.messages[0].role).toBe('user');
      expect(standardConversation.messages[1].role).toBe('assistant');
      expect(standardConversation.id).toMatch(/^google_ai_conv_/);
      expect(standardConversation.context?.domain).toBe('general');
    });
  });

  describe('Ad Injection', () => {
    beforeEach(async () => {
      const config = AdapterTestUtils.createMockGoogleAIConfig();
      await adapter.initialize(config);
    });

    it('should inject ad into Google AI response', () => {
      const response = AdapterTestUtils.createMockGoogleAIResponse();
      const ad = AdapterTestUtils.createMockAd().content;

      const modifiedResponse = adapter.injectAd(response, ad);

      expect(modifiedResponse.candidates[0].content.parts[0].text).toContain('Learn React State Management');
      expect(modifiedResponse.candidates[0].content.parts[0].text).toContain('Start Learning');
      expect(modifiedResponse.candidates[0].content.parts[0].text).toContain('TechEdu');
      expect(modifiedResponse.candidates[0].metadata?.adInjected).toBe(true);
    });

    it('should inject ad into Google AI message', () => {
      const message = {
        role: 'model' as const,
        parts: [{ text: 'Here is my response to your question.' }]
      };
      const ad = AdapterTestUtils.createMockAd().content;

      const modifiedMessage = adapter.injectAdIntoMessage(message, ad);

      expect(modifiedMessage.parts[0].text).toContain('Here is my response to your question.');
      expect(modifiedMessage.parts[0].text).toContain('Learn React State Management');
      expect(modifiedMessage.parts[0].text).toContain('🚀');
    });

    it('should handle empty parts array', () => {
      const message = {
        role: 'model' as const,
        parts: []
      };
      const ad = AdapterTestUtils.createMockAd().content;

      const modifiedMessage = adapter.injectAdIntoMessage(message, ad);

      expect(modifiedMessage.parts).toHaveLength(1);
      expect(modifiedMessage.parts[0].text).toContain('Learn React State Management');
    });

    it('should handle ad injection errors gracefully', () => {
      const invalidResponse = null as any;
      const ad = AdapterTestUtils.createMockAd().content;

      expect(() => adapter.injectAd(invalidResponse, ad)).toThrow(AdapterError);
    });
  });

  describe('Context Analysis', () => {
    beforeEach(async () => {
      const config = AdapterTestUtils.createMockGoogleAIConfig();
      await adapter.initialize(config);
    });

    it('should extract conversation context', () => {
      const conversation = AdapterTestUtils.createMockGoogleAIConversation();
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
      const config = AdapterTestUtils.createMockGoogleAIConfig();
      await adapter.initialize(config);
    });

    it('should show ads for appropriate contexts', () => {
      const context = {
        confidence: 0.8,
        userEngagement: { score: 0.7 },
        topics: [{ name: 'technology', confidence: 0.8 }],
        conversationStage: { messageCount: 3 },
        conversationContext: { complexity: 'moderate' }
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

    it('should not show ads for technical content with high engagement', () => {
      const context = {
        confidence: 0.8,
        userEngagement: { score: 0.7 },
        topics: [{ name: 'programming tutorial', confidence: 0.8 }],
        conversationStage: { messageCount: 3 }
      };

      expect(adapter.shouldShowAd(context)).toBe(false);
    });

    it('should not show ads for very complex conversations', () => {
      const context = {
        confidence: 0.8,
        userEngagement: { score: 0.7 },
        topics: [{ name: 'technology', confidence: 0.8 }],
        conversationStage: { messageCount: 3 },
        conversationContext: { complexity: 'very_complex' }
      };

      expect(adapter.shouldShowAd(context)).toBe(false);
    });
  });

  describe('Message Interception', () => {
    beforeEach(async () => {
      const config = AdapterTestUtils.createMockGoogleAIConfig();
      await adapter.initialize(config);
    });

    it('should intercept messages and potentially inject ads', async () => {
      const message = {
        role: 'user' as const,
        parts: [{ text: 'I need help with React state management for my e-commerce project' }]
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
      const config = AdapterTestUtils.createMockGoogleAIConfig();
      await adapter.initialize(config);
    });

    it('should process responses and inject ads when appropriate', async () => {
      const response = AdapterTestUtils.createMockGoogleAIResponse();
      const context = {
        confidence: 0.8,
        userEngagement: { score: 0.7 },
        topics: [{ name: 'technology', confidence: 0.8 }],
        conversationStage: { messageCount: 3 }
      };

      const result = await adapter.processResponse(response, context);

      expect(result).toBeDefined();
    });

    it('should handle processing errors gracefully', async () => {
      const response = AdapterTestUtils.createMockGoogleAIResponse();
      const invalidContext = null;

      const result = await adapter.processResponse(response, invalidContext);

      expect(result).toBe(response);
    });
  });

  describe('Static Factory Methods', () => {
    it('should create Express middleware', () => {
      const config = AdapterTestUtils.createMockGoogleAIConfig();
      const middleware = GoogleAIAdapter.createExpressMiddleware(config);

      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBe(3);
    });

    it('should create response interceptor', () => {
      const config = AdapterTestUtils.createMockGoogleAIConfig();
      const interceptor = GoogleAIAdapter.createResponseInterceptor(config);

      expect(typeof interceptor).toBe('function');
      expect(interceptor.length).toBe(3);
    });

    it('should create client wrapper', () => {
      const config = AdapterTestUtils.createMockGoogleAIConfig();
      const wrapper = GoogleAIAdapter.createClientWrapper(config);

      expect(wrapper).toHaveProperty('initialize');
      expect(wrapper).toHaveProperty('generateContent');
      expect(wrapper).toHaveProperty('destroy');
      expect(typeof wrapper.initialize).toBe('function');
      expect(typeof wrapper.generateContent).toBe('function');
      expect(typeof wrapper.destroy).toBe('function');
    });

    it('should create Cloud Function handler', () => {
      const config = AdapterTestUtils.createMockGoogleAIConfig();
      const handler = GoogleAIAdapter.createCloudFunctionHandler(config);

      expect(typeof handler).toBe('function');
      expect(handler.length).toBe(2); // req, res
    });

    it('should create Firebase Function handler', () => {
      const config = AdapterTestUtils.createMockGoogleAIConfig();
      const handler = GoogleAIAdapter.createFirebaseFunctionHandler(config);

      expect(typeof handler).toBe('function');
      expect(handler.length).toBe(2); // data, context
    });

    it('should create stream handler', () => {
      const config = AdapterTestUtils.createMockGoogleAIConfig();
      const handler = GoogleAIAdapter.createStreamHandler(config);

      expect(typeof handler).toBe('function');
    });

    it('should create Vertex AI handler', () => {
      const config = AdapterTestUtils.createMockGoogleAIConfig();
      const handler = GoogleAIAdapter.createVertexAIHandler(config);

      expect(handler).toHaveProperty('initialize');
      expect(handler).toHaveProperty('predict');
      expect(handler).toHaveProperty('destroy');
      expect(typeof handler.initialize).toBe('function');
      expect(typeof handler.predict).toBe('function');
      expect(typeof handler.destroy).toBe('function');
    });
  });

  describe('Streaming Support', () => {
    beforeEach(async () => {
      const config = AdapterTestUtils.createMockGoogleAIConfig();
      await adapter.initialize(config);
    });

    it('should handle streaming responses', async () => {
      const config = AdapterTestUtils.createMockGoogleAIConfig();
      const streamHandler = GoogleAIAdapter.createStreamHandler(config);

      // Mock stream data
      const mockStream = async function* () {
        yield {
          candidates: [{
            content: { role: 'model', parts: [{ text: 'Hello' }] },
            finishReason: null
          }]
        };
        yield {
          candidates: [{
            content: { role: 'model', parts: [{ text: ' world' }] },
            finishReason: 'STOP'
          }]
        };
      };

      const results = [];
      for await (const chunk of streamHandler(mockStream())) {
        results.push(chunk);
      }

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Vertex AI Integration', () => {
    it('should handle Vertex AI predictions', async () => {
      const config = AdapterTestUtils.createMockGoogleAIConfig();
      const vertexHandler = GoogleAIAdapter.createVertexAIHandler(config);

      await vertexHandler.initialize();

      const instances = [
        { content: 'Hello, how can I help you?' },
        { prompt: 'What is machine learning?' }
      ];

      const result = await vertexHandler.predict(instances);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should transform Vertex AI instances correctly', () => {
      const config = AdapterTestUtils.createMockGoogleAIConfig();
      const vertexHandler = GoogleAIAdapter.createVertexAIHandler(config);

      const instances = [
        { content: 'Hello world' },
        { prompt: 'Test prompt' }
      ];

      const conversation = vertexHandler.transformVertexAIToConversation(instances);

      expect(conversation.contents).toHaveLength(2);
      expect(conversation.contents[0].parts[0].text).toBe('Hello world');
      expect(conversation.contents[1].parts[0].text).toBe('Test prompt');
    });
  });

  describe('Error Handling', () => {
    it('should throw appropriate errors for initialization failures', async () => {
      const config = AdapterTestUtils.createMockGoogleAIConfig({
        platformConfig: {
          ...AdapterTestUtils.createMockGoogleAIConfig().platformConfig,
          apiKey: ''
        }
      });

      await expect(adapter.initialize(config)).rejects.toThrow(AdapterError);
    });

    it('should handle API quota exceeded', async () => {
      global.fetch = AdapterTestUtils.createMockFailedFetch(429, 'Quota Exceeded');
      const config = AdapterTestUtils.createMockGoogleAIConfig();

      await expect(adapter.initialize(config)).rejects.toThrow(AdapterError);
    });

    it('should handle safety filter errors', async () => {
      const mockResponse = {
        candidates: [{
          content: null,
          finishReason: 'SAFETY',
          safetyRatings: [
            { category: 'HARM_CATEGORY_HARASSMENT', probability: 'HIGH' }
          ]
        }]
      };

      global.fetch = AdapterTestUtils.createMockFetch({
        'POST https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=test-google-ai-key-123456789': mockResponse
      });

      const config = AdapterTestUtils.createMockGoogleAIConfig();
      await adapter.initialize(config);

      // Should handle safety-filtered responses gracefully
      const conversation = AdapterTestUtils.createMockGoogleAIConversation();
      const context = adapter.extractConversationContext(conversation);
      
      expect(context).toBeDefined();
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources on destroy', async () => {
      const config = AdapterTestUtils.createMockGoogleAIConfig();
      await adapter.initialize(config);

      expect(() => adapter.destroy()).not.toThrow();
    });

    it('should handle multiple destroy calls gracefully', async () => {
      const config = AdapterTestUtils.createMockGoogleAIConfig();
      await adapter.initialize(config);

      adapter.destroy();
      expect(() => adapter.destroy()).not.toThrow();
    });
  });
});