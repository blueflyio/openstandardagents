/**
 * Migration Service
 * Migrates OSSA manifests from v0.1.9 to v1.0
 */

import { injectable } from 'inversify';
import type { OssaAgent } from '../types/index';

/**
 * Legacy v0.1.9 manifest structure
 */
interface LegacyManifest {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    version?: string;
    description?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec: {
    taxonomy?: {
      domain?: string;
      subdomain?: string;
      capability?: string;
    };
    role: string;
    llm?: Record<string, any>;
    tools?: any[];
    autonomy?: Record<string, any>;
    constraints?: Record<string, any>;
    observability?: Record<string, any>;
  };
  extensions?: Record<string, any>;
}

@injectable()
export class MigrationService {
  /**
   * Migrate v0.1.9 manifest to v1.0
   * @param legacy - Legacy v0.1.9 manifest
   * @returns Migrated v1.0 manifest
   */
  async migrate(legacy: unknown): Promise<OssaAgent> {
    const legacyManifest = legacy as LegacyManifest;

    // Validate it's a v0.1.9 manifest
    if (!legacyManifest.apiVersion || !legacyManifest.kind) {
      throw new Error('Not a valid v0.1.9 manifest');
    }

    if (legacyManifest.kind !== 'Agent') {
      throw new Error(`Unsupported kind: ${legacyManifest.kind}`);
    }

    // Convert to v1.0 format
    const manifest: OssaAgent = {
      ossaVersion: '1.0',
      agent: {
        id: this.normalizeId(legacyManifest.metadata.name),
        name: legacyManifest.metadata.name,
        version: legacyManifest.metadata.version || '1.0.0',
        role: this.mapRole(legacyManifest.spec.role),
        description: legacyManifest.metadata.description,
        runtime: this.migrateRuntime(legacyManifest),
        capabilities: this.migrateCapabilities(legacyManifest),
      },
    };

    // Migrate LLM config
    if (legacyManifest.spec.llm) {
      manifest.agent.llm = legacyManifest.spec.llm;
    }

    // Migrate tools (if any)
    if (legacyManifest.spec.tools && legacyManifest.spec.tools.length > 0) {
      manifest.agent.tools = legacyManifest.spec.tools;
    }

    // Migrate extensions (move from spec.extensions to root.extensions)
    if (legacyManifest.extensions) {
      manifest.extensions = legacyManifest.extensions;
    }

    return manifest;
  }

  /**
   * Normalize ID to DNS-1123 format
   */
  private normalizeId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-')
      .substring(0, 63);
  }

  /**
   * Map v0.1.9 role to v1.0 role enum
   */
  private mapRole(role: string): string {
    const roleMap: Record<string, string> = {
      // Direct mappings
      chat: 'chat',
      compliance: 'compliance',
      workflow: 'workflow',
      audit: 'audit',
      orchestration: 'orchestration',
      monitoring: 'monitoring',
      data_processing: 'data_processing',
      integration: 'integration',
      development: 'development',
      // Legacy mappings
      worker: 'custom',
      orchestrator: 'orchestration',
      integrator: 'integration',
      monitor: 'monitoring',
      critic: 'audit',
      judge: 'audit',
      governor: 'compliance',
    };

    return roleMap[role] || 'custom';
  }

  /**
   * Migrate runtime configuration
   */
  private migrateRuntime(legacy: LegacyManifest): any {
    // In v0.1.9, runtime wasn't explicit
    // Infer from extensions or default to docker
    const kagentExt = legacy.extensions?.kagent;

    if (kagentExt && kagentExt.kubernetes) {
      return {
        type: 'k8s',
      };
    }

    return {
      type: 'docker',
      image: `${this.normalizeId(legacy.metadata.name)}:${legacy.metadata.version || '1.0.0'}`,
    };
  }

  /**
   * Migrate capabilities
   * In v0.1.9, capabilities were implied by tools/role
   * In v1.0, capabilities are explicit OpenAPI-style operations
   */
  private migrateCapabilities(legacy: LegacyManifest): any[] {
    // Generate basic capability from role
    const role = legacy.spec.role || 'custom';

    return [
      {
        name: `${role}_operation`,
        description: `Primary ${role} operation`,
        input_schema: {
          type: 'object',
          properties: {
            input: { type: 'string', description: 'Input data' },
          },
        },
        output_schema: {
          type: 'object',
          properties: {
            output: { type: 'string', description: 'Output result' },
          },
        },
      },
    ];
  }

  /**
   * Migrate multiple manifests
   * @param legacyManifests - Array of legacy manifests
   * @returns Array of migrated manifests
   */
  async migrateMany(legacyManifests: unknown[]): Promise<OssaAgent[]> {
    return Promise.all(legacyManifests.map((m) => this.migrate(m)));
  }

  /**
   * Check if manifest needs migration
   * @param manifest - Manifest to check
   * @returns True if migration needed
   */
  needsMigration(manifest: unknown): boolean {
    const m = manifest as any;
    return !!(m.apiVersion && m.kind && !m.ossaVersion);
  }
}
