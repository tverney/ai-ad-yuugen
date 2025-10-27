# Configuration Guide

Comprehensive guide to configuring the AI Ad Yuugen SDK for optimal performance and compliance.

## Table of Contents

- [Basic Configuration](#basic-configuration)
- [Environment Settings](#environment-settings)
- [Privacy Configuration](#privacy-configuration)
- [Performance Tuning](#performance-tuning)
- [Error Handling Configuration](#error-handling-configuration)
- [Analytics Configuration](#analytics-configuration)
- [Advanced Settings](#advanced-settings)

## Basic Configuration

### SDKConfig Interface

```typescript
interface SDKConfig {
  apiKey: string;                    // Your API key (required)
  environment: 'development' | 'staging' | 'production'; // Environment (required)
  baseUrl?: string;                  // Custom API base URL
  timeout?: number;                  // Request timeout in milliseconds
  retryAttempts?: number;            // Number of retry attempts
  enableAnalytics?: boolean;         // Enable analytics tracking
  enablePrivacyMode?: boolean;       // Enable enhanced privacy mode
  debugMode?: boolean;               // Enable debug logging
}
```

### Minimal Configuration

```typescript
import { AIYuugenSDK } from '@ai-yuugen/sdk';

const sdk = new AIYuugenSDK();

await sdk.initialize({
  apiKey: 'your-api-key-here',
  environment: 'production'
});
```

### Complete Configuration

```typescript
const config: SDKConfig = {
  // Required settings
  apiKey: process.env.AI_ADSENSE_API_KEY!,
  environment: process.env.NODE_ENV as 'development' | 'staging' | 'production',
  
  // Network settings
  baseUrl: 'https://api.ai-yuugen.com',
  timeout: 10000, // 10 seconds
  retryAttempts: 3,
  
  // Feature flags
  enableAnalytics: true,
  enablePrivacyMode: true,
  debugMode: process.env.NODE_ENV === 'development'
};

await sdk.initialize(config);
```

## Environment Settings

### Development Environment

```typescript
const developmentConfig: SDKConfig = {
  apiKey: 'ak_dev_1234567890abcdef',
  environment: 'development',
  baseUrl: 'https://dev-api.ai-yuugen.com',
  timeout: 15000, // Longer timeout for dev
  retryAttempts: 5, // More retries for unstable dev environment
  enableAnalytics: false, // Disable analytics in dev
  debugMode: true // Enable detailed logging
};
```

### Staging Environment

```typescript
const stagingConfig: SDKConfig = {
  apiKey: 'ak_staging_1234567890abcdef',
  environment: 'staging',
  baseUrl: 'https://staging-api.ai-yuugen.com',
  timeout: 8000,
  retryAttempts: 3,
  enableAnalytics: true, // Test analytics
  enablePrivacyMode: true, // Test privacy features
  debugMode: false
};
```

### Production Environment

```typescript
const productionConfig: SDKConfig = {
  apiKey: 'ak_prod_1234567890abcdef',
  environment: 'production',
  // Use default baseUrl for production
  timeout: 5000, // Fast timeout for production
  retryAttempts: 2, // Fewer retries for better UX
  enableAnalytics: true,
  enablePrivacyMode: true,
  debugMode: false // Never enable debug in production
};
```

### Environment-Based Configuration

```typescript
const getConfig = (): SDKConfig => {
  const baseConfig = {
    apiKey: process.env.AI_ADSENSE_API_KEY!,
    environment: process.env.NODE_ENV as 'development' | 'staging' | 'production'
  };

  switch (process.env.NODE_ENV) {
    case 'development':
      return {
        ...baseConfig,
        timeout: 15000,
        retryAttempts: 5,
        enableAnalytics: false,
        debugMode: true
      };
    
    case 'staging':
      return {
        ...baseConfig,
        timeout: 8000,
        retryAttempts: 3,
        enableAnalytics: true,
        enablePrivacyMode: true,
        debugMode: false
      };
    
    case 'production':
      return {
        ...baseConfig,
        timeout: 5000,
        retryAttempts: 2,
        enableAnalytics: true,
        enablePrivacyMode: true,
        debugMode: false
      };
    
    default:
      throw new Error(`Unknown environment: ${process.env.NODE_ENV}`);
  }
};

await sdk.initialize(getConfig());
```

## Privacy Configuration

### GDPR Compliance

```typescript
// Initialize with privacy mode
await sdk.initialize({
  apiKey: 'your-api-key',
  environment: 'production',
  enablePrivacyMode: true // Enables enhanced privacy features
});

// Set user consent
sdk.setConsentStatus({
  advertising: true,
  analytics: true,
  personalization: false, // User opted out
  dataSharing: false,
  timestamp: new Date(),
  jurisdiction: 'EU',
  version: '2.0',
  consentMethod: ConsentMethod.EXPLICIT,
  ipAddress: getUserIP(), // For audit trail
  userAgent: navigator.userAgent
});

// Configure privacy settings
const privacySettings: PrivacySettings = {
  consentStatus: consentStatus,
  dataRetentionPeriod: 30, // 30 days
  privacyLevel: PrivacyLevel.ENHANCED,
  dataProcessingBasis: DataProcessingBasis.CONSENT,
  optOutRequests: [],
  complianceFlags: [
    {
      regulation: PrivacyRegulation.GDPR,
      status: ComplianceStatus.COMPLIANT,
      lastChecked: new Date(),
      issues: []
    }
  ],
  encryptionEnabled: true,
  anonymizationLevel: AnonymizationLevel.ANONYMIZATION
};
```

### CCPA Compliance

```typescript
// California Consumer Privacy Act compliance
sdk.setConsentStatus({
  advertising: true,
  analytics: true,
  personalization: true,
  dataSharing: false, // CCPA allows opt-out of data sharing
  timestamp: new Date(),
  jurisdiction: 'US-CA',
  version: '1.0',
  consentMethod: ConsentMethod.IMPLIED // CCPA allows implied consent
});
```

### Privacy-First Configuration

```typescript
// Maximum privacy configuration
await sdk.initialize({
  apiKey: 'your-api-key',
  environment: 'production',
  enablePrivacyMode: true,
  enableAnalytics: false // Disable all analytics
});

// Minimal data collection
const privacySettings: PrivacySettings = {
  consentStatus: {
    advertising: true,
    analytics: false,
    personalization: false,
    dataSharing: false,
    timestamp: new Date(),
    jurisdiction: 'EU',
    version: '2.0',
    consentMethod: ConsentMethod.EXPLICIT
  },
  dataRetentionPeriod: 1, // 1 day minimum
  privacyLevel: PrivacyLevel.MAXIMUM,
  dataProcessingBasis: DataProcessingBasis.CONSENT,
  optOutRequests: [],
  complianceFlags: [],
  encryptionEnabled: true,
  anonymizationLevel: AnonymizationLevel.FULL_DELETION
};
```

## Performance Tuning

### Network Optimization

```typescript
const performanceConfig: SDKConfig = {
  apiKey: 'your-api-key',
  environment: 'production',
  
  // Optimize for fast networks
  timeout: 3000, // 3 seconds
  retryAttempts: 1, // Single retry
  
  // Use CDN for better performance
  baseUrl: 'https://cdn.ai-yuugen.com',
  
  enableAnalytics: true,
  debugMode: false
};
```

### Slow Network Configuration

```typescript
const slowNetworkConfig: SDKConfig = {
  apiKey: 'your-api-key',
  environment: 'production',
  
  // Optimize for slow networks
  timeout: 15000, // 15 seconds
  retryAttempts: 5, // More retries
  
  enableAnalytics: false, // Reduce network usage
  debugMode: false
};
```

### Caching Configuration

```typescript
// Configure caching for better performance
const cacheConfig = {
  enabled: true,
  ttl: 300000, // 5 minutes
  maxSize: 100, // Max 100 cached ads
  strategy: 'lru' // Least Recently Used eviction
};

// Apply caching at the ad manager level
const adManager = new AdManager({
  cacheConfig,
  preloadEnabled: true,
  lazyLoadingEnabled: true
});
```

## Error Handling Configuration

### Basic Error Handling

```typescript
const errorHandlerConfig: ErrorHandlerConfig = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  exponentialBackoff: true,
  enableLogging: true,
  logLevel: 'error'
};

const sdk = new AIYuugenSDK(errorHandlerConfig);
```

### Advanced Error Handling

```typescript
const advancedErrorConfig: ErrorHandlerConfig = {
  maxRetries: 5,
  retryDelay: 2000,
  exponentialBackoff: true,
  maxRetryDelay: 30000, // Max 30 seconds
  enableLogging: true,
  logLevel: 'debug',
  
  // Custom error handlers
  onNetworkError: (error, context) => {
    console.error('Network error:', error);
    // Send to error tracking service
    errorTracker.captureException(error, { context });
  },
  
  onPrivacyViolation: (violation, context) => {
    console.error('Privacy violation:', violation);
    // Immediate action required
    notifyComplianceTeam(violation);
  },
  
  onAdServingError: (error, context) => {
    console.warn('Ad serving error:', error);
    // Fallback to house ads
    return getHouseAd(context.placement);
  }
};

const sdk = new AIYuugenSDK(advancedErrorConfig);
```

### Circuit Breaker Pattern

```typescript
const circuitBreakerConfig = {
  enabled: true,
  failureThreshold: 5, // Open circuit after 5 failures
  resetTimeout: 60000, // Try again after 1 minute
  monitoringPeriod: 300000 // 5 minute monitoring window
};

const errorConfig: ErrorHandlerConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  circuitBreaker: circuitBreakerConfig,
  
  onCircuitOpen: () => {
    console.warn('Circuit breaker opened - using fallback ads');
    // Switch to cached/fallback ads
  },
  
  onCircuitClose: () => {
    console.info('Circuit breaker closed - resuming normal operation');
  }
};
```

## Analytics Configuration

### Basic Analytics

```typescript
await sdk.initialize({
  apiKey: 'your-api-key',
  environment: 'production',
  enableAnalytics: true // Enable basic analytics
});

// Track custom events
sdk.trackEvent({
  id: 'custom-event-123',
  type: 'user_interaction',
  adId: 'ad-456',
  sessionId: 'session-789',
  timestamp: new Date(),
  context: {
    action: 'hover',
    duration: 2500,
    placement: 'sidebar'
  }
});
```

### Advanced Analytics

```typescript
const analyticsConfig = {
  enabled: true,
  batchSize: 10, // Send events in batches of 10
  flushInterval: 30000, // Flush every 30 seconds
  enableRealTime: true, // Real-time event streaming
  enableCohortAnalysis: true,
  enableABTesting: true,
  
  // Custom dimensions
  customDimensions: {
    userType: 'premium',
    appVersion: '2.1.0',
    feature: 'ai-chat'
  },
  
  // Event filtering
  eventFilter: (event: AdEvent) => {
    // Only track events for premium users
    return event.context.userType === 'premium';
  }
};

// Initialize with analytics config
await sdk.initialize({
  apiKey: 'your-api-key',
  environment: 'production',
  enableAnalytics: true,
  analyticsConfig
});
```

### Privacy-Compliant Analytics

```typescript
const privacyCompliantAnalytics = {
  enabled: true,
  anonymizeIPs: true, // Anonymize IP addresses
  respectDoNotTrack: true, // Honor DNT headers
  consentRequired: true, // Require explicit consent
  dataRetention: 90, // 90 days retention
  
  // PII scrubbing
  scrubPII: true,
  piiPatterns: [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/ // Credit card
  ]
};
```

## Advanced Settings

### Context Analysis Configuration

```typescript
const contextConfig = {
  enableSentimentAnalysis: true,
  enableTopicExtraction: true,
  enableIntentDetection: true,
  enableEngagementTracking: true,
  
  // Topic extraction settings
  topicExtraction: {
    minConfidence: 0.7, // Minimum confidence for topics
    maxTopics: 10, // Maximum topics per analysis
    enableCategoryMapping: true,
    customCategories: ['technology', 'business', 'lifestyle']
  },
  
  // Intent detection settings
  intentDetection: {
    minConfidence: 0.8,
    enableSecondaryIntents: true,
    customIntents: ['purchase_intent', 'support_request']
  },
  
  // Sentiment analysis settings
  sentimentAnalysis: {
    enableEmotionDetection: true,
    enableSarcasmDetection: false, // Experimental
    language: 'en'
  }
};

const contextAnalyzer = new ContextAnalyzer(contextConfig);
```

### Ad Placement Configuration

```typescript
const placementConfig = {
  // Default placement settings
  defaultSize: { width: 300, height: 250 },
  defaultPosition: AdPosition.RIGHT,
  defaultFormat: AdFormat.DISPLAY,
  
  // Responsive breakpoints
  breakpoints: {
    mobile: { maxWidth: 768, size: { width: 320, height: 50 } },
    tablet: { maxWidth: 1024, size: { width: 728, height: 90 } },
    desktop: { minWidth: 1025, size: { width: 300, height: 250 } }
  },
  
  // Placement rules
  rules: {
    maxAdsPerPage: 3,
    minDistanceBetweenAds: 500, // pixels
    respectViewportBoundaries: true,
    enableStickyPositioning: false
  },
  
  // Fallback configuration
  fallback: {
    enabled: true,
    strategy: FallbackStrategy.CACHED_ADS,
    maxRetries: 2,
    retryDelay: 1000
  }
};
```

### Multi-Region Configuration

```typescript
const getRegionalConfig = (region: string): SDKConfig => {
  const baseConfig = {
    apiKey: process.env.AI_ADSENSE_API_KEY!,
    environment: 'production' as const
  };

  switch (region) {
    case 'us':
      return {
        ...baseConfig,
        baseUrl: 'https://us-api.ai-yuugen.com',
        enablePrivacyMode: false, // Less strict privacy requirements
        timeout: 5000
      };
    
    case 'eu':
      return {
        ...baseConfig,
        baseUrl: 'https://eu-api.ai-yuugen.com',
        enablePrivacyMode: true, // GDPR compliance required
        timeout: 8000 // Account for longer distances
      };
    
    case 'asia':
      return {
        ...baseConfig,
        baseUrl: 'https://asia-api.ai-yuugen.com',
        timeout: 10000, // Account for network latency
        retryAttempts: 5
      };
    
    default:
      return {
        ...baseConfig,
        baseUrl: 'https://global-api.ai-yuugen.com'
      };
  }
};

// Detect user region and configure accordingly
const userRegion = detectUserRegion();
await sdk.initialize(getRegionalConfig(userRegion));
```

### A/B Testing Configuration

```typescript
const abTestConfig = {
  enabled: true,
  experiments: [
    {
      id: 'ad-position-test',
      variants: [
        { id: 'control', weight: 50, config: { position: AdPosition.RIGHT } },
        { id: 'treatment', weight: 50, config: { position: AdPosition.BOTTOM } }
      ],
      targetingRules: {
        userType: 'new',
        trafficPercentage: 10 // Only 10% of users
      }
    }
  ],
  
  // Event tracking for experiments
  onVariantAssigned: (experimentId, variantId, userId) => {
    analytics.track('experiment_assigned', {
      experimentId,
      variantId,
      userId
    });
  }
};
```

## Configuration Validation

### Runtime Validation

```typescript
const validateConfig = (config: SDKConfig): void => {
  // API key validation
  if (!config.apiKey || config.apiKey.length < 10) {
    throw new Error('Invalid API key');
  }
  
  // Environment validation
  if (!['development', 'staging', 'production'].includes(config.environment)) {
    throw new Error('Invalid environment');
  }
  
  // Timeout validation
  if (config.timeout && (config.timeout < 1000 || config.timeout > 60000)) {
    throw new Error('Timeout must be between 1000ms and 60000ms');
  }
  
  // Retry attempts validation
  if (config.retryAttempts && (config.retryAttempts < 0 || config.retryAttempts > 10)) {
    throw new Error('Retry attempts must be between 0 and 10');
  }
};

// Validate before initialization
validateConfig(config);
await sdk.initialize(config);
```

### Schema Validation

```typescript
import Joi from 'joi';

const configSchema = Joi.object({
  apiKey: Joi.string().min(10).required(),
  environment: Joi.string().valid('development', 'staging', 'production').required(),
  baseUrl: Joi.string().uri({ scheme: ['https'] }).optional(),
  timeout: Joi.number().min(1000).max(60000).optional(),
  retryAttempts: Joi.number().min(0).max(10).optional(),
  enableAnalytics: Joi.boolean().optional(),
  enablePrivacyMode: Joi.boolean().optional(),
  debugMode: Joi.boolean().optional()
});

const { error, value } = configSchema.validate(config);
if (error) {
  throw new Error(`Configuration validation failed: ${error.message}`);
}

await sdk.initialize(value);
```

## Best Practices

### Configuration Management

1. **Use environment variables** for sensitive data
2. **Validate configuration** before initialization
3. **Use different configs** for different environments
4. **Document configuration options** for your team
5. **Monitor configuration changes** in production

### Security Considerations

1. **Never commit API keys** to version control
2. **Use HTTPS** for all API endpoints
3. **Enable privacy mode** in regulated jurisdictions
4. **Regularly rotate API keys**
5. **Monitor for configuration drift**

### Performance Optimization

1. **Tune timeouts** based on your network conditions
2. **Enable caching** for better performance
3. **Use appropriate retry strategies**
4. **Monitor error rates** and adjust configuration
5. **Test configuration changes** in staging first

## Next Steps

- [Privacy & Compliance Guide](./privacy.md)
- [Analytics Setup](./analytics.md)
- [Performance Optimization](./performance.md)
- [Troubleshooting](./troubleshooting.md)