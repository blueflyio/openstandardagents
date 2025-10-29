/**
 * Migration Service
 * Migrates OSSA manifests between versions (v0.1.9 to v0.2.2, v1.0 to v0.2.2)
 */

import { injectable } from 'inversify';
import type { SchemaVersion } from '../types/index.js';

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
    runtime?: any;
    capabilities?: any[];
    llm?: any;
    tools?: any;
    autonomy?: any;
    constraints?: any;
    observability?: any;
    monitoring?: any;
    integration?: any;
    deployment?: any;
  };
  metadata?: {
    authors?: any;
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
    targetVersion: SchemaVersion = '0.2.2'
  ): Promise<any> {
    const m = manifest as any;

    // Detect source version
    if (m.apiVersion === 'ossa/v1' && m.kind === 'Agent') {
      // Already v0.2.2 format
      return manifest;
    }

    if (m.ossaVersion === '1.0' && m.agent) {
      // v1.0 to v0.2.2
      return this.migrateV1ToV022(m as V1Manifest);
    }

    if (m.apiVersion && m.kind && m.metadata && m.spec) {
      // Already in v0₁.9/v0.2.2 format, just return
      return manifest;
    }

    throw new Error('Unsupported manifest format');
  }

  /**
   * Migrate v1.0 manifest to v0.2.2
   */
  private migrateV1ToV022(v1: V1Manifest): any {
    const migrated: any = {
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
    if (v1.agent.tags && Array.isArray(v1.agent.tags)) {
      v1.agent.tags.forEach((tag) => {
        migrated.metadata.labels[tag] = 'true';
      });
    }

    // Copy metadata
    if (v1.metadata) {
      if (v1.metadata.authors) {
        migrated.metadata.annotations.author = Array.isArray(
          v1.metadata.authors
        )
          ? v1.metadata.authors.join(', ')
          : v1.metadata.authors;
      }
      if (v1.metadata.license) {
        migrated.metadata.annotations.license = v1.metadata.license;
      }
      if (v1.metadata.repository) {
        migrated.metadata.annotations.repository = v1.metadata.repository;
      }
    }

    // Detect taxonomy
    migrated.spec.taxonomy = {
      domain: this.detectDomain(v1.agent),
      subdomain: this.detectSubdomain(v1.agent),
      capability: this.detectCapability(v1.agent),
    };

    // Convert LLM config with normalization
    if (v1.agent.llm) {
      migrated.spec.llm = {
        provider:
          v1.agent.llm.provider === 'auto' ? 'openai' : v1.agent.llm.provider,
        model: v1.agent.llm.model,
        temperature: v1.agent.llm.temperature,
        maxTokens: v1.agent.llm.maxTokens,
        topP: v1.agent.llm.topP,
        frequencyPenalty: v1.agent.llm.frequencyPenalty,
        presencePenalty: v1.agent.llm.presencePenalty,
      };
    }

    // Convert capabilities to tools
    if (v1.agent.capabilities && Array.isArray(v1.agent.capabilities)) {
      migrated.spec.tools = v1.agent.capabilities.map((cap) => ({
        type: 'mcp',
        name: cap.name || 'unnamed_tool',
        server:
          v1.agent.integration?.mcp?.server_name || migrated.metadata.name,
      }));
    }

    // Convert autonomy, constraints
    if (v1.agent.autonomy) migrated.spec.autonomy = v1.agent.autonomy;
    if (v1.agent.constraints) migrated.spec.constraints = v1.agent.constraints;

    // Handle observability with proper structure
    if (v1.agent.observability || v1.agent.monitoring) {
      const obs = v1.agent.observability || v1.agent.monitoring;
      let normalizedMetrics: any = obs.metrics;

      if (normalizedMetrics === true) {
        normalizedMetrics = { enabled: true };
      } else if (!normalizedMetrics || typeof normalizedMetrics !== 'object') {
        normalizedMetrics = { enabled: true };
      }

      if (obs.tracing || normalizedMetrics || obs.logging) {
        migrated.spec.observability = {
          tracing: obs.tracing || { enabled: true },
          metrics: normalizedMetrics,
          logging: obs.logging || { level: 'info', format: 'json' },
        };
      }
    }

    // Create extensions section
    migrated.spec.extensions = {};

    // MCP extension
    if (v1.agent.integration?.mcp) {
      migrated.spec.extensions.mcp = {
        enabled: v1.agent.integration.mcp.enabled !== false,
        server_type:
          v1.agent.integration.mcp.protocol ||
          v1.agent.integration.mcp.server_type ||
          'stdio',
      };
    }

    // Buildkit extension
    if (v1.agent.deployment || v1.agent.runtime) {
      migrated.spec.extensions.buildkit = {
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
    if (v1.agent.runtime?.type === 'k8s') {
      migrated.spec.extensions.kagent = {
        kubernetes: {
          namespace: 'default',
          labels: { app: migrated.metadata.name },
        },
        deployment: { replicas: 2, strategy: 'rolling-update' },
      };
    }

    // Runtime extension
    if (v1.agent.runtime) {
      migrated.spec.extensions.runtime = v1.agent.runtime;
    }

    // Integration extension
    if (v1.agent.integration) {
      migrated.spec.extensions.integration = v1.agent.integration;
    }

    return migrated;
  }

  private detectDomain(agent: any): string {
    const text = [
      agent.id,
      agent.name,
      agent.description,
      ...(agent.tags || []),
    ]
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

  private detectSubdomain(agent: any): string {
    const text = [agent.id, agent.name].join(' ').toLowerCase();
    if (text.includes('kubernetes') || text.includes('k8s'))
      return 'kubernetes';
    if (text.includes('protocol') || text.includes('mcp')) return 'protocol';
    if (text.includes('workflow')) return 'workflow';
    return 'general';
  }

  private detectCapability(agent: any): string {
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
  ): Promise<any[]> {
    return Promise.all(manifests.map((m) => this.migrate(m, targetVersion)));
  }

  /**
   * Check if manifest needs migration
   */
  needsMigration(manifest: unknown): boolean {
    const m = manifest as any;
    return !!(m.ossaVersion === '1.0' && m.agent);
  }
}
