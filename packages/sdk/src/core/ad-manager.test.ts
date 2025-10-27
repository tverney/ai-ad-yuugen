import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AdManager, AdRequestBuilder, AdResponseParser, AdManagerConfig } from './ad-manager';
import {
  AdPlacement,
  AdType,
  AdFormat,
  AdPosition,
  AIContext,
  UserProfile,
  PrivacySettings,
  FallbackStrategy,
  AdRequestErrorType
} from '@ai-yuugen/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock navigator and screen
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    language: 'en-US'
  },
  writable: true
});

Object.defineProperty(global, 'screen', {
  value: {
    width: 1920,
    height: 1080
  },
  writable: true
});

// Mock Intl.DateTimeFormat
Object.defineProperty(global, 'Intl', {
  value: {
    DateTimeFormat: () => ({
      resolvedOptions: () => ({ timeZone: 'America/New_York' })
    })
  },
  writable: true
});

describe('AdRequestBuilder', () => {
  let builder: AdRequestBuilder;
  let mockPlacement: AdPlacement;
  let mockContext: AIContext;
  let mockPrivacySettings: PrivacySettings;

  beforeEach(() => {
    builder = new AdRequestBuilder();
    
    mockPlacement = {
      id: 'test-placement',
      type: AdType.BANNER,
      format: AdFormat.DISPLAY,
      size: { width: 300, height: 250 },
      position: AdPosition.TOP
    };

    mockContext = {
      topics: [{ name: 'technology', category: 'tech', confidence: 0.8, keywords: ['ai'], relevanceScore: 0.9 }],
      intent: { primary: 'learn', confidence: 0.7, category: 'informational' as any, actionable: true },
      sentiment: { polarity: 0.5, magnitude: 0.6, label: 'positive' as any, confidence: 0.8 },
      conversationStage: { stage: 'exploration' as any, progress: 0.3, duration: 30000, messageCount: 5 },
      userEngagement: { score: 0.7, level: 'high' as any, indicators: [], trend: 'stable' as any },
      confidence: 0.8,
      extractedAt: new Date()
    };

    mockPrivacySettings = {
      consentStatus: {
        advertising: true,
        analytics: true,
        personalization: false,
        dataSharing: false,
        timestamp: new Date(),
        jurisdiction: 'US',
        version: '1.0',
        consentMethod: 'explicit' as any
      },
      dataRetentionPeriod: 30,
      privacyLevel: 'standard' as any,
      dataProcessingBasis: 'consent' as any,
      optOutRequests: [],
      complianceFlags: [],
      encryptionEnabled: true,
      anonymizationLevel: 'pseudonymization' as any
    };
  });

  it('should build a valid ad request with all required fields', () => {
    const deviceInfo = {
      userAgent: 'test-agent',
      screenWidth: 1920,
      screenHeight: 1080,
      deviceType: 'desktop' as any,
      platform: 'macOS',
      language: 'en-US',
      timezone: 'America/New_York'
    };

    const request = builder
      .setPlacement(mockPlacement)
      .setContext(mockContext)
      .setPrivacySettings(mockPrivacySettings)
      .setDeviceInfo(deviceInfo)
      .setSessionId('test-session')
      .build();

    expect(request.placementId).toBe('test-placement');
    expect(request.context).toBe(mockContext);
    expect(request.privacySettings).toBe(mockPrivacySettings);
    expect(request.deviceInfo).toBe(deviceInfo);
    expect(request.sessionId).toBe('test-session');
    expect(request.requestId).toMatch(/^req_\d+_[a-z0-9]+$/);
    expect(request.timestamp).toBeInstanceOf(Date);
  });

  it('should throw error when placement is missing', () => {
    expect(() => {
      builder
        .setContext(mockContext)
        .setPrivacySettings(mockPrivacySettings)
        .setDeviceInfo({} as any)
        .setSessionId('test-session')
        .build();
    }).toThrow('Placement is required for ad request');
  });

  it('should throw error when context is missing', () => {
    expect(() => {
      builder
        .setPlacement(mockPlacement)
        .setPrivacySettings(mockPrivacySettings)
        .setDeviceInfo({} as any)
        .setSessionId('test-session')
        .build();
    }).toThrow('Context is required for ad request');
  });

  it('should throw error when privacy settings are missing', () => {
    expect(() => {
      builder
        .setPlacement(mockPlacement)
        .setContext(mockContext)
        .setDeviceInfo({} as any)
        .setSessionId('test-session')
        .build();
    }).toThrow('Privacy settings are required for ad request');
  });

  it('should include user profile when provided', () => {
    const userProfile: UserProfile = {
      id: 'user-123',
      interests: [],
      behaviorHistory: [],
      aiInteractionHistory: [],
      createdAt: new Date(),
      lastUpdated: new Date()
    };

    const request = builder
      .setPlacement(mockPlacement)
      .setContext(mockContext)
      .setUserProfile(userProfile)
      .setPrivacySettings(mockPrivacySettings)
      .setDeviceInfo({} as any)
      .setSessionId('test-session')
      .build();

    expect(request.userProfile).toBe(userProfile);
  });
});

