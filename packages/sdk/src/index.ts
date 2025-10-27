// Main SDK exports
export { AIYuugenSDK, SDKError, SDKErrorType } from './core/sdk';
export { ContextAnalyzer } from './core/context-analyzer';
export { AdManager } from './core/ad-manager';
export { PrivacyManager } from './core/privacy-manager';
export { AnalyticsClient } from './core/analytics-client';

// Performance optimization exports
export { CacheManager } from './core/cache-manager';
export { PerformanceMonitor } from './core/performance-monitor';
export { LazyLoader, VirtualScroller } from './core/lazy-loader';
export { default as PerformanceBenchmark } from './core/performance-benchmark';

// Error handling exports
export {
  ErrorHandler,
  ErrorSeverity,
  ErrorCategory,
  NetworkError,
  PrivacyViolationError,
  AdServingError,
  SDKIntegrationError,
  createNetworkError,
  createPrivacyViolationError,
  createAdServingError,
  createSDKIntegrationError,
  DEFAULT_ERROR_HANDLER_CONFIG
} from './core/error-handler';

// Logging exports
export {
  Logger,
  LogLevel,
  logger,
  sdkLogger,
  adServingLogger,
  privacyLogger,
  analyticsLogger,
  networkLogger,
  DEFAULT_LOGGER_CONFIG
} from './core/logger';

// Multi-platform adapters
export * from './adapters';

// Re-export all types
export * from '@ai-yuugen/types';