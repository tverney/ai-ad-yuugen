/**
 * Retry logic with exponential backoff and circuit breaker
 */

import { ADCPError, ADCPErrorCode, ErrorHandler } from './error-handler';
import { Logger } from './logger';

export interface RetryConfig {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: ADCPErrorCode[];
}

export interface CircuitBreakerConfig {
  failureThreshold?: number;
  resetTimeout?: number;
  monitoringPeriod?: number;
}

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

/**
 * Retry handler with exponential backoff
 */
export class RetryHandler {
  private config: Required<RetryConfig>;
  private logger: Logger;

  constructor(config: RetryConfig = {}, logger: Logger) {
    this.config = {
      maxAttempts: config.maxAttempts || 3,
      initialDelay: config.initialDelay || 100,
      maxDelay: config.maxDelay || 5000,
      backoffMultiplier: config.backoffMultiplier || 2,
      retryableErrors: config.retryableErrors || [
        ADCPErrorCode.CONNECTION_FAILED,
        ADCPErrorCode.TIMEOUT,
        ADCPErrorCode.PLATFORM_UNAVAILABLE,
        ADCPErrorCode.RATE_LIMIT_EXCEEDED
      ]
    };
    this.logger = logger;
  }

  /**
   * Execute function with retry logic
   */
  async execute<T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<T> {
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < this.config.maxAttempts) {
      try {
        attempt++;
        
        if (attempt > 1) {
          this.logger.debug('Retry attempt', { attempt, context });
        }

        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable
        if (!this.shouldRetry(error, attempt)) {
          this.logger.debug('Error not retryable', { 
            error: ErrorHandler.formatError(error),
            attempt,
            context 
          });
          throw error;
        }

        // Calculate delay
        const delay = this.calculateDelay(attempt, error);
        
        this.logger.warn('Operation failed, retrying', {
          attempt,
          maxAttempts: this.config.maxAttempts,
          delay,
          error: ErrorHandler.formatError(error),
          context
        });

        // Wait before retry
        await this.sleep(delay);
      }
    }

    // All retries exhausted
    this.logger.error('All retry attempts exhausted', {
      attempts: this.config.maxAttempts,
      context,
      lastError: ErrorHandler.formatError(lastError)
    });

    throw lastError || new ADCPError(
      'Operation failed after all retry attempts',
      ADCPErrorCode.INTERNAL_ERROR
    );
  }

  /**
   * Determine if error should be retried
   */
  private shouldRetry(error: unknown, attempt: number): boolean {
    // Don't retry if max attempts reached
    if (attempt >= this.config.maxAttempts) {
      return false;
    }

    // Check if error is retryable
    if (error instanceof ADCPError) {
      return this.config.retryableErrors.includes(error.code);
    }

    return false;
  }

  /**
   * Calculate delay with exponential backoff
   */
  private calculateDelay(attempt: number, error: unknown): number {
    // Check for rate limit Retry-After header
    if (error instanceof ADCPError) {
      const retryAfter = ErrorHandler.getRetryAfter(error);
      if (retryAfter !== null) {
        return Math.min(retryAfter, this.config.maxDelay);
      }
    }

    // Exponential backoff: initialDelay * (multiplier ^ (attempt - 1))
    const delay = this.config.initialDelay * Math.pow(
      this.config.backoffMultiplier,
      attempt - 1
    );

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * delay;

    return Math.min(delay + jitter, this.config.maxDelay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Circuit breaker to prevent cascading failures
 */
export class CircuitBreaker {
  private config: Required<CircuitBreakerConfig>;
  private logger: Logger;
  private state: CircuitState;
  private failureCount: number;
  private lastFailureTime: Date | null;
  private successCount: number;

  constructor(config: CircuitBreakerConfig = {}, logger: Logger) {
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      resetTimeout: config.resetTimeout || 60000, // 1 minute
      monitoringPeriod: config.monitoringPeriod || 10000 // 10 seconds
    };
    this.logger = logger;
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<T> {
    // Check circuit state
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.logger.info('Circuit breaker transitioning to half-open', { context });
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new ADCPError(
          'Circuit breaker is open',
          ADCPErrorCode.PLATFORM_UNAVAILABLE,
          { 
            state: this.state,
            failureCount: this.failureCount,
            context 
          }
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess(context);
      return result;
    } catch (error) {
      this.onFailure(error, context);
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(context?: string): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      
      // Reset circuit after successful execution in half-open state
      this.logger.info('Circuit breaker closing', { 
        successCount: this.successCount,
        context 
      });
      this.state = CircuitState.CLOSED;
      this.successCount = 0;
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(error: unknown, context?: string): void {
    // Only count platform failures
    if (!ErrorHandler.isPlatformUnavailable(error)) {
      return;
    }

    this.failureCount++;
    this.lastFailureTime = new Date();

    this.logger.warn('Circuit breaker failure recorded', {
      failureCount: this.failureCount,
      threshold: this.config.failureThreshold,
      state: this.state,
      context
    });

    // Open circuit if threshold exceeded
    if (this.failureCount >= this.config.failureThreshold) {
      this.logger.error('Circuit breaker opening', {
        failureCount: this.failureCount,
        context
      });
      this.state = CircuitState.OPEN;
    }
  }

  /**
   * Check if circuit should attempt reset
   */
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) {
      return false;
    }

    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceLastFailure >= this.config.resetTimeout;
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit statistics
   */
  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime
    };
  }

  /**
   * Manually reset circuit
   */
  reset(): void {
    this.logger.info('Circuit breaker manually reset');
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }
}