describe('AdResponseParser', () => {
  it('should parse valid ad response', () => {
    const rawResponse = {
      requestId: 'req-123',
      ads: [{
        id: 'ad-123',
        type: 'banner',
        format: 'display',
        content: {
          title: 'Test Ad',
          description: 'Test Description',
          ctaText: 'Click Here',
          landingUrl: 'https://example.com',
          brandName: 'Test Brand'
        },
        createdAt: '2023-01-01T00:00:00Z',
        expiresAt: '2023-01-02T00:00:00Z'
      }],
      metadata: {
        processingTime: 100,
        targetingScore: 0.8
      },
      timestamp: '2023-01-01T00:00:00Z',
      ttl: 300
    };

    const response = AdResponseParser.parseResponse(rawResponse);

    expect(response.requestId).toBe('req-123');
    expect(response.ads).toHaveLength(1);
    expect(response.ads[0].id).toBe('ad-123');
    expect(response.metadata.processingTime).toBe(100);
    expect(response.timestamp).toBeInstanceOf(Date);
    expect(response.ttl).toBe(300);
  });

  it('should parse response with fallback ads', () => {
    const rawResponse = {
      requestId: 'req-123',
      ads: [],
      fallbackAds: [{
        id: 'fallback-ad-123',
        type: 'banner',
        format: 'display',
        content: {
          title: 'Fallback Ad',
          description: 'Fallback Description',
          ctaText: 'Click Here',
          landingUrl: 'https://example.com',
          brandName: 'Fallback Brand'
        },
        createdAt: '2023-01-01T00:00:00Z',
        expiresAt: '2023-01-02T00:00:00Z'
      }],
      metadata: {
        processingTime: 50,
        targetingScore: 0.5
      },
      timestamp: '2023-01-01T00:00:00Z',
      ttl: 300
    };

    const response = AdResponseParser.parseResponse(rawResponse);

    expect(response.fallbackAds).toHaveLength(1);
    expect(response.fallbackAds![0].id).toBe('fallback-ad-123');
  });

  it('should throw error for invalid response format', () => {
    expect(() => {
      AdResponseParser.parseResponse(null);
    }).toThrow('Invalid response format: response must be an object');

    expect(() => {
      AdResponseParser.parseResponse('invalid');
    }).toThrow('Invalid response format: response must be an object');
  });

  it('should throw error for missing requestId', () => {
    const rawResponse = {
      ads: [],
      metadata: { processingTime: 100, targetingScore: 0.8 },
      timestamp: '2023-01-01T00:00:00Z',
      ttl: 300
    };

    expect(() => {
      AdResponseParser.parseResponse(rawResponse);
    }).toThrow('Invalid response: requestId is required and must be a string');
  });

  it('should throw error for invalid ads array', () => {
    const rawResponse = {
      requestId: 'req-123',
      ads: 'not-an-array',
      metadata: { processingTime: 100, targetingScore: 0.8 },
      timestamp: '2023-01-01T00:00:00Z',
      ttl: 300
    };

    expect(() => {
      AdResponseParser.parseResponse(rawResponse);
    }).toThrow('Invalid response: ads must be an array');
  });

  it('should throw error for invalid ad content', () => {
    const rawResponse = {
      requestId: 'req-123',
      ads: [{
        id: 'ad-123',
        type: 'banner',
        format: 'display',
        content: {
          title: 'Test Ad',
          description: 'Test Description',
          ctaText: 'Click Here',
          landingUrl: 'invalid-url',
          brandName: 'Test Brand'
        },
        createdAt: '2023-01-01T00:00:00Z',
        expiresAt: '2023-01-02T00:00:00Z'
      }],
      metadata: { processingTime: 100, targetingScore: 0.8 },
      timestamp: '2023-01-01T00:00:00Z',
      ttl: 300
    };

    expect(() => {
      AdResponseParser.parseResponse(rawResponse);
    }).toThrow('Invalid ad at index 0: Ad content landingUrl must be a valid URL');
  });

  it('should throw error for invalid metadata', () => {
    const rawResponse = {
      requestId: 'req-123',
      ads: [],
      metadata: {
        processingTime: -1,
        targetingScore: 0.8
      },
      timestamp: '2023-01-01T00:00:00Z',
      ttl: 300
    };

    expect(() => {
      AdResponseParser.parseResponse(rawResponse);
    }).toThrow('Metadata processingTime must be a non-negative number');
  });
});

