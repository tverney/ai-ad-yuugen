# AI Ad Yuugen Platform

An open-source Ad Yuugen mechanism designed specifically for AI interfaces. This platform provides developers with a comprehensive SDK and infrastructure to integrate targeted advertising into their AI applications.

## Project Structure

This is a monorepo containing the following packages:

- **`@ai-yuugen/types`** - Shared TypeScript types and interfaces
- **`@ai-yuugen/sdk`** - Client-side SDK for AI applications
- **`@ai-yuugen/server`** - Server-side ad serving infrastructure
- **`@ai-yuugen/ui-components`** - UI components for React, Vue, Angular, and vanilla JavaScript

## Features

- 🤖 **AI-Specific Targeting** - Context-aware ad targeting for AI conversations
- 🔒 **Privacy-First** - Built-in GDPR, CCPA compliance
- 🎨 **Customizable UI** - Pre-built components for all major frameworks
- 📊 **Advanced Analytics** - Comprehensive performance tracking
- 🌐 **Multi-Platform** - Works with any AI framework or deployment environment
- ⚡ **Performance Optimized** - Minimal impact on AI application performance

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm run test
```

### Basic Usage

```typescript
import { AIYuugenSDK } from '@ai-yuugen/sdk';

// Initialize the SDK
const sdk = new AIYuugenSDK();
await sdk.initialize({
	apiKey: 'your-api-key',
	environment: 'production',
});

// Request and display an ad
const ad = await sdk.requestAd(placement, context);
sdk.displayAd(ad, container);
```

## Development

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Build packages: `npm run build`
4. Run tests: `npm run test`

### Monorepo Management with Nx

This project uses [Nx](https://nx.dev) for intelligent task orchestration, caching, and dependency management.

#### Quick Commands

**Build**
```bash
npm run build              # Build all packages (cached)
npm run build:affected     # Build only changed packages
nx run sdk:build           # Build specific package
```

**Test**
```bash
npm run test               # Test all packages
npm run test:affected      # Test only changed packages
nx run sdk:test            # Test specific package
```

**Lint**
```bash
npm run lint               # Lint all packages
npm run lint:affected      # Lint only changed packages
```

**Development**
```bash
npm run dev                # Run all packages in dev mode (parallel)
npm run dev:server         # Run server only
npm run dev:portal         # Run developer portal only
npm run dev:storybook      # Run Storybook only
```

**Utilities**
```bash
npm run graph              # View interactive dependency graph
npm run clean              # Clean all build artifacts
npm run reset              # Clear Nx cache
nx show projects           # List all projects
```

#### Why Nx?

Nx provides several key benefits:

- **Smart Caching** - Tasks are cached based on inputs. Running `npm run build` twice without changes is instant!
- **Task Orchestration** - Automatically runs tasks in the correct order based on dependencies
- **Affected Commands** - Only build/test what changed, saving time in development and CI
- **Parallel Execution** - Run multiple tasks simultaneously for faster builds
- **Dependency Graph** - Visualize how packages depend on each other

#### Project Dependencies

```
types (no dependencies)
  ├── sdk
  ├── ui-components
  └── server
      
sdk + ui-components
  └── developer-portal
      
ui-components
  └── storybook
```

Nx ensures `types` builds first, then `sdk`/`ui-components`/`server`, and finally `developer-portal`/`storybook`.

#### Advanced Usage

**Run specific projects:**
```bash
nx run-many -t build -p sdk,ui-components
```

**Run multiple tasks in parallel:**
```bash
nx run-many -t build,test,lint --parallel=3
```

**See what's affected by your changes:**
```bash
nx affected:graph
nx affected -t build,test
```

**CI/CD optimization:**
```bash
# Only build and test what changed
nx affected -t build,test,lint --base=origin/main --head=HEAD
```

#### Configuration

- **nx.json** - Global Nx configuration and caching rules
- **packages/*/project.json** - Per-project task configuration
- **.nx/cache** - Local cache directory (gitignored)

## Architecture

The platform follows a microservices architecture with clear separation of concerns:

- **Client SDK** - Lightweight library for AI applications
- **Ad Serving Engine** - Real-time ad selection and delivery
- **Targeting Engine** - Context-aware ad targeting for AI interactions
- **Analytics Platform** - Performance tracking and reporting
- **Privacy Engine** - Consent management and compliance

## Documentation

📖 **[Complete Documentation](./docs/README.md)**

- [Quick Start Guide](./docs/quick-start.md) - Get up and running in minutes
- [API Reference](./docs/api-reference.md) - Complete API documentation
- [Framework Integration Guides](./docs/integrations/README.md) - React, Vue, Angular, Vanilla JS
- [Configuration Guide](./docs/configuration.md) - Advanced configuration options
- [Privacy & Compliance](./docs/privacy.md) - GDPR, CCPA compliance
- [Troubleshooting](./docs/troubleshooting.md) - Common issues and solutions
- [FAQ](./docs/faq.md) - Frequently asked questions
- [Examples](./docs/examples/README.md) - Practical implementation examples

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 💬 Discord: [Join our community](https://discord.gg/ai-yuugen)
- 📖 Documentation: [docs.ai-yuugen.com](https://docs.ai-yuugen.com)
- 🐛 Issues: [GitHub Issues](https://github.com/ai-yuugen/platform/issues)
