/**
 * Main ADCP client for interacting with ADCP-enabled platforms
 */

import { ADCPConfig } from '../types/adcp-types';
import { Signal, SignalQuery, ActivationConfig, Activation } from '../types/signal-types';
import { MediaBuyRequest, MediaBuyResponse, BuyStatus } from '../types/media-buy-types';
import { MCPClient } from './mcp-client';
import { AuthManager } from './auth-manager';
import { SignalsAPI } from '../protocols/signals/signals-api';
import { MediaBuyAPI } from '../protocols/media-buy/media-buy-api';
import { Logger, createLogger } from '../utils/logger';
import { RetryHandler, CircuitBreaker } from '../utils/retry-logic';

/**
 * Main ADCP client class
 */
export class ADCPClient {
  private logger: Logger;
  private mcpClient: MCPClient;
  private authManager: AuthManager;
  private signalsAPI: SignalsAPI;
  private mediaBuyAPI: MediaBuyAPI;
  private retryHandler: RetryHandler;
  private circuitBreaker: CircuitBreaker;

  constructor(config: ADCPConfig) {
    this.logger = createLogger({ prefix: 'ADCPClient' });
    
    // Initialize components
    this.authManager = new AuthManager(config.auth, this.logger);
    this.mcpClient = new MCPClient(config.mcp, this.logger);
    this.retryHandler = new RetryHandler({}, this.logger);
    this.circuitBreaker = new CircuitBreaker({}, this.logger);
    
    // Initialize protocol APIs
    this.signalsAPI = new SignalsAPI(this.mcpClient, this.authManager, this.logger);
    this.mediaBuyAPI = new MediaBuyAPI(this.mcpClient, this.authManager, this.logger);

    this.logger.info('ADCP client initialized', {
      serverUrl: config.mcp.serverUrl
    });
  }

  // ==================== Signals Activation Protocol ====================

  /**
   * Discover signals based on query parameters
   */
  async discoverSignals(query: SignalQuery): Promise<Signal[]> {
    return this.retryHandler.execute(
      () => this.circuitBreaker.execute(
        () => this.signalsAPI.discover(query),
        'discoverSignals'
      ),
      'discoverSignals'
    );
  }

  /**
   * Activate a signal for targeting
   */
  async activateSignal(signalId: string, config: ActivationConfig): Promise<Activation> {
    return this.retryHandler.execute(
      () => this.circuitBreaker.execute(
        () => this.signalsAPI.activate(signalId, config),
        'activateSignal'
      ),
      'activateSignal'
    );
  }

  /**
   * Get activation status
   */
  async getSignalStatus(activationId: string): Promise<Activation> {
    return this.retryHandler.execute(
      () => this.signalsAPI.getStatus(activationId),
      'getSignalStatus'
    );
  }

  /**
   * Deactivate a signal
   */
  async deactivateSignal(activationId: string): Promise<void> {
    return this.retryHandler.execute(
      () => this.signalsAPI.deactivate(activationId),
      'deactivateSignal'
    );
  }

  // ==================== Media Buy Protocol ====================

  /**
   * Execute a media buy
   */
  async executeBuy(request: MediaBuyRequest): Promise<MediaBuyResponse> {
    return this.retryHandler.execute(
      () => this.circuitBreaker.execute(
        () => this.mediaBuyAPI.executeBuy(request),
        'executeBuy'
      ),
      'executeBuy'
    );
  }

  /**
   * Get buy status
   */
  async getBuyStatus(buyId: string): Promise<BuyStatus> {
    return this.retryHandler.execute(
      () => this.mediaBuyAPI.getStatus(buyId),
      'getBuyStatus'
    );
  }

  /**
   * Cancel a media buy
   */
  async cancelBuy(buyId: string): Promise<void> {
    return this.retryHandler.execute(
      () => this.mediaBuyAPI.cancelBuy(buyId),
      'cancelBuy'
    );
  }

  // ==================== Utility Methods ====================

  /**
   * Get client statistics
   */
  getStats() {
    return {
      mcp: this.mcpClient.getPoolStats(),
      circuitBreaker: this.circuitBreaker.getStats(),
      logs: this.logger.getStats()
    };
  }

  /**
   * Destroy client and cleanup resources
   */
  async destroy(): Promise<void> {
    this.logger.info('Destroying ADCP client');
    
    await this.mcpClient.destroy();
    this.authManager.destroy();
    
    this.logger.info('ADCP client destroyed');
  }
}
