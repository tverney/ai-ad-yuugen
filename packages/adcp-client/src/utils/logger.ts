/**
 * Structured logging utility for ADCP client
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface LoggerConfig {
  level?: LogLevel;
  enableConsole?: boolean;
  enableStructured?: boolean;
  prefix?: string;
}

/**
 * Logger for structured logging with multiple levels
 */
export class Logger {
  private config: Required<LoggerConfig>;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize: number = 1000;

  constructor(config: LoggerConfig = {}) {
    this.config = {
      level: config.level || LogLevel.INFO,
      enableConsole: config.enableConsole !== false,
      enableStructured: config.enableStructured !== false,
      prefix: config.prefix || 'ADCP'
    };
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error message
   */
  error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * Log request details
   */
  logRequest(method: string, params?: Record<string, any>, metadata?: Record<string, any>): void {
    this.info('Request', {
      method,
      params: this.sanitizeParams(params),
      ...metadata
    });
  }

  /**
   * Log response details
   */
  logResponse(method: string, success: boolean, duration?: number, metadata?: Record<string, any>): void {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    this.log(level, 'Response', {
      method,
      success,
      duration: duration ? `${duration}ms` : undefined,
      ...metadata
    });
  }

  /**
   * Log performance metrics
   */
  logPerformance(operation: string, duration: number, metadata?: Record<string, any>): void {
    this.info('Performance', {
      operation,
      duration: `${duration}ms`,
      ...metadata
    });
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    // Check if log level is enabled
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context
    };

    // Add to buffer
    this.addToBuffer(entry);

    // Output to console if enabled
    if (this.config.enableConsole) {
      this.outputToConsole(entry);
    }
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    const prefix = `[${this.config.prefix}]`;
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase();

    if (this.config.enableStructured) {
      // Structured JSON output
      const structured = {
        timestamp,
        level: entry.level,
        message: entry.message,
        ...entry.context
      };
      
      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(prefix, JSON.stringify(structured));
          break;
        case LogLevel.INFO:
          console.info(prefix, JSON.stringify(structured));
          break;
        case LogLevel.WARN:
          console.warn(prefix, JSON.stringify(structured));
          break;
        case LogLevel.ERROR:
          console.error(prefix, JSON.stringify(structured));
          break;
      }
    } else {
      // Human-readable output
      const contextStr = entry.context 
        ? ' ' + JSON.stringify(entry.context, null, 2)
        : '';
      
      const output = `${prefix} [${timestamp}] ${level}: ${entry.message}${contextStr}`;
      
      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(output);
          break;
        case LogLevel.INFO:
          console.info(output);
          break;
        case LogLevel.WARN:
          console.warn(output);
          break;
        case LogLevel.ERROR:
          console.error(output);
          break;
      }
    }
  }

  /**
   * Add log entry to buffer
   */
  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);

    // Trim buffer if it exceeds max size
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
    }
  }

  /**
   * Sanitize sensitive parameters
   */
  private sanitizeParams(params?: Record<string, any>): Record<string, any> | undefined {
    if (!params) return undefined;

    const sanitized = { ...params };
    const sensitiveKeys = ['apiKey', 'api_key', 'password', 'token', 'secret'];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  /**
   * Get recent log entries
   */
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logBuffer.filter(entry => entry.level === level);
  }

  /**
   * Clear log buffer
   */
  clearBuffer(): void {
    this.logBuffer = [];
  }

  /**
   * Get log statistics
   */
  getStats() {
    const stats = {
      total: this.logBuffer.length,
      byLevel: {
        debug: 0,
        info: 0,
        warn: 0,
        error: 0
      }
    };

    for (const entry of this.logBuffer) {
      stats.byLevel[entry.level]++;
    }

    return stats;
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * Create child logger with additional context
   */
  child(context: Record<string, any>): Logger {
    const childLogger = new Logger(this.config);
    childLogger.logBuffer = this.logBuffer; // Share buffer with parent
    
    // Override log method to include parent context
    const originalLog = (childLogger as any).log.bind(childLogger);
    (childLogger as any).log = (level: LogLevel, message: string, childContext?: Record<string, any>) => {
      originalLog(level, message, { ...context, ...childContext });
    };

    return childLogger;
  }
}

/**
 * Create a default logger instance
 */
export function createLogger(config?: LoggerConfig): Logger {
  return new Logger(config);
}
