/**
 * Error Handling Usage Examples for AI Ad Yuugen SDK
 * 
 * This file demonstrates how to use the comprehensive error handling
 * and logging system in the AI Ad Yuugen SDK.
 */

import { 
  AIYuugenSDK,
  ErrorHandler,
  Logger,
  LogLevel,
  ErrorSeverity,
  ErrorCategory,
  NetworkError,
  PrivacyViolationError,
  AdServingError,
  SDKIntegrationError,
  createNetworkError,
  createPrivacyViolationError,
  createAdServingError,
  createSDKIntegrationError,
  sdkLogger,
  adServingLogger,
  privacyLogger,
  analyticsLogger,
  networkLogger
} from '@ai-yuugen/sdk';

// Example 1: Basic SDK usage with error handling
async function basicSDKUsage() {
  console.log('=== Basic SDK Usage with Error Handling ===');
  
  const sdk = new AIYuugenSDK({
    // Configure error handling
    retry: {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      jitter: true
    },
    reporting: {
      enableReporting: true,
      reportingEndpoint: 'https://api.example.com/errors',
      includeStackTrace: true,
      includeSensitiveData: false,
      batchSize: 10,
      flushInterval: 30000
    },
    logLevel: 'error',
    enableConsoleLogging: true
  });

  try {
    await sdk.initialize({
      apiKey: 'your-api-key-here',
      environment: 'development'
    });

    console.log('✅ SDK initialized successfully');

    // Request an ad
    const placement = {
      id: 'header-banner',
      format: 'banner' as const,
      size: { width: 728, height: 90 }
    };

    const context = {
      topics: ['technology', 'programming'],
      intent: 'informational' as const,
      sentiment: 0.8,
      conversationStage: 'middle' as const,
      userEngagement: 0.9
    };

    const ad = await sdk.requestAd(placement, context);
    console.log('✅ Ad retrieved:', ad.id);

  } catch (error) {
    if (error instanceof NetworkError) {
      console.error('❌ Network error occurred:', error.message);
      console.log('🔄 Retryable:', error.retryable);
      console.log('📚 Troubleshooting:', error.troubleshootingUrl);
    } else if (error instanceof SDKIntegrationError) {
      console.error('❌ SDK integration error:', error.message);
      console.log('📚 Troubleshooting:', error.troubleshootingUrl);
    } else {
      console.error('❌ Unexpected error:', error);
    }
  } finally {
    sdk.destroy();
  }
}

// Example 2: Custom error handler usage
async function customErrorHandlerUsage() {
  console.log('\n=== Custom Error Handler Usage ===');
  
  const errorHandler = new ErrorHandler({
    retry: {
      maxAttempts: 5,
      baseDelay: 500,
      maxDelay: 5000,
      backoffMultiplier: 1.5,
      jitter: true
    },
    reporting: {
      enableReporting: false, // Disable for this example
      includeStackTrace: true,
      includeSensitiveData: false,
      batchSize: 5,
      flushInterval: 15000
    },
    logLevel: 'debug',
    enableConsoleLogging: true
  });

  // Example: Handle network operation with retry
  try {
    const result = await errorHandler.handleNetworkError(
      async () => {
        // Simulate a network operation that might fail
        if (Math.random() < 0.7) {
          throw new Error('Simulated network failure');
        }
        return 'Network operation successful';
      },
      {
        timestamp: new Date(),
        sessionId: 'example-session-123',
        additionalData: { operation: 'fetch-ads' }
      }
    );
    
    console.log('✅ Network operation result:', result);
  } catch (error) {
    console.error('❌ Network operation failed after retries:', error.message);
  }

  // Example: Handle privacy violation
  errorHandler.handlePrivacyViolation({
    message: 'User data accessed without consent',
    code: 'GDPR_CONSENT_MISSING',
    context: {
      timestamp: new Date(),
      userId: 'user-123',
      sessionId: 'session-456'
    }
  });

  // Example: Handle ad serving error with fallback
  try {
    const ad = await errorHandler.handleAdServingError(
      new Error('Primary ad server unavailable'),
      {
        timestamp: new Date(),
        sessionId: 'session-789',
        additionalData: { placementId: 'sidebar-ad' }
      },
      async () => {
        // Fallback ad serving logic
        return {
          id: 'fallback-ad-001',
          content: { title: 'Fallback Advertisement' }
        };
      }
    );
    
    console.log('✅ Ad served (with fallback):', ad.id);
  } catch (error) {
    console.error('❌ Ad serving failed completely:', error.message);
  }

  // Example: Handle SDK integration error
  errorHandler.handleSDKError({
    message: 'Invalid configuration provided',
    code: 'INVALID_CONFIG',
    severity: ErrorSeverity.HIGH,
    context: {
      timestamp: new Date(),
      additionalData: { configField: 'apiKey' }
    }
  });

  // Clean up
  errorHandler.destroy();
}

