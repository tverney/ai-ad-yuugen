# AI Ad Yuugen SDK

The official JavaScript/TypeScript SDK for integrating AI Ad Yuugen's contextual advertising platform into your applications.

## Features

- 🎯 **AI-Powered Contextual Targeting** - Analyze conversation context for relevant ad placement
- 🔒 **Privacy-First** - Built-in privacy controls and GDPR/CCPA compliance
- 📊 **Performance Monitoring** - Real-time metrics and optimization suggestions
- 🚀 **ADCP Integration** - Enhanced targeting with Ad Context Protocol signals
- 🔄 **Automatic Fallbacks** - Graceful degradation when services are unavailable
- 📦 **TypeScript Support** - Full type definitions included

## Installation

```bash
npm install @ai-yuugen/sdk
```

## Quick Start

### Basic Usage

```typescript
import { AIYuugenSDK } from '@ai-yuugen/sdk';

// Initialize the SDK
const sdk = new AIYuugenSDK();

await sdk.initialize({
  apiKey: 'your-api-key',
  environment: 'production'
});

// Analyze conversation context
const context = sdk.analyzeContext({
  messages: [
    { role: 'user', content: 'I need help planning a vacation to Hawaii' },
    { role: 'assistant', content: 'I can help you plan your Hawaii trip!' }
  ]
});

// Request an ad
const ad = await sdk.requestAd(
  {
    id: 'sidebar-1',
    format: 'display',
    size: { width: 300, height: 250 }
  },
  context
);

console.log('Ad received:', ad);
```

## ADCP Integration

The SDK supports the Ad Context Protocol (ADCP) for enhanced targeting using premium audience signals.

### Enabling ADCP

```typescript
import { AIYuugenSDK } from '@ai-yuugen/sdk';

const sdk = new AIYuugenSDK();

await sdk.initialize({
  apiKey: 'your-api-key',
  environment: 'production'
});

// Enable ADCP with configuration
sdk.enableADCP({
  mcp: {
    serverUrl: 'https://mcp.adcp-platform.com',
    timeout: 5000,
    maxRetries: 3
  },
  auth: {
    apiKey: 'your-adcp-api-key',
    providers: ['scope3', 'liveramp']
  },
  cache: {
    enabled: true,
    ttl: 300, // 5 minutes
    maxSize: 1000
  }
});
```

### Requesting Ads with Signal Enhancement

```typescript
// Request an ad with ADCP signal preferences
const ad = await sdk.requestAdWithSignals(
  {
    id: 'main-content',
    format: 'native',
    size: { width: 728, height: 90 }
  },
  context,
  {
    // Optional signal preferences
    providers: ['scope3', 'liveramp'],
    categories: ['demographic', 'behavioral'],
    maxCPM: 5.0,
    minReach: 10000,
    budget: 100
  }
);
```

### Getting Available Signals

```typescript
// Discover available signals for a context
const signals = await sdk.getAvailableSignals(context);

console.log('Available signals:', signals);
// [
//   {
//     id: 'sig_123',
//     name: 'Travel Enthusiasts',
//     provider: 'scope3',
//     category: 'behavioral',
//     cpm: 3.5,
//     reach: 50000,
//     confidence: 0.85
//   },
//   ...
// ]
```

### Getting Signal Insights

```typescript
// Get insights about signals used for a served ad
const insights = await sdk.getSignalInsights(ad.id);

console.log('Signal insights:', insights);
// [
//   {
//     signalId: 'sig_123',
//     signalName: 'Travel Enthusiasts',
//     provider: 'scope3',
//     category: 'behavioral',
//     contribution: 0.75,
//     impact: {
//       ctrLift: 0.25,
//       conversionLift: 0.15,
//       engagementLift: 0.30
//     }
//   },
//   ...
// ]
```

### Disabling ADCP

```typescript
// Disable ADCP integration
sdk.disableADCP();

// Check if ADCP is enabled
if (sdk.isADCPEnabled()) {
  console.log('ADCP is active');
}
```

## Configuration Options

### SDK Configuration

```typescript
interface SDKConfig {
  // Required
  apiKey: string;
  environment: 'development' | 'staging' | 'production';
  
  // Optional
  baseUrl?: string;           // Custom API endpoint
  timeout?: number;           // Request timeout (default: 5000ms)
  retryAttempts?: number;     // Retry attempts (default: 3)
  enableAnalytics?: boolean;  // Enable analytics (default: true)
  enablePrivacyMode?: boolean; // Privacy mode (default: false)
  debugMode?: boolean;        // Debug logging (default: false)
}
```

### ADCP Configuration

```typescript
interface ADCPConfig {
  mcp: {
    serverUrl: string;        // MCP server URL
    timeout?: number;         // Request timeout (default: 5000ms)
    maxRetries?: number;      // Max retry attempts (default: 3)
  };
  auth: {
    apiKey?: string;          // ADCP API key
    providers?: string[];     // Enabled signal providers
  };
  cache?: {
    enabled?: boolean;        // Enable caching (default: true)
    ttl?: number;            // Cache TTL in seconds (default: 300)
    maxSize?: number;        // Max cache entries (default: 1000)
  };
  endpoints?: {
    signalsUrl?: string;     // Custom signals endpoint
    mediaBuyUrl?: string;    // Custom media buy endpoint
    analyticsUrl?: string;   // Custom analytics endpoint
  };
}
```

