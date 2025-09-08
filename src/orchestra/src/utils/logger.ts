/**
 * OSSA Orchestra v0.1.8 - Enhanced Logger
 * Structured logging with context and metrics integration
 */

export class Logger {
  private context: string;
  private level: LogLevel;

  constructor(context: string, level: LogLevel = LogLevel.INFO) {
    this.context = context;
    this.level = level;
  }

  debug(message: string, meta?: any): void {
    if (this.level <= LogLevel.DEBUG) {
      this.log(LogLevel.DEBUG, message, meta);
    }
  }

  info(message: string, meta?: any): void {
    if (this.level <= LogLevel.INFO) {
      this.log(LogLevel.INFO, message, meta);
    }
  }

  warn(message: string, meta?: any): void {
    if (this.level <= LogLevel.WARN) {
      this.log(LogLevel.WARN, message, meta);
    }
  }

  error(message: string, meta?: any): void {
    if (this.level <= LogLevel.ERROR) {
      this.log(LogLevel.ERROR, message, meta);
    }
  }

  private log(level: LogLevel, message: string, meta?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      context: this.context,
      message,
      meta
    };

    const formattedMessage = `[${logEntry.timestamp}] ${logEntry.level} [${logEntry.context}] ${message}`;
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, meta);
        break;
      case LogLevel.INFO:
        console.log(formattedMessage, meta);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, meta);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, meta);
        break;
    }
  }
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}