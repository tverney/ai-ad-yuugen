/**
 * Signal cache implementation with Redis backend
 * Provides TTL-based expiration and LRU eviction
 */

import { Signal } from '../types/signal-types';
import { CacheStats } from '../types/adcp-types';
import { Logger } from '../utils/logger';

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
}

export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number }): Promise<void>;
  del(key: string | string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  exists(key: string): Promise<number>;
  ttl(key: string): Promise<number>;
  dbsize(): Promise<number>;
}

/**
 * Signal cache with Redis backend
 */
export class SignalCache {
  private hits = 0;
  private misses = 0;
  private evictions = 0;
  private readonly defaultTTL: number;

  constructor(
    private redis: RedisClient,
    private logger: Logger,
    options?: { defaultTTL?: number }
  ) {
    this.defaultTTL = options?.defaultTTL || 300000; // 5 minutes default
    this.logger.info('Signal cache initialized', {
      defaultTTL: this.defaultTTL
    });
  }

  /**
   * Get signals from cache
   */
  async get(key: string): Promise<Signal[] | null> {
    try {
      const value = await this.redis.get(key);
      
      if (value === null) {
        this.misses++;
        this.logger.debug('Cache miss', { key });
        return null;
      }

      this.hits++;
      this.logger.debug('Cache hit', { key });
      
      const signals = JSON.parse(value) as Signal[];
      
      // Convert date strings back to Date objects
      return signals.map(signal => ({
        ...signal,
        createdAt: new Date(signal.createdAt),
        updatedAt: new Date(signal.updatedAt)
      }));
    } catch (error) {
      this.logger.error('Cache get error', { key, error });
      this.misses++;
      return null;
    }
  }

  /**
   * Set signals in cache with TTL
   */
  async set(key: string, signals: Signal[], options?: CacheOptions): Promise<void> {
    try {
      const ttl = options?.ttl || this.defaultTTL;
      const ttlSeconds = Math.floor(ttl / 1000);
      
      const value = JSON.stringify(signals);
      
      await this.redis.set(key, value, { EX: ttlSeconds });
      
      this.logger.debug('Cache set', { key, ttl: ttlSeconds, signalCount: signals.length });
    } catch (error) {
      this.logger.error('Cache set error', { key, error });
      throw error;
    }
  }

  /**
   * Invalidate cache entries matching pattern
   */
  async invalidate(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      
      if (keys.length === 0) {
        this.logger.debug('No keys to invalidate', { pattern });
        return 0;
      }

      const deleted = await this.redis.del(keys);
      this.evictions += deleted;
      
      this.logger.info('Cache invalidated', { pattern, deleted });
      
      return deleted;
    } catch (error) {
      this.logger.error('Cache invalidate error', { pattern, error });
      throw error;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      this.logger.error('Cache exists error', { key, error });
      return false;
    }
  }

  /**
   * Get TTL for a key in seconds
   */
  async getTTL(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      this.logger.error('Cache getTTL error', { key, error });
      return -1;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      const size = await this.redis.dbsize();
      const total = this.hits + this.misses;
      const hitRatio = total > 0 ? this.hits / total : 0;

      return {
        hits: this.hits,
        misses: this.misses,
        hitRatio,
        size,
        evictions: this.evictions
      };
    } catch (error) {
      this.logger.error('Cache getStats error', { error });
      return {
        hits: this.hits,
        misses: this.misses,
        hitRatio: this.hits / (this.hits + this.misses || 1),
        size: 0,
        evictions: this.evictions
      };
    }
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
    this.logger.info('Cache stats reset');
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      const deleted = await this.invalidate('*');
      this.logger.info('Cache cleared', { deleted });
    } catch (error) {
      this.logger.error('Cache clear error', { error });
      throw error;
    }
  }
}
