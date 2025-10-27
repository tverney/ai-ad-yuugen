import {
  AIYuugenSDK as IAIYuugenSDK,
  SDKConfig,
  AdPlacement,
  Ad,
  AIContext,
  UserContext,
  ConsentStatus,
  PrivacySettings,
  AdEvent,
  PerformanceMetrics,
  AIConversation,
  AdType,
  AdFormat,
  ADCPConfig,
  SignalPreferences,
  EnhancedAIContext,
  Signal,
  SignalInsight
} from '@ai-yuugen/types';
import { ContextAnalyzer } from './context-analyzer';
import { AdManager } from './ad-manager';
import { 
  ErrorHandler, 
  ErrorHandlerConfig, 
  SDKIntegrationError, 
  NetworkError,
  ErrorSeverity,
  ErrorCategory 
} from './error-handler';
import { sdkLogger } from './logger';

/**
 * SDK initialization error types
 */
export enum SDKErrorType {
  INVALID_CONFIG = 'INVALID_CONFIG',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INITIALIZATION_TIMEOUT = 'INITIALIZATION_TIMEOUT',
  INVALID_API_KEY = 'INVALID_API_KEY'
}

/**
 * Custom SDK error class with detailed error information
 */
export class SDKError extends Error {
  public readonly type: SDKErrorType;
  public readonly code: string;
  public readonly details?: Record<string, any>;

  constructor(
    type: SDKErrorType,
    message: string,
    code: string,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'SDKError';
    this.type = type;
    this.code = code;
    this.details = details;
  }
}

/**
 * Main AI Ad Yuugen SDK implementation
 */
export class AIYuugenSDK implements IAIYuugenSDK {
  private _config: SDKConfig | null = null;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;
  private contextAnalyzer: ContextAnalyzer | null = null;
  private adManager: AdManager | null = null;
  private errorHandler: ErrorHandler;
  private adcpConfig: ADCPConfig | null = null;
  private adcpEnabled = false;

  constructor(errorHandlerConfig?: Partial<ErrorHandlerConfig>) {
    this.errorHandler = new ErrorHandler(errorHandlerConfig);
    sdkLogger.info('AI Ad Yuugen SDK instance created');
  }

