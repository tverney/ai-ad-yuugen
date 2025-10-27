/**
 * Tests for Signal Activation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SignalActivation } from './signal-activation';
import { MCPClient } from '../../client/mcp-client';
import { Logger } from '../../utils/logger';
import { ActivationConfig, ActivationStatus } from '../../types/signal-types';

describe('SignalActivation', () => {
  let activation: SignalActivation;
  let mcpClient: MCPClient;
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger({ enableConsole: false });
    mcpClient = new MCPClient({
      serverUrl: 'http://test.example.com',
      timeout: 5000
    }, logger);
    
    activation = new SignalActivation(mcpClient, logger);
  });

  afterEach(async () => {
    await mcpClient.destroy();
  });

  describe('activate', () => {
    it('should activate signal with basic config', async () => {
      const mockActivation = {
        id: 'act_1',
        signalId: 'sig_1',
        status: 'active',
        cost: 100.0,
        reach: 500000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString()
      };

      vi.spyOn(mcpClient, 'request').mockResolvedValue({
        activation: mockActivation
      });

      const config: ActivationConfig = {
        budget: 100.0,
        duration: {
          days: 7
        }
      };

      const result = await activation.activate('sig_1', config, 'test-api-key');

      expect(result.id).toBe('act_1');
      expect(result.signalId).toBe('sig_1');
      expect(result.status).toBe(ActivationStatus.ACTIVE);
      expect(result.cost).toBe(100.0);
      expect(result.reach).toBe(500000);
    });

    it('should activate signal with targeting config', async () => {
      const mockActivation = {
        id: 'act_2',
        signalId: 'sig_2',
        status: 'pending',
        cost: 50.0,
        reach: 250000
      };

      vi.spyOn(mcpClient, 'request').mockResolvedValue({
        activation: mockActivation
      });

      const config: ActivationConfig = {
        budget: 50.0,
        duration: {
          hours: 24
        },
        targeting: {
          demographics: {
            ageRange: { min: 25, max: 45 },
            gender: ['male', 'female'],
            income: { min: 50000, max: 100000 }
          },
          geography: {
            countries: ['US', 'CA'],
            regions: ['California']
          },
          frequency: {
            maxImpressions: 1000000,
            maxImpressionsPerUser: 5,
            timePeriod: '24h'
          }
        }
      };

      const result = await activation.activate('sig_2', config, 'test-api-key');

      expect(result.id).toBe('act_2');
      expect(result.status).toBe(ActivationStatus.PENDING);
    });

    it('should activate signal with date range', async () => {
      const mockActivation = {
        id: 'act_3',
        signalId: 'sig_3',
        status: 'pending',
        cost: 75.0,
        reach: 350000
      };

      vi.spyOn(mcpClient, 'request').mockResolvedValue({
        activation: mockActivation
      });

      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 7 * 86400000);

      const config: ActivationConfig = {
        budget: 75.0,
        duration: {
          startDate,
          endDate
        }
      };

      const result = await activation.activate('sig_3', config, 'test-api-key');

      expect(result.id).toBe('act_3');
      expect(mcpClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            duration: expect.objectContaining({
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString()
            })
          })
        })
      );
    });

    it('should track activated signals', async () => {
      const mockActivation = {
        id: 'act_1',
        signalId: 'sig_1',
        status: 'active',
        cost: 100.0,
        reach: 500000
      };

      vi.spyOn(mcpClient, 'request').mockResolvedValue({
        activation: mockActivation
      });

      const config: ActivationConfig = {
        budget: 100.0,
        duration: { days: 7 }
      };

      await activation.activate('sig_1', config, 'test-api-key');

      const tracked = activation.getTrackedActivation('act_1');
      expect(tracked).toBeDefined();
      expect(tracked?.id).toBe('act_1');
    });
  });

  describe('parseActivation', () => {
    it('should parse activation with performance data', () => {
      const raw = {
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
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString()
      };

      const result = activation.parseActivation(raw);

      expect(result.performance).toBeDefined();
      expect(result.performance?.impressions).toBe(50000);
      expect(result.performance?.clicks).toBe(500);
      expect(result.performance?.conversions).toBe(25);
      expect(result.performance?.ctr).toBe(0.01);
      expect(result.performance?.cpa).toBe(4.0);
    });

    it('should parse activation without performance data', () => {
      const raw = {
        id: 'act_1',
        signalId: 'sig_1',
        status: 'pending',
        cost: 100.0,
        reach: 500000
      };

      const result = activation.parseActivation(raw);

      expect(result.performance).toBeUndefined();
    });

    it('should parse all activation statuses', () => {
      const statuses = ['pending', 'active', 'paused', 'completed', 'failed', 'cancelled'];

      for (const status of statuses) {
        const raw = {
          id: 'act_1',
          signalId: 'sig_1',
          status,
          cost: 100.0,
          reach: 500000
        };

        const result = activation.parseActivation(raw);
        expect(result.status).toBeDefined();
      }
    });

    it('should throw error for missing required fields', () => {
      const raw = {
        id: 'act_1'
        // Missing signalId
      };

      expect(() => activation.parseActivation(raw)).toThrow();
    });
  });

  describe('lifecycle tracking', () => {
    it('should track multiple activations', async () => {
      const mockActivations = [
        {
          id: 'act_1',
          signalId: 'sig_1',
          status: 'active',
          cost: 100.0,
          reach: 500000
        },
        {
          id: 'act_2',
          signalId: 'sig_2',
          status: 'active',
          cost: 50.0,
          reach: 250000
        }
      ];

      vi.spyOn(mcpClient, 'request')
        .mockResolvedValueOnce({ activation: mockActivations[0] })
        .mockResolvedValueOnce({ activation: mockActivations[1] });

      const config: ActivationConfig = {
        budget: 100.0,
        duration: { days: 7 }
      };

      await activation.activate('sig_1', config, 'test-api-key');
      await activation.activate('sig_2', config, 'test-api-key');

      const tracked = activation.getTrackedActivations();
      expect(tracked).toHaveLength(2);
    });

    it('should update activation status', () => {
      const mockActivation = {
        id: 'act_1',
        signalId: 'sig_1',
        status: ActivationStatus.ACTIVE,
        cost: 100.0,
        reach: 500000,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000)
      };

      // Manually track an activation
      activation['activeActivations'].set('act_1', mockActivation);

      const updated = {
        ...mockActivation,
        status: ActivationStatus.COMPLETED
      };

      activation.updateActivationStatus('act_1', updated);

      const tracked = activation.getTrackedActivation('act_1');
      expect(tracked?.status).toBe(ActivationStatus.COMPLETED);
    });

    it('should remove activation from tracking', () => {
      const mockActivation = {
        id: 'act_1',
        signalId: 'sig_1',
        status: ActivationStatus.ACTIVE,
        cost: 100.0,
        reach: 500000,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000)
      };

      activation['activeActivations'].set('act_1', mockActivation);

      activation.removeActivation('act_1');

      const tracked = activation.getTrackedActivation('act_1');
      expect(tracked).toBeUndefined();
    });

    it('should provide activation statistics', async () => {
      const mockActivations = [
        {
          id: 'act_1',
          signalId: 'sig_1',
          status: 'active',
          cost: 100.0,
          reach: 500000
        },
        {
          id: 'act_2',
          signalId: 'sig_2',
          status: 'pending',
          cost: 50.0,
          reach: 250000
        },
        {
          id: 'act_3',
          signalId: 'sig_3',
          status: 'active',
          cost: 75.0,
          reach: 350000
        }
      ];

      vi.spyOn(mcpClient, 'request')
        .mockResolvedValueOnce({ activation: mockActivations[0] })
        .mockResolvedValueOnce({ activation: mockActivations[1] })
        .mockResolvedValueOnce({ activation: mockActivations[2] });

      const config: ActivationConfig = {
        budget: 100.0,
        duration: { days: 7 }
      };

      await activation.activate('sig_1', config, 'test-api-key');
      await activation.activate('sig_2', config, 'test-api-key');
      await activation.activate('sig_3', config, 'test-api-key');

      const stats = activation.getStats();

      expect(stats.total).toBe(3);
      expect(stats.byStatus[ActivationStatus.ACTIVE]).toBe(2);
      expect(stats.byStatus[ActivationStatus.PENDING]).toBe(1);
      expect(stats.totalCost).toBe(225.0);
      expect(stats.totalReach).toBe(1100000);
    });
  });

  describe('targeting normalization', () => {
    it('should normalize demographics with arrays', async () => {
      vi.spyOn(mcpClient, 'request').mockResolvedValue({
        activation: {
          id: 'act_1',
          signalId: 'sig_1',
          status: 'active',
          cost: 100.0,
          reach: 500000
        }
      });

      const config: ActivationConfig = {
        budget: 100.0,
        duration: { days: 7 },
        targeting: {
          demographics: {
            gender: ['male', 'female'],
            education: ['bachelor', 'master'],
            interests: ['tech', 'sports']
          }
        }
      };

      await activation.activate('sig_1', config, 'test-api-key');

      expect(mcpClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            targeting: expect.objectContaining({
              demographics: expect.objectContaining({
                gender: ['male', 'female'],
                education: ['bachelor', 'master'],
                interests: ['tech', 'sports']
              })
            })
          })
        })
      );
    });

    it('should normalize geography with arrays', async () => {
      vi.spyOn(mcpClient, 'request').mockResolvedValue({
        activation: {
          id: 'act_1',
          signalId: 'sig_1',
          status: 'active',
          cost: 100.0,
          reach: 500000
        }
      });

      const config: ActivationConfig = {
        budget: 100.0,
        duration: { days: 7 },
        targeting: {
          geography: {
            countries: ['US', 'CA'],
            regions: ['California', 'Ontario'],
            cities: ['San Francisco', 'Toronto']
          }
        }
      };

      await activation.activate('sig_1', config, 'test-api-key');

      expect(mcpClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            targeting: expect.objectContaining({
              geography: expect.objectContaining({
                countries: ['US', 'CA'],
                regions: ['California', 'Ontario'],
                cities: ['San Francisco', 'Toronto']
              })
            })
          })
        })
      );
    });
  });
});
