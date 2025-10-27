/**
 * Tests for Signal Discovery
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SignalDiscovery } from './signal-discovery';
import { MCPClient } from '../../client/mcp-client';
import { Logger } from '../../utils/logger';
import { SignalQuery, SignalProvider, SignalCategory } from '../../types/signal-types';

describe('SignalDiscovery', () => {
  let discovery: SignalDiscovery;
  let mcpClient: MCPClient;
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger({ enableConsole: false });
    mcpClient = new MCPClient({
      serverUrl: 'http://test.example.com',
      timeout: 5000
    }, logger);
    
    discovery = new SignalDiscovery(mcpClient, logger);
  });

  afterEach(async () => {
    await mcpClient.destroy();
  });

  describe('discover', () => {
    it('should discover signals with single provider', async () => {
      const mockSignals = [
        {
          id: 'sig_1',
          name: 'Test Signal',
          description: 'Test description',
          provider: 'scope3',
          category: 'behavioral',
          cpm: 5.0,
          reach: 1000000,
          confidence: 0.85,
          metadata: {
            topics: ['tech']
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      vi.spyOn(mcpClient, 'request').mockResolvedValue({
        signals: mockSignals
      });

      const query: SignalQuery = {
        text: 'technology',
        providers: [SignalProvider.SCOPE3]
      };

      const signals = await discovery.discover(query, 'test-api-key');

      expect(signals).toHaveLength(1);
      expect(signals[0].id).toBe('sig_1');
      expect(signals[0].provider).toBe(SignalProvider.SCOPE3);
    });

    it('should handle multi-provider queries', async () => {
      const scope3Signals = [
        {
          id: 'sig_1',
          name: 'Scope3 Signal',
          provider: 'scope3',
          category: 'behavioral',
          cpm: 5.0,
          reach: 1000000,
          confidence: 0.85
        }
      ];

      const liveRampSignals = [
        {
          id: 'sig_2',
          name: 'LiveRamp Signal',
          provider: 'liveramp',
          category: 'demographic',
          cpm: 4.0,
          reach: 800000,
          confidence: 0.9
        }
      ];

      vi.spyOn(mcpClient, 'request')
        .mockResolvedValueOnce({ signals: scope3Signals })
        .mockResolvedValueOnce({ signals: liveRampSignals });

      const query: SignalQuery = {
        text: 'audience',
        providers: [SignalProvider.SCOPE3, SignalProvider.LIVERAMP]
      };

      const signals = await discovery.discover(query, 'test-api-key');

      expect(signals).toHaveLength(2);
      expect(signals.some(s => s.provider === SignalProvider.SCOPE3)).toBe(true);
      expect(signals.some(s => s.provider === SignalProvider.LIVERAMP)).toBe(true);
    });

    it('should handle partial provider failures in multi-provider query', async () => {
      const scope3Signals = [
        {
          id: 'sig_1',
          name: 'Scope3 Signal',
          provider: 'scope3',
          category: 'behavioral',
          cpm: 5.0,
          reach: 1000000,
          confidence: 0.85
        }
      ];

      vi.spyOn(mcpClient, 'request')
        .mockResolvedValueOnce({ signals: scope3Signals })
        .mockRejectedValueOnce(new Error('Provider unavailable'));

      const query: SignalQuery = {
        text: 'audience',
        providers: [SignalProvider.SCOPE3, SignalProvider.LIVERAMP]
      };

      const signals = await discovery.discover(query, 'test-api-key');

      // Should return signals from successful provider
      expect(signals).toHaveLength(1);
      expect(signals[0].provider).toBe(SignalProvider.SCOPE3);
    });

    it('should throw error when all providers fail', async () => {
      vi.spyOn(mcpClient, 'request')
        .mockRejectedValueOnce(new Error('Provider 1 failed'))
        .mockRejectedValueOnce(new Error('Provider 2 failed'));

      const query: SignalQuery = {
        text: 'audience',
        providers: [SignalProvider.SCOPE3, SignalProvider.LIVERAMP]
      };

      await expect(discovery.discover(query, 'test-api-key')).rejects.toThrow();
    });

    it('should parse signal metadata correctly', async () => {
      const mockSignals = [
        {
          id: 'sig_1',
          name: 'Rich Signal',
          provider: 'scope3',
          category: 'demographic',
          cpm: 5.0,
          reach: 1000000,
          confidence: 0.85,
          metadata: {
            topics: ['tech', 'gadgets'],
            intents: ['purchase'],
            demographics: {
              ageRange: { min: 25, max: 45 },
              gender: ['male', 'female'],
              income: { min: 50000, max: 100000 }
            },
            geography: {
              countries: ['US', 'CA'],
              regions: ['California', 'Ontario']
            },
            dataFreshness: 0.95,
            dataSource: 'first-party'
          }
        }
      ];

      vi.spyOn(mcpClient, 'request').mockResolvedValue({
        signals: mockSignals
      });

      const query: SignalQuery = {
        text: 'test'
      };

      const signals = await discovery.discover(query, 'test-api-key');

      expect(signals[0].metadata.topics).toEqual(['tech', 'gadgets']);
      expect(signals[0].metadata.intents).toEqual(['purchase']);
      expect(signals[0].metadata.demographics?.ageRange).toEqual({ min: 25, max: 45 });
      expect(signals[0].metadata.geography?.countries).toEqual(['US', 'CA']);
      expect(signals[0].metadata.dataFreshness).toBe(0.95);
    });

    it('should handle signals with missing optional fields', async () => {
      const mockSignals = [
        {
          id: 'sig_1',
          name: 'Minimal Signal',
          provider: 'scope3',
          cpm: 5.0,
          reach: 1000000
        }
      ];

      vi.spyOn(mcpClient, 'request').mockResolvedValue({
        signals: mockSignals
      });

      const query: SignalQuery = {
        text: 'test'
      };

      const signals = await discovery.discover(query, 'test-api-key');

      expect(signals).toHaveLength(1);
      expect(signals[0].description).toBe('');
      expect(signals[0].confidence).toBe(0.5);
    });

    it('should skip invalid signals in response', async () => {
      const mockSignals = [
        {
          id: 'sig_1',
          name: 'Valid Signal',
          provider: 'scope3',
          category: 'behavioral',
          cpm: 5.0,
          reach: 1000000,
          confidence: 0.85
        },
        {
          // Missing required fields
          name: 'Invalid Signal'
        },
        {
          id: 'sig_2',
          name: 'Another Valid Signal',
          provider: 'liveramp',
          category: 'demographic',
          cpm: 4.0,
          reach: 800000,
          confidence: 0.9
        }
      ];

      vi.spyOn(mcpClient, 'request').mockResolvedValue({
        signals: mockSignals
      });

      const query: SignalQuery = {
        text: 'test'
      };

      const signals = await discovery.discover(query, 'test-api-key');

      // Should only return valid signals
      expect(signals).toHaveLength(2);
      expect(signals[0].id).toBe('sig_1');
      expect(signals[1].id).toBe('sig_2');
    });

    it('should sort signals by quality', async () => {
      const mockSignals = [
        {
          id: 'sig_1',
          name: 'Low Quality',
          provider: 'scope3',
          category: 'behavioral',
          cpm: 5.0,
          reach: 100000,
          confidence: 0.5
        },
        {
          id: 'sig_2',
          name: 'High Quality',
          provider: 'scope3',
          category: 'behavioral',
          cpm: 5.0,
          reach: 1000000,
          confidence: 0.95
        },
        {
          id: 'sig_3',
          name: 'Medium Quality',
          provider: 'scope3',
          category: 'behavioral',
          cpm: 5.0,
          reach: 500000,
          confidence: 0.75
        }
      ];

      vi.spyOn(mcpClient, 'request')
        .mockResolvedValueOnce({ signals: [mockSignals[0]] })
        .mockResolvedValueOnce({ signals: [mockSignals[1]] })
        .mockResolvedValueOnce({ signals: [mockSignals[2]] });

      const query: SignalQuery = {
        text: 'test',
        providers: [SignalProvider.SCOPE3, SignalProvider.LIVERAMP, SignalProvider.NIELSEN]
      };

      const signals = await discovery.discover(query, 'test-api-key');

      // Should be sorted by quality (confidence + reach)
      expect(signals[0].id).toBe('sig_2'); // Highest quality
      expect(signals[2].id).toBe('sig_1'); // Lowest quality
    });

    it('should apply limit to multi-provider results', async () => {
      const scope3Signals = Array.from({ length: 30 }, (_, i) => ({
        id: `sig_scope3_${i}`,
        name: `Scope3 Signal ${i}`,
        provider: 'scope3',
        category: 'behavioral',
        cpm: 5.0,
        reach: 1000000,
        confidence: 0.85
      }));

      const liveRampSignals = Array.from({ length: 30 }, (_, i) => ({
        id: `sig_liveramp_${i}`,
        name: `LiveRamp Signal ${i}`,
        provider: 'liveramp',
        category: 'demographic',
        cpm: 4.0,
        reach: 800000,
        confidence: 0.9
      }));

      vi.spyOn(mcpClient, 'request')
        .mockResolvedValueOnce({ signals: scope3Signals })
        .mockResolvedValueOnce({ signals: liveRampSignals });

      const query: SignalQuery = {
        text: 'test',
        providers: [SignalProvider.SCOPE3, SignalProvider.LIVERAMP],
        limit: 25
      };

      const signals = await discovery.discover(query, 'test-api-key');

      expect(signals).toHaveLength(25);
    });
  });

  describe('provider parsing', () => {
    it('should parse known providers correctly', async () => {
      const providers = ['scope3', 'liveramp', 'nielsen', 'comscore'];
      
      for (const provider of providers) {
        const mockSignals = [{
          id: 'sig_1',
          name: 'Test',
          provider,
          category: 'behavioral',
          cpm: 5.0,
          reach: 1000000,
          confidence: 0.85
        }];

        vi.spyOn(mcpClient, 'request').mockResolvedValue({
          signals: mockSignals
        });

        const query: SignalQuery = { text: 'test' };
        const signals = await discovery.discover(query, 'test-api-key');

        expect(signals[0].provider).toBeDefined();
      }
    });
  });

  describe('category parsing', () => {
    it('should parse known categories correctly', async () => {
      const categories = ['demographic', 'behavioral', 'contextual', 'geographic', 'temporal'];
      
      for (const category of categories) {
        const mockSignals = [{
          id: 'sig_1',
          name: 'Test',
          provider: 'scope3',
          category,
          cpm: 5.0,
          reach: 1000000,
          confidence: 0.85
        }];

        vi.spyOn(mcpClient, 'request').mockResolvedValue({
          signals: mockSignals
        });

        const query: SignalQuery = { text: 'test' };
        const signals = await discovery.discover(query, 'test-api-key');

        expect(signals[0].category).toBeDefined();
      }
    });
  });
});
