/**
 * Unit tests for Logger utility
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  createLogger,
  createModuleLogger,
  createChildLogger,
  LogLevel,
  PerformanceLogger,
  measurePerformance,
  logError,
  logger,
} from '../../../src/utils/logger';
import type { Logger } from 'pino';

// Mock OpenTelemetry
jest.mock('@opentelemetry/api', () => ({
  trace: {
    getSpan: jest.fn(() => ({
      spanContext: () => ({
        traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
        spanId: '00f067aa0ba902b7',
        traceFlags: 1,
      }),
    })),
  },
  context: {
    active: jest.fn(() => ({})),
  },
}));

describe('Logger', () => {
  describe('createLogger()', () => {
    it('should create logger with default config', () => {
      const testLogger = createLogger();
      expect(testLogger).toBeDefined();
      expect(testLogger.info).toBeDefined();
      expect(testLogger.error).toBeDefined();
      expect(testLogger.warn).toBeDefined();
      expect(testLogger.debug).toBeDefined();
    });

    it('should create logger with custom name', () => {
      const testLogger = createLogger({ name: 'test-logger' });
      expect(testLogger).toBeDefined();
    });

    it('should create logger with custom log level', () => {
      const testLogger = createLogger({ level: LogLevel.DEBUG });
      expect(testLogger).toBeDefined();
    });

    it('should create logger with pretty printing', () => {
      const testLogger = createLogger({ pretty: true });
      expect(testLogger).toBeDefined();
    });

    it('should create logger with custom redact paths', () => {
      const testLogger = createLogger({
        redact: ['custom.secret', 'api.key'],
      });
      expect(testLogger).toBeDefined();
    });
  });

  describe('createModuleLogger()', () => {
    it('should create logger with module context', () => {
      const moduleLogger = createModuleLogger('validation-service');
      expect(moduleLogger).toBeDefined();
    });

    it('should inherit from parent logger', () => {
      const moduleLogger = createModuleLogger('test-module');
      expect(moduleLogger.info).toBeDefined();
      expect(moduleLogger.error).toBeDefined();
    });
  });

  describe('createChildLogger()', () => {
    it('should create child logger with context', () => {
      const childLogger = createChildLogger({
        requestId: '12345',
        userId: 'user-123',
      });
      expect(childLogger).toBeDefined();
    });

    it('should inherit from parent logger', () => {
      const childLogger = createChildLogger({ context: 'test' });
      expect(childLogger.info).toBeDefined();
      expect(childLogger.error).toBeDefined();
    });
  });

  describe('PerformanceLogger', () => {
    let testLogger: Logger;

    beforeEach(() => {
      testLogger = createLogger({ level: LogLevel.DEBUG });
    });

    it('should create performance logger', () => {
      const perf = new PerformanceLogger(testLogger, 'test-operation');
      expect(perf).toBeDefined();
    });

    it('should log end with duration', () => {
      const perf = new PerformanceLogger(testLogger, 'test-operation');
      const infoSpy = jest.spyOn(testLogger, 'info');

      perf.end();

      expect(infoSpy).toHaveBeenCalled();
    });

    it('should log end with context', () => {
      const perf = new PerformanceLogger(testLogger, 'test-operation');
      const infoSpy = jest.spyOn(testLogger, 'info');

      perf.end({ result: 'success', count: 10 });

      expect(infoSpy).toHaveBeenCalled();
    });

    it('should log error with duration', () => {
      const perf = new PerformanceLogger(testLogger, 'test-operation');
      const errorSpy = jest.spyOn(testLogger, 'error');

      const error = new Error('Test error');
      perf.error(error);

      expect(errorSpy).toHaveBeenCalled();
    });

    it('should log error with context', () => {
      const perf = new PerformanceLogger(testLogger, 'test-operation');
      const errorSpy = jest.spyOn(testLogger, 'error');

      const error = new Error('Test error');
      perf.error(error, { attempt: 3, maxRetries: 5 });

      expect(errorSpy).toHaveBeenCalled();
    });

    it('should measure elapsed time', async () => {
      const perf = new PerformanceLogger(testLogger, 'test-operation');
      const infoSpy = jest.spyOn(testLogger, 'info');

      // Wait 10ms
      await new Promise((resolve) => setTimeout(resolve, 10));

      perf.end();

      // Check that duration was logged (should be >= 10ms)
      expect(infoSpy).toHaveBeenCalled();
      const call = infoSpy.mock.calls[infoSpy.mock.calls.length - 1];
      const logObj = call[0] as any;
      expect(logObj.duration).toBeGreaterThanOrEqual(10);
    });
  });

  describe('measurePerformance()', () => {
    let testLogger: Logger;

    beforeEach(() => {
      testLogger = createLogger({ level: LogLevel.DEBUG });
    });

    it('should measure synchronous function', async () => {
      const infoSpy = jest.spyOn(testLogger, 'info');

      const result = await measurePerformance(testLogger, 'sync-operation', () => {
        return 'result';
      });

      expect(result).toBe('result');
      expect(infoSpy).toHaveBeenCalled();
    });

    it('should measure asynchronous function', async () => {
      const infoSpy = jest.spyOn(testLogger, 'info');

      const result = await measurePerformance(testLogger, 'async-operation', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'async-result';
      });

      expect(result).toBe('async-result');
      expect(infoSpy).toHaveBeenCalled();
    });

    it('should handle function errors', async () => {
      const errorSpy = jest.spyOn(testLogger, 'error');

      await expect(
        measurePerformance(testLogger, 'failing-operation', () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');

      expect(errorSpy).toHaveBeenCalled();
    });

    it('should handle async function errors', async () => {
      const errorSpy = jest.spyOn(testLogger, 'error');

      await expect(
        measurePerformance(testLogger, 'failing-async-operation', async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          throw new Error('Async error');
        })
      ).rejects.toThrow('Async error');

      expect(errorSpy).toHaveBeenCalled();
    });

    it('should log duration for successful operations', async () => {
      const infoSpy = jest.spyOn(testLogger, 'info');

      await measurePerformance(testLogger, 'timed-operation', async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        return 'done';
      });

      expect(infoSpy).toHaveBeenCalled();
      const call = infoSpy.mock.calls[infoSpy.mock.calls.length - 1];
      const logObj = call[0] as any;
      expect(logObj.duration).toBeGreaterThanOrEqual(20);
    });

    it('should log duration for failed operations', async () => {
      const errorSpy = jest.spyOn(testLogger, 'error');

      await expect(
        measurePerformance(testLogger, 'timed-failing-operation', async () => {
          await new Promise((resolve) => setTimeout(resolve, 20));
          throw new Error('Timed error');
        })
      ).rejects.toThrow('Timed error');

      expect(errorSpy).toHaveBeenCalled();
      const call = errorSpy.mock.calls[errorSpy.mock.calls.length - 1];
      const logObj = call[0] as any;
      expect(logObj.duration).toBeGreaterThanOrEqual(20);
    });
  });

  describe('logError()', () => {
    let testLogger: Logger;

    beforeEach(() => {
      testLogger = createLogger({ level: LogLevel.DEBUG });
    });

    it('should log error with message', () => {
      const errorSpy = jest.spyOn(testLogger, 'error');
      const error = new Error('Test error');

      logError(testLogger, error);

      expect(errorSpy).toHaveBeenCalled();
    });

    it('should log error with context', () => {
      const errorSpy = jest.spyOn(testLogger, 'error');
      const error = new Error('Test error');

      logError(testLogger, error, {
        operation: 'test-operation',
        userId: 'user-123',
      });

      expect(errorSpy).toHaveBeenCalled();
    });

    it('should include error stack', () => {
      const errorSpy = jest.spyOn(testLogger, 'error');
      const error = new Error('Test error');

      logError(testLogger, error);

      expect(errorSpy).toHaveBeenCalled();
      const call = errorSpy.mock.calls[0];
      const logObj = call[0] as any;
      expect(logObj.err.stack).toBeDefined();
    });

    it('should include error name', () => {
      const errorSpy = jest.spyOn(testLogger, 'error');
      const error = new Error('Test error');

      logError(testLogger, error);

      expect(errorSpy).toHaveBeenCalled();
      const call = errorSpy.mock.calls[0];
      const logObj = call[0] as any;
      expect(logObj.err.type).toBe('Error');
    });

    it('should handle errors with code property', () => {
      const errorSpy = jest.spyOn(testLogger, 'error');
      const error: any = new Error('Test error');
      error.code = 'OSSA-TEST-001';

      logError(testLogger, error);

      expect(errorSpy).toHaveBeenCalled();
      const call = errorSpy.mock.calls[0];
      const logObj = call[0] as any;
      expect(logObj.err.code).toBe('OSSA-TEST-001');
    });

    it('should handle errors with statusCode property', () => {
      const errorSpy = jest.spyOn(testLogger, 'error');
      const error: any = new Error('Test error');
      error.statusCode = 404;

      logError(testLogger, error);

      expect(errorSpy).toHaveBeenCalled();
      const call = errorSpy.mock.calls[0];
      const logObj = call[0] as any;
      expect(logObj.err.statusCode).toBe(404);
    });
  });

  describe('LogLevel enum', () => {
    it('should have all log levels', () => {
      expect(LogLevel.TRACE).toBe('trace');
      expect(LogLevel.DEBUG).toBe('debug');
      expect(LogLevel.INFO).toBe('info');
      expect(LogLevel.WARN).toBe('warn');
      expect(LogLevel.ERROR).toBe('error');
      expect(LogLevel.FATAL).toBe('fatal');
    });
  });

  describe('Default logger instance', () => {
    it('should export default logger', () => {
      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.debug).toBeDefined();
    });
  });

  describe('Integration tests', () => {
    it('should handle complete logging flow', async () => {
      const testLogger = createLogger({ level: LogLevel.DEBUG });
      const infoSpy = jest.spyOn(testLogger, 'info');
      const errorSpy = jest.spyOn(testLogger, 'error');

      // Log info
      testLogger.info({
        operation: 'test-operation',
        msg: 'Starting operation',
      });

      expect(infoSpy).toHaveBeenCalled();

      // Measure performance
      const result = await measurePerformance(testLogger, 'test-operation', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'success';
      });

      expect(result).toBe('success');

      // Log error
      const error = new Error('Test error');
      logError(testLogger, error, { operation: 'test-operation' });

      expect(errorSpy).toHaveBeenCalled();
    });

    it('should handle module logger flow', () => {
      const moduleLogger = createModuleLogger('test-module');
      const infoSpy = jest.spyOn(moduleLogger, 'info');

      moduleLogger.info({
        operation: 'module-operation',
        msg: 'Module operation started',
      });

      expect(infoSpy).toHaveBeenCalled();
    });

    it('should handle child logger flow', () => {
      const childLogger = createChildLogger({
        requestId: '12345',
        userId: 'user-123',
      });
      const infoSpy = jest.spyOn(childLogger, 'info');

      childLogger.info({ msg: 'Request processed' });

      expect(infoSpy).toHaveBeenCalled();
    });
  });
});
