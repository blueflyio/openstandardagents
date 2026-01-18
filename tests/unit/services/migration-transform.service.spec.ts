/**
 * Tests for MigrationTransformService
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { MigrationTransformService } from '../../../src/services/migration-transform.service.js';
import type { OssaAgent } from '../../../src/types/index.js';

describe('MigrationTransformService', () => {
  let service: MigrationTransformService;

  beforeEach(() => {
    service = new MigrationTransformService();
  });

  describe('Built-in transforms', () => {
    it('should register v0.3.3 to v0.3.4 transform', () => {
      const transform = service.getTransform('0.3.3', '0.3.4');
      expect(transform).toBeDefined();
      expect(transform?.id).toBe('v0.3.3-to-v0.3.4');
      expect(transform?.breaking).toBe(false);
      expect(transform?.reversible).toBe(true);
    });

    it('should register v0.3.4 to v0.3.5 transform', () => {
      const transform = service.getTransform('0.3.4', '0.3.5');
      expect(transform).toBeDefined();
      expect(transform?.id).toBe('v0.3.4-to-v0.3.5');
    });

    it('should register direct v0.3.3 to v0.3.5 transform', () => {
      const transform = service.getTransform('0.3.3', '0.3.5');
      expect(transform).toBeDefined();
      expect(transform?.id).toBe('v0.3.3-to-v0.3.5');
    });
  });

  describe('applyTransform', () => {
    it('should transform v0.3.3 to v0.3.4 (add checkpointing)', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.3',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          labels: {},
          annotations: {},
        },
        spec: {
          role: 'test',
          llm: {
            provider: 'anthropic',
            model: 'claude-sonnet-4',
          },
        },
      };

      const migrated = service.applyTransform(manifest, '0.3.3', '0.3.4');

      expect(migrated.apiVersion).toBe('ossa/v0.3.4');
      expect(migrated.metadata?.labels?.['ossa-version']).toBe('v0.3.4');
      expect(
        (migrated.spec as Record<string, unknown>)?.checkpointing
      ).toBeDefined();
      expect(
        (migrated.spec as Record<string, unknown>)?.completion
      ).toBeDefined();
    });

    it('should transform v0.3.4 to v0.3.5 (fix observability)', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.4',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          labels: {},
          annotations: {},
        },
        spec: {
          role: 'test',
          observability: {
            metrics: true, // Boolean format (should be normalized)
          },
        } as Record<string, unknown>,
      };

      const migrated = service.applyTransform(manifest, '0.3.4', '0.3.5');

      expect(migrated.apiVersion).toBe('ossa/v0.3.5');
      const obs = (migrated.spec as Record<string, unknown>)
        ?.observability as Record<string, unknown>;
      expect(obs?.metrics).toBeDefined();
      expect(typeof obs.metrics).toBe('object');
      expect((obs.metrics as Record<string, unknown>).enabled).toBe(true);
    });

    it('should throw error for unknown transformation', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.3',
        kind: 'Agent',
        metadata: { name: 'test' },
        spec: { role: 'test' },
      };

      expect(() => {
        service.applyTransform(manifest, '0.3.3', '0.9.9');
      }).toThrow('No transformation found');
    });
  });

  describe('validateMigration', () => {
    it('should detect lost critical fields', () => {
      const original: OssaAgent = {
        apiVersion: 'ossa/v0.3.3',
        kind: 'Agent',
        metadata: { name: 'test' },
        spec: {
          role: 'test',
          llm: {
            provider: 'anthropic',
            model: 'claude-sonnet-4',
          },
        },
      };

      const migrated: OssaAgent = {
        apiVersion: 'ossa/v0.3.4',
        kind: 'Agent',
        metadata: { name: 'test' },
        spec: {
          role: 'test',
          // LLM field intentionally removed
        },
      };

      const warnings = service.validateMigration(original, migrated);
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some((w) => w.includes('llm'))).toBe(true);
    });

    it('should return no warnings for valid migration', () => {
      const original: OssaAgent = {
        apiVersion: 'ossa/v0.3.3',
        kind: 'Agent',
        metadata: { name: 'test' },
        spec: {
          role: 'test',
        },
      };

      const migrated = service.applyTransform(original, '0.3.3', '0.3.4');
      const warnings = service.validateMigration(original, migrated);

      // Should have no warnings about lost data
      expect(warnings.filter((w) => w.includes('lost'))).toHaveLength(0);
    });
  });

  describe('getTransformSummary', () => {
    it('should return summary for valid transformation', () => {
      const summary = service.getTransformSummary('0.3.3', '0.3.4');

      expect(summary.length).toBeGreaterThan(0);
      expect(summary.some((s) => s.includes('0.3.3'))).toBe(true);
      expect(summary.some((s) => s.includes('0.3.4'))).toBe(true);
    });

    it('should return error for invalid transformation', () => {
      const summary = service.getTransformSummary('0.3.3', '0.9.9');

      expect(summary.length).toBeGreaterThan(0);
      expect(summary[0]).toContain('No transformation available');
    });
  });

  describe('getAllTransforms', () => {
    it('should return all registered transforms', () => {
      const transforms = service.getAllTransforms();

      expect(transforms.length).toBeGreaterThanOrEqual(3);
      expect(transforms.every((t) => t.fromVersion && t.toVersion)).toBe(true);
    });
  });
});
