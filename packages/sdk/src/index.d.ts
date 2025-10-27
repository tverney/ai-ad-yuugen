// TypeScript declarations for AI Ad Yuugen SDK
// This file provides comprehensive type definitions for IDE support

declare module '@ai-yuugen/sdk' {
  // Main SDK class
  export class AIYuugenSDK {
    constructor(errorHandlerConfig?: Partial<ErrorHandlerConfig>);
    
    // Core methods
    initialize(config: SDKConfig): Promise<void>;
    requestAd(placement: AdPlacement, context: AIContext): Promise<Ad>;
    displayAd(ad: Ad, container: HTMLElement): void;
    hideAd(adId: string): void;
    
    // Context analysis
    analyzeContext(conversation: AIConversation): AIContext;
    updateUserContext(context: UserContext): void;
    
    // Privacy management
    setConsentStatus(consent: ConsentStatus): void;
    getPrivacySettings(): PrivacySettings;
    
    // Analytics
    trackEvent(event: AdEvent): void;
    getPerformanceMetrics(): Promise<PerformanceMetrics>;
    
    // Lifecycle
    destroy(): void;
    isInitialized(): boolean;
    getConfig(): SDKConfig | null;
  }

  // Core components
  export class ContextAnalyzer {
    constructor(config?: ContextAnalyzerConfig);
    analyzeConversation(conversation: AIConversation): AIContext;
    extractTopics(text: string): Topic[];
    detectIntent(conversation: AIConversation): UserIntent;
    analyzeSentiment(text: string): SentimentScore;
    detectConversationStage(conversation: AIConversation): ConversationStage;
    calculateEngagement(conversation: AIConversation, userContext?: UserContext): EngagementLevel;
    updateContext(currentContext: AIContext, newMessage: AIMessage): AIContext;
  }

  export class AdManager {
    constructor(config?: AdManagerConfig);
    static fromSDKConfig(config: SDKConfig): AdManager;
    requestAd(placement: AdPlacement, context: AIContext): Promise<Ad>;
    displayAd(ad: Ad, container: HTMLElement): void;
    hideAd(adId: string): void;
    preloadAd(placement: AdPlacement, context: AIContext): Promise<void>;
  }

  export class PrivacyManager {
    constructor(config?: PrivacyManagerConfig);
    setConsentStatus(consent: ConsentStatus): void;
    getConsentStatus(): ConsentStatus | null;
    getPrivacySettings(): PrivacySettings;
    checkCompliance(regulation: PrivacyRegulation): ComplianceStatus;
    handleOptOutRequest(request: OptOutRequest): Promise<void>;
    exportUserData(userId: string): Promise<UserDataExport>;
  }

  export class AnalyticsClient {
    constructor(config?: AnalyticsConfig);
    trackEvent(event: AdEvent): void;
    getPerformanceMetrics(filter?: MetricsFilter): Promise<PerformanceMetrics>;
    getDashboardData(): Promise<DashboardData>;
    generateReport(config: ReportConfig): Promise<AnalyticsReport>;
  }

  // Error handling
  export class ErrorHandler {
    constructor(config?: ErrorHandlerConfig);
    handleNetworkError<T>(operation: () => Promise<T>, context: ErrorContext): Promise<T>;
    handleAdServingError(error: Error, context: ErrorContext, fallback?: () => Promise<Ad>): Promise<Ad>;
    handlePrivacyViolation(violation: PrivacyViolation, context: ErrorContext): void;
    handleSDKError(error: SDKErrorInfo): void;
    destroy(): void;
  }

  export class Logger {
    constructor(config?: LoggerConfig);
    debug(message: string, data?: any): void;
    info(message: string, data?: any): void;
    warn(message: string, data?: any): void;
    error(message: string, data?: any): void;
    setLevel(level: LogLevel): void;
  }

  // Error classes
  export class SDKError extends Error {
    readonly type: SDKErrorType;
    readonly code: string;
    readonly details?: Record<string, any>;
    constructor(type: SDKErrorType, message: string, code: string, details?: Record<string, any>);
  }

  export class NetworkError extends Error {
    readonly code: string;
    readonly severity: ErrorSeverity;
    readonly context: ErrorContext;
    readonly retryable: boolean;
    constructor(message: string, code: string, severity: ErrorSeverity, context: ErrorContext, retryable?: boolean);
  }

  export class PrivacyViolationError extends Error {
    readonly code: string;
    readonly severity: ErrorSeverity;
    readonly context: ErrorContext;
    readonly violation: PrivacyViolation;
    constructor(message: string, code: string, severity: ErrorSeverity, context: ErrorContext, violation: PrivacyViolation);
  }

