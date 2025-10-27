/**
 * Tests for signal cache
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SignalCache, RedisClient } from './signal-cache';
import { Signal, SignalProvider, SignalCategory } from '../types/signal-types';
import { createLogger } from '../utils/logger';

// Mock Redis client
class MockRedisClient implements RedisClient {
  private store = new Map<string, { value: string; expiry?: number }>();
  private currentTime = Date.now();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    
    if (!entry) {
      return null;
    }
    
    if (entry.expiry && entry.expiry < this.currentTime) {
      this.store.delete(key);
      return null;
    }
    
    return entry.value;
  }

  async set(key: string, value: string, options?: { EX?: number }): Promise<void> {
    const expiry = options?.EX ? this.currentTime + options.EX * 1000 : undefined;
    this.store.set(key, { value, expiry });
  }

  async del(key: string | string[]): Promise<number> {
    const keys = Array.isArray(key) ? key : [key];
    let deleted = 0;
    
    for (const k of keys) {
      if (this.store.delete(k)) {
        deleted++;
      }
    }
    
    return deleted;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(this.store.keys()).filter(key => regex.test(key));
  }

  async exists(key: string): Promise<number> {
    return this.store.has(key) ? 1 : 0;
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    
    if (!entry) {
      return -2;
    }
    
    if (!entry.expiry) {
      return -1;
    }
    
    const remaining = Math.floor((entry.expiry - this.currentTime) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async dbsize(): Promise<number> {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  advanceTime(ms: number): void {
    this.currentTime += ms;
  }
}

describe('SignalCache', () => {
  let cache: SignalCache;
  let redis: MockRedisClient;
  let logger: ReturnType<typeof createLogger>;

  const createMockSignal = (id: string): Signal => ({
    id,
    name: `Signal ${id}`,
    description: 'Test signal',
    provider: SignalProvider.SCOPE3,
    category: SignalCategory.BEHAVIORAL,
    cpm: 5.0,
    reach: 10000,
    confidence: 0.9,
    metadata: {},
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  });

  beforeEach(() => {
    redis = new MockRedisClient();
    logger = createLogger({ prefix: 'test' });
    cache = new SignalCache(redis, logger, { defaultTTL: 300000 });
  });

  describe('get/set operations', () => {
    it('should set and get signals', async () => {
      const signals = [createMockSignal('1'), createMockSignal('2')];
      
      await cache.set('test-key', signals);
      const result = await cache.get('test-key');
      
      expect(result).toHaveLength(2);
      expect(result![0].id).toBe('1');
      expect(result![1].id).toBe('2');
    });

    it('should return null for non-existent key', async () => {
      const result = await cache.get('non-existent');
      
      expect(result).toBeNull();
    });

    it('should preserve signal data types', async () => {
      const signals = [createMockSignal('1')];
      
      await cache.set('test-key', signals);
      const result = await cache.get('test-key');
      
      expect(result![0].createdAt).toBeInstanceOf(Date);
      expect(result![0].updatedAt).toBeInstanceOf(Date);
    });

    it('should use custom TTL when provided', async () => {
      const signals = [createMockSignal('1')];
      
      await cache.set('test-key', signals, { ttl: 60000 });
      
      const ttl = await cache.getTTL('test-key');
      expect(ttl).toBe(60);
    });
  });

  describe('TTL expiration', () => {
    it('should expire entries after TTL', async () => {
      const signals = [createMockSignal('1')];
      
      await cache.set('test-key', signals, { ttl: 1000 });
      
      // Advance time past TTL
      redis.advanceTime(2000);
      
      const result = await cache.get('test-key');
      expect(result).toBeNull();
    });

    it('should return valid entries before TTL expires', async () => {
      const signals = [createMockSignal('1')];
      
      await cache.set('test-key', signals, { ttl: 5000 });
      
      // Advance time but not past TTL
      redis.advanceTime(2000);
      
      const result = await cache.get('test-key');
      expect(result).not.toBeNull();
    });
  });

  describe('invalidate', () => {
    it('should invalidate matching keys', async () => {
      await cache.set('adcp:signals:1', [createMockSignal('1')]);
      await cache.set('adcp:signals:2', [createMockSignal('2')]);
      await cache.set('other:key', [createMockSignal('3')]);
      
      const deleted = await cache.invalidate('adcp:signals:*');
      
      expect(deleted).toBe(2);
      expect(await cache.get('adcp:signals:1')).toBeNull();
      expect(await cache.get('adcp:signals:2')).toBeNull();
      expect(await cache.get('other:key')).not.toBeNull();
    });

    it('should return 0 when no keys match', async () => {
      const deleted = await cache.invalidate('non-existent:*');
      
      expect(deleted).toBe(0);
    });
  });

  describe('exists', () => {
    it('should return true for existing key', async () => {
      await cache.set('test-key', [createMockSignal('1')]);
      
      const exists = await cache.exists('test-key');
      
      expect(exists).toBe(true);
    });

    it('should return false for non-existent key', async () => {
      const exists = await cache.exists('non-existent');
      
      expect(exists).toBe(false);
    });
  });

  describe('statistics', () => {
    it('should track cache hits', async () => {
      await cache.set('test-key', [createMockSignal('1')]);
      
      await cache.get('test-key');
      await cache.get('test-key');
      
      const stats = await cache.getStats();
      
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(0);
      expect(stats.hitRatio).toBe(1);
    });

    it('should track cache misses', async () => {
      await cache.get('non-existent-1');
      await cache.get('non-existent-2');
      
      const stats = await cache.getStats();
      
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(2);
      expect(stats.hitRatio).toBe(0);
    });

    it('should calculate hit ratio correctly', async () => {
      await cache.set('test-key', [createMockSignal('1')]);
      
      await cache.get('test-key'); // hit
      await cache.get('non-existent'); // miss
      await cache.get('test-key'); // hit
      
      const stats = await cache.getStats();
      
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRatio).toBeCloseTo(0.667, 2);
    });

    it('should track evictions', async () => {
      await cache.set('key-1', [createMockSignal('1')]);
      await cache.set('key-2', [createMockSignal('2')]);
      
      await cache.invalidate('key-*');
      
      const stats = await cache.getStats();
      
      expect(stats.evictions).toBe(2);
    });

    it('should reset statistics', async () => {
      await cache.set('test-key', [createMockSignal('1')]);
      await cache.get('test-key');
      
      cache.resetStats();
      
      const stats = await cache.getStats();
      
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.evictions).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', async () => {
      await cache.set('key-1', [createMockSignal('1')]);
      await cache.set('key-2', [createMockSignal('2')]);
      
      await cache.clear();
      
      const stats = await cache.getStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle get errors gracefully', async () => {
      const errorRedis = {
        ...redis,
        get: vi.fn().mockRejectedValue(new Error('Redis error'))
      } as unknown as RedisClient;
      
      const errorCache = new SignalCache(errorRedis, logger);
      
      const result = await errorCache.get('test-key');
      
      expect(result).toBeNull();
    });

    it('should propagate set errors', async () => {
      const errorRedis = {
        ...redis,
        set: vi.fn().mockRejectedValue(new Error('Redis error'))
      } as unknown as RedisClient;
      
      const errorCache = new SignalCache(errorRedis, logger);
      
      await expect(
        errorCache.set('test-key', [createMockSignal('1')])
      ).rejects.toThrow('Redis error');
    });
  });
});
