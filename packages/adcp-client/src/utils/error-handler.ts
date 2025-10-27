/**
 * Error handling utilities for ADCP client
 */

/**
 * ADCP error codes
 */
export enum ADCPErrorCode {
  // Connection errors
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  TIMEOUT = 'TIMEOUT',
  
  // Authentication errors
  INVALID_API_KEY = 'INVALID_API_KEY',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Request errors
  INVALID_REQUEST = 'INVALID_REQUEST',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  SIGNAL_NOT_FOUND = 'SIGNAL_NOT_FOUND',
  INSUFFICIENT_BUDGET = 'INSUFFICIENT_BUDGET',
  
  // Platform errors
  PLATFORM_UNAVAILABLE = 'PLATFORM_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Internal errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  CACHE_ERROR = 'CACHE_ERROR'
}

/**
 * Custom error class for ADCP operations
 */
export class ADCPError extends Error {
  public readonly code: ADCPErrorCode;
  public readonly details?: any;
  public readonly timestamp: Date;
  public readonly retryable: boolean;

  constructor(
    message: string,
    code: ADCPErrorCode,
    details?: any
  ) {
    super(message);
    this.name = 'ADCPError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
    this.retryable = this.isRetryableError(code);

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ADCPError);
    }
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(code: ADCPErrorCode): boolean {
    const retryableCodes = [
      ADCPErrorCode.CONNECTION_FAILED,
      ADCPErrorCode.TIMEOUT,
      ADCPErrorCode.PLATFORM_UNAVAILABLE,
      ADCPErrorCode.RATE_LIMIT_EXCEEDED
    ];
    return retryableCodes.includes(code);
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      retryable: this.retryable,
      stack: this.stack
    };
  }

  /**
   * Create error from unknown error type
   */
  static fromError(error: unknown, defaultCode: ADCPErrorCode = ADCPErrorCode.INTERNAL_ERROR): ADCPError {
    if (error instanceof ADCPError) {
      return error;
    }

    if (error instanceof Error) {
      return new ADCPError(
        error.message,
        defaultCode,
        { originalError: error.name, stack: error.stack }
      );
    }

    return new ADCPError(
      String(error),
      defaultCode,
      { originalError: error }
    );
  }
}

/**
 * Error handler utility functions
 */
export class ErrorHandler {
  /**
   * Check if error is retryable
   */
  static isRetryable(error: unknown): boolean {
    if (error instanceof ADCPError) {
      return error.retryable;
    }
    return false;
  }

  /**
   * Get retry delay for rate limit errors
   */
  static getRetryAfter(error: ADCPError): number | null {
    if (error.code === ADCPErrorCode.RATE_LIMIT_EXCEEDED) {
      // Check for Retry-After header in details
      if (error.details?.retryAfter) {
        return error.details.retryAfter * 1000; // Convert to milliseconds
      }
    }
    return null;
  }

  /**
   * Format error for logging
   */
  static formatError(error: unknown): Record<string, any> {
    if (error instanceof ADCPError) {
      return error.toJSON();
    }

    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    return {
      error: String(error)
    };
  }

  /**
   * Check if error indicates platform unavailability
   */
  static isPlatformUnavailable(error: unknown): boolean {
    if (error instanceof ADCPError) {
      return error.code === ADCPErrorCode.PLATFORM_UNAVAILABLE;
    }
    return false;
  }

  /**
   * Check if error is authentication related
   */
  static isAuthError(error: unknown): boolean {
    if (error instanceof ADCPError) {
      return [
        ADCPErrorCode.INVALID_API_KEY,
        ADCPErrorCode.UNAUTHORIZED
      ].includes(error.code);
    }
    return false;
  }
}
