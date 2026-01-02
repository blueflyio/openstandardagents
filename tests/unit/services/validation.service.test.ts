import { describe, it, expect, beforeEach } from '@jest/globals';
import { ValidationService } from '../../../src/services/validation.service.js';
import { SchemaRepository } from '../../../src/repositories/schema.repository.js';
import { getApiVersion, getVersion } from '../../../src/utils/version.js';

// Dynamic version from package.json - NEVER hardcode
const CURRENT_API_VERSION = getApiVersion();
const CURRENT_VERSION = getVersion();

describe('ValidationService', () => {
  let service: ValidationService;
  let schemaRepo: SchemaRepository;

  beforeEach(() => {
    schemaRepo = new SchemaRepository();
    service = new ValidationService(schemaRepo);
  });

  describe('validate', () => {
    it('should validate valid manifest', async () => {
      const manifest = {
        apiVersion: CURRENT_API_VERSION,
        kind: 'Agent',
        metadata: { name: 'test', version: '1.0.0' },
        spec: { role: 'assistant' },
      };
      const result = await service.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid manifest', async () => {
      const invalid = { random: 'data' };
      const result = await service.validate(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate with specific version', async () => {
      const manifest = {
        apiVersion: CURRENT_API_VERSION,
        kind: 'Agent',
        metadata: { name: 'test', version: '1.0.0' },
        spec: { role: 'assistant' },
      };
      const result = await service.validate(manifest, CURRENT_VERSION);
      expect(result.valid).toBe(true);
    });

    it('should use current version when not specified', async () => {
      const manifest = {
        apiVersion: CURRENT_API_VERSION,
        kind: 'Agent',
        metadata: { name: 'test', version: '1.0.0' },
        spec: { role: 'assistant' },
      };
      const result = await service.validate(manifest);
      expect(result).toBeDefined();
    });
  });

  describe('validateMany', () => {
    it('should validate multiple manifests', async () => {
      const manifests = [
        {
          apiVersion: CURRENT_API_VERSION,
          kind: 'Agent',
          metadata: { name: 'test1', version: '1.0.0' },
          spec: { role: 'assistant' },
        },
        {
          apiVersion: CURRENT_API_VERSION,
          kind: 'Agent',
          metadata: { name: 'test2', version: '1.0.0' },
          spec: { role: 'assistant' },
        },
      ];
      const results = await service.validateMany(manifests);
      expect(results).toHaveLength(2);
      expect(results[0].valid).toBe(true);
      expect(results[1].valid).toBe(true);
    });

    it('should handle mixed valid and invalid manifests', async () => {
      const manifests = [
        {
          apiVersion: CURRENT_API_VERSION,
          kind: 'Agent',
          metadata: { name: 'test', version: '1.0.0' },
          spec: { role: 'assistant' },
        },
        { invalid: 'data' },
      ];
      const results = await service.validateMany(manifests);
      expect(results).toHaveLength(2);
      expect(results[0].valid).toBe(true);
      expect(results[1].valid).toBe(false);
    });

    it('should handle empty array', async () => {
      const results = await service.validateMany([]);
      expect(results).toHaveLength(0);
    });

    it('should use specified version', async () => {
      const manifests = [
        {
          apiVersion: CURRENT_API_VERSION,
          kind: 'Agent',
          metadata: { name: 'test', version: '1.0.0' },
          spec: { role: 'assistant' },
        },
      ];
      const results = await service.validateMany(manifests, CURRENT_VERSION);
      expect(results).toHaveLength(1);
      expect(results[0].valid).toBe(true);
    });
  });
});
