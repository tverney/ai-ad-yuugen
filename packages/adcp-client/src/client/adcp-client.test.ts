/**
 * Tests for ADCP client
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ADCPClient } from './adcp-client';
import { SignalCategory, SignalProvider } from '../types/signal-types';

describe('ADCPClient', () => {
  let client: ADCPClient;

  beforeEach(() => {
    client = new ADCPClient({
      mcp: {
        serverUrl: 'http://test.example.com',
        timeout: 5000
      },
      auth: {
        apiKey: 'test-api-key-12345678901234567890'
      },
      cache: {
        enabled: true,
        ttl: 300
      }
    });
  });

  afterEach(async () => {
    await client.destroy();
  });

  it('should create ADCP client', () => {
    expect(client).toBeDefined();
  });

  it('should discover signals', async () => {
    // Mock MCP client to return proper signal structure
    vi.spyOn(client['mcpClient'], 'request').mockResolvedValue({
      signals: [
        {
          id: 'sig_1',
          name: 'Tech Enthusiasts',
          provider: 'scope3',
          category: 'behavioral',
          cpm: 5.0,
          reach: 1000000,
          confidence: 0.85
        }
      ]
    });

    const signals = await client.discoverSignals({
      text: 'technology enthusiasts',
      categories: [SignalCategory.BEHAVIORAL],
      providers: [SignalProvider.SCOPE3]
    });
    
    expect(Array.isArray(signals)).toBe(true);
    expect(signals.length).toBeGreaterThan(0);
  });

  it('should activate signal', async () => {
    // Mock MCP client to return proper activation structure
    vi.spyOn(client['mcpClient'], 'request').mockResolvedValue({
      activation: {
        id: 'act_1',
        signalId: 'signal-123',
        status: 'active',
        cost: 100,
        reach: 500000
      }
    });

    const activation = await client.activateSignal('signal-123', {
      budget: 100,
      duration: { days: 7 }
    });
    
    expect(activation).toBeDefined();
    expect(activation.id).toBe('act_1');
  });

  it('should get signal status', async () => {
    // Mock MCP client to return proper activation structure
    vi.spyOn(client['mcpClient'], 'request').mockResolvedValue({
      activation: {
        id: 'activation-123',
        signalId: 'sig_1',
        status: 'active',
        cost: 100,
        reach: 500000
      }
    });

    const status = await client.getSignalStatus('activation-123');
    
    expect(status).toBeDefined();
    expect(status.id).toBe('activation-123');
  });

  it('should deactivate signal', async () => {
    // Mock MCP client to return success
    vi.spyOn(client['mcpClient'], 'request').mockResolvedValue({
      success: true
    });

    await expect(
      client.deactivateSignal('activation-123')
    ).resolves.not.toThrow();
  });

  it('should execute media buy', async () => {
    const response = await client.executeBuy({
      budget: 1000,
      duration: { days: 30 },
      targeting: {},
      platforms: ['platform1'],
      baseBid: 5.0
    });
    
    expect(response).toBeDefined();
  });

  it('should get buy status', async () => {
    const status = await client.getBuyStatus('buy-123');
    
    expect(status).toBeDefined();
  });

  it('should cancel buy', async () => {
    await expect(
      client.cancelBuy('buy-123')
    ).resolves.not.toThrow();
  });

  it('should provide client statistics', () => {
    const stats = client.getStats();
    
    expect(stats).toHaveProperty('mcp');
    expect(stats).toHaveProperty('circuitBreaker');
    expect(stats).toHaveProperty('logs');
  });

  it('should cleanup on destroy', async () => {
    await client.destroy();
    
    // Client should be destroyed without errors
    expect(true).toBe(true);
  });
});
