# Examples

Practical examples of using the AI Ad Yuugen SDK in different scenarios.

## Basic Examples

- [Simple Integration](./basic-integration.md) - Minimal setup and usage
- [React Chat App](./react-chat-app.md) - Complete React integration
- [Vue AI Assistant](./vue-ai-assistant.md) - Vue.js implementation
- [Angular Chatbot](./angular-chatbot.md) - Angular integration

## Advanced Examples

- [Multi-Platform Integration](./multi-platform.md) - Supporting multiple AI platforms
- [Custom Ad Templates](./custom-templates.md) - Creating custom ad layouts
- [Privacy Compliance](./privacy-compliance.md) - GDPR/CCPA implementation
- [Performance Optimization](./performance-optimization.md) - Optimizing for speed

## AI Platform Examples

- [OpenAI Integration](./openai-integration.md) - GPT-3.5/GPT-4 integration
- [Anthropic Claude](./anthropic-claude.md) - Claude integration
- [Google AI](./google-ai.md) - Gemini/PaLM integration
- [Custom AI Model](./custom-ai-model.md) - Generic adapter usage

## Use Cases

- [E-commerce Chatbot](./ecommerce-chatbot.md) - Product recommendation ads
- [Educational AI](./educational-ai.md) - Learning-focused advertising
- [Customer Support](./customer-support.md) - Context-aware support ads
- [Content Creation](./content-creation.md) - Creative tool advertising

## Code Snippets

Quick code snippets for common tasks:

### Basic SDK Setup

```typescript
import { AIYuugenSDK } from '@ai-yuugen/sdk';

const sdk = new AIYuugenSDK();
await sdk.initialize({
  apiKey: 'your-api-key',
  environment: 'production'
});
```

### React Component

```tsx
import { AdBanner } from '@ai-yuugen/ui-components/react';

<AdBanner
  sdk={sdk}
  placement={placement}
  context={context}
/>
```

### Context Analysis

```typescript
const context = sdk.analyzeContext({
  id: 'conv-123',
  messages: conversation.messages,
  topics: [],
  intent: { primary: 'research', confidence: 0.9, category: 'informational', actionable: true },
  startTime: new Date(),
  lastActivity: new Date()
});
```