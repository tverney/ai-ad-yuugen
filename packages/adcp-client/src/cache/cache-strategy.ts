/**
 * Cache key generation and strategy implementation
 * Provides deterministic hashing for signal queries
 */

import { createHash } from 'crypto';
import { SignalQuery } from '../types/signal-types';

/**
 * Normalize query parameters for consistent cache key generation
 */
export function normalizeQuery(query: SignalQuery): SignalQuery {
  const normalized: SignalQuery = {};

  // Normalize text (lowercase, trim)
  if (query.text) {
    normalized.text = query.text.toLowerCase().trim();
  }

  // Sort arrays for consistent ordering
  if (query.categories) {
    normalized.categories = [...query.categories].sort();
  }

  if (query.providers) {
    normalized.providers = [...query.providers].sort();
  }

  // Normalize price range
  if (query.priceRange) {
    normalized.priceRange = {
      min: query.priceRange.min,
      max: query.priceRange.max
    };
  }

  // Normalize reach values
  if (query.minReach !== undefined) {
    normalized.minReach = query.minReach;
  }

  if (query.maxReach !== undefined) {
    normalized.maxReach = query.maxReach;
  }

  // Normalize geography
  if (query.geography) {
    normalized.geography = {};
    
    if (query.geography.countries) {
      normalized.geography.countries = [...query.geography.countries].sort();
    }
    
    if (query.geography.regions) {
      normalized.geography.regions = [...query.geography.regions].sort();
    }
    
    if (query.geography.cities) {
      normalized.geography.cities = [...query.geography.cities].sort();
    }
    
    if (query.geography.postalCodes) {
      normalized.geography.postalCodes = [...query.geography.postalCodes].sort();
    }
  }

  // Normalize limit
  if (query.limit !== undefined) {
    normalized.limit = query.limit;
  }

  return normalized;
}

/**
 * Generate deterministic hash from query
 */
export function hashQuery(query: SignalQuery): string {
  const normalized = normalizeQuery(query);
  
  // Create stable JSON string (sorted keys)
  const jsonString = JSON.stringify(normalized, Object.keys(normalized).sort());
  
  // Generate SHA-256 hash
  const hash = createHash('sha256')
    .update(jsonString)
    .digest('hex');
  
  return hash;
}

/**
 * Generate cache key for signal query
 */
export function generateCacheKey(query: SignalQuery, prefix = 'adcp:signals'): string {
  const hash = hashQuery(query);
  return `${prefix}:${hash}`;
}

/**
 * Generate cache key pattern for invalidation
 */
export function generateInvalidationPattern(options: {
  provider?: string;
  category?: string;
  prefix?: string;
}): string {
  const prefix = options.prefix || 'adcp:signals';
  
  if (options.provider && options.category) {
    return `${prefix}:*:${options.provider}:${options.category}:*`;
  }
  
  if (options.provider) {
    return `${prefix}:*:${options.provider}:*`;
  }
  
  if (options.category) {
    return `${prefix}:*:*:${options.category}:*`;
  }
  
  return `${prefix}:*`;
}

/**
 * Parse cache key to extract metadata
 */
export function parseCacheKey(key: string): {
  prefix: string;
  hash: string;
} | null {
  const parts = key.split(':');
  
  if (parts.length < 3) {
    return null;
  }
  
  return {
    prefix: parts.slice(0, 2).join(':'),
    hash: parts.slice(2).join(':')
  };
}

/**
 * Cache strategy configuration
 */
export interface CacheStrategyConfig {
  ttl: number;
  maxSize?: number;
  evictionPolicy?: 'lru' | 'lfu' | 'ttl';
}

/**
 * Cache strategy implementation
 */
export class CacheStrategy {
  constructor(private config: CacheStrategyConfig) {}

  /**
   * Get TTL for a query
   */
  getTTL(query: SignalQuery): number {
    // Could implement dynamic TTL based on query characteristics
    // For now, return configured TTL
    return this.config.ttl;
  }

  /**
   * Determine if query should be cached
   */
  shouldCache(query: SignalQuery): boolean {
    // Don't cache queries with very specific targeting (likely one-time use)
    if (query.geography?.postalCodes && query.geography.postalCodes.length > 100) {
      return false;
    }

    // Don't cache queries with very low limits (likely testing)
    if (query.limit !== undefined && query.limit < 5) {
      return false;
    }

    return true;
  }

  /**
   * Get cache priority for a query (higher = more important to keep)
   */
  getPriority(query: SignalQuery): number {
    let priority = 1;

    // Higher priority for broader queries (more reusable)
    if (!query.geography || Object.keys(query.geography).length === 0) {
      priority += 2;
    }

    // Higher priority for queries without price constraints
    if (!query.priceRange) {
      priority += 1;
    }

    // Higher priority for queries with multiple providers
    if (query.providers && query.providers.length > 1) {
      priority += 1;
    }

    return priority;
  }
}
