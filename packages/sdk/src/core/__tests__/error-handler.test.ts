import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ErrorHandler,
  NetworkError,
  PrivacyViolationError,
  AdServingError,
  SDKIntegrationError,
  ErrorSeverity,
  ErrorCategory,
  DEFAULT_ERROR_HANDLER_CONFIG,
  createNetworkError,
  createPrivacyViolationError,
  createAdServingError,
  createSDKIntegrationError
} from '../error-handler';

// Mock fetch for testing
global.fetch = vi.fn();

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  let mockConsole: any;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
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
    errorHandler.destroy();
  });

  describe('Error Classes', () => {
    const mockContext = {
      timestamp: new Date(),
      userId: 'test-user',
      sessionId: 'test-session'
    };

    it('should create NetworkError with correct properties', () => {
      const error = new NetworkError(
        'Network failed',
        'NETWORK_TIMEOUT',
        ErrorSeverity.HIGH,
        mockContext
      );

      expect(error.name).toBe('NetworkError');
      expect(error.message).toBe('Network failed');
      expect(error.code).toBe('NETWORK_TIMEOUT');
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.retryable).toBe(true);
      expect(error.troubleshootingUrl).toContain('network/NETWORK_TIMEOUT');
    });

    it('should create PrivacyViolationError with correct properties', () => {
      const error = new PrivacyViolationError(
        'Privacy violation detected',
        'GDPR_VIOLATION',
        mockContext
      );

      expect(error.name).toBe('PrivacyViolationError');
      expect(error.category).toBe(ErrorCategory.PRIVACY);
      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      expect(error.retryable).toBe(false);
    });

    it('should create AdServingError with correct properties', () => {
      const error = new AdServingError(
        'Ad serving failed',
        'NO_ADS_AVAILABLE',
        ErrorSeverity.MEDIUM,
        mockContext,
        false
      );

      expect(error.name).toBe('AdServingError');
      expect(error.category).toBe(ErrorCategory.AD_SERVING);
      expect(error.retryable).toBe(false);
    });

    it('should create SDKIntegrationError with correct properties', () => {
      const error = new SDKIntegrationError(
        'SDK initialization failed',
        'INVALID_CONFIG',
        ErrorSeverity.HIGH,
        mockContext
      );

      expect(error.name).toBe('SDKIntegrationError');
      expect(error.category).toBe(ErrorCategory.SDK_INTEGRATION);
      expect(error.retryable).toBe(false);
    });
  });

  describe('Network Error Handling', () => {
    it('should retry network operations with exponential backoff', async () => {
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('Network error 1'))
        .mockRejectedValueOnce(new Error('Network error 2'))
        .mockResolvedValueOnce('success');

      const context = { timestamp: new Date() };
      const result = await errorHandler.handleNetworkError(mockOperation, context);

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retry attempts', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('Persistent error'));
      const context = { timestamp: new Date() };

      await expect(
        errorHandler.handleNetworkError(mockOperation, context, { maxAttempts: 2 })
      ).rejects.toThrow(NetworkError);

      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should calculate retry delay with exponential backoff', async () => {
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce('success');

      const startTime = Date.now();
      const context = { timestamp: new Date() };
      
      await errorHandler.handleNetworkError(mockOperation, context, {
        baseDelay: 100,
        backoffMultiplier: 2,
        jitter: false
      });

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should have waited at least 100ms + 200ms = 300ms
      expect(totalTime).toBeGreaterThan(250);
    });

    it('should respect max delay limit', async () => {
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce('success');

      const context = { timestamp: new Date() };
      
      await errorHandler.handleNetworkError(mockOperation, context, {
        baseDelay: 10000,
        maxDelay: 500,
        backoffMultiplier: 10,
        jitter: false
      });

      // Should complete relatively quickly due to max delay limit
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });
  });

  describe('Privacy Violation Handling', () => {
    it('should handle privacy violations immediately', () => {
      const violation = {
        message: 'GDPR violation detected',
        code: 'GDPR_CONSENT_MISSING',
        context: { timestamp: new Date() }
      };

      errorHandler.handlePrivacyViolation(violation);

      expect(mockConsole.error).toHaveBeenCalledWith(
        'CRITICAL PRIVACY VIOLATION:',
        'GDPR violation detected'
      );
    });

    it('should not retry privacy violations', () => {
      const violation = {
        message: 'Privacy violation',
        code: 'DATA_BREACH',
        context: { timestamp: new Date() }
      };

      expect(() => errorHandler.handlePrivacyViolation(violation)).not.toThrow();
    });
  });

  describe('Ad Serving Error Handling', () => {
    it('should handle ad serving errors with fallback', async () => {
      const error = new Error('Ad request failed');
      const context = { timestamp: new Date() };
      const fallback = vi.fn().mockResolvedValue('fallback-ad');

      const result = await errorHandler.handleAdServingError(error, context, fallback);

      expect(result).toBe('fallback-ad');
      expect(fallback).toHaveBeenCalled();
    });

    it('should throw if fallback also fails', async () => {
      const error = new Error('Ad request failed');
      const context = { timestamp: new Date() };
      const fallback = vi.fn().mockRejectedValue(new Error('Fallback failed'));

      await expect(
        errorHandler.handleAdServingError(error, context, fallback)
      ).rejects.toThrow(AdServingError);
    });

    it('should throw immediately if no fallback provided', async () => {
      const error = new Error('Ad request failed');
      const context = { timestamp: new Date() };

      await expect(
        errorHandler.handleAdServingError(error, context)
      ).rejects.toThrow(AdServingError);
    });
  });

  describe('SDK Integration Error Handling', () => {
    it('should handle SDK errors and provide troubleshooting guidance', () => {
      const error = {
        message: 'SDK initialization failed',
        code: 'SDK_INIT_FAILED',
        context: { timestamp: new Date() }
      };

      errorHandler.handleSDKError(error);

      expect(mockConsole.group).toHaveBeenCalledWith('🔧 Troubleshooting Guidance');
      expect(mockConsole.log).toHaveBeenCalledWith('Error Code:', 'SDK_INIT_FAILED');
      expect(mockConsole.groupEnd).toHaveBeenCalled();
    });

    it('should handle unknown error codes gracefully', () => {
      const error = {
        message: 'Unknown error',
        code: 'UNKNOWN_ERROR',
        context: { timestamp: new Date() }
      };

      expect(() => errorHandler.handleSDKError(error)).not.toThrow();
    });
  });

  describe('Error Reporting', () => {
    it('should batch and flush errors to reporting endpoint', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue(new Response('OK', { status: 200 }));

      const errorHandler = new ErrorHandler({
        reporting: {
          enableReporting: true,
          reportingEndpoint: 'https://api.example.com/errors',
          batchSize: 2,
          flushInterval: 1000,
          includeStackTrace: true,
          includeSensitiveData: false
        }
      });

      // Generate errors to trigger batching
      const context = { timestamp: new Date() };
      errorHandler.handleSDKError({
        message: 'Error 1',
        code: 'ERROR_1',
        context
      });
      errorHandler.handleSDKError({
        message: 'Error 2',
        code: 'ERROR_2',
        context
      });

      // Wait for async reporting
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/errors',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('ERROR_1')
        })
      );

      errorHandler.destroy();
    });

    it('should sanitize sensitive data when reporting', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue(new Response('OK', { status: 200 }));

      const errorHandler = new ErrorHandler({
        reporting: {
          enableReporting: true,
          reportingEndpoint: 'https://api.example.com/errors',
          batchSize: 1,
          flushInterval: 1000,
          includeStackTrace: false,
          includeSensitiveData: false
        }
      });

      const context = {
        timestamp: new Date(),
        userId: 'sensitive-user-id',
        additionalData: { secret: 'sensitive-data' }
      };

      errorHandler.handleSDKError({
        message: 'Test error',
        code: 'TEST_ERROR',
        context
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1]?.body as string);
      const reportedError = requestBody.errors[0];

      expect(reportedError.context.userId).toBeUndefined();
      expect(reportedError.context.additionalData).toBeUndefined();

      errorHandler.destroy();
    });
  });

  describe('Error Factory Functions', () => {
    const mockContext = { timestamp: new Date() };

    it('should create NetworkError using factory function', () => {
      const error = createNetworkError('Network failed', 'NET_ERROR', mockContext);
      expect(error).toBeInstanceOf(NetworkError);
      expect(error.code).toBe('NET_ERROR');
    });

    it('should create PrivacyViolationError using factory function', () => {
      const error = createPrivacyViolationError('Privacy violation', 'PRIVACY_ERROR', mockContext);
      expect(error).toBeInstanceOf(PrivacyViolationError);
      expect(error.code).toBe('PRIVACY_ERROR');
    });

    it('should create AdServingError using factory function', () => {
      const error = createAdServingError('Ad serving failed', 'AD_ERROR', mockContext);
      expect(error).toBeInstanceOf(AdServingError);
      expect(error.code).toBe('AD_ERROR');
    });

    it('should create SDKIntegrationError using factory function', () => {
      const error = createSDKIntegrationError('SDK error', 'SDK_ERROR', mockContext);
      expect(error).toBeInstanceOf(SDKIntegrationError);
      expect(error.code).toBe('SDK_ERROR');
    });
  });

  describe('Configuration', () => {
    it('should use default configuration when none provided', () => {
      const handler = new ErrorHandler();
      expect(handler).toBeDefined();
      handler.destroy();
    });

    it('should merge custom configuration with defaults', () => {
      const customConfig = {
        retry: { maxAttempts: 5 },
        logLevel: 'debug' as const
      };

      const handler = new ErrorHandler(customConfig);
      expect(handler).toBeDefined();
      handler.destroy();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources on destroy', () => {
      const handler = new ErrorHandler();
      expect(() => handler.destroy()).not.toThrow();
    });
  });
});