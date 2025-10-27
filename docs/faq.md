# Frequently Asked Questions (FAQ)

Common questions and answers about the AI Ad Yuugen SDK.

## General Questions

### What is AI Ad Yuugen?

AI Ad Yuugen is an open-source advertising platform specifically designed for AI interfaces. It provides context-aware ad targeting based on AI conversations, privacy-compliant data handling, and seamless integration with popular web frameworks.

### How is this different from Google Ad Yuugen?

AI Ad Yuugen is specifically designed for AI applications with features like:
- **Context-aware targeting** based on AI conversation analysis
- **Intent detection** from user interactions with AI
- **Conversation stage awareness** for optimal ad timing
- **AI platform integrations** (OpenAI, Anthropic, Google AI)
- **Privacy-first approach** with built-in compliance tools

### Is AI Ad Yuugen really free and open-source?

Yes, the core SDK is open-source under the MIT license. You can:
- Use it in commercial projects
- Modify the source code
- Contribute to development
- Self-host the infrastructure

However, the hosted ad serving platform may have usage-based pricing for high-volume applications.

### What AI platforms are supported?

Currently supported:
- OpenAI GPT models (GPT-3.5, GPT-4, etc.)
- Anthropic Claude
- Google AI (Gemini, PaLM)
- Custom AI models via generic adapter

More platforms are added regularly based on community requests.

## Technical Questions

### What frameworks are supported?

The SDK provides components for:
- **React** 16.8+ (with hooks)
- **Vue** 3+ (Composition API)
- **Angular** 15+ (standalone components)
- **Vanilla JavaScript** (framework-agnostic)

### Can I use this with TypeScript?

Yes! The SDK is built with TypeScript and includes comprehensive type definitions. You get full IntelliSense support and type safety.

### What are the browser requirements?

**Minimum requirements:**
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

**Features used:**
- ES2018 features
- Fetch API
- Intersection Observer (for lazy loading)
- CSS Custom Properties

### How large is the SDK bundle?

**Bundle sizes (gzipped):**
- Core SDK: ~15KB
- React components: ~8KB
- Vue components: ~7KB
- Angular components: ~9KB
- Vanilla components: ~5KB

Tree shaking is supported to include only what you use.

### Can I self-host the ad serving infrastructure?

Yes, the server components are open-source. You can:
- Deploy your own ad server
- Use your own analytics infrastructure
- Maintain complete data control

See the [self-hosting guide](./self-hosting.md) for details.

## Integration Questions

### How do I get an API key?

1. Sign up at [ai-yuugen.com](https://ai-yuugen.com)
2. Create a new project
3. Generate an API key for your environment
4. Add your domain to the whitelist

### Can I use multiple API keys?

Yes, you can use different API keys for different environments:

```typescript
const apiKey = process.env.NODE_ENV === 'production' 
  ? 'ak_prod_1234567890abcdef'
  : 'ak_dev_1234567890abcdef';

await sdk.initialize({ apiKey, environment: process.env.NODE_ENV });
```

### How do I test without real ads?

Use the development environment with test ads:

```typescript
await sdk.initialize({
  apiKey: 'your-dev-api-key',
  environment: 'development', // Uses test ads
  debugMode: true // Shows detailed logs
});
```

### Can I customize the ad appearance?

Yes, through multiple methods:
- **CSS custom properties** for theming
- **Custom templates** for native ads
- **AdContainer component** for complete custom layouts
- **CSS classes** and inline styles

### How do I handle ad blockers?

The SDK includes built-in ad blocker detection:

```typescript
sdk.onAdBlockerDetected((isBlocked) => {
  if (isBlocked) {
    // Show alternative content or message
    showAdBlockerMessage();
  }
});
```

## Privacy and Compliance

### Is this GDPR compliant?

Yes, the SDK includes built-in GDPR compliance features:
- Consent management
- Data minimization
- Right to be forgotten
- Data portability
- Audit logging

### How do I handle user consent?

```typescript
// Set consent status
sdk.setConsentStatus({
  advertising: true,
  analytics: userConsent.analytics,
  personalization: userConsent.personalization,
  dataSharing: false,
  timestamp: new Date(),
  jurisdiction: 'EU',
  version: '2.0',
  consentMethod: ConsentMethod.EXPLICIT
});
```

### What data is collected?

**With user consent:**
- Conversation topics and context
- User engagement metrics
- Ad interaction events
- Performance analytics

**Without consent:**
- Only essential functionality data
- No personal information
- No tracking across sessions

### Can I disable analytics completely?

Yes:

```typescript
await sdk.initialize({
  apiKey: 'your-api-key',
  environment: 'production',
  enableAnalytics: false // Completely disable analytics
});
```

### How long is data retained?

Default retention periods:
- **Conversation context**: 30 days
- **Analytics data**: 90 days
- **Consent records**: 3 years (legal requirement)

You can configure shorter retention periods in your privacy settings.

## Performance Questions

### Will this slow down my AI application?

The SDK is designed for minimal performance impact:
- **Lazy loading** - Ads load only when needed
- **Async operations** - Non-blocking API calls
- **Caching** - Intelligent response caching
- **Small bundle size** - Optimized for performance

### How do I optimize ad loading?

```typescript
// Preload ads
const preloadedAd = await sdk.requestAd(placement, context);

// Use intersection observer for lazy loading
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadAdForElement(entry.target);
    }
  });
});
```

### Can I cache ad responses?

Yes, the SDK includes intelligent caching:

```typescript
await sdk.initialize({
  apiKey: 'your-api-key',
  environment: 'production',
  cacheConfig: {
    enabled: true,
    ttl: 300000, // 5 minutes
    maxSize: 50 // Max cached ads
  }
});
```

## Monetization Questions

### How do I get paid?

Revenue sharing depends on your plan:
- **Open Source Plan**: 70% revenue share
- **Pro Plan**: 80% revenue share
- **Enterprise Plan**: 90% revenue share

Payments are processed monthly via:
- Bank transfer
- PayPal
- Cryptocurrency (Bitcoin, Ethereum)

### What are the minimum payout thresholds?

- **Bank transfer**: $100
- **PayPal**: $50
- **Cryptocurrency**: $25

### How is revenue calculated?

Revenue is based on:
- **CPM** (Cost Per Mille) - impressions
- **CPC** (Cost Per Click) - clicks
- **CPA** (Cost Per Action) - conversions

You can view detailed analytics in your dashboard.

### Can I set minimum bid prices?

Yes, in your account settings:

```typescript
// Set floor prices
const placement = {
  id: 'premium-banner',
  type: AdType.BANNER,
  format: AdFormat.DISPLAY,
  size: { width: 728, height: 90 },
  position: AdPosition.TOP,
  floorPrice: 2.50 // Minimum $2.50 CPM
};
```

## Troubleshooting

### Why aren't ads showing?

Common causes:
1. **Invalid API key** - Check your API key and environment
2. **No ad inventory** - Contact support to enable ads
3. **Ad blockers** - Test with ad blockers disabled
4. **Targeting too restrictive** - Broaden targeting criteria
5. **Privacy settings** - Check consent status

### Why is context analysis not working?

Ensure you're providing sufficient conversation data:

```typescript
// Good - detailed conversation
const conversation = {
  id: 'conv-123',
  messages: [
    {
      id: 'msg-1',
      role: 'user',
      content: 'I need help choosing a laptop for programming with Python and machine learning',
      timestamp: new Date()
    },
    {
      id: 'msg-2',
      role: 'assistant', 
      content: 'For Python and ML work, you\'ll want a laptop with a good GPU...',
      timestamp: new Date()
    }
  ],
  // ... other properties
};

// Bad - insufficient data
const conversation = {
  id: 'conv-123',
  messages: [
    {
      id: 'msg-1',
      role: 'user',
      content: 'help',
      timestamp: new Date()
    }
  ],
  // ... other properties
};
```

### How do I debug SDK issues?

Enable debug mode:

```typescript
await sdk.initialize({
  apiKey: 'your-api-key',
  environment: 'development',
  debugMode: true // Enables detailed console logging
});

// Check browser console for:
// - API request/response details
// - Context analysis results
// - Error messages with stack traces
// - Performance metrics
```

### Where can I get help?

1. **Documentation** - Check our comprehensive docs
2. **GitHub Issues** - Search existing issues or create new ones
3. **Discord Community** - Join our developer community
4. **Email Support** - support@ai-yuugen.com
5. **Stack Overflow** - Tag questions with `ai-yuugen`

## Contributing

### How can I contribute?

We welcome contributions:
- **Bug reports** - Report issues on GitHub
- **Feature requests** - Suggest new features
- **Code contributions** - Submit pull requests
- **Documentation** - Improve docs and examples
- **Community support** - Help other developers

### What's the development roadmap?

Upcoming features:
- **More AI platform adapters** (Cohere, Hugging Face)
- **Advanced analytics** (A/B testing, cohort analysis)
- **Video ad support** (VAST/VPAID)
- **Mobile SDK** (React Native, Flutter)
- **Server-side rendering** improvements

### How do I report security issues?

For security vulnerabilities:
- **Email**: security@ai-yuugen.com
- **PGP Key**: Available on our website
- **Bug bounty**: Up to $5,000 for critical issues

Do not report security issues publicly on GitHub.

## Still Have Questions?

If your question isn't answered here:
- Check the [Troubleshooting Guide](./troubleshooting.md)
- Search [GitHub Issues](https://github.com/ai-yuugen/platform/issues)
- Join our [Discord Community](https://discord.gg/ai-yuugen)
- Email us at support@ai-yuugen.com