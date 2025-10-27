import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  Logger,
  LogLevel,
  DEFAULT_LOGGER_CONFIG,
  logger,
  sdkLogger,
  adServingLogger,
  privacyLogger,
  analyticsLogger,
  networkLogger
} from '../logger';

// Mock fetch for testing
global.fetch = vi.fn();

describe('Logger', () => {
  let testLogger: Logger;
  let mockConsole: any;

  beforeEach(() => {
    testLogger = new Logger();
    mockConsole = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    };
    global.console = mockConsole;
    vi.clearAllMocks();
  });

  afterEach(() => {
    testLogger.destroy();
  });

  describe('Log Levels', () => {
    it('should log debug messages when level is DEBUG', () => {
      const logger = new Logger({ level: LogLevel.DEBUG });
      logger.debug('Debug message', { data: 'test' });

      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] [general]'),
        'Debug message',
        { data: 'test' }
      );

      logger.destroy();
    });

    it('should log info messages when level is INFO or lower', () => {
      const logger = new Logger({ level: LogLevel.INFO });
      logger.info('Info message');

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] [general]'),
        'Info message',
        undefined
      );

      logger.destroy();
    });

    it('should log warning messages when level is WARN or lower', () => {
      const logger = new Logger({ level: LogLevel.WARN });
      logger.warn('Warning message');

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] [general]'),
        'Warning message',
        undefined
      );

      logger.destroy();
    });

    it('should log error messages when level is ERROR or lower', () => {
      const logger = new Logger({ level: LogLevel.ERROR });
      logger.error('Error message');

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] [general]'),
        'Error message',
        undefined
      );

      logger.destroy();
    });

    it('should log critical messages at any level', () => {
      const logger = new Logger({ level: LogLevel.CRITICAL });
      logger.critical('Critical message');

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('🚨 CRITICAL:'),
        expect.stringContaining('[CRITICAL] [general]'),
        'Critical message',
        undefined
      );

      logger.destroy();
    });

    it('should not log messages below configured level', () => {
      const logger = new Logger({ level: LogLevel.ERROR });
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');

      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();

      logger.destroy();
    });
  });

  describe('Categories', () => {
    it('should include category in log output', () => {
      testLogger.info('Test message', null, 'test-category');

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[test-category]'),
        'Test message',
        null
      );
    });

    it('should use default category when none specified', () => {
      testLogger.info('Test message');

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[general]'),
        'Test message',
        undefined
      );
    });
  });

  describe('Console Logging', () => {
    it('should not log to console when disabled', () => {
      const logger = new Logger({ enableConsole: false });
      logger.error('Error message');

      expect(mockConsole.error).not.toHaveBeenCalled();

      logger.destroy();
    });

    it('should include stack trace for errors when enabled', () => {
      const logger = new Logger({ includeStackTrace: true });
      const error = new Error('Test error');
      logger.error('Error occurred', error);

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        'Error occurred',
        error
      );
      expect(mockConsole.error).toHaveBeenCalledWith('Stack trace:', error.stack);

      logger.destroy();
    });

    it('should format timestamps correctly', () => {
      testLogger.info('Test message');

      const call = mockConsole.info.mock.calls[0];
      const logPrefix = call[0];
      
      // Should contain ISO timestamp format
      expect(logPrefix).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    });
  });

  describe('Remote Logging', () => {
    it('should batch and send logs to remote endpoint', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue(new Response('OK', { status: 200 }));

      const logger = new Logger({
        enableRemote: true,
        remoteEndpoint: 'https://api.example.com/logs',
        batchSize: 2,
        flushInterval: 1000
      });

      logger.info('Log message 1');
      logger.info('Log message 2');

      // Wait for async logging
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/logs',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Log message 1')
        })
      );

      logger.destroy();
    });

    it('should handle remote logging failures gracefully', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValue(new Error('Network error'));

      const logger = new Logger({
        enableRemote: true,
        remoteEndpoint: 'https://api.example.com/logs',
        batchSize: 1
      });

      logger.error('Test error');

      // Wait for async logging attempt
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not throw, should handle gracefully
      expect(mockConsole.error).toHaveBeenCalledWith(
        'Failed to send logs to remote endpoint:',
        expect.any(Error)
      );

      logger.destroy();
    });

    it('should flush logs on timer interval', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue(new Response('OK', { status: 200 }));

      const logger = new Logger({
        enableRemote: true,
        remoteEndpoint: 'https://api.example.com/logs',
        batchSize: 10,
        flushInterval: 50 // Short interval for testing
      });

      logger.info('Test log');

      // Wait for flush interval
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFetch).toHaveBeenCalled();

      logger.destroy();
    });

    it('should not send logs when remote logging is disabled', async () => {
      const mockFetch = vi.mocked(fetch);

      const logger = new Logger({
        enableRemote: false,
        remoteEndpoint: 'https://api.example.com/logs'
      });

      logger.info('Test log');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFetch).not.toHaveBeenCalled();

      logger.destroy();
    });
  });

  describe('Child Loggers', () => {
    it('should create child logger with specific category', () => {
      const childLogger = testLogger.child('child-category');
      childLogger.info('Child message');

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[child-category]'),
        'Child message',
        undefined
      );
    });

    it('should inherit parent configuration', () => {
      const parentLogger = new Logger({ level: LogLevel.WARN });
      const childLogger = parentLogger.child('child');

      childLogger.info('Info message'); // Should not log
      childLogger.warn('Warning message'); // Should log

      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalled();

      parentLogger.destroy();
    });
  });

  describe('Default Logger Instances', () => {
    it('should provide default logger instance', () => {
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should provide category-specific loggers', () => {
      expect(sdkLogger).toBeInstanceOf(Logger);
      expect(adServingLogger).toBeInstanceOf(Logger);
      expect(privacyLogger).toBeInstanceOf(Logger);
      expect(analyticsLogger).toBeInstanceOf(Logger);
      expect(networkLogger).toBeInstanceOf(Logger);
    });

    it('should use correct categories for specialized loggers', () => {
      sdkLogger.info('SDK message');
      adServingLogger.info('Ad serving message');
      privacyLogger.info('Privacy message');
      analyticsLogger.info('Analytics message');
      networkLogger.info('Network message');

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[sdk]'),
        'SDK message',
        undefined
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[ad-serving]'),
        'Ad serving message',
        undefined
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[privacy]'),
        'Privacy message',
        undefined
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[analytics]'),
        'Analytics message',
        undefined
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[network]'),
        'Network message',
        undefined
      );
    });
  });

  describe('Configuration', () => {
    it('should use default configuration when none provided', () => {
      const logger = new Logger();
      expect(logger).toBeDefined();
      logger.destroy();
    });

    it('should merge custom configuration with defaults', () => {
      const customConfig = {
        level: LogLevel.DEBUG,
        enableConsole: false,
        batchSize: 100
      };

      const logger = new Logger(customConfig);
      expect(logger).toBeDefined();
      logger.destroy();
    });

    it('should validate default configuration values', () => {
      expect(DEFAULT_LOGGER_CONFIG.level).toBe(LogLevel.INFO);
      expect(DEFAULT_LOGGER_CONFIG.enableConsole).toBe(true);
      expect(DEFAULT_LOGGER_CONFIG.enableRemote).toBe(false);
      expect(DEFAULT_LOGGER_CONFIG.batchSize).toBe(50);
      expect(DEFAULT_LOGGER_CONFIG.flushInterval).toBe(30000);
      expect(DEFAULT_LOGGER_CONFIG.includeStackTrace).toBe(false);
    });
  });

  describe('User Context', () => {
    it('should allow setting user context', () => {
      expect(() => testLogger.setUserContext('user123', 'session456')).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources on destroy', () => {
      const logger = new Logger({
        enableRemote: true,
        remoteEndpoint: 'https://api.example.com/logs'
      });

      expect(() => logger.destroy()).not.toThrow();
    });

    it('should flush remaining logs on destroy', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue(new Response('OK', { status: 200 }));

      const logger = new Logger({
        enableRemote: true,
        remoteEndpoint: 'https://api.example.com/logs',
        batchSize: 10 // High batch size to prevent auto-flush
      });

      logger.info('Test log');
      logger.destroy();

      // Wait for destroy flush
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFetch).toHaveBeenCalled();
    });
  });
});