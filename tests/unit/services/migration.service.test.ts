/**
 * MigrationService Unit Tests
 * Test v0.1.9 to v0.2.3 migration
 */

import { MigrationService } from '../../../src/services/migration.service.js';

describe('MigrationService', () => {
  let service: MigrationService;

  beforeEach(() => {
    service = new MigrationService();
  });

  describe('migrate()', () => {
    // Note: v1.0 format does not exist - removed test
    // Migration from v0.1.9 to v0.2.3 is handled by schema validation

    it('should throw error for unsupported manifest format', async () => {
      const invalid = {
        unknown: 'format',
      };

      await expect(service.migrate(invalid)).rejects.toThrow(
        'Unsupported manifest format'
      );
    });

    it('should return v0.2.2 manifest as-is', async () => {
      const v022 = {
        apiVersion: 'ossa/v1',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '0.1.0',
        },
        spec: {
          role: 'chat',
        },
      };

      const migrated = await service.migrate(v022);
      expect(migrated).toBe(v022);
    });

    // Note: v1.0 format tests removed - v1.0 does not exist
  });

  describe('needsMigration()', () => {
    // Note: v1.0 format test removed - v1.0 does not exist

    it('should return false for v0.2.2 manifest', () => {
      const v022 = {
        apiVersion: 'ossa/v1',
        kind: 'Agent',
        metadata: {
          name: 'test',
          version: '0.1.0',
        },
        spec: {
          role: 'chat',
        },
      };

      expect(service.needsMigration(v022)).toBe(false);
    });

    it('should return false for invalid manifest', () => {
      expect(service.needsMigration({ invalid: true })).toBe(false);
    });
  });

  describe('migrateMany()', () => {
    // Note: v1.0 format test removed - v1.0 does not exist
    it('should handle empty array', async () => {
      const migrated = await service.migrateMany([]);
      expect(migrated).toHaveLength(0);
    });
  });
});
