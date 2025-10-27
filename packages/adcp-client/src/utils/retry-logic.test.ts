/**
 * Tests for retry logic and circuit breaker
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RetryHandler, CircuitBreaker, CircuitState } from './retry-logic';
import { ADCPError, ADCPErrorCode } from './error-handler';
import { Logger } from './logger';

describe('RetryHandler', () => {
  let retryHandler: RetryHandler;
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger({ enableConsole: false });
    retryHandler = new RetryHandler({
      maxAttempts: 3,
      initialDelay: 10,
      maxDelay: 100
    }, logger);
  });

  it('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    
    const result = await retryHandler.execute(fn);
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable errors', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new ADCPError('Timeout', ADCPErrorCode.TIMEOUT))
      .mockResolvedValue('success');
    
    const result = await retryHandler.execute(fn);
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should not retry on non-retryable errors', async () => {
    const fn = vi.fn()
      .mockRejectedValue(new ADCPError('Invalid', ADCPErrorCode.INVALID_REQUEST));
    
    await expect(retryHandler.execute(fn)).rejects.toThrow('Invalid');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should exhaust retries and throw last error', async () => {
    const fn = vi.fn()
      .mockRejectedValue(new ADCPError('Timeout', ADCPErrorCode.TIMEOUT));
    
    await expect(retryHandler.execute(fn)).rejects.toThrow('Timeout');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should respect rate limit retry-after', async () => {
    const error = new ADCPError(
      'Rate limited',
      ADCPErrorCode.RATE_LIMIT_EXCEEDED,
      { retryAfter: 0.05 } // 50ms for faster test
    );
    
    const fn = vi.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue('success');
    
    const startTime = Date.now();
    await retryHandler.execute(fn);
    const duration = Date.now() - startTime;
    
    expect(duration).toBeGreaterThanOrEqual(50);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should apply exponential backoff', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new ADCPError('Timeout', ADCPErrorCode.TIMEOUT))
      .mockRejectedValueOnce(new ADCPError('Timeout', ADCPErrorCode.TIMEOUT))
      .mockResolvedValue('success');
    
    const startTime = Date.now();
    await retryHandler.execute(fn);
    const duration = Date.now() - startTime;
    
    // Should wait at least initialDelay + (initialDelay * backoffMultiplier)
    expect(duration).toBeGreaterThanOrEqual(10);
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger({ enableConsole: false });
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 100
    }, logger);
  });

  it('should start in closed state', () => {
    expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
  });

  it('should execute successfully in closed state', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    
    const result = await circuitBreaker.execute(fn);
    
    expect(result).toBe('success');
    expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
  });

  it('should open after threshold failures', async () => {
    const fn = vi.fn()
      .mockRejectedValue(new ADCPError('Down', ADCPErrorCode.PLATFORM_UNAVAILABLE));
    
    // Trigger failures
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(fn)).rejects.toThrow();
    }
    
    expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
  });

  it('should reject immediately when open', async () => {
    const fn = vi.fn()
      .mockRejectedValue(new ADCPError('Down', ADCPErrorCode.PLATFORM_UNAVAILABLE));
    
    // Open the circuit
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(fn)).rejects.toThrow();
    }
    
    // Should reject without calling function
    const callCount = fn.mock.calls.length;
    await expect(circuitBreaker.execute(fn)).rejects.toThrow('Circuit breaker is open');
    expect(fn).toHaveBeenCalledTimes(callCount);
  });

  it('should transition to half-open after timeout', async () => {
    const fn = vi.fn()
      .mockRejectedValue(new ADCPError('Down', ADCPErrorCode.PLATFORM_UNAVAILABLE));
    
    // Open the circuit
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(fn)).rejects.toThrow();
    }
    
    expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
    
    // Wait for reset timeout
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Next call should transition to half-open
    fn.mockResolvedValue('success');
    await circuitBreaker.execute(fn);
    
    expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
  });

  it('should close after successful execution in half-open', async () => {
    const fn = vi.fn()
      .mockRejectedValue(new ADCPError('Down', ADCPErrorCode.PLATFORM_UNAVAILABLE));
    
    // Open the circuit
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(fn)).rejects.toThrow();
    }
    
    // Wait for reset timeout
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Successful execution should close circuit
    fn.mockResolvedValue('success');
    await circuitBreaker.execute(fn);
    
    expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
  });

  it('should not count non-platform errors', async () => {
    const fn = vi.fn()
      .mockRejectedValue(new ADCPError('Invalid', ADCPErrorCode.INVALID_REQUEST));
    
    // These failures should not open the circuit
    for (let i = 0; i < 5; i++) {
      await expect(circuitBreaker.execute(fn)).rejects.toThrow();
    }
    
    expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
  });

  it('should provide circuit statistics', () => {
    const stats = circuitBreaker.getStats();
    
    expect(stats.state).toBe(CircuitState.CLOSED);
    expect(stats.failureCount).toBe(0);
    expect(stats.successCount).toBe(0);
  });

  it('should allow manual reset', async () => {
    const fn = vi.fn()
      .mockRejectedValue(new ADCPError('Down', ADCPErrorCode.PLATFORM_UNAVAILABLE));
    
    // Open the circuit
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(fn)).rejects.toThrow();
    }
    
    expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
    
    // Manual reset
    circuitBreaker.reset();
    
    expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
  });
});
