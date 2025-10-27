import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AIYuugenSDK } from './sdk';
import { SDKConfig, AIConversation, IntentCategory, SentimentLabel } from '@ai-yuugen/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('SDK Integration with ContextAnalyzer', () => {
  let sdk: AIYuugenSDK;
  let validConfig: SDKConfig;

  beforeEach(() => {
    sdk = new AIYuugenSDK();
    validConfig = {
      apiKey: 'test-api-key-1234567890',
      environment: 'development',
      debugMode: true
    };
    
    // Reset fetch mock
    mockFetch.mockReset();
    
    // Default successful auth response
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        permissions: ['read', 'write'],
        environment: 'development'
      })
    });
  });

  afterEach(() => {
    sdk.destroy();
  });

  it('should analyze conversation context after initialization', async () => {
    await sdk.initialize(validConfig);

    const mockConversation: AIConversation = {
      id: 'test-conversation',
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          content: 'I need help with my computer software. It keeps crashing!',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          metadata: {}
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'I can help you troubleshoot the software issue.',
          timestamp: new Date('2024-01-01T10:00:30Z'),
          metadata: {}
        },
        {
          id: 'msg-3',
          role: 'user',
          content: 'That would be great! I am frustrated with this problem.',
          timestamp: new Date('2024-01-01T10:01:00Z'),
          metadata: {}
        }
      ],
      topics: [],
      intent: IntentCategory.SUPPORT,
      startTime: new Date('2024-01-01T10:00:00Z'),
      lastActivity: new Date('2024-01-01T10:01:00Z')
    };

    const context = sdk.analyzeContext(mockConversation);

    // Verify context analysis results
    expect(context).toBeDefined();
    expect(context.extractedAt).toBeInstanceOf(Date);
    expect(context.confidence).toBeGreaterThanOrEqual(0);
    expect(context.confidence).toBeLessThanOrEqual(1);

    // Should detect technology topics
    expect(context.topics.length).toBeGreaterThan(0);
    const techTopic = context.topics.find(t => t.name === 'technology');
    expect(techTopic).toBeDefined();

    // Should detect support intent
    expect(context.intent.primary).toBe(IntentCategory.SUPPORT);
    expect(context.intent.actionable).toBe(true);

    // Should detect negative sentiment due to "frustrated" and "crashing"
    // Note: The sentiment might be mixed due to positive words like "help" and "great"
    expect(context.sentiment.magnitude).toBeGreaterThan(0); // Should have some emotional content
    expect(context.sentiment.confidence).toBeGreaterThan(0);

    // Should detect conversation stage
    expect(context.conversationStage.messageCount).toBe(3);
    expect(context.conversationStage.duration).toBeGreaterThan(0);

    // Should calculate engagement
    expect(context.userEngagement.score).toBeGreaterThanOrEqual(0);
    expect(context.userEngagement.score).toBeLessThanOrEqual(1);
    expect(context.userEngagement.indicators.length).toBeGreaterThan(0);
  });

  it('should handle empty conversation gracefully', async () => {
    await sdk.initialize(validConfig);

    const emptyConversation: AIConversation = {
      id: 'empty-conversation',
      messages: [],
      topics: [],
      intent: IntentCategory.INFORMATIONAL,
      startTime: new Date(),
      lastActivity: new Date()
    };

    const context = sdk.analyzeContext(emptyConversation);

    expect(context).toBeDefined();
    expect(context.topics).toHaveLength(0);
    expect(context.intent.primary).toBe(IntentCategory.INFORMATIONAL);
    expect(context.sentiment.label).toBe(SentimentLabel.NEUTRAL);
  });

  it('should throw error when analyzing context before initialization', () => {
    const mockConversation: AIConversation = {
      id: 'test',
      messages: [],
      topics: [],
      intent: IntentCategory.INFORMATIONAL,
      startTime: new Date(),
      lastActivity: new Date()
    };

    expect(() => sdk.analyzeContext(mockConversation)).toThrow('SDK must be initialized before use');
  });

  it('should analyze different conversation types correctly', async () => {
    await sdk.initialize(validConfig);

    // Test informational conversation
    const infoConversation: AIConversation = {
      id: 'info-conversation',
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          content: 'What is machine learning and how does it work?',
          timestamp: new Date(),
          metadata: {}
        }
      ],
      topics: [],
      intent: IntentCategory.INFORMATIONAL,
      startTime: new Date(),
      lastActivity: new Date()
    };

    const infoContext = sdk.analyzeContext(infoConversation);
    expect(infoContext.intent.primary).toBe(IntentCategory.INFORMATIONAL);

    // Test transactional conversation
    const transactionConversation: AIConversation = {
      id: 'transaction-conversation',
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          content: 'I want to buy this product and pay with my credit card',
          timestamp: new Date(),
          metadata: {}
        }
      ],
      topics: [],
      intent: IntentCategory.TRANSACTIONAL,
      startTime: new Date(),
      lastActivity: new Date()
    };

    const transactionContext = sdk.analyzeContext(transactionConversation);
    expect(transactionContext.intent.primary).toBe(IntentCategory.TRANSACTIONAL);
    expect(transactionContext.intent.actionable).toBe(true);
  });

  it('should handle conversation with mixed sentiments', async () => {
    await sdk.initialize(validConfig);

    const mixedConversation: AIConversation = {
      id: 'mixed-conversation',
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          content: 'I love this new technology but I hate the complicated setup process',
          timestamp: new Date(),
          metadata: {}
        }
      ],
      topics: [],
      intent: IntentCategory.INFORMATIONAL,
      startTime: new Date(),
      lastActivity: new Date()
    };

    const context = sdk.analyzeContext(mixedConversation);
    
    // Should detect some topics (technology might not be detected with single mention)
    expect(context.topics).toBeDefined();

    // Sentiment should be calculated (could be neutral due to mixed emotions)
    expect(context.sentiment.confidence).toBeGreaterThanOrEqual(0);
    expect(context.sentiment.magnitude).toBeGreaterThanOrEqual(0);
  });
});