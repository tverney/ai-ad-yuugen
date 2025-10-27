# Troubleshooting Guide

Common issues and solutions for the AI Ad Yuugen SDK.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Initialization Problems](#initialization-problems)
- [Ad Loading Failures](#ad-loading-failures)
- [Context Analysis Issues](#context-analysis-issues)
- [Privacy and Compliance](#privacy-and-compliance)
- [Performance Issues](#performance-issues)
- [Framework-Specific Issues](#framework-specific-issues)
- [Network and Connectivity](#network-and-connectivity)
- [Debug Mode](#debug-mode)

## Installation Issues

### Package Not Found

**Problem:** `npm install @ai-yuugen/sdk` fails with "package not found"

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Try installing with specific registry
npm install @ai-yuugen/sdk --registry https://registry.npmjs.org/

# Or use yarn
yarn add @ai-yuugen/sdk
```

### TypeScript Errors

**Problem:** TypeScript compilation errors after installation

**Solution:**
```bash
# Install type definitions
npm install --save-dev @types/node

# Update tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

### Peer Dependency Warnings

**Problem:** Warnings about missing peer dependencies

**Solution:**
```bash
# Install required peer dependencies
npm install react@^18.0.0 vue@^3.0.0  # Only install what you need

# Or ignore peer dependency warnings
npm install --legacy-peer-deps
```

## Initialization Problems

### Invalid API Key

**Problem:** `SDKError: Invalid API key provided`

**Solution:**
1. Verify your API key is correct
2. Check the environment (development/staging/production)
3. Ensure API key has proper permissions

```typescript
// Correct format
await sdk.initialize({
  apiKey: 'ak_1234567890abcdef', // Should start with 'ak_'
  environment: 'production'
});
```

### Authentication Failed

**Problem:** `SDKError: Authentication failed with status 403`

**Solution:**
1. Check API key permissions for the environment
2. Verify your account is active
3. Contact support if issue persists

```typescript
// Debug authentication
await sdk.initialize({
  apiKey: 'your-api-key',
  environment: 'development', // Try development first
  debugMode: true // Enable debug logging
});
```

### Initialization Timeout

**Problem:** `SDKError: Authentication timeout after 5000ms`

**Solution:**
```typescript
// Increase timeout
await sdk.initialize({
  apiKey: 'your-api-key',
  environment: 'production',
  timeout: 15000, // 15 seconds
  retryAttempts: 5
});
```

### Network Errors During Init

**Problem:** Network connection failures during initialization

**Solution:**
1. Check internet connectivity
2. Verify firewall settings allow HTTPS requests
3. Try different network or VPN

```typescript
// Custom base URL for network issues
await sdk.initialize({
  apiKey: 'your-api-key',
  environment: 'production',
  baseUrl: 'https://backup-api.ai-yuugen.com' // Fallback URL
});
```

## Ad Loading Failures

### No Ads Available

**Problem:** `AdServingError: No ads available for placement`

**Solution:**
1. Check ad inventory for your account
2. Verify targeting criteria aren't too restrictive
3. Enable fallback ads

```typescript
// Enable fallback configuration
const placement = {
  id: 'main-banner',
  type: AdType.BANNER,
  format: AdFormat.DISPLAY,
  size: { width: 728, height: 90 },
  position: AdPosition.TOP,
  fallbackEnabled: true // Enable fallbacks
};
```

### Context Analysis Failures

**Problem:** Poor ad targeting due to context analysis issues

**Solution:**
```typescript
// Provide more detailed conversation context
const conversation = {
  id: 'conv-123',
  messages: [
    {
      id: 'msg-1',
      role: 'user',
      content: 'I need help choosing a laptop for programming', // More specific content
      timestamp: new Date(),
      metadata: { 
        language: 'en',
        userAgent: navigator.userAgent 
      }
    }
  ],
  topics: [], // Will be populated by analysis
  intent: { primary: 'product_research', confidence: 0.9, category: 'commercial', actionable: true },
  startTime: new Date(),
  lastActivity: new Date(),
  context: {
    domain: 'technology',
    language: 'en',
    formality: 'neutral',
    complexity: 'moderate',
    urgency: 'medium'
  }
};
```

### Ad Display Issues

**Problem:** Ads not rendering properly in DOM

**Solution:**
```typescript
// Ensure container exists and is visible
const container = document.getElementById('ad-container');
if (!container) {
  console.error('Ad container not found');
  return;
}

// Check container dimensions
const rect = container.getBoundingClientRect();
if (rect.width === 0 || rect.height === 0) {
  console.error('Ad container has no dimensions');
  return;
}

// Display ad with error handling
try {
  sdk.displayAd(ad, container);
} catch (error) {
  console.error('Failed to display ad:', error);
}
```

## Context Analysis Issues

### Poor Topic Extraction

**Problem:** Context analyzer not extracting relevant topics

**Solution:**
```typescript
// Provide more context in messages
const message = {
  id: 'msg-1',
  role: 'user',
  content: 'I am looking for a gaming laptop with RTX 4080, 32GB RAM, and good cooling system for competitive gaming',
  timestamp: new Date(),
  metadata: {
    previousTopics: ['gaming', 'hardware'],
    userInterests: ['technology', 'gaming'],
    sessionContext: 'product_research'
  }
};

// Manual topic hints
const context = sdk.analyzeContext(conversation);
context.topics.push({
  name: 'gaming_laptops',
  category: 'technology',
  confidence: 0.9,
  keywords: ['gaming', 'laptop', 'RTX', 'RAM'],
  relevanceScore: 0.95
});
```

### Intent Detection Problems

**Problem:** User intent not detected correctly

**Solution:**
```typescript
// Provide explicit intent hints
const conversation = {
  // ... other properties
  intent: {
    primary: 'purchase_intent',
    secondary: ['product_comparison', 'price_research'],
    confidence: 0.85,
    category: IntentCategory.COMMERCIAL,
    actionable: true
  }
};

// Update user context with behavior patterns
sdk.updateUserContext({
  sessionId: 'session-123',
  recentTopics: [
    { name: 'laptops', category: 'technology', confidence: 0.9, keywords: ['laptop'], relevanceScore: 0.8 }
  ],
  currentIntent: {
    primary: 'purchase_intent',
    confidence: 0.9,
    category: IntentCategory.COMMERCIAL,
    actionable: true
  },
  engagementLevel: { score: 0.8, level: EngagementTier.HIGH, indicators: [], trend: EngagementTrend.INCREASING },
  timeOnPlatform: 600000, // 10 minutes
  interactionCount: 25,
  behaviorPatterns: [
    {
      type: 'product_research',
      frequency: 5,
      lastOccurrence: new Date(),
      confidence: 0.9
    }
  ]
});
```

## Privacy and Compliance

### GDPR Compliance Issues

**Problem:** Privacy violations or compliance warnings

**Solution:**
```typescript
// Proper consent management
sdk.setConsentStatus({
  advertising: true,
  analytics: true,
  personalization: false, // User opted out
  dataSharing: false,
  timestamp: new Date(),
  jurisdiction: 'EU',
  version: '2.0',
  consentMethod: ConsentMethod.EXPLICIT,
  ipAddress: '192.168.1.1', // For audit trail
  userAgent: navigator.userAgent
});

// Enable privacy mode
await sdk.initialize({
  apiKey: 'your-api-key',
  environment: 'production',
  enablePrivacyMode: true, // Enhanced privacy protection
  enableAnalytics: false // Disable if no consent
});
```

### Data Retention Issues

**Problem:** Data retention policy violations

**Solution:**
```typescript
// Configure data retention
const privacySettings = sdk.getPrivacySettings();
privacySettings.dataRetentionPeriod = 30; // 30 days
privacySettings.anonymizationLevel = AnonymizationLevel.ANONYMIZATION;
privacySettings.encryptionEnabled = true;
```

## Performance Issues

### Slow Ad Loading

**Problem:** Ads take too long to load

**Solution:**
```typescript
// Optimize ad requests
await sdk.initialize({
  apiKey: 'your-api-key',
  environment: 'production',
  timeout: 3000, // Reduce timeout
  retryAttempts: 2 // Fewer retries
});

// Preload ads
const preloadedAd = await sdk.requestAd(placement, context);
// Cache for later use
```

### High Memory Usage

**Problem:** SDK consuming too much memory

**Solution:**
```typescript
// Clean up resources
sdk.destroy(); // When done with SDK

// Limit context history
const limitedConversation = {
  ...conversation,
  messages: conversation.messages.slice(-10) // Keep only last 10 messages
};
```

### Bundle Size Issues

**Problem:** SDK adding too much to bundle size

**Solution:**
```javascript
// Use dynamic imports
const { AIYuugenSDK } = await import('@ai-yuugen/sdk');

// Tree shaking - import only what you need
import { AdBanner } from '@ai-yuugen/ui-components/react/AdBanner';
```

## Framework-Specific Issues

### React Issues

**Problem:** Component not re-rendering when context changes

**Solution:**
```tsx
// Use proper dependencies
const MemoizedAdBanner = React.memo(AdBanner, (prevProps, nextProps) => {
  return (
    prevProps.context.confidence === nextProps.context.confidence &&
    JSON.stringify(prevProps.context.topics) === JSON.stringify(nextProps.context.topics)
  );
});
```

### Vue Issues

**Problem:** Reactivity not working with SDK

**Solution:**
```vue
<script setup lang="ts">
import { ref, reactive, watch } from 'vue';

// Use reactive for complex objects
const context = reactive({
  topics: [],
  intent: null,
  confidence: 0
});

// Watch for changes
watch(context, (newContext) => {
  // Re-request ad when context changes
}, { deep: true });
</script>
```

### Angular Issues

**Problem:** Change detection not triggering

**Solution:**
```typescript
import { ChangeDetectorRef } from '@angular/core';

constructor(private cdr: ChangeDetectorRef) {}

async loadAd() {
  const ad = await this.sdk.requestAd(this.placement, this.context);
  this.cdr.detectChanges(); // Manually trigger change detection
}
```

## Network and Connectivity

### CORS Issues

**Problem:** Cross-origin request blocked

**Solution:**
1. Verify your domain is whitelisted in your account settings
2. Check browser console for specific CORS errors
3. Contact support to add your domain

### Firewall Blocking

**Problem:** Corporate firewall blocking requests

**Solution:**
1. Whitelist these domains:
   - `api.ai-yuugen.com`
   - `cdn.ai-yuugen.com`
   - `analytics.ai-yuugen.com`
2. Allow HTTPS traffic on port 443
3. Configure proxy if needed

### SSL Certificate Issues

**Problem:** SSL certificate errors

**Solution:**
```typescript
// For development only - not recommended for production
await sdk.initialize({
  apiKey: 'your-api-key',
  environment: 'development',
  baseUrl: 'http://dev-api.ai-yuugen.com' // HTTP for dev
});
```

## Debug Mode

### Enable Debug Logging

```typescript
// Enable comprehensive debugging
await sdk.initialize({
  apiKey: 'your-api-key',
  environment: 'development',
  debugMode: true
});

// Check browser console for detailed logs
// Logs will show:
// - API requests and responses
// - Context analysis results
// - Ad selection process
// - Error details
```

### Custom Error Handling

```typescript
// Set up custom error handler
const sdk = new AIYuugenSDK({
  enableLogging: true,
  logLevel: 'debug',
  onError: (error, context) => {
    console.error('SDK Error:', error);
    console.log('Error Context:', context);
    
    // Send to your error tracking service
    // errorTracker.captureException(error, context);
  }
});
```

### Performance Monitoring

```typescript
// Monitor SDK performance
const performanceObserver = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.name.includes('ai-yuugen')) {
      console.log(`${entry.name}: ${entry.duration}ms`);
    }
  });
});

performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
```

## Getting Help

If you're still experiencing issues:

1. **Check the FAQ** - [FAQ](./faq.md)
2. **Search GitHub Issues** - [GitHub Issues](https://github.com/ai-yuugen/platform/issues)
3. **Join Discord** - [Discord Community](https://discord.gg/ai-yuugen)
4. **Contact Support** - support@ai-yuugen.com

When reporting issues, please include:
- SDK version
- Framework and version
- Browser and version
- Error messages and stack traces
- Minimal reproduction code
- Network conditions