  export class AdServingError extends Error {
    readonly code: string;
    readonly severity: ErrorSeverity;
    readonly context: ErrorContext;
    readonly retryable: boolean;
    constructor(message: string, code: string, severity: ErrorSeverity, context: ErrorContext, retryable?: boolean);
  }

  export class SDKIntegrationError extends Error {
    readonly code: string;
    readonly severity: ErrorSeverity;
    readonly context: ErrorContext;
    constructor(message: string, code: string, severity: ErrorSeverity, context: ErrorContext, originalError?: Error);
  }

  // Utility functions
  export function createNetworkError(message: string, code: string, context: ErrorContext): NetworkError;
  export function createPrivacyViolationError(message: string, code: string, context: ErrorContext, violation: PrivacyViolation): PrivacyViolationError;
  export function createAdServingError(message: string, code: string, context: ErrorContext): AdServingError;
  export function createSDKIntegrationError(message: string, code: string, context: ErrorContext): SDKIntegrationError;

  // Logger instances
  export const logger: Logger;
  export const sdkLogger: Logger;
  export const adServingLogger: Logger;
  export const privacyLogger: Logger;
  export const analyticsLogger: Logger;
  export const networkLogger: Logger;

  // Configuration constants
  export const DEFAULT_ERROR_HANDLER_CONFIG: ErrorHandlerConfig;
  export const DEFAULT_LOGGER_CONFIG: LoggerConfig;

  // Enums
  export enum SDKErrorType {
    INVALID_CONFIG = 'INVALID_CONFIG',
    AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
    NETWORK_ERROR = 'NETWORK_ERROR',
    INITIALIZATION_TIMEOUT = 'INITIALIZATION_TIMEOUT',
    INVALID_API_KEY = 'INVALID_API_KEY'
  }

  export enum ErrorSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
  }

  export enum ErrorCategory {
    NETWORK = 'network',
    PRIVACY = 'privacy',
    AD_SERVING = 'ad_serving',
    SDK_INTEGRATION = 'sdk_integration',
    CONFIGURATION = 'configuration'
  }

  export enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error'
  }

  // Configuration interfaces
  export interface ErrorHandlerConfig {
    maxRetries: number;
    retryDelay: number;
    exponentialBackoff: boolean;
    maxRetryDelay: number;
    enableLogging: boolean;
    logLevel: LogLevel;
    onNetworkError?: (error: NetworkError, context: ErrorContext) => void;
    onPrivacyViolation?: (violation: PrivacyViolation, context: ErrorContext) => void;
    onAdServingError?: (error: AdServingError, context: ErrorContext) => Promise<Ad | null>;
    onSDKError?: (error: SDKErrorInfo) => void;
  }

  export interface LoggerConfig {
    level: LogLevel;
    enableConsole: boolean;
    enableRemote: boolean;
    remoteEndpoint?: string;
    enableTimestamp: boolean;
    enableStackTrace: boolean;
    maxLogSize: number;
  }

  export interface ContextAnalyzerConfig {
    enableSentimentAnalysis: boolean;
    enableTopicExtraction: boolean;
    enableIntentDetection: boolean;
    enableEngagementTracking: boolean;
    topicExtraction?: TopicExtractionConfig;
    intentDetection?: IntentDetectionConfig;
    sentimentAnalysis?: SentimentAnalysisConfig;
  }

  export interface AdManagerConfig {
    cacheConfig?: CacheConfig;
    preloadEnabled: boolean;
    lazyLoadingEnabled: boolean;
    fallbackConfig?: FallbackConfig;
  }

  export interface PrivacyManagerConfig {
    defaultPrivacyLevel: PrivacyLevel;
    enableAuditLogging: boolean;
    dataRetentionPeriod: number;
    encryptionEnabled: boolean;
    anonymizationLevel: AnonymizationLevel;
  }

  export interface AnalyticsConfig {
    enabled: boolean;
    batchSize: number;
    flushInterval: number;
    enableRealTime: boolean;
    enableCohortAnalysis: boolean;
    enableABTesting: boolean;
    customDimensions?: Record<string, any>;
    eventFilter?: (event: AdEvent) => boolean;
  }

  // Additional configuration interfaces
  export interface TopicExtractionConfig {
    minConfidence: number;
    maxTopics: number;
    enableCategoryMapping: boolean;
    customCategories?: string[];
  }

  export interface IntentDetectionConfig {
    minConfidence: number;
    enableSecondaryIntents: boolean;
    customIntents?: string[];
  }

  export interface SentimentAnalysisConfig {
    enableEmotionDetection: boolean;
    enableSarcasmDetection: boolean;
    language: string;
  }

  export interface CacheConfig {
    enabled: boolean;
    ttl: number;
    maxSize: number;
    strategy: 'lru' | 'fifo' | 'lfu';
  }

  // Error context and info interfaces
  export interface ErrorContext {
    timestamp: Date;
    sessionId?: string;
    userId?: string;
    additionalData?: Record<string, any>;
  }

  export interface SDKErrorInfo {
    message: string;
    code: string;
    severity: ErrorSeverity;
    context: ErrorContext;
    originalError?: Error;
  }

  export interface PrivacyViolation {
    type: string;
    description: string;
    severity: ErrorSeverity;
    regulation: PrivacyRegulation;
    userId?: string;
    timestamp: Date;
  }

  export interface AnalyticsReport {
    id: string;
    type: string;
    generatedAt: Date;
    timeRange: {
      start: Date;
      end: Date;
    };
    data: any;
    metadata: Record<string, any>;
  }

  // Re-export all types from @ai-yuugen/types
  export * from '@ai-yuugen/types';
}

