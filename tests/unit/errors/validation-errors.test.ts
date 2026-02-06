/**
 * Unit tests for Validation Error classes
 */

import { describe, it, expect } from '@jest/globals';
import {
  ValidationError,
  SchemaValidationError,
  ManifestValidationError,
  VersionValidationError,
} from '../../../src/errors';

describe('Validation Errors', () => {
  describe('ValidationError', () => {
    it('should create error with code OSSA-VAL-001', () => {
      const error = new ValidationError('Validation failed');
      expect(error.code).toBe('OSSA-VAL-001');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Validation failed');
    });

    it('should include details', () => {
      const details = {
        field: 'email',
        value: 'invalid',
        expected: 'valid email address',
      };
      const error = new ValidationError('Invalid email', details);

      expect(error.details).toEqual(details);
    });

    it('should be client error (4xx)', () => {
      const error = new ValidationError('Validation failed');
      expect(error.isClientError()).toBe(true);
      expect(error.isRetryable()).toBe(false);
    });
  });

  describe('SchemaValidationError', () => {
    it('should create error with code OSSA-VAL-002', () => {
      const error = new SchemaValidationError('Schema validation failed');
      expect(error.code).toBe('OSSA-VAL-002');
      expect(error.statusCode).toBe(400);
    });

    it('should include schema validation errors', () => {
      const details = {
        schema: 'ossa/v0.4.1',
        errors: [
          { path: 'metadata.name', message: 'Required field' },
          { path: 'spec.role', message: 'Must be string' },
        ],
      };
      const error = new SchemaValidationError('Schema validation failed', details);

      expect(error.details).toEqual(details);
      expect(error.details?.schema).toBe('ossa/v0.4.1');
      expect(Array.isArray(error.details?.errors)).toBe(true);
    });

    it('should convert to JSON with error details', () => {
      const error = new SchemaValidationError('Schema validation failed', {
        schema: 'ossa/v0.4.1',
        errors: [{ path: 'metadata.name', message: 'Required' }],
      });

      const json = error.toJSON();
      expect(json.error.code).toBe('OSSA-VAL-002');
      expect(json.error.details?.schema).toBe('ossa/v0.4.1');
    });
  });

  describe('ManifestValidationError', () => {
    it('should create error with code OSSA-VAL-003', () => {
      const error = new ManifestValidationError('Invalid manifest');
      expect(error.code).toBe('OSSA-VAL-003');
      expect(error.statusCode).toBe(400);
    });

    it('should include manifest context', () => {
      const details = {
        manifestPath: '/path/to/agent.ossa.yaml',
        lineNumber: 42,
        column: 10,
        reason: 'Unexpected token',
      };
      const error = new ManifestValidationError('Manifest parse error', details);

      expect(error.details).toEqual(details);
    });

    it('should be useful for YAML parsing errors', () => {
      const error = new ManifestValidationError('YAML parse error', {
        file: 'agent.ossa.yaml',
        line: 15,
        column: 3,
        snippet: 'metadata:\n  name: my-agent\n  version: 1.0.0',
      });

      expect(error.message).toBe('YAML parse error');
      expect(error.details?.file).toBe('agent.ossa.yaml');
      expect(error.details?.line).toBe(15);
    });
  });

  describe('VersionValidationError', () => {
    it('should create error with code OSSA-VAL-004', () => {
      const error = new VersionValidationError('Version mismatch');
      expect(error.code).toBe('OSSA-VAL-004');
      expect(error.statusCode).toBe(400);
    });

    it('should include version information', () => {
      const details = {
        expected: 'ossa/v0.4.1',
        received: 'ossa/v0.3.6',
        field: 'apiVersion',
      };
      const error = new VersionValidationError('Version not supported', details);

      expect(error.details).toEqual(details);
    });

    it('should handle semver version comparisons', () => {
      const error = new VersionValidationError('Version too old', {
        minimum: '1.0.0',
        received: '0.9.5',
        breaking: true,
      });

      expect(error.details?.minimum).toBe('1.0.0');
      expect(error.details?.received).toBe('0.9.5');
      expect(error.details?.breaking).toBe(true);
    });
  });

  describe('Error inheritance', () => {
    it('should all inherit from Error', () => {
      expect(new ValidationError('test')).toBeInstanceOf(Error);
      expect(new SchemaValidationError('test')).toBeInstanceOf(Error);
      expect(new ManifestValidationError('test')).toBeInstanceOf(Error);
      expect(new VersionValidationError('test')).toBeInstanceOf(Error);
    });

    it('should have correct error names', () => {
      expect(new ValidationError('test').name).toBe('ValidationError');
      expect(new SchemaValidationError('test').name).toBe('SchemaValidationError');
      expect(new ManifestValidationError('test').name).toBe('ManifestValidationError');
      expect(new VersionValidationError('test').name).toBe('VersionValidationError');
    });
  });

  describe('JSON serialization', () => {
    it('should serialize ValidationError', () => {
      const error = new ValidationError('Test', { field: 'name' });
      const json = error.toJSON();

      expect(json.error.code).toBe('OSSA-VAL-001');
      expect(json.error.message).toBe('Test');
      expect(json.error.statusCode).toBe(400);
      expect(json.error.details).toEqual({ field: 'name' });
    });

    it('should serialize SchemaValidationError', () => {
      const error = new SchemaValidationError('Test', { schema: 'ossa/v0.4.1' });
      const json = error.toJSON();

      expect(json.error.code).toBe('OSSA-VAL-002');
      expect(json.error.details?.schema).toBe('ossa/v0.4.1');
    });

    it('should serialize ManifestValidationError', () => {
      const error = new ManifestValidationError('Test', { file: 'test.yaml' });
      const json = error.toJSON();

      expect(json.error.code).toBe('OSSA-VAL-003');
      expect(json.error.details?.file).toBe('test.yaml');
    });

    it('should serialize VersionValidationError', () => {
      const error = new VersionValidationError('Test', { expected: '1.0.0' });
      const json = error.toJSON();

      expect(json.error.code).toBe('OSSA-VAL-004');
      expect(json.error.details?.expected).toBe('1.0.0');
    });
  });
});
