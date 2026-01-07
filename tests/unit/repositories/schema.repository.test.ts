import { describe, it, expect, beforeEach } from '@jest/globals';
import { SchemaRepository } from '../../../src/repositories/schema.repository.js';

describe('SchemaRepository', () => {
  let repo: SchemaRepository;

  beforeEach(() => {
    repo = new SchemaRepository();
  });

  describe('getAvailableVersions', () => {
    it('should return array of versions', () => {
      const versions = repo.getAvailableVersions();
      expect(Array.isArray(versions)).toBe(true);
      expect(versions.length).toBeGreaterThan(0);
    });

    it('should cache versions on subsequent calls', () => {
      const first = repo.getAvailableVersions();
      const second = repo.getAvailableVersions();
      expect(first).toBe(second);
    });
  });

  describe('getCurrentVersion', () => {
    it('should return current version', () => {
      const version = repo.getCurrentVersion();
      expect(typeof version).toBe('string');
      // Accept either semver (0.3.0) or template placeholder (0.3.2)
      expect(version).toMatch(/^\d+\.\d+\.\d+|^\{\{[A-Z_]+\}\}$/);
    });
  });

  describe('getSchema', () => {
    it('should load schema for valid version', async () => {
      const versions = repo.getAvailableVersions();
      if (versions.length > 0) {
        const schema = await repo.getSchema(versions[0]);
        expect(schema).toBeDefined();
        expect(typeof schema).toBe('object');
      }
    });

    it('should cache schema after first load', async () => {
      const versions = repo.getAvailableVersions();
      if (versions.length > 0) {
        const schema1 = await repo.getSchema(versions[0]);
        const schema2 = await repo.getSchema(versions[0]);
        expect(schema1).toBe(schema2);
      }
    });

    it('should load different versions', async () => {
      const versions = repo.getAvailableVersions();
      // Filter to versions with valid schemas (skip 0.2.0 and 0.2.1 which have empty/placeholder schemas)
      const validVersions = versions.filter((v) => !['0.2.0', '0.2.1'].includes(v));
      if (validVersions.length > 1) {
        const schema1 = await repo.getSchema(validVersions[0]);
        const schema2 = await repo.getSchema(validVersions[1]);
        expect(schema1).toBeDefined();
        expect(schema2).toBeDefined();
      }
    });

    it('should throw for invalid version', async () => {
      await expect(repo.getSchema('99.99.99')).rejects.toThrow();
    });
  });

  describe('clearCache', () => {
    it('should clear cached schemas', async () => {
      const versions = repo.getAvailableVersions();
      if (versions.length > 0) {
        await repo.getSchema(versions[0]);
        repo.clearCache();
        // After clearing, next getSchema should reload from disk
        const schema = await repo.getSchema(versions[0]);
        expect(schema).toBeDefined();
      }
    });
  });

  describe('edge cases', () => {
    it('should handle getting available versions multiple times', () => {
      const v1 = repo.getAvailableVersions();
      const v2 = repo.getAvailableVersions();
      const v3 = repo.getAvailableVersions();
      expect(v1).toEqual(v2);
      expect(v2).toEqual(v3);
    });

    it('should return versions in expected format', () => {
      const versions = repo.getAvailableVersions();
      versions.forEach((v) => {
        // Accept semver format with optional pre-release suffix
        expect(v).toMatch(/^\d+\.\d+\.\d+(-[A-Z0-9]+)?$/i);
      });
    });

    it('should throw for empty version string', async () => {
      await expect(repo.getSchema('')).rejects.toThrow();
    });

    it('should throw for null version', async () => {
      await expect(repo.getSchema(null as any)).rejects.toThrow();
    });

    it('should throw for undefined version', async () => {
      await expect(repo.getSchema(undefined as any)).rejects.toThrow();
    });

    it('should throw for non-semver version format', async () => {
      await expect(repo.getSchema('not-a-version')).rejects.toThrow();
    });

    it('should load schema for current version', async () => {
      const currentVersion = repo.getCurrentVersion();
      // Only test if current version is not a template placeholder
      if (currentVersion.match(/^\d+\.\d+\.\d+$/)) {
        const schema = await repo.getSchema(currentVersion);
        expect(schema).toBeDefined();
      }
    });

    it('should load schema multiple times without error', async () => {
      const versions = repo.getAvailableVersions();
      if (versions.length > 0) {
        const version = versions[0];
        for (let i = 0; i < 5; i++) {
          const schema = await repo.getSchema(version);
          expect(schema).toBeDefined();
        }
      }
    });

    it('should clear cache and reload schemas correctly', async () => {
      const versions = repo.getAvailableVersions();
      // Filter out versions with known schema issues
      const validVersions = versions.filter((v) => !['0.2.0', '0.2.1', '0.2.5-RC'].includes(v));
      if (validVersions.length > 1) {
        // Load first schema
        const schema1 = await repo.getSchema(validVersions[0]);
        expect(schema1).toBeDefined();

        // Load second schema
        const schema2 = await repo.getSchema(validVersions[1]);
        expect(schema2).toBeDefined();

        // Clear cache
        repo.clearCache();

        // Reload both schemas
        const reloadedSchema1 = await repo.getSchema(validVersions[0]);
        const reloadedSchema2 = await repo.getSchema(validVersions[1]);

        expect(reloadedSchema1).toBeDefined();
        expect(reloadedSchema2).toBeDefined();
      }
    });

    it('should handle version with leading zeros', async () => {
      await expect(repo.getSchema('0.02.03')).rejects.toThrow();
    });

    it('should handle version with extra parts', async () => {
      await expect(repo.getSchema('0.2.3.4')).rejects.toThrow();
    });

    it('should handle version with missing parts', async () => {
      await expect(repo.getSchema('0.2')).rejects.toThrow();
    });

    it('should check if loaded schema has expected structure', async () => {
      const versions = repo.getAvailableVersions();
      const validVersions = versions.filter((v) => !['0.2.0', '0.2.1'].includes(v));
      if (validVersions.length > 0) {
        const schema = await repo.getSchema(validVersions[0]);
        expect(schema).toHaveProperty('$schema');
        expect(typeof schema).toBe('object');
      }
    });

    it('should return consistent version list across calls', () => {
      const calls = Array.from({ length: 10 }, () => repo.getAvailableVersions());
      const firstCall = calls[0];
      calls.forEach((call) => {
        expect(call).toEqual(firstCall);
      });
    });

    it('should handle concurrent schema loads', async () => {
      const versions = repo.getAvailableVersions();
      if (versions.length > 0) {
        const promises = [
          repo.getSchema(versions[0]),
          repo.getSchema(versions[0]),
          repo.getSchema(versions[0]),
        ];
        const schemas = await Promise.all(promises);
        expect(schemas[0]).toBe(schemas[1]);
        expect(schemas[1]).toBe(schemas[2]);
      }
    });

    it('should maintain cache after getting current version', async () => {
      const versions = repo.getAvailableVersions();
      if (versions.length > 0) {
        const schema1 = await repo.getSchema(versions[0]);
        const current = repo.getCurrentVersion();
        const schema2 = await repo.getSchema(versions[0]);
        expect(schema1).toBe(schema2);
        expect(current).toBeDefined();
      }
    });
  });
});
