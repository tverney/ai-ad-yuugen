import { Ad, AdResponse, AdPlacement, AIContext } from '@ai-yuugen/types';
import { sdkLogger } from './logger';

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  maxEntries: number; // Maximum number of entries
  defaultTtl: number; // Default TTL in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
  compressionEnabled: boolean; // Enable compression for large entries
  persistToStorage: boolean; // Persist cache to localStorage
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalSize: number;
  entryCount: number;
  evictions: number;
  compressionRatio: number;
}

/**
 * Preloading strategy configuration
 */
export interface PreloadConfig {
  enabled: boolean;
  maxConcurrentRequests: number;
  preloadThreshold: number; // Preload when cache hit rate drops below this
  contextSimilarityThreshold: number; // Preload ads for similar contexts
  timeBasedPreloading: boolean; // Preload based on time patterns
}

/**
 * Advanced cache manager with preloading and optimization
 */
export class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;
  private preloadConfig: PreloadConfig;
  private stats: CacheStats;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private preloadQueue: Set<string> = new Set();
  private contextHistory: Array<{ context: AIContext; timestamp: number }> = [];

  constructor(config: Partial<CacheConfig> = {}, preloadConfig: Partial<PreloadConfig> = {}) {
    this.config = {
      maxSize: 10 * 1024 * 1024, // 10MB
      maxEntries: 1000,
      defaultTtl: 5 * 60 * 1000, // 5 minutes
      cleanupInterval: 60 * 1000, // 1 minute
      compressionEnabled: true,
      persistToStorage: false,
      ...config
    };

    this.preloadConfig = {
      enabled: true,
      maxConcurrentRequests: 3,
      preloadThreshold: 0.7,
      contextSimilarityThreshold: 0.8,
      timeBasedPreloading: true,
      ...preloadConfig
    };

    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalSize: 0,
      entryCount: 0,
      evictions: 0,
      compressionRatio: 1.0
    };

    this.startCleanupTimer();
    this.loadFromStorage();
  }

  /**
   * Get cached ad response
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      this.updateStats();
      return null;
    }

    // Update access metadata
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    this.stats.hits++;
    this.updateHitRate();

    sdkLogger.debug('Cache hit', { key, accessCount: entry.accessCount });
    
    return this.decompress(entry.data);
  }

  /**
   * Set cache entry with automatic compression and eviction
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const compressed = this.compress(data);
    const size = this.calculateSize(compressed);
    const entryTtl = ttl || this.config.defaultTtl;

    const entry: CacheEntry<T> = {
      data: compressed,
      timestamp: Date.now(),
      ttl: entryTtl,
      accessCount: 0,
      lastAccessed: Date.now(),
      size
    };

    // Check if we need to evict entries
    this.evictIfNecessary(size);

    this.cache.set(key, entry);
    this.updateStats();
    
    sdkLogger.debug('Cache set', { key, size, ttl: entryTtl });

    // Persist to storage if enabled
    if (this.config.persistToStorage) {
      this.persistToStorage();
    }
  }

  /**
   * Cache ad response with intelligent key generation
   */
  cacheAdResponse(placement: AdPlacement, context: AIContext, response: AdResponse): void {
    const key = this.generateCacheKey(placement, context);
    this.set(key, response, response.ttl * 1000);
    
    // Track context for preloading
    this.trackContext(context);
  }

  /**
   * Get cached ad response
   */
  getCachedAdResponse(placement: AdPlacement, context: AIContext): AdResponse | null {
    const key = this.generateCacheKey(placement, context);
    return this.get<AdResponse>(key);
  }

  /**
   * Preload ads based on context patterns and usage
   */
  async preloadAds(
    placement: AdPlacement,
    currentContext: AIContext,
    requestAdFn: (placement: AdPlacement, context: AIContext) => Promise<AdResponse>
  ): Promise<void> {
    if (!this.preloadConfig.enabled) {
      return;
    }

    // Check if preloading is needed based on hit rate
    if (this.stats.hitRate > this.preloadConfig.preloadThreshold) {
      return;
    }

    const preloadContexts = this.generatePreloadContexts(currentContext);
    const preloadPromises: Promise<void>[] = [];

    for (const context of preloadContexts) {
      if (preloadPromises.length >= this.preloadConfig.maxConcurrentRequests) {
        break;
      }

      const key = this.generateCacheKey(placement, context);
      
      // Skip if already cached or in preload queue
      if (this.cache.has(key) || this.preloadQueue.has(key)) {
        continue;
      }

      this.preloadQueue.add(key);
      
      const preloadPromise = this.preloadSingleAd(placement, context, requestAdFn, key);
      preloadPromises.push(preloadPromise);
    }

    if (preloadPromises.length > 0) {
      sdkLogger.info('Preloading ads', { count: preloadPromises.length });
      await Promise.allSettled(preloadPromises);
    }
  }

  /**
   * Preload single ad
   */
  private async preloadSingleAd(
    placement: AdPlacement,
    context: AIContext,
    requestAdFn: (placement: AdPlacement, context: AIContext) => Promise<AdResponse>,
    key: string
  ): Promise<void> {
    try {
      const response = await requestAdFn(placement, context);
      this.set(key, response, response.ttl * 1000);
      sdkLogger.debug('Preloaded ad', { key });
    } catch (error) {
      sdkLogger.warn('Preload failed', { key, error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      this.preloadQueue.delete(key);
    }
  }

  /**
   * Generate cache key from placement and context
   */
  private generateCacheKey(placement: AdPlacement, context: AIContext): string {
    const contextHash = this.hashContext(context);
    return `ad_${placement.id}_${contextHash}`;
  }

  /**
   * Hash context for cache key generation
   */
  private hashContext(context: AIContext): string {
    const contextString = JSON.stringify({
      topics: context.topics?.sort(),
      intent: context.intent,
      sentiment: context.sentiment ? Math.round(context.sentiment * 100) / 100 : null,
      conversationStage: context.conversationStage,
      userEngagement: context.userEngagement
    });
    
    return this.simpleHash(contextString);
  }

  /**
   * Simple hash function for string
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Track context for pattern analysis
   */
  private trackContext(context: AIContext): void {
    this.contextHistory.push({
      context,
      timestamp: Date.now()
    });

    // Keep only recent history (last 100 contexts)
    if (this.contextHistory.length > 100) {
      this.contextHistory = this.contextHistory.slice(-100);
    }
  }

  /**
   * Generate contexts for preloading based on patterns
   */
  private generatePreloadContexts(currentContext: AIContext): AIContext[] {
    const preloadContexts: AIContext[] = [];

    // Generate variations of current context
    if (currentContext.topics) {
      // Similar topics
      const topicVariations = this.generateTopicVariations(currentContext.topics);
      for (const topics of topicVariations) {
        preloadContexts.push({
          ...currentContext,
          topics
        });
      }
    }

    // Generate contexts based on historical patterns
    const historicalContexts = this.getHistoricalSimilarContexts(currentContext);
    preloadContexts.push(...historicalContexts);

    return preloadContexts.slice(0, 5); // Limit to 5 preload contexts
  }

  /**
   * Generate topic variations for preloading
   */
  private generateTopicVariations(topics: string[]): string[][] {
    const variations: string[][] = [];
    
    // Single topic variations
    for (const topic of topics) {
      variations.push([topic]);
    }

    // Subset variations
    if (topics.length > 1) {
      for (let i = 0; i < topics.length; i++) {
        const subset = topics.filter((_, index) => index !== i);
        variations.push(subset);
      }
    }

    return variations;
  }

  /**
   * Get historically similar contexts
   */
  private getHistoricalSimilarContexts(currentContext: AIContext): AIContext[] {
    const similarContexts: AIContext[] = [];
    
    for (const historical of this.contextHistory) {
      const similarity = this.calculateContextSimilarity(currentContext, historical.context);
      if (similarity > this.preloadConfig.contextSimilarityThreshold) {
        similarContexts.push(historical.context);
      }
    }

    return similarContexts.slice(0, 3); // Limit to 3 similar contexts
  }

  /**
   * Calculate similarity between contexts
   */
  private calculateContextSimilarity(context1: AIContext, context2: AIContext): number {
    let similarity = 0;
    let factors = 0;

    // Topic similarity
    if (context1.topics && context2.topics) {
      const intersection = context1.topics.filter(topic => context2.topics!.includes(topic));
      const union = [...new Set([...context1.topics, ...context2.topics])];
      similarity += intersection.length / union.length;
      factors++;
    }

    // Intent similarity
    if (context1.intent && context2.intent) {
      similarity += context1.intent === context2.intent ? 1 : 0;
      factors++;
    }

    // Sentiment similarity
    if (context1.sentiment !== undefined && context2.sentiment !== undefined) {
      const sentimentDiff = Math.abs(context1.sentiment - context2.sentiment);
      similarity += 1 - sentimentDiff;
      factors++;
    }

    // Conversation stage similarity
    if (context1.conversationStage && context2.conversationStage) {
      similarity += context1.conversationStage === context2.conversationStage ? 1 : 0;
      factors++;
    }

    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Compress data if compression is enabled
   */
  private compress<T>(data: T): T {
    if (!this.config.compressionEnabled) {
      return data;
    }

    // Simple compression simulation (in real implementation, use actual compression)
    return data;
  }

  /**
   * Decompress data
   */
  private decompress<T>(data: T): T {
    if (!this.config.compressionEnabled) {
      return data;
    }

    // Simple decompression simulation
    return data;
  }

  /**
   * Calculate size of data in bytes
   */
  private calculateSize(data: any): number {
    return JSON.stringify(data).length * 2; // Rough estimate (UTF-16)
  }

  /**
   * Evict entries if necessary to make room
   */
  private evictIfNecessary(newEntrySize: number): void {
    // Check size limit
    while (this.stats.totalSize + newEntrySize > this.config.maxSize && this.cache.size > 0) {
      this.evictLeastRecentlyUsed();
    }

    // Check entry count limit
    while (this.cache.size >= this.config.maxEntries) {
      this.evictLeastRecentlyUsed();
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      sdkLogger.debug('Evicted cache entry', { key: oldestKey });
    }
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    this.stats.entryCount = this.cache.size;
    this.stats.totalSize = Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.size, 0);
    
    this.updateHitRate();
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
      this.stats.evictions++;
    }

    if (expiredKeys.length > 0) {
      sdkLogger.debug('Cleaned up expired cache entries', { count: expiredKeys.length });
      this.updateStats();
    }
  }

  /**
   * Persist cache to localStorage
   */
  private persistToStorage(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const cacheData = Array.from(this.cache.entries());
      localStorage.setItem('ai-yuugen-cache', JSON.stringify(cacheData));
    } catch (error) {
      sdkLogger.warn('Failed to persist cache to storage', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    if (!this.config.persistToStorage || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const cacheData = localStorage.getItem('ai-yuugen-cache');
      if (cacheData) {
        const entries = JSON.parse(cacheData);
        for (const [key, entry] of entries) {
          // Only load non-expired entries
          if (Date.now() - entry.timestamp < entry.ttl) {
            this.cache.set(key, entry);
          }
        }
        this.updateStats();
        sdkLogger.info('Loaded cache from storage', { entryCount: this.cache.size });
      }
    } catch (error) {
      sdkLogger.warn('Failed to load cache from storage', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalSize: 0,
      entryCount: 0,
      evictions: 0,
      compressionRatio: 1.0
    };
    
    if (this.config.persistToStorage && typeof localStorage !== 'undefined') {
      localStorage.removeItem('ai-yuugen-cache');
    }
    
    sdkLogger.info('Cache cleared');
  }

  /**
   * Destroy cache manager
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.clear();
    this.contextHistory = [];
    this.preloadQueue.clear();
    
    sdkLogger.info('Cache manager destroyed');
  }
}