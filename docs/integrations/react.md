# React Integration Guide

Complete guide for integrating AI Ad Yuugen with React applications.

## Installation

```bash
npm install @ai-yuugen/sdk @ai-yuugen/ui-components
```

## Quick Start

### 1. SDK Provider Setup

Create a context provider for the SDK:

```tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AIYuugenSDK } from '@ai-yuugen/sdk';

const SDKContext = createContext<AIYuugenSDK | null>(null);

export const SDKProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sdk, setSdk] = useState<AIYuugenSDK | null>(null);

  useEffect(() => {
    const initSDK = async () => {
      const sdkInstance = new AIYuugenSDK();
      await sdkInstance.initialize({
        apiKey: process.env.REACT_APP_AI_ADSENSE_API_KEY!,
        environment: 'production'
      });
      setSdk(sdkInstance);
    };
    
    initSDK().catch(console.error);
  }, []);

  return (
    <SDKContext.Provider value={sdk}>
      {children}
    </SDKContext.Provider>
  );
};

export const useSDK = () => {
  const sdk = useContext(SDKContext);
  if (!sdk) throw new Error('SDK not initialized');
  return sdk;
};
```

### 2. Basic Component Usage

```tsx
import React from 'react';
import { AdBanner } from '@ai-yuugen/ui-components/react';
import { useSDK } from './SDKProvider';

export const ChatSidebar: React.FC = () => {
  const sdk = useSDK();

  const placement = {
    id: 'sidebar-banner',
    type: 'banner' as const,
    format: 'display' as const,
    size: { width: 300, height: 250 },
    position: 'right' as const
  };

  const context = {
    topics: [{ name: 'technology', category: 'tech', confidence: 0.8, keywords: ['react'], relevanceScore: 0.9 }],
    intent: { primary: 'learning', confidence: 0.9, category: 'informational' as const, actionable: true },
    sentiment: { polarity: 0.1, magnitude: 0.3, label: 'neutral' as const, confidence: 0.8 },
    conversationStage: { stage: 'exploration' as const, progress: 0.3, duration: 30000, messageCount: 4 },
    userEngagement: { score: 0.7, level: 'medium' as const, indicators: [], trend: 'stable' as const },
    confidence: 0.8,
    extractedAt: new Date()
  };

  return (
    <div className="chat-sidebar">
      <AdBanner
        sdk={sdk}
        placement={placement}
        context={context}
        onAdLoad={(ad) => console.log('Ad loaded:', ad.id)}
        onAdError={(error) => console.error('Ad error:', error)}
      />
    </div>
  );
};
```#
# Available Components

### AdBanner

Display banner advertisements in various sizes.

```tsx
import { AdBanner } from '@ai-yuugen/ui-components/react';

<AdBanner
  sdk={sdk}
  placement={placement}
  context={context}
  className="custom-banner"
  style={{ margin: '20px 0' }}
  onAdLoad={(ad) => console.log('Banner loaded:', ad)}
  onAdClick={(ad) => console.log('Banner clicked:', ad)}
  onAdError={(error) => console.error('Banner error:', error)}
/>
```

**Props:**
- `sdk`: AIYuugenSDK instance (required)
- `placement`: AdPlacement configuration (required)
- `context`: AIContext for targeting (required)
- `className`: Additional CSS class names
- `style`: Inline styles
- `onAdLoad`: Callback when ad loads successfully
- `onAdClick`: Callback when ad is clicked
- `onAdError`: Callback when ad fails to load

### AdInterstitial

Full-screen overlay advertisements.

```tsx
import { AdInterstitial } from '@ai-yuugen/ui-components/react';

const [showInterstitial, setShowInterstitial] = useState(false);

<AdInterstitial
  sdk={sdk}
  placement={interstitialPlacement}
  context={context}
  isOpen={showInterstitial}
  onClose={() => setShowInterstitial(false)}
  onAdLoad={(ad) => console.log('Interstitial loaded:', ad)}
  onAdClick={(ad) => {
    console.log('Interstitial clicked:', ad);
    setShowInterstitial(false);
  }}
/>
```

**Props:**
- `isOpen`: Whether the interstitial is visible (required)
- `onClose`: Callback to close the interstitial (required)
- All other props same as AdBanner

### AdNative

Native advertisements that blend with content.

```tsx
import { AdNative } from '@ai-yuugen/ui-components/react';

<AdNative
  sdk={sdk}
  placement={nativePlacement}
  context={context}
  template="article" // or "card", "list", "custom"
  showBranding={true}
  onAdLoad={(ad) => console.log('Native ad loaded:', ad)}
/>
```

**Props:**
- `template`: Native ad template style
- `showBranding`: Whether to show "Advertisement" label
- All other props same as AdBanner

### AdContainer

Generic container for custom ad layouts.

```tsx
import { AdContainer } from '@ai-yuugen/ui-components/react';

<AdContainer
  sdk={sdk}
  placement={placement}
  context={context}
  renderAd={(ad, isLoading, error) => (
    <div className="custom-ad-layout">
      {isLoading && <div>Loading ad...</div>}
      {error && <div>Failed to load ad</div>}
      {ad && (
        <div>
          <img src={ad.content.imageUrl} alt={ad.content.title} />
          <h3>{ad.content.title}</h3>
          <p>{ad.content.description}</p>
          <button onClick={() => window.open(ad.content.landingUrl)}>
            {ad.content.ctaText}
          </button>
        </div>
      )}
    </div>
  )}
/>
```

## Hooks

### useAd

Custom hook for manual ad management.

