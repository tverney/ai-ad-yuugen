/**
 * @ai-yuugen/adcp-client
 * 
 * ADCP (Ad Context Protocol) client library for AI Ad Yuugen platform
 */

// Main client
export { ADCPClient } from './client/adcp-client';

// Protocol APIs
export { SignalsAPI } from './protocols/signals/signals-api';
export { MediaBuyAPI } from './protocols/media-buy/media-buy-api';

// Cache
export { SignalCache } from './cache/signal-cache';
export { CacheStrategy, generateCacheKey, hashQuery, normalizeQuery } from './cache/cache-strategy';
export { CacheMonitor, CacheStatsEndpoint } from './cache/cache-monitor';

// Utilities
export { ADCPError, ADCPErrorCode } from './utils/error-handler';
export { Logger, LogLevel } from './utils/logger';

// Types
export * from './types/adcp-types';
export * from './types/signal-types';
export * from './types/media-buy-types';
