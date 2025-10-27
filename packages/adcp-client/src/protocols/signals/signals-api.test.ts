/**
 * Tests for Signals API
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SignalsAPI } from './signals-api';
import { MCPClient } from '../../client/mcp-client';
import { AuthManager } from '../../client/auth-manager';
import { Logger } from '../../utils/logger';
import { ADCPErrorCode } from '../../utils/error-handler';
import { 
  SignalQuery, 
  SignalProvider, 
  SignalCategory,
  ActivationConfig,
  ActivationStatus
} from '../../types/signal-types';

describe('SignalsAPI', () => {
  let signalsAPI: SignalsAPI;
  let mcpClient: MCPClient;
  let authManager: AuthManager;
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger({ enableConsole: false });
    mcpClient = new MCPClient({
      serverUrl: 'http://test.example.com',
      timeout: 5000
    }, logger);
    authManager = new AuthManager({
      apiKey: 'test-api-key'
    }, logger);
    
    signalsAPI = new SignalsAPI(mcpClient, authManager, logger);
  });

  afterEach(async () => {
    await mcpClient.destroy();
    authManager.destroy();
  });

  describe('discover', () => {
    it('should discover signals with text query', async () => {
      // Mock MCP client response
      vi.spyOn(mcpClient, 'request').mockResolvedValue({
        signals: [
          {
            id: 'sig_1',
            name: 'Tech Enthusiasts',
            description: 'Users interested in technology',
            provider: 'scope3',
            category: 'behavioral',
            cpm: 5.0,
            reach: 1000000,
            confidence: 0.85,
            metadata: {
              topics: ['technology', 'gadgets']
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        metadata: {
          totalCount: 1,
          hasMore: false
        }
      });

      const query: SignalQuery = {
        text: 'technology enthusiasts'
      };

      const signals = await signalsAPI.discover(query);

      expect(signals).toHaveLength(1);
      expect(signals[0].id).toBe('sig_1');
      expect(signals[0].name).toBe('Tech Enthusiasts');
      expect(signals[0].provider).toBe(SignalProvider.SCOPE3);
      expect(signals[0].category).toBe(SignalCategory.BEHAVIORAL);
    });

    it('should discover signals with category filter', async () => {
      vi.spyOn(mcpClient, 'request').mockResolvedValue({
        signals: [
          {
            id: 'sig_2',
            name: 'Young Adults',
            provider: 'liveramp',
            category: 'demographic',
            cpm: 3.5,
            reach: 500000,
            confidence: 0.9
          }
        ]
      });

      const query: SignalQuery = {
        categories: [SignalCategory.DEMOGRAPHIC]
      };

      const signals = await signalsAPI.discover(query);

      expect(signals).toHaveLength(1);
      expect(signals[0].category).toBe(SignalCategory.DEMOGRAPHIC);
    });

    it('should discover signals with provider filter', async () => {
      vi.spyOn(mcpClient, 'request').mockResolvedValue({
        signals: [
          {
            id: 'sig_3',
            name: 'Premium Audience',
            provider: 'nielsen',
            category: 'contextual',
            cpm: 8.0,
            reach: 2000000,
            confidence: 0.95
          }
        ]
      });

      const query: SignalQuery = {
        text: 'premium',
        providers: [SignalProvider.NIELSEN]
      };

      const signals = await signalsAPI.discover(query);

      expect(signals).toHaveLength(1);
      expect(signals[0].provider).toBe(SignalProvider.NIELSEN);
    });

    it('should discover signals with price range filter', async () => {
      vi.spyOn(mcpClient, 'request').mockResolvedValue({
        signals: []
      });

      const query: SignalQuery = {
        text: 'audience',
        priceRange: { min: 2.0, max: 5.0 }
      };

      await signalsAPI.discover(query);

      expect(mcpClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'signals.discover',
          params: expect.objectContaining({
            priceRange: { min: 2.0, max: 5.0 }
          })
        })
      );
    });

    it('should discover signals with reach filters', async () => {
      vi.spyOn(mcpClient, 'request').mockResolvedValue({
        signals: []
      });

      const query: SignalQuery = {
        text: 'audience',
        minReach: 100000,
        maxReach: 1000000
      };

      await signalsAPI.discover(query);

      expect(mcpClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            minReach: 100000,
            maxReach: 1000000
          })
        })
      );
    });

    it('should throw error for invalid query', async () => {
      const query: SignalQuery = {};

      await expect(signalsAPI.discover(query)).rejects.toThrow();
    });

    it('should throw error for invalid price range', async () => {
      const query: SignalQuery = {
        text: 'test',
        priceRange: { min: 10, max: 5 }
      };

      await expect(signalsAPI.discover(query)).rejects.toThrow();
    });

    it('should throw error for invalid reach range', async () => {
      const query: SignalQuery = {
        text: 'test',
        minReach: 1000000,
        maxReach: 100000
      };

      await expect(signalsAPI.discover(query)).rejects.toThrow();
    });

    it('should handle empty results', async () => {
      vi.spyOn(mcpClient, 'request').mockResolvedValue({
        signals: []
      });

      const query: SignalQuery = {
        text: 'nonexistent'
      };

      const signals = await signalsAPI.discover(query);

      expect(signals).toHaveLength(0);
    });
  });

  describe('activate', () => {
    it('should activate signal successfully', async () => {
      vi.spyOn(mcpClient, 'request').mockResolvedValue({
        activation: {
          id: 'act_1',
          signalId: 'sig_1',
          status: 'active',
          cost: 100.0,
          reach: 500000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 86400000).toISOString()
        }
      });

      const config: ActivationConfig = {
        budget: 100.0,
        duration: {
          days: 7
        }
      };

      const activation = await signalsAPI.activate('sig_1', config);

      expect(activation.id).toBe('act_1');
      expect(activation.signalId).toBe('sig_1');
      expect(activation.status).toBe(ActivationStatus.ACTIVE);
      expect(activation.cost).toBe(100.0);
    });

    it('should activate signal with targeting config', async () => {
      vi.spyOn(mcpClient, 'request').mockResolvedValue({
        activation: {
          id: 'act_2',
          signalId: 'sig_2',
          status: 'pending',
          cost: 50.0,
          reach: 250000
        }
      });

      const config: ActivationConfig = {
        budget: 50.0,
        duration: {
          hours: 24
        },
        targeting: {
          demographics: {
            ageRange: { min: 25, max: 45 }
          },
          geography: {
            countries: ['US', 'CA']
          }
        }
      };

      const activation = await signalsAPI.activate('sig_2', config);

      expect(activation.id).toBe('act_2');
      expect(activation.status).toBe(ActivationStatus.PENDING);
    });

    it('should throw error for invalid signal ID', async () => {
      const config: ActivationConfig = {
        budget: 100.0,
        duration: { days: 7 }
      };

      await expect(signalsAPI.activate('', config)).rejects.toThrow();
      await expect(signalsAPI.activate('   ', config)).rejects.toThrow();
    });

    it('should throw error for invalid budget', async () => {
      const config: ActivationConfig = {
        budget: 0,
        duration: { days: 7 }
      };

      await expect(signalsAPI.activate('sig_1', config)).rejects.toThrow();
    });

    it('should throw error for missing duration', async () => {
      const config: ActivationConfig = {
        budget: 100.0,
        duration: {}
      };

      await expect(signalsAPI.activate('sig_1', config)).rejects.toThrow();
    });

    it('should throw error for invalid date range', async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 86400000);

      const config: ActivationConfig = {
        budget: 100.0,
        duration: {
          startDate: now,
          endDate: past
        }
      };

      await expect(signalsAPI.activate('sig_1', config)).rejects.toThrow();
    });
  });

  describe('getStatus', () => {
    it('should get activation status', async () => {
      vi.spyOn(mcpClient, 'request').mockResolvedValue({
        activation: {
          id: 'act_1',
          signalId: 'sig_1',
          status: 'active',
          cost: 100.0,
          reach: 500000,
          performance: {
            impressions: 50000,
            clicks: 500,
            conversions: 25,
            ctr: 0.01,
            cpa: 4.0
          }
        }
      });

      const activation = await signalsAPI.getStatus('act_1');

      expect(activation.id).toBe('act_1');
      expect(activation.status).toBe(ActivationStatus.ACTIVE);
      expect(activation.performance).toBeDefined();
      expect(activation.performance?.impressions).toBe(50000);
      expect(activation.performance?.clicks).toBe(500);
    });

    it('should throw error for invalid activation ID', async () => {
      await expect(signalsAPI.getStatus('')).rejects.toThrow();
      await expect(signalsAPI.getStatus('   ')).rejects.toThrow();
    });
  });

  describe('deactivate', () => {
    it('should deactivate signal successfully', async () => {
      vi.spyOn(mcpClient, 'request').mockResolvedValue({
        success: true
      });

      await expect(signalsAPI.deactivate('act_1')).resolves.not.toThrow();

      expect(mcpClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'signals.deactivate',
          params: expect.objectContaining({
            activationId: 'act_1'
          })
        })
      );
    });

    it('should throw error for invalid activation ID', async () => {
      await expect(signalsAPI.deactivate('')).rejects.toThrow();
      await expect(signalsAPI.deactivate('   ')).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle MCP client errors', async () => {
      vi.spyOn(mcpClient, 'request').mockRejectedValue(
        new Error('Network error')
      );

      const query: SignalQuery = {
        text: 'test'
      };

      await expect(signalsAPI.discover(query)).rejects.toThrow('Network error');
    });

    it('should handle authentication errors', async () => {
      vi.spyOn(authManager, 'getToken').mockRejectedValue(
        new Error('Invalid API key')
      );

      const query: SignalQuery = {
        text: 'test'
      };

      await expect(signalsAPI.discover(query)).rejects.toThrow('Invalid API key');
    });
  });
});
