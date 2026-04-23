/**
 * Logger Utility
 *
 * Centralized logging with different log levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private isDevelopment = __DEV__;
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Keep last 100 logs in memory

  /**
   * Log a debug message (development only)
   */
  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${message}`, data || '');
    }
    this.addLog('debug', message, data);
  }

  /**
   * Log an info message
   */
  info(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, data || '');
    }
    this.addLog('info', message, data);
  }

  /**
   * Log a warning
   */
  warn(message: string, data?: any): void {
    console.warn(`[WARN] ${message}`, data || '');
    this.addLog('warn', message, data);
  }

  /**
   * Log an error
   */
  error(message: string, error?: Error | any): void {
    console.error(`[ERROR] ${message}`, error || '');
    this.addLog('error', message, error);

    // In production, send to error tracking service
    if (!this.isDevelopment) {
      this.reportError(message, error);
    }
  }

  /**
   * Add log entry to in-memory buffer
   */
  private addLog(level: LogLevel, message: string, data?: any): void {
    const logEntry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    this.logs.push(logEntry);

    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Get recent logs
   */
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter((log) => log.level === level);
    }
    return this.logs;
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Report error to external service (Sentry, Bugsnag, etc.)
   */
  private reportError(message: string, error?: Error | any): void {
    // TODO: Integrate with error tracking service in production
    // For now, just store locally
    try {
      // Example: Sentry.captureException(error);
    } catch (e) {
      console.error('Failed to report error:', e);
    }
  }

  /**
   * Export logs for debugging
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();
