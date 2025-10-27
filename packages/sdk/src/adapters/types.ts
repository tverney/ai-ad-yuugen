import { AIConversation, AIMessage, AIContext, UserContext } from '@ai-yuugen/types';

/**
 * Base configuration for AI platform adapters
 */
export interface AIAdapterConfig {
  apiKey: string;
  environment: 'development' | 'staging' | 'production';
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  debugMode?: boolean;
}

/**
 * Platform-specific configuration extensions
 */
export interface OpenAIAdapterConfig extends AIAdapterConfig {
  model?: string;
  organization?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AnthropicAdapterConfig extends AIAdapterConfig {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

export interface GoogleAIAdapterConfig extends AIAdapterConfig {
  model?: string;
  projectId?: string;
  location?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Deployment environment types
 */
export enum DeploymentEnvironment {
  CLIENT_SIDE = 'client_side',
  SERVER_SIDE = 'server_side',
  EDGE = 'edge',
  SERVERLESS = 'serverless'
}

/**
 * Integration pattern types
 */
export enum IntegrationPattern {
  MIDDLEWARE = 'middleware',
  PLUGIN = 'plugin',
  WRAPPER = 'wrapper',
  PROXY = 'proxy',
  WEBHOOK = 'webhook'
}

/**
 * AI platform types
 */
export enum AIPlatform {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE_AI = 'google_ai',
  CUSTOM = 'custom'
}

/**
 * Adapter integration configuration
 */
export interface AdapterIntegrationConfig {
  platform: AIPlatform;
  environment: DeploymentEnvironment;
  pattern: IntegrationPattern;
  adSenseConfig: {
    apiKey: string;
    placementIds: string[];
    enableContextAnalysis: boolean;
    enablePrivacyMode: boolean;
    enableAnalytics: boolean;
  };
  platformConfig: AIAdapterConfig;
}

/**
 * Message transformation interface
 */
export interface MessageTransformer {
  transformToStandard(platformMessage: any): AIMessage;
  transformFromStandard(standardMessage: AIMessage): any;
}

/**
 * Context extraction interface
 */
export interface ContextExtractor {
  extractContext(conversation: any): AIContext;
  extractUserContext(session: any): UserContext;
}

/**
 * Base AI adapter interface
 */
export interface AIAdapter {
  readonly platform: AIPlatform;
  readonly environment: DeploymentEnvironment;
  
  // Initialization
  initialize(config: AdapterIntegrationConfig): Promise<void>;
  
  // Message handling
  interceptMessage(message: any): Promise<any>;
  processResponse(response: any, context: AIContext): Promise<any>;
  
  // Context extraction
  extractConversationContext(conversation: any): AIContext;
  extractUserContext(session: any): UserContext;
  
  // Ad integration
  injectAd(response: any, ad: any): any;
  shouldShowAd(context: AIContext): boolean;
  
  // Lifecycle
  destroy(): void;
}

/**
 * Adapter factory interface
 */
export interface AdapterFactory {
  createAdapter(config: AdapterIntegrationConfig): AIAdapter;
  getSupportedPlatforms(): AIPlatform[];
  getSupportedEnvironments(): DeploymentEnvironment[];
}

/**
 * Platform-specific message formats
 */
export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GoogleAIMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

/**
 * Platform-specific conversation formats
 */
export interface OpenAIConversation {
  messages: OpenAIMessage[];
  model: string;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface AnthropicConversation {
  model: string;
  messages: AnthropicMessage[];
  max_tokens: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
}

export interface GoogleAIConversation {
  contents: GoogleAIMessage[];
  generationConfig?: {
    maxOutputTokens?: number;
    temperature?: number;
    topP?: number;
  };
}

/**
 * Platform-specific response formats
 */
export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: OpenAIMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{ type: string; text: string }>;
  model: string;
  stop_reason: string;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface GoogleAIResponse {
  candidates: Array<{
    content: GoogleAIMessage;
    finishReason: string;
    index: number;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

/**
 * Adapter error types
 */
export enum AdapterErrorType {
  INITIALIZATION_FAILED = 'initialization_failed',
  PLATFORM_ERROR = 'platform_error',
  TRANSFORMATION_ERROR = 'transformation_error',
  CONTEXT_EXTRACTION_ERROR = 'context_extraction_error',
  AD_INJECTION_ERROR = 'ad_injection_error',
  NETWORK_ERROR = 'network_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  RATE_LIMIT_ERROR = 'rate_limit_error'
}

export class AdapterError extends Error {
  public readonly type: AdapterErrorType;
  public readonly platform: AIPlatform;
  public readonly code: string;
  public readonly details?: Record<string, any>;

  constructor(
    type: AdapterErrorType,
    platform: AIPlatform,
    message: string,
    code: string,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AdapterError';
    this.type = type;
    this.platform = platform;
    this.code = code;
    this.details = details;
  }
}