// UI Components module declarations
declare module '@ai-yuugen/ui-components/react' {
  import { ComponentType } from 'react';
  import { AIYuugenSDK, AdPlacement, AIContext, Ad } from '@ai-yuugen/sdk';

  export interface AdComponentProps {
    sdk: AIYuugenSDK;
    placement: AdPlacement;
    context: AIContext;
    className?: string;
    style?: React.CSSProperties;
    onAdLoad?: (ad: Ad) => void;
    onAdClick?: (ad: Ad) => void;
    onAdError?: (error: Error) => void;
  }

  export interface AdBannerProps extends AdComponentProps {}
  export interface AdNativeProps extends AdComponentProps {
    template?: 'article' | 'card' | 'list' | 'custom';
    showBranding?: boolean;
  }
  export interface AdInterstitialProps extends AdComponentProps {
    isOpen: boolean;
    onClose: () => void;
  }
  export interface AdContainerProps extends AdComponentProps {
    renderAd: (ad: Ad | null, isLoading: boolean, error: Error | null) => React.ReactNode;
  }

  export const AdBanner: ComponentType<AdBannerProps>;
  export const AdNative: ComponentType<AdNativeProps>;
  export const AdInterstitial: ComponentType<AdInterstitialProps>;
  export const AdContainer: ComponentType<AdContainerProps>;

  // Hooks
  export function useAd(sdk: AIYuugenSDK): {
    ad: Ad | null;
    isLoading: boolean;
    error: Error | null;
    requestAd: (placement: AdPlacement, context: AIContext) => Promise<void>;
  };

  export function useAnalytics(sdk: AIYuugenSDK): {
    trackEvent: (event: AdEvent) => void;
    getMetrics: () => Promise<PerformanceMetrics>;
  };
}

declare module '@ai-yuugen/ui-components/vue' {
  import { DefineComponent } from 'vue';
  import { AIYuugenSDK, AdPlacement, AIContext, Ad } from '@ai-yuugen/sdk';

  export interface AdComponentProps {
    sdk: AIYuugenSDK;
    placement: AdPlacement;
    context: AIContext;
    class?: string;
    style?: Record<string, any>;
  }

  export const VueAdBanner: DefineComponent<AdComponentProps>;
  export const VueAdNative: DefineComponent<AdComponentProps & {
    template?: 'article' | 'card' | 'list' | 'custom';
    showBranding?: boolean;
  }>;
  export const VueAdInterstitial: DefineComponent<AdComponentProps & {
    isOpen: boolean;
  }>;
}

declare module '@ai-yuugen/ui-components/angular' {
  import { AIYuugenSDK, AdPlacement, AIContext } from '@ai-yuugen/sdk';

  export class NgAdBanner {
    sdk: AIYuugenSDK;
    placement: AdPlacement;
    context: AIContext;
  }

  export class NgAdNative {
    sdk: AIYuugenSDK;
    placement: AdPlacement;
    context: AIContext;
    template: 'article' | 'card' | 'list' | 'custom';
    showBranding: boolean;
  }

  export class NgAdInterstitial {
    sdk: AIYuugenSDK;
    placement: AdPlacement;
    context: AIContext;
    isOpen: boolean;
  }

  export class AIAdYuugenService {
    constructor();
    initialize(config: SDKConfig): Promise<void>;
    getSDK(): AIYuugenSDK;
  }

  export class AIAdYuugenModule {}
}

declare module '@ai-yuugen/ui-components/vanilla' {
  import { AIYuugenSDK, AdPlacement, AIContext, Ad } from '@ai-yuugen/sdk';

  export interface AdWidgetConfig {
    sdk: AIYuugenSDK;
    placement: AdPlacement;
    context: AIContext;
    onAdLoad?: (ad: Ad) => void;
    onAdClick?: (ad: Ad) => void;
    onAdError?: (error: Error) => void;
  }

  export class AdWidget {
    constructor(container: HTMLElement, config: AdWidgetConfig);
    render(): void;
    update(context: AIContext): void;
    destroy(): void;
  }
}