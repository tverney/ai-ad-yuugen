# @ai-yuugen/types

TypeScript type definitions for the AI Ad Yuugen platform, including core ad serving types and ADCP (Ad Context Protocol) integration types.

## Installation

```bash
npm install @ai-yuugen/types
```

## Overview

This package provides comprehensive TypeScript type definitions for:

- **Core Ad Types**: Ad placements, content, requests, and responses
- **AI Context Types**: Conversation analysis, intent detection, and engagement tracking
- **Privacy & Compliance**: GDPR/CCPA compliance, consent management, and data privacy
- **Analytics**: Performance metrics, insights, and reporting
- **ADCP Integration**: Signal discovery, activation, media buying, and enhanced targeting

## Usage

### Basic Ad Request

```typescript
import {
  AdPlacement,
  AdType,
  AdFormat,
  AdPosition,
  AIContext,
  AdRequest,
} from '@ai-yuugen/types';

const placement: AdPlacement = {
  id: 'banner-top',
  type: AdType.BANNER,
  format: AdFormat.DISPLAY,
  size: { width: 728, height: 90 },
  position: AdPosition.TOP,
};

const context: AIContext = {
  topics: [
    {
      name: 'technology',
      category: 'tech',
      confidence: 0.9,
      keywords: ['AI', 'machine learning'],
      relevanceScore: 0.85,
    },
  ],
  intent: {
    primary: 'research',
    confidence: 0.8,
    category: IntentCategory.INFORMATIONAL,
    actionable: true,
  },
  sentiment: {
    polarity: 0.5,
    magnitude: 0.7,
    label: SentimentLabel.POSITIVE,
    confidence: 0.85,
  },
  conversationStage: {
    stage: ConversationPhase.EXPLORATION,
    progress: 0.4,
    duration: 120000,
    messageCount: 5,
  },
  userEngagement: {
    score: 0.75,
    level: EngagementTier.HIGH,
    indicators: [],
    trend: EngagementTrend.INCREASING,
  },
  confidence: 0.85,
  extractedAt: new Date(),
};
```

### ADCP Signal Discovery

```typescript
import {
  SignalQuery,
  SignalCategory,
  SignalProvider,
  Signal,
  PriceRange,
} from '@ai-yuugen/types';

const query: SignalQuery = {
  text: 'technology enthusiasts interested in AI',
  categories: [SignalCategory.BEHAVIORAL, SignalCategory.CONTEXTUAL],
  providers: [SignalProvider.SCOPE3, SignalProvider.LIVERAMP],
  priceRange: {
    min: 1.0,
    max: 10.0,
    currency: 'USD',
  },
  minReach: 100000,
  geography: {
    countries: ['US', 'CA'],
    regions: ['CA', 'NY'],
  },
  limit: 10,
};

// Signal response
const signal: Signal = {
  id: 'sig_123',
  name: 'AI Technology Enthusiasts',
  description: 'Users actively researching AI and machine learning',
  provider: SignalProvider.SCOPE3,
  category: SignalCategory.BEHAVIORAL,
  cpm: 5.5,
  reach: 250000,
  confidence: 0.92,
  metadata: {
    topics: ['artificial intelligence', 'machine learning', 'deep learning'],
    intents: ['research', 'purchase'],
    dataFreshness: 0.95,
    dataSource: 'behavioral tracking',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

### Signal Activation

```typescript
import {
  ActivationConfig,
  Activation,
  ActivationStatus,
} from '@ai-yuugen/types';

const activationConfig: ActivationConfig = {
  signalId: 'sig_123',
  durationHours: 24,
  budget: 500,
  currency: 'USD',
  targetImpressions: 100000,
  priority: 8,
};

// Activation response
const activation: Activation = {
  id: 'act_456',
  signalId: 'sig_123',
  status: ActivationStatus.ACTIVE,
  cost: 275.5,
  currency: 'USD',
  reach: 125000,
  performance: {
    impressions: 50000,
    clicks: 1250,
    conversions: 125,
    ctr: 0.025,
    cpa: 2.2,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
};
```

### Enhanced AI Context with Signals

```typescript
import {
  EnhancedAIContext,
  ScoredSignal,
  SignalScores,
} from '@ai-yuugen/types';

const scoredSignal: ScoredSignal = {
  ...signal, // Base signal properties
  scores: {
    relevance: 0.92,
    quality: 0.88,
    costEfficiency: 0.75,
    reach: 0.65,
    total: 0.83,
  },
  selected: true,
  activationId: 'act_456',
};

const enhancedContext: EnhancedAIContext = {
  ...context, // Base AIContext properties
  adcpSignals: [scoredSignal],
  signalActivations: ['act_456'],
  enhancementMetadata: {
    enhancedAt: new Date(),
    signalCount: 1,
    totalCost: 275.5,
    expectedLift: 0.25,
    confidence: 0.88,
    processingTimeMs: 145,
  },
};
```

### Media Buy Request

```typescript
import {
  MediaBuyRequest,
  Duration,
  TargetingConfig,
  OptimizationConfig,
  OptimizationGoal,
  BidStrategy,
  PacingStrategy,
  DeviceType,
} from '@ai-yuugen/types';

const targeting: TargetingConfig = {
  geography: {
    countries: ['US'],
    regions: ['CA', 'NY', 'TX'],
  },
  demographics: {
    ageRange: AgeRange.AGE_25_34,
    gender: Gender.PREFER_NOT_TO_SAY,
    language: 'en',
    timezone: 'America/Los_Angeles',
  },
  interests: ['technology', 'artificial intelligence'],
  keywords: ['AI', 'machine learning', 'automation'],
  devices: [DeviceType.DESKTOP, DeviceType.MOBILE],
  timeOfDay: {
    start: 9,
    end: 17,
  },
  daysOfWeek: [1, 2, 3, 4, 5], // Monday-Friday
};

const optimization: OptimizationConfig = {
  goal: OptimizationGoal.MAXIMIZE_CONVERSIONS,
  targetValue: 5.0, // Target CPA of $5
  bidStrategy: BidStrategy.TARGET_CPA,
  pacingStrategy: PacingStrategy.EVEN,
  autoOptimize: true,
  optimizationFrequencyHours: 6,
};

const buyRequest: MediaBuyRequest = {
  budget: 10000,
  currency: 'USD',
  duration: {
    start: new Date(),
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  },
  targeting,
  platforms: ['google-ads', 'facebook-ads', 'linkedin-ads'],
  baseBid: 2.5,
  optimization,
  campaignName: 'AI Technology Campaign',
  campaignDescription: 'Targeting AI enthusiasts for product launch',
};
```

### Analytics and Reporting

```typescript
import {
  AnalyticsRequest,
  AnalyticsData,
  ReportConfig,
  Report,
} from '@ai-yuugen/types';

const analyticsRequest: AnalyticsRequest = {
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-01-31'),
  metrics: ['impressions', 'clicks', 'conversions', 'ctr', 'cpa', 'roas'],
  dimensions: ['campaign', 'signal', 'platform'],
  campaignIds: ['camp_123', 'camp_456'],
  signalIds: ['sig_123'],
};

const reportConfig: ReportConfig = {
  type: 'performance',
  timeRange: {
    start: new Date('2025-01-01'),
    end: new Date('2025-01-31'),
  },
  groupBy: 'day',
  metrics: ['impressions', 'clicks', 'conversions', 'revenue'],
  filters: {
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-31'),
  },
};
```

### ADCP Configuration

```typescript
import {
  ADCPConfig,
  MCPConfig,
  AuthConfig,
  CacheConfig,
} from '@ai-yuugen/types';

const adcpConfig: ADCPConfig = {
  mcp: {
    serverUrl: 'https://mcp.adcp.example.com',
    timeout: 5000,
    maxConnections: 10,
    pooling: true,
    retry: {
      maxAttempts: 3,
      backoffMs: 100,
    },
  },
  auth: {
    apiKey: 'your-api-key',
    rotation: {
      enabled: true,
      intervalDays: 90,
    },
  },
  cache: {
    enabled: true,
    ttl: 300, // 5 minutes
    redisUrl: 'redis://localhost:6379',
    maxSize: 100, // 100 MB
    evictionPolicy: 'lru',
  },
  enabled: true,
};
```

## Type Categories

### Core Ad Types

- `SDKConfig` - SDK configuration
- `AdPlacement` - Ad placement specification
- `Ad` - Ad content and metadata
- `AdRequest` / `AdResponse` - Ad serving request/response
- `AdType`, `AdFormat`, `AdPosition` - Ad classification enums

### AI Context Types

- `AIContext` - AI-extracted conversation context
- `Topic` - Conversation topic with confidence
- `UserIntent` - User intent classification
- `SentimentScore` - Sentiment analysis result
- `ConversationStage` - Conversation phase tracking
- `EngagementLevel` - User engagement metrics

### ADCP Core Types

- `ADCPConfig` - ADCP integration configuration
- `Signal` - Audience signal for targeting
- `SignalQuery` - Signal discovery parameters
- `Activation` - Signal activation record
- `ScoredSignal` - Ranked signal with scores
- `EnhancedAIContext` - AI context with ADCP signals

### Media Buy Types

- `MediaBuyRequest` / `MediaBuyResponse` - Programmatic ad buying
- `TargetingConfig` - Audience targeting parameters
- `OptimizationConfig` - Campaign optimization settings
- `CampaignConfig` / `CampaignStatus` - Campaign management

### Analytics Types

- `PerformanceMetrics` - Ad performance metrics
- `AnalyticsRequest` / `AnalyticsData` - Analytics queries
- `ReportConfig` / `Report` - Report generation
- `AnalyticsInsight` - AI-generated insights

### Privacy & Compliance Types

- `ConsentStatus` - User consent tracking
- `PrivacySettings` - Privacy configuration
- `OptOutRequest` - Data opt-out requests
- `ComplianceFlag` - Regulatory compliance tracking

## Enumerations

### Signal Enums

- `SignalProvider` - Signal data providers (Scope3, LiveRamp, Nielsen, etc.)
- `SignalCategory` - Signal categories (demographic, behavioral, contextual, etc.)
- `ActivationStatus` - Signal activation states

### Media Buy Enums

- `BuyStatus` - Media buy states
- `OptimizationGoal` - Campaign optimization objectives
- `BidStrategy` - Bidding strategies
- `PacingStrategy` - Budget pacing methods

### Error Codes

- `ADCPErrorCode` - ADCP-specific error codes
- `AdRequestErrorType` - Ad request error types

## Backward Compatibility

All ADCP types are additive and do not modify existing types. The `EnhancedAIContext` interface extends `AIContext` with optional ADCP properties, ensuring full backward compatibility with existing code.

```typescript
// Existing code continues to work
const context: AIContext = { /* ... */ };

// New code can use enhanced context
const enhancedContext: EnhancedAIContext = {
  ...context,
  adcpSignals: [/* ... */],
};

// Type guards for runtime checks
function isEnhancedContext(ctx: AIContext): ctx is EnhancedAIContext {
  return 'adcpSignals' in ctx;
}
```

## Contributing

When adding new types:

1. Add comprehensive JSDoc comments
2. Include usage examples in this README
3. Ensure backward compatibility
4. Update the type categories section
5. Run type checks: `npm run type-check`

## License

MIT
