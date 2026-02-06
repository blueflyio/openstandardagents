/**
 * Unit tests for error helper functions
 */

import { describe, it, expect } from '@jest/globals';
import {
  OssaError,
  ValidationError,
  AgentNotFoundError,
  isOssaError,
  toOssaError,
  getErrorCode,
  isRetryable,
} from '../../../src/errors';

describe('Error Helper Functions', () => {
  describe('isOssaError()', () => {
    it('should return true for OssaError instances', () => {
      const error = new ValidationError('Test');
      expect(isOssaError(error)).toBe(true);
    });

    it('should return true for all OssaError subclasses', () => {
      expect(isOssaError(new ValidationError('test'))).toBe(true);
      expect(isOssaError(new AgentNotFoundError('test'))).toBe(true);
    });

    it('should return false for standard Error', () => {
      const error = new Error('Standard error');
      expect(isOssaError(error)).toBe(false);
    });

    it('should return false for non-Error objects', () => {
      expect(isOssaError('string')).toBe(false);
      expect(isOssaError(123)).toBe(false);
      expect(isOssaError(null)).toBe(false);
      expect(isOssaError(undefined)).toBe(false);
      expect(isOssaError({})).toBe(false);
      expect(isOssaError([])).toBe(false);
    });

    it('should return false for objects with similar structure', () => {
      const fakeError = {
        code: 'FAKE-001',
        message: 'Fake error',
        statusCode: 500,
      };
      expect(isOssaError(fakeError)).toBe(false);
    });
  });

  describe('toOssaError()', () => {
    it('should return OssaError as-is', () => {
      const error = new ValidationError('Test');
      const converted = toOssaError(error);

      expect(converted).toBe(error);
      expect(converted.code).toBe('OSSA-VAL-001');
    });

    it('should convert standard Error to OssaError', () => {
      const error = new Error('Standard error');
      const converted = toOssaError(error);

      expect(isOssaError(converted)).toBe(true);
      expect(converted.code).toBe('OSSA-UNKNOWN-001');
      expect(converted.message).toBe('Standard error');
      expect(converted.statusCode).toBe(500);
    });

    it('should include original error details', () => {
      const error = new Error('Original error');
      const converted = toOssaError(error);

      expect(converted.details?.originalError).toBe('Error');
      expect(converted.details?.stack).toBeDefined();
    });

    it('should convert string to OssaError', () => {
      const converted = toOssaError('String error');

      expect(isOssaError(converted)).toBe(true);
      expect(converted.code).toBe('OSSA-UNKNOWN-002');
      expect(converted.message).toBe('An unknown error occurred');
      expect(converted.details?.error).toBe('String error');
    });

    it('should convert number to OssaError', () => {
      const converted = toOssaError(123);

      expect(isOssaError(converted)).toBe(true);
      expect(converted.code).toBe('OSSA-UNKNOWN-002');
      expect(converted.details?.error).toBe('123');
    });

    it('should convert null to OssaError', () => {
      const converted = toOssaError(null);

      expect(isOssaError(converted)).toBe(true);
      expect(converted.code).toBe('OSSA-UNKNOWN-002');
      expect(converted.details?.error).toBe('null');
    });

    it('should convert undefined to OssaError', () => {
      const converted = toOssaError(undefined);

      expect(isOssaError(converted)).toBe(true);
      expect(converted.code).toBe('OSSA-UNKNOWN-002');
      expect(converted.details?.error).toBe('undefined');
    });

    it('should convert object to OssaError', () => {
      const obj = { foo: 'bar', nested: { value: 42 } };
      const converted = toOssaError(obj);

      expect(isOssaError(converted)).toBe(true);
      expect(converted.code).toBe('OSSA-UNKNOWN-002');
      expect(converted.details?.error).toBe('[object Object]');
    });

    it('should preserve stack trace from Error', () => {
      const error = new Error('Test error');
      const converted = toOssaError(error);

      expect(converted.details?.stack).toBeDefined();
      expect(converted.details?.stack).toContain('Error: Test error');
    });
  });

  describe('getErrorCode()', () => {
    it('should return error code from OssaError', () => {
      const error = new ValidationError('Test');
      expect(getErrorCode(error)).toBe('OSSA-VAL-001');
    });

    it('should return error code from any OssaError subclass', () => {
      expect(getErrorCode(new ValidationError('test'))).toBe('OSSA-VAL-001');
      expect(getErrorCode(new AgentNotFoundError('test'))).toBe('OSSA-REG-002');
    });

    it('should return OSSA-UNKNOWN-001 for standard Error', () => {
      const error = new Error('Standard error');
      expect(getErrorCode(error)).toBe('OSSA-UNKNOWN-001');
    });

    it('should return OSSA-UNKNOWN-001 for non-errors', () => {
      expect(getErrorCode('string')).toBe('OSSA-UNKNOWN-001');
      expect(getErrorCode(123)).toBe('OSSA-UNKNOWN-001');
      expect(getErrorCode(null)).toBe('OSSA-UNKNOWN-001');
      expect(getErrorCode(undefined)).toBe('OSSA-UNKNOWN-001');
      expect(getErrorCode({})).toBe('OSSA-UNKNOWN-001');
    });
  });

  describe('isRetryable()', () => {
    it('should return true for 5xx OssaErrors', () => {
      const error500 = new ValidationError('Test');
      error500.statusCode = 500;
      expect(isRetryable(error500)).toBe(true);

      const error503 = new ValidationError('Test');
      error503.statusCode = 503;
      expect(isRetryable(error503)).toBe(true);

      const error504 = new ValidationError('Test');
      error504.statusCode = 504;
      expect(isRetryable(error504)).toBe(true);
    });

    it('should return false for 4xx OssaErrors', () => {
      const error400 = new ValidationError('Test');
      error400.statusCode = 400;
      expect(isRetryable(error400)).toBe(false);

      const error404 = new AgentNotFoundError('test');
      expect(isRetryable(error404)).toBe(false);

      const error429 = new ValidationError('Test');
      error429.statusCode = 429;
      expect(isRetryable(error429)).toBe(false);
    });

    it('should return false for standard Error', () => {
      const error = new Error('Standard error');
      expect(isRetryable(error)).toBe(false);
    });

    it('should return false for non-errors', () => {
      expect(isRetryable('string')).toBe(false);
      expect(isRetryable(123)).toBe(false);
      expect(isRetryable(null)).toBe(false);
      expect(isRetryable(undefined)).toBe(false);
      expect(isRetryable({})).toBe(false);
    });
  });

  describe('Integration tests', () => {
    it('should handle complete error flow', () => {
      // Create error
      const error = new ValidationError('Validation failed', {
        field: 'name',
        value: null,
      });

      // Check if OssaError
      expect(isOssaError(error)).toBe(true);

      // Get error code
      expect(getErrorCode(error)).toBe('OSSA-VAL-001');

      // Check retryability
      expect(isRetryable(error)).toBe(false);

      // Convert to JSON
      const json = error.toJSON();
      expect(json.error.code).toBe('OSSA-VAL-001');
    });

    it('should handle unknown error conversion flow', () => {
      // Start with standard error
      const originalError = new Error('Unknown error');

      // Convert to OssaError
      const ossaError = toOssaError(originalError);

      // Verify conversion
      expect(isOssaError(ossaError)).toBe(true);
      expect(getErrorCode(ossaError)).toBe('OSSA-UNKNOWN-001');
      expect(isRetryable(ossaError)).toBe(true); // 500 is retryable

      // Should have original error details
      expect(ossaError.details?.originalError).toBe('Error');
      expect(ossaError.details?.stack).toContain('Unknown error');
    });

    it('should handle retry logic based on error code', () => {
      const errors = [
        { error: new ValidationError('test'), shouldRetry: false },
        { error: new AgentNotFoundError('test'), shouldRetry: false },
        {
          error: (() => {
            const e = new ValidationError('test');
            e.statusCode = 500;
            return e;
          })(),
          shouldRetry: true,
        },
        {
          error: (() => {
            const e = new ValidationError('test');
            e.statusCode = 503;
            return e;
          })(),
          shouldRetry: true,
        },
      ];

      errors.forEach(({ error, shouldRetry }) => {
        expect(isRetryable(error)).toBe(shouldRetry);
      });
    });

    it('should handle error logging flow', () => {
      const error = new AgentNotFoundError('mycompany/my-agent', {
        registry: 'https://registry.example.com',
      });

      // Convert to JSON for logging
      const json = error.toJSON();

      // Verify log format
      expect(json.error).toHaveProperty('code');
      expect(json.error).toHaveProperty('message');
      expect(json.error).toHaveProperty('statusCode');
      expect(json.error).toHaveProperty('details');
      expect(json.error).toHaveProperty('timestamp');

      // Verify values
      expect(json.error.code).toBe('OSSA-REG-002');
      expect(json.error.statusCode).toBe(404);
      expect(json.error.details?.agentId).toBe('mycompany/my-agent');
    });
  });
});
