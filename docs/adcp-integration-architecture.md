# ADCP Integration Architecture Document

## Executive Summary

This document provides a comprehensive architectural design for integrating the Ad Context Protocol (ADCP) with the AI Ad Yuugen platform. The integration enhances ad targeting through premium audience signals, enables programmatic ad sourcing, and provides unified cross-platform analytics.

**Document Version:** 1.0  
**Last Updated:** October 26, 2025  
**Status:** Design Complete  
**Author:** AI Ad Yuugen Development Team

**Key Architectural Decisions:**
- Layered architecture with clear separation of concerns
- MCP-based communication for protocol compliance
- Two-level caching strategy for performance optimization
- Circuit breaker pattern for fault tolerance
- Fallback mechanisms to ensure ad serving continuity
- Multi-provider support through adapter pattern

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [ADCP Capability Mapping](#2-adcp-capability-mapping)
3. [Package Structure](#3-package-structure)
4. [Integration Points](#4-integration-points)
5. [Error Handling Strategy](#5-error-handling-strategy)
6. [Caching Strategy](#6-caching-strategy)
7. [Data Flow Diagrams](#7-data-flow-diagrams)
8. [Security Architecture](#8-security-architecture)
9. [Performance Considerations](#9-performance-considerations)
10. [Deployment Architecture](#10-deployment-architecture)

---

## 1. Architecture Overview

### 1.1 High-Level System Architecture

The ADCP integration introduces a new integration layer that sits between AI Ad Yuugen's core components and external ADCP-enabled platforms:

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Developer    │  │   AI Ad      │  │   Analytics  │      │
│  │   Portal     │  │   Yuugen SDK │  │   Dashboard  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼─────────────┐
│                    Service Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Enhanced    │  │  Media Buy   │  │   Unified    │      │
│  │  Targeting   │  │   Engine     │  │  Analytics   │      │
│  │   Engine     │  │              │  │              │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼─────────────┐
│                 ADCP Integration Layer                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              ADCP Client Library                     │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │   │
│  │  │  Signals   │  │ Media Buy  │  │ Analytics  │    │   │
│  │  │    API     │  │    API     │  │    API     │    │   │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘    │   │
│  └────────┼───────────────┼───────────────┼───────────┘   │
│           │               │               │                 │
│  ┌────────▼───────────────▼───────────────▼───────────┐   │
│  │         MCP Client & Connection Pool               │   │
│  └────────┬───────────────────────────────────────────┘   │
└───────────┼─────────────────────────────────────────────────┘
            │
┌───────────▼─────────────────────────────────────────────────┐
│                  Infrastructure Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Redis     │  │  PostgreSQL  │  │   Message    │      │
│  │    Cache     │  │   Database   │  │    Queue     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────────────────────────────────────────┘
            │
┌───────────▼─────────────────────────────────────────────────┐
│                  External Services                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Scope3     │  │   LiveRamp   │  │   Nielsen    │      │
│  │   Signals    │  │   Signals    │  │   Signals    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Google      │  │  The Trade   │  │   Amazon     │      │
│  │   DV360      │  │    Desk      │  │    DSP       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────────────────────────────────────────┘
```


### 1.2 Architectural Principles

**1. Separation of Concerns**
- Clear boundaries between protocol communication, business logic, and data management
- Each layer has well-defined responsibilities and interfaces
- Minimal coupling between components

**2. Fault Tolerance**
- Circuit breaker pattern prevents cascading failures
- Graceful degradation when ADCP services are unavailable
- Fallback to standard targeting ensures continuous ad serving

**3. Performance Optimization**
- Two-level caching (L1: in-memory, L2: Redis) reduces API latency
- Connection pooling minimizes overhead
- Async operations prevent blocking
- Request coalescing eliminates duplicate calls

**4. Extensibility**
- Adapter pattern allows easy addition of new signal providers
- Plugin architecture for custom targeting strategies
- Event-driven design enables future enhancements

**5. Security First**
- Encrypted credential storage
- TLS 1.3+ for all external communications
- Role-based access control
- Comprehensive audit logging

**6. Observability**
- Structured logging for all operations
- Real-time metrics collection
- Distributed tracing support
- Alerting for critical issues

---

## 2. ADCP Capability Mapping

### 2.1 Signals Activation Protocol → AI Ad Yuugen Features

| ADCP Capability | AI Ad Yuugen Feature | Integration Point | Priority |
|----------------|---------------------|-------------------|----------|
| Signal Discovery | Enhanced Context Analysis | `EnhancedTargetingEngine.enhanceContext()` | High |
| Signal Activation | Dynamic Audience Targeting | `SignalScorer.scoreSignals()` | High |
| Signal Status Tracking | Real-time Performance Monitoring | `UnifiedAnalytics.getMetrics()` | Medium |
| Multi-Provider Support | Aggregated Signal Marketplace | `SignalsAPI.discover()` | High |
| Signal Metadata | Targeting Criteria Enrichment | `ContextAnalyzer.createSignalQuery()` | Medium |
| Cost Management | Budget-Aware Signal Selection | `SignalScorer.calculateCostEfficiency()` | High |

### 2.2 Media Buy Protocol → AI Ad Yuugen Features

| ADCP Capability | AI Ad Yuugen Feature | Integration Point | Priority |
|----------------|---------------------|-------------------|----------|
| Programmatic Buying | Multi-Platform Ad Sourcing | `MediaBuyEngine.executeBuy()` | Medium |
| Bid Optimization | Performance-Based Bidding | `BidOptimizer.optimize()` | Medium |
| Campaign Management | Unified Campaign Dashboard | Developer Portal | Medium |
| Budget Tracking | Spend Management | `BudgetManager` | High |
| Performance Analytics | Cross-Platform Reporting | `UnifiedAnalytics` | Medium |
| Platform Abstraction | Unified DSP Interface | `MediaBuyAPI` | Low |

### 2.3 Feature Priority Matrix

```
High Priority (Phase 2):
├── Signal Discovery & Activation
├── Enhanced Targeting Engine
├── Signal Caching
├── Budget Management
└── Basic Analytics

Medium Priority (Phase 3):
├── Media Buy Integration
├── Advanced Analytics
├── Natural Language Interface
└── Developer Portal Enhancements

Low Priority (Future):
├── Advanced Bid Optimization
├── Multi-Platform Campaign Orchestration
└── Predictive Analytics
```

---

## 3. Package Structure

### 3.1 New Package: @ai-yuugen/adcp-client

```
packages/adcp-client/
├── src/
│   ├── client/
│   │   ├── adcp-client.ts              # Main client orchestrator
│   │   ├── mcp-client.ts               # MCP protocol implementation
│   │   ├── auth-manager.ts             # Authentication & key management
│   │   └── connection-pool.ts          # Connection pooling
│   │
│   ├── protocols/
│   │   ├── signals/
│   │   │   ├── signals-api.ts          # Signals Activation Protocol
│   │   │   ├── signal-discovery.ts     # Discovery logic
│   │   │   ├── signal-activation.ts    # Activation logic
│   │   │   └── signal-status.ts        # Status tracking
│   │   │
│   │   ├── media-buy/
│   │   │   ├── media-buy-api.ts        # Media Buy Protocol
│   │   │   ├── bid-manager.ts          # Bid management
│   │   │   ├── campaign-manager.ts     # Campaign lifecycle
│   │   │   └── platform-adapter.ts     # DSP platform adapters
│   │   │
│   │   └── analytics/
│   │       ├── analytics-api.ts        # Analytics Protocol
│   │       └── metrics-collector.ts    # Metrics collection
│   │
│   ├── cache/
│   │   ├── signal-cache.ts             # Signal caching logic
│   │   ├── cache-strategy.ts           # Cache key generation
│   │   ├── l1-cache.ts                 # In-memory cache
│   │   └── l2-cache.ts                 # Redis cache
│   │
│   ├── utils/
│   │   ├── error-handler.ts            # Error handling & retry
│   │   ├── retry-logic.ts              # Exponential backoff
│   │   ├── circuit-breaker.ts          # Circuit breaker pattern
│   │   ├── logger.ts                   # Structured logging
│   │   └── request-coalescer.ts        # Request deduplication
│   │
│   ├── types/
│   │   ├── adcp-types.ts               # Core ADCP types
│   │   ├── signal-types.ts             # Signal-related types
│   │   ├── media-buy-types.ts          # Media buy types
│   │   └── error-types.ts              # Error types
│   │
│   └── index.ts                        # Public API exports
│
├── tests/
│   ├── unit/                           # Unit tests
│   ├── integration/                    # Integration tests
│   └── fixtures/                       # Test fixtures
│
├── package.json
├── tsconfig.json
├── README.md
└── CHANGELOG.md
```


### 3.2 Enhanced Existing Packages

#### packages/types/src/index.ts (Enhancements)

```typescript
// New ADCP-related type exports
export * from './adcp-types';
export * from './signal-types';
export * from './media-buy-types';

// Core ADCP Types
export interface ADCPConfig {
  mcp: MCPConfig;
  auth: AuthConfig;
  cache: CacheConfig;
  endpoints: EndpointConfig;
  providers: SignalProvider[];
}

export interface Signal {
  id: string;
  name: string;
  description: string;
  provider: SignalProvider;
  category: SignalCategory;
  cpm: number;
  reach: number;
  confidence: number;
  metadata: SignalMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnhancedAIContext extends AIContext {
  adcpSignals?: ScoredSignal[];
  signalActivations?: string[];
  enhancementMetadata?: EnhancementMetadata;
}

// ... additional types
```

#### packages/server/src/services/ (New Services)

```
packages/server/src/services/
├── enhanced-targeting-engine.ts        # ADCP-enhanced targeting
├── signal-scorer.ts                    # Signal scoring algorithm
├── context-analyzer.ts                 # Context → Signal query
├── media-buy-engine.ts                 # Media buy orchestration
├── bid-optimizer.ts                    # Bid optimization
├── budget-manager.ts                   # Budget tracking
├── unified-analytics.ts                # Cross-platform analytics
├── nl-campaign-manager.ts              # Natural language interface
└── adcp-monitor.ts                     # ADCP-specific monitoring
```

#### packages/sdk/src/core/sdk.ts (Enhancements)

```typescript
export class AIYuugenSDK {
  // Existing methods...
  
  // New ADCP methods
  enableADCP(config: ADCPConfig): void;
  disableADCP(): void;
  requestAdWithSignals(
    placement: AdPlacement,
    context: AIContext,
    preferences?: SignalPreferences
  ): Promise<Ad>;
  getAvailableSignals(context: AIContext): Promise<Signal[]>;
  getSignalInsights(adId: string): Promise<SignalInsight[]>;
}
```

#### packages/developer-portal/src/components/ (New Components)

```
packages/developer-portal/src/components/adcp/
├── ADCPConfigPanel.tsx                 # Configuration UI
├── SignalBrowser.tsx                   # Signal discovery UI
├── SignalActivationPanel.tsx           # Activation management
├── CampaignDashboard.tsx               # Campaign overview
├── UnifiedAnalyticsDashboard.tsx       # Analytics visualization
├── NaturalLanguageInterface.tsx        # NL campaign creation
├── APITester.tsx                       # API testing tools
└── OnboardingWizard.tsx                # ADCP onboarding flow
```

### 3.3 Dependencies

**New Dependencies:**
```json
{
  "@modelcontextprotocol/sdk": "^1.0.0",
  "ws": "^8.14.2",
  "ioredis": "^5.3.2",
  "zod": "^3.22.4",
  "uuid": "^9.0.1"
}
```

**Peer Dependencies:**
```json
{
  "@ai-yuugen/types": "workspace:*",
  "@ai-yuugen/sdk": "workspace:*"
}
```

---

## 4. Integration Points

### 4.1 SDK Integration Point

**Location:** `packages/sdk/src/core/sdk.ts`

**Integration Flow:**
```typescript
// 1. SDK initialization with ADCP config
const sdk = new AIYuugenSDK();
await sdk.initialize({
  apiKey: 'your-api-key',
  environment: 'production',
  adcp: {
    enabled: true,
    providers: ['scope3', 'liveramp'],
    budget: { daily: 1000, monthly: 30000 }
  }
});

// 2. Enhanced ad request with signal preferences
const ad = await sdk.requestAdWithSignals(
  placement,
  context,
  {
    providers: ['liveramp'],
    maxCPM: 5.0,
    categories: ['behavioral', 'demographic']
  }
);

// 3. Signal insights retrieval
const insights = await sdk.getSignalInsights(ad.id);
```

**Implementation Strategy:**
- Add ADCP configuration to SDK initialization
- Extend ad request flow to include signal discovery
- Maintain backward compatibility with existing `requestAd()` method
- Add new methods for ADCP-specific functionality

### 4.2 Targeting Engine Integration Point

**Location:** `packages/server/src/services/targeting-engine.ts`

**Integration Flow:**
```typescript
// Existing TargetingEngine
export class TargetingEngine {
  async selectAds(placement: AdPlacement, context: AIContext): Promise<Ad[]> {
    // Standard targeting logic
  }
}

// New EnhancedTargetingEngine (extends TargetingEngine)
export class EnhancedTargetingEngine extends TargetingEngine {
  private adcpClient: ADCPClient;
  private signalScorer: SignalScorer;
  private fallbackEngine: TargetingEngine;
  
  async selectAds(placement: AdPlacement, context: AIContext): Promise<Ad[]> {
    try {
      // 1. Enhance context with ADCP signals
      const enhancedContext = await this.enhanceContext(context);
      
      // 2. Select ads using enhanced context
      return await this.selectAdsWithSignals(placement, enhancedContext);
    } catch (error) {
      // 3. Fallback to standard targeting
      this.logger.warn('ADCP targeting failed, using fallback', error);
      return await this.fallbackEngine.selectAds(placement, context);
    }
  }
  
  private async enhanceContext(context: AIContext): Promise<EnhancedAIContext> {
    // 1. Extract targeting parameters from context
    const query = this.contextAnalyzer.createSignalQuery(context);
    
    // 2. Discover relevant signals
    const signals = await this.adcpClient.discoverSignals(query);
    
    // 3. Score and rank signals
    const scoredSignals = await this.signalScorer.scoreSignals(signals, context);
    
    // 4. Select top signals within budget
    const selectedSignals = this.selectTopSignals(scoredSignals);
    
    // 5. Activate selected signals
    const activations = await this.activateSignals(selectedSignals);
    
    // 6. Return enhanced context
    return {
      ...context,
      adcpSignals: selectedSignals,
      signalActivations: activations.map(a => a.id),
      enhancementMetadata: {
        enhancedAt: new Date(),
        signalCount: selectedSignals.length,
        totalCost: this.calculateTotalCost(selectedSignals),
        expectedLift: this.estimateLift(selectedSignals),
        confidence: this.calculateConfidence(scoredSignals)
      }
    };
  }
}
```

**Implementation Strategy:**
- Create `EnhancedTargetingEngine` that extends existing `TargetingEngine`
- Wrap enhanced targeting in try-catch with fallback
- Ensure fallback completes within 50ms
- Track performance metrics for A/B testing


### 4.3 Analytics Integration Point

**Location:** `packages/server/src/services/analytics-service.ts`

**Integration Flow:**
```typescript
export class UnifiedAnalytics {
  private adcpClient: ADCPClient;
  private dataAggregator: DataAggregator;
  
  async getMetrics(request: AnalyticsRequest): Promise<AnalyticsData> {
    // 1. Fetch AI Ad Yuugen metrics
    const yuugenMetrics = await this.fetchYuugenMetrics(request);
    
    // 2. Fetch ADCP platform metrics
    const adcpMetrics = await this.adcpClient.getAnalytics(request);
    
    // 3. Aggregate and normalize data
    const aggregated = this.dataAggregator.merge(yuugenMetrics, adcpMetrics);
    
    // 4. Calculate performance lift
    const lift = this.calculatePerformanceLift(aggregated);
    
    // 5. Generate insights
    const insights = await this.generateInsights(aggregated, lift);
    
    return {
      metrics: aggregated,
      lift,
      insights,
      timestamp: new Date()
    };
  }
}
```

### 4.4 Developer Portal Integration Point

**Location:** `packages/developer-portal/src/App.tsx`

**Integration Flow:**
```typescript
// Add ADCP routes
<Routes>
  {/* Existing routes */}
  <Route path="/dashboard" element={<Dashboard />} />
  
  {/* New ADCP routes */}
  <Route path="/adcp/config" element={<ADCPConfigPanel />} />
  <Route path="/adcp/signals" element={<SignalBrowser />} />
  <Route path="/adcp/campaigns" element={<CampaignDashboard />} />
  <Route path="/adcp/analytics" element={<UnifiedAnalyticsDashboard />} />
  <Route path="/adcp/nl-interface" element={<NaturalLanguageInterface />} />
</Routes>
```

### 4.5 Integration Point Summary

| Component | Integration Type | Complexity | Risk Level |
|-----------|-----------------|------------|------------|
| SDK | Extension | Medium | Low |
| Targeting Engine | Inheritance + Composition | High | Medium |
| Analytics Service | Composition | Medium | Low |
| Developer Portal | New Routes + Components | Low | Low |
| Types Package | Extension | Low | Low |

---

## 5. Error Handling Strategy

### 5.1 Error Classification

```typescript
export enum ADCPErrorCode {
  // Connection Errors (1xxx)
  CONNECTION_FAILED = 'ADCP_1001',
  TIMEOUT = 'ADCP_1002',
  CONNECTION_POOL_EXHAUSTED = 'ADCP_1003',
  
  // Authentication Errors (2xxx)
  INVALID_API_KEY = 'ADCP_2001',
  UNAUTHORIZED = 'ADCP_2002',
  KEY_EXPIRED = 'ADCP_2003',
  
  // Request Errors (3xxx)
  INVALID_REQUEST = 'ADCP_3001',
  SIGNAL_NOT_FOUND = 'ADCP_3002',
  INSUFFICIENT_BUDGET = 'ADCP_3003',
  INVALID_QUERY = 'ADCP_3004',
  
  // Platform Errors (4xxx)
  PLATFORM_UNAVAILABLE = 'ADCP_4001',
  RATE_LIMIT_EXCEEDED = 'ADCP_4002',
  PROVIDER_ERROR = 'ADCP_4003',
  
  // Business Logic Errors (5xxx)
  BUDGET_EXCEEDED = 'ADCP_5001',
  ACTIVATION_FAILED = 'ADCP_5002',
  OPTIMIZATION_FAILED = 'ADCP_5003'
}

export class ADCPError extends Error {
  constructor(
    public code: ADCPErrorCode,
    message: string,
    public severity: ErrorSeverity,
    public retryable: boolean,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ADCPError';
  }
}

export enum ErrorSeverity {
  LOW = 'low',        // Log and continue
  MEDIUM = 'medium',  // Log, alert, and continue
  HIGH = 'high',      // Log, alert, and fallback
  CRITICAL = 'critical' // Log, alert, fallback, and escalate
}
```

### 5.2 Retry Strategy

```typescript
export class RetryHandler {
  private readonly retryableErrors = [
    ADCPErrorCode.CONNECTION_FAILED,
    ADCPErrorCode.TIMEOUT,
    ADCPErrorCode.PLATFORM_UNAVAILABLE,
    ADCPErrorCode.RATE_LIMIT_EXCEEDED
  ];
  
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      initialDelay = 100,
      maxDelay = 5000,
      backoffMultiplier = 2
    } = options;
    
    let lastError: Error;
    let delay = initialDelay;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry non-retryable errors
        if (error instanceof ADCPError && !error.retryable) {
          throw error;
        }
        
        // Handle rate limiting with Retry-After header
        if (error instanceof ADCPError && 
            error.code === ADCPErrorCode.RATE_LIMIT_EXCEEDED) {
          const retryAfter = error.details?.retryAfter || 60;
          await this.sleep(retryAfter * 1000);
          continue;
        }
        
        // Last attempt - throw error
        if (attempt === maxAttempts) {
          throw error;
        }
        
        // Exponential backoff
        await this.sleep(Math.min(delay, maxDelay));
        delay *= backoffMultiplier;
      }
    }
    
    throw lastError!;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 5.3 Circuit Breaker Pattern

```typescript
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;
  
  constructor(
    private readonly failureThreshold = 5,
    private readonly resetTimeout = 60000,  // 60 seconds
    private readonly halfOpenSuccessThreshold = 2
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit should be reset
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new ADCPError(
          ADCPErrorCode.PLATFORM_UNAVAILABLE,
          'Circuit breaker is open - service unavailable',
          ErrorSeverity.HIGH,
          false,
          { state: this.state, failureCount: this.failureCount }
        );
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.halfOpenSuccessThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
      }
    }
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }
  
  getState(): CircuitState {
    return this.state;
  }
}

enum CircuitState {
  CLOSED = 'closed',      // Normal operation
  OPEN = 'open',          // Failing - reject requests
  HALF_OPEN = 'half_open' // Testing - allow limited requests
}
```

### 5.4 Fallback Mechanism

```typescript
export class FallbackHandler {
  async executeWithFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>,
    options: FallbackOptions = {}
  ): Promise<T> {
    const { timeout = 5000, logFallback = true } = options;
    
    try {
      // Try primary operation with timeout
      return await this.withTimeout(primary(), timeout);
    } catch (error) {
      if (logFallback) {
        this.logger.warn('Primary operation failed, using fallback', {
          error: error instanceof Error ? error.message : 'Unknown error',
          code: error instanceof ADCPError ? error.code : 'UNKNOWN'
        });
      }
      
      // Execute fallback
      return await fallback();
    }
  }
  
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new ADCPError(
            ADCPErrorCode.TIMEOUT,
            `Operation timed out after ${timeoutMs}ms`,
            ErrorSeverity.MEDIUM,
            true
          )),
          timeoutMs
        )
      )
    ]);
  }
}
```


---

## 6. Caching Strategy

### 6.1 Two-Level Cache Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Application                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              L1 Cache (In-Memory)                       │
│  - TTL: 1 minute                                        │
│  - Size: 1000 entries (LRU)                            │
│  - Latency: <5ms                                        │
│  - Hit Rate Target: 40-50%                             │
└────────────────────┬────────────────────────────────────┘
                     │ Cache Miss
                     ▼
┌─────────────────────────────────────────────────────────┐
│              L2 Cache (Redis)                           │
│  - TTL: 5 minutes                                       │
│  - Size: Unlimited (with eviction)                     │
│  - Latency: <10ms                                       │
│  - Hit Rate Target: 30-40%                             │
└────────────────────┬────────────────────────────────────┘
                     │ Cache Miss
                     ▼
┌─────────────────────────────────────────────────────────┐
│              ADCP API Call                              │
│  - Latency: 50-200ms                                    │
│  - Rate Limited                                         │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Cache Implementation

```typescript
export class SignalCache {
  private l1Cache: Map<string, CacheEntry>;
  private l2Cache: RedisClient;
  private readonly l1TTL = 60000;      // 1 minute
  private readonly l2TTL = 300000;     // 5 minutes
  private readonly l1MaxSize = 1000;
  
  constructor(redisClient: RedisClient) {
    this.l1Cache = new Map();
    this.l2Cache = redisClient;
    this.startCleanup();
  }
  
  async get(key: string): Promise<Signal[] | null> {
    // 1. Check L1 cache
    const l1Entry = this.l1Cache.get(key);
    if (l1Entry && !this.isExpired(l1Entry, this.l1TTL)) {
      this.trackCacheHit('l1');
      return l1Entry.data;
    }
    
    // 2. Check L2 cache
    try {
      const l2Data = await this.l2Cache.get(key);
      if (l2Data) {
        const signals = JSON.parse(l2Data) as Signal[];
        
        // Populate L1 cache
        this.setL1(key, signals);
        
        this.trackCacheHit('l2');
        return signals;
      }
    } catch (error) {
      this.logger.warn('L2 cache read failed', error);
    }
    
    this.trackCacheMiss();
    return null;
  }
  
  async set(key: string, signals: Signal[]): Promise<void> {
    // Set in both caches
    this.setL1(key, signals);
    
    try {
      await this.l2Cache.setex(
        key,
        Math.floor(this.l2TTL / 1000),
        JSON.stringify(signals)
      );
    } catch (error) {
      this.logger.warn('L2 cache write failed', error);
    }
  }
  
  private setL1(key: string, data: Signal[]): void {
    // Implement LRU eviction
    if (this.l1Cache.size >= this.l1MaxSize) {
      const firstKey = this.l1Cache.keys().next().value;
      this.l1Cache.delete(firstKey);
    }
    
    this.l1Cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  async invalidate(pattern: string): Promise<void> {
    // Invalidate L1 cache
    for (const key of this.l1Cache.keys()) {
      if (key.includes(pattern)) {
        this.l1Cache.delete(key);
      }
    }
    
    // Invalidate L2 cache
    try {
      const keys = await this.l2Cache.keys(`*${pattern}*`);
      if (keys.length > 0) {
        await this.l2Cache.del(...keys);
      }
    } catch (error) {
      this.logger.warn('L2 cache invalidation failed', error);
    }
  }
  
  private isExpired(entry: CacheEntry, ttl: number): boolean {
    return Date.now() - entry.timestamp > ttl;
  }
  
  private startCleanup(): void {
    setInterval(() => {
      for (const [key, entry] of this.l1Cache.entries()) {
        if (this.isExpired(entry, this.l1TTL)) {
          this.l1Cache.delete(key);
        }
      }
    }, 30000); // Cleanup every 30 seconds
  }
  
  async getStats(): Promise<CacheStats> {
    return {
      l1Size: this.l1Cache.size,
      l1HitRate: this.calculateHitRate('l1'),
      l2HitRate: this.calculateHitRate('l2'),
      totalHitRate: this.calculateTotalHitRate(),
      missRate: this.calculateMissRate()
    };
  }
}
```

### 6.3 Cache Key Strategy

```typescript
export class CacheKeyGenerator {
  generateSignalKey(query: SignalQuery): string {
    // Create deterministic hash from query parameters
    const normalized = this.normalizeQuery(query);
    const hash = this.hashObject(normalized);
    return `adcp:signals:${hash}`;
  }
  
  generateActivationKey(activationId: string): string {
    return `adcp:activation:${activationId}`;
  }
  
  generateBuyKey(buyId: string): string {
    return `adcp:buy:${buyId}`;
  }
  
  private normalizeQuery(query: SignalQuery): SignalQuery {
    // Sort arrays for consistent hashing
    return {
      ...query,
      categories: query.categories?.sort(),
      providers: query.providers?.sort(),
      topics: query.text?.toLowerCase().split(/\s+/).sort()
    };
  }
  
  private hashObject(obj: any): string {
    const str = JSON.stringify(obj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}
```

### 6.4 Cache Warming Strategy

```typescript
export class CacheWarmer {
  constructor(
    private cache: SignalCache,
    private adcpClient: ADCPClient
  ) {}
  
  async warmCache(): Promise<void> {
    // Pre-populate cache with common queries
    const commonQueries = this.getCommonQueries();
    
    for (const query of commonQueries) {
      try {
        const signals = await this.adcpClient.discoverSignals(query);
        const key = this.keyGenerator.generateSignalKey(query);
        await this.cache.set(key, signals);
      } catch (error) {
        this.logger.warn('Cache warming failed for query', { query, error });
      }
    }
  }
  
  private getCommonQueries(): SignalQuery[] {
    return [
      { categories: ['demographic'], limit: 20 },
      { categories: ['behavioral'], limit: 20 },
      { categories: ['contextual'], limit: 20 },
      { providers: ['liveramp'], limit: 20 },
      { providers: ['scope3'], limit: 20 }
    ];
  }
  
  scheduleWarming(intervalMs: number = 300000): void {
    // Warm cache every 5 minutes
    setInterval(() => this.warmCache(), intervalMs);
  }
}
```

### 6.5 Cache Invalidation Strategy

**Invalidation Triggers:**
1. Signal metadata updates (from provider)
2. Budget exhaustion
3. Campaign completion
4. Manual invalidation via API
5. TTL expiration

**Invalidation Patterns:**
```typescript
// Invalidate all signals from a provider
await cache.invalidate('provider:liveramp');

// Invalidate signals for a category
await cache.invalidate('category:demographic');

// Invalidate specific signal
await cache.invalidate('signal:sig_123');

// Invalidate all ADCP cache
await cache.invalidate('adcp:');
```

---

## 7. Data Flow Diagrams

### 7.1 Signal Discovery Flow

```
┌─────────┐
│   SDK   │
└────┬────┘
     │ 1. requestAdWithSignals(placement, context, preferences)
     ▼
┌─────────────────────┐
│ Enhanced Targeting  │
│      Engine         │
└────┬────────────────┘
     │ 2. enhanceContext(context)
     ▼
┌─────────────────────┐
│ Context Analyzer    │
└────┬────────────────┘
     │ 3. createSignalQuery(context)
     ▼
┌─────────────────────┐
│  Signal Cache       │
└────┬────────────────┘
     │ 4. Check cache (miss)
     ▼
┌─────────────────────┐
│  ADCP Client        │
└────┬────────────────┘
     │ 5. discoverSignals(query)
     ▼
┌─────────────────────┐
│  MCP Client         │
└────┬────────────────┘
     │ 6. JSON-RPC call
     ▼
┌─────────────────────┐
│  ADCP Platform      │
│  (Scope3, LiveRamp) │
└────┬────────────────┘
     │ 7. Return signals
     ▼
┌─────────────────────┐
│  Signal Scorer      │
└────┬────────────────┘
     │ 8. scoreSignals(signals, context)
     ▼
┌─────────────────────┐
│ Enhanced Targeting  │
│      Engine         │
└────┬────────────────┘
     │ 9. selectTopSignals(scoredSignals)
     │ 10. activateSignals(selectedSignals)
     ▼
┌─────────────────────┐
│   Ad Selection      │
└────┬────────────────┘
     │ 11. Return enhanced ads
     ▼
┌─────────┐
│   SDK   │
└─────────┘
```


### 7.2 Signal Activation Flow

```
┌─────────────────────┐
│ Enhanced Targeting  │
│      Engine         │
└────┬────────────────┘
     │ 1. activateSignals(selectedSignals)
     ▼
┌─────────────────────┐
│  ADCP Client        │
└────┬────────────────┘
     │ 2. For each signal: activate(signalId, config)
     ▼
┌─────────────────────┐
│  Signals API        │
└────┬────────────────┘
     │ 3. Build activation request
     ▼
┌─────────────────────┐
│  MCP Client         │
└────┬────────────────┘
     │ 4. signals.activate JSON-RPC call
     ▼
┌─────────────────────┐
│  ADCP Platform      │
└────┬────────────────┘
     │ 5. Process activation (3-5 seconds)
     │ 6. Return activation ID & status
     ▼
┌─────────────────────┐
│  Signals API        │
└────┬────────────────┘
     │ 7. Store activation metadata
     ▼
┌─────────────────────┐
│  PostgreSQL         │
└────┬────────────────┘
     │ 8. Return activation objects
     ▼
┌─────────────────────┐
│ Enhanced Targeting  │
│      Engine         │
└─────────────────────┘
```

### 7.3 Fallback Flow

```
┌─────────────────────┐
│ Enhanced Targeting  │
│      Engine         │
└────┬────────────────┘
     │ 1. Try ADCP-enhanced targeting
     ▼
┌─────────────────────┐
│  ADCP Client        │
└────┬────────────────┘
     │ 2. discoverSignals() - TIMEOUT/ERROR
     ▼
┌─────────────────────┐
│  Error Handler      │
└────┬────────────────┘
     │ 3. Catch error, log details
     ▼
┌─────────────────────┐
│  Circuit Breaker    │
└────┬────────────────┘
     │ 4. Increment failure count
     │ 5. Check if threshold reached
     ▼
┌─────────────────────┐
│ Fallback Handler    │
└────┬────────────────┘
     │ 6. Execute fallback
     ▼
┌─────────────────────┐
│  Standard Targeting │
│      Engine         │
└────┬────────────────┘
     │ 7. selectAds(placement, context)
     │ 8. Return ads (within 50ms)
     ▼
┌─────────────────────┐
│   SDK Response      │
└─────────────────────┘
```

### 7.4 Analytics Aggregation Flow

```
┌─────────────────────┐
│  Developer Portal   │
└────┬────────────────┘
     │ 1. Request analytics
     ▼
┌─────────────────────┐
│ Unified Analytics   │
└────┬────────────────┘
     │ 2. Parallel data fetch
     ├──────────┬──────────┐
     ▼          ▼          ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Yuugen  │ │  ADCP   │ │  DSP    │
│Analytics│ │Platform │ │Platform │
└────┬────┘ └────┬────┘ └────┬────┘
     │           │           │
     │ 3. Return metrics     │
     └──────────┬────────────┘
                ▼
┌─────────────────────────────┐
│     Data Aggregator         │
└────┬────────────────────────┘
     │ 4. Normalize & merge data
     ▼
┌─────────────────────────────┐
│     Metrics Calculator      │
└────┬────────────────────────┘
     │ 5. Calculate derived metrics
     │    - CTR, CPA, ROAS
     │    - Performance lift
     │    - Cost efficiency
     ▼
┌─────────────────────────────┐
│     Insight Generator       │
└────┬────────────────────────┘
     │ 6. Generate insights
     ▼
┌─────────────────────────────┐
│     Developer Portal        │
└─────────────────────────────┘
```

---

## 8. Security Architecture

### 8.1 Authentication & Authorization

```typescript
export class AuthManager {
  private keyStore: SecureKeyStore;
  private tokenCache: Map<string, AuthToken>;
  
  constructor(config: AuthConfig) {
    // Use AWS Secrets Manager or HashiCorp Vault
    this.keyStore = new SecureKeyStore(config.vaultUrl);
  }
  
  async getApiKey(provider: SignalProvider): Promise<string> {
    // Retrieve from secure storage
    const key = await this.keyStore.get(`adcp/${provider}/api-key`);
    
    if (!key) {
      throw new ADCPError(
        ADCPErrorCode.INVALID_API_KEY,
        `API key not found for provider: ${provider}`,
        ErrorSeverity.CRITICAL,
        false
      );
    }
    
    return key;
  }
  
  async rotateKey(provider: SignalProvider): Promise<void> {
    // 1. Request new key from provider
    const newKey = await this.requestNewKey(provider);
    
    // 2. Store new key
    await this.keyStore.set(`adcp/${provider}/api-key`, newKey);
    
    // 3. Keep old key active for grace period (24 hours)
    await this.keyStore.set(
      `adcp/${provider}/api-key-old`,
      await this.keyStore.get(`adcp/${provider}/api-key`),
      { ttl: 86400 }
    );
    
    // 4. Invalidate token cache
    this.tokenCache.clear();
    
    // 5. Log rotation
    this.auditLogger.log({
      action: 'KEY_ROTATION',
      provider,
      timestamp: new Date(),
      success: true
    });
  }
  
  signRequest(request: any, apiKey: string): string {
    const timestamp = Date.now();
    const payload = JSON.stringify({ ...request, timestamp });
    
    return crypto
      .createHmac('sha256', apiKey)
      .update(payload)
      .digest('hex');
  }
}
```

### 8.2 Data Encryption

**At Rest:**
- API keys: AES-256 encryption in Secrets Manager
- User data: Database-level encryption (PostgreSQL)
- Cache data: Redis encryption enabled

**In Transit:**
- TLS 1.3 for all external communications
- Certificate pinning for ADCP platforms
- Mutual TLS for high-security environments

### 8.3 Access Control

```typescript
export class AccessControl {
  async checkPermission(
    userId: string,
    action: ADCPAction,
    resource: string
  ): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    
    for (const role of userRoles) {
      const permissions = await this.getRolePermissions(role);
      
      if (permissions.some(p => 
        p.action === action && 
        this.matchesResource(p.resource, resource)
      )) {
        return true;
      }
    }
    
    return false;
  }
  
  async requirePermission(
    userId: string,
    action: ADCPAction,
    resource: string
  ): Promise<void> {
    const hasPermission = await this.checkPermission(userId, action, resource);
    
    if (!hasPermission) {
      throw new ADCPError(
        ADCPErrorCode.UNAUTHORIZED,
        `User ${userId} does not have permission to ${action} on ${resource}`,
        ErrorSeverity.HIGH,
        false,
        { userId, action, resource }
      );
    }
  }
}

enum ADCPAction {
  DISCOVER_SIGNALS = 'discover_signals',
  ACTIVATE_SIGNALS = 'activate_signals',
  DEACTIVATE_SIGNALS = 'deactivate_signals',
  EXECUTE_BUY = 'execute_buy',
  VIEW_ANALYTICS = 'view_analytics',
  MANAGE_BUDGET = 'manage_budget'
}
```

### 8.4 Audit Logging

```typescript
export class AuditLogger {
  async log(event: AuditEvent): Promise<void> {
    const entry: AuditLogEntry = {
      id: uuid(),
      timestamp: new Date(),
      userId: event.userId,
      action: event.action,
      resource: event.resource,
      result: event.result,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      details: event.details
    };
    
    // Store in secure audit log
    await this.auditStore.insert(entry);
    
    // Send to SIEM if critical
    if (this.isCriticalAction(event.action)) {
      await this.siemClient.send(entry);
    }
  }
  
  private isCriticalAction(action: string): boolean {
    return [
      'ACTIVATE_SIGNALS',
      'EXECUTE_BUY',
      'KEY_ROTATION',
      'BUDGET_CHANGE'
    ].includes(action);
  }
}
```

---

## 9. Performance Considerations

### 9.1 Performance Targets

| Metric | Target | Measurement Point |
|--------|--------|------------------|
| Signal Discovery | <100ms (p95) | ADCP Client → Platform |
| Signal Activation | <5s | ADCP Client → Platform |
| Enhanced Targeting | <50ms added latency | Targeting Engine |
| Cache Hit (L1) | <5ms | In-memory lookup |
| Cache Hit (L2) | <10ms | Redis lookup |
| Fallback Execution | <50ms | Standard targeting |
| Overall Ad Serving | <200ms (p95) | SDK → Response |

### 9.2 Performance Optimization Techniques

**1. Connection Pooling**
```typescript
export class ConnectionPool {
  private connections: MCPConnection[] = [];
  private readonly maxConnections = 10;
  private readonly minConnections = 2;
  
  async getConnection(): Promise<MCPConnection> {
    // Reuse idle connection
    const idle = this.connections.find(c => c.isIdle());
    if (idle) {
      idle.markActive();
      return idle;
    }
    
    // Create new if under limit
    if (this.connections.length < this.maxConnections) {
      const conn = await this.createConnection();
      this.connections.push(conn);
      return conn;
    }
    
    // Wait for available connection
    return this.waitForConnection();
  }
}
```

**2. Request Batching**
```typescript
export class RequestBatcher {
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private batchQueue: SignalQuery[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  
  async batchDiscovery(query: SignalQuery): Promise<Signal[]> {
    this.batchQueue.push(query);
    
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.flushBatch(), 50);
    }
    
    // Return promise that resolves when batch completes
    return new Promise((resolve) => {
      this.pendingRequests.set(query.id, resolve);
    });
  }
  
  private async flushBatch(): Promise<void> {
    const queries = [...this.batchQueue];
    this.batchQueue = [];
    this.batchTimer = null;
    
    // Execute batched request
    const results = await this.adcpClient.discoverSignalsBatch(queries);
    
    // Resolve individual promises
    results.forEach((signals, index) => {
      const query = queries[index];
      const resolve = this.pendingRequests.get(query.id);
      if (resolve) {
        resolve(signals);
        this.pendingRequests.delete(query.id);
      }
    });
  }
}
```

**3. Parallel Processing**
```typescript
async enhanceContext(context: AIContext): Promise<EnhancedAIContext> {
  // Execute operations in parallel
  const [signals, userProfile, historicalData] = await Promise.all([
    this.discoverSignals(context),
    this.fetchUserProfile(context.userId),
    this.fetchHistoricalData(context.sessionId)
  ]);
  
  // Process results
  const scoredSignals = await this.scoreSignals(signals, context, userProfile);
  const selectedSignals = this.selectTopSignals(scoredSignals);
  
  return {
    ...context,
    adcpSignals: selectedSignals,
    enhancementMetadata: this.buildMetadata(selectedSignals)
  };
}
```


### 9.3 Performance Monitoring

```typescript
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  
  async trackOperation<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      const memoryDelta = process.memoryUsage().heapUsed - startMemory;
      
      this.recordMetric(operation, {
        duration,
        memoryDelta,
        success: true,
        timestamp: new Date()
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordMetric(operation, {
        duration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown',
        timestamp: new Date()
      });
      
      throw error;
    }
  }
  
  getMetrics(operation: string): PerformanceStats {
    const metrics = this.metrics.get(operation) || [];
    const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
    
    return {
      count: metrics.length,
      p50: this.percentile(durations, 0.5),
      p95: this.percentile(durations, 0.95),
      p99: this.percentile(durations, 0.99),
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      successRate: metrics.filter(m => m.success).length / metrics.length
    };
  }
  
  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index] || 0;
  }
}
```

---

## 10. Deployment Architecture

### 10.1 Infrastructure Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Load Balancer (ALB)                      │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────┐          ┌──────────────┐
│  App Server  │          │  App Server  │
│   (Node.js)  │          │   (Node.js)  │
│              │          │              │
│ - SDK        │          │ - SDK        │
│ - Targeting  │          │ - Targeting  │
│ - ADCP Client│          │ - ADCP Client│
└──────┬───────┘          └──────┬───────┘
       │                         │
       └────────────┬────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│  Redis   │ │PostgreSQL│ │  Message │
│  Cluster │ │  Primary │ │  Queue   │
│          │ │          │ │ (RabbitMQ)│
│ - L2     │ │ - State  │ │          │
│   Cache  │ │ - Audit  │ │ - Async  │
│          │ │   Logs   │ │   Tasks  │
└──────────┘ └────┬─────┘ └──────────┘
                  │
                  ▼
            ┌──────────┐
            │PostgreSQL│
            │ Replica  │
            │ (Read)   │
            └──────────┘
```

### 10.2 Deployment Environments

**Development:**
- Single app server
- Local Redis
- Local PostgreSQL
- Mock ADCP endpoints

**Staging:**
- 2 app servers
- Redis cluster (2 nodes)
- PostgreSQL with replica
- ADCP test environment

**Production:**
- 4+ app servers (auto-scaling)
- Redis cluster (3+ nodes)
- PostgreSQL with multiple replicas
- ADCP production environment
- CDN for static assets

### 10.3 Deployment Strategy

**Phase 1: Infrastructure Setup (Week 1)**
```bash
# 1. Provision infrastructure
terraform apply -var-file=production.tfvars

# 2. Deploy Redis cluster
helm install redis bitnami/redis-cluster

# 3. Deploy PostgreSQL
helm install postgresql bitnami/postgresql-ha

# 4. Configure secrets
kubectl create secret generic adcp-secrets \
  --from-literal=scope3-api-key=$SCOPE3_KEY \
  --from-literal=liveramp-api-key=$LIVERAMP_KEY
```

**Phase 2: Application Deployment (Week 2)**
```bash
# 1. Build Docker images
docker build -t ai-yuugen/app:v1.0.0 .

# 2. Deploy to staging
kubectl apply -f k8s/staging/

# 3. Run smoke tests
npm run test:e2e:staging

# 4. Deploy to production with canary
kubectl apply -f k8s/production/canary.yaml

# 5. Monitor canary (10% traffic)
# Wait 1 hour, monitor metrics

# 6. Full rollout
kubectl apply -f k8s/production/deployment.yaml
```

**Phase 3: Feature Flag Rollout (Weeks 3-4)**
```typescript
// Week 3: Internal testing (1% traffic)
featureFlags.enable('adcp-integration', {
  percentage: 1,
  users: ['internal']
});

// Week 3.5: Expand to 5%
featureFlags.enable('adcp-integration', {
  percentage: 5
});

// Week 4: Gradual rollout
// 10% → 25% → 50% → 100%
```

### 10.4 Rollback Strategy

**Automated Rollback Triggers:**
- Error rate >5%
- Latency p95 >500ms
- Cache hit rate <50%
- ADCP availability <95%

**Rollback Procedure:**
```bash
# 1. Disable feature flag immediately
curl -X POST https://api.ai-yuugen.com/admin/feature-flags/adcp-integration/disable

# 2. Rollback deployment if needed
kubectl rollout undo deployment/ai-yuugen-app

# 3. Verify fallback working
npm run test:e2e:fallback

# 4. Investigate and fix issues
# 5. Re-deploy when ready
```

### 10.5 Monitoring & Alerting

**Grafana Dashboards:**
1. ADCP Performance Dashboard
   - API latency (p50, p95, p99)
   - Error rates by operation
   - Cache hit ratios
   - Signal activation success rate

2. Business Metrics Dashboard
   - Signal usage and costs
   - Performance lift (CTR, CPA)
   - Revenue impact
   - Provider distribution

3. System Health Dashboard
   - Service availability
   - Resource utilization (CPU, memory)
   - Database performance
   - Queue depths

**PagerDuty Alerts:**
- Critical: ADCP error rate >5% (immediate)
- High: Latency p95 >500ms (5 min)
- Medium: Cache hit rate <50% (15 min)
- Low: Budget threshold 80% (1 hour)

---

## 11. Migration & Compatibility

### 11.1 Backward Compatibility

**SDK Compatibility:**
```typescript
// Existing code continues to work
const ad = await sdk.requestAd(placement, context);

// New ADCP features are opt-in
const enhancedAd = await sdk.requestAdWithSignals(
  placement,
  context,
  { providers: ['liveramp'] }
);
```

**API Compatibility:**
- All existing API endpoints unchanged
- New ADCP endpoints under `/api/v1/adcp/`
- Versioned API ensures no breaking changes

### 11.2 Migration Path

**For Existing Users:**
1. Update SDK to latest version (backward compatible)
2. Enable ADCP in configuration (opt-in)
3. Configure signal providers
4. Test with small traffic percentage
5. Gradually increase ADCP usage

**For New Users:**
- ADCP enabled by default
- Guided onboarding in developer portal
- Pre-configured with recommended providers

### 11.3 Feature Flags

```typescript
export const ADCP_FEATURE_FLAGS = {
  SIGNAL_DISCOVERY: 'adcp.signal_discovery',
  SIGNAL_ACTIVATION: 'adcp.signal_activation',
  MEDIA_BUY: 'adcp.media_buy',
  UNIFIED_ANALYTICS: 'adcp.unified_analytics',
  NL_INTERFACE: 'adcp.nl_interface'
};

// Usage
if (featureFlags.isEnabled(ADCP_FEATURE_FLAGS.SIGNAL_DISCOVERY)) {
  // Use ADCP-enhanced targeting
} else {
  // Use standard targeting
}
```

---

## 12. Testing Strategy

### 12.1 Unit Testing

**Coverage Target:** >90%

**Key Test Areas:**
- ADCP Client methods
- Signal scoring algorithms
- Cache operations
- Error handling
- Retry logic
- Circuit breaker

**Example:**
```typescript
describe('SignalScorer', () => {
  it('should calculate relevance score correctly', async () => {
    const signal = createMockSignal();
    const context = createMockContext();
    
    const scored = await scorer.scoreSignal(signal, context);
    
    expect(scored.scores.relevance).toBeGreaterThan(0);
    expect(scored.scores.total).toBeLessThanOrEqual(1);
  });
});
```

### 12.2 Integration Testing

**Test Scenarios:**
- Signal discovery with real ADCP test endpoints
- Signal activation workflow
- Cache hit/miss scenarios
- Fallback behavior
- Error handling

**Example:**
```typescript
describe('ADCP Integration', () => {
  it('should discover and activate signals', async () => {
    const query = { categories: ['demographic'], limit: 10 };
    
    // Discover signals
    const signals = await adcpClient.discoverSignals(query);
    expect(signals.length).toBeGreaterThan(0);
    
    // Activate first signal
    const activation = await adcpClient.activateSignal(
      signals[0].id,
      { duration: 24, budget: 100 }
    );
    expect(activation.status).toBe('pending');
  });
});
```

### 12.3 Performance Testing

**Load Testing:**
```bash
# Test signal discovery under load
k6 run --vus 100 --duration 5m tests/load/signal-discovery.js

# Test enhanced targeting latency
k6 run --vus 50 --duration 10m tests/load/enhanced-targeting.js
```

**Benchmarks:**
- 100 concurrent signal discoveries
- 1000 requests/second ad serving
- Cache performance under load
- Fallback activation time

### 12.4 End-to-End Testing

**Test Flows:**
1. Complete ad request with ADCP enhancement
2. Signal discovery → activation → ad serving
3. Fallback when ADCP unavailable
4. Analytics aggregation
5. Developer portal workflows

---

## 13. Documentation Requirements

### 13.1 Technical Documentation

**API Reference:**
- ADCP Client API documentation
- Signal types and interfaces
- Error codes and handling
- Configuration options

**Integration Guides:**
- SDK integration guide
- Targeting engine integration
- Analytics integration
- Developer portal setup

**Architecture Docs:**
- System architecture diagrams
- Data flow diagrams
- Security architecture
- Deployment architecture

### 13.2 User Documentation

**Getting Started:**
- ADCP overview
- Quick start guide
- Configuration tutorial
- Best practices

**Feature Guides:**
- Signal discovery guide
- Signal activation guide
- Media buying guide
- Analytics guide
- Natural language interface

**Troubleshooting:**
- Common issues and solutions
- Error code reference
- Performance optimization
- Support resources

---

## 14. Success Metrics

### 14.1 Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| ADCP API Latency (p95) | <200ms | Prometheus |
| Signal Discovery (p95) | <100ms | Prometheus |
| Enhanced Targeting Latency | <50ms added | Prometheus |
| Cache Hit Rate | >80% | Redis metrics |
| System Availability | >99.9% | Uptime monitoring |
| Error Rate | <0.1% | Error tracking |
| Fallback Activation Rate | <5% | Custom metric |

### 14.2 Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Ad Relevance Improvement | >20% | A/B testing |
| CTR Improvement | >10% | Analytics |
| CPA Improvement | >15% | Analytics |
| Developer Adoption | >25% | Usage tracking |
| Signal Provider Count | >3 | Configuration |
| Revenue Impact | >$100K/month | Financial tracking |

### 14.3 User Experience Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Campaign Creation Time | <5 minutes | User tracking |
| NL Interface Accuracy | >85% | Validation |
| User Satisfaction | >4.5/5 | Surveys |
| Onboarding Completion | >80% | Funnel analysis |
| Support Ticket Reduction | >30% | Support metrics |

---

## 15. Risk Assessment & Mitigation

### 15.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| ADCP Platform Downtime | Medium | High | Circuit breaker, fallback to standard targeting |
| Performance Degradation | Medium | High | Caching, connection pooling, monitoring |
| Integration Complexity | High | Medium | Phased rollout, comprehensive testing |
| Data Inconsistency | Low | High | Transaction management, audit logging |
| Security Vulnerabilities | Low | Critical | Security audits, penetration testing |

### 15.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Cost Overruns | Medium | High | Budget caps, alerts, approval workflows |
| Poor Performance | Low | High | A/B testing, gradual rollout |
| Provider Lock-in | Medium | Medium | Multi-provider support, abstraction layer |
| Compliance Violations | Low | Critical | Automated compliance checks, legal review |
| Low Adoption | Medium | Medium | Onboarding flow, documentation, support |

---

## 16. Conclusion

This architecture document provides a comprehensive design for integrating ADCP with AI Ad Yuugen. The design prioritizes:

1. **Performance** - Through caching, connection pooling, and optimization
2. **Reliability** - Through fallback mechanisms and circuit breakers
3. **Security** - Through encryption, access control, and audit logging
4. **Scalability** - Through horizontal scaling and efficient resource usage
5. **Maintainability** - Through clean architecture and comprehensive documentation

**Next Steps:**
1. Review and approve architecture design
2. Create detailed implementation tasks
3. Set up development environment
4. Begin Phase 1 implementation (ADCP Client Library)
5. Conduct regular architecture reviews during implementation

---

**Document Metadata:**
- **Version:** 1.0
- **Last Updated:** October 26, 2025
- **Status:** Complete
- **Reviewers:** Development Team, Architecture Team, Security Team
- **Approval:** Pending

**Change Log:**
- 2025-10-26: Initial architecture document created
- 2025-10-26: Added comprehensive integration points and data flows
- 2025-10-26: Completed security and deployment architecture sections

