# API Reference

Complete reference for the AI Ad Yuugen SDK API.

## Table of Contents

- [AIYuugenSDK](#aiadssensesdk)
- [Configuration](#configuration)
- [Types and Interfaces](#types-and-interfaces)
- [Error Handling](#error-handling)
- [Context Analysis](#context-analysis)
- [Privacy Management](#privacy-management)
- [Analytics](#analytics)

## AIYuugenSDK

The main SDK class for integrating AI Ad Yuugen into your application.

### Constructor

```typescript
constructor(errorHandlerConfig?: Partial<ErrorHandlerConfig>)
```

Creates a new SDK instance with optional error handler configuration.

**Parameters:**
- `errorHandlerConfig` (optional): Configuration for error handling behavior

**Example:**
```typescript
const sdk = new AIYuugenSDK({
  maxRetries: 3,
  retryDelay: 1000,
  enableLogging: true
});
```

### Methods

#### initialize(config: SDKConfig): Promise<void>

Initializes the SDK with the provided configuration.

**Parameters:**
- `config`: SDK configuration object

**Returns:** Promise that resolves when initialization is complete

**Throws:** `SDKError` if initialization fails

**Example:**
```typescript
await sdk.initialize({
  apiKey: 'your-api-key',
  environment: 'production',
  timeout: 5000,
  enableAnalytics: true,
  debugMode: false
});
```

#### requestAd(placement: AdPlacement, context: AIContext): Promise<Ad>

Requests an ad for the specified placement and context.

**Parameters:**
- `placement`: Ad placement configuration
- `context`: AI conversation context for targeting

**Returns:** Promise that resolves to an Ad object

**Throws:** `NetworkError`, `AdServingError`, or `SDKIntegrationError`

**Example:**
```typescript
const placement = {
  id: 'sidebar-banner',
  type: AdType.BANNER,
  format: AdFormat.DISPLAY,
  size: { width: 300, height: 250 },
  position: AdPosition.RIGHT
};

const ad = await sdk.requestAd(placement, context);
```

#### displayAd(ad: Ad, container: HTMLElement): void

Displays an ad in the specified DOM container.

**Parameters:**
- `ad`: Ad object to display
- `container`: DOM element to render the ad in

**Example:**
```typescript
const container = document.getElementById('ad-container');
sdk.displayAd(ad, container);
```

#### hideAd(adId: string): void

Hides a currently displayed ad.

**Parameters:**
- `adId`: ID of the ad to hide

**Example:**
```typescript
sdk.hideAd('ad-123');
```

#### analyzeContext(conversation: AIConversation): AIContext

Analyzes an AI conversation to extract targeting context.

**Parameters:**
- `conversation`: AI conversation object

**Returns:** Extracted context for ad targeting

**Example:**
```typescript
const context = sdk.analyzeContext({
  id: 'conv-123',
  messages: [
    {
      id: 'msg-1',
      role: 'user',
      content: 'I need help with JavaScript',
      timestamp: new Date()
    }
  ],
  topics: [],
  intent: { primary: 'learning', confidence: 0.8, category: 'informational', actionable: true },
  startTime: new Date(),
  lastActivity: new Date()
});
```

#### updateUserContext(context: UserContext): void

Updates the user context for improved targeting.

**Parameters:**
- `context`: User context information

**Example:**
```typescript
sdk.updateUserContext({
  sessionId: 'session-123',
  recentTopics: [
    { name: 'programming', category: 'technology', confidence: 0.9, keywords: ['javascript'], relevanceScore: 0.8 }
  ],
  engagementLevel: { score: 0.7, level: 'medium', indicators: [], trend: 'stable' },
  timeOnPlatform: 300000,
  interactionCount: 15,
  behaviorPatterns: []
});
```

#### setConsentStatus(consent: ConsentStatus): void

Sets the user's consent status for privacy compliance.

**Parameters:**
- `consent`: Consent status object

**Example:**
```typescript
sdk.setConsentStatus({
  advertising: true,
  analytics: true,
  personalization: false,
  dataSharing: false,
  timestamp: new Date(),
  jurisdiction: 'EU',
  version: '1.0',
  consentMethod: ConsentMethod.EXPLICIT
});
```

#### getPrivacySettings(): PrivacySettings

Gets the current privacy settings.

**Returns:** Current privacy settings

**Example:**
```typescript
const settings = sdk.getPrivacySettings();
console.log('Privacy level:', settings.privacyLevel);
```

#### trackEvent(event: AdEvent): void

Tracks an analytics event.

**Parameters:**
- `event`: Event to track

**Example:**
```typescript
sdk.trackEvent({
  id: 'event-123',
  type: 'ad_click',
  adId: 'ad-456',
  sessionId: 'session-789',
  timestamp: new Date(),
  context: { placement: 'sidebar' }
});
```

#### getPerformanceMetrics(): Promise<PerformanceMetrics>

Gets performance metrics for the current session.

**Returns:** Promise that resolves to performance metrics

**Example:**
```typescript
const metrics = await sdk.getPerformanceMetrics();
console.log('CTR:', metrics.ctr);
console.log('Revenue:', metrics.revenue);
```

#### destroy(): void

Cleans up SDK resources and stops all operations.

**Example:**
```typescript
sdk.destroy();
```

#### isInitialized(): boolean

Checks if the SDK is initialized.

**Returns:** True if initialized, false otherwise

**Example:**
```typescript
if (sdk.isInitialized()) {
  // SDK is ready to use
}
```

## Configuration

### SDKConfig

Main configuration interface for the SDK.

```typescript
interface SDKConfig {
  apiKey: string;                    // Your API key (required)
  environment: 'development' | 'staging' | 'production'; // Environment (required)
  baseUrl?: string;                  // Custom API base URL
  timeout?: number;                  // Request timeout in milliseconds (default: 5000)
  retryAttempts?: number;            // Number of retry attempts (default: 3)
  enableAnalytics?: boolean;         // Enable analytics tracking (default: true)
  enablePrivacyMode?: boolean;       // Enable enhanced privacy mode (default: false)
  debugMode?: boolean;               // Enable debug logging (default: false)
}
```

**Example:**
```typescript
const config: SDKConfig = {
  apiKey: 'ak_1234567890abcdef',
  environment: 'production',
  timeout: 10000,
  retryAttempts: 5,
  enableAnalytics: true,
  enablePrivacyMode: true,
  debugMode: false
};
```

## Types and Interfaces

### AdPlacement

Defines where and how an ad should be displayed.

```typescript
interface AdPlacement {
  id: string;           // Unique placement identifier
  type: AdType;         // Type of ad (banner, interstitial, native, etc.)
  format: AdFormat;     // Format of ad content (display, text, video, etc.)
  size: AdSize;         // Dimensions of the ad
  position: AdPosition; // Position within the interface
}
```

### Ad

Represents an advertisement.

```typescript
interface Ad {
  id: string;           // Unique ad identifier
  type: AdType;         // Type of ad
  format: AdFormat;     // Format of ad content
  content: AdContent;   // Ad content and assets
  createdAt: Date;      // When the ad was created
  expiresAt: Date;      // When the ad expires
}
```

### AdContent

Contains the actual ad content and assets.

```typescript
interface AdContent {
  title: string;        // Ad headline
  description: string;  // Ad description text
  imageUrl?: string;    // Image asset URL
  videoUrl?: string;    // Video asset URL
  ctaText: string;      // Call-to-action text
  landingUrl: string;   // Destination URL
  brandName: string;    // Advertiser brand name
}
```

### AIContext

Context extracted from AI conversations for targeting.

```typescript
interface AIContext {
  topics: Topic[];                    // Extracted topics
  intent: UserIntent;                 // Detected user intent
  sentiment: SentimentScore;          // Sentiment analysis
  conversationStage: ConversationStage; // Stage of conversation
  userEngagement: EngagementLevel;    // User engagement metrics
  confidence: number;                 // Overall confidence score (0-1)
  extractedAt: Date;                  // When context was extracted
}
```

### Topic

Represents a topic extracted from conversation.

```typescript
interface Topic {
  name: string;         // Topic name
  category: string;     // Topic category
  confidence: number;   // Confidence score (0-1)
  keywords: string[];   // Related keywords
  relevanceScore: number; // Relevance to current context (0-1)
}
```

### UserIntent

Represents detected user intent.

```typescript
interface UserIntent {
  primary: string;              // Primary intent
  secondary?: string[];         // Secondary intents
  confidence: number;           // Confidence score (0-1)
  category: IntentCategory;     // Intent category
  actionable: boolean;          // Whether intent is actionable
}

enum IntentCategory {
  INFORMATIONAL = 'informational',
  TRANSACTIONAL = 'transactional',
  NAVIGATIONAL = 'navigational',
  COMMERCIAL = 'commercial',
  ENTERTAINMENT = 'entertainment',
  SUPPORT = 'support'
}
```

## Error Handling

### SDKError

Main error class for SDK-related errors.

```typescript
class SDKError extends Error {
  public readonly type: SDKErrorType;
  public readonly code: string;
  public readonly details?: Record<string, any>;
}

enum SDKErrorType {
  INVALID_CONFIG = 'INVALID_CONFIG',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INITIALIZATION_TIMEOUT = 'INITIALIZATION_TIMEOUT',
  INVALID_API_KEY = 'INVALID_API_KEY'
}
```

### Error Handling Example

```typescript
try {
  await sdk.initialize(config);
} catch (error) {
  if (error instanceof SDKError) {
    switch (error.type) {
      case SDKErrorType.INVALID_API_KEY:
        console.error('Invalid API key provided');
        break;
      case SDKErrorType.NETWORK_ERROR:
        console.error('Network connection failed');
        break;
      default:
        console.error('SDK initialization failed:', error.message);
    }
  }
}
```

## Context Analysis

### ContextAnalyzer

Interface for analyzing AI conversations.

```typescript
interface ContextAnalyzer {
  analyzeConversation(conversation: AIConversation): AIContext;
  extractTopics(text: string): Topic[];
  detectIntent(conversation: AIConversation): UserIntent;
  analyzeSentiment(text: string): SentimentScore;
  detectConversationStage(conversation: AIConversation): ConversationStage;
  calculateEngagement(conversation: AIConversation, userContext?: UserContext): EngagementLevel;
  updateContext(currentContext: AIContext, newMessage: AIMessage): AIContext;
}
```

## Privacy Management

### ConsentStatus

Represents user consent for various data processing activities.

```typescript
interface ConsentStatus {
  advertising: boolean;         // Consent for advertising
  analytics: boolean;           // Consent for analytics
  personalization: boolean;     // Consent for personalization
  dataSharing: boolean;         // Consent for data sharing
  timestamp: Date;              // When consent was given
  jurisdiction: string;         // Legal jurisdiction
  version: string;              // Consent version
  ipAddress?: string;           // IP address when consent given
  userAgent?: string;           // User agent when consent given
  consentMethod: ConsentMethod; // How consent was obtained
}
```

## Analytics

### PerformanceMetrics

Performance metrics for ad campaigns.

```typescript
interface PerformanceMetrics {
  impressions: number;      // Number of ad impressions
  clicks: number;           // Number of ad clicks
  conversions: number;      // Number of conversions
  ctr: number;              // Click-through rate
  cpm: number;              // Cost per mille (thousand impressions)
  revenue: number;          // Total revenue generated
  engagementScore: number;  // User engagement score
}
```

### AdEvent

Represents an analytics event.

```typescript
interface AdEvent {
  id: string;                    // Unique event ID
  type: string;                  // Event type (impression, click, conversion)
  adId: string;                  // Associated ad ID
  userId?: string;               // User ID (if available)
  sessionId: string;             // Session ID
  timestamp: Date;               // When event occurred
  context: Record<string, any>;  // Event context data
  metadata?: Record<string, any>; // Additional metadata
}
```

## Constants and Enums

### AdType

```typescript
enum AdType {
  BANNER = 'banner',
  INTERSTITIAL = 'interstitial',
  NATIVE = 'native',
  VIDEO = 'video',
  REWARDED = 'rewarded'
}
```

### AdFormat

```typescript
enum AdFormat {
  DISPLAY = 'display',
  TEXT = 'text',
  RICH_MEDIA = 'rich_media',
  VIDEO = 'video',
  INTERACTIVE = 'interactive'
}
```

### AdPosition

```typescript
enum AdPosition {
  TOP = 'top',
  BOTTOM = 'bottom',
  LEFT = 'left',
  RIGHT = 'right',
  INLINE = 'inline',
  OVERLAY = 'overlay',
  FLOATING = 'floating'
}
```