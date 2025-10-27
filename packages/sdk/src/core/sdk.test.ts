import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AIYuugenSDK, SDKError, SDKErrorType } from './sdk';
import { SDKConfig } from '@ai-yuugen/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AIYuugenSDK', () => {
  let sdk: AIYuugenSDK;
  let validConfig: SDKConfig;

  beforeEach(() => {
    sdk = new AIYuugenSDK();
    validConfig = {
      apiKey: 'test-api-key-1234567890',
      environment: 'development'
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

  describe('initialization', () => {
    it('should initialize with valid configuration', async () => {
      await expect(sdk.initialize(validConfig)).resolves.not.toThrow();
      expect(sdk.isInitialized()).toBe(true);
    });

    it('should prevent multiple simultaneous initializations', async () => {
      const promise1 = sdk.initialize(validConfig);
      const promise2 = sdk.initialize(validConfig);
      
      await Promise.all([promise1, promise2]);
      expect(sdk.isInitialized()).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should return immediately if already initialized', async () => {
      await sdk.initialize(validConfig);
      mockFetch.mockClear();
      
      await sdk.initialize(validConfig);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    describe('configuration validation', () => {
      it('should throw SDKError when API key is missing', async () => {
        const invalidConfig = { ...validConfig, apiKey: '' };
        await expect(sdk.initialize(invalidConfig)).rejects.toThrow(SDKError);
        await expect(sdk.initialize(invalidConfig)).rejects.toMatchObject({
          type: SDKErrorType.INVALID_CONFIG,
          code: 'CONFIG_001'
        });
      });

      it('should throw error when API key is too short', async () => {
        const invalidConfig = { ...validConfig, apiKey: 'short' };
        await expect(sdk.initialize(invalidConfig)).rejects.toThrow('API key appears to be too short');
      });

      it('should throw error when environment is missing', async () => {
        const invalidConfig = { ...validConfig, environment: undefined as any };
        await expect(sdk.initialize(invalidConfig)).rejects.toThrow('Environment is required');
      });

      it('should throw error for invalid environment', async () => {
        const invalidConfig = { ...validConfig, environment: 'invalid' as any };
        await expect(sdk.initialize(invalidConfig)).rejects.toThrow('Environment must be one of: development, staging, production');
      });

      it('should throw error for invalid timeout', async () => {
        const invalidConfig = { ...validConfig, timeout: 500 };
        await expect(sdk.initialize(invalidConfig)).rejects.toThrow('Timeout must be at least 1000ms');
      });

      it('should throw error for timeout too high', async () => {
        const invalidConfig = { ...validConfig, timeout: 35000 };
        await expect(sdk.initialize(invalidConfig)).rejects.toThrow('Timeout cannot exceed 30000ms');
      });

      it('should throw error for negative retry attempts', async () => {
        const invalidConfig = { ...validConfig, retryAttempts: -1 };
        await expect(sdk.initialize(invalidConfig)).rejects.toThrow('Retry attempts must be non-negative');
      });

      it('should throw error for too many retry attempts', async () => {
        const invalidConfig = { ...validConfig, retryAttempts: 10 };
        await expect(sdk.initialize(invalidConfig)).rejects.toThrow('Retry attempts cannot exceed 5');
      });

      it('should throw error for invalid base URL', async () => {
        const invalidConfig = { ...validConfig, baseUrl: 'http://insecure.com' };
        await expect(sdk.initialize(invalidConfig)).rejects.toThrow('Base URL must be a valid HTTPS URL');
      });

      it('should accept valid optional parameters', async () => {
        const configWithOptionals = {
          ...validConfig,
          timeout: 5000,
          retryAttempts: 3,
          baseUrl: 'https://custom-api.example.com',
          enableAnalytics: true,
          enablePrivacyMode: false,
          debugMode: true
        };
        
        await expect(sdk.initialize(configWithOptionals)).resolves.not.toThrow();
      });
    });

    describe('authentication', () => {
      it('should authenticate API key successfully', async () => {
        await sdk.initialize(validConfig);
        
        expect(mockFetch).toHaveBeenCalledWith(
          'https://dev-api.ai-yuugen.com/auth/validate',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': `Bearer ${validConfig.apiKey}`,
              'Content-Type': 'application/json'
            })
          })
        );
      });

      it('should use custom base URL when provided', async () => {
        const configWithCustomUrl = {
          ...validConfig,
          baseUrl: 'https://custom-api.example.com'
        };
        
        await sdk.initialize(configWithCustomUrl);
        
        expect(mockFetch).toHaveBeenCalledWith(
          'https://custom-api.example.com/auth/validate',
          expect.any(Object)
        );
      });

      it('should throw SDKError for invalid API key (401)', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Invalid API key' })
        });

        await expect(sdk.initialize(validConfig)).rejects.toMatchObject({
          type: SDKErrorType.INVALID_API_KEY,
          code: 'AUTH_001'
        });
      });

      it('should throw SDKError for insufficient permissions (403)', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 403,
          json: () => Promise.resolve({ error: 'Insufficient permissions' })
        });

        await expect(sdk.initialize(validConfig)).rejects.toMatchObject({
          type: SDKErrorType.AUTHENTICATION_FAILED,
          code: 'AUTH_002'
        });
      });

      it('should handle network timeout', async () => {
        mockFetch.mockImplementation(() => {
          const error = new Error('The operation was aborted');
          error.name = 'AbortError';
          return Promise.reject(error);
        });

        const configWithTimeout = { ...validConfig, timeout: 1000 };
        await expect(sdk.initialize(configWithTimeout)).rejects.toMatchObject({
          type: SDKErrorType.INITIALIZATION_TIMEOUT,
          code: 'AUTH_004'
        });
      });

      it('should handle network errors', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'));

        await expect(sdk.initialize(validConfig)).rejects.toMatchObject({
          type: SDKErrorType.NETWORK_ERROR,
          code: 'AUTH_005'
        });
      });

      it('should reset state on initialization failure', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'));

        await expect(sdk.initialize(validConfig)).rejects.toThrow();
        expect(sdk.isInitialized()).toBe(false);
        expect(sdk.getConfig()).toBeNull();
      });
    });

    describe('environment-specific URLs', () => {
      it('should use development URL for development environment', async () => {
        await sdk.initialize({ ...validConfig, environment: 'development' });
        expect(mockFetch).toHaveBeenCalledWith(
          'https://dev-api.ai-yuugen.com/auth/validate',
          expect.any(Object)
        );
      });

      it('should use staging URL for staging environment', async () => {
        await sdk.initialize({ ...validConfig, environment: 'staging' });
        expect(mockFetch).toHaveBeenCalledWith(
          'https://staging-api.ai-yuugen.com/auth/validate',
          expect.any(Object)
        );
      });

      it('should use production URL for production environment', async () => {
        await sdk.initialize({ ...validConfig, environment: 'production' });
        expect(mockFetch).toHaveBeenCalledWith(
          'https://api.ai-yuugen.com/auth/validate',
          expect.any(Object)
        );
      });
    });
  });

  describe('methods before initialization', () => {
    it('should throw error when calling methods before initialization', async () => {
      expect(() => sdk.analyzeContext({} as any)).toThrow('SDK must be initialized before use');
      expect(() => sdk.updateUserContext({} as any)).toThrow('SDK must be initialized before use');
      expect(() => sdk.setConsentStatus({} as any)).toThrow('SDK must be initialized before use');
      expect(() => sdk.getPrivacySettings()).toThrow('SDK must be initialized before use');
      expect(() => sdk.trackEvent({} as any)).toThrow('SDK must be initialized before use');
      await expect(sdk.requestAd({} as any, {} as any)).rejects.toThrow('SDK must be initialized before use');
      await expect(sdk.getPerformanceMetrics()).rejects.toThrow('SDK must be initialized before use');
    });
  });

  describe('lifecycle', () => {
    it('should destroy SDK properly', async () => {
      await sdk.initialize(validConfig);
      expect(sdk.isInitialized()).toBe(true);
      
      sdk.destroy();
      expect(sdk.isInitialized()).toBe(false);
      expect(sdk.getConfig()).toBeNull();
      
      // Should throw error after destruction
      expect(() => sdk.analyzeContext({} as any)).toThrow('SDK must be initialized before use');
    });

    it('should handle destroy before initialization', () => {
      expect(() => sdk.destroy()).not.toThrow();
      expect(sdk.isInitialized()).toBe(false);
    });

    it('should allow re-initialization after destroy', async () => {
      await sdk.initialize(validConfig);
      sdk.destroy();
      
      // Should be able to initialize again
      await expect(sdk.initialize(validConfig)).resolves.not.toThrow();
      expect(sdk.isInitialized()).toBe(true);
    });
  });

  describe('configuration access', () => {
    it('should return null config when not initialized', () => {
      expect(sdk.getConfig()).toBeNull();
    });

    it('should return config after initialization', async () => {
      await sdk.initialize(validConfig);
      const config = sdk.getConfig();
      
      expect(config).toEqual(validConfig);
    });

    it('should return null config after destroy', async () => {
      await sdk.initialize(validConfig);
      sdk.destroy();
      
      expect(sdk.getConfig()).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should create SDKError with proper structure', () => {
      const error = new SDKError(
        SDKErrorType.INVALID_CONFIG,
        'Test error message',
        'TEST_001',
        { testData: 'value' }
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(SDKError);
      expect(error.name).toBe('SDKError');
      expect(error.type).toBe(SDKErrorType.INVALID_CONFIG);
      expect(error.code).toBe('TEST_001');
      expect(error.message).toBe('Test error message');
      expect(error.details).toEqual({ testData: 'value' });
    });

    it('should sanitize API key in error details', async () => {
      const configWithLongKey = {
        ...validConfig,
        apiKey: 'very-long-api-key-1234567890',
        timeout: 500 // This will cause validation error
      };

      try {
        await sdk.initialize(configWithLongKey);
      } catch (error) {
        expect(error).toBeInstanceOf(SDKError);
        const sdkError = error as SDKError;
        expect(sdkError.details?.providedConfig?.apiKey).toBe('very...7890');
      }
    });
  });
});
  descri
be('ADCP Integration', () => {
    let validADCPConfig: any;

    beforeEach(async () => {
      await sdk.initialize(validConfig);
      
      validADCPConfig = {
        mcp: {
          serverUrl: 'https://mcp.adcp-platform.com',
          timeout: 5000,
          maxRetries: 3
        },
        auth: {
          apiKey: 'adcp-test-key-1234567890',
          providers: ['scope3', 'liveramp']
        },
        cache: {
          enabled: true,
          ttl: 300,
          maxSize: 1000
        }
      };
    });

    describe('enableADCP', () => {
      it('should enable ADCP with valid configuration', () => {
        expect(() => sdk.enableADCP(validADCPConfig)).not.toThrow();
        expect(sdk.isADCPEnabled()).toBe(true);
      });

      it('should store ADCP configuration', () => {
        sdk.enableADCP(validADCPConfig);
        const config = sdk.getADCPConfig();
        
        expect(config).toBeDefined();
        expect(config?.mcp.serverUrl).toBe('https://mcp.adcp-platform.com');
        expect(config?.auth.apiKey).toBe('adcp-test-key-1234567890');
      });

      it('should throw error when SDK is not initialized', () => {
        const uninitializedSDK = new AIYuugenSDK();
        expect(() => uninitializedSDK.enableADCP(validADCPConfig)).toThrow('SDK must be initialized before use');
      });

      it('should throw error when MCP configuration is missing', () => {
        const invalidConfig = { ...validADCPConfig, mcp: undefined };
        expect(() => sdk.enableADCP(invalidConfig)).toThrow('MCP configuration is required');
      });

      it('should throw error when MCP server URL is missing', () => {
        const invalidConfig = {
          ...validADCPConfig,
          mcp: { ...validADCPConfig.mcp, serverUrl: undefined }
        };
        expect(() => sdk.enableADCP(invalidConfig)).toThrow('MCP server URL is required');
      });

      it('should throw error for invalid MCP server URL', () => {
        const invalidConfig = {
          ...validADCPConfig,
          mcp: { ...validADCPConfig.mcp, serverUrl: 'http://insecure.com' }
        };
        expect(() => sdk.enableADCP(invalidConfig)).toThrow('MCP server URL must be a valid HTTPS URL');
      });

      it('should throw error when auth configuration is missing', () => {
        const invalidConfig = { ...validADCPConfig, auth: undefined };
        expect(() => sdk.enableADCP(invalidConfig)).toThrow('Authentication configuration is required');
      });

      it('should throw error when both API key and providers are missing', () => {
        const invalidConfig = {
          ...validADCPConfig,
          auth: {}
        };
        expect(() => sdk.enableADCP(invalidConfig)).toThrow('Either API key or providers must be specified');
      });

      it('should accept configuration with only API key', () => {
        const configWithOnlyKey = {
          ...validADCPConfig,
          auth: { apiKey: 'test-key' }
        };
        expect(() => sdk.enableADCP(configWithOnlyKey)).not.toThrow();
      });

      it('should accept configuration with only providers', () => {
        const configWithOnlyProviders = {
          ...validADCPConfig,
          auth: { providers: ['scope3'] }
        };
        expect(() => sdk.enableADCP(configWithOnlyProviders)).not.toThrow();
      });

      it('should validate cache TTL', () => {
        const invalidConfig = {
          ...validADCPConfig,
          cache: { ttl: -1 }
        };
        expect(() => sdk.enableADCP(invalidConfig)).toThrow('Cache TTL must be a non-negative number');
      });

      it('should validate cache maxSize', () => {
        const invalidConfig = {
          ...validADCPConfig,
          cache: { maxSize: 0 }
        };
        expect(() => sdk.enableADCP(invalidConfig)).toThrow('Cache maxSize must be at least 1');
      });
    });

    describe('disableADCP', () => {
      it('should disable ADCP', () => {
        sdk.enableADCP(validADCPConfig);
        expect(sdk.isADCPEnabled()).toBe(true);
        
        sdk.disableADCP();
        expect(sdk.isADCPEnabled()).toBe(false);
        expect(sdk.getADCPConfig()).toBeNull();
      });

      it('should throw error when SDK is not initialized', () => {
        const uninitializedSDK = new AIYuugenSDK();
        expect(() => uninitializedSDK.disableADCP()).toThrow('SDK must be initialized before use');
      });
    });

    describe('requestAdWithSignals', () => {
      const placement = {
        id: 'test-placement',
        format: 'display' as const,
        size: { width: 300, height: 250 }
      };

      const context = {
        topics: ['travel', 'vacation'],
        intent: 'research',
        sentiment: 'positive' as const,
        entities: [],
        keywords: ['hawaii', 'beach'],
        userEngagement: {
          sessionDuration: 300,
          pageViews: 5,
          interactions: 3
        }
      };

      beforeEach(() => {
        mockFetch.mockReset();
        // Mock successful auth
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ permissions: ['read', 'write'] })
        });
      });

      it('should request ad with signals when ADCP is enabled', async () => {
        sdk.enableADCP(validADCPConfig);

        const mockAd = {
          id: 'ad-123',
          type: 'banner',
          format: 'display',
          content: {
            title: 'Test Ad',
            description: 'Test Description',
            imageUrl: 'https://example.com/image.jpg',
            ctaText: 'Learn More',
            landingUrl: 'https://example.com',
            brandName: 'Test Brand'
          },
          targeting: { topics: ['travel'], demographics: {}, interests: [] },
          performance: {
            impressions: 0,
            clicks: 0,
            conversions: 0,
            ctr: 0,
            cpm: 0,
            revenue: 0,
            engagementScore: 0
          },
          createdAt: new Date(),
          expiresAt: new Date()
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            ad: mockAd,
            enhancedContext: {
              ...context,
              adcpSignals: [],
              enhancementMetadata: {
                enhancedAt: new Date(),
                signalCount: 2,
                totalCost: 5.0,
                expectedLift: 0.15,
                confidence: 0.85
              }
            }
          })
        });

        const ad = await sdk.requestAdWithSignals(placement, context);

        expect(ad).toBeDefined();
        expect(ad.id).toBe('ad-123');
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/ads/request-with-signals'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"adcpEnabled":true')
          })
        );
      });

      it('should include signal preferences in request', async () => {
        sdk.enableADCP(validADCPConfig);

        const signalPreferences = {
          providers: ['scope3'],
          categories: ['demographic'],
          maxCPM: 5.0,
          minReach: 10000,
          budget: 100
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            ad: { id: 'ad-123' },
            enhancedContext: {}
          })
        });

        await sdk.requestAdWithSignals(placement, context, signalPreferences);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: expect.stringContaining('"signalPreferences"')
          })
        );
      });

      it('should fall back to standard request when ADCP is not enabled', async () => {
        // Don't enable ADCP
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            id: 'ad-123',
            type: 'banner',
            format: 'display',
            content: {},
            targeting: {},
            performance: {},
            createdAt: new Date(),
            expiresAt: new Date()
          })
        });

        const ad = await sdk.requestAdWithSignals(placement, context);

        expect(ad).toBeDefined();
        // Should call standard ad request endpoint
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/ads/request'),
          expect.any(Object)
        );
      });

      it('should fall back to standard request on ADCP error', async () => {
        sdk.enableADCP(validADCPConfig);

        // First call fails (enhanced request)
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'ADCP service unavailable' })
        });

        // Second call succeeds (fallback)
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            id: 'fallback-ad',
            type: 'banner',
            format: 'display',
            content: {},
            targeting: {},
            performance: {},
            createdAt: new Date(),
            expiresAt: new Date()
          })
        });

        const ad = await sdk.requestAdWithSignals(placement, context);

        expect(ad).toBeDefined();
        expect(ad.id).toContain('fallback');
      });
    });

    describe('getAvailableSignals', () => {
      const context = {
        topics: ['travel', 'vacation'],
        intent: 'research',
        sentiment: 'positive' as const,
        entities: [],
        keywords: ['hawaii'],
        userEngagement: {
          sessionDuration: 300,
          pageViews: 5,
          interactions: 3
        }
      };

      beforeEach(() => {
        mockFetch.mockReset();
        // Mock successful auth
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ permissions: ['read', 'write'] })
        });
      });

      it('should return empty array when ADCP is not enabled', async () => {
        const signals = await sdk.getAvailableSignals(context);
        expect(signals).toEqual([]);
      });

      it('should retrieve available signals when ADCP is enabled', async () => {
        sdk.enableADCP(validADCPConfig);

        const mockSignals = [
          {
            id: 'sig-1',
            name: 'Travel Enthusiasts',
            description: 'Users interested in travel',
            provider: 'scope3',
            category: 'behavioral',
            cpm: 3.5,
            reach: 50000,
            confidence: 0.85,
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ signals: mockSignals })
        });

        const signals = await sdk.getAvailableSignals(context);

        expect(signals).toHaveLength(1);
        expect(signals[0].id).toBe('sig-1');
        expect(signals[0].name).toBe('Travel Enthusiasts');
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/signals/available'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"context"')
          })
        );
      });

      it('should return empty array on error', async () => {
        sdk.enableADCP(validADCPConfig);

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Service unavailable' })
        });

        const signals = await sdk.getAvailableSignals(context);
        expect(signals).toEqual([]);
      });
    });

    describe('getSignalInsights', () => {
      beforeEach(() => {
        mockFetch.mockReset();
        // Mock successful auth
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ permissions: ['read', 'write'] })
        });
      });

      it('should return empty array when ADCP is not enabled', async () => {
        const insights = await sdk.getSignalInsights('ad-123');
        expect(insights).toEqual([]);
      });

      it('should retrieve signal insights when ADCP is enabled', async () => {
        sdk.enableADCP(validADCPConfig);

        const mockInsights = [
          {
            signalId: 'sig-1',
            signalName: 'Travel Enthusiasts',
            provider: 'scope3',
            category: 'behavioral',
            contribution: 0.75,
            impact: {
              ctrLift: 0.25,
              conversionLift: 0.15,
              engagementLift: 0.30
            }
          }
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ insights: mockInsights })
        });

        const insights = await sdk.getSignalInsights('ad-123');

        expect(insights).toHaveLength(1);
        expect(insights[0].signalId).toBe('sig-1');
        expect(insights[0].contribution).toBe(0.75);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/signals/insights/ad-123'),
          expect.objectContaining({
            method: 'GET'
          })
        );
      });

      it('should throw error for invalid ad ID', async () => {
        sdk.enableADCP(validADCPConfig);
        await expect(sdk.getSignalInsights('')).rejects.toThrow('Valid ad ID is required');
      });

      it('should return empty array on error', async () => {
        sdk.enableADCP(validADCPConfig);

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: 'Ad not found' })
        });

        const insights = await sdk.getSignalInsights('ad-123');
        expect(insights).toEqual([]);
      });
    });

    describe('backward compatibility', () => {
      it('should keep existing requestAd method unchanged', async () => {
        const placement = {
          id: 'test-placement',
          format: 'display' as const,
          size: { width: 300, height: 250 }
        };

        const context = {
          topics: ['travel'],
          intent: 'research',
          sentiment: 'positive' as const,
          entities: [],
          keywords: [],
          userEngagement: {
            sessionDuration: 300,
            pageViews: 5,
            interactions: 3
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            id: 'ad-123',
            type: 'banner',
            format: 'display',
            content: {},
            targeting: {},
            performance: {},
            createdAt: new Date(),
            expiresAt: new Date()
          })
        });

        const ad = await sdk.requestAd(placement, context);

        expect(ad).toBeDefined();
        expect(ad.id).toBe('ad-123');
      });

      it('should work with ADCP enabled but using standard request', async () => {
        sdk.enableADCP(validADCPConfig);

        const placement = {
          id: 'test-placement',
          format: 'display' as const,
          size: { width: 300, height: 250 }
        };

        const context = {
          topics: ['travel'],
          intent: 'research',
          sentiment: 'positive' as const,
          entities: [],
          keywords: [],
          userEngagement: {
            sessionDuration: 300,
            pageViews: 5,
            interactions: 3
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            id: 'ad-456',
            type: 'banner',
            format: 'display',
            content: {},
            targeting: {},
            performance: {},
            createdAt: new Date(),
            expiresAt: new Date()
          })
        });

        const ad = await sdk.requestAd(placement, context);

        expect(ad).toBeDefined();
        expect(ad.id).toBe('ad-456');
      });
    });

    describe('cleanup', () => {
      it('should clean up ADCP configuration on destroy', () => {
        sdk.enableADCP(validADCPConfig);
        expect(sdk.isADCPEnabled()).toBe(true);

        sdk.destroy();

        expect(sdk.isADCPEnabled()).toBe(false);
        expect(sdk.getADCPConfig()).toBeNull();
      });
    });
  });
});
