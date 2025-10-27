import { describe, it, expect, beforeEach, afterEach, vi, expect } from 'vitest';
import { AIAdapterFactory } from '../adapter-factory';
import { AdapterTestUtils } from './test-utils';
import {
  AIPlatform,
  DeploymentEnvironment,
  AdapterError,
  AdapterErrorType
} from '../types';
import { OpenAIAdapter } from '../openai-adapter';
import { AnthropicAdapter } from '../anthropic-adapter';
import { GoogleAIAdapter } from '../google-ai-adapter';

// Mock the adapters
vi.mock('../openai-adapter');
vi.mock('../anthropic-adapter');
vi.mock('../google-ai-adapter');

describe('AIAdapterFactory', () => {
  let factory: AIAdapterFactory;
  let consoleSpy: any;

  beforeEach(() => {
    factory = AIAdapterFactory.getInstance();
    consoleSpy = AdapterTestUtils.createConsoleSpy();
    
    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.restore();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const factory1 = AIAdapterFactory.getInstance();
      const factory2 = AIAdapterFactory.getInstance();
      
      expect(factory1).toBe(factory2);
    });
  });

  describe('Adapter Creation', () => {
    it('should create OpenAI adapter', () => {
      const config = AdapterTestUtils.createMockOpenAIConfig();
      
      const adapter = factory.createAdapter(config);
      
      expect(OpenAIAdapter).toHaveBeenCalledWith(DeploymentEnvironment.CLIENT_SIDE);
      expect(adapter).toBeDefined();
    });

    it('should create Anthropic adapter', () => {
      const config = AdapterTestUtils.createMockAnthropicConfig();
      
      const adapter = factory.createAdapter(config);
      
      expect(AnthropicAdapter).toHaveBeenCalledWith(DeploymentEnvironment.CLIENT_SIDE);
      expect(adapter).toBeDefined();
    });

    it('should create Google AI adapter', () => {
      const config = AdapterTestUtils.createMockGoogleAIConfig();
      
      const adapter = factory.createAdapter(config);
      
      expect(GoogleAIAdapter).toHaveBeenCalledWith(DeploymentEnvironment.CLIENT_SIDE);
      expect(adapter).toBeDefined();
    });

    it('should throw error for unsupported platform', () => {
      const config = {
        ...AdapterTestUtils.createMockOpenAIConfig(),
        platform: 'unsupported' as AIPlatform
      };
      
      expect(() => factory.createAdapter(config)).toThrow(AdapterError);
      expect(() => factory.createAdapter(config)).toThrow('Unsupported AI platform');
    });
  });

  describe('Platform Support', () => {
    it('should return supported platforms', () => {
      const platforms = factory.getSupportedPlatforms();
      
      expect(platforms).toContain(AIPlatform.OPENAI);
      expect(platforms).toContain(AIPlatform.ANTHROPIC);
      expect(platforms).toContain(AIPlatform.GOOGLE_AI);
      expect(platforms).toHaveLength(3);
    });

    it('should return supported environments', () => {
      const environments = factory.getSupportedEnvironments();
      
      expect(environments).toContain(DeploymentEnvironment.CLIENT_SIDE);
      expect(environments).toContain(DeploymentEnvironment.SERVER_SIDE);
      expect(environments).toContain(DeploymentEnvironment.EDGE);
      expect(environments).toContain(DeploymentEnvironment.SERVERLESS);
      expect(environments).toHaveLength(4);
    });

    it('should check if platform is supported', () => {
      expect(factory.isPlatformSupported(AIPlatform.OPENAI)).toBe(true);
      expect(factory.isPlatformSupported(AIPlatform.ANTHROPIC)).toBe(true);
      expect(factory.isPlatformSupported(AIPlatform.GOOGLE_AI)).toBe(true);
      expect(factory.isPlatformSupported('unsupported' as AIPlatform)).toBe(false);
    });

    it('should check if environment is supported', () => {
      expect(factory.isEnvironmentSupported(DeploymentEnvironment.CLIENT_SIDE)).toBe(true);
      expect(factory.isEnvironmentSupported(DeploymentEnvironment.SERVER_SIDE)).toBe(true);
      expect(factory.isEnvironmentSupported('unsupported' as DeploymentEnvironment)).toBe(false);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate valid configuration', () => {
      const config = AdapterTestUtils.createMockOpenAIConfig();
      
      expect(() => factory.createAdapter(config)).not.toThrow();
    });

    it('should throw error for missing platform', () => {
      const config = {
        ...AdapterTestUtils.createMockOpenAIConfig(),
        platform: undefined as any
      };
      
      expect(() => factory.createAdapter(config)).toThrow(AdapterError);
      expect(() => factory.createAdapter(config)).toThrow('Platform is required');
    });

    it('should throw error for missing environment', () => {
      const config = {
        ...AdapterTestUtils.createMockOpenAIConfig(),
        environment: undefined as any
      };
      
      expect(() => factory.createAdapter(config)).toThrow(AdapterError);
      expect(() => factory.createAdapter(config)).toThrow('Environment is required');
    });

    it('should throw error for missing Ad Yuugen configuration', () => {
      const config = {
        ...AdapterTestUtils.createMockOpenAIConfig(),
        adSenseConfig: undefined as any
      };
      
      expect(() => factory.createAdapter(config)).toThrow(AdapterError);
      expect(() => factory.createAdapter(config)).toThrow('Ad Yuugen configuration is required');
    });

    it('should throw error for missing Ad Yuugen API key', () => {
      const config = {
        ...AdapterTestUtils.createMockOpenAIConfig(),
        adSenseConfig: {
          ...AdapterTestUtils.createMockOpenAIConfig().adSenseConfig,
          apiKey: ''
        }
      };
      
      expect(() => factory.createAdapter(config)).toThrow(AdapterError);
      expect(() => factory.createAdapter(config)).toThrow('Ad Yuugen API key is required');
    });

    it('should throw error for missing placement IDs', () => {
      const config = {
        ...AdapterTestUtils.createMockOpenAIConfig(),
        adSenseConfig: {
          ...AdapterTestUtils.createMockOpenAIConfig().adSenseConfig,
          placementIds: []
        }
      };
      
      expect(() => factory.createAdapter(config)).toThrow(AdapterError);
      expect(() => factory.createAdapter(config)).toThrow('At least one placement ID is required');
    });

    it('should throw error for missing platform configuration', () => {
      const config = {
        ...AdapterTestUtils.createMockOpenAIConfig(),
        platformConfig: undefined as any
      };
      
      expect(() => factory.createAdapter(config)).toThrow(AdapterError);
      expect(() => factory.createAdapter(config)).toThrow('Platform configuration is required');
    });

    it('should validate OpenAI API key format', () => {
      const config = {
        ...AdapterTestUtils.createMockOpenAIConfig(),
        platformConfig: {
          ...AdapterTestUtils.createMockOpenAIConfig().platformConfig,
          apiKey: 'invalid-format'
        }
      };
      
      expect(() => factory.createAdapter(config)).toThrow(AdapterError);
      expect(() => factory.createAdapter(config)).toThrow('apiKey must match format: sk-*');
    });

    it('should validate Anthropic API key format', () => {
      const config = {
        ...AdapterTestUtils.createMockAnthropicConfig(),
        platformConfig: {
          ...AdapterTestUtils.createMockAnthropicConfig().platformConfig,
          apiKey: 'invalid-format'
        }
      };
      
      expect(() => factory.createAdapter(config)).toThrow(AdapterError);
      expect(() => factory.createAdapter(config)).toThrow('apiKey must match format: sk-ant-*');
    });
  });

  describe('Platform Requirements', () => {
    it('should return OpenAI platform requirements', () => {
      const requirements = factory.getPlatformRequirements(AIPlatform.OPENAI);
      
      expect(requirements.apiKey).toBeDefined();
      expect(requirements.apiKey.required).toBe(true);
      expect(requirements.apiKey.format).toBe('sk-*');
      expect(requirements.model).toBeDefined();
      expect(requirements.model.default).toBe('gpt-3.5-turbo');
    });

    it('should return Anthropic platform requirements', () => {
      const requirements = factory.getPlatformRequirements(AIPlatform.ANTHROPIC);
      
      expect(requirements.apiKey).toBeDefined();
      expect(requirements.apiKey.required).toBe(true);
      expect(requirements.apiKey.format).toBe('sk-ant-*');
      expect(requirements.model).toBeDefined();
      expect(requirements.model.default).toBe('claude-3-sonnet-20240229');
    });

    it('should return Google AI platform requirements', () => {
      const requirements = factory.getPlatformRequirements(AIPlatform.GOOGLE_AI);
      
      expect(requirements.apiKey).toBeDefined();
      expect(requirements.apiKey.required).toBe(true);
      expect(requirements.model).toBeDefined();
      expect(requirements.model.default).toBe('gemini-pro');
      expect(requirements.projectId).toBeDefined();
    });

    it('should return empty requirements for unknown platform', () => {
      const requirements = factory.getPlatformRequirements('unknown' as AIPlatform);
      
      expect(requirements).toEqual({});
    });
  });

  describe('Multi-Platform Adapters', () => {
    it('should create multiple adapters', () => {
      const configs = [
        AdapterTestUtils.createMockOpenAIConfig(),
        AdapterTestUtils.createMockAnthropicConfig(),
        AdapterTestUtils.createMockGoogleAIConfig()
      ];
      
      const adapters = factory.createMultiPlatformAdapters(configs);
      
      expect(adapters.size).toBe(3);
      expect(adapters.has(AIPlatform.OPENAI)).toBe(true);
      expect(adapters.has(AIPlatform.ANTHROPIC)).toBe(true);
      expect(adapters.has(AIPlatform.GOOGLE_AI)).toBe(true);
    });

    it('should continue creating adapters even if one fails', () => {
      const configs = [
        AdapterTestUtils.createMockOpenAIConfig(),
        {
          ...AdapterTestUtils.createMockAnthropicConfig(),
          platformConfig: { apiKey: '' } // Invalid config
        },
        AdapterTestUtils.createMockGoogleAIConfig()
      ];
      
      const adapters = factory.createMultiPlatformAdapters(configs);
      
      // Should create 2 out of 3 adapters
      expect(adapters.size).toBe(2);
      expect(adapters.has(AIPlatform.OPENAI)).toBe(true);
      expect(adapters.has(AIPlatform.ANTHROPIC)).toBe(false);
      expect(adapters.has(AIPlatform.GOOGLE_AI)).toBe(true);
    });
  });

  describe('Auto-Detection', () => {
    it('should detect OpenAI platform from API key', () => {
      const config = {
        environment: DeploymentEnvironment.CLIENT_SIDE,
        pattern: 'wrapper' as any,
        adSenseConfig: AdapterTestUtils.createMockOpenAIConfig().adSenseConfig,
        platformConfig: { apiKey: 'sk-test123' }
      };
      
      const adapter = factory.createAdapterWithAutoDetection(config);
      
      expect(OpenAIAdapter).toHaveBeenCalled();
    });

    it('should detect Anthropic platform from API key', () => {
      const config = {
        environment: DeploymentEnvironment.CLIENT_SIDE,
        pattern: 'wrapper' as any,
        adSenseConfig: AdapterTestUtils.createMockAnthropicConfig().adSenseConfig,
        platformConfig: { apiKey: 'sk-ant-test123' }
      };
      
      const adapter = factory.createAdapterWithAutoDetection(config);
      
      expect(AnthropicAdapter).toHaveBeenCalled();
    });

    it('should detect Google AI platform from project ID', () => {
      const config = {
        environment: DeploymentEnvironment.CLIENT_SIDE,
        pattern: 'wrapper' as any,
        adSenseConfig: AdapterTestUtils.createMockGoogleAIConfig().adSenseConfig,
        platformConfig: { apiKey: 'test123', projectId: 'my-project' }
      };
      
      const adapter = factory.createAdapterWithAutoDetection(config);
      
      expect(GoogleAIAdapter).toHaveBeenCalled();
    });

    it('should default to OpenAI if detection fails', () => {
      const config = {
        environment: DeploymentEnvironment.CLIENT_SIDE,
        pattern: 'wrapper' as any,
        adSenseConfig: AdapterTestUtils.createMockOpenAIConfig().adSenseConfig,
        platformConfig: { apiKey: 'unknown-format' }
      };
      
      const adapter = factory.createAdapterWithAutoDetection(config);
      
      expect(OpenAIAdapter).toHaveBeenCalled();
    });
  });

  describe('Compatibility Matrix', () => {
    it('should return compatibility matrix', () => {
      const matrix = factory.getCompatibilityMatrix();
      
      expect(matrix[AIPlatform.OPENAI]).toContain(DeploymentEnvironment.CLIENT_SIDE);
      expect(matrix[AIPlatform.OPENAI]).toContain(DeploymentEnvironment.SERVER_SIDE);
      expect(matrix[AIPlatform.ANTHROPIC]).toContain(DeploymentEnvironment.CLIENT_SIDE);
      expect(matrix[AIPlatform.GOOGLE_AI]).toContain(DeploymentEnvironment.SERVERLESS);
    });

    it('should check compatibility', () => {
      expect(factory.isCompatible(AIPlatform.OPENAI, DeploymentEnvironment.CLIENT_SIDE)).toBe(true);
      expect(factory.isCompatible(AIPlatform.ANTHROPIC, DeploymentEnvironment.EDGE)).toBe(false);
      expect(factory.isCompatible(AIPlatform.GOOGLE_AI, DeploymentEnvironment.SERVERLESS)).toBe(true);
    });
  });

  describe('Recommended Configuration', () => {
    it('should return recommended OpenAI configuration', () => {
      const config = factory.getRecommendedConfig(AIPlatform.OPENAI, DeploymentEnvironment.CLIENT_SIDE);
      
      expect(config.platform).toBe(AIPlatform.OPENAI);
      expect(config.environment).toBe(DeploymentEnvironment.CLIENT_SIDE);
      expect(config.platformConfig?.model).toBe('gpt-3.5-turbo');
      expect(config.adSenseConfig?.enableContextAnalysis).toBe(true);
    });

    it('should return recommended Anthropic configuration', () => {
      const config = factory.getRecommendedConfig(AIPlatform.ANTHROPIC, DeploymentEnvironment.SERVER_SIDE);
      
      expect(config.platform).toBe(AIPlatform.ANTHROPIC);
      expect(config.environment).toBe(DeploymentEnvironment.SERVER_SIDE);
      expect(config.platformConfig?.model).toBe('claude-3-sonnet-20240229');
      expect(config.adSenseConfig?.enablePrivacyMode).toBe(true);
    });

    it('should return recommended Google AI configuration', () => {
      const config = factory.getRecommendedConfig(AIPlatform.GOOGLE_AI, DeploymentEnvironment.SERVERLESS);
      
      expect(config.platform).toBe(AIPlatform.GOOGLE_AI);
      expect(config.environment).toBe(DeploymentEnvironment.SERVERLESS);
      expect(config.platformConfig?.model).toBe('gemini-pro');
      expect(config.adSenseConfig?.enableAnalytics).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle adapter creation errors', () => {
      // Mock adapter constructor to throw error
      (OpenAIAdapter as any).mockImplementation(() => {
        throw new Error('Adapter creation failed');
      });

      const config = AdapterTestUtils.createMockOpenAIConfig();
      
      expect(() => factory.createAdapter(config)).toThrow(AdapterError);
      expect(() => factory.createAdapter(config)).toThrow('Failed to create adapter');
    });

    it('should preserve AdapterError instances', () => {
      const originalError = new AdapterError(
        AdapterErrorType.INITIALIZATION_FAILED,
        AIPlatform.OPENAI,
        'Original error',
        'TEST_001'
      );

      (OpenAIAdapter as any).mockImplementation(() => {
        throw originalError;
      });

      const config = AdapterTestUtils.createMockOpenAIConfig();
      
      expect(() => factory.createAdapter(config)).toThrow(originalError);
    });
  });
});