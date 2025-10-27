/**
 * Tests for error handler
 */

import { describe, it, expect } from 'vitest';
import { ADCPError, ADCPErrorCode, ErrorHandler } from './error-handler';

describe('ADCPError', () => {
  it('should create error with code and message', () => {
    const error = new ADCPError('Test error', ADCPErrorCode.CONNECTION_FAILED);
    
    expect(error.message).toBe('Test error');
    expect(error.code).toBe(ADCPErrorCode.CONNECTION_FAILED);
    expect(error.name).toBe('ADCPError');
  });

  it('should include details when provided', () => {
    const details = { requestId: '123', url: 'http://test.com' };
    const error = new ADCPError('Test error', ADCPErrorCode.TIMEOUT, details);
    
    expect(error.details).toEqual(details);
  });

  it('should mark retryable errors correctly', () => {
    const retryableError = new ADCPError('Timeout', ADCPErrorCode.TIMEOUT);
    const nonRetryableError = new ADCPError('Invalid', ADCPErrorCode.INVALID_REQUEST);
    
    expect(retryableError.retryable).toBe(true);
    expect(nonRetryableError.retryable).toBe(false);
  });

  it('should convert to JSON', () => {
    const error = new ADCPError('Test', ADCPErrorCode.CONNECTION_FAILED, { test: true });
    const json = error.toJSON();
    
    expect(json.name).toBe('ADCPError');
    expect(json.message).toBe('Test');
    expect(json.code).toBe(ADCPErrorCode.CONNECTION_FAILED);
    expect(json.details).toEqual({ test: true });
    expect(json.retryable).toBe(true);
  });

  it('should create from Error instance', () => {
    const originalError = new Error('Original error');
    const adcpError = ADCPError.fromError(originalError);
    
    expect(adcpError).toBeInstanceOf(ADCPError);
    expect(adcpError.message).toBe('Original error');
    expect(adcpError.code).toBe(ADCPErrorCode.INTERNAL_ERROR);
  });

  it('should preserve ADCPError when converting', () => {
    const originalError = new ADCPError('Test', ADCPErrorCode.TIMEOUT);
    const converted = ADCPError.fromError(originalError);
    
    expect(converted).toBe(originalError);
  });
});

describe('ErrorHandler', () => {
  it('should identify retryable errors', () => {
    const retryableError = new ADCPError('Timeout', ADCPErrorCode.TIMEOUT);
    const nonRetryableError = new ADCPError('Invalid', ADCPErrorCode.INVALID_REQUEST);
    
    expect(ErrorHandler.isRetryable(retryableError)).toBe(true);
    expect(ErrorHandler.isRetryable(nonRetryableError)).toBe(false);
  });

  it('should extract retry-after from rate limit errors', () => {
    const error = new ADCPError(
      'Rate limited',
      ADCPErrorCode.RATE_LIMIT_EXCEEDED,
      { retryAfter: 60 }
    );
    
    const retryAfter = ErrorHandler.getRetryAfter(error);
    expect(retryAfter).toBe(60000); // 60 seconds in milliseconds
  });

  it('should return null for non-rate-limit errors', () => {
    const error = new ADCPError('Timeout', ADCPErrorCode.TIMEOUT);
    
    const retryAfter = ErrorHandler.getRetryAfter(error);
    expect(retryAfter).toBeNull();
  });

  it('should format ADCPError for logging', () => {
    const error = new ADCPError('Test', ADCPErrorCode.CONNECTION_FAILED);
    const formatted = ErrorHandler.formatError(error);
    
    expect(formatted.name).toBe('ADCPError');
    expect(formatted.message).toBe('Test');
    expect(formatted.code).toBe(ADCPErrorCode.CONNECTION_FAILED);
  });

  it('should format standard Error for logging', () => {
    const error = new Error('Standard error');
    const formatted = ErrorHandler.formatError(error);
    
    expect(formatted.name).toBe('Error');
    expect(formatted.message).toBe('Standard error');
  });

  it('should identify platform unavailable errors', () => {
    const platformError = new ADCPError('Down', ADCPErrorCode.PLATFORM_UNAVAILABLE);
    const otherError = new ADCPError('Timeout', ADCPErrorCode.TIMEOUT);
    
    expect(ErrorHandler.isPlatformUnavailable(platformError)).toBe(true);
    expect(ErrorHandler.isPlatformUnavailable(otherError)).toBe(false);
  });

  it('should identify auth errors', () => {
    const authError = new ADCPError('Unauthorized', ADCPErrorCode.UNAUTHORIZED);
    const otherError = new ADCPError('Timeout', ADCPErrorCode.TIMEOUT);
    
    expect(ErrorHandler.isAuthError(authError)).toBe(true);
    expect(ErrorHandler.isAuthError(otherError)).toBe(false);
  });
});
