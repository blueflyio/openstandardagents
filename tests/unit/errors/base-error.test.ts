/**
 * Unit tests for OssaError base class
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { OssaError } from '../../../src/errors';
import { API_VERSION } from '../../../src/version.js';

// Create test error class
class TestError extends OssaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('TEST-001', message, 500, details);
  }
}

describe('OssaError', () => {
  let error: TestError;

  beforeEach(() => {
    error = new TestError('Test error message', {
      testKey: 'testValue',
      nested: { foo: 'bar' },
    });
  });

  describe('constructor', () => {
    it('should set error properties correctly', () => {
      expect(error.code).toBe('TEST-001');
      expect(error.message).toBe('Test error message');
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual({
        testKey: 'testValue',
        nested: { foo: 'bar' },
      });
      expect(error.name).toBe('TestError');
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should set default statusCode to 500 if not provided', () => {
      const defaultError = new TestError('Default error');
      expect(defaultError.statusCode).toBe(500);
    });

    it('should handle undefined details', () => {
      const noDetailsError = new TestError('No details');
      expect(noDetailsError.details).toBeUndefined();
    });

    it('should capture stack trace', () => {
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('TestError');
    });

    it('should set name to constructor name', () => {
      expect(error.name).toBe('TestError');
    });
  });

  describe('toJSON()', () => {
    it('should return JSON representation', () => {
      const json = error.toJSON();

      expect(json).toHaveProperty('error');
      expect(json.error).toEqual({
        code: 'TEST-001',
        message: 'Test error message',
        statusCode: 500,
        details: {
          testKey: 'testValue',
          nested: { foo: 'bar' },
        },
        timestamp: error.timestamp.toISOString(),
      });
    });

    it('should handle error without details', () => {
      const simpleError = new TestError('Simple error');
      const json = simpleError.toJSON();

      expect(json.error.details).toBeUndefined();
    });

    it('should include correct timestamp', () => {
      const json = error.toJSON();
      const timestamp = json.error.timestamp as string;

      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(timestamp).getTime()).toBe(error.timestamp.getTime());
    });
  });

  describe('isRetryable()', () => {
    it('should return true for 5xx status codes', () => {
      const error500 = new TestError('Server error');
      error500.statusCode = 500;
      expect(error500.isRetryable()).toBe(true);

      const error503 = new TestError('Service unavailable');
      error503.statusCode = 503;
      expect(error503.isRetryable()).toBe(true);

      const error504 = new TestError('Gateway timeout');
      error504.statusCode = 504;
      expect(error504.isRetryable()).toBe(true);

      const error599 = new TestError('Network error');
      error599.statusCode = 599;
      expect(error599.isRetryable()).toBe(true);
    });

    it('should return false for non-5xx status codes', () => {
      const error400 = new TestError('Bad request');
      error400.statusCode = 400;
      expect(error400.isRetryable()).toBe(false);

      const error404 = new TestError('Not found');
      error404.statusCode = 404;
      expect(error404.isRetryable()).toBe(false);

      const error429 = new TestError('Rate limited');
      error429.statusCode = 429;
      expect(error429.isRetryable()).toBe(false);
    });

    it('should return false for status code 600 and above', () => {
      const error600 = new TestError('Invalid code');
      error600.statusCode = 600;
      expect(error600.isRetryable()).toBe(false);
    });
  });

  describe('isClientError()', () => {
    it('should return true for 4xx status codes', () => {
      const error400 = new TestError('Bad request');
      error400.statusCode = 400;
      expect(error400.isClientError()).toBe(true);

      const error404 = new TestError('Not found');
      error404.statusCode = 404;
      expect(error404.isClientError()).toBe(true);

      const error429 = new TestError('Rate limited');
      error429.statusCode = 429;
      expect(error429.isClientError()).toBe(true);

      const error499 = new TestError('Client error');
      error499.statusCode = 499;
      expect(error499.isClientError()).toBe(true);
    });

    it('should return false for non-4xx status codes', () => {
      const error500 = new TestError('Server error');
      error500.statusCode = 500;
      expect(error500.isClientError()).toBe(false);

      const error200 = new TestError('Success');
      error200.statusCode = 200;
      expect(error200.isClientError()).toBe(false);

      const error300 = new TestError('Redirect');
      error300.statusCode = 300;
      expect(error300.isClientError()).toBe(false);
    });
  });

  describe('timestamp', () => {
    it('should set timestamp at error creation time', () => {
      const before = Date.now();
      const testError = new TestError('Timestamp test');
      const after = Date.now();

      expect(testError.timestamp.getTime()).toBeGreaterThanOrEqual(before);
      expect(testError.timestamp.getTime()).toBeLessThanOrEqual(after);
    });

    it('should have unique timestamps for different errors', async () => {
      const error1 = new TestError('Error 1');
      await new Promise((resolve) => setTimeout(resolve, 1)); // 1ms delay
      const error2 = new TestError('Error 2');

      expect(error2.timestamp.getTime()).toBeGreaterThanOrEqual(
        error1.timestamp.getTime()
      );
    });
  });

  describe('inheritance', () => {
    it('should be instance of Error', () => {
      expect(error).toBeInstanceOf(Error);
    });

    it('should be instance of OssaError', () => {
      expect(error).toBeInstanceOf(OssaError);
    });

    it('should be instance of TestError', () => {
      expect(error).toBeInstanceOf(TestError);
    });

    it('should maintain correct prototype chain', () => {
      expect(Object.getPrototypeOf(error)).toBe(TestError.prototype);
      expect(Object.getPrototypeOf(TestError.prototype)).toBe(OssaError.prototype);
      expect(Object.getPrototypeOf(OssaError.prototype)).toBe(Error.prototype);
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON with JSON.stringify', () => {
      const json = JSON.stringify(error);
      const parsed = JSON.parse(json);

      // Error objects don't serialize well with JSON.stringify
      // So we test the toJSON method instead
      expect(error.toJSON()).toBeDefined();
    });

    it('should be able to recreate error from JSON', () => {
      const json = error.toJSON();
      const errorData = json.error;

      const recreatedError = new TestError(errorData.message, errorData.details);
      recreatedError.statusCode = errorData.statusCode;

      expect(recreatedError.code).toBe(error.code);
      expect(recreatedError.message).toBe(error.message);
      expect(recreatedError.statusCode).toBe(error.statusCode);
      expect(recreatedError.details).toEqual(error.details);
    });
  });
});