```tsx
import { useAd } from '@ai-yuugen/ui-components/react';

const MyComponent: React.FC = () => {
  const { ad, isLoading, error, requestAd } = useAd(sdk);

  useEffect(() => {
    requestAd(placement, context);
  }, [placement, context]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!ad) return null;

  return (
    <div>
      <h3>{ad.content.title}</h3>
      <p>{ad.content.description}</p>
    </div>
  );
};
```

### useAnalytics

Hook for tracking analytics events.

```tsx
import { useAnalytics } from '@ai-yuugen/ui-components/react';

const MyComponent: React.FC = () => {
  const { trackEvent, getMetrics } = useAnalytics(sdk);

  const handleAdClick = (ad: Ad) => {
    trackEvent({
      id: `click_${Date.now()}`,
      type: 'ad_click',
      adId: ad.id,
      sessionId: 'session-123',
      timestamp: new Date(),
      context: { placement: 'sidebar' }
    });
  };

  return <div>...</div>;
};
```

## Advanced Usage

### Context-Aware Ads

Automatically update ads based on conversation changes:

```tsx
import React, { useEffect, useState } from 'react';
import { AdBanner } from '@ai-yuugen/ui-components/react';

interface ChatAdProps {
  conversation: AIConversation;
  sdk: AIYuugenSDK;
}

export const ChatAd: React.FC<ChatAdProps> = ({ conversation, sdk }) => {
  const [context, setContext] = useState<AIContext | null>(null);

  useEffect(() => {
    const newContext = sdk.analyzeContext(conversation);
    setContext(newContext);
  }, [conversation, sdk]);

  if (!context) return null;

  return (
    <AdBanner
      sdk={sdk}
      placement={{
        id: 'chat-contextual',
        type: 'banner',
        format: 'display',
        size: { width: 300, height: 250 },
        position: 'inline'
      }}
      context={context}
    />
  );
};
```

### Error Boundaries

Wrap ad components in error boundaries:

```tsx
import React from 'react';

class AdErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Ad component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="ad-error">Advertisement unavailable</div>;
    }

    return this.props.children;
  }
}

// Usage
<AdErrorBoundary>
  <AdBanner sdk={sdk} placement={placement} context={context} />
</AdErrorBoundary>
```

## Styling

### CSS Custom Properties

```css
.ai-yuugen-banner {
  --ad-border-radius: 8px;
  --ad-border: 1px solid #e1e5e9;
  --ad-background: #ffffff;
  --ad-padding: 16px;
  --ad-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.ai-yuugen-native {
  --native-title-color: #333333;
  --native-description-color: #666666;
  --native-cta-background: #0066cc;
  --native-cta-color: #ffffff;
  --native-branding-color: #999999;
}
```

### Styled Components

```tsx
import styled from 'styled-components';
import { AdBanner } from '@ai-yuugen/ui-components/react';

const StyledAdBanner = styled(AdBanner)`
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin: 20px 0;
  
  .ad-content {
    padding: 20px;
  }
  
  .ad-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }
`;
```

## TypeScript Support

Full TypeScript definitions are included:

```tsx
import type { 
  AdPlacement, 
  AIContext, 
  Ad, 
  AdEvent 
} from '@ai-yuugen/sdk';

interface MyAdComponentProps {
  placement: AdPlacement;
  context: AIContext;
  onAdLoad?: (ad: Ad) => void;
  onAdError?: (error: Error) => void;
}

const MyAdComponent: React.FC<MyAdComponentProps> = ({
  placement,
  context,
  onAdLoad,
  onAdError
}) => {
  // Component implementation
};
```

## Testing

### Jest Testing

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { AdBanner } from '@ai-yuugen/ui-components/react';
import { AIYuugenSDK } from '@ai-yuugen/sdk';

// Mock the SDK
jest.mock('@ai-yuugen/sdk');

describe('AdBanner', () => {
  const mockSDK = new AIYuugenSDK() as jest.Mocked<AIYuugenSDK>;
  
  beforeEach(() => {
    mockSDK.requestAd.mockResolvedValue({
      id: 'test-ad',
      type: 'banner',
      format: 'display',
      content: {
        title: 'Test Ad',
        description: 'Test Description',
        ctaText: 'Click Here',
        landingUrl: 'https://example.com',
        brandName: 'Test Brand'
      },
      createdAt: new Date(),
      expiresAt: new Date()
    });
  });

  it('renders ad content', async () => {
    render(
      <AdBanner
        sdk={mockSDK}
        placement={mockPlacement}
        context={mockContext}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Ad')).toBeInTheDocument();
    });
  });
});
```

## Performance Optimization

### Lazy Loading

```tsx
import React, { lazy, Suspense } from 'react';

const AdBanner = lazy(() => import('@ai-yuugen/ui-components/react').then(m => ({ default: m.AdBanner })));

const MyComponent: React.FC = () => (
  <Suspense fallback={<div>Loading ad...</div>}>
    <AdBanner sdk={sdk} placement={placement} context={context} />
  </Suspense>
);
```

### Memoization

```tsx
import React, { memo, useMemo } from 'react';

const OptimizedAdBanner = memo<AdBannerProps>(({ sdk, placement, context, ...props }) => {
  const memoizedContext = useMemo(() => context, [
    context.topics,
    context.intent,
    context.confidence
  ]);

  return (
    <AdBanner
      sdk={sdk}
      placement={placement}
      context={memoizedContext}
      {...props}
    />
  );
});
```

## Next Steps

- [Vue Integration Guide](./vue.md)
- [Angular Integration Guide](./angular.md)
- [Configuration Guide](../configuration.md)
- [Analytics Setup](../analytics.md)