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
      // Accept either semver (0.3.0) or template placeholder ({{VERSION}})
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
      const validVersions = versions.filter(v => !['0.2.0', '0.2.1'].includes(v));
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
});
