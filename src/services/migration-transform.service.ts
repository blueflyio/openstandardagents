/**
 * Migration Transform Service
 * Registry of version-specific transformations for OSSA manifests
 */

import { injectable } from 'inversify';
import type { OssaAgent } from '../types/index.js';

/**
 * Transform function signature
 */
export type MigrationTransform = (manifest: OssaAgent) => OssaAgent;

/**
 * Transform metadata
 */
export interface TransformInfo {
  id: string;
  fromVersion: string;
  toVersion: string;
  description: string;
  transform: MigrationTransform;
  breaking: boolean;
  reversible: boolean;
}

@injectable()
export class MigrationTransformService {
  private transforms: Map<string, TransformInfo> = new Map();

  constructor() {
    this.registerBuiltInTransforms();
  }

  /**
   * Register built-in transformation rules
   */
  private registerBuiltInTransforms(): void {
    // v0.3.3 → v0.3.4: Add checkpointing support
    this.register({
      id: 'v0.3.3-to-v0.3.4',
      fromVersion: '0.3.3',
      toVersion: '0.3.4',
      description: 'Add checkpointing and completion signals',
      breaking: false,
      reversible: true,
      transform: this.transformV033ToV034.bind(this),
    });

    // v0.3.4 → v0.3.5: Fix observability.metrics structure
    this.register({
      id: 'v0.3.4-to-v0.3.5',
      fromVersion: '0.3.4',
      toVersion: '0.3.5',
      description: 'Add MoE, BAT, and enhanced features',
      breaking: false,
      reversible: true,
      transform: this.transformV034ToV035.bind(this),
    });

    // v0.3.5 → v0.3.6: Maintenance release
    this.register({
      id: 'v0.3.5-to-v0.3.6',
      fromVersion: '0.3.5',
      toVersion: '0.3.6',
      description: 'Maintenance release with consolidated features',
      breaking: false,
      reversible: true,
      transform: this.transformV035ToV036.bind(this),
    });

    // v0.3.3 → v0.3.6: Direct migration (combines all)
    this.register({
      id: 'v0.3.3-to-v0.3.6',
      fromVersion: '0.3.3',
      toVersion: '0.3.6',
      description: 'Direct upgrade to latest version',
      breaking: false,
      reversible: true,
      transform: this.transformV033ToV036.bind(this),
    });

    // v0.3.4 → v0.3.6: Direct migration
    this.register({
      id: 'v0.3.4-to-v0.3.6',
      fromVersion: '0.3.4',
      toVersion: '0.3.6',
      description: 'Direct upgrade to latest version',
      breaking: false,
      reversible: true,
      transform: this.transformV034ToV036.bind(this),
    });
  }

  /**
   * Register a transformation
   */
  register(info: TransformInfo): void {
    const key = `${info.fromVersion}-to-${info.toVersion}`;
    this.transforms.set(key, info);
  }

  /**
   * Get transformation for version pair
   */
  getTransform(fromVersion: string, toVersion: string): TransformInfo | null {
    const key = `${fromVersion}-to-${toVersion}`;
    return this.transforms.get(key) || null;
  }

  /**
   * Get all registered transformations
   */
  getAllTransforms(): TransformInfo[] {
    return Array.from(this.transforms.values());
  }

  /**
   * Apply transformation to manifest
   */
  applyTransform(
    manifest: OssaAgent,
    fromVersion: string,
    toVersion: string
  ): OssaAgent {
    const transform = this.getTransform(fromVersion, toVersion);

    if (!transform) {
      throw new Error(
        `No transformation found for ${fromVersion} → ${toVersion}`
      );
    }

    return transform.transform(manifest);
  }

  /**
   * Transform v0.3.3 → v0.3.4
   * Adds: checkpointing, completion signals
   */
  private transformV033ToV034(manifest: OssaAgent): OssaAgent {
    const migrated: OssaAgent = JSON.parse(JSON.stringify(manifest));

    // Update apiVersion
    migrated.apiVersion = 'ossa/v0.3.4';

    // Update labels
    if (migrated.metadata?.labels) {
      migrated.metadata.labels['ossa-version'] = 'v0.3.4';
    }

    // Add migration annotation
    if (migrated.metadata?.annotations) {
      migrated.metadata.annotations['ossa.io/migration'] = 'v0.3.3-to-v0.3.4';
      migrated.metadata.annotations['ossa.io/migrated-date'] = new Date()
        .toISOString()
        .split('T')[0];
    }

    // Add checkpointing if not present
    const spec = migrated.spec as Record<string, unknown>;
    if (spec && !spec.checkpointing) {
      spec.checkpointing = {
        enabled: false, // Opt-in feature
        interval: 'iteration',
        interval_value: 10,
        storage: {
          backend: 'memory',
        },
      };
    }

    // Add completion signals if not present
    if (spec && !spec.completion) {
      spec.completion = {
        default_signal: 'complete',
        signals: [
          {
            signal: 'continue',
            condition: 'iteration_count < max_iterations',
          },
        ],
      };
    }

    return migrated;
  }

  /**
   * Transform v0.3.4 → v0.3.5
   * Adds: MoE, BAT framework, capability discovery, feedback loops
   */
  private transformV034ToV035(manifest: OssaAgent): OssaAgent {
    const migrated: OssaAgent = JSON.parse(JSON.stringify(manifest));

    // Update apiVersion
    migrated.apiVersion = 'ossa/v0.3.5';

    // Update labels
    if (migrated.metadata?.labels) {
      migrated.metadata.labels['ossa-version'] = 'v0.3.5';
    }

    // Add migration annotation
    if (migrated.metadata?.annotations) {
      migrated.metadata.annotations['ossa.io/migration'] = 'v0.3.4-to-v0.3.5';
      migrated.metadata.annotations['ossa.io/migrated-date'] = new Date()
        .toISOString()
        .split('T')[0];
    }

    // Fix observability.metrics structure if needed
    const spec = migrated.spec as Record<string, unknown>;
    if (spec?.observability) {
      const obs = spec.observability as Record<string, unknown>;

      // Normalize metrics to object format (v0.3.5 expects object, not boolean)
      if (obs.metrics === true || obs.metrics === false) {
        obs.metrics = {
          enabled: obs.metrics as boolean,
        };
      } else if (!obs.metrics) {
        obs.metrics = {
          enabled: true,
        };
      }
    }

    // Add MOE metrics extension (opt-in)
    const extensions = (migrated.spec as Record<string, unknown>).extensions as
      | Record<string, unknown>
      | undefined;

    if (extensions && !extensions.moe) {
      // Only add if other extensions exist (indicates advanced usage)
      extensions.moe = {
        primary: {
          metric: 'task_success_rate',
          target: 0.95,
          measurement: {
            type: 'ratio',
            numerator: 'successful_tasks',
            denominator: 'total_tasks',
          },
        },
      };
    }

    return migrated;
  }

  /**
   * Transform v0.3.5 → v0.3.6
   * Maintenance release
   */
  private transformV035ToV036(manifest: OssaAgent): OssaAgent {
    const migrated: OssaAgent = JSON.parse(JSON.stringify(manifest));

    // Update apiVersion
    migrated.apiVersion = 'ossa/v0.3.6';

    // Update labels
    if (migrated.metadata?.labels) {
      migrated.metadata.labels['ossa-version'] = 'v0.3.6';
    }

    // Add migration annotation
    if (migrated.metadata?.annotations) {
      migrated.metadata.annotations['ossa.io/migration'] = 'v0.3.5-to-v0.3.6';
      migrated.metadata.annotations['ossa.io/migrated-date'] = new Date()
        .toISOString()
        .split('T')[0];
    }

    return migrated;
  }

  /**
   * Transform v0.3.3 → v0.3.6 (direct)
   */
  private transformV033ToV036(manifest: OssaAgent): OssaAgent {
    let migrated = this.transformV033ToV034(manifest);
    migrated = this.transformV034ToV035(migrated);
    migrated = this.transformV035ToV036(migrated);

    if (migrated.metadata?.annotations) {
      migrated.metadata.annotations['ossa.io/migration'] = 'v0.3.3-to-v0.3.6';
    }

    return migrated;
  }

  /**
   * Transform v0.3.4 → v0.3.6 (direct)
   */
  private transformV034ToV036(manifest: OssaAgent): OssaAgent {
    let migrated = this.transformV034ToV035(manifest);
    migrated = this.transformV035ToV036(migrated);

    if (migrated.metadata?.annotations) {
      migrated.metadata.annotations['ossa.io/migration'] = 'v0.3.4-to-v0.3.6';
    }

    return migrated;
  }

  /**
   * Validate critical fields are preserved during migration
   * Returns warnings for any data loss
   */
  validateMigration(original: OssaAgent, migrated: OssaAgent): string[] {
    const warnings: string[] = [];

    // Critical fields that must be preserved
    const criticalFields = [
      ['metadata', 'name'],
      ['spec', 'role'],
      ['spec', 'llm'],
      ['spec', 'capabilities'],
    ];

    for (const path of criticalFields) {
      const originalValue = this.getNestedValue(
        original as Record<string, unknown>,
        path
      );
      const migratedValue = this.getNestedValue(
        migrated as Record<string, unknown>,
        path
      );

      if (originalValue !== undefined && migratedValue === undefined) {
        warnings.push(
          `Critical field lost during migration: ${path.join('.')}`
        );
      }

      // Check for structural changes
      if (
        originalValue !== undefined &&
        migratedValue !== undefined &&
        typeof originalValue !== typeof migratedValue
      ) {
        warnings.push(
          `Field type changed during migration: ${path.join('.')} (${typeof originalValue} → ${typeof migratedValue})`
        );
      }
    }

    return warnings;
  }

  /**
   * Get nested value from object by path
   */
  private getNestedValue(
    obj: OssaAgent | Record<string, unknown>,
    path: string[]
  ): unknown {
    let current: unknown = obj;
    for (const key of path) {
      if (current && typeof current === 'object' && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }
    return current;
  }

  /**
   * Get transformation summary for user feedback
   */
  getTransformSummary(fromVersion: string, toVersion: string): string[] {
    const transform = this.getTransform(fromVersion, toVersion);
    if (!transform) {
      return [`No transformation available for ${fromVersion} → ${toVersion}`];
    }

    const summary: string[] = [
      `Migration: ${fromVersion} → ${toVersion}`,
      `Description: ${transform.description}`,
      `Breaking: ${transform.breaking ? 'Yes' : 'No'}`,
      `Reversible: ${transform.reversible ? 'Yes' : 'No'}`,
    ];

    return summary;
  }
}
