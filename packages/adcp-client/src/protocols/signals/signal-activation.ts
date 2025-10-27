/**
 * Signal Activation Logic
 * 
 * Handles signal activation operations including activation request building,
 * response handling, and lifecycle tracking.
 */

import { MCPClient, MCPRequest } from '../../client/mcp-client';
import { Logger } from '../../utils/logger';
import { ADCPError, ADCPErrorCode } from '../../utils/error-handler';
import { 
  Activation, 
  ActivationConfig, 
  ActivationStatus,
  ActivationPerformance
} from '../../types/signal-types';

/**
 * Signal Activation class
 */
export class SignalActivation {
  private mcpClient: MCPClient;
  private logger: Logger;
  private activeActivations: Map<string, Activation>;

  constructor(mcpClient: MCPClient, logger: Logger) {
    this.mcpClient = mcpClient;
    this.logger = logger;
    this.activeActivations = new Map();
  }

  /**
   * Activate a signal for targeting
   * 
   * @param signalId - ID of the signal to activate
   * @param config - Activation configuration
   * @param apiKey - Authentication API key
   * @returns Activation details
   */
  async activate(signalId: string, config: ActivationConfig, apiKey: string): Promise<Activation> {
    this.logger.debug('Building signal activation request', { signalId, config });

    // Build activation request
    const request = this.buildActivationRequest(signalId, config, apiKey);

    // Execute activation request
    const response = await this.mcpClient.request<{
      activation: any;
    }>(request);

    // Parse and normalize activation response
    const activation = this.parseActivation(response.activation);

    // Track activation lifecycle
    this.trackActivation(activation);

    this.logger.debug('Activation created', { 
      activationId: activation.id,
      signalId: activation.signalId,
      status: activation.status
    });

    return activation;
  }

  /**
   * Build MCP activation request from configuration
   */
  private buildActivationRequest(
    signalId: string, 
    config: ActivationConfig, 
    apiKey: string
  ): MCPRequest {
    const params: Record<string, any> = {
      signalId,
      apiKey,
      budget: config.budget,
      duration: this.normalizeDuration(config.duration)
    };

    // Add targeting configuration if provided
    if (config.targeting) {
      params.targeting = this.normalizeTargeting(config.targeting);
    }

    return {
      method: 'signals.activate',
      params
    };
  }

  /**
   * Parse activation response
   * 
   * Maps raw API response to Activation interface
   */
  parseActivation(raw: any): Activation {
    // Validate required fields
    if (!raw.id || !raw.signalId) {
      throw new ADCPError(
        'Activation response missing required fields',
        ADCPErrorCode.INVALID_RESPONSE,
        { raw }
      );
    }

    // Parse status
    const status = this.parseStatus(raw.status);

    // Parse performance if available
    const performance = raw.performance ? 
      this.parsePerformance(raw.performance) : 
      undefined;

    // Parse dates
    const createdAt = raw.createdAt ? new Date(raw.createdAt) : new Date();
    const updatedAt = raw.updatedAt ? new Date(raw.updatedAt) : new Date();
    const expiresAt = raw.expiresAt ? new Date(raw.expiresAt) : new Date(Date.now() + 86400000); // Default 24h

    return {
      id: String(raw.id),
      signalId: String(raw.signalId),
      status,
      cost: Number(raw.cost || 0),
      reach: Number(raw.reach || 0),
      performance,
      createdAt,
      updatedAt,
      expiresAt
    };
  }

  /**
   * Parse activation status from string to enum
   */
  private parseStatus(status: string): ActivationStatus {
    if (!status) {
      return ActivationStatus.PENDING;
    }

    const normalizedStatus = status.toLowerCase();
    
    switch (normalizedStatus) {
      case 'pending':
        return ActivationStatus.PENDING;
      case 'active':
        return ActivationStatus.ACTIVE;
      case 'paused':
        return ActivationStatus.PAUSED;
      case 'completed':
        return ActivationStatus.COMPLETED;
      case 'failed':
        return ActivationStatus.FAILED;
      case 'cancelled':
        return ActivationStatus.CANCELLED;
      default:
        this.logger.warn('Unknown activation status, defaulting to PENDING', { status });
        return ActivationStatus.PENDING;
    }
  }

  /**
   * Parse activation performance metrics
   */
  private parsePerformance(raw: any): ActivationPerformance {
    return {
      impressions: Number(raw.impressions || 0),
      clicks: Number(raw.clicks || 0),
      conversions: Number(raw.conversions || 0),
      ctr: Number(raw.ctr || 0),
      cpa: Number(raw.cpa || 0)
    };
  }

  /**
   * Normalize duration for API request
   */
  private normalizeDuration(duration: any): any {
    const normalized: any = {};

    if (duration.days !== undefined) {
      normalized.days = duration.days;
    }

    if (duration.hours !== undefined) {
      normalized.hours = duration.hours;
    }

    if (duration.startDate) {
      normalized.startDate = duration.startDate instanceof Date ? 
        duration.startDate.toISOString() : 
        duration.startDate;
    }

    if (duration.endDate) {
      normalized.endDate = duration.endDate instanceof Date ? 
        duration.endDate.toISOString() : 
        duration.endDate;
    }

    return normalized;
  }

  /**
   * Normalize targeting configuration for API request
   */
  private normalizeTargeting(targeting: any): any {
    const normalized: any = {};

    // Normalize demographics
    if (targeting.demographics) {
      normalized.demographics = {};

      if (targeting.demographics.ageRange) {
        normalized.demographics.ageRange = {
          min: targeting.demographics.ageRange.min,
          max: targeting.demographics.ageRange.max
        };
      }

      if (targeting.demographics.gender) {
        normalized.demographics.gender = Array.isArray(targeting.demographics.gender) ?
          targeting.demographics.gender : [targeting.demographics.gender];
      }

      if (targeting.demographics.income) {
        normalized.demographics.income = {
          min: targeting.demographics.income.min,
          max: targeting.demographics.income.max
        };
      }

      if (targeting.demographics.education) {
        normalized.demographics.education = Array.isArray(targeting.demographics.education) ?
          targeting.demographics.education : [targeting.demographics.education];
      }

      if (targeting.demographics.interests) {
        normalized.demographics.interests = Array.isArray(targeting.demographics.interests) ?
          targeting.demographics.interests : [targeting.demographics.interests];
      }
    }

    // Normalize geography
    if (targeting.geography) {
      normalized.geography = {};

      if (targeting.geography.countries) {
        normalized.geography.countries = Array.isArray(targeting.geography.countries) ?
          targeting.geography.countries : [targeting.geography.countries];
      }

      if (targeting.geography.regions) {
        normalized.geography.regions = Array.isArray(targeting.geography.regions) ?
          targeting.geography.regions : [targeting.geography.regions];
      }

      if (targeting.geography.cities) {
        normalized.geography.cities = Array.isArray(targeting.geography.cities) ?
          targeting.geography.cities : [targeting.geography.cities];
      }

      if (targeting.geography.postalCodes) {
        normalized.geography.postalCodes = Array.isArray(targeting.geography.postalCodes) ?
          targeting.geography.postalCodes : [targeting.geography.postalCodes];
      }
    }

    // Normalize frequency
    if (targeting.frequency) {
      normalized.frequency = {
        maxImpressions: targeting.frequency.maxImpressions,
        maxImpressionsPerUser: targeting.frequency.maxImpressionsPerUser,
        timePeriod: targeting.frequency.timePeriod
      };
    }

    return normalized;
  }

  /**
   * Track activation lifecycle
   * 
   * Maintains a local cache of active activations for monitoring
   */
  private trackActivation(activation: Activation): void {
    this.activeActivations.set(activation.id, activation);

    // Clean up completed/failed/cancelled activations after tracking
    this.cleanupInactiveActivations();

    this.logger.debug('Activation tracked', { 
      activationId: activation.id,
      totalActive: this.activeActivations.size
    });
  }

  /**
   * Update activation status in local tracking
   */
  updateActivationStatus(activationId: string, activation: Activation): void {
    if (this.activeActivations.has(activationId)) {
      this.activeActivations.set(activationId, activation);
      
      this.logger.debug('Activation status updated', { 
        activationId,
        status: activation.status
      });
    }
  }

  /**
   * Remove activation from tracking
   */
  removeActivation(activationId: string): void {
    if (this.activeActivations.delete(activationId)) {
      this.logger.debug('Activation removed from tracking', { activationId });
    }
  }

  /**
   * Get all tracked activations
   */
  getTrackedActivations(): Activation[] {
    return Array.from(this.activeActivations.values());
  }

  /**
   * Get a specific tracked activation
   */
  getTrackedActivation(activationId: string): Activation | undefined {
    return this.activeActivations.get(activationId);
  }

  /**
   * Clean up inactive activations from tracking
   * 
   * Removes completed, failed, cancelled, or expired activations
   */
  private cleanupInactiveActivations(): void {
    const now = new Date();
    const inactiveStatuses = [
      ActivationStatus.COMPLETED,
      ActivationStatus.FAILED,
      ActivationStatus.CANCELLED
    ];

    for (const [id, activation] of this.activeActivations.entries()) {
      // Remove if status is inactive
      if (inactiveStatuses.includes(activation.status)) {
        this.activeActivations.delete(id);
        continue;
      }

      // Remove if expired
      if (activation.expiresAt < now) {
        this.activeActivations.delete(id);
        this.logger.debug('Expired activation removed from tracking', { 
          activationId: id,
          expiresAt: activation.expiresAt
        });
      }
    }
  }

  /**
   * Get activation statistics
   */
  getStats() {
    const activations = Array.from(this.activeActivations.values());
    
    const statusCounts = activations.reduce((acc, activation) => {
      acc[activation.status] = (acc[activation.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalCost = activations.reduce((sum, activation) => sum + activation.cost, 0);
    const totalReach = activations.reduce((sum, activation) => sum + activation.reach, 0);

    return {
      total: activations.length,
      byStatus: statusCounts,
      totalCost,
      totalReach
    };
  }
}
