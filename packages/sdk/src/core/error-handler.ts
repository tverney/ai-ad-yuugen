/**
 * Comprehensive error handling system for AI Ad Yuugen SDK
 * Provides error categorization, retry mechanisms, and detailed reporting
 */

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
  PERFORMANCE = 'performance',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication'
}

export interface ErrorContext {
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  url?: string;
  additionalData?: Record<string, any>;
}

export interface AIAdYuugenError extends Error {
  code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  context: ErrorContext;
  retryable: boolean;
  troubleshootingUrl?: string;
  originalError?: Error;
}

export class NetworkError extends Error implements AIAdYuugenError {
  code: string;
  category = ErrorCategory.NETWORK;
  severity: ErrorSeverity;
  context: ErrorContext;
  retryable = true;
  troubleshootingUrl?: string;
  originalError?: Error;

  constructor(
    message: string,
    code: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: ErrorContext,
    originalError?: Error
  ) {
    super(message);
    this.name = 'NetworkError';
    this.code = code;
    this.severity = severity;
    this.context = context;
    this.originalError = originalError;
    this.troubleshootingUrl = `https://docs.ai-yuugen.com/troubleshooting/network/${code}`;
  }
}

export class PrivacyViolationError extends Error implements AIAdYuugenError {
  code: string;
  category = ErrorCategory.PRIVACY;
  severity = ErrorSeverity.CRITICAL;
  context: ErrorContext;
  retryable = false;
  troubleshootingUrl?: string;
  originalError?: Error;

  constructor(
    message: string,
    code: string,
    context: ErrorContext,
    originalError?: Error
  ) {
    super(message);
    this.name = 'PrivacyViolationError';
    this.code = code;
    this.context = context;
    this.originalError = originalError;
    this.troubleshootingUrl = `https://docs.ai-yuugen.com/troubleshooting/privacy/${code}`;
  }
}

export class AdServingError extends Error implements AIAdYuugenError {
  code: string;
  category = ErrorCategory.AD_SERVING;
  severity: ErrorSeverity;
  context: ErrorContext;
  retryable: boolean;
  troubleshootingUrl?: string;
  originalError?: Error;

  constructor(
    message: string,
    code: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: ErrorContext,
    retryable: boolean = true,
    originalError?: Error
  ) {
    super(message);
    this.name = 'AdServingError';
    this.code = code;
    this.severity = severity;
    this.context = context;
    this.retryable = retryable;
    this.originalError = originalError;
    this.troubleshootingUrl = `https://docs.ai-yuugen.com/troubleshooting/ad-serving/${code}`;
  }
}

export class SDKIntegrationError extends Error implements AIAdYuugenError {
  code: string;
  category = ErrorCategory.SDK_INTEGRATION;
  severity: ErrorSeverity;
  context: ErrorContext;
  retryable = false;
  troubleshootingUrl?: string;
  originalError?: Error;

  constructor(
    message: string,
    code: string,
    severity: ErrorSeverity = ErrorSeverity.HIGH,
    context: ErrorContext,
    originalError?: Error
  ) {
    super(message);
    this.name = 'SDKIntegrationError';
    this.code = code;
    this.severity = severity;
    this.context = context;
    this.originalError = originalError;
    this.troubleshootingUrl = `https://docs.ai-yuugen.com/troubleshooting/integration/${code}`;
  }
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

export interface ErrorReportingConfig {
  enableReporting: boolean;
  reportingEndpoint?: string;
  includeStackTrace: boolean;
  includeSensitiveData: boolean;
  batchSize: number;
  flushInterval: number;
}

export interface ErrorHandlerConfig {
  retry: RetryConfig;
  reporting: ErrorReportingConfig;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableConsoleLogging: boolean;
}

export const DEFAULT_ERROR_HANDLER_CONFIG: ErrorHandlerConfig = {
  retry: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true
  },
  reporting: {
    enableReporting: true,
    includeStackTrace: true,
    includeSensitiveData: false,
    batchSize: 10,
    flushInterval: 30000
  },
  logLevel: 'error',
  enableConsoleLogging: true
};