### Signal Preferences

```typescript
interface SignalPreferences {
  providers?: string[];      // Preferred signal providers
  categories?: string[];     // Preferred signal categories
  maxCPM?: number;          // Maximum CPM willing to pay
  minReach?: number;        // Minimum audience reach required
  budget?: number;          // Budget allocated for signals
  currency?: string;        // Currency code (default: 'USD')
}
```

## API Reference

### Core Methods

#### `initialize(config: SDKConfig): Promise<void>`
Initialize the SDK with configuration.

#### `requestAd(placement: AdPlacement, context: AIContext): Promise<Ad>`
Request an ad using standard targeting.

#### `analyzeContext(conversation: AIConversation): AIContext`
Analyze conversation context for ad targeting.

#### `destroy(): void`
Clean up SDK resources.

### ADCP Methods

#### `enableADCP(config: ADCPConfig): void`
Enable ADCP integration with configuration.

#### `disableADCP(): void`
Disable ADCP integration.

#### `isADCPEnabled(): boolean`
Check if ADCP is currently enabled.

#### `requestAdWithSignals(placement: AdPlacement, context: AIContext, preferences?: SignalPreferences): Promise<Ad>`
Request an ad with ADCP signal enhancement.

#### `getAvailableSignals(context: AIContext): Promise<Signal[]>`
Get available signals for a given context.

#### `getSignalInsights(adId: string): Promise<SignalInsight[]>`
Get signal insights for a served ad.

### Performance Methods

#### `getPerformanceMetrics(): Promise<PerformanceMetrics>`
Get current performance metrics.

#### `applyPerformanceOptimizations(): void`
Apply recommended performance optimizations.

## Migration Guide

### Upgrading from Standard to ADCP-Enhanced Targeting

If you're currently using standard ad requests and want to add ADCP enhancement:

**Before:**
```typescript
const ad = await sdk.requestAd(placement, context);
```

**After:**
```typescript
// Enable ADCP first
sdk.enableADCP(adcpConfig);

// Use enhanced ad requests
const ad = await sdk.requestAdWithSignals(placement, context, {
  maxCPM: 5.0,
  minReach: 10000
});
```

**Important Notes:**
- The standard `requestAd()` method continues to work unchanged
- ADCP features are completely opt-in
- If ADCP fails, the SDK automatically falls back to standard targeting
- No breaking changes to existing code

## Error Handling

The SDK includes comprehensive error handling with automatic fallbacks:

```typescript
try {
  const ad = await sdk.requestAdWithSignals(placement, context);
} catch (error) {
  if (error.code === 'ADCP_ENABLE_FAILED') {
    console.error('Failed to enable ADCP:', error.message);
  } else if (error.code === 'AD_MANAGER_NOT_INITIALIZED') {
    console.error('SDK not properly initialized');
  }
}
```

### Common Error Codes

- `SDK_NOT_INITIALIZED` - SDK must be initialized before use
- `INVALID_CONFIG` - Configuration validation failed
- `INVALID_API_KEY` - Invalid or missing API key
- `ADCP_ENABLE_FAILED` - Failed to enable ADCP integration
- `AD_MANAGER_NOT_INITIALIZED` - Ad manager not initialized
- `NETWORK_ERROR` - Network request failed

## Examples

### Complete Integration Example

```typescript
import { AIYuugenSDK } from '@ai-yuugen/sdk';

async function setupAds() {
  const sdk = new AIYuugenSDK();
  
  // Initialize SDK
  await sdk.initialize({
    apiKey: process.env.AI_YUUGEN_API_KEY!,
    environment: 'production',
    debugMode: false
  });
  
  // Enable ADCP for enhanced targeting
  sdk.enableADCP({
    mcp: {
      serverUrl: process.env.ADCP_MCP_URL!,
      timeout: 5000
    },
    auth: {
      apiKey: process.env.ADCP_API_KEY!,
      providers: ['scope3', 'liveramp']
    },
    cache: {
      enabled: true,
      ttl: 300
    }
  });
  
  // Analyze conversation
  const context = sdk.analyzeContext({
    messages: [
      { role: 'user', content: 'Looking for travel insurance' },
      { role: 'assistant', content: 'I can help with that!' }
    ]
  });
  
  // Request ad with signals
  const ad = await sdk.requestAdWithSignals(
    {
      id: 'content-ad',
      format: 'native',
      size: { width: 728, height: 90 }
    },
    context,
    {
      categories: ['demographic', 'behavioral'],
      maxCPM: 4.0,
      budget: 50
    }
  );
  
  // Get insights
  const insights = await sdk.getSignalInsights(ad.id);
  console.log('Performance insights:', insights);
  
  return ad;
}
```

## Performance Best Practices

1. **Enable Caching**: Always enable ADCP caching to reduce latency
2. **Set Reasonable Timeouts**: Use 5000ms or higher for ADCP requests
3. **Use Signal Preferences**: Specify preferences to reduce signal discovery time
4. **Monitor Metrics**: Regularly check performance metrics
5. **Handle Errors Gracefully**: Always implement fallback logic

## Support

- Documentation: https://docs.ai-yuugen.com
- API Reference: https://api.ai-yuugen.com/docs
- Issues: https://github.com/ai-yuugen/sdk/issues
- Email: support@ai-yuugen.com

## License

MIT License - see LICENSE file for details
