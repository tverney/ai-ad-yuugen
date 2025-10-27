import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIYuugenSDK } from '../sdk';
import { 
  NetworkError, 
  SDKIntegrationError, 
  ErrorSeverity, 
  ErrorCategory 
} from '../error-handler';

// Mock fetch for testing
global.fetch = vi.fn();

describe('Error Handling Integration', () => {
  let sdk: AIYuugenSDK;
  let mockConsole: any;

  beforeEach(() => {
    sdk = new AIYuugenSDK();
    mockConsole = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      group: vi.fn(),
      groupEnd: vi.fn(),
      log: vi.fn()
    };
    global.console = mockConsole;
    vi.clearAllMocks();
  });

  afterEach(() => {
    sdk.destroy();
  });

  describe('SDK Integration with Error Handler', () => {
    it('should handle network errors during initialization with retry', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce(new Response(JSON.stringify({ permissions: ['read', 'write'] }), { 
          status: 200 
        }));

      const config = {
        apiKey: 'test-api-key-12345',
        environment: 'development' as const
      };

      await sdk.initialize(config);

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(sdk.isInitialized()).toBe(true);
    });

    it('should throw NetworkError after max retries', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValue(new Error('Persistent network error'));

      const config = {
        apiKey: 'test-api-key-12345',
        environment: 'development' as const
      };

      await expect(sdk.initialize(config)).rejects.toThrow(NetworkError);
      expect(mockFetch).toHaveBeenCalledTimes(3); // Default max attempts
    });

    it('should handle SDK integration errors with troubleshooting guidance', async () => {
      const config = {
        apiKey: '', // Invalid API key
        environment: 'development' as const
      };

      await expect(sdk.initialize(config)).rejects.toThrow(SDKIntegrationError);
      
      // Should show troubleshooting guidance
      expect(mockConsole.group).toHaveBeenCalledWith('🔧 Troubleshooting Guidance');
      expect(mockConsole.log).toHaveBeenCalledWith('Error Code:', 'SDK_INIT_FAILED');
      expect(mockConsole.groupEnd).toHaveBeenCalled();
    });

    it('should handle ad request errors with fallback', async () => {
      // First initialize the SDK
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ permissions: ['read', 'write'] }), { 
        status: 200 
      }));

      const config = {
        apiKey: 'test-api-key-12345',
        environment: 'development' as const
      };

      await sdk.initialize(config);

      // Now test ad request with error and fallback
      const placement = {
        id: 'test-placement',
        format: 'banner' as const,
        size: { width: 300, height: 250 }
      };

      const context = {
        topics: ['technology'],
        intent: 'informational' as const,
        sentiment: 0.5,
        conversationStage: 'middle' as const,
        userEngagement: 0.7
      };

      // The ad request should use fallback when primary fails
      const ad = await sdk.requestAd(placement, context);
      
      expect(ad).toBeDefined();
      expect(ad.id).toContain('fallback_');
      expect(ad.content.title).toBe('Advertisement');
    });

    it('should handle methods called before initialization', async () => {
      const placement = {
        id: 'test-placement',
        format: 'banner' as const,
        size: { width: 300, height: 250 }
      };

      const context = {
        topics: ['technology'],
        intent: 'informational' as const,
        sentiment: 0.5,
        conversationStage: 'middle' as const,
        userEngagement: 0.7
      };

      await expect(sdk.requestAd(placement, context)).rejects.toThrow(SDKIntegrationError);
      
      // Should log error and show troubleshooting guidance
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('[AI-Ad Yuugen Error]'),
        expect.objectContaining({
          category: 'sdk_integration',
          severity: 'high',
          code: 'SDK_NOT_INITIALIZED'
        })
      );
    });

    it('should properly clean up error handler on destroy', () => {
      expect(() => sdk.destroy()).not.toThrow();
      expect(sdk.isInitialized()).toBe(false);
    });
  });

  describe('Error Categorization', () => {
    it('should categorize network errors correctly', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValue(new Error('Network error'));

      const config = {
        apiKey: 'test-api-key-12345',
        environment: 'development' as const
      };

      try {
        await sdk.initialize(config);
      } catch (error) {
        expect(error).toBeInstanceOf(NetworkError);
        const networkError = error as NetworkError;
        expect(networkError.category).toBe(ErrorCategory.NETWORK);
        expect(networkError.severity).toBe(ErrorSeverity.HIGH);
        expect(networkError.retryable).toBe(true);
      }
    });

    it('should categorize SDK integration errors correctly', async () => {
      const config = {
        apiKey: 'short', // Too short API key
        environment: 'development' as const
      };

      try {
        await sdk.initialize(config);
      } catch (error) {
        expect(error).toBeInstanceOf(SDKIntegrationError);
        const sdkError = error as SDKIntegrationError;
        expect(sdkError.category).toBe(ErrorCategory.SDK_INTEGRATION);
        expect(sdkError.severity).toBe(ErrorSeverity.CRITICAL);
        expect(sdkError.retryable).toBe(false);
      }
    });
  });

  describe('Error Context', () => {
    it('should include proper context in errors', async () => {
      const config = {
        apiKey: '', // Invalid API key
        environment: 'development' as const
      };

      try {
        await sdk.initialize(config);
      } catch (error) {
        const sdkError = error as SDKIntegrationError;
        expect(sdkError.context).toBeDefined();
        expect(sdkError.context.timestamp).toBeInstanceOf(Date);
        expect(sdkError.context.sessionId).toMatch(/^sdk_\d+_[a-z0-9]+$/);
        expect(sdkError.context.additionalData?.environment).toBe('development');
      }
    });
  });

  describe('Troubleshooting Guidance', () => {
    it('should provide troubleshooting URLs', async () => {
      const config = {
        apiKey: '', // Invalid API key
        environment: 'development' as const
      };

      try {
        await sdk.initialize(config);
      } catch (error) {
        const sdkError = error as SDKIntegrationError;
        expect(sdkError.troubleshootingUrl).toContain('docs.ai-yuugen.com');
        expect(sdkError.troubleshootingUrl).toContain('SDK_INIT_FAILED');
      }
    });
  });
});