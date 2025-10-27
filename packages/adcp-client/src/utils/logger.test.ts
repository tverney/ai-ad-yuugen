/**
 * Tests for logger
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Logger, LogLevel, createLogger } from './logger';

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger({ enableConsole: false });
  });

  it('should create logger with default config', () => {
    const defaultLogger = createLogger();
    expect(defaultLogger).toBeInstanceOf(Logger);
    expect(defaultLogger.getLevel()).toBe(LogLevel.INFO);
  });

  it('should log debug messages', () => {
    logger.setLevel(LogLevel.DEBUG);
    logger.debug('Debug message', { test: true });
    
    const logs = logger.getRecentLogs(1);
    expect(logs[0].level).toBe(LogLevel.DEBUG);
    expect(logs[0].message).toBe('Debug message');
    expect(logs[0].context).toEqual({ test: true });
  });

  it('should log info messages', () => {
    logger.info('Info message');
    
    const logs = logger.getRecentLogs(1);
    expect(logs[0].level).toBe(LogLevel.INFO);
    expect(logs[0].message).toBe('Info message');
  });

  it('should log warning messages', () => {
    logger.warn('Warning message');
    
    const logs = logger.getRecentLogs(1);
    expect(logs[0].level).toBe(LogLevel.WARN);
    expect(logs[0].message).toBe('Warning message');
  });

  it('should log error messages', () => {
    logger.error('Error message');
    
    const logs = logger.getRecentLogs(1);
    expect(logs[0].level).toBe(LogLevel.ERROR);
    expect(logs[0].message).toBe('Error message');
  });

  it('should respect log level filtering', () => {
    logger.setLevel(LogLevel.WARN);
    
    logger.debug('Debug');
    logger.info('Info');
    logger.warn('Warn');
    logger.error('Error');
    
    const logs = logger.getRecentLogs();
    expect(logs.length).toBe(2);
    expect(logs[0].level).toBe(LogLevel.WARN);
    expect(logs[1].level).toBe(LogLevel.ERROR);
  });

  it('should log request details', () => {
    logger.logRequest('test.method', { param: 'value' });
    
    const logs = logger.getRecentLogs(1);
    expect(logs[0].message).toBe('Request');
    expect(logs[0].context?.method).toBe('test.method');
    expect(logs[0].context?.params).toEqual({ param: 'value' });
  });

  it('should log response details', () => {
    logger.logResponse('test.method', true, 150);
    
    const logs = logger.getRecentLogs(1);
    expect(logs[0].message).toBe('Response');
    expect(logs[0].context?.method).toBe('test.method');
    expect(logs[0].context?.success).toBe(true);
    expect(logs[0].context?.duration).toBe('150ms');
  });

  it('should log performance metrics', () => {
    logger.logPerformance('test.operation', 250);
    
    const logs = logger.getRecentLogs(1);
    expect(logs[0].message).toBe('Performance');
    expect(logs[0].context?.operation).toBe('test.operation');
    expect(logs[0].context?.duration).toBe('250ms');
  });

  it('should get logs by level', () => {
    logger.info('Info 1');
    logger.warn('Warn 1');
    logger.info('Info 2');
    logger.error('Error 1');
    
    const infoLogs = logger.getLogsByLevel(LogLevel.INFO);
    expect(infoLogs.length).toBe(2);
    expect(infoLogs.every(log => log.level === LogLevel.INFO)).toBe(true);
  });

  it('should get log statistics', () => {
    logger.info('Info');
    logger.warn('Warn');
    logger.error('Error');
    
    const stats = logger.getStats();
    expect(stats.total).toBe(3);
    expect(stats.byLevel.info).toBe(1);
    expect(stats.byLevel.warn).toBe(1);
    expect(stats.byLevel.error).toBe(1);
  });

  it('should clear log buffer', () => {
    logger.info('Test');
    expect(logger.getRecentLogs().length).toBe(1);
    
    logger.clearBuffer();
    expect(logger.getRecentLogs().length).toBe(0);
  });

  it('should create child logger with context', () => {
    const childLogger = logger.child({ component: 'test' });
    childLogger.info('Child message');
    
    const logs = logger.getRecentLogs(1);
    expect(logs[0].context?.component).toBe('test');
  });

  it('should limit buffer size', () => {
    // Create logger with small buffer for testing
    const smallLogger = new Logger({ enableConsole: false });
    
    // Add more than max buffer size
    for (let i = 0; i < 1100; i++) {
      smallLogger.info(`Message ${i}`);
    }
    
    const logs = smallLogger.getRecentLogs();
    expect(logs.length).toBeLessThanOrEqual(1000);
  });
});
