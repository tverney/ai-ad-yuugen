/**
 * Signal Discovery Logic
 * 
 * Handles signal discovery operations including query building,
 * multi-provider queries, and response normalization.
 */

import { MCPClient, MCPRequest } from '../../client/mcp-client';
import { Logger } from '../../utils/logger';
import { ADCPError, ADCPErrorCode } from '../../utils/error-handler';
import { 
  Signal, 
  SignalQuery, 
  SignalProvider,
  SignalCategory,
  SignalMetadata
} from '../../types/signal-types';

/**
 * Signal Discovery class
 */
export class SignalDiscovery {
  private mcpClient: MCPClient;
  private logger: Logger;

  constructor(mcpClient: MCPClient, logger: Logger) {
    this.mcpClient = mcpClient;
    this.logger = logger;
  }

  /**
   * Discover signals based on query parameters
   * 
   * @param query - Signal query parameters
   * @param apiKey - Authentication API key
   * @returns Array of discovered signals
   */
  async discover(query: SignalQuery, apiKey: string): Promise<Signal[]> {
    this.logger.debug('Building signal discovery request', { query });

    // Build MCP request from query
    const request = this.buildDiscoveryRequest(query, apiKey);

    // Handle multi-provider queries
    if (query.providers && query.providers.length > 1) {
      return this.discoverMultiProvider(query, apiKey);
    }

    // Execute single discovery request
    const response = await this.mcpClient.request<{
      signals: any[];
      metadata?: {
        totalCount: number;
        hasMore: boolean;
      };
    }>(request);

    // Parse and normalize signals
    const signals = this.parseSignals(response.signals);

    this.logger.debug('Signals parsed', { 
      count: signals.length,
      totalAvailable: response.metadata?.totalCount
    });

    return signals;
  }

  /**
   * Build MCP discovery request from query parameters
   */
  private buildDiscoveryRequest(query: SignalQuery, apiKey: string): MCPRequest {
    const params: Record<string, any> = {
      apiKey
    };

    // Add text search if provided
    if (query.text) {
      params.text = query.text;
    }

    // Add categories filter
    if (query.categories && query.categories.length > 0) {
      params.categories = query.categories;
    }

    // Add provider filter (single provider for this request)
    if (query.providers && query.providers.length > 0) {
      params.provider = query.providers[0];
    }

    // Add price range filter
    if (query.priceRange) {
      params.priceRange = {
        min: query.priceRange.min,
        max: query.priceRange.max
      };
    }

    // Add reach filters
    if (query.minReach !== undefined) {
      params.minReach = query.minReach;
    }

    if (query.maxReach !== undefined) {
      params.maxReach = query.maxReach;
    }

    // Add geography filter
    if (query.geography) {
      params.geography = this.normalizeGeography(query.geography);
    }

    // Add limit
    if (query.limit !== undefined) {
      params.limit = query.limit;
    } else {
      params.limit = 50; // Default limit
    }

    return {
      method: 'signals.discover',
      params
    };
  }

