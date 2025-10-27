import {
  AdapterFactory,
  AIAdapter,
  AdapterIntegrationConfig,
  AIPlatform,
  DeploymentEnvironment,
  AdapterError,
  AdapterErrorType
} from './types';
import { OpenAIAdapter } from './openai-adapter';
import { AnthropicAdapter } from './anthropic-adapter';
import { GoogleAIAdapter } from './google-ai-adapter';

/**
 * Factory for creating AI platform adapters
 */
export class AIAdapterFactory implements AdapterFactory {
  private static instance: AIAdapterFactory | null = null;

  /**
   * Get singleton instance of the adapter factory
   */
  static getInstance(): AIAdapterFactory {
    if (!AIAdapterFactory.instance) {
      AIAdapterFactory.instance = new AIAdapterFactory();
    }
    return AIAdapterFactory.instance;
  }

  /**
   * Create an adapter for the specified platform and environment
   */
  createAdapter(config: AdapterIntegrationConfig): AIAdapter {
    try {
      this.validateConfig(config);

      switch (config.platform) {
        case AIPlatform.OPENAI:
          return new OpenAIAdapter(config.environment);

        case AIPlatform.ANTHROPIC:
          return new AnthropicAdapter(config.environment);

        case AIPlatform.GOOGLE_AI:
          return new GoogleAIAdapter(config.environment);

        default:
          throw new AdapterError(
            AdapterErrorType.INITIALIZATION_FAILED,
            config.platform,
            `Unsupported AI platform: ${config.platform}`,
            'FACTORY_001',
            { supportedPlatforms: this.getSupportedPlatforms() }
          );
      }
    } catch (error) {
      if (error instanceof AdapterError) {
        throw error;
      }

      throw new AdapterError(
        AdapterErrorType.INITIALIZATION_FAILED,
        config.platform,
        `Failed to create adapter: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FACTORY_002',
        { originalError: error, config: this.sanitizeConfig(config) }
      );
    }
  }

  /**
   * Get list of supported AI platforms
   */
  getSupportedPlatforms(): AIPlatform[] {
    return [
      AIPlatform.OPENAI,
      AIPlatform.ANTHROPIC,
      AIPlatform.GOOGLE_AI
    ];
  }

  /**
   * Get list of supported deployment environments
   */
  getSupportedEnvironments(): DeploymentEnvironment[] {
    return [
      DeploymentEnvironment.CLIENT_SIDE,
      DeploymentEnvironment.SERVER_SIDE,
      DeploymentEnvironment.EDGE,
      DeploymentEnvironment.SERVERLESS
    ];
  }

  /**
   * Check if a platform is supported
   */
  isPlatformSupported(platform: AIPlatform): boolean {
    return this.getSupportedPlatforms().includes(platform);
  }

  /**
   * Check if an environment is supported
   */
  isEnvironmentSupported(environment: DeploymentEnvironment): boolean {
    return this.getSupportedEnvironments().includes(environment);
  }

  /**
   * Get platform-specific configuration requirements
   */
  getPlatformRequirements(platform: AIPlatform): Record<string, any> {
    switch (platform) {
      case AIPlatform.OPENAI:
        return {
          apiKey: { required: true, format: 'sk-*', description: 'OpenAI API key starting with sk-' },
          model: { required: false, default: 'gpt-3.5-turbo', description: 'OpenAI model name' },
          organization: { required: false, description: 'OpenAI organization ID' },
          maxTokens: { required: false, default: 1000, description: 'Maximum tokens per request' },
          temperature: { required: false, default: 0.7, description: 'Response randomness (0-2)' }
        };

      case AIPlatform.ANTHROPIC:
        return {
          apiKey: { required: true, format: 'sk-ant-*', description: 'Anthropic API key starting with sk-ant-' },
          model: { required: false, default: 'claude-3-sonnet-20240229', description: 'Anthropic model name' },
          maxTokens: { required: false, default: 1000, description: 'Maximum tokens per request' },
          temperature: { required: false, default: 0.7, description: 'Response randomness (0-1)' },
          topP: { required: false, default: 0.9, description: 'Top-p sampling parameter' }
        };

      case AIPlatform.GOOGLE_AI:
        return {
          apiKey: { required: true, description: 'Google AI API key' },
          model: { required: false, default: 'gemini-pro', description: 'Google AI model name' },
          projectId: { required: false, description: 'Google Cloud project ID' },
          location: { required: false, default: 'us-central1', description: 'Google Cloud region' },
          maxTokens: { required: false, default: 1000, description: 'Maximum tokens per request' },
          temperature: { required: false, default: 0.7, description: 'Response randomness (0-1)' }
        };

      default:
        return {};
    }
  }

  /**
   * Create multiple adapters for different platforms
   */
  createMultiPlatformAdapters(configs: AdapterIntegrationConfig[]): Map<AIPlatform, AIAdapter> {
    const adapters = new Map<AIPlatform, AIAdapter>();

    for (const config of configs) {
      try {
        const adapter = this.createAdapter(config);
        adapters.set(config.platform, adapter);
      } catch (error) {
        console.error(`Failed to create adapter for ${config.platform}:`, error);
        // Continue creating other adapters even if one fails
      }
    }

    return adapters;
  }

  /**
   * Create adapter with automatic platform detection
   */
  createAdapterWithAutoDetection(config: Omit<AdapterIntegrationConfig, 'platform'>): AIAdapter {
    const platform = this.detectPlatform(config.platformConfig);
    
    const fullConfig: AdapterIntegrationConfig = {
      ...config,
      platform
    };

    return this.createAdapter(fullConfig);
  }

  /**
   * Detect AI platform based on configuration
   */
  private detectPlatform(platformConfig: any): AIPlatform {
    if (platformConfig.apiKey?.startsWith('sk-')) {
      return AIPlatform.OPENAI;
    }

    if (platformConfig.apiKey?.startsWith('sk-ant-')) {
      return AIPlatform.ANTHROPIC;
    }

    if (platformConfig.projectId || platformConfig.model?.includes('gemini')) {
      return AIPlatform.GOOGLE_AI;
    }

    // Default to OpenAI if detection fails
    return AIPlatform.OPENAI;
  }

  /**
   * Validate adapter configuration
   */
  private validateConfig(config: AdapterIntegrationConfig): void {
    const errors: string[] = [];

    // Validate platform
    if (!config.platform) {
      errors.push('Platform is required');
    } else if (!this.isPlatformSupported(config.platform)) {
      errors.push(`Unsupported platform: ${config.platform}`);
    }

    // Validate environment
    if (!config.environment) {
      errors.push('Environment is required');
    } else if (!this.isEnvironmentSupported(config.environment)) {
      errors.push(`Unsupported environment: ${config.environment}`);
    }

    // Validate Ad Yuugen configuration
    if (!config.adSenseConfig) {
      errors.push('Ad Yuugen configuration is required');
    } else {
      if (!config.adSenseConfig.apiKey) {
        errors.push('Ad Yuugen API key is required');
      }
      if (!config.adSenseConfig.placementIds?.length) {
        errors.push('At least one placement ID is required');
      }
    }

    // Validate platform configuration
    if (!config.platformConfig) {
      errors.push('Platform configuration is required');
    } else {
      const requirements = this.getPlatformRequirements(config.platform);
      
      for (const [key, requirement] of Object.entries(requirements)) {
        if (requirement.required && !config.platformConfig[key]) {
          errors.push(`${key} is required for ${config.platform}`);
        }
        
        if (requirement.format && config.platformConfig[key]) {
          const format = requirement.format as string;
          if (format.includes('*') && !config.platformConfig[key].startsWith(format.replace('*', ''))) {
            errors.push(`${key} must match format: ${format}`);
          }
        }
      }
    }

    if (errors.length > 0) {
      throw new AdapterError(
        AdapterErrorType.INITIALIZATION_FAILED,
        config.platform,
        `Configuration validation failed: ${errors.join(', ')}`,
        'FACTORY_VALIDATION_001',
        { validationErrors: errors }
      );
    }
  }

  /**
   * Sanitize config for logging (remove sensitive data)
   */
  private sanitizeConfig(config: AdapterIntegrationConfig): any {
    const sanitized = JSON.parse(JSON.stringify(config));
    
    if (sanitized.adSenseConfig?.apiKey) {
      sanitized.adSenseConfig.apiKey = '***';
    }
    
    if (sanitized.platformConfig?.apiKey) {
      sanitized.platformConfig.apiKey = '***';
    }

    return sanitized;
  }

  /**
   * Get adapter compatibility matrix
   */
  getCompatibilityMatrix(): Record<AIPlatform, DeploymentEnvironment[]> {
    return {
      [AIPlatform.OPENAI]: [
        DeploymentEnvironment.CLIENT_SIDE,
        DeploymentEnvironment.SERVER_SIDE,
        DeploymentEnvironment.EDGE,
        DeploymentEnvironment.SERVERLESS
      ],
      [AIPlatform.ANTHROPIC]: [
        DeploymentEnvironment.CLIENT_SIDE,
        DeploymentEnvironment.SERVER_SIDE,
        DeploymentEnvironment.SERVERLESS
      ],
      [AIPlatform.GOOGLE_AI]: [
        DeploymentEnvironment.CLIENT_SIDE,
        DeploymentEnvironment.SERVER_SIDE,
        DeploymentEnvironment.SERVERLESS
      ],
      [AIPlatform.CUSTOM]: [
        DeploymentEnvironment.CLIENT_SIDE,
        DeploymentEnvironment.SERVER_SIDE
      ]
    };
  }

  /**
   * Check if platform and environment combination is supported
   */
  isCompatible(platform: AIPlatform, environment: DeploymentEnvironment): boolean {
    const matrix = this.getCompatibilityMatrix();
    return matrix[platform]?.includes(environment) || false;
  }

  /**
   * Get recommended configuration for a platform and environment
   */
  getRecommendedConfig(platform: AIPlatform, environment: DeploymentEnvironment): Partial<AdapterIntegrationConfig> {
    const baseConfig = {
      platform,
      environment,
      pattern: this.getRecommendedPattern(platform, environment),
      adSenseConfig: {
        enableContextAnalysis: true,
        enablePrivacyMode: true,
        enableAnalytics: true
      }
    };

    // Add platform-specific recommendations
    switch (platform) {
      case AIPlatform.OPENAI:
        return {
          ...baseConfig,
          platformConfig: {
            model: 'gpt-3.5-turbo',
            maxTokens: 1000,
            temperature: 0.7,
            timeout: 30000,
            retryAttempts: 3
          }
        };

      case AIPlatform.ANTHROPIC:
        return {
          ...baseConfig,
          platformConfig: {
            model: 'claude-3-sonnet-20240229',
            maxTokens: 1000,
            temperature: 0.7,
            topP: 0.9,
            timeout: 30000,
            retryAttempts: 3
          }
        };

      case AIPlatform.GOOGLE_AI:
        return {
          ...baseConfig,
          platformConfig: {
            model: 'gemini-pro',
            maxTokens: 1000,
            temperature: 0.7,
            timeout: 30000,
            retryAttempts: 3
          }
        };

      default:
        return baseConfig;
    }
  }

  /**
   * Get recommended integration pattern for platform and environment
   */
  private getRecommendedPattern(platform: AIPlatform, environment: DeploymentEnvironment): any {
    if (environment === DeploymentEnvironment.CLIENT_SIDE) {
      return 'wrapper';
    }
    
    if (environment === DeploymentEnvironment.SERVER_SIDE) {
      return 'middleware';
    }
    
    if (environment === DeploymentEnvironment.SERVERLESS) {
      return 'webhook';
    }
    
    return 'proxy';
  }
}