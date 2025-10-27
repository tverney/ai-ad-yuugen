# Framework Integration Guides

The AI Ad Yuugen SDK provides pre-built UI components for popular web frameworks, making integration seamless and consistent across different technologies.

## Supported Frameworks

- [React](./react.md) - Components for React 16.8+ with hooks support
- [Vue](./vue.md) - Components for Vue 3+ with Composition API
- [Angular](./angular.md) - Components for Angular 15+ with standalone components
- [Vanilla JavaScript](./vanilla.md) - Framework-agnostic components for any environment

## Common Features

All framework integrations provide:

- **Consistent API** - Same props and configuration across frameworks
- **TypeScript Support** - Full type definitions and IntelliSense
- **Responsive Design** - Automatic adaptation to different screen sizes
- **Accessibility** - WCAG 2.1 compliant with proper ARIA labels
- **Customizable Styling** - CSS custom properties and theme support
- **Error Handling** - Graceful fallbacks and error boundaries
- **Performance Optimized** - Lazy loading and minimal bundle impact

## Component Types

### AdBanner
Display banner advertisements in various sizes and positions.

### AdInterstitial
Full-screen overlay advertisements for high-impact moments.

### AdNative
Native advertisements that blend with your application's content.

### AdContainer
Generic container for custom ad layouts and multiple ad types.

## Installation

Each framework has its own package for optimal bundle size:

```bash
# React
npm install @ai-yuugen/ui-components

# Vue
npm install @ai-yuugen/ui-components

# Angular
npm install @ai-yuugen/ui-components

# Vanilla JavaScript
npm install @ai-yuugen/ui-components
```

## Basic Usage Pattern

All frameworks follow a similar usage pattern:

1. Initialize the SDK
2. Configure ad placement
3. Provide AI context
4. Render the component

```typescript
// 1. Initialize SDK
const sdk = new AIYuugenSDK();
await sdk.initialize({ apiKey: 'your-key', environment: 'production' });

// 2. Configure placement
const placement = {
  id: 'main-banner',
  type: AdType.BANNER,
  format: AdFormat.DISPLAY,
  size: { width: 728, height: 90 },
  position: AdPosition.TOP
};

// 3. Provide context
const context = sdk.analyzeContext(conversation);

// 4. Render component (framework-specific)
```

## Styling and Theming

All components support CSS custom properties for theming:

```css
.ai-yuugen-ad {
  --ad-border-radius: 8px;
  --ad-border-color: #e1e5e9;
  --ad-background-color: #ffffff;
  --ad-text-color: #333333;
  --ad-link-color: #0066cc;
  --ad-cta-background: #0066cc;
  --ad-cta-color: #ffffff;
}
```

## Error Handling

All components include built-in error handling:

- **Network Errors** - Automatic retry with exponential backoff
- **Ad Serving Failures** - Fallback to default ads or empty state
- **Invalid Configuration** - Clear error messages and recovery suggestions
- **Privacy Violations** - Automatic compliance checks and blocking

## Performance Considerations

- **Lazy Loading** - Components load ads only when visible
- **Bundle Splitting** - Framework-specific optimizations
- **Caching** - Intelligent ad response caching
- **Preloading** - Optional ad preloading for better UX

## Next Steps

Choose your framework to get started:

- [React Integration Guide](./react.md)
- [Vue Integration Guide](./vue.md)
- [Angular Integration Guide](./angular.md)
- [Vanilla JavaScript Guide](./vanilla.md)