describe('AdManager', () => {
  let adManager: AdManager;
  let mockConfig: AdManagerConfig;
  let mockPlacement: AdPlacement;
  let mockContext: AIContext;

  beforeEach(() => {
    mockConfig = {
      baseUrl: 'https://test-api.example.com',
      apiKey: 'test-api-key',
      timeout: 5000,
      retryAttempts: 3,
      fallbackConfig: {
        enabled: true,
        maxRetries: 3,
        retryDelay: 1000,
        fallbackAds: [{
          id: 'fallback-ad',
          type: AdType.BANNER,
          format: AdFormat.DISPLAY,
          content: {
            title: 'Fallback Ad',
            description: 'Default fallback ad',
            ctaText: 'Learn More',
            landingUrl: 'https://example.com',
            brandName: 'Default Brand'
          },
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 86400000)
        }],
        fallbackStrategy: FallbackStrategy.DEFAULT_ADS
      },
      debugMode: false
    };

    adManager = new AdManager(mockConfig);

    mockPlacement = {
      id: 'test-placement',
      type: AdType.BANNER,
      format: AdFormat.DISPLAY,
      size: { width: 300, height: 250 },
      position: AdPosition.TOP
    };

    mockContext = {
      topics: [{ name: 'technology', category: 'tech', confidence: 0.8, keywords: ['ai'], relevanceScore: 0.9 }],
      intent: { primary: 'learn', confidence: 0.7, category: 'informational' as any, actionable: true },
      sentiment: { polarity: 0.5, magnitude: 0.6, label: 'positive' as any, confidence: 0.8 },
      conversationStage: { stage: 'exploration' as any, progress: 0.3, duration: 30000, messageCount: 5 },
      userEngagement: { score: 0.7, level: 'high' as any, indicators: [], trend: 'stable' as any },
      confidence: 0.8,
      extractedAt: new Date()
    };

    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should create request builder', () => {
    const builder = adManager.createRequestBuilder();
    expect(builder).toBeInstanceOf(AdRequestBuilder);
  });

  it('should successfully request ad with valid response', async () => {
    const mockResponse = {
      requestId: 'req-123',
      ads: [{
        id: 'ad-123',
        type: 'banner',
        format: 'display',
        content: {
          title: 'Test Ad',
          description: 'Test Description',
          ctaText: 'Click Here',
          landingUrl: 'https://example.com',
          brandName: 'Test Brand'
        },
        createdAt: '2023-01-01T00:00:00Z',
        expiresAt: '2023-01-02T00:00:00Z'
      }],
      metadata: {
        processingTime: 100,
        targetingScore: 0.8
      },
      timestamp: '2023-01-01T00:00:00Z',
      ttl: 300
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const ad = await adManager.requestAd(mockPlacement, mockContext);

    expect(ad.id).toBe('ad-123');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://test-api.example.com/ads/request',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-api-key'
        })
      })
    );
  });

  it('should handle network error with fallback', async () => {
    // Create a manager with no retries to avoid timeout
    const noRetryConfig = { 
      ...mockConfig, 
      debugMode: true,
      fallbackConfig: {
        ...mockConfig.fallbackConfig,
        maxRetries: 0 // Disable retries for this test
      }
    };
    const noRetryAdManager = new AdManager(noRetryConfig);
    
    mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

    const ad = await noRetryAdManager.requestAd(mockPlacement, mockContext);

    expect(ad.id).toBe('fallback-ad');
    expect(ad.content.title).toBe('Fallback Ad');
  });

  it('should handle timeout with fallback', async () => {
    // Mock a request that takes longer than the timeout
    mockFetch.mockImplementationOnce(() => 
      new Promise((resolve) => {
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({})
        }), 10000);
      })
    );

    const ad = await adManager.requestAd(mockPlacement, mockContext);
    expect(ad.id).toBe('fallback-ad');
  }, 10000);

  it('should handle HTTP error responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'No ads available' })
    });

    const ad = await adManager.requestAd(mockPlacement, mockContext);
    expect(ad.id).toBe('fallback-ad');
  });

  it('should handle empty ads response with fallback', async () => {
    const mockResponse = {
      requestId: 'req-123',
      ads: [],
      metadata: {
        processingTime: 100,
        targetingScore: 0.8
      },
      timestamp: '2023-01-01T00:00:00Z',
      ttl: 300
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const ad = await adManager.requestAd(mockPlacement, mockContext);
    expect(ad.id).toBe('fallback-ad');
  });

  it('should retry on retryable errors', async () => {
    // Create manager with limited retries and shorter delay
    const retryConfig = {
      ...mockConfig,
      debugMode: true,
      fallbackConfig: {
        ...mockConfig.fallbackConfig,
        maxRetries: 1, // Only 1 retry to avoid timeout
        retryDelay: 10 // Very short delay
      }
    };
    const retryAdManager = new AdManager(retryConfig);

    // First call fails with network error, second succeeds
    mockFetch
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          requestId: 'req-123',
          ads: [{
            id: 'retry-ad',
            type: 'banner',
            format: 'display',
            content: {
              title: 'Retry Ad',
              description: 'Ad after retry',
              ctaText: 'Click Here',
              landingUrl: 'https://example.com',
              brandName: 'Retry Brand'
            },
            createdAt: '2023-01-01T00:00:00Z',
            expiresAt: '2023-01-02T00:00:00Z'
          }],
          metadata: { processingTime: 100, targetingScore: 0.8 },
          timestamp: '2023-01-01T00:00:00Z',
          ttl: 300
        })
      });

    const ad = await retryAdManager.requestAd(mockPlacement, mockContext);
    expect(ad.id).toBe('retry-ad');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should use cached ads when available', async () => {
    // Configure for cached ads fallback with no retries
    const cachedConfig = {
      ...mockConfig,
      debugMode: true,
      fallbackConfig: {
        ...mockConfig.fallbackConfig,
        fallbackStrategy: FallbackStrategy.CACHED_ADS,
        maxRetries: 0 // Disable retries to avoid timeout
      }
    };
    const cachedAdManager = new AdManager(cachedConfig);

    // First request succeeds and caches response
    const mockResponse = {
      requestId: 'req-123',
      ads: [{
        id: 'cached-ad',
        type: 'banner',
        format: 'display',
        content: {
          title: 'Cached Ad',
          description: 'This ad is cached',
          ctaText: 'Click Here',
          landingUrl: 'https://example.com',
          brandName: 'Cached Brand'
        },
        createdAt: '2023-01-01T00:00:00Z',
        expiresAt: '2023-01-02T00:00:00Z'
      }],
      metadata: { processingTime: 100, targetingScore: 0.8 },
      timestamp: '2023-01-01T00:00:00Z',
      ttl: 300
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    // First request to populate cache
    const firstAd = await cachedAdManager.requestAd(mockPlacement, mockContext);
    expect(firstAd.id).toBe('cached-ad');

    // Second request fails but should use cached ad
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    
    const ad = await cachedAdManager.requestAd(mockPlacement, mockContext);
    expect(ad.id).toBe('cached-ad');
    expect(ad.content.title).toBe('Cached Ad');
  });

  it('should throw error when fallback is disabled', async () => {
    const noFallbackConfig = {
      ...mockConfig,
      fallbackConfig: {
        ...mockConfig.fallbackConfig,
        enabled: false
      }
    };
    const noFallbackManager = new AdManager(noFallbackConfig);

    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(noFallbackManager.requestAd(mockPlacement, mockContext))
      .rejects.toThrow('Network error');
  });

  it('should create AdManager from SDK config', () => {
    const sdkConfig = {
      apiKey: 'test-key',
      environment: 'development' as const,
      timeout: 3000,
      retryAttempts: 2,
      debugMode: true
    };

    const manager = AdManager.fromSDKConfig(sdkConfig);
    expect(manager).toBeInstanceOf(AdManager);
  });

  it('should detect device type correctly', () => {
    // Test mobile detection
    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        language: 'en-US'
      },
      writable: true
    });

    Object.defineProperty(global, 'screen', {
      value: { width: 375, height: 812 },
      writable: true
    });

    const mobileManager = new AdManager(mockConfig);
    const builder = mobileManager.createRequestBuilder();
    
    const request = builder
      .setPlacement(mockPlacement)
      .setContext(mockContext)
      .setPrivacySettings({} as any)
      .setDeviceInfo({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        screenWidth: 375,
        screenHeight: 812,
        deviceType: 'mobile' as any,
        platform: 'iOS',
        language: 'en-US',
        timezone: 'America/New_York'
      })
      .setSessionId('test-session')
      .build();

    expect(request.deviceInfo.deviceType).toBe('mobile');
  });
});