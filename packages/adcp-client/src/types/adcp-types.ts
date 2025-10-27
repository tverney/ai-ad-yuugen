/**
 * Core ADCP configuration and types
 */

export interface ADCPConfig {
  mcp: MCPConfig;
  auth: AuthConfig;
  cache?: CacheConfig;
  endpoints?: EndpointConfig;
}

export interface MCPConfig {
  serverUrl: string;
  timeout?: number;
  maxConnections?: number;
  retryAttempts?: number;
}

export interface AuthConfig {
  apiKey: string;
  keyRotation?: {
    enabled: boolean;
    interval: number;
  };
  oauth?: {
    clientId: string;
    clientSecret: string;
    tokenUrl: string;
  };
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize?: number;
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
}

export interface EndpointConfig {
  signals?: string;
  mediaBuy?: string;
  analytics?: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRatio: number;
  size: number;
  evictions: number;
}