  /**
   * Initialize the SDK with configuration
   */
  async initialize(config: SDKConfig): Promise<void> {
    // Prevent multiple simultaneous initializations
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // If already initialized, return immediately
    if (this.initialized) {
      return Promise.resolve();
    }

    this.initializationPromise = this.performInitialization(config);
    
    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }
  }

  /**
   * Perform the actual initialization process
   */
  private async performInitialization(config: SDKConfig): Promise<void> {
    const context = {
      timestamp: new Date(),
      sessionId: this.generateSessionId(),
      additionalData: { environment: config.environment }
    };

    try {
      sdkLogger.info('Starting SDK initialization', { environment: config.environment });
      
      // Step 1: Validate configuration
      this.validateConfig(config);
      sdkLogger.debug('Configuration validated successfully');
      
      // Step 2: Authenticate API key with retry logic
      await this.errorHandler.handleNetworkError(
        () => this.authenticateApiKey(config),
        context
      );
      sdkLogger.debug('API key authenticated successfully');
      
      // Step 3: Set configuration
      this._config = { ...config };
      
      // Step 4: Initialize SDK components
      await this.initializeComponents();
      sdkLogger.debug('SDK components initialized successfully');
      
      // Step 5: Mark as initialized
      this.initialized = true;
      
      sdkLogger.info('SDK initialization completed successfully');
    } catch (error) {
      // Reset state on initialization failure
      this.initialized = false;
      this._config = null;
      
      if (error instanceof NetworkError || error instanceof SDKIntegrationError) {
        throw error;
      }
      
      // Handle unexpected errors through error handler
      const sdkError = new SDKIntegrationError(
        `SDK initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SDK_INIT_FAILED',
        ErrorSeverity.CRITICAL,
        context,
        error as Error
      );
      
      this.errorHandler.handleSDKError({
        message: sdkError.message,
        code: sdkError.code,
        severity: sdkError.severity,
        context: sdkError.context,
        originalError: error as Error
      });
      
      throw sdkError;
    }
  }

  /**
   * Authenticate the API key with the server
   */
  private async authenticateApiKey(config: SDKConfig): Promise<void> {
    const baseUrl = config.baseUrl || this.getDefaultBaseUrl(config.environment);
    const timeout = config.timeout || 5000;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(`${baseUrl}/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          'User-Agent': 'AI-Ad Yuugen-SDK/1.0.0'
        },
        body: JSON.stringify({
          environment: config.environment,
          sdkVersion: '1.0.0'
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new SDKError(
            SDKErrorType.INVALID_API_KEY,
            'Invalid API key provided. Please check your API key and try again.',
            'AUTH_001',
            { status: response.status, ...errorData }
          );
        }
        
        if (response.status === 403) {
          throw new SDKError(
            SDKErrorType.AUTHENTICATION_FAILED,
            'API key does not have sufficient permissions for this environment.',
            'AUTH_002',
            { status: response.status, environment: config.environment, ...errorData }
          );
        }
        
        throw new SDKError(
          SDKErrorType.AUTHENTICATION_FAILED,
          `Authentication failed with status ${response.status}`,
          'AUTH_003',
          { status: response.status, ...errorData }
        );
      }
      
      const authData = await response.json();
      
      if (config.debugMode) {
        console.log('[AI Ad Yuugen SDK] API key authenticated successfully', {
          environment: config.environment,
          permissions: authData.permissions
        });
      }
    } catch (error) {
      if (error instanceof SDKError) {
        throw error;
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new SDKError(
          SDKErrorType.INITIALIZATION_TIMEOUT,
          `Authentication timeout after ${timeout}ms. Please check your network connection.`,
          'AUTH_004',
          { timeout }
        );
      }
      
      throw new SDKError(
        SDKErrorType.NETWORK_ERROR,
        `Network error during authentication: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'AUTH_005',
        { originalError: error }
      );
    }
  }

  /**
   * Initialize SDK components
   */
  private async initializeComponents(): Promise<void> {
    if (!this._config) {
      throw new Error('Configuration is required to initialize components');
    }

    // Initialize ContextAnalyzer
    this.contextAnalyzer = new ContextAnalyzer({
      debugMode: this._config.debugMode || false,
      enableSentimentAnalysis: true,
      enableTopicExtraction: true,
      enableIntentDetection: true,
      enableEngagementTracking: true
    });
    
    // Initialize AdManager
    this.adManager = AdManager.fromSDKConfig(this._config);
    
    // TODO: Initialize other sub-components (will be implemented in later tasks)
    // - PrivacyManager
    // - AnalyticsClient
    
    // For now, just simulate component initialization
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  /**
   * Get default base URL for environment
   */
  private getDefaultBaseUrl(environment: string): string {
    switch (environment) {
      case 'development':
        return 'https://dev-api.ai-yuugen.com';
      case 'staging':
        return 'https://staging-api.ai-yuugen.com';
      case 'production':
        return 'https://api.ai-yuugen.com';
      default:
        return 'https://api.ai-yuugen.com';
    }
  }

  /**
   * Request an ad for a specific placement
   */
  async requestAd(placement: AdPlacement, context: AIContext): Promise<Ad> {
    this.ensureInitialized();
    
    if (!this.adManager) {
      const error = new SDKIntegrationError(
        'Ad manager not initialized',
        'AD_MANAGER_NOT_INITIALIZED',
        ErrorSeverity.HIGH,
        { timestamp: new Date(), sessionId: this.generateSessionId() }
      );
      
      this.errorHandler.handleSDKError({
        message: error.message,
        code: error.code,
        severity: error.severity,
        context: error.context
      });
      
      throw error;
    }
    
    const errorContext = {
      timestamp: new Date(),
      sessionId: this.generateSessionId(),
      additionalData: { placementId: placement.id, contextTopics: context.topics }
    };
    
    try {
      return await this.errorHandler.handleNetworkError(
        () => this.adManager!.requestAd(placement, context),
        errorContext
      );
    } catch (error) {
      // Try fallback ad serving if available
      return await this.errorHandler.handleAdServingError(
        error as Error,
        errorContext,
        () => this.getFallbackAd(placement)
      );
    }
  }

  /**
   * Request an ad with ADCP signal enhancement
   * @param placement Ad placement configuration
   * @param context AI conversation context
   * @param signalPreferences Optional signal preferences for targeting
   * @returns Promise resolving to an Ad with enhanced targeting
   */
  async requestAdWithSignals(
    placement: AdPlacement,
    context: AIContext,
    signalPreferences?: SignalPreferences
  ): Promise<Ad> {
    this.ensureInitialized();
    
    if (!this.adManager) {
      const error = new SDKIntegrationError(
        'Ad manager not initialized',
        'AD_MANAGER_NOT_INITIALIZED',
        ErrorSeverity.HIGH,
        { timestamp: new Date(), sessionId: this.generateSessionId() }
      );
      
      this.errorHandler.handleSDKError({
        message: error.message,
        code: error.code,
        severity: error.severity,
        context: error.context
      });
      
      throw error;
    }

    // If ADCP is not enabled, fall back to standard ad request
    if (!this.isADCPEnabled()) {
      sdkLogger.warn('ADCP not enabled, falling back to standard ad request');
      return this.requestAd(placement, context);
    }

    const errorContext = {
      timestamp: new Date(),
      sessionId: this.generateSessionId(),
      additionalData: {
        placementId: placement.id,
        contextTopics: context.topics,
        adcpEnabled: true,
        signalPreferences
      }
    };

    try {
      // Make enhanced ad request with signal preferences
      const baseUrl = this._config?.baseUrl || this.getDefaultBaseUrl(this._config?.environment || 'production');
      const timeout = this._config?.timeout || 5000;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const requestBody: any = {
        placement,
        context,
        adcpEnabled: true
      };

      // Include signal preferences if provided
      if (signalPreferences) {
        requestBody.signalPreferences = signalPreferences;
      }

      const response = await fetch(`${baseUrl}/ads/request-with-signals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this._config?.apiKey}`,
          'User-Agent': 'AI-Ad Yuugen-SDK/1.0.0'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Enhanced ad request failed: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }

      const responseData = await response.json();
      
      // Extract ad and enhanced context from response
      const ad: Ad = responseData.ad;
      const enhancedContext: EnhancedAIContext | undefined = responseData.enhancedContext;

      // Log enhancement metadata if available
      if (enhancedContext?.enhancementMetadata) {
        sdkLogger.info('Ad served with ADCP enhancement', {
          adId: ad.id,
          signalCount: enhancedContext.enhancementMetadata.signalCount,
          totalCost: enhancedContext.enhancementMetadata.totalCost,
          expectedLift: enhancedContext.enhancementMetadata.expectedLift
        });
      }

      return ad;
    } catch (error) {
      sdkLogger.warn('ADCP-enhanced ad request failed, falling back to standard request', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Fall back to standard ad request on ADCP errors
      return await this.errorHandler.handleAdServingError(
        error as Error,
        errorContext,
        () => this.requestAd(placement, context)
      );
    }
  }

  /**
   * Get available signals for a given context
   * @param context AI conversation context
   * @returns Promise resolving to array of available signals
   */
  async getAvailableSignals(context: AIContext): Promise<Signal[]> {
    this.ensureInitialized();

    // If ADCP is not enabled, return empty array
    if (!this.isADCPEnabled()) {
      sdkLogger.warn('ADCP not enabled, cannot retrieve available signals');
      return [];
    }

    const errorContext = {
      timestamp: new Date(),
      sessionId: this.generateSessionId(),
      additionalData: {
        contextTopics: context.topics,
        adcpEnabled: true
      }
    };

    try {
      const baseUrl = this._config?.baseUrl || this.getDefaultBaseUrl(this._config?.environment || 'production');
      const timeout = this._config?.timeout || 5000;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${baseUrl}/signals/available`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this._config?.apiKey}`,
          'User-Agent': 'AI-Ad Yuugen-SDK/1.0.0'
        },
        body: JSON.stringify({ context }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to retrieve available signals: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }

      const responseData = await response.json();
      const signals: Signal[] = responseData.signals || [];

      sdkLogger.info('Retrieved available signals', {
        signalCount: signals.length
      });

      return signals;
    } catch (error) {
      sdkLogger.error('Failed to retrieve available signals', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Return empty array on error
      return [];
    }
  }

  /**
   * Get signal insights for a served ad
   * @param adId ID of the served ad
   * @returns Promise resolving to array of signal insights
   */
  async getSignalInsights(adId: string): Promise<SignalInsight[]> {
    this.ensureInitialized();

    // If ADCP is not enabled, return empty array
    if (!this.isADCPEnabled()) {
      sdkLogger.warn('ADCP not enabled, cannot retrieve signal insights');
      return [];
    }

    if (!adId || typeof adId !== 'string') {
      throw new Error('Valid ad ID is required to retrieve signal insights');
    }

    const errorContext = {
      timestamp: new Date(),
      sessionId: this.generateSessionId(),
      additionalData: {
        adId,
        adcpEnabled: true
      }
    };

    try {
      const baseUrl = this._config?.baseUrl || this.getDefaultBaseUrl(this._config?.environment || 'production');
      const timeout = this._config?.timeout || 5000;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${baseUrl}/signals/insights/${encodeURIComponent(adId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this._config?.apiKey}`,
          'User-Agent': 'AI-Ad Yuugen-SDK/1.0.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to retrieve signal insights: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }

      const responseData = await response.json();
      const insights: SignalInsight[] = responseData.insights || [];

      sdkLogger.info('Retrieved signal insights', {
        adId,
        insightCount: insights.length
      });

      return insights;
    } catch (error) {
      sdkLogger.error('Failed to retrieve signal insights', {
        adId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Return empty array on error
      return [];
    }
  }

  /**
   * Display an ad in the specified container
   */
  displayAd(_ad: Ad, _container: HTMLElement): void {
    this.ensureInitialized();
    
    // TODO: Implement ad display logic (will be implemented in later tasks)
    throw new Error('Ad display functionality not yet implemented');
  }

  /**
   * Hide a displayed ad
   */
  hideAd(_adId: string): void {
    this.ensureInitialized();
    
    // TODO: Implement ad hiding logic (will be implemented in later tasks)
    throw new Error('Ad hiding functionality not yet implemented');
  }

  /**
   * Analyze AI conversation context
   */
  analyzeContext(conversation: AIConversation): AIContext {
    this.ensureInitialized();
    
    if (!this.contextAnalyzer) {
      throw new Error('Context analyzer not initialized');
    }
    
    return this.contextAnalyzer.analyzeConversation(conversation);
  }

  /**
   * Update user context for targeting
   */
  updateUserContext(_context: UserContext): void {
    this.ensureInitialized();
    
    // TODO: Implement user context updates (will be implemented in later tasks)
    throw new Error('User context update functionality not yet implemented');
  }

  /**
   * Set user consent status
   */
  setConsentStatus(_consent: ConsentStatus): void {
    this.ensureInitialized();
    
    // TODO: Implement consent management (will be implemented in later tasks)
    throw new Error('Consent management functionality not yet implemented');
  }

  /**
   * Get current privacy settings
   */
  getPrivacySettings(): PrivacySettings {
    this.ensureInitialized();
    
    // TODO: Implement privacy settings retrieval (will be implemented in later tasks)
    throw new Error('Privacy settings functionality not yet implemented');
  }

  /**
   * Track an analytics event
   */
  trackEvent(_event: AdEvent): void {
    this.ensureInitialized();
    
    // TODO: Implement event tracking (will be implemented in later tasks)
    throw new Error('Event tracking functionality not yet implemented');
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    this.ensureInitialized();
    
    if (!this.adManager) {
      throw new Error('Ad manager not initialized');
    }

    const adManagerMetrics = this.adManager.getPerformanceMetrics();
    
    // Combine metrics from different components
    const combinedMetrics: PerformanceMetrics = {
      // Timing metrics
      adRequestTime: adManagerMetrics.performanceMetrics?.adRequestTime || 0,
      adRenderTime: adManagerMetrics.performanceMetrics?.adRenderTime || 0,
      totalLoadTime: adManagerMetrics.performanceMetrics?.totalLoadTime || 0,
      cacheHitRate: adManagerMetrics.cacheStats?.hitRate || 0,
      
      // Resource metrics
      memoryUsage: adManagerMetrics.performanceMetrics?.memoryUsage || 0,
      bundleSize: adManagerMetrics.performanceMetrics?.bundleSize || 0,
      networkRequests: adManagerMetrics.performanceMetrics?.networkRequests || 0,
      
      // User experience metrics
      firstContentfulPaint: adManagerMetrics.performanceMetrics?.firstContentfulPaint || 0,
      largestContentfulPaint: adManagerMetrics.performanceMetrics?.largestContentfulPaint || 0,
      cumulativeLayoutShift: adManagerMetrics.performanceMetrics?.cumulativeLayoutShift || 0,
      firstInputDelay: adManagerMetrics.performanceMetrics?.firstInputDelay || 0,
      
      // SDK specific metrics
      initializationTime: adManagerMetrics.performanceMetrics?.initializationTime || 0,
      contextAnalysisTime: adManagerMetrics.performanceMetrics?.contextAnalysisTime || 0,
      targetingTime: adManagerMetrics.performanceMetrics?.targetingTime || 0,
      
      // Error metrics
      errorRate: adManagerMetrics.performanceMetrics?.errorRate || 0,
      timeoutRate: adManagerMetrics.performanceMetrics?.timeoutRate || 0,
      fallbackRate: adManagerMetrics.performanceMetrics?.fallbackRate || 0
    };

    return combinedMetrics;
  }

  /**
   * Apply performance optimizations
   */
  applyPerformanceOptimizations(): void {
    this.ensureInitialized();
    
    if (this.adManager) {
      this.adManager.applyPerformanceOptimizations();
      sdkLogger.info('Performance optimizations applied');
    }
  }

  /**
   * Get performance optimization suggestions
   */
  getPerformanceOptimizations(): Array<{ type: string; suggestion: string; impact: string }> {
    this.ensureInitialized();
    
    if (!this.adManager) {
      return [];
    }

    const metrics = this.adManager.getPerformanceMetrics();
    return metrics.optimizationSuggestions || [];
  }

  /**
   * Enable/disable performance monitoring
   */
  setPerformanceMonitoringEnabled(enabled: boolean): void {
    this.ensureInitialized();
    
    // This would be implemented when performance monitoring is integrated
    sdkLogger.info('Performance monitoring', { enabled });
  }

  /**
   * Enable ADCP (Ad Context Protocol) integration
   * @param config ADCP configuration including MCP settings and authentication
   */
  enableADCP(config: ADCPConfig): void {
    this.ensureInitialized();
    
    try {
      // Validate ADCP configuration
      this.validateADCPConfig(config);
      
      // Store ADCP configuration
      this.adcpConfig = { ...config };
      this.adcpEnabled = true;
      
      sdkLogger.info('ADCP integration enabled', {
        providers: config.auth?.providers?.length || 0,
        cacheEnabled: !!config.cache
      });
    } catch (error) {
      const sdkError = new SDKIntegrationError(
        `Failed to enable ADCP: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ADCP_ENABLE_FAILED',
        ErrorSeverity.HIGH,
        { timestamp: new Date(), sessionId: this.generateSessionId() },
        error as Error
      );
      
      this.errorHandler.handleSDKError({
        message: sdkError.message,
        code: sdkError.code,
        severity: sdkError.severity,
        context: sdkError.context,
        originalError: error as Error
      });
      
      throw sdkError;
    }
  }

  /**
   * Disable ADCP integration
   */
  disableADCP(): void {
    this.ensureInitialized();
    
    this.adcpEnabled = false;
    this.adcpConfig = null;
    
    sdkLogger.info('ADCP integration disabled');
  }

  /**
   * Check if ADCP is enabled
   */
  isADCPEnabled(): boolean {
    return this.adcpEnabled && this.adcpConfig !== null;
  }

  /**
   * Get current ADCP configuration
   */
  getADCPConfig(): ADCPConfig | null {
    return this.adcpConfig;
  }

  /**
   * Validate ADCP configuration
   */
  private validateADCPConfig(config: ADCPConfig): void {
    const errors: string[] = [];

    // Validate MCP configuration
    if (!config.mcp) {
      errors.push('MCP configuration is required');
    } else {
      if (!config.mcp.serverUrl) {
        errors.push('MCP server URL is required');
      } else if (!this.isValidUrl(config.mcp.serverUrl)) {
        errors.push('MCP server URL must be a valid HTTPS URL');
      }
      
      if (config.mcp.timeout !== undefined) {
        if (typeof config.mcp.timeout !== 'number' || config.mcp.timeout < 1000) {
          errors.push('MCP timeout must be at least 1000ms');
        }
      }
      
      if (config.mcp.maxRetries !== undefined) {
        if (typeof config.mcp.maxRetries !== 'number' || config.mcp.maxRetries < 0 || config.mcp.maxRetries > 5) {
          errors.push('MCP maxRetries must be between 0 and 5');
        }
      }
    }

    // Validate authentication configuration
    if (!config.auth) {
      errors.push('Authentication configuration is required');
    } else {
      if (!config.auth.apiKey && !config.auth.providers) {
        errors.push('Either API key or providers must be specified in auth config');
      }
      
      if (config.auth.apiKey && typeof config.auth.apiKey !== 'string') {
        errors.push('API key must be a string');
      }
    }

    // Validate cache configuration (optional)
    if (config.cache) {
      if (config.cache.ttl !== undefined) {
        if (typeof config.cache.ttl !== 'number' || config.cache.ttl < 0) {
          errors.push('Cache TTL must be a non-negative number');
        }
      }
      
      if (config.cache.maxSize !== undefined) {
        if (typeof config.cache.maxSize !== 'number' || config.cache.maxSize < 1) {
          errors.push('Cache maxSize must be at least 1');
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`ADCP configuration validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Clean up SDK resources
   */
  destroy(): void {
    sdkLogger.info('Destroying SDK instance');

    this.initialized = false;
    this._config = null;
    this.initializationPromise = null;
    this.contextAnalyzer = null;
    
    // Clean up ADCP configuration
    this.adcpEnabled = false;
    this.adcpConfig = null;
    
    // Clean up ad manager (includes performance components)
    if (this.adManager) {
      this.adManager.destroy();
      this.adManager = null;
    }
    
    // Clean up error handler
    this.errorHandler.destroy();
    
    // TODO: Clean up other sub-components (will be implemented in later tasks)
    // - PrivacyManager cleanup
    // - AnalyticsClient cleanup
  }

  /**
   * Check if SDK is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get current configuration (for internal use)
   */
  getConfig(): SDKConfig | null {
    return this._config;
  }

  /**
   * Validate SDK configuration with detailed error messages
   */
  private validateConfig(config: SDKConfig): void {
    const errors: string[] = [];

    // Validate API key
    if (!config.apiKey) {
      errors.push('API key is required');
    } else if (typeof config.apiKey !== 'string') {
      errors.push('API key must be a string');
    } else if (config.apiKey.trim().length === 0) {
      errors.push('API key cannot be empty');
    } else if (config.apiKey.length < 10) {
      errors.push('API key appears to be too short (minimum 10 characters)');
    }

    // Validate environment
    if (!config.environment) {
      errors.push('Environment is required');
    } else if (!['development', 'staging', 'production'].includes(config.environment)) {
      errors.push('Environment must be one of: development, staging, production');
    }

    // Validate optional fields
    if (config.timeout !== undefined) {
      if (typeof config.timeout !== 'number') {
        errors.push('Timeout must be a number');
      } else if (config.timeout < 1000) {
        errors.push('Timeout must be at least 1000ms');
      } else if (config.timeout > 30000) {
        errors.push('Timeout cannot exceed 30000ms (30 seconds)');
      }
    }

    if (config.retryAttempts !== undefined) {
      if (typeof config.retryAttempts !== 'number') {
        errors.push('Retry attempts must be a number');
      } else if (config.retryAttempts < 0) {
        errors.push('Retry attempts must be non-negative');
      } else if (config.retryAttempts > 5) {
        errors.push('Retry attempts cannot exceed 5');
      }
    }

    if (config.baseUrl !== undefined) {
      if (typeof config.baseUrl !== 'string') {
        errors.push('Base URL must be a string');
      } else if (!this.isValidUrl(config.baseUrl)) {
        errors.push('Base URL must be a valid HTTPS URL');
      }
    }

    if (config.enableAnalytics !== undefined && typeof config.enableAnalytics !== 'boolean') {
      errors.push('enableAnalytics must be a boolean');
    }

    if (config.enablePrivacyMode !== undefined && typeof config.enablePrivacyMode !== 'boolean') {
      errors.push('enablePrivacyMode must be a boolean');
    }

    if (config.debugMode !== undefined && typeof config.debugMode !== 'boolean') {
      errors.push('debugMode must be a boolean');
    }

    if (errors.length > 0) {
      throw new SDKError(
        SDKErrorType.INVALID_CONFIG,
        `Configuration validation failed: ${errors.join(', ')}`,
        'CONFIG_001',
        { validationErrors: errors, providedConfig: this.sanitizeConfigForLogging(config) }
      );
    }
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Sanitize config for logging (remove sensitive data)
   */
  private sanitizeConfigForLogging(config: SDKConfig): Partial<SDKConfig> {
    const sanitized = { ...config };
    if (sanitized.apiKey) {
      sanitized.apiKey = `${sanitized.apiKey.substring(0, 4)}...${sanitized.apiKey.substring(sanitized.apiKey.length - 4)}`;
    }
    return sanitized;
  }

  /**
   * Ensure SDK is initialized before operations
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      const error = new SDKIntegrationError(
        'SDK must be initialized before use',
        'SDK_NOT_INITIALIZED',
        ErrorSeverity.HIGH,
        { timestamp: new Date() }
      );
      
      this.errorHandler.handleSDKError({
        message: error.message,
        code: error.code,
        severity: error.severity,
        context: error.context
      });
      
      throw error;
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `sdk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get fallback ad when primary ad serving fails
   */
  private async getFallbackAd(placement: AdPlacement): Promise<Ad> {
    sdkLogger.info('Using fallback ad for placement', { placementId: placement.id });
    
    // Return a basic fallback ad
    return {
      id: `fallback_${Date.now()}`,
      type: AdType.BANNER,
      format: placement.format || AdFormat.DISPLAY,
      content: {
        title: 'Advertisement',
        description: 'Sponsored content',
        imageUrl: 'https://via.placeholder.com/300x250?text=Ad',
        ctaText: 'Learn More',
        landingUrl: 'https://example.com',
        brandName: 'Advertiser'
      },
      targeting: {
        topics: [],
        demographics: {},
        interests: []
      },
      performance: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
        cpm: 0,
        revenue: 0,
        engagementScore: 0
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
  }
}