/**
 * Tests for authentication manager
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthManager } from './auth-manager';
import { Logger } from '../utils/logger';
import { ADCPErrorCode } from '../utils/error-handler';

describe('AuthManager', () => {
  let authManager: AuthManager;
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger({ enableConsole: false });
  });

  afterEach(() => {
    if (authManager) {
      authManager.destroy();
    }
  });

  it('should initialize with API key', () => {
    authManager = new AuthManager({
      apiKey: 'test-api-key-12345678901234567890'
    }, logger);
    
    expect(authManager).toBeDefined();
  });

  it('should get current token', async () => {
    authManager = new AuthManager({
      apiKey: 'test-api-key-12345678901234567890'
    }, logger);
    
    const token = await authManager.getToken();
    
    expect(token.value).toBe('test-api-key-12345678901234567890');
    expect(token.type).toBe('api_key');
  });

  it('should get auth header for API key', async () => {
    authManager = new AuthManager({
      apiKey: 'test-api-key-12345678901234567890'
    }, logger);
    
    const header = await authManager.getAuthHeader();
    
    expect(header).toBe('ApiKey test-api-key-12345678901234567890');
  });

  it('should rotate API key', async () => {
    authManager = new AuthManager({
      apiKey: 'old-key-12345678901234567890123'
    }, logger);
    
    await authManager.rotateApiKey('new-key-12345678901234567890123');
    
    const token = await authManager.getToken();
    expect(token.value).toBe('new-key-12345678901234567890123');
  });

  it('should validate API key format', () => {
    authManager = new AuthManager({
      apiKey: 'test-api-key-12345678901234567890'
    }, logger);
    
    expect(authManager.validateApiKey('valid-key-12345678901234567890')).toBe(true);
    expect(authManager.validateApiKey('short')).toBe(false);
    expect(authManager.validateApiKey('invalid key with spaces')).toBe(false);
  });

  it('should throw error when no token available', async () => {
    authManager = new AuthManager({
      apiKey: ''
    }, logger);
    
    authManager.clear();
    
    await expect(authManager.getToken()).rejects.toThrow('No authentication token available');
  });

  it('should handle OAuth configuration', async () => {
    authManager = new AuthManager({
      apiKey: 'test-key-12345678901234567890123',
      oauth: {
        clientId: 'client-id',
        clientSecret: 'client-secret',
        tokenUrl: 'https://oauth.example.com/token'
      }
    }, logger);
    
    await authManager.authenticateOAuth();
    
    const token = await authManager.getToken();
    expect(token.type).toBe('bearer');
  });

  it('should clear authentication state', async () => {
    authManager = new AuthManager({
      apiKey: 'test-key-12345678901234567890123'
    }, logger);
    
    await authManager.getToken();
    authManager.clear();
    
    await expect(authManager.getToken()).rejects.toThrow();
  });
});