  /**
   * Handle multi-provider signal discovery
   * 
   * Queries multiple providers in parallel and aggregates results
   */
  private async discoverMultiProvider(query: SignalQuery, apiKey: string): Promise<Signal[]> {
    this.logger.debug('Executing multi-provider discovery', { 
      providers: query.providers 
    });

    const providers = query.providers || [];
    
    // Create a query for each provider
    const providerQueries = providers.map(provider => {
      const providerQuery: SignalQuery = {
        ...query,
        providers: [provider]
      };
      return this.discover(providerQuery, apiKey);
    });

    // Execute all queries in parallel
    const results = await Promise.allSettled(providerQueries);

    // Aggregate successful results
    const allSignals: Signal[] = [];
    const errors: any[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allSignals.push(...result.value);
      } else {
        const provider = providers[index];
        this.logger.warn('Provider query failed', { 
          provider, 
          error: result.reason 
        });
        errors.push({ provider, error: result.reason });
      }
    });

    // If all providers failed, throw error
    if (allSignals.length === 0 && errors.length > 0) {
      throw new ADCPError(
        'All provider queries failed',
        ADCPErrorCode.PLATFORM_UNAVAILABLE,
        { errors }
      );
    }

    // Sort by relevance/quality if we have multiple signals
    const sortedSignals = this.sortSignals(allSignals);

    // Apply limit if specified
    const limit = query.limit || 50;
    const limitedSignals = sortedSignals.slice(0, limit);

    this.logger.debug('Multi-provider discovery complete', { 
      totalSignals: allSignals.length,
      returnedSignals: limitedSignals.length,
      failedProviders: errors.length
    });

    return limitedSignals;
  }

  /**
   * Parse and normalize signal responses
   * 
   * Maps raw API responses to Signal interface
   */
  private parseSignals(rawSignals: any[]): Signal[] {
    if (!Array.isArray(rawSignals)) {
      throw new ADCPError(
        'Invalid signals response format',
        ADCPErrorCode.INVALID_RESPONSE,
        { rawSignals }
      );
    }

    return rawSignals.map((raw, index) => {
      try {
        return this.parseSignal(raw);
      } catch (error) {
        this.logger.warn('Failed to parse signal', { index, raw, error });
        // Skip invalid signals rather than failing entire request
        return null;
      }
    }).filter((signal): signal is Signal => signal !== null);
  }

  /**
   * Parse a single signal from raw response
   */
  private parseSignal(raw: any): Signal {
    // Validate required fields
    if (!raw.id || !raw.name || !raw.provider) {
      throw new ADCPError(
        'Signal missing required fields',
        ADCPErrorCode.INVALID_RESPONSE,
        { raw }
      );
    }

    // Parse provider enum
    const provider = this.parseProvider(raw.provider);

    // Parse category enum
    const category = this.parseCategory(raw.category);

    // Parse metadata
    const metadata = this.parseMetadata(raw.metadata || {});

    // Parse dates
    const createdAt = raw.createdAt ? new Date(raw.createdAt) : new Date();
    const updatedAt = raw.updatedAt ? new Date(raw.updatedAt) : new Date();

    return {
      id: String(raw.id),
      name: String(raw.name),
      description: String(raw.description || ''),
      provider,
      category,
      cpm: Number(raw.cpm || 0),
      reach: Number(raw.reach || 0),
      confidence: Number(raw.confidence || 0.5),
      metadata,
      createdAt,
      updatedAt
    };
  }

  /**
   * Parse provider from string to enum
   */
  private parseProvider(provider: string): SignalProvider {
    const normalizedProvider = provider.toLowerCase();
    
    switch (normalizedProvider) {
      case 'scope3':
        return SignalProvider.SCOPE3;
      case 'liveramp':
        return SignalProvider.LIVERAMP;
      case 'nielsen':
        return SignalProvider.NIELSEN;
      case 'comscore':
        return SignalProvider.COMSCORE;
      default:
        this.logger.warn('Unknown provider, defaulting to SCOPE3', { provider });
        return SignalProvider.SCOPE3;
    }
  }

  /**
   * Parse category from string to enum
   */
  private parseCategory(category: string): SignalCategory {
    if (!category) {
      return SignalCategory.CONTEXTUAL;
    }

    const normalizedCategory = category.toLowerCase();
    
    switch (normalizedCategory) {
      case 'demographic':
        return SignalCategory.DEMOGRAPHIC;
      case 'behavioral':
        return SignalCategory.BEHAVIORAL;
      case 'contextual':
        return SignalCategory.CONTEXTUAL;
      case 'geographic':
        return SignalCategory.GEOGRAPHIC;
      case 'temporal':
        return SignalCategory.TEMPORAL;
      default:
        this.logger.warn('Unknown category, defaulting to CONTEXTUAL', { category });
        return SignalCategory.CONTEXTUAL;
    }
  }

  /**
   * Parse signal metadata
   */
  private parseMetadata(raw: any): SignalMetadata {
    const metadata: SignalMetadata = {};

    if (raw.topics && Array.isArray(raw.topics)) {
      metadata.topics = raw.topics.map(String);
    }

    if (raw.intents && Array.isArray(raw.intents)) {
      metadata.intents = raw.intents.map(String);
    }

    if (raw.demographics) {
      metadata.demographics = {
        ageRange: raw.demographics.ageRange ? {
          min: Number(raw.demographics.ageRange.min),
          max: Number(raw.demographics.ageRange.max)
        } : undefined,
        gender: raw.demographics.gender ? 
          Array.isArray(raw.demographics.gender) ? 
            raw.demographics.gender.map(String) : 
            [String(raw.demographics.gender)] : 
          undefined,
        income: raw.demographics.income ? {
          min: Number(raw.demographics.income.min),
          max: Number(raw.demographics.income.max)
        } : undefined,
        education: raw.demographics.education && Array.isArray(raw.demographics.education) ?
          raw.demographics.education.map(String) : undefined,
        interests: raw.demographics.interests && Array.isArray(raw.demographics.interests) ?
          raw.demographics.interests.map(String) : undefined
      };
    }

    if (raw.geography) {
      metadata.geography = {
        countries: raw.geography.countries && Array.isArray(raw.geography.countries) ?
          raw.geography.countries.map(String) : undefined,
        regions: raw.geography.regions && Array.isArray(raw.geography.regions) ?
          raw.geography.regions.map(String) : undefined,
        cities: raw.geography.cities && Array.isArray(raw.geography.cities) ?
          raw.geography.cities.map(String) : undefined,
        postalCodes: raw.geography.postalCodes && Array.isArray(raw.geography.postalCodes) ?
          raw.geography.postalCodes.map(String) : undefined
      };
    }

    if (raw.dataFreshness !== undefined) {
      metadata.dataFreshness = Number(raw.dataFreshness);
    }

    if (raw.dataSource) {
      metadata.dataSource = String(raw.dataSource);
    }

    return metadata;
  }

  /**
   * Normalize geography for API request
   */
  private normalizeGeography(geography: any): any {
    const normalized: any = {};

    if (geography.countries && Array.isArray(geography.countries)) {
      normalized.countries = geography.countries;
    }

    if (geography.regions && Array.isArray(geography.regions)) {
      normalized.regions = geography.regions;
    }

    if (geography.cities && Array.isArray(geography.cities)) {
      normalized.cities = geography.cities;
    }

    if (geography.postalCodes && Array.isArray(geography.postalCodes)) {
      normalized.postalCodes = geography.postalCodes;
    }

    return normalized;
  }

  /**
   * Sort signals by quality metrics
   * 
   * Prioritizes signals with higher confidence and reach
   */
  private sortSignals(signals: Signal[]): Signal[] {
    return signals.sort((a, b) => {
      // Calculate a simple quality score
      const scoreA = (a.confidence * 0.6) + (Math.min(a.reach / 1000000, 1) * 0.4);
      const scoreB = (b.confidence * 0.6) + (Math.min(b.reach / 1000000, 1) * 0.4);
      
      return scoreB - scoreA;
    });
  }
}
