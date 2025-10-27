/**
 * Example usage of AI Ad Yuugen SDK adapters for different AI platforms
 */

import {
  AIAdapterFactory,
  OpenAIAdapter,
  AnthropicAdapter,
  GoogleAIAdapter,
  AIPlatform,
  DeploymentEnvironment,
  IntegrationPattern
} from '../src/adapters';

// Example 1: Using the Adapter Factory
async function exampleUsingFactory() {
  const factory = AIAdapterFactory.getInstance();

  // Create configuration for OpenAI
  const openAIConfig = {
    platform: AIPlatform.OPENAI,
    environment: DeploymentEnvironment.CLIENT_SIDE,
    pattern: IntegrationPattern.WRAPPER,
    adSenseConfig: {
      apiKey: 'your-yuugen-api-key',
      placementIds: ['placement-1', 'placement-2'],
      enableContextAnalysis: true,
      enablePrivacyMode: true,
      enableAnalytics: true
    },
    platformConfig: {
      apiKey: 'sk-your-openai-api-key',
      environment: 'development' as const,
      model: 'gpt-3.5-turbo',
      maxTokens: 1000,
      temperature: 0.7,
      timeout: 30000,
      retryAttempts: 3,
      debugMode: true
    }
  };

  // Create and initialize adapter
  const adapter = factory.createAdapter(openAIConfig);
  await adapter.initialize(openAIConfig);

  // Use the adapter
  const conversation = {
    messages: [
      { role: 'user' as const, content: 'Hello, I need help with React state management' }
    ],
    model: 'gpt-3.5-turbo'
  };

  const context = adapter.extractConversationContext(conversation);
  console.log('Extracted context:', context);

  // Clean up
  adapter.destroy();
}

// Example 2: Using OpenAI Adapter directly with Express middleware
async function exampleOpenAIExpressMiddleware() {
  const config = {
    platform: AIPlatform.OPENAI,
    environment: DeploymentEnvironment.SERVER_SIDE,
    pattern: IntegrationPattern.MIDDLEWARE,
    adSenseConfig: {
      apiKey: 'your-yuugen-api-key',
      placementIds: ['placement-1'],
      enableContextAnalysis: true,
      enablePrivacyMode: true,
      enableAnalytics: true
    },
    platformConfig: {
      apiKey: 'sk-your-openai-api-key',
      environment: 'development' as const,
      model: 'gpt-3.5-turbo',
      debugMode: true
    }
  };

  // Create Express middleware
  const middleware = OpenAIAdapter.createExpressMiddleware(config);
  const responseInterceptor = OpenAIAdapter.createResponseInterceptor(config);

  // In your Express app:
  // app.use('/api/openai', middleware);
  // app.use('/api/openai', responseInterceptor);

  console.log('OpenAI Express middleware created');
}

// Example 3: Using Anthropic Adapter with client wrapper
async function exampleAnthropicClientWrapper() {
  const config = {
    platform: AIPlatform.ANTHROPIC,
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
      apiKey: 'sk-ant-your-anthropic-api-key',
      environment: 'development' as const,
      model: 'claude-3-sonnet-20240229',
      debugMode: true
    }
  };

  // Create client wrapper
  const wrapper = AnthropicAdapter.createClientWrapper(config);
  await wrapper.initialize();

  // Use the wrapper
  const messages = [
    { role: 'user' as const, content: 'Hello, I need help with my project' }
  ];

  try {
    const response = await wrapper.messages(messages, {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000
    });
    console.log('Anthropic response with ads:', response);
  } catch (error) {
    console.error('Error:', error);
  }

  // Clean up
  wrapper.destroy();
}

// Example 4: Using Google AI Adapter with Cloud Functions
async function exampleGoogleAICloudFunction() {
  const config = {
    platform: AIPlatform.GOOGLE_AI,
    environment: DeploymentEnvironment.SERVERLESS,
    pattern: IntegrationPattern.WEBHOOK,
    adSenseConfig: {
      apiKey: 'your-yuugen-api-key',
      placementIds: ['placement-1'],
      enableContextAnalysis: true,
      enablePrivacyMode: true,
      enableAnalytics: true
    },
    platformConfig: {
      apiKey: 'your-google-ai-api-key',
      environment: 'development' as const,
      model: 'gemini-pro',
      projectId: 'your-project-id',
      debugMode: true
    }
  };

  // Create Cloud Function handler
  const handler = GoogleAIAdapter.createCloudFunctionHandler(config);

  // In your Cloud Function:
  // exports.aiChat = handler;

  console.log('Google AI Cloud Function handler created');
}

