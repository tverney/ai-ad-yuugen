/**
 * Tests for cache strategy and key generation
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeQuery,
  hashQuery,
  generateCacheKey,
  generateInvalidationPattern,
  parseCacheKey,
  CacheStrategy
} from './cache-strategy';
import { SignalQuery, SignalProvider, SignalCategory } from '../types/signal-types';

describe('normalizeQuery', () => {
  it('should normalize text to lowercase and trim', () => {
    const query: SignalQuery = {
      text: '  Test Query  '
    };
    
    const normalized = normalizeQuery(query);
    
    expect(normalized.text).toBe('test query');
  });

  it('should sort categories array', () => {
    const query: SignalQuery = {
      categories: [SignalCategory.GEOGRAPHIC, SignalCategory.BEHAVIORAL, SignalCategory.DEMOGRAPHIC]
    };
    
    const normalized = normalizeQuery(query);
    
    expect(normalized.categories).toEqual([
      SignalCategory.BEHAVIORAL,
      SignalCategory.DEMOGRAPHIC,
      SignalCategory.GEOGRAPHIC
    ]);
  });

  it('should sort providers array', () => {
    const query: SignalQuery = {
      providers: [SignalProvider.SCOPE3, SignalProvider.LIVERAMP, SignalProvider.NIELSEN]
    };
    
    const normalized = normalizeQuery(query);
    
    expect(normalized.providers).toEqual([
      SignalProvider.LIVERAMP,
      SignalProvider.NIELSEN,
      SignalProvider.SCOPE3
    ]);
  });

  it('should normalize geography arrays', () => {
    const query: SignalQuery = {
      geography: {
        countries: ['US', 'CA', 'MX'],
        cities: ['NYC', 'LA', 'SF']
      }
    };
    
    const normalized = normalizeQuery(query);
    
    expect(normalized.geography?.countries).toEqual(['CA', 'MX', 'US']);
    expect(normalized.geography?.cities).toEqual(['LA', 'NYC', 'SF']);
  });

  it('should preserve numeric values', () => {
    const query: SignalQuery = {
      minReach: 1000,
      maxReach: 10000,
      priceRange: { min: 1.0, max: 5.0 },
      limit: 50
    };
    
    const normalized = normalizeQuery(query);
    
    expect(normalized.minReach).toBe(1000);
    expect(normalized.maxReach).toBe(10000);
    expect(normalized.priceRange).toEqual({ min: 1.0, max: 5.0 });
    expect(normalized.limit).toBe(50);
  });

  it('should handle empty query', () => {
    const query: SignalQuery = {};
    
    const normalized = normalizeQuery(query);
    
    expect(normalized).toEqual({});
  });
});

describe('hashQuery', () => {
  it('should generate consistent hash for same query', () => {
    const query: SignalQuery = {
      text: 'test',
      categories: [SignalCategory.BEHAVIORAL]
    };
    
    const hash1 = hashQuery(query);
    const hash2 = hashQuery(query);
    
    expect(hash1).toBe(hash2);
  });

  it('should generate same hash for equivalent queries with different order', () => {
    const query1: SignalQuery = {
      categories: [SignalCategory.BEHAVIORAL, SignalCategory.DEMOGRAPHIC],
      providers: [SignalProvider.SCOPE3, SignalProvider.LIVERAMP]
    };
    
    const query2: SignalQuery = {
      providers: [SignalProvider.LIVERAMP, SignalProvider.SCOPE3],
      categories: [SignalCategory.DEMOGRAPHIC, SignalCategory.BEHAVIORAL]
    };
    
    const hash1 = hashQuery(query1);
    const hash2 = hashQuery(query2);
    
    expect(hash1).toBe(hash2);
  });

  it('should generate different hash for different queries', () => {
    const query1: SignalQuery = {
      text: 'test1'
    };
    
    const query2: SignalQuery = {
      text: 'test2'
    };
    
    const hash1 = hashQuery(query1);
    const hash2 = hashQuery(query2);
    
    expect(hash1).not.toBe(hash2);
  });

  it('should normalize before hashing', () => {
    const query1: SignalQuery = {
      text: '  TEST  '
    };
    
    const query2: SignalQuery = {
      text: 'test'
    };
    
    const hash1 = hashQuery(query1);
    const hash2 = hashQuery(query2);
    
    expect(hash1).toBe(hash2);
  });
});

describe('generateCacheKey', () => {
  it('should generate key with default prefix', () => {
    const query: SignalQuery = {
      text: 'test'
    };
    
    const key = generateCacheKey(query);
    
    expect(key).toMatch(/^adcp:signals:[a-f0-9]{64}$/);
  });

  it('should generate key with custom prefix', () => {
    const query: SignalQuery = {
      text: 'test'
    };
    
    const key = generateCacheKey(query, 'custom:prefix');
    
    expect(key).toMatch(/^custom:prefix:[a-f0-9]{64}$/);
  });

  it('should generate consistent keys for same query', () => {
    const query: SignalQuery = {
      text: 'test',
      categories: [SignalCategory.BEHAVIORAL]
    };
    
    const key1 = generateCacheKey(query);
    const key2 = generateCacheKey(query);
    
    expect(key1).toBe(key2);
  });
});

describe('generateInvalidationPattern', () => {
  it('should generate pattern for all signals', () => {
    const pattern = generateInvalidationPattern({});
    
    expect(pattern).toBe('adcp:signals:*');
  });

  it('should generate pattern for specific provider', () => {
    const pattern = generateInvalidationPattern({
      provider: 'scope3'
    });
    
    expect(pattern).toBe('adcp:signals:*:scope3:*');
  });

  it('should generate pattern for specific category', () => {
    const pattern = generateInvalidationPattern({
      category: 'behavioral'
    });
    
    expect(pattern).toBe('adcp:signals:*:*:behavioral:*');
  });

  it('should generate pattern for provider and category', () => {
    const pattern = generateInvalidationPattern({
      provider: 'scope3',
      category: 'behavioral'
    });
    
    expect(pattern).toBe('adcp:signals:*:scope3:behavioral:*');
  });

  it('should use custom prefix', () => {
    const pattern = generateInvalidationPattern({
      prefix: 'custom:prefix'
    });
    
    expect(pattern).toBe('custom:prefix:*');
  });
});

describe('parseCacheKey', () => {
  it('should parse valid cache key', () => {
    const key = 'adcp:signals:abc123def456';
    
    const parsed = parseCacheKey(key);
    
    expect(parsed).toEqual({
      prefix: 'adcp:signals',
      hash: 'abc123def456'
    });
  });

  it('should return null for invalid key', () => {
    const key = 'invalid';
    
    const parsed = parseCacheKey(key);
    
    expect(parsed).toBeNull();
  });

  it('should handle keys with multiple colons', () => {
    const key = 'adcp:signals:hash:with:colons';
    
    const parsed = parseCacheKey(key);
    
    expect(parsed).toEqual({
      prefix: 'adcp:signals',
      hash: 'hash:with:colons'
    });
  });
});

describe('CacheStrategy', () => {
  let strategy: CacheStrategy;

  beforeEach(() => {
    strategy = new CacheStrategy({
      ttl: 300000,
      maxSize: 1000
    });
  });

  describe('getTTL', () => {
    it('should return configured TTL', () => {
      const query: SignalQuery = {
        text: 'test'
      };
      
      const ttl = strategy.getTTL(query);
      
      expect(ttl).toBe(300000);
    });
  });

  describe('shouldCache', () => {
    it('should cache normal queries', () => {
      const query: SignalQuery = {
        text: 'test',
        categories: [SignalCategory.BEHAVIORAL]
      };
      
      expect(strategy.shouldCache(query)).toBe(true);
    });

    it('should not cache queries with too many postal codes', () => {
      const query: SignalQuery = {
        geography: {
          postalCodes: Array(150).fill('12345')
        }
      };
      
      expect(strategy.shouldCache(query)).toBe(false);
    });

    it('should not cache queries with very low limits', () => {
      const query: SignalQuery = {
        limit: 3
      };
      
      expect(strategy.shouldCache(query)).toBe(false);
    });

    it('should cache queries with acceptable limits', () => {
      const query: SignalQuery = {
        limit: 10
      };
      
      expect(strategy.shouldCache(query)).toBe(true);
    });
  });

  describe('getPriority', () => {
    it('should give higher priority to broader queries', () => {
      const broadQuery: SignalQuery = {
        categories: [SignalCategory.BEHAVIORAL]
      };
      
      const narrowQuery: SignalQuery = {
        categories: [SignalCategory.BEHAVIORAL],
        geography: {
          countries: ['US'],
          cities: ['NYC']
        }
      };
      
      const broadPriority = strategy.getPriority(broadQuery);
      const narrowPriority = strategy.getPriority(narrowQuery);
      
      expect(broadPriority).toBeGreaterThan(narrowPriority);
    });

    it('should give higher priority to queries without price constraints', () => {
      const noPriceQuery: SignalQuery = {
        categories: [SignalCategory.BEHAVIORAL]
      };
      
      const priceQuery: SignalQuery = {
        categories: [SignalCategory.BEHAVIORAL],
        priceRange: { min: 1.0, max: 5.0 }
      };
      
      const noPricePriority = strategy.getPriority(noPriceQuery);
      const pricePriority = strategy.getPriority(priceQuery);
      
      expect(noPricePriority).toBeGreaterThan(pricePriority);
    });

    it('should give higher priority to multi-provider queries', () => {
      const multiProviderQuery: SignalQuery = {
        providers: [SignalProvider.SCOPE3, SignalProvider.LIVERAMP]
      };
      
      const singleProviderQuery: SignalQuery = {
        providers: [SignalProvider.SCOPE3]
      };
      
      const multiPriority = strategy.getPriority(multiProviderQuery);
      const singlePriority = strategy.getPriority(singleProviderQuery);
      
      expect(multiPriority).toBeGreaterThan(singlePriority);
    });
  });
});