// Example 3: Logger usage
function loggerUsage() {
  console.log('\n=== Logger Usage Examples ===');
  
  // Create custom logger
  const customLogger = new Logger({
    level: LogLevel.DEBUG,
    enableConsole: true,
    enableRemote: false,
    includeStackTrace: true
  });

  // Basic logging
  customLogger.debug('Debug message', { userId: 'user-123' });
  customLogger.info('Info message', { action: 'ad-request' });
  customLogger.warn('Warning message', { issue: 'slow-response' });
  customLogger.error('Error message', new Error('Something went wrong'));
  customLogger.critical('Critical message', { system: 'down' });

  // Use category-specific loggers
  sdkLogger.info('SDK initialized successfully');
  adServingLogger.warn('Ad serving latency high', { latency: 2500 });
  privacyLogger.error('Privacy violation detected', { violation: 'unauthorized-access' });
  analyticsLogger.debug('Analytics event tracked', { event: 'ad-click' });
  networkLogger.error('Network request failed', { url: 'https://api.example.com' });

  // Create child logger with specific category
  const paymentLogger = customLogger.child('payment');
  paymentLogger.info('Payment processed', { amount: 100, currency: 'USD' });

  // Clean up
  customLogger.destroy();
}

// Example 4: Error factory functions
function errorFactoryUsage() {
  console.log('\n=== Error Factory Functions ===');
  
  const context = {
    timestamp: new Date(),
    sessionId: 'session-123',
    userId: 'user-456'
  };

  // Create different types of errors
  const networkError = createNetworkError(
    'Failed to connect to ad server',
    'NETWORK_TIMEOUT',
    context,
    new Error('Connection timeout')
  );

  const privacyError = createPrivacyViolationError(
    'User data accessed without proper consent',
    'GDPR_VIOLATION',
    context
  );

  const adServingError = createAdServingError(
    'No ads available for this placement',
    'NO_ADS_AVAILABLE',
    context,
    false // not retryable
  );

  const sdkError = createSDKIntegrationError(
    'SDK not properly initialized',
    'SDK_NOT_INITIALIZED',
    context
  );

  console.log('Network Error:', {
    name: networkError.name,
    code: networkError.code,
    category: networkError.category,
    severity: networkError.severity,
    retryable: networkError.retryable
  });

  console.log('Privacy Error:', {
    name: privacyError.name,
    code: privacyError.code,
    category: privacyError.category,
    severity: privacyError.severity,
    retryable: privacyError.retryable
  });

  console.log('Ad Serving Error:', {
    name: adServingError.name,
    code: adServingError.code,
    category: adServingError.category,
    severity: adServingError.severity,
    retryable: adServingError.retryable
  });

  console.log('SDK Integration Error:', {
    name: sdkError.name,
    code: sdkError.code,
    category: sdkError.category,
    severity: sdkError.severity,
    retryable: sdkError.retryable
  });
}

// Example 5: Error handling best practices
async function errorHandlingBestPractices() {
  console.log('\n=== Error Handling Best Practices ===');
  
  const sdk = new AIYuugenSDK();
  
  try {
    // Always handle initialization errors
    await sdk.initialize({
      apiKey: 'your-api-key',
      environment: 'production'
    });

    // Use try-catch for operations that might fail
    try {
      const placement = {
        id: 'main-content-ad',
        format: 'native' as const,
        size: { width: 300, height: 250 }
      };

      const context = {
        topics: ['finance'],
        intent: 'transactional' as const,
        sentiment: 0.6,
        conversationStage: 'end' as const,
        userEngagement: 0.8
      };

      const ad = await sdk.requestAd(placement, context);
      
      // Handle successful ad request
      console.log('✅ Ad loaded successfully:', ad.id);
      
    } catch (adError) {
      // Handle ad-specific errors gracefully
      if (adError instanceof AdServingError) {
        console.warn('⚠️ Ad serving failed, showing fallback content');
        // Show fallback content instead of breaking the user experience
      } else if (adError instanceof NetworkError && adError.retryable) {
        console.warn('⚠️ Network error, will retry automatically');
        // The error handler already handled retries
      } else {
        console.error('❌ Unexpected ad error:', adError.message);
      }
    }

  } catch (initError) {
    // Handle initialization errors
    if (initError instanceof SDKIntegrationError) {
      console.error('❌ SDK configuration error:', initError.message);
      console.log('💡 Check your API key and configuration');
      console.log('📚 Documentation:', initError.troubleshootingUrl);
    } else if (initError instanceof NetworkError) {
      console.error('❌ Network error during initialization:', initError.message);
      console.log('💡 Check your internet connection and try again');
    } else {
      console.error('❌ Unexpected initialization error:', initError);
    }
  } finally {
    // Always clean up resources
    sdk.destroy();
  }
}

// Run all examples
async function runAllExamples() {
  try {
    await basicSDKUsage();
    await customErrorHandlerUsage();
    loggerUsage();
    errorFactoryUsage();
    await errorHandlingBestPractices();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Export for use in other files
export {
  basicSDKUsage,
  customErrorHandlerUsage,
  loggerUsage,
  errorFactoryUsage,
  errorHandlingBestPractices,
  runAllExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}