/**
 * Migration Service
 * Migrates OSSA manifests between versions (v0.1.9 to v0.2.2, legacy formats to v0.2.2)
 */

import { injectable } from 'inversify';
import type { OssaAgent, SchemaVersion } from '../types/index.js';

/**
 * v1.0 manifest structure
 */
interface V1Manifest {
  ossaVersion: '1.0';
  agent: {
    id: string;
    name: string;
    version: string;
    description?: string;
    role: string;
    tags?: string[];
    runtime?: Record<string, unknown>;
    capabilities?: Array<Record<string, unknown>>;
    llm?: Record<string, unknown>;
    tools?: Array<Record<string, unknown>>;
    autonomy?: Record<string, unknown>;
    constraints?: Record<string, unknown>;
    observability?: Record<string, unknown>;
    monitoring?: Record<string, unknown>;
    integration?: Record<string, unknown>;
    deployment?: Record<string, unknown>;
  };
  metadata?: {
    authors?: Array<Record<string, unknown>>;
    license?: string;
    repository?: string;
  };
}

@injectable()
export class MigrationService {
  /**
   * Migrate manifest to target version
   * @param manifest - Source manifest
   * @param targetVersion - Target version
   * @returns Migrated manifest
   */
  async migrate(
    manifest: unknown,
    _targetVersion: SchemaVersion = '0.2.2'
  ): Promise<OssaAgent> {
    const m = manifest as Record<string, unknown>;

    // Detect source version
    if (m.apiVersion === 'ossa/v1' && m.kind === 'Agent') {
      // Already v0.2.2 format
      return manifest as OssaAgent;
    }

    if (m.ossaVersion === '1.0' && m.agent) {
      // v1.0 to v0.2.2
      return this.migrateV1ToV022(m as unknown as V1Manifest);
    }

    if (m.apiVersion && m.kind && m.metadata && m.spec) {
      // Already in v0₁.9/v0.2.2 format, just return
      return manifest as OssaAgent;
    }

    throw new Error('Unsupported manifest format');
  }

  /**
   * Migrate v1.0 manifest to v0.2.2
   */
  private migrateV1ToV022(v1: V1Manifest): OssaAgent {
    const migrated: OssaAgent = {
      apiVersion: 'ossa/v1',
      kind: 'Agent',
      metadata: {
        name: v1.agent.id,
        version: v1.agent.version || '0.1.0',
        description: v1.agent.description || '',
        labels: {} as Record<string, string>,
        annotations: {
          'ossa.io/migration': 'v1.0 to v0.2.2',
          'ossa.io/migrated-date': new Date().toISOString().split('T')[0],
        },
      },
      spec: {
        role: v1.agent.role,
      },
    };

    // Convert tags to labels
    if (
      v1.agent.tags &&
      Array.isArray(v1.agent.tags) &&
      migrated.metadata?.labels
    ) {
      v1.agent.tags.forEach((tag) => {
        if (typeof tag === 'string') {
          migrated.metadata!.labels![tag] = 'true';
        }
      });
    }

    // Copy metadata
    if (v1.metadata && migrated.metadata?.annotations) {
      if (v1.metadata.authors) {
        migrated.metadata.annotations.author = Array.isArray(
          v1.metadata.authors
        )
          ? v1.metadata.authors.join(', ')
          : String(v1.metadata.authors);
      }
      if (v1.metadata.license) {
        migrated.metadata.annotations.license = String(v1.metadata.license);
      }
      if (v1.metadata.repository) {
        migrated.metadata.annotations.repository = String(
          v1.metadata.repository
        );
      }
    }

    // Detect taxonomy - add to spec as Record since it's not in base type
    if (migrated.spec) {
      const specRecord = migrated.spec as Record<string, unknown>;
      specRecord.taxonomy = {
        domain: this.detectDomain(v1.agent),
        subdomain: this.detectSubdomain(v1.agent),
        capability: this.detectCapability(v1.agent),
      };
    }

    // Convert LLM config with normalization
    if (v1.agent.llm && migrated.spec) {
      const llm = v1.agent.llm as Record<string, unknown>;
      migrated.spec.llm = {
        provider: (llm.provider === 'auto'
          ? 'openai'
          : String(llm.provider || 'openai')) as string,
        model: String(llm.model || ''),
        temperature:
          typeof llm.temperature === 'number' ? llm.temperature : undefined,
        maxTokens:
          typeof llm.maxTokens === 'number' ? llm.maxTokens : undefined,
        topP: typeof llm.topP === 'number' ? llm.topP : undefined,
      };
    }

    // Convert capabilities to tools
    if (
      v1.agent.capabilities &&
      Array.isArray(v1.agent.capabilities) &&
      migrated.spec &&
      migrated.metadata
    ) {
      const mcpRecord = v1.agent.integration?.mcp as
        | Record<string, unknown>
        | undefined;
      const metadataName = migrated.metadata.name;
      migrated.spec.tools = v1.agent.capabilities.map((cap) => ({
        type: 'mcp',
        name: (cap.name as string | undefined) || 'unnamed_tool',
        server: (mcpRecord?.server_name as string | undefined) || metadataName,
      }));
    }

    // Convert autonomy, constraints
    if (migrated.spec) {
      const specRecord = migrated.spec as Record<string, unknown>;
      if (v1.agent.autonomy) specRecord.autonomy = v1.agent.autonomy;
      if (v1.agent.constraints) specRecord.constraints = v1.agent.constraints;
    }

    // Handle observability with proper structure
    if ((v1.agent.observability || v1.agent.monitoring) && migrated.spec) {
      const obs = (v1.agent.observability || v1.agent.monitoring) as
        | Record<string, unknown>
        | undefined;
      if (obs) {
        const metricsValue = obs.metrics;
        let normalizedMetrics: Record<string, unknown>;

        if (metricsValue === true) {
          normalizedMetrics = { enabled: true };
        } else if (metricsValue && typeof metricsValue === 'object') {
          normalizedMetrics = metricsValue as Record<string, unknown>;
        } else {
          normalizedMetrics = { enabled: true };
        }

        if (obs.tracing || normalizedMetrics || obs.logging) {
          const specRecord = migrated.spec as Record<string, unknown>;
          specRecord.observability = {
            tracing: obs.tracing || { enabled: true },
            metrics: normalizedMetrics,
            logging: obs.logging || { level: 'info', format: 'json' },
          };
        }
      }
    }

    // Create extensions section
    if (migrated.spec) {
      const specRecord = migrated.spec as Record<string, unknown>;
      specRecord.extensions = {};
    }

    // MCP extension
    if (v1.agent.integration?.mcp && migrated.spec) {
      const mcpRecord = v1.agent.integration.mcp as Record<string, unknown>;
      const specRecord = migrated.spec as Record<string, unknown>;
      if (!specRecord.extensions) {
        specRecord.extensions = {};
      }
      (specRecord.extensions as Record<string, unknown>).mcp = {
        enabled: (mcpRecord.enabled as boolean | undefined) !== false,
        server_type:
          (mcpRecord.protocol as string | undefined) ||
          (mcpRecord.server_type as string | undefined) ||
          'stdio',
      };
    }

    // Buildkit extension
    if ((v1.agent.deployment || v1.agent.runtime) && migrated.spec) {
      const specRecord = migrated.spec as Record<string, unknown>;
      if (!specRecord.extensions) {
        specRecord.extensions = {};
      }
      (specRecord.extensions as Record<string, unknown>).buildkit = {
        deployment: {
          replicas: v1.agent.deployment?.replicas || { min: 1, max: 4 },
        },
        container: {
          image: v1.agent.runtime?.image,
          runtime: v1.agent.runtime?.type || 'docker',
          resources: v1.agent.runtime?.resources || {},
        },
      };
    }

    // kagent extension
    if (
      v1.agent.runtime?.type === 'k8s' &&
      migrated.spec &&
      migrated.metadata
    ) {
      const specRecord = migrated.spec as Record<string, unknown>;
      if (!specRecord.extensions) {
        specRecord.extensions = {};
      }
      (specRecord.extensions as Record<string, unknown>).kagent = {
        kubernetes: {
          namespace: 'default',
          labels: { app: migrated.metadata.name },
        },
        deployment: { replicas: 2, strategy: 'rolling-update' },
      };
    }

    // Runtime extension
    if (v1.agent.runtime && migrated.spec) {
      const specRecord = migrated.spec as Record<string, unknown>;
      if (!specRecord.extensions) {
        specRecord.extensions = {};
      }
      (specRecord.extensions as Record<string, unknown>).runtime =
        v1.agent.runtime;
    }

    // Integration extension
    if (v1.agent.integration) {
      const specRecord = migrated.spec as Record<string, unknown>;
      if (!specRecord.extensions) {
        specRecord.extensions = {};
      }
      (specRecord.extensions as Record<string, unknown>).integration =
        v1.agent.integration;
    }

    return migrated;
  }

  private detectDomain(agent: Record<string, unknown>): string {
    const tags = Array.isArray(agent.tags) ? agent.tags : [];
    const text = [agent.id, agent.name, agent.description, ...tags]
      .join(' ')
      .toLowerCase();
    if (text.includes('infrastructure') || text.includes('k8s'))
      return 'infrastructure';
    if (text.includes('security') || text.includes('compliance'))
      return 'security';
    if (text.includes('data') || text.includes('vector')) return 'data';
    if (text.includes('chat')) return 'conversation';
    if (text.includes('workflow')) return 'automation';
    return 'integration';
  }

  private detectSubdomain(agent: Record<string, unknown>): string {
    const text = [agent.id, agent.name].join(' ').toLowerCase();
    if (text.includes('kubernetes') || text.includes('k8s'))
      return 'kubernetes';
    if (text.includes('protocol') || text.includes('mcp')) return 'protocol';
    if (text.includes('workflow')) return 'workflow';
    return 'general';
  }

  private detectCapability(agent: Record<string, unknown>): string {
    const text = [agent.id, agent.name].join(' ').toLowerCase();
    if (text.includes('troubleshoot')) return 'troubleshooting';
    if (text.includes('monitor')) return 'monitoring';
    if (text.includes('route')) return 'routing';
    if (text.includes('search')) return 'search';
    return 'general';
  }

  /**
   * Migrate multiple manifests
   */
  async migrateMany(
    manifests: unknown[],
    targetVersion: SchemaVersion = '0.2.2'
  ): Promise<OssaAgent[]> {
    return Promise.all(manifests.map((m) => this.migrate(m, targetVersion)));
  }

  /**
   * Check if manifest needs migration
   */
  needsMigration(manifest: unknown): boolean {
    const m = manifest as Record<string, unknown>;
    return !!(m.ossaVersion === '1.0' && m.agent);
  }
}