export class ErrorHandler {
  private config: ErrorHandlerConfig;
  private errorQueue: AIAdYuugenError[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...DEFAULT_ERROR_HANDLER_CONFIG, ...config };
    this.startErrorReporting();
  }

  /**
   * Handle network errors with retry logic
   */
  async handleNetworkError<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    customRetryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const retryConfig = { ...this.config.retry, ...customRetryConfig };
    let lastError: Error;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        const networkError = new NetworkError(
          `Network operation failed (attempt ${attempt}/${retryConfig.maxAttempts}): ${error.message}`,
          'NETWORK_OPERATION_FAILED',
          ErrorSeverity.MEDIUM,
          { ...context, attempt },
          error as Error
        );

        this.logError(networkError);

        if (attempt === retryConfig.maxAttempts) {
          networkError.severity = ErrorSeverity.HIGH;
          this.reportError(networkError);
          throw networkError;
        }

        // Calculate delay with exponential backoff and optional jitter
        const delay = this.calculateRetryDelay(attempt, retryConfig);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Handle privacy violations with immediate action
   */
  handlePrivacyViolation(violation: {
    message: string;
    code: string;
    context: ErrorContext;
    originalError?: Error;
  }): void {
    const error = new PrivacyViolationError(
      violation.message,
      violation.code,
      violation.context,
      violation.originalError
    );

    this.logError(error);
    this.reportError(error);

    // Immediate notification for critical privacy violations
    if (typeof window !== 'undefined' && window.console) {
      console.error('CRITICAL PRIVACY VIOLATION:', error.message);
    }

    // Trigger privacy violation callback if configured
    this.triggerPrivacyViolationCallback(error);
  }

  /**
   * Handle ad serving errors with fallback mechanisms
   */
  async handleAdServingError(
    error: Error,
    context: ErrorContext,
    fallbackOperation?: () => Promise<any>
  ): Promise<any> {
    const adServingError = new AdServingError(
      `Ad serving failed: ${error.message}`,
      'AD_SERVING_FAILED',
      ErrorSeverity.MEDIUM,
      context,
      true,
      error
    );

    this.logError(adServingError);

    if (fallbackOperation && adServingError.retryable) {
      try {
        const result = await fallbackOperation();
        this.logInfo('Ad serving fallback successful', context);
        return result;
      } catch (fallbackError) {
        adServingError.severity = ErrorSeverity.HIGH;
        adServingError.retryable = false;
        this.reportError(adServingError);
        throw adServingError;
      }
    }

    this.reportError(adServingError);
    throw adServingError;
  }

  /**
   * Handle SDK integration errors
   */
  handleSDKError(error: {
    message: string;
    code: string;
    severity?: ErrorSeverity;
    context: ErrorContext;
    originalError?: Error;
  }): void {
    const sdkError = new SDKIntegrationError(
      error.message,
      error.code,
      error.severity || ErrorSeverity.HIGH,
      error.context,
      error.originalError
    );

    this.logError(sdkError);
    this.reportError(sdkError);

    // Provide troubleshooting guidance
    this.provideTroubleshootingGuidance(sdkError);
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number, config: RetryConfig): number {
    const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    let delay = Math.min(exponentialDelay, config.maxDelay);

    if (config.jitter) {
      // Add random jitter to prevent thundering herd
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.floor(delay);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log error based on configuration
   */
  private logError(error: AIAdYuugenError): void {
    if (!this.config.enableConsoleLogging) return;

    const logData = {
      timestamp: error.context.timestamp,
      category: error.category,
      severity: error.severity,
      code: error.code,
      message: error.message,
      context: error.context
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        console.error('[AI-Ad Yuugen Error]', logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('[AI-Ad Yuugen Warning]', logData);
        break;
      case ErrorSeverity.LOW:
        console.info('[AI-Ad Yuugen Info]', logData);
        break;
    }
  }

  /**
   * Log informational messages
   */
  private logInfo(message: string, context: ErrorContext): void {
    if (this.config.enableConsoleLogging && this.config.logLevel === 'debug') {
      console.info('[AI-Ad Yuugen Info]', { message, context });
    }
  }

  /**
   * Report error to external service
   */
  private reportError(error: AIAdYuugenError): void {
    if (!this.config.reporting.enableReporting) return;

    this.errorQueue.push(error);

    if (this.errorQueue.length >= this.config.reporting.batchSize) {
      this.flushErrors();
    }
  }

  /**
   * Start error reporting timer
   */
  private startErrorReporting(): void {
    if (this.config.reporting.enableReporting) {
      this.flushTimer = setInterval(() => {
        this.flushErrors();
      }, this.config.reporting.flushInterval);
    }
  }

  /**
   * Flush error queue to reporting endpoint
   */
  private async flushErrors(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const errors = this.errorQueue.splice(0);
    
    try {
      if (this.config.reporting.reportingEndpoint) {
        await this.sendErrorsToEndpoint(errors);
      }
    } catch (reportingError) {
      console.error('Failed to report errors:', reportingError);
      // Re-queue errors for next attempt
      this.errorQueue.unshift(...errors);
    }
  }

  /**
   * Send errors to reporting endpoint
   */
  private async sendErrorsToEndpoint(errors: AIAdYuugenError[]): Promise<void> {
    const payload = errors.map(error => ({
      timestamp: error.context.timestamp,
      category: error.category,
      severity: error.severity,
      code: error.code,
      message: error.message,
      context: this.sanitizeContext(error.context),
      stackTrace: this.config.reporting.includeStackTrace ? error.stack : undefined
    }));

    const response = await fetch(this.config.reporting.reportingEndpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ errors: payload })
    });

    if (!response.ok) {
      throw new Error(`Error reporting failed: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Sanitize context to remove sensitive data
   */
  private sanitizeContext(context: ErrorContext): ErrorContext {
    if (this.config.reporting.includeSensitiveData) {
      return context;
    }

    const sanitized = { ...context };
    delete sanitized.userId;
    delete sanitized.additionalData;
    
    return sanitized;
  }

  /**
   * Provide troubleshooting guidance for SDK errors
   */
  private provideTroubleshootingGuidance(error: SDKIntegrationError): void {
    const guidance = this.getTroubleshootingGuidance(error.code);
    
    if (guidance && this.config.enableConsoleLogging) {
      console.group('🔧 Troubleshooting Guidance');
      console.log('Error Code:', error.code);
      console.log('Description:', guidance.description);
      console.log('Solution:', guidance.solution);
      if (guidance.documentation) {
        console.log('Documentation:', guidance.documentation);
      }
      console.groupEnd();
    }
  }

  /**
   * Get troubleshooting guidance for error codes
   */
  private getTroubleshootingGuidance(code: string): {
    description: string;
    solution: string;
    documentation?: string;
  } | null {
    const guidance: Record<string, any> = {
      'SDK_INIT_FAILED': {
        description: 'SDK initialization failed due to invalid configuration',
        solution: 'Check your API key and configuration parameters. Ensure all required fields are provided.',
        documentation: 'https://docs.ai-yuugen.com/getting-started/initialization'
      },
      'INVALID_API_KEY': {
        description: 'The provided API key is invalid or expired',
        solution: 'Verify your API key in the developer portal and ensure it has the correct permissions.',
        documentation: 'https://docs.ai-yuugen.com/authentication/api-keys'
      },
      'PLACEMENT_NOT_FOUND': {
        description: 'The specified ad placement ID was not found',
        solution: 'Check your placement configuration in the developer portal and ensure the ID is correct.',
        documentation: 'https://docs.ai-yuugen.com/ad-placements/configuration'
      }
    };

    return guidance[code] || null;
  }

  /**
   * Trigger privacy violation callback
   */
  private triggerPrivacyViolationCallback(error: PrivacyViolationError): void {
    // This would trigger any configured privacy violation callbacks
    // Implementation depends on SDK configuration
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushErrors();
  }
}

// Export error factory functions for convenience
export const createNetworkError = (
  message: string,
  code: string,
  context: ErrorContext,
  originalError?: Error
): NetworkError => {
  return new NetworkError(message, code, ErrorSeverity.MEDIUM, context, originalError);
};

export const createPrivacyViolationError = (
  message: string,
  code: string,
  context: ErrorContext,
  originalError?: Error
): PrivacyViolationError => {
  return new PrivacyViolationError(message, code, context, originalError);
};

export const createAdServingError = (
  message: string,
  code: string,
  context: ErrorContext,
  retryable: boolean = true,
  originalError?: Error
): AdServingError => {
  return new AdServingError(message, code, ErrorSeverity.MEDIUM, context, retryable, originalError);
};

export const createSDKIntegrationError = (
  message: string,
  code: string,
  context: ErrorContext,
  originalError?: Error
): SDKIntegrationError => {
  return new SDKIntegrationError(message, code, ErrorSeverity.HIGH, context, originalError);
};