# AI Ad Yuugen SDK Multi-Platform Adapters

This directory contains multi-platform adapters that enable AI Ad Yuugen integration with various AI platforms including OpenAI, Anthropic Claude, and Google AI.

## Overview

The adapters provide a unified interface for integrating AI Ad Yuugen with different AI platforms, supporting both client-side and server-side deployment patterns. Each adapter handles platform-specific message formats, API calls, and ad injection while maintaining consistent behavior across platforms.

## Supported Platforms

### OpenAI API
- **Platform**: `AIPlatform.OPENAI`
- **Models**: GPT-3.5, GPT-4, and other OpenAI models
- **Environments**: Client-side, Server-side, Edge, Serverless
- **Integration Patterns**: Wrapper, Middleware, Proxy

### Anthropic Claude
- **Platform**: `AIPlatform.ANTHROPIC`
- **Models**: Claude-3 Sonnet, Claude-3 Haiku, and other Anthropic models
- **Environments**: Client-side, Server-side, Serverless
- **Integration Patterns**: Wrapper, Middleware, Webhook

### Google AI (Gemini)
- **Platform**: `AIPlatform.GOOGLE_AI`
- **Models**: Gemini Pro, Gemini Pro Vision, and other Google AI models
- **Environments**: Client-side, Server-side, Serverless
- **Integration Patterns**: Wrapper, Cloud Functions, Vertex AI

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Application                           │
├─────────────────────────────────────────────────────────────┤
│                  Platform Adapter                          │
│  ┌─────────────────┬─────────────────┬─────────────────┐   │
│  │   OpenAI        │   Anthropic     │   Google AI     │   │
│  │   Adapter       │   Adapter       │   Adapter       │   │
│  └─────────────────┴─────────────────┴─────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                   Base Adapter                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • Message Transformation                          │   │
│  │  • Context Analysis                                │   │
│  │  • Ad Injection                                    │   │
│  │  • Privacy Management                              │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                 AI Ad Yuugen SDK Core                         │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Using the Adapter Factory

```typescript
import { AIAdapterFactory, AIPlatform, DeploymentEnvironment } from '@ai-yuugen/sdk';

const factory = AIAdapterFactory.getInstance();

const config = {
  platform: AIPlatform.OPENAI,
  environment: DeploymentEnvironment.CLIENT_SIDE,
  pattern: IntegrationPattern.WRAPPER,
  adSenseConfig: {
    apiKey: 'your-yuugen-api-key',
    placementIds: ['placement-1'],
    enableContextAnalysis: true,
    enablePrivacyMode: true,
    enableAnalytics: true
  },
  platformConfig: {
    apiKey: 'sk-your-openai-api-key',
    environment: 'development',
    model: 'gpt-3.5-turbo'
  }
};

const adapter = factory.createAdapter(config);
await adapter.initialize(config);

// Use the adapter
const context = adapter.extractConversationContext(conversation);
const response = await adapter.processResponse(aiResponse, context);

adapter.destroy();
```

### 2. Server-side Integration with Express

```typescript
import { OpenAIAdapter } from '@ai-yuugen/sdk';

const middleware = OpenAIAdapter.createExpressMiddleware(config);
const responseInterceptor = OpenAIAdapter.createResponseInterceptor(config);

app.use('/api/openai', middleware);
app.use('/api/openai', responseInterceptor);
```

### 3. Client-side Wrapper

```typescript
import { AnthropicAdapter } from '@ai-yuugen/sdk';

const wrapper = AnthropicAdapter.createClientWrapper(config);
await wrapper.initialize();

const response = await wrapper.messages([
  { role: 'user', content: 'Hello!' }
], { model: 'claude-3-sonnet-20240229' });

wrapper.destroy();
```

## Configuration

### Ad Yuugen Configuration

```typescript
interface Ad YuugenConfig {
  apiKey: string;                    // Your AI Ad Yuugen API key
  placementIds: string[];            // Ad placement IDs
  enableContextAnalysis: boolean;    // Enable conversation context analysis
  enablePrivacyMode: boolean;        // Enable privacy compliance features
  enableAnalytics: boolean;          // Enable analytics tracking
}
```

### Platform-Specific Configuration

#### OpenAI
```typescript
interface OpenAIAdapterConfig {
  apiKey: string;          // OpenAI API key (starts with 'sk-')
  model?: string;          // Model name (default: 'gpt-3.5-turbo')
  organization?: string;   // OpenAI organization ID
  maxTokens?: number;      // Maximum tokens per request
  temperature?: number;    // Response randomness (0-2)
  timeout?: number;        // Request timeout in milliseconds
  retryAttempts?: number;  // Number of retry attempts
}
```

#### Anthropic
```typescript
interface AnthropicAdapterConfig {
  apiKey: string;          // Anthropic API key (starts with 'sk-ant-')
  model?: string;          // Model name (default: 'claude-3-sonnet-20240229')
  maxTokens?: number;      // Maximum tokens per request
  temperature?: number;    // Response randomness (0-1)
  topP?: number;           // Top-p sampling parameter
  timeout?: number;        // Request timeout in milliseconds
  retryAttempts?: number;  // Number of retry attempts
}
```

#### Google AI
```typescript
interface GoogleAIAdapterConfig {
  apiKey: string;          // Google AI API key
  model?: string;          // Model name (default: 'gemini-pro')
  projectId?: string;      // Google Cloud project ID
  location?: string;       // Google Cloud region
  maxTokens?: number;      // Maximum tokens per request
  temperature?: number;    // Response randomness (0-1)
  timeout?: number;        // Request timeout in milliseconds
  retryAttempts?: number;  // Number of retry attempts
}
```

## Deployment Environments

### Client-Side
- Direct integration in web applications
- Browser-based AI chat interfaces
- Mobile applications

### Server-Side
- Express.js middleware
- API proxy servers
- Backend services

### Edge
- Cloudflare Workers
- Vercel Edge Functions
- AWS Lambda@Edge

### Serverless
- AWS Lambda
- Google Cloud Functions
- Azure Functions

## Integration Patterns

### Wrapper Pattern
Wraps the AI platform SDK with ad injection capabilities:

```typescript
const wrapper = OpenAIAdapter.createClientWrapper(config);
const response = await wrapper.chat(messages);
```

### Middleware Pattern
Intercepts HTTP requests/responses to inject ads:

```typescript
const middleware = OpenAIAdapter.createExpressMiddleware(config);
app.use('/api/ai', middleware);
```

### Proxy Pattern
Acts as a proxy between your application and the AI platform:

```typescript
const adapter = factory.createAdapter(proxyConfig);
const response = await adapter.processResponse(aiResponse, context);
```

### Webhook Pattern
Handles webhook events from AI platforms:

```typescript
const handler = AnthropicAdapter.createWebhookHandler(config);
app.post('/webhook/anthropic', handler);
```

## Ad Display Logic

Each adapter implements platform-specific logic for determining when to show ads:

### OpenAI Adapter
- Avoids ads in system messages
- Skips ads for sensitive topics (medical, legal, financial)
- Requires minimum conversation length

### Anthropic Adapter
- Higher engagement threshold due to longer responses
- Avoids interrupting creative writing or analysis
- Considers conversation depth

### Google AI Adapter
- Conservative approach for technical/educational content
- Avoids ads in very complex conversations
- Considers safety ratings

## Context Analysis

All adapters extract context from conversations including:

- **Topics**: Identified themes and subjects
- **Intent**: User's primary intention (informational, transactional, etc.)
- **Sentiment**: Emotional tone of the conversation
- **Engagement**: User engagement level and trends
- **Conversation Stage**: Current phase of the conversation

## Privacy and Compliance

The adapters include built-in privacy features:

- **GDPR/CCPA Compliance**: Automatic compliance checking
- **Consent Management**: User consent tracking and validation
- **Data Encryption**: Secure handling of user data
- **Opt-out Support**: Easy opt-out mechanisms
- **Data Retention**: Configurable data retention policies

## Error Handling

Comprehensive error handling includes:

- **Network Errors**: Automatic retry with exponential backoff
- **API Errors**: Platform-specific error handling
- **Privacy Violations**: Immediate halt of data collection
- **Ad Serving Failures**: Graceful degradation with fallbacks

## Testing

The adapters include comprehensive test suites:

- **Unit Tests**: Individual component testing
- **Integration Tests**: Cross-platform compatibility testing
- **End-to-End Tests**: Complete workflow testing
- **Performance Tests**: Load and latency testing

Run tests:
```bash
npm test -- src/adapters
```

## Examples

See the `examples/adapter-usage.ts` file for comprehensive usage examples including:

- Basic adapter usage
- Multi-platform setup
- Server-side integration
- Client-side wrappers
- Auto-detection features
- Recommended configurations

## API Reference

### AIAdapterFactory

The main factory for creating adapters:

```typescript
class AIAdapterFactory {
  static getInstance(): AIAdapterFactory
  createAdapter(config: AdapterIntegrationConfig): AIAdapter
  createMultiPlatformAdapters(configs: AdapterIntegrationConfig[]): Map<AIPlatform, AIAdapter>
  createAdapterWithAutoDetection(config: Partial<AdapterIntegrationConfig>): AIAdapter
  getSupportedPlatforms(): AIPlatform[]
  getSupportedEnvironments(): DeploymentEnvironment[]
  isCompatible(platform: AIPlatform, environment: DeploymentEnvironment): boolean
  getRecommendedConfig(platform: AIPlatform, environment: DeploymentEnvironment): Partial<AdapterIntegrationConfig>
}
```

### BaseAIAdapter

Base class for all adapters:

```typescript
abstract class BaseAIAdapter implements AIAdapter {
  abstract readonly platform: AIPlatform
  abstract readonly environment: DeploymentEnvironment
  
  initialize(config: AdapterIntegrationConfig): Promise<void>
  interceptMessage(message: any): Promise<any>
  processResponse(response: any, context: AIContext): Promise<any>
  extractConversationContext(conversation: any): AIContext
  extractUserContext(session: any): UserContext
  shouldShowAd(context: AIContext): boolean
  destroy(): void
}
```

## Contributing

When adding support for new AI platforms:

1. Extend `BaseAIAdapter`
2. Implement platform-specific message transformation
3. Add platform-specific ad injection logic
4. Create integration helpers (middleware, wrappers, etc.)
5. Add comprehensive tests
6. Update the factory and type definitions

## License

This project is licensed under the MIT License - see the LICENSE file for details.