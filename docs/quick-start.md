# Quick Start Guide

Get up and running with the AI Ad Yuugen SDK in minutes.

## Installation

### NPM

```bash
npm install @ai-yuugen/sdk @ai-yuugen/ui-components
```

### Yarn

```bash
yarn add @ai-yuugen/sdk @ai-yuugen/ui-components
```

### CDN

```html
<script src="https://cdn.ai-yuugen.com/sdk/v1/ai-yuugen.min.js"></script>
```

## Basic Setup

### 1. Initialize the SDK

```typescript
import { AIYuugenSDK } from '@ai-yuugen/sdk';

const sdk = new AIYuugenSDK();

await sdk.initialize({
  apiKey: 'your-api-key-here',
  environment: 'production', // or 'development', 'staging'
  enableAnalytics: true,
  debugMode: false
});
```

### 2. Create an Ad Placement

```typescript
import { AdType, AdFormat, AdPosition } from '@ai-yuugen/sdk';

const placement = {
  id: 'chat-sidebar-banner',
  type: AdType.BANNER,
  format: AdFormat.DISPLAY,
  size: { width: 300, height: 250 },
  position: AdPosition.RIGHT
};
```

### 3. Analyze AI Conversation Context

```typescript
const conversation = {
  id: 'conv-123',
  messages: [
    {
      id: 'msg-1',
      role: 'user',
      content: 'I need help choosing a laptop for programming',
      timestamp: new Date()
    },
    {
      id: 'msg-2', 
      role: 'assistant',
      content: 'I can help you find the perfect laptop for programming...',
      timestamp: new Date()
    }
  ],
  topics: [],
  intent: { primary: 'product_research', confidence: 0.9, category: 'commercial', actionable: true },
  startTime: new Date(),
  lastActivity: new Date()
};

const context = sdk.analyzeContext(conversation);
```

### 4. Request and Display an Ad

```typescript
try {
  // Request an ad
  const ad = await sdk.requestAd(placement, context);
  
  // Display the ad
  const container = document.getElementById('ad-container');
  sdk.displayAd(ad, container);
  
  console.log('Ad displayed successfully:', ad.id);
} catch (error) {
  console.error('Failed to display ad:', error);
}
```

## Framework-Specific Quick Start

### React

```tsx
import React, { useEffect, useState } from 'react';
import { AdBanner } from '@ai-yuugen/ui-components/react';
import { AIYuugenSDK } from '@ai-yuugen/sdk';

function App() {
  const [sdk, setSdk] = useState<AIYuugenSDK | null>(null);

  useEffect(() => {
    const initSDK = async () => {
      const sdkInstance = new AIYuugenSDK();
      await sdkInstance.initialize({
        apiKey: 'your-api-key',
        environment: 'production'
      });
      setSdk(sdkInstance);
    };
    
    initSDK();
  }, []);

  if (!sdk) return <div>Loading...</div>;

  return (
    <div className="app">
      <h1>My AI Chat App</h1>
      <AdBanner
        sdk={sdk}
        placement={{
          id: 'header-banner',
          type: 'banner',
          format: 'display',
          size: { width: 728, height: 90 },
          position: 'top'
        }}
        context={{
          topics: [{ name: 'technology', category: 'tech', confidence: 0.8, keywords: ['laptop'], relevanceScore: 0.9 }],
          intent: { primary: 'research', confidence: 0.9, category: 'informational', actionable: true },
          sentiment: { polarity: 0.1, magnitude: 0.3, label: 'neutral', confidence: 0.8 },
          conversationStage: { stage: 'exploration', progress: 0.3, duration: 30000, messageCount: 4 },
          userEngagement: { score: 0.7, level: 'medium', indicators: [], trend: 'stable' },
          confidence: 0.8,
          extractedAt: new Date()
        }}
      />
    </div>
  );
}
```

### Vue

```vue
<template>
  <div class="app">
    <h1>My AI Chat App</h1>
    <VueAdBanner
      :sdk="sdk"
      :placement="placement"
      :context="context"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { VueAdBanner } from '@ai-yuugen/ui-components/vue';
import { AIYuugenSDK } from '@ai-yuugen/sdk';

const sdk = ref<AIYuugenSDK | null>(null);

const placement = {
  id: 'header-banner',
  type: 'banner',
  format: 'display',
  size: { width: 728, height: 90 },
  position: 'top'
};

const context = {
  topics: [{ name: 'technology', category: 'tech', confidence: 0.8, keywords: ['laptop'], relevanceScore: 0.9 }],
  intent: { primary: 'research', confidence: 0.9, category: 'informational', actionable: true },
  sentiment: { polarity: 0.1, magnitude: 0.3, label: 'neutral', confidence: 0.8 },
  conversationStage: { stage: 'exploration', progress: 0.3, duration: 30000, messageCount: 4 },
  userEngagement: { score: 0.7, level: 'medium', indicators: [], trend: 'stable' },
  confidence: 0.8,
  extractedAt: new Date()
};

onMounted(async () => {
  const sdkInstance = new AIYuugenSDK();
  await sdkInstance.initialize({
    apiKey: 'your-api-key',
    environment: 'production'
  });
  sdk.value = sdkInstance;
});
</script>
```

## Next Steps

- [Configure advanced settings](./configuration.md)
- [Set up privacy compliance](./privacy.md)
- [Integrate with your AI platform](./adapters/README.md)
- [Customize UI components](./integrations/README.md)
- [Set up analytics tracking](./analytics.md)

## Common Issues

If you encounter issues during setup, check our [Troubleshooting Guide](./troubleshooting.md) or [FAQ](./faq.md).