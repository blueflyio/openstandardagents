/**
 * SchemaRepository Unit Tests
 * Test schema loading and caching
 */

import { SchemaRepository } from '../../../src/repositories/schema.repository.js';
import type { SchemaVersion } from '../../../src/types/index.js';

describe('SchemaRepository', () => {
  let repository: SchemaRepository;

  beforeEach(() => {
    repository = new SchemaRepository();
  });

  afterEach(() => {
    repository.clearCache();
  });

  describe('getSchema()', () => {
    it('should load v1.0 schema', async () => {
      const schema = await repository.getSchema('1.0');

      expect(schema).toBeDefined();
      expect(schema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(schema.title).toBe('OSSA 1.0 Agent Schema');
      expect((schema.properties as any).ossaVersion).toBeDefined();
      expect((schema.properties as any).agent).toBeDefined();
    });

    it('should load v0.1.9 schema', async () => {
      const schema = await repository.getSchema('0.1.9');

      expect(schema).toBeDefined();
      expect(schema.$schema).toBeDefined();
      expect(schema.title).toContain('OSSA');
    });

    it('should cache schema after first load', async () => {
      // First load
      const schema1 = await repository.getSchema('1.0');

      // Second load (should be from cache)
      const schema2 = await repository.getSchema('1.0');

      // Should be the same object reference (cached)
      expect(schema1).toBe(schema2);
    });

    it('should throw error for unsupported version', async () => {
      await expect(
        repository.getSchema('999.0' as SchemaVersion)
      ).rejects.toThrow('Unsupported schema version');
    });

    it('should cache different versions separately', async () => {
      const schema1_0 = await repository.getSchema('1.0');
      const schema0_1_9 = await repository.getSchema('0.1.9');

      expect(schema1_0).not.toBe(schema0_1_9);
      expect(schema1_0.title).toContain('1.0');
    });
  });

  describe('clearCache()', () => {
    it('should clear schema cache', async () => {
      // Load schema
      const schema1 = await repository.getSchema('1.0');

      // Clear cache
      repository.clearCache();

      // Load again (should not be cached)
      const schema2 = await repository.getSchema('1.0');

      // Should be different object references
      expect(schema1).not.toBe(schema2);

      // But content should be the same
      expect(schema1.title).toBe(schema2.title);
    });
  });
});
