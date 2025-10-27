/**
 * Logging utility for AI Ad Yuugen SDK
 * Provides structured logging with different levels and contexts
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export interface LogContext {
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  batchSize: number;
  flushInterval: number;
  includeStackTrace: boolean;
}

export const DEFAULT_LOGGER_CONFIG: LoggerConfig = {
  level: LogLevel.INFO,
  enableConsole: true,
  enableRemote: false,
  batchSize: 50,
  flushInterval: 30000,
  includeStackTrace: false
};

export class Logger {
  private config: LoggerConfig;
  private logQueue: LogContext[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_LOGGER_CONFIG, ...config };
    this.startRemoteLogging();
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: any, category: string = 'general'): void {
    this.log(LogLevel.DEBUG, message, data, category);
  }

  /**
   * Log info message
   */
  info(message: string, data?: any, category: string = 'general'): void {
    this.log(LogLevel.INFO, message, data, category);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any, category: string = 'general'): void {
    this.log(LogLevel.WARN, message, data, category);
  }

  /**
   * Log error message
   */
  error(message: string, data?: any, category: string = 'general'): void {
    this.log(LogLevel.ERROR, message, data, category);
  }

  /**
   * Log critical message
   */
  critical(message: string, data?: any, category: string = 'general'): void {
    this.log(LogLevel.CRITICAL, message, data, category);
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, data?: any, category: string = 'general'): void {
    if (level < this.config.level) return;

    const logContext: LogContext = {
      timestamp: new Date(),
      level,
      category,
      message,
      data
    };

    if (this.config.enableConsole) {
      this.logToConsole(logContext);
    }

    if (this.config.enableRemote) {
      this.queueForRemoteLogging(logContext);
    }
  }

  /**
   * Log to console with appropriate formatting
   */
  private logToConsole(context: LogContext): void {
    const timestamp = context.timestamp.toISOString();
    const levelName = LogLevel[context.level];
    const prefix = `[${timestamp}] [${levelName}] [${context.category}]`;

    switch (context.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, context.message, context.data);
        break;
      case LogLevel.INFO:
        console.info(prefix, context.message, context.data);
        break;
      case LogLevel.WARN:
        console.warn(prefix, context.message, context.data);
        break;
      case LogLevel.ERROR:
        console.error(prefix, context.message, context.data);
        if (this.config.includeStackTrace && context.data instanceof Error) {
          console.error('Stack trace:', context.data.stack);
        }
        break;
      case LogLevel.CRITICAL:
        console.error('🚨 CRITICAL:', prefix, context.message, context.data);
        if (this.config.includeStackTrace && context.data instanceof Error) {
          console.error('Stack trace:', context.data.stack);
        }
        break;
    }
  }

  /**
   * Queue log for remote logging
   */
  private queueForRemoteLogging(context: LogContext): void {
    this.logQueue.push(context);

    if (this.logQueue.length >= this.config.batchSize) {
      this.flushLogs();
    }
  }

  /**
   * Start remote logging timer
   */
  private startRemoteLogging(): void {
    if (this.config.enableRemote && this.config.remoteEndpoint) {
      this.flushTimer = setInterval(() => {
        this.flushLogs();
      }, this.config.flushInterval);
    }
  }

  /**
   * Flush logs to remote endpoint
   */
  private async flushLogs(): Promise<void> {
    if (this.logQueue.length === 0 || !this.config.remoteEndpoint) return;

    const logs = this.logQueue.splice(0);

    try {
      await this.sendLogsToEndpoint(logs);
    } catch (error) {
      console.error('Failed to send logs to remote endpoint:', error);
      // Re-queue logs for next attempt (keep only recent logs to prevent memory issues)
      this.logQueue.unshift(...logs.slice(-100));
    }
  }

  /**
   * Send logs to remote endpoint
   */
  private async sendLogsToEndpoint(logs: LogContext[]): Promise<void> {
    const response = await fetch(this.config.remoteEndpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ logs })
    });

    if (!response.ok) {
      throw new Error(`Remote logging failed: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Set user context for all subsequent logs
   */
  setUserContext(userId: string, sessionId?: string): void {
    // This would be implemented to add user context to all logs
    // For now, we'll store it and add to future log contexts
  }

  /**
   * Create child logger with specific category
   */
  child(category: string): Logger {
    const childLogger = new Logger(this.config);
    // Override the log method to always use the specified category
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level: LogLevel, message: string, data?: any) => {
      originalLog(level, message, data, category);
    };
    return childLogger;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushLogs();
  }
}

// Create default logger instance
export const logger = new Logger();

// Export category-specific loggers
export const sdkLogger = logger.child('sdk');
export const adServingLogger = logger.child('ad-serving');
export const privacyLogger = logger.child('privacy');
export const analyticsLogger = logger.child('analytics');
export const networkLogger = logger.child('network');