// Example 5: Multi-platform setup
async function exampleMultiPlatform() {
  const factory = AIAdapterFactory.getInstance();

  const configs = [
    {
      platform: AIPlatform.OPENAI,
      environment: DeploymentEnvironment.CLIENT_SIDE,
      pattern: IntegrationPattern.WRAPPER,
      adSenseConfig: {
        apiKey: 'your-yuugen-api-key',
        placementIds: ['openai-placement'],
        enableContextAnalysis: true,
        enablePrivacyMode: true,
        enableAnalytics: true
      },
      platformConfig: {
        apiKey: 'sk-your-openai-api-key',
        environment: 'development' as const
      }
    },
    {
      platform: AIPlatform.ANTHROPIC,
      environment: DeploymentEnvironment.CLIENT_SIDE,
      pattern: IntegrationPattern.WRAPPER,
      adSenseConfig: {
        apiKey: 'your-yuugen-api-key',
        placementIds: ['anthropic-placement'],
        enableContextAnalysis: true,
        enablePrivacyMode: true,
        enableAnalytics: true
      },
      platformConfig: {
        apiKey: 'sk-ant-your-anthropic-api-key',
        environment: 'development' as const
      }
    },
    {
      platform: AIPlatform.GOOGLE_AI,
      environment: DeploymentEnvironment.CLIENT_SIDE,
      pattern: IntegrationPattern.WRAPPER,
      adSenseConfig: {
        apiKey: 'your-yuugen-api-key',
        placementIds: ['google-ai-placement'],
        enableContextAnalysis: true,
        enablePrivacyMode: true,
        enableAnalytics: true
      },
      platformConfig: {
        apiKey: 'your-google-ai-api-key',
        environment: 'development' as const
      }
    }
  ];

  // Create adapters for all platforms
  const adapters = factory.createMultiPlatformAdapters(configs);

  console.log(`Created ${adapters.size} adapters for different platforms`);

  // Initialize all adapters
  for (const [platform, adapter] of adapters) {
    const config = configs.find(c => c.platform === platform);
    if (config) {
      await adapter.initialize(config);
      console.log(`Initialized ${platform} adapter`);
    }
  }

  // Clean up all adapters
  adapters.forEach(adapter => adapter.destroy());
}

// Example 6: Auto-detection of platform
async function exampleAutoDetection() {
  const factory = AIAdapterFactory.getInstance();

  // The factory can auto-detect the platform based on API key format
  const config = {
    environment: DeploymentEnvironment.CLIENT_SIDE,
    pattern: IntegrationPattern.WRAPPER,
    adSenseConfig: {
      apiKey: 'your-yuugen-api-key',
      placementIds: ['auto-detected-placement'],
      enableContextAnalysis: true,
      enablePrivacyMode: true,
      enableAnalytics: true
    },
    platformConfig: {
      apiKey: 'sk-your-openai-api-key', // Will be detected as OpenAI
      environment: 'development' as const
    }
  };

  const adapter = factory.createAdapterWithAutoDetection(config);
  console.log(`Auto-detected platform: ${adapter.platform}`);

  adapter.destroy();
}

// Example 7: Getting recommended configuration
function exampleRecommendedConfig() {
  const factory = AIAdapterFactory.getInstance();

  // Get recommended configuration for each platform
  const platforms = [AIPlatform.OPENAI, AIPlatform.ANTHROPIC, AIPlatform.GOOGLE_AI];
  const environments = [DeploymentEnvironment.CLIENT_SIDE, DeploymentEnvironment.SERVER_SIDE];

  for (const platform of platforms) {
    for (const environment of environments) {
      if (factory.isCompatible(platform, environment)) {
        const recommendedConfig = factory.getRecommendedConfig(platform, environment);
        console.log(`Recommended config for ${platform} in ${environment}:`, recommendedConfig);
      }
    }
  }
}

// Run examples (uncomment to test)
async function runExamples() {
  console.log('AI Ad Yuugen SDK Adapter Examples');
  console.log('================================');

  try {
    // await exampleUsingFactory();
    // await exampleOpenAIExpressMiddleware();
    // await exampleAnthropicClientWrapper();
    // await exampleGoogleAICloudFunction();
    // await exampleMultiPlatform();
    // await exampleAutoDetection();
    exampleRecommendedConfig();
  } catch (error) {
    console.error('Example error:', error);
  }
}

// Export examples for use
export {
  exampleUsingFactory,
  exampleOpenAIExpressMiddleware,
  exampleAnthropicClientWrapper,
  exampleGoogleAICloudFunction,
  exampleMultiPlatform,
  exampleAutoDetection,
  exampleRecommendedConfig,
  runExamples
};

// Run if this file is executed directly
if (require.main === module) {
  runExamples();
}