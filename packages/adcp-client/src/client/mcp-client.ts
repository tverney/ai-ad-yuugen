/**
 * MCP (Model Context Protocol) client for ADCP communication
 */

import { MCPConfig } from '../types/adcp-types';
import { ADCPError, ADCPErrorCode } from '../utils/error-handler';
import { Logger } from '../utils/logger';

export interface MCPRequest {
  method: string;
  params?: Record<string, any>;
  timeout?: number;
}

export interface MCPResponse<T = any> {
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface ConnectionPool {
  acquire(): Promise<MCPConnection>;
  release(connection: MCPConnection): void;
  destroy(): Promise<void>;
}

export interface MCPConnection {
  id: string;
  isActive: boolean;
  lastUsed: Date;
  send<T>(request: MCPRequest): Promise<MCPResponse<T>>;
  close(): Promise<void>;
}

/**
 * MCP Client for managing connections and requests to ADCP platforms
 */
export class MCPClient {
  private config: MCPConfig;
  private logger: Logger;
  private connectionPool: Map<string, MCPConnection>;
  private maxConnections: number;
  private activeRequests: Map<string, AbortController>;

  constructor(config: MCPConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.connectionPool = new Map();
    this.maxConnections = config.maxConnections || 10;
    this.activeRequests = new Map();
  }

  /**
   * Send a request to the MCP server
   */
  async request<T>(request: MCPRequest): Promise<T> {
    const requestId = this.generateRequestId();
    const timeout = request.timeout || this.config.timeout || 5000;
    const abortController = new AbortController();

    this.activeRequests.set(requestId, abortController);

    try {
      this.logger.debug('MCP request', { requestId, method: request.method });

      const connection = await this.acquireConnection();
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          abortController.abort();
          reject(new ADCPError(
            `Request timeout after ${timeout}ms`,
            ADCPErrorCode.TIMEOUT,
            { requestId, method: request.method }
          ));
        }, timeout);
      });

      const requestPromise = connection.send<T>(request);

      const response = await Promise.race([requestPromise, timeoutPromise]);

      this.releaseConnection(connection);

      if (response.error) {
        throw new ADCPError(
          response.error.message,
          this.mapErrorCode(response.error.code),
          response.error.data
        );
      }

      if (!response.result) {
        throw new ADCPError(
          'Empty response from MCP server',
          ADCPErrorCode.INVALID_RESPONSE,
          { requestId }
        );
      }

      this.logger.debug('MCP response', { requestId, success: true });

      return response.result;
    } catch (error) {
      this.logger.error('MCP request failed', { requestId, error });
      throw error;
    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  /**
   * Cancel an active request
   */
  cancelRequest(requestId: string): void {
    const controller = this.activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestId);
      this.logger.debug('Request cancelled', { requestId });
    }
  }

  /**
   * Cancel all active requests
   */
  cancelAllRequests(): void {
    for (const [requestId, controller] of this.activeRequests.entries()) {
      controller.abort();
      this.logger.debug('Request cancelled', { requestId });
    }
    this.activeRequests.clear();
  }

  /**
   * Acquire a connection from the pool
   */
  private async acquireConnection(): Promise<MCPConnection> {
    // Find an available connection
    for (const connection of this.connectionPool.values()) {
      if (connection.isActive) {
        connection.lastUsed = new Date();
        return connection;
      }
    }

    // Create new connection if under limit
    if (this.connectionPool.size < this.maxConnections) {
      const connection = await this.createConnection();
      this.connectionPool.set(connection.id, connection);
      return connection;
    }

    // Wait for a connection to become available
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        for (const connection of this.connectionPool.values()) {
          if (connection.isActive) {
            clearInterval(checkInterval);
            connection.lastUsed = new Date();
            resolve(connection);
            return;
          }
        }
      }, 100);

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new ADCPError(
          'Connection pool exhausted',
          ADCPErrorCode.CONNECTION_FAILED
        ));
      }, 5000);
    });
  }

  /**
   * Release a connection back to the pool
   */
  private releaseConnection(connection: MCPConnection): void {
    // Connection is automatically available for reuse
    this.logger.debug('Connection released', { connectionId: connection.id });
  }

  /**
   * Create a new MCP connection
   */
  private async createConnection(): Promise<MCPConnection> {
    const connectionId = this.generateConnectionId();

    this.logger.debug('Creating MCP connection', { 
      connectionId, 
      serverUrl: this.config.serverUrl 
    });

    // In a real implementation, this would establish an actual connection
    // For now, we create a mock connection structure
    const connection: MCPConnection = {
      id: connectionId,
      isActive: true,
      lastUsed: new Date(),
      send: async <T>(_request: MCPRequest): Promise<MCPResponse<T>> => {
        // This would be replaced with actual MCP SDK communication
        // For now, return a mock response structure
        return {
          result: {} as T
        };
      },
      close: async () => {
        connection.isActive = false;
        this.logger.debug('Connection closed', { connectionId });
      }
    };

    return connection;
  }

  /**
   * Close all connections and cleanup
   */
  async destroy(): Promise<void> {
    this.logger.info('Destroying MCP client');
    
    this.cancelAllRequests();

    const closePromises = Array.from(this.connectionPool.values()).map(
      conn => conn.close()
    );

    await Promise.all(closePromises);
    this.connectionPool.clear();

    this.logger.info('MCP client destroyed');
  }

  /**
   * Get connection pool statistics
   */
  getPoolStats() {
    return {
      total: this.connectionPool.size,
      active: Array.from(this.connectionPool.values()).filter(c => c.isActive).length,
      maxConnections: this.maxConnections,
      activeRequests: this.activeRequests.size
    };
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a unique connection ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Map MCP error codes to ADCP error codes
   */
  private mapErrorCode(mcpErrorCode: number): ADCPErrorCode {
    switch (mcpErrorCode) {
      case 401:
      case 403:
        return ADCPErrorCode.UNAUTHORIZED;
      case 404:
        return ADCPErrorCode.SIGNAL_NOT_FOUND;
      case 429:
        return ADCPErrorCode.RATE_LIMIT_EXCEEDED;
      case 500:
      case 503:
        return ADCPErrorCode.PLATFORM_UNAVAILABLE;
      default:
        return ADCPErrorCode.INVALID_REQUEST;
    }
  }
}
