# @ai-yuugen/adcp-client

ADCP (Ad Context Protocol) client library for the AI Ad Yuugen platform. This package provides a unified interface for interacting with ADCP-enabled platforms through the Model Context Protocol (MCP).

## Overview

The ADCP client enables:

- **Signal Discovery**: Find relevant audience signals based on AI context
- **Signal Activation**: Activate signals for enhanced ad targeting
- **Media Buying**: Execute programmatic ad purchases via ADCP platforms
- **Analytics**: Retrieve unified analytics across platforms

## Installation

```bash
npm install @ai-yuugen/adcp-client
```

## Quick Start

```typescript
import { ADCPClient } from '@ai-yuugen/adcp-client';

// Initialize the client
const client = new ADCPClient({
  mcp: {
    serverUrl: 'https://adcp-server.example.com',
    timeout: 5000
  },
  auth: {
    apiKey: 'your-api-key'
  },
  cache: {
    enabled: true,
    ttl: 300 // 5 minutes
  }
});

// Discover signals
const signals = await client.discoverSignals({
  text: 'technology enthusiasts interested in AI',
  categories: ['behavioral', 'contextual'],
  priceRange: { min: 0, max: 10 }
});

// Activate a signal
const activation = await client.activateSignal(signals[0].id, {
  budget: 100,
  duration: { days: 7 }
});
```

## Features

### Signals Activation Protocol

- Discover audience signals based on context
- Activate signals for targeting
- Monitor activation status
- Deactivate signals when no longer needed

### Media Buy Protocol

- Execute programmatic ad purchases
- Optimize campaigns automatically
- Track buy status and performance
- Support for multiple DSP platforms

### Caching

- Intelligent signal caching to reduce latency
- Configurable TTL and eviction policies
- Cache hit ratio monitoring

### Error Handling

- Comprehensive error types and codes
- Automatic retry with exponential backoff
- Circuit breaker for platform failures
- Graceful degradation

## Architecture

The ADCP client is built with a modular architecture:

```
ADCPClient
├── MCPClient (MCP protocol communication)
├── SignalsAPI (Signals Activation Protocol)
├── MediaBuyAPI (Media Buy Protocol)
├── AuthManager (Authentication & key management)
└── SignalCache (Redis-based caching)
```

## Configuration

### ADCPConfig

```typescript
interface ADCPConfig {
  mcp: MCPConfig;
  auth: AuthConfig;
  cache?: CacheConfig;
  endpoints?: EndpointConfig;
}
```

### MCPConfig

```typescript
interface MCPConfig {
  serverUrl: string;
  timeout?: number;
  maxConnections?: number;
}
```

### AuthConfig

```typescript
interface AuthConfig {
  apiKey: string;
  keyRotation?: {
    enabled: boolean;
    interval: number;
  };
}
```

## API Reference

See the [API documentation](./docs/api.md) for detailed method signatures and examples.

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run dev
```

## Requirements

- Node.js >= 18.0.0
- TypeScript >= 5.0.0
- Redis (for caching, optional)

## License

MIT

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines.
