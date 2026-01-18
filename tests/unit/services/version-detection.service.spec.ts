/**
 * Tests for VersionDetectionService
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { VersionDetectionService } from '../../../src/services/version-detection.service.js';
import { ValidationService } from '../../../src/services/validation.service.js';
import { SchemaRepository } from '../../../src/repositories/schema.repository.js';

describe('VersionDetectionService', () => {
  let service: VersionDetectionService;
  let validationService: ValidationService;

  beforeEach(() => {
    const schemaRepo = new SchemaRepository();
    validationService = new ValidationService(schemaRepo);
    service = new VersionDetectionService(validationService);
  });

  describe('detectVersion', () => {
    it('should detect version from apiVersion field (high confidence)', async () => {
      const manifest = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: { name: 'test' },
        spec: { role: 'test' },
      };

      const result = await service.detectVersion(manifest);

      expect(result.version).toBe('0.3.5');
      expect(result.confidence).toBe('high');
      expect(result.source).toBe('apiVersion');
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect legacy v1.0 format (medium confidence)', async () => {
      const manifest = {
        ossaVersion: '1.0',
        agent: {
          id: 'test',
          name: 'test',
          version: '1.0.0',
          role: 'test',
        },
      };

      const result = await service.detectVersion(manifest);

      expect(result.version).toBe('1.0');
      expect(result.confidence).toBe('medium');
      expect(result.source).toBe('legacy-field');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should return unknown for invalid manifest', async () => {
      const result = await service.detectVersion(null);

      expect(result.version).toBe('unknown');
      expect(result.confidence).toBe('low');
      expect(result.source).toBe('unknown');
    });

    it('should warn about invalid apiVersion format', async () => {
      const manifest = {
        apiVersion: 'invalid-format',
        kind: 'Agent',
        metadata: { name: 'test' },
      };

      const result = await service.detectVersion(manifest);

      expect(result.warnings.length).toBeGreaterThan(0);
      // The service falls back to schema validation when apiVersion is invalid
      expect(
        result.warnings.some(
          (w) => w.includes('Invalid apiVersion') || w.includes('falling back')
        )
      ).toBe(true);
    });
  });

  describe('needsMigration', () => {
    it('should return false when versions match', () => {
      const result = service.needsMigration('0.3.5', '0.3.5');
      expect(result).toBe(false);
    });

    it('should return true when current < target', () => {
      const result = service.needsMigration('0.3.3', '0.3.5');
      expect(result).toBe(true);
    });

    it('should return false when current > target', () => {
      const result = service.needsMigration('0.3.5', '0.3.3');
      expect(result).toBe(false);
    });

    it('should return true for unknown version', () => {
      const result = service.needsMigration('unknown', '0.3.5');
      expect(result).toBe(true);
    });
  });

  describe('getMigrationPath', () => {
    it('should return empty array when no migration needed', () => {
      const path = service.getMigrationPath('0.3.5', '0.3.5');
      expect(path).toHaveLength(0);
    });

    it('should return direct path for patch upgrade', () => {
      const path = service.getMigrationPath('0.3.3', '0.3.5');
      expect(path.length).toBeGreaterThan(0);
      expect(path[path.length - 1]).toBe('0.3.5');
    });

    it('should return empty array for downgrade', () => {
      const path = service.getMigrationPath('0.3.5', '0.3.3');
      expect(path).toHaveLength(0);
    });
  });
});
