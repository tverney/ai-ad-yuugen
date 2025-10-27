import {
  AdPlacement,
  Ad,
  AIContext,
  AdRequest,
  AdResponse,
  AdRequestBuilder as IAdRequestBuilder,
  UserProfile,
  PrivacySettings,
  DeviceInfo,
  FallbackConfig,
  FallbackStrategy,
  AdRequestError,
  AdRequestErrorType,
  SDKConfig
} from '@ai-yuugen/types';
import { CacheManager, CacheConfig, PreloadConfig } from './cache-manager';
import { PerformanceMonitor, PerformanceThresholds } from './performance-monitor';
import { sdkLogger } from './logger';
import { request } from 'http';

/**
 * Configuration for AdManager
 */
export interface AdManagerConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
  fallbackConfig: FallbackConfig;
  debugMode: boolean;
  cacheConfig?: Partial<CacheConfig>;
  preloadConfig?: Partial<PreloadConfig>;
  performanceThresholds?: Partial<PerformanceThresholds>;
  enablePerformanceOptimization?: boolean;
}

/**
 * Ad Request Builder implementation
 */
export class AdRequestBuilder implements IAdRequestBuilder {
  private placement?: AdPlacement;
  private context?: AIContext;
  private userProfile?: UserProfile;
  private privacySettings?: PrivacySettings;
  private deviceInfo?: DeviceInfo;
  private sessionId?: string;

  setPlacement(placement: AdPlacement): AdRequestBuilder {
    this.placement = placement;
    return this;
  }

  setContext(context: AIContext): AdRequestBuilder {
    this.context = context;
    return this;
  }

  setUserProfile(profile: UserProfile): AdRequestBuilder {
    this.userProfile = profile;
    return this;
  }

  setPrivacySettings(settings: PrivacySettings): AdRequestBuilder {
    this.privacySettings = settings;
    return this;
  }

  setDeviceInfo(info: DeviceInfo): AdRequestBuilder {
    this.deviceInfo = info;
    return this;
  }

  setSessionId(sessionId: string): AdRequestBuilder {
    this.sessionId = sessionId;
    return this;
  }

  build(): AdRequest {
    if (!this.placement) {
      throw new Error('Placement is required for ad request');
    }
    if (!this.context) {
      throw new Error('Context is required for ad request');
    }
    if (!this.privacySettings) {
      throw new Error('Privacy settings are required for ad request');
    }
    if (!this.deviceInfo) {
      throw new Error('Device info is required for ad request');
    }
    if (!this.sessionId) {
      throw new Error('Session ID is required for ad request');
    }

    return {
      placementId: this.placement.id,
      context: this.context,
      userProfile: this.userProfile,
      privacySettings: this.privacySettings,
      deviceInfo: this.deviceInfo,
      sessionId: this.sessionId,
      timestamp: new Date(),
      requestId: this.generateRequestId()
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Ad Response Parser and Validator
 */
export class AdResponseParser {
  /**
   * Parse and validate ad response from server
   */
  static parseResponse(rawResponse: any): AdResponse {
    if (!rawResponse || typeof rawResponse !== 'object') {
      throw new Error('Invalid response format: response must be an object');
    }

    const { requestId, ads, fallbackAds, metadata, timestamp, ttl } = rawResponse;

    // Validate required fields
    if (!requestId || typeof requestId !== 'string') {
      throw new Error('Invalid response: requestId is required and must be a string');
    }

    if (!Array.isArray(ads)) {
      throw new Error('Invalid response: ads must be an array');
    }

    if (!metadata || typeof metadata !== 'object') {
      throw new Error('Invalid response: metadata is required and must be an object');
    }

    if (!timestamp) {
      throw new Error('Invalid response: timestamp is required');
    }

    if (typeof ttl !== 'number' || ttl < 0) {
      throw new Error('Invalid response: ttl must be a non-negative number');
    }

    // Validate ads
    const validatedAds = ads.map((ad: any, index: number) => {
      try {
        return this.validateAd(ad);
      } catch (error) {
        throw new Error(`Invalid ad at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    // Validate fallback ads if present
    let validatedFallbackAds: Ad[] | undefined;
    if (fallbackAds) {
      if (!Array.isArray(fallbackAds)) {
        throw new Error('Invalid response: fallbackAds must be an array');
      }
      validatedFallbackAds = fallbackAds.map((ad: any, index: number) => {
        try {
          return this.validateAd(ad);
        } catch (error) {
          throw new Error(`Invalid fallback ad at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
    }

    // Validate metadata
    const validatedMetadata = this.validateMetadata(metadata);

    return {
      requestId,
      ads: validatedAds,
      fallbackAds: validatedFallbackAds,
      metadata: validatedMetadata,
      timestamp: new Date(timestamp),
      ttl
    };
  }

  /**
   * Validate individual ad object
   */
  private static validateAd(ad: any): Ad {
    if (!ad || typeof ad !== 'object') {
      throw new Error('Ad must be an object');
    }

    const { id, type, format, content, createdAt, expiresAt } = ad;

    if (!id || typeof id !== 'string') {
      throw new Error('Ad id is required and must be a string');
    }

    if (!type || typeof type !== 'string') {
      throw new Error('Ad type is required and must be a string');
    }

    if (!format || typeof format !== 'string') {
      throw new Error('Ad format is required and must be a string');
    }

    if (!content || typeof content !== 'object') {
      throw new Error('Ad content is required and must be an object');
    }

    // Validate content
    const validatedContent = this.validateAdContent(content);

    return {
      id,
      type: type as any,
      format: format as any,
      content: validatedContent,
      createdAt: new Date(createdAt),
      expiresAt: new Date(expiresAt)
    };
  }

  /**
   * Validate ad content
   */
  private static validateAdContent(content: any): any {
    const { title, description, ctaText, landingUrl, brandName } = content;

    if (!title || typeof title !== 'string') {
      throw new Error('Ad content title is required and must be a string');
    }

    if (!description || typeof description !== 'string') {
      throw new Error('Ad content description is required and must be a string');
    }

    if (!ctaText || typeof ctaText !== 'string') {
      throw new Error('Ad content ctaText is required and must be a string');
    }

    if (!landingUrl || typeof landingUrl !== 'string') {
      throw new Error('Ad content landingUrl is required and must be a string');
    }

    if (!brandName || typeof brandName !== 'string') {
      throw new Error('Ad content brandName is required and must be a string');
    }

    // Validate URL format
    try {
      new URL(landingUrl);
    } catch {
      throw new Error('Ad content landingUrl must be a valid URL');
    }

    return content;
  }

  /**
   * Validate response metadata
   */
  private static validateMetadata(metadata: any): any {
    const { processingTime, targetingScore } = metadata;

    if (typeof processingTime !== 'number' || processingTime < 0) {
      throw new Error('Metadata processingTime must be a non-negative number');
    }

    if (typeof targetingScore !== 'number' || targetingScore < 0 || targetingScore > 1) {
      throw new Error('Metadata targetingScore must be a number between 0 and 1');
    }

    return metadata;
  }
}

/**
 * Ad manager for handling ad requests and responses
 */
export class AdManager {
  private config: AdManagerConfig;
  private cache: Map<string, { response: AdResponse; timestamp: number }> = new Map();
  private cacheManager: CacheManager | null = null;
  private performanceMonitor: PerformanceMonitor | null = null;

  constructor(config: AdManagerConfig) {
    this.config = config;
    
    // Initialize performance optimization components
    if (config.enablePerformanceOptimization !== false) {
      this.initializePerformanceOptimization();
    }
  }

  /**
   * Create a new ad request builder
   */
  createRequestBuilder(): AdRequestBuilder {
    return new AdRequestBuilder();
  }

  /**
   * Request an ad with context and privacy data
   */
  async requestAd(placement: AdPlacement, context: AIContext, userProfile?: UserProfile, privacySettings?: PrivacySettings): Promise<Ad> {
    // Start performance measurement
    this.performanceMonitor?.startMeasurement('ad-request', {
      placementId: placement.id,
      contextTopics: context.topics?.length || 0
    });

    try {
      // Check cache first
      if (this.cacheManager) {
        const cachedResponse = this.cacheManager.getCachedAdResponse(placement, context);
        if (cachedResponse && cachedResponse.ads.length > 0) {
          this.performanceMonitor?.endMeasurement('ad-request');
          this.performanceMonitor?.recordMetric('cacheHitRate', 1);
          sdkLogger.debug('Serving ad from cache', { placementId: placement.id });
          return cachedResponse.ads[0];
        }
        this.performanceMonitor?.recordMetric('cacheHitRate', 0);
      }

      const deviceInfo = this.getDeviceInfo();
      const sessionId = this.generateSessionId();
      
      // Use default privacy settings if not provided
      const finalPrivacySettings = privacySettings || this.getDefaultPrivacySettings();

      const builder = this.createRequestBuilder()
        .setPlacement(placement)
        .setContext(context)
        .setPrivacySettings(finalPrivacySettings)
        .setDeviceInfo(deviceInfo)
        .setSessionId(sessionId);

      if (userProfile) {
        builder.setUserProfile(userProfile);
      }

      const request = builder.build();

      const response = await this.makeAdRequest(request);
      
      if (response.ads.length === 0) {
        return this.handleFallback(request, new Error('No ads available'));
      }

      // Cache the response
      this.cacheResponse(request.requestId, response);
      
      // Cache with advanced cache manager
      if (this.cacheManager) {
        this.cacheManager.cacheAdResponse(placement, context, response);
        
        // Trigger preloading for similar contexts
        this.cacheManager.preloadAds(placement, context, async (p, c) => {
          const req = this.createRequestBuilder()
            .setPlacement(p)
            .setContext(c)
            .setPrivacySettings(finalPrivacySettings)
            .setDeviceInfo(deviceInfo)
            .setSessionId(this.generateSessionId())
            .build();
          return await this.makeAdRequest(req);
        }).catch(error => {
          sdkLogger.warn('Preloading failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        });
      }

      this.performanceMonitor?.endMeasurement('ad-request');
      return response.ads[0];
    } catch (error) {
      this.performanceMonitor?.endMeasurement('ad-request');
      
      if (this.config.debugMode) {
        console.error('[AdManager] Ad request failed:', error);
      }
      
      return this.handleFallback(request, error as Error);
    }
  }

  /**
   * Make HTTP request to ad server
   */
  private async makeAdRequest(request: AdRequest): Promise<AdResponse> {
    const url = `${this.config.baseUrl}/ads/request`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'User-Agent': 'AI-Ad Yuugen-SDK/1.0.0'
        },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const adError = this.createAdRequestError(response.status, errorData);
        const error = new Error(adError.message);
        (error as any).adRequestError = adError;
        throw error;
      }

      const rawResponse = await response.json();
      return AdResponseParser.parseResponse(rawResponse);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        const adError = this.createAdRequestError(408, { message: 'Request timeout' });
        const timeoutError = new Error(adError.message);
        (timeoutError as any).adRequestError = adError;
        throw timeoutError;
      }
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        const adError = this.createAdRequestError(0, { message: 'Network error' });
        const networkError = new Error(adError.message);
        (networkError as any).adRequestError = adError;
        throw networkError;
      }
      
      throw error;
    }
  }

  /**
   * Handle fallback scenarios for failed ad requests
   */
  private async handleFallback(request: AdRequest, error: Error): Promise<Ad> {
    const { fallbackConfig } = this.config;
    
    if (!fallbackConfig.enabled) {
      throw error;
    }

    if (this.config.debugMode) {
      console.log('[AdManager] Handling fallback for error:', error.message);
    }

    // Try retry logic first (but only for retryable errors)
    if (this.isRetryableError(error) && fallbackConfig.maxRetries > 0) {
      try {
        return await this.retryAdRequest(request, error, fallbackConfig.maxRetries);
      } catch (retryError) {
        if (this.config.debugMode) {
          console.log('[AdManager] Retry failed, falling back to strategy:', fallbackConfig.fallbackStrategy);
        }
        // If retry fails, continue to fallback strategy
      }
    }

    // Apply fallback strategy
    switch (fallbackConfig.fallbackStrategy) {
      case FallbackStrategy.CACHED_ADS:
        return this.getCachedAd(request);
      
      case FallbackStrategy.DEFAULT_ADS:
        return this.getDefaultAd(request);
      
      case FallbackStrategy.NO_ADS:
        throw new Error('No ads available and fallback disabled');
      
      case FallbackStrategy.RETRY_ONLY:
        throw error;
      
      default:
        throw error;
    }
  }

  /**
   * Retry ad request with exponential backoff
   */
  private async retryAdRequest(request: AdRequest, originalError: Error, retriesLeft: number): Promise<Ad> {
    if (retriesLeft <= 0) {
      throw originalError;
    }

    const delay = this.config.fallbackConfig.retryDelay * Math.pow(2, this.config.fallbackConfig.maxRetries - retriesLeft);
    
    if (this.config.debugMode) {
      console.log(`[AdManager] Retrying ad request in ${delay}ms (${retriesLeft} retries left)`);
    }

    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      const response = await this.makeAdRequest(request);
      
      if (response.ads.length === 0) {
        throw new Error('No ads available');
      }

      this.cacheResponse(request.requestId, response);
      return response.ads[0];
    } catch (error) {
      // Only retry if the error is retryable and we have retries left
      if (this.isRetryableError(error as Error) && retriesLeft > 1) {
        return this.retryAdRequest(request, originalError, retriesLeft - 1);
      } else {
        throw originalError;
      }
    }
  }

  /**
   * Get cached ad if available
   */
  private getCachedAd(request: AdRequest): Ad {
    // Look for cached responses
    for (const [, cached] of this.cache) {
      const age = Date.now() - cached.timestamp;
      if (age < cached.response.ttl * 1000 && cached.response.ads.length > 0) {
        if (this.config.debugMode) {
          console.log('[AdManager] Using cached ad:', cached.response.ads[0].id);
        }
        return cached.response.ads[0];
      }
    }

    if (this.config.debugMode) {
      console.log('[AdManager] No valid cached ads found, using default fallback');
    }

    // If no cached ads, try default ads
    return this.getDefaultAd(request);
  }

  /**
   * Get default fallback ad
   */
  private getDefaultAd(_request: AdRequest): Ad {
    const { fallbackAds } = this.config.fallbackConfig;
    
    if (fallbackAds.length === 0) {
      throw new Error('No fallback ads configured');
    }

    // Return a random fallback ad
    const randomIndex = Math.floor(Math.random() * fallbackAds.length);
    return fallbackAds[randomIndex];
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    if (error.message.includes('timeout') || error.message.includes('Network error')) {
      return true;
    }
    
    // Check for specific error types that are retryable
    const retryableMessages = [
      'server error',
      'service unavailable',
      'rate limited',
      'temporary failure'
    ];
    
    return retryableMessages.some(msg => 
      error.message.toLowerCase().includes(msg)
    );
  }

  /**
   * Create standardized ad request error
   */
  private createAdRequestError(status: number, errorData: any): AdRequestError {
    let type: AdRequestErrorType;
    let retryable = false;
    let retryAfter: number | undefined;

    switch (status) {
      case 0:
        type = AdRequestErrorType.NETWORK_ERROR;
        retryable = true;
        break;
      case 400:
        type = AdRequestErrorType.INVALID_REQUEST;
        break;
      case 401:
        type = AdRequestErrorType.AUTHENTICATION_ERROR;
        break;
      case 408:
        type = AdRequestErrorType.TIMEOUT;
        retryable = true;
        break;
      case 429:
        type = AdRequestErrorType.RATE_LIMITED;
        retryable = true;
        retryAfter = errorData.retryAfter || 60;
        break;
      case 403:
        type = AdRequestErrorType.PRIVACY_VIOLATION;
        break;
      case 404:
        type = AdRequestErrorType.NO_ADS_AVAILABLE;
        break;
      default:
        type = AdRequestErrorType.SERVER_ERROR;
        retryable = status >= 500;
    }

    const error: AdRequestError = {
      type,
      message: errorData.message || `Request failed with status ${status}`,
      code: errorData.code || `HTTP_${status}`,
      retryable,
      details: errorData
    };

    if (retryAfter) {
      error.retryAfter = retryAfter;
    }

    return error;
  }

  /**
   * Cache ad response
   */
  private cacheResponse(requestId: string, response: AdResponse): void {
    this.cache.set(requestId, {
      response,
      timestamp: Date.now()
    });

    // Clean up old cache entries (keep last 100)
    if (this.cache.size > 100) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove oldest 20 entries
      for (let i = 0; i < 20; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }

  /**
   * Get device information
   */
  private getDeviceInfo(): DeviceInfo {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
    const screenWidth = typeof screen !== 'undefined' ? screen.width : 1920;
    const screenHeight = typeof screen !== 'undefined' ? screen.height : 1080;
    const language = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
    
    return {
      userAgent,
      screenWidth,
      screenHeight,
      deviceType: this.detectDeviceType(userAgent, screenWidth),
      platform: this.detectPlatform(userAgent),
      language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  /**
   * Detect device type from user agent and screen size
   */
  private detectDeviceType(userAgent: string, screenWidth: number): any {
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return screenWidth < 768 ? 'mobile' : 'tablet';
    }
    return 'desktop';
  }

  /**
   * Detect platform from user agent
   */
  private detectPlatform(userAgent: string): string {
    if (/Windows/.test(userAgent)) return 'Windows';
    if (/Mac/.test(userAgent)) return 'macOS';
    if (/Linux/.test(userAgent)) return 'Linux';
    if (/Android/.test(userAgent)) return 'Android';
    if (/iPhone|iPad/.test(userAgent)) return 'iOS';
    return 'Unknown';
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get default privacy settings
   */
  private getDefaultPrivacySettings(): PrivacySettings {
    return {
      consentStatus: {
        advertising: false,
        analytics: false,
        personalization: false,
        dataSharing: false,
        timestamp: new Date(),
        jurisdiction: 'US',
        version: '1.0',
        consentMethod: 'explicit' as any
      },
      dataRetentionPeriod: 30,
      privacyLevel: 'standard' as any,
      dataProcessingBasis: 'consent' as any,
      optOutRequests: [],
      complianceFlags: [],
      encryptionEnabled: true,
      anonymizationLevel: 'pseudonymization' as any
    };
  }

  /**
   * Display an ad in the specified container
   */
  displayAd(_ad: Ad, _container: HTMLElement): void {
    // TODO: Implement ad display logic (will be implemented in later tasks)
    throw new Error('Ad display functionality not yet implemented');
  }

  /**
   * Hide a displayed ad
   */
  hideAd(_adId: string): void {
    // TODO: Implement ad hiding logic (will be implemented in later tasks)
    throw new Error('Ad hiding functionality not yet implemented');
  }

  /**
   * Initialize performance optimization components
   */
  private initializePerformanceOptimization(): void {
    // Initialize cache manager
    this.cacheManager = new CacheManager(
      this.config.cacheConfig,
      this.config.preloadConfig
    );

    // Initialize performance monitor
    this.performanceMonitor = new PerformanceMonitor(
      this.config.performanceThresholds
    );

    sdkLogger.info('Performance optimization initialized', {
      cacheEnabled: !!this.cacheManager,
      performanceMonitorEnabled: !!this.performanceMonitor
    });
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      cacheStats: this.cacheManager?.getStats(),
      performanceMetrics: this.performanceMonitor?.getMetrics(),
      optimizationSuggestions: this.performanceMonitor?.getOptimizationSuggestions()
    };
  }

  /**
   * Apply automatic performance optimizations
   */
  applyPerformanceOptimizations(): void {
    if (this.performanceMonitor) {
      this.performanceMonitor.applyAutomaticOptimizations();
    }
  }

  /**
   * Destroy ad manager and cleanup resources
   */
  destroy(): void {
    if (this.cacheManager) {
      this.cacheManager.destroy();
      this.cacheManager = null;
    }

    if (this.performanceMonitor) {
      this.performanceMonitor.destroy();
      this.performanceMonitor = null;
    }

    this.cache.clear();
    sdkLogger.info('AdManager destroyed');
  }

  /**
   * Create AdManager from SDK config
   */
  static fromSDKConfig(sdkConfig: SDKConfig): AdManager {
    const baseUrl = sdkConfig.baseUrl || 'https://api.ai-yuugen.com';
    
    const config: AdManagerConfig = {
      baseUrl,
      apiKey: sdkConfig.apiKey,
      timeout: sdkConfig.timeout || 5000,
      retryAttempts: sdkConfig.retryAttempts || 3,
      fallbackConfig: {
        enabled: true,
        maxRetries: sdkConfig.retryAttempts || 3,
        retryDelay: 1000,
        fallbackAds: [],
        fallbackStrategy: FallbackStrategy.DEFAULT_ADS
      },
      debugMode: sdkConfig.debugMode || false,
      enablePerformanceOptimization: true,
      cacheConfig: {
        maxSize: 10 * 1024 * 1024, // 10MB
        maxEntries: 1000,
        defaultTtl: 5 * 60 * 1000, // 5 minutes
        compressionEnabled: true,
        persistToStorage: true
      },
      preloadConfig: {
        enabled: true,
        maxConcurrentRequests: 3,
        preloadThreshold: 0.7,
        contextSimilarityThreshold: 0.8
      },
      performanceThresholds: {
        adRequestTime: 2000,
        adRenderTime: 500,
        memoryUsage: 50,
        errorRate: 0.05,
        cacheHitRate: 0.7
      }
    };

    return new AdManager(config);
  }
}