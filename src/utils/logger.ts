/**
 * OSSA Structured Logging - Production-Grade Logging with Pino
 *
 * Features:
 * - Structured JSON logs (machine-parsable)
 * - Configurable log levels
 * - OpenTelemetry trace/span correlation
 * - Performance-optimized (Pino is fastest Node.js logger)
 * - Multiple transports (console, file, remote)
 */

import pino from 'pino';
import { trace, context, SpanContext } from '@opentelemetry/api';

/**
 * Log levels (0-60)
 */
export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level?: LogLevel | string;
  name?: string;
  pretty?: boolean;
  redact?: string[];
  destination?: string;
}

/**
 * Create base logger configuration
 */
function createLoggerConfig(config: LoggerConfig = {}): pino.LoggerOptions {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const level =
    config.level || process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

  const baseConfig: pino.LoggerOptions = {
    name: config.name || 'ossa',
    level,
    // Redact sensitive fields
    redact: {
      paths: config.redact || [
        'req.headers.authorization',
        'req.headers.cookie',
        'token',
        'apiKey',
        'password',
        'secret',
        '*.token',
        '*.apiKey',
        '*.password',
        '*.secret',
      ],
      remove: true,
    },
    // Base fields
    base: {
      pid: process.pid,
      hostname: process.env.HOSTNAME || 'unknown',
      env: process.env.NODE_ENV || 'development',
    },
    // Timestamp format
    timestamp: pino.stdTimeFunctions.isoTime,
    // Pretty print in development
    ...(config.pretty || isDevelopment
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
              singleLine: false,
            },
          },
        }
      : {}),
  };

  return baseConfig;
}

/**
 * Create logger instance
 */
export function createLogger(config: LoggerConfig = {}): pino.Logger {
  const loggerConfig = createLoggerConfig(config);

  // Create base logger
  const logger = config.destination
    ? pino(loggerConfig, pino.destination(config.destination))
    : pino(loggerConfig);

  // Add OpenTelemetry trace correlation
  return wrapWithTraceContext(logger);
}

/**
 * Wrap logger to automatically include OpenTelemetry trace context
 */
function wrapWithTraceContext(logger: pino.Logger): pino.Logger {
  const originalChild = logger.child.bind(logger);

  // Override child method to inject trace context
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logger.child = (
    bindings: pino.Bindings,
    options?: pino.ChildLoggerOptions
  ): any => {
    const traceContext = getTraceContext();
    return originalChild({ ...traceContext, ...bindings }, options);
  };

  return logger;
}

/**
 * Get current OpenTelemetry trace context
 */
function getTraceContext(): {
  traceId?: string;
  spanId?: string;
  traceFlags?: number;
} {
  const span = trace.getSpan(context.active());
  if (!span) {
    return {};
  }

  const spanContext: SpanContext = span.spanContext();
  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
    traceFlags: spanContext.traceFlags,
  };
}

/**
 * Default logger instance
 */
export const logger = createLogger();

/**
 * Create child logger with context
 */
export function createChildLogger(
  context: Record<string, unknown>
): pino.Logger {
  return logger.child(context);
}

/**
 * Log request/response (Express middleware)
 */
export function logRequest(logger: pino.Logger) {
  return (req: any, res: any, next: any) => {
    const start = Date.now();

    // Log request
    logger.info({
      req: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query,
        params: req.params,
      },
      msg: 'Incoming request',
    });

    // Log response
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logLevel = res.statusCode >= 400 ? 'error' : 'info';

      logger[logLevel]({
        req: {
          method: req.method,
          url: req.url,
        },
        res: {
          statusCode: res.statusCode,
          headers: res.getHeaders(),
        },
        duration,
        msg: 'Request completed',
      });
    });

    next();
  };
}

/**
 * Log error with full context
 */
export function logError(
  logger: pino.Logger,
  error: Error,
  context?: Record<string, unknown>
): void {
  logger.error({
    err: {
      type: error.name,
      message: error.message,
      stack: error.stack,
      ...('code' in error ? { code: error.code } : {}),
      ...('statusCode' in error ? { statusCode: error.statusCode } : {}),
    },
    ...context,
    msg: error.message,
  });
}

/**
 * Create logger for specific module
 */
export function createModuleLogger(moduleName: string): pino.Logger {
  return createChildLogger({ module: moduleName });
}

/**
 * Performance logging helper
 */
export class PerformanceLogger {
  private logger: pino.Logger;
  private startTime: number;
  private operation: string;

  constructor(logger: pino.Logger, operation: string) {
    this.logger = logger;
    this.operation = operation;
    this.startTime = Date.now();

    this.logger.debug({
      operation: this.operation,
      msg: `Starting ${this.operation}`,
    });
  }

  /**
   * Log completion with duration
   */
  end(context?: Record<string, unknown>): void {
    const duration = Date.now() - this.startTime;

    this.logger.info({
      operation: this.operation,
      duration,
      ...context,
      msg: `Completed ${this.operation}`,
    });
  }

  /**
   * Log error with duration
   */
  error(error: Error, context?: Record<string, unknown>): void {
    const duration = Date.now() - this.startTime;

    logError(this.logger, error, {
      operation: this.operation,
      duration,
      ...context,
    });
  }
}

/**
 * Measure operation performance
 */
export function measurePerformance<T>(
  logger: pino.Logger,
  operation: string,
  fn: () => T | Promise<T>
): Promise<T> {
  const perf = new PerformanceLogger(logger, operation);

  try {
    const result = fn();

    if (result instanceof Promise) {
      return result
        .then((value) => {
          perf.end();
          return value;
        })
        .catch((error) => {
          perf.error(error);
          throw error;
        });
    }

    perf.end();
    return Promise.resolve(result);
  } catch (error) {
    perf.error(error as Error);
    return Promise.reject(error);
  }
}

/**
 * Export types
 */
export type { Logger } from 'pino';
