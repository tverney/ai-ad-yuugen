import { vi, vi } from 'vitest';
import {
  AdapterIntegrationConfig,
  AIPlatform,
  DeploymentEnvironment,
  IntegrationPattern,
  OpenAIAdapterConfig,
  AnthropicAdapterConfig,
  GoogleAIAdapterConfig
} from '../types';

/**
 * Test utilities for adapter testing
 */
export class AdapterTestUtils {
  /**
   * Create mock OpenAI adapter configuration
   */
  static createMockOpenAIConfig(overrides: Partial<AdapterIntegrationConfig> = {}): AdapterIntegrationConfig {
    return {
      platform: AIPlatform.OPENAI,
      environment: DeploymentEnvironment.CLIENT_SIDE,
      pattern: IntegrationPattern.WRAPPER,
      adSenseConfig: {
        apiKey: 'test-yuugen-api-key',
        placementIds: ['test-placement-1', 'test-placement-2'],
        enableContextAnalysis: true,
        enablePrivacyMode: true,
        enableAnalytics: true
      },
      platformConfig: {
        apiKey: 'sk-test-openai-key-123456789',
        environment: 'development',
        model: 'gpt-3.5-turbo',
        maxTokens: 1000,
        temperature: 0.7,
        timeout: 30000,
        retryAttempts: 3,
        debugMode: true
      } as OpenAIAdapterConfig,
      ...overrides
    };
  }

  /**
   * Create mock Anthropic adapter configuration
   */
  static createMockAnthropicConfig(overrides: Partial<AdapterIntegrationConfig> = {}): AdapterIntegrationConfig {
    return {
      platform: AIPlatform.ANTHROPIC,
      environment: DeploymentEnvironment.CLIENT_SIDE,
      pattern: IntegrationPattern.WRAPPER,
      adSenseConfig: {
        apiKey: 'test-yuugen-api-key',
        placementIds: ['test-placement-1', 'test-placement-2'],
        enableContextAnalysis: true,
        enablePrivacyMode: true,
        enableAnalytics: true
      },
      platformConfig: {
        apiKey: 'sk-ant-test-anthropic-key-123456789',
        environment: 'development',
        model: 'claude-3-sonnet-20240229',
        maxTokens: 1000,
        temperature: 0.7,
        topP: 0.9,
        timeout: 30000,
        retryAttempts: 3,
        debugMode: true
      } as AnthropicAdapterConfig,
      ...overrides
    };
  }

  /**
   * Create mock Google AI adapter configuration
   */
  static createMockGoogleAIConfig(overrides: Partial<AdapterIntegrationConfig> = {}): AdapterIntegrationConfig {
    return {
      platform: AIPlatform.GOOGLE_AI,
      environment: DeploymentEnvironment.CLIENT_SIDE,
      pattern: IntegrationPattern.WRAPPER,
      adSenseConfig: {
        apiKey: 'test-yuugen-api-key',
        placementIds: ['test-placement-1', 'test-placement-2'],
        enableContextAnalysis: true,
        enablePrivacyMode: true,
        enableAnalytics: true
      },
      platformConfig: {
        apiKey: 'test-google-ai-key-123456789',
        environment: 'development',
        model: 'gemini-pro',
        projectId: 'test-project',
        location: 'us-central1',
        maxTokens: 1000,
        temperature: 0.7,
        timeout: 30000,
        retryAttempts: 3,
        debugMode: true
      } as GoogleAIAdapterConfig,
      ...overrides
    };
  }

  /**
   * Create mock OpenAI conversation
   */
  static createMockOpenAIConversation() {
    return {
      messages: [
        { role: 'user' as const, content: 'Hello, I need help with my project' },
        { role: 'assistant' as const, content: 'I\'d be happy to help you with your project. What kind of project are you working on?' },
        { role: 'user' as const, content: 'I\'m building a web application using React and need advice on state management' }
      ],
      model: 'gpt-3.5-turbo',
      max_tokens: 1000,
      temperature: 0.7
    };
  }

  /**
   * Create mock Anthropic conversation
   */
  static createMockAnthropicConversation() {
    return {
      model: 'claude-3-sonnet-20240229',
      messages: [
        { role: 'user' as const, content: 'Hello, I need help with my project' },
        { role: 'assistant' as const, content: 'I\'d be happy to help you with your project. What kind of project are you working on?' },
        { role: 'user' as const, content: 'I\'m building a web application using React and need advice on state management' }
      ],
      max_tokens: 1000,
      temperature: 0.7
    };
  }

  /**
   * Create mock Google AI conversation
   */
  static createMockGoogleAIConversation() {
    return {
      contents: [
        { role: 'user' as const, parts: [{ text: 'Hello, I need help with my project' }] },
        { role: 'model' as const, parts: [{ text: 'I\'d be happy to help you with your project. What kind of project are you working on?' }] },
        { role: 'user' as const, parts: [{ text: 'I\'m building a web application using React and need advice on state management' }] }
      ],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7
      }
    };
  }

  /**
   * Create mock OpenAI response
   */
  static createMockOpenAIResponse() {
    return {
      id: 'chatcmpl-test123',
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-3.5-turbo',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant' as const,
            content: 'For React state management, I recommend considering Redux Toolkit for complex applications or React Context for simpler state needs.'
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: 50,
        completion_tokens: 25,
        total_tokens: 75
      }
    };
  }

  /**
   * Create mock Anthropic response
   */
  static createMockAnthropicResponse() {
    return {
      id: 'msg_test123',
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: 'For React state management, I recommend considering Redux Toolkit for complex applications or React Context for simpler state needs.'
        }
      ],
      model: 'claude-3-sonnet-20240229',
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: {
        input_tokens: 50,
        output_tokens: 25
      }
    };
  }

  /**
   * Create mock Google AI response
   */
  static createMockGoogleAIResponse() {
    return {
      candidates: [
        {
          content: {
            role: 'model' as const,
            parts: [
              {
                text: 'For React state management, I recommend considering Redux Toolkit for complex applications or React Context for simpler state needs.'
              }
            ]
          },
          finishReason: 'STOP',
          index: 0,
          safetyRatings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              probability: 'NEGLIGIBLE'
            }
          ]
        }
      ],
      usageMetadata: {
        promptTokenCount: 50,
        candidatesTokenCount: 25,
        totalTokenCount: 75
      }
    };
  }

  /**
   * Create mock ad content
   */
  static createMockAd() {
    return {
      id: 'ad-test-123',
      type: 'native' as const,
      format: 'text' as const,
      content: {
        id: 'ad-content-123',
        title: 'Learn React State Management',
        description: 'Master Redux, Context API, and modern state management patterns with our comprehensive course.',
        ctaText: 'Start Learning',
        landingUrl: 'https://example.com/react-course',
        brandName: 'TechEdu',
        imageUrl: 'https://example.com/course-image.jpg'
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    };
  }

  /**
   * Mock fetch function for testing
   */
  static createMockFetch(responses: Record<string, any> = {}) {
    return vi.fn((url: string, options?: any) => {
      const method = options?.method || 'GET';
      const key = `${method} ${url}`;
      
      if (responses[key]) {
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve(responses[key])
        });
      }

      // Default successful response
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({ success: true })
      });
    });
  }

  /**
   * Mock failed fetch function for testing error scenarios
   */
  static createMockFailedFetch(status: number = 500, statusText: string = 'Internal Server Error') {
    return vi.fn(() => {
      return Promise.resolve({
        ok: false,
        status,
        statusText,
        json: () => Promise.resolve({ error: statusText })
      });
    });
  }

  /**
   * Mock network error fetch function
   */
  static createMockNetworkErrorFetch() {
    return vi.fn(() => {
      return Promise.reject(new Error('Network error'));
    });
  }

  /**
   * Create mock AI Ad Yuugen SDK
   */
  static createMockAIYuugenSDK() {
    return {
      initialize: vi.fn().mockResolvedValue(undefined),
      requestAd: vi.fn().mockResolvedValue(AdapterTestUtils.createMockAd()),
      analyzeContext: vi.fn().mockReturnValue({
        topics: [
          { name: 'react', category: 'technology', confidence: 0.8, keywords: ['react'], relevanceScore: 0.8 },
          { name: 'programming', category: 'technology', confidence: 0.7, keywords: ['programming'], relevanceScore: 0.7 }
        ],
        intent: { primary: 'learning', confidence: 0.8, category: 'informational', actionable: true },
        sentiment: { polarity: 0.1, magnitude: 0.3, label: 'neutral', confidence: 0.6 },
        conversationStage: { stage: 'exploration', progress: 0.5, duration: 60000, messageCount: 3 },
        userEngagement: { score: 0.7, level: 'high', indicators: [], trend: 'stable' },
        confidence: 0.7,
        extractedAt: new Date()
      }),
      destroy: vi.fn(),
      displayAd: vi.fn(),
      hideAd: vi.fn(),
      updateUserContext: vi.fn(),
      setConsentStatus: vi.fn(),
      getPrivacySettings: vi.fn().mockReturnValue({
        consentStatus: {
          advertising: true,
          analytics: true,
          personalization: true,
          dataSharing: false,
          timestamp: new Date(),
          jurisdiction: 'US',
          version: '1.0',
          consentMethod: 'explicit'
        },
        dataRetentionPeriod: 365,
        privacyLevel: 'standard',
        dataProcessingBasis: 'consent',
        optOutRequests: [],
        complianceFlags: [],
        encryptionEnabled: true,
        anonymizationLevel: 'pseudonymization'
      }),
      trackEvent: vi.fn(),
      getPerformanceMetrics: vi.fn().mockResolvedValue({
        impressions: 100,
        clicks: 5,
        conversions: 1,
        ctr: 0.05,
        cpm: 2.5,
        revenue: 0.25,
        engagementScore: 0.7
      }),
      isInitialized: vi.fn().mockReturnValue(true),
      getConfig: vi.fn().mockReturnValue({
        apiKey: 'test-key',
        environment: 'development'
      })
    };
  }

  /**
   * Wait for a specified amount of time (for async testing)
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a spy on console methods for testing logging
   */
  static createConsoleSpy() {
    return {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      restore: () => {
        vi.restoreAllMocks();
      }
    };
  }
}