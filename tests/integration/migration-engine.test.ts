/**
 * Integration tests for OSSA Migration Engine
 * Tests the complete migration workflow with real example manifests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { readFileSync } from 'fs';
import * as YAML from 'yaml';
import { MigrationService } from '../../src/services/migration.service.js';
import { VersionDetectionService } from '../../src/services/version-detection.service.js';
import { MigrationTransformService } from '../../src/services/migration-transform.service.js';
import { GitRollbackService } from '../../src/services/git-rollback.service.js';
import { ValidationService } from '../../src/services/validation.service.js';
import { SchemaRepository } from '../../src/repositories/schema.repository.js';
import { GitService } from '../../src/services/git.service.js';

describe('Migration Engine Integration', () => {
  let migrationService: MigrationService;
  let versionDetector: VersionDetectionService;
  let transformService: MigrationTransformService;
  let gitRollback: GitRollbackService;
  let validationService: ValidationService;

  beforeEach(() => {
    const schemaRepo = new SchemaRepository();
    validationService = new ValidationService(schemaRepo);
    versionDetector = new VersionDetectionService(validationService);
    transformService = new MigrationTransformService();
    const gitService = new GitService();
    gitRollback = new GitRollbackService(gitService);
    migrationService = new MigrationService(
      versionDetector,
      transformService,
      gitRollback
    );
  });

  describe('Version Detection with Real Manifests', () => {
    it('should detect version from minimal agent', async () => {
      const content = readFileSync(
        'examples/getting-started/01-minimal-agent.ossa.yaml',
        'utf-8'
      );
      const manifest = YAML.parse(content);

      const detection = await versionDetector.detectVersion(manifest);

      expect(detection.version).toBe('0.3.6');
      expect(detection.confidence).toBe('high');
      expect(detection.source).toBe('apiVersion');
    });

    it('should detect version from code reviewer agent', async () => {
      const content = readFileSync(
        'examples/claude-code/code-reviewer.ossa.yaml',
        'utf-8'
      );
      const manifest = YAML.parse(content);

      const detection = await versionDetector.detectVersion(manifest);

      expect(detection.version).toBeTruthy();
      expect(detection.confidence).toBe('high');
    });
  });

  describe('Single Manifest Migration', () => {
    it('should migrate v0.3.3 manifest to v0.3.6', async () => {
      const manifest = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0',
          description: 'Test agent for migration',
          labels: {},
          annotations: {},
        },
        spec: {
          role: 'Test assistant',
          llm: {
            provider: 'anthropic',
            model: 'claude-sonnet-4',
            temperature: 0.7,
          },
        },
      };

      const result = await migrationService.migrateWithDetection(
        manifest,
        '0.3.6'
      );

      expect(result.success).toBe(true);
      expect(result.manifest?.apiVersion).toBe('ossa/v0.3.6');
      expect(result.sourceVersion).toBe('0.3.3');
      expect(result.targetVersion).toBe('0.3.6');
      expect(result.summary).toBeDefined();

      // Verify critical fields preserved
      expect(result.manifest?.metadata?.name).toBe('test-agent');
      expect(result.manifest?.spec?.role).toBe('Test assistant');
    });

    it('should not migrate if already at target version', async () => {
      const content = readFileSync(
        'examples/getting-started/01-minimal-agent.ossa.yaml',
        'utf-8'
      );
      const manifest = YAML.parse(content);

      const result = await migrationService.migrateWithDetection(
        manifest,
        '0.3.6'
      );

      expect(result.success).toBe(true);
      expect(result.warnings).toContain('Manifest already at target version');
    });
  });

  describe('Batch Migration', () => {
    it('should migrate multiple manifests in parallel', async () => {
      const manifests = [
        {
          apiVersion: 'ossa/v0.4.1',
          kind: 'Agent',
          metadata: { name: 'agent-1', labels: {}, annotations: {} },
          spec: { role: 'Agent 1' },
        },
        {
          apiVersion: 'ossa/v0.4.1',
          kind: 'Agent',
          metadata: { name: 'agent-2', labels: {}, annotations: {} },
          spec: { role: 'Agent 2' },
        },
        {
          apiVersion: 'ossa/v0.4.1',
          kind: 'Agent',
          metadata: { name: 'agent-3', labels: {}, annotations: {} },
          spec: { role: 'Agent 3' },
        },
      ];

      const result = await migrationService.migrateBatch(manifests, '0.3.6', {
        parallel: true,
        maxConcurrent: 2,
      });

      expect(result.success).toBe(true);
      expect(result.total).toBe(3);
      expect(result.succeeded).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(3);

      // Verify all are migrated to target version
      result.results.forEach((res) => {
        expect(res.success).toBe(true);
        expect(res.manifest?.apiVersion).toBe('ossa/v0.3.6');
      });
    });

    it('should handle sequential migration', async () => {
      const manifests = [
        {
          apiVersion: 'ossa/v0.4.1',
          kind: 'Agent',
          metadata: { name: 'agent-1', labels: {}, annotations: {} },
          spec: { role: 'Agent 1' },
        },
        {
          apiVersion: 'ossa/v0.4.1',
          kind: 'Agent',
          metadata: { name: 'agent-2', labels: {}, annotations: {} },
          spec: { role: 'Agent 2' },
        },
      ];

      const result = await migrationService.migrateBatch(manifests, '0.3.6', {
        parallel: false,
      });

      expect(result.success).toBe(true);
      expect(result.total).toBe(2);
      expect(result.succeeded).toBe(2);
    });

    it('should stop on error when configured', async () => {
      const manifests = [
        {
          apiVersion: 'ossa/v0.4.1',
          kind: 'Agent',
          metadata: { name: 'agent-1', labels: {}, annotations: {} },
          spec: { role: 'Agent 1' },
        },
        { invalid: 'manifest' }, // Invalid manifest
        {
          apiVersion: 'ossa/v0.4.1',
          kind: 'Agent',
          metadata: { name: 'agent-3', labels: {}, annotations: {} },
          spec: { role: 'Agent 3' },
        },
      ];

      const result = await migrationService.migrateBatch(manifests, '0.3.6', {
        stopOnError: true,
      });

      expect(result.success).toBe(false);
      // First manifest should succeed, second should fail, third may not run
      expect(result.failed).toBeGreaterThan(0);
    });

    it('should continue on error when configured', async () => {
      const manifests = [
        {
          apiVersion: 'ossa/v0.4.1',
          kind: 'Agent',
          metadata: { name: 'agent-1', labels: {}, annotations: {} },
          spec: { role: 'Agent 1' },
        },
        { invalid: 'manifest' },
        {
          apiVersion: 'ossa/v0.4.1',
          kind: 'Agent',
          metadata: { name: 'agent-3', labels: {}, annotations: {} },
          spec: { role: 'Agent 3' },
        },
      ];

      const result = await migrationService.migrateBatch(manifests, '0.3.6', {
        stopOnError: false,
      });

      expect(result.total).toBe(3);
      expect(result.succeeded).toBe(2);
      expect(result.failed).toBe(1);
    });
  });

  describe('Migration Validation', () => {
    it('should validate that critical fields are preserved', () => {
      const original = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          labels: {},
          annotations: {},
        },
        spec: {
          role: 'Test role',
          llm: {
            provider: 'anthropic',
            model: 'claude-sonnet-4',
          },
          capabilities: ['cap1', 'cap2'],
        },
      };

      const migrated = transformService.applyTransform(
        original,
        '0.3.3',
        '0.3.4'
      );

      const warnings = transformService.validateMigration(original, migrated);

      // Should have no data loss warnings
      expect(warnings.filter((w) => w.includes('lost')).length).toBe(0);
    });

    it('should warn about field type changes', () => {
      const original = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'test', labels: {}, annotations: {} },
        spec: {
          role: 'test',
          observability: {
            metrics: true, // Boolean
          },
        },
      };

      const migrated = transformService.applyTransform(
        original,
        '0.3.4',
        '0.3.6'
      );

      // Verify metrics was normalized to object
      const obs = (migrated.spec as Record<string, unknown>)
        ?.observability as Record<string, unknown>;
      expect(typeof obs?.metrics).toBe('object');
    });
  });

  describe('Transform Registry', () => {
    it('should list all available transformations', () => {
      const transforms = transformService.getAllTransforms();

      expect(transforms.length).toBeGreaterThanOrEqual(3);
      expect(transforms.some((t) => t.id === 'v0.3.3-to-v0.3.4')).toBe(true);
      expect(transforms.some((t) => t.id === 'v0.3.4-to-v0.3.6')).toBe(true);
      expect(transforms.some((t) => t.id === 'v0.3.3-to-v0.3.6')).toBe(true);
    });

    it('should provide transformation summaries', () => {
      const summary = transformService.getTransformSummary('0.3.3', '0.3.4');

      expect(summary.length).toBeGreaterThan(0);
      expect(summary.join(' ')).toContain('0.3.3');
      expect(summary.join(' ')).toContain('0.3.4');
      expect(summary.join(' ')).toContain('checkpointing');
    });
  });

  describe('Migration Path Planning', () => {
    it('should calculate migration path', () => {
      const path = versionDetector.getMigrationPath('0.3.3', '0.3.6');

      expect(path.length).toBeGreaterThan(0);
      expect(path[path.length - 1]).toBe('0.3.6');
    });

    it('should return empty path for same version', () => {
      const path = versionDetector.getMigrationPath('0.3.6', '0.3.6');

      expect(path).toHaveLength(0);
    });

    it('should return empty path for downgrade', () => {
      const path = versionDetector.getMigrationPath('0.3.6', '0.3.3');

      expect(path).toHaveLength(0);
    });
  });
});
