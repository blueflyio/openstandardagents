/**
 * Migration Service
 * Migrates OSSA manifests from legacy formats to current k8s-style format (apiVersion/kind/metadata/spec)
 *
 * Supported migrations:
 * - ossaVersion: "1.0" (legacy) → current apiVersion
 * - Any older ossa/v0.x.x → current apiVersion
 *
 * Features added during migration:
 * - Runtime-configurable LLM models via environment variables
 * - Fallback models for multi-provider resilience
 * - Cost tracking with budget alerts
 * - Retry configuration with exponential backoff
 * - Safety configuration (content filtering, guardrails)
 * - Observability (tracing, metrics, logging)
 *
 * IMPORTANT: Version numbers are NEVER hardcoded. All versions are derived
 * dynamically from package.json via getVersionInfo().
 */

import { injectable, inject } from 'inversify';
import type { OssaAgent, SchemaVersion } from '../types/index.js';
import { getVersionInfo } from '../utils/version.js';
import {
  VersionDetectionService,
  type VersionDetectionResult,
} from './version-detection.service.js';
import { MigrationTransformService } from './migration-transform.service.js';
import {
  GitRollbackService,
  type RollbackPoint,
} from './git-rollback.service.js';

/**
 * Migration changes summary for user feedback
 */
export interface MigrationSummary {
  sourceVersion: string;
  targetVersion: string;
  changes: string[];
  addedFeatures: string[];
  warnings: string[];
}

/**
 * Batch migration result
 */
export interface BatchMigrationResult {
  success: boolean;
  total: number;
  succeeded: number;
  failed: number;
  results: MigrationResult[];
  rollbackPoint?: RollbackPoint;
}

/**
 * Individual migration result
 */
export interface MigrationResult {
  success: boolean;
  manifest?: OssaAgent;
  sourceVersion: string;
  targetVersion: string;
  error?: string;
  warnings: string[];
  summary?: MigrationSummary;
}

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
  constructor(
    @inject(VersionDetectionService)
    private versionDetector: VersionDetectionService,
    @inject(MigrationTransformService)
    private transformService: MigrationTransformService,
    @inject(GitRollbackService) private gitRollback: GitRollbackService
  ) {}

  /**
   * Get the current target apiVersion (OSSA spec version, not package version)
   */
  private getCurrentApiVersion(): string {
    const versionInfo = getVersionInfo();
    return versionInfo.apiVersion;
  }

  /**
   * Migrate manifest to target version (current version from package.json)
   * @param manifest - Source manifest
   * @param targetVersion - Target version (defaults to 'current' which reads from package.json)
   * @returns Migrated manifest
   */
  async migrate(
    manifest: unknown,
    _targetVersion: SchemaVersion = 'current'
  ): Promise<OssaAgent> {
    const m = manifest as Record<string, unknown>;
    const currentApiVersion = this.getCurrentApiVersion();

    // Check for legacy v1.0 format first
    if (m.ossaVersion === '1.0' && m.agent) {
      // Legacy v1.0 format - migrate to k8s-style
      return this.migrateV1ToKubeStyle(m as unknown as V1Manifest);
    }

    // Detect source version - check for ossa/v0.x.x format
    if (
      typeof m.apiVersion === 'string' &&
      m.apiVersion.startsWith('ossa/v') &&
      m.kind === 'Agent'
    ) {
      // Check if it's already at current version
      if (m.apiVersion === currentApiVersion) {
        return manifest as OssaAgent;
      }

      // Older version - migrate to current
      return this.migrateToCurrentVersion(manifest as OssaAgent);
    }

    if (m.apiVersion && m.kind && m.metadata && m.spec) {
      // Already in k8s-style format but unknown version
      return this.migrateToCurrentVersion(manifest as OssaAgent);
    }

    throw new Error('Unsupported manifest format');
  }

  /**
   * Migrate any older k8s-style manifest to current version
   * Adds new features while preserving existing configuration
   */
  private migrateToCurrentVersion(manifest: OssaAgent): OssaAgent {
    const migrated: OssaAgent = JSON.parse(JSON.stringify(manifest));
    const versionInfo = getVersionInfo();
    const currentApiVersion = versionInfo.apiVersion;
    const sourceVersion = manifest.apiVersion || 'unknown';

    // Update apiVersion to current
    migrated.apiVersion = currentApiVersion;

    // Add ossa-version label
    if (!migrated.metadata) {
      migrated.metadata = { name: 'unknown' };
    }
    if (!migrated.metadata.labels) {
      migrated.metadata.labels = {};
    }
    migrated.metadata.labels['ossa-version'] = versionInfo.apiVersion;

    // Add migration annotation
    if (!migrated.metadata.annotations) {
      migrated.metadata.annotations = {};
    }
    migrated.metadata.annotations['ossa.io/migration'] =
      `${sourceVersion}-to-${currentApiVersion}`;
    migrated.metadata.annotations['ossa.io/migrated-date'] = new Date()
      .toISOString()
      .split('T')[0];

    // Enhance LLM config with new features
    if (migrated.spec) {
      const spec = migrated.spec as Record<string, unknown>;

      // Migrate LLM config to use env vars and add fallback/cost tracking
      if (spec.llm) {
        const llm = spec.llm as Record<string, unknown>;

        // Convert hardcoded provider/model to env var pattern
        const currentProvider = String(llm.provider || 'anthropic');
        const currentModel = String(llm.model || 'claude-sonnet-4');

        // Only convert if not already using env vars
        if (!String(llm.provider).includes('${')) {
          llm.provider = `\${LLM_PROVIDER:-${currentProvider}}`;
        }
        if (!String(llm.model).includes('${')) {
          llm.model = `\${LLM_MODEL:-${currentModel}}`;
        }

        // Normalize temperature/maxTokens field names
        if (llm.parameters) {
          const params = llm.parameters as Record<string, unknown>;
          if (
            params.temperature !== undefined &&
            llm.temperature === undefined
          ) {
            llm.temperature = params.temperature;
          }
          if (params.max_tokens !== undefined && llm.maxTokens === undefined) {
            llm.maxTokens = params.max_tokens;
          }
          delete llm.parameters;
        }

        // Add fallback_models if not present
        if (!llm.fallback_models) {
          llm.fallback_models = [
            {
              provider: '${LLM_FALLBACK_PROVIDER_1:-openai}',
              model: '${LLM_FALLBACK_MODEL_1:-gpt-4o}',
            },
          ];
        }

        // Add retry_config if not present
        if (!llm.retry_config) {
          llm.retry_config = {
            max_attempts: 3,
            backoff_strategy: 'exponential',
          };
        }

        // Add cost_tracking if not present
        if (!llm.cost_tracking) {
          llm.cost_tracking = {
            enabled: true,
            budget_alert_threshold: 50.0,
            cost_allocation_tags: {
              platform: migrated.metadata.labels?.platform || 'unknown',
              team: 'default',
            },
          };
        }
      }

      // Add autonomy if not present
      if (!spec.autonomy) {
        spec.autonomy = {
          level: 'assisted',
        };
      }

      // Add constraints if not present
      if (!spec.constraints) {
        spec.constraints = {
          cost: {
            maxTokensPerDay: 100000,
            maxCostPerDay: 10.0,
          },
        };
      }

      // Add observability if not present
      if (!spec.observability) {
        spec.observability = {
          logging: { level: 'info' },
          metrics: { enabled: true },
          tracing: { enabled: true },
        };
      }

      // Add safety if not present
      if (!spec.safety) {
        spec.safety = {
          content_filtering: { enabled: true },
          guardrails: { enabled: true },
        };
      }
    }

    return migrated;
  }

  /**
   * Get migration summary for user feedback
   */
  getMigrationSummary(source: unknown, migrated: OssaAgent): MigrationSummary {
    const m = source as Record<string, unknown>;
    const versionInfo = getVersionInfo();
    let sourceVersion = 'unknown';

    if (m.ossaVersion === '1.0') {
      sourceVersion = 'v1.0 (legacy)';
    } else if (typeof m.apiVersion === 'string') {
      sourceVersion = m.apiVersion.replace('ossa/', '');
    }

    const summary: MigrationSummary = {
      sourceVersion,
      targetVersion: versionInfo.apiVersion,
      changes: [],
      addedFeatures: [],
      warnings: [],
    };

    // Detect what was added
    const spec = migrated.spec as Record<string, unknown>;
    if (spec?.llm) {
      const llm = spec.llm as Record<string, unknown>;
      if (llm.fallback_models) {
        summary.addedFeatures.push(
          'Fallback models for multi-provider resilience'
        );
      }
      if (llm.retry_config) {
        summary.addedFeatures.push(
          'Retry configuration with exponential backoff'
        );
      }
      if (llm.cost_tracking) {
        summary.addedFeatures.push('Cost tracking with budget alerts');
      }
      if (String(llm.provider).includes('${')) {
        summary.addedFeatures.push(
          'Runtime-configurable LLM via environment variables'
        );
      }
    }

    if (spec?.safety) {
      summary.addedFeatures.push(
        'Safety configuration (content filtering, guardrails)'
      );
    }

    if (spec?.observability) {
      summary.addedFeatures.push('Observability (tracing, metrics, logging)');
    }

    if (spec?.autonomy) {
      summary.addedFeatures.push('Autonomy level configuration');
    }

    if (spec?.constraints) {
      summary.addedFeatures.push('Cost and rate constraints');
    }

    summary.changes.push(
      `Updated apiVersion from ${sourceVersion} to ${versionInfo.apiVersion}`
    );
    summary.changes.push(`Added ossa-version: ${versionInfo.apiVersion} label`);

    return summary;
  }

  /**
   * Get the source version of a manifest
   */
  getSourceVersion(manifest: unknown): string {
    const m = manifest as Record<string, unknown>;

    if (m.ossaVersion === '1.0') {
      return 'v1.0 (legacy)';
    }

    if (typeof m.apiVersion === 'string') {
      return m.apiVersion.replace('ossa/', '');
    }

    return 'unknown';
  }

  /**
   * Migrate legacy v1.0 manifest to k8s-style format
   */
  private migrateV1ToKubeStyle(v1: V1Manifest): OssaAgent {
    const versionInfo = getVersionInfo();
    const currentApiVersion = versionInfo.apiVersion;

    const migrated: OssaAgent = {
      apiVersion: currentApiVersion,
      kind: 'Agent',
      metadata: {
        name: v1.agent.id,
        version: v1.agent.version || '0.1.0',
        description: v1.agent.description || '',
        labels: {
          'ossa-version': versionInfo.apiVersion,
        } as Record<string, string>,
        annotations: {
          'ossa.io/migration': `legacy-v1.0-to-${currentApiVersion}`,
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
      const llm = v1.agent.llm;
      migrated.spec.llm = {
        provider:
          llm.provider === 'auto' ? 'openai' : String(llm.provider || 'openai'),
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
      const obs = v1.agent.observability || v1.agent.monitoring;
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
    targetVersion: SchemaVersion = 'current'
  ): Promise<OssaAgent[]> {
    return Promise.all(manifests.map((m) => this.migrate(m, targetVersion)));
  }

  /**
   * Check if manifest needs migration to current version
   */
  needsMigration(manifest: unknown): boolean {
    const m = manifest as Record<string, unknown>;
    const currentApiVersion = this.getCurrentApiVersion();

    // Legacy v1.0 format always needs migration
    if (m.ossaVersion === '1.0' && m.agent) {
      return true;
    }

    // Check if it's an older ossa/v0.x.x version
    if (typeof m.apiVersion === 'string' && m.apiVersion.startsWith('ossa/v')) {
      // Already at current version - no migration needed
      if (m.apiVersion === currentApiVersion) {
        return false;
      }
      // Older version needs migration
      return true;
    }

    return false;
  }

  /**
   * Migrate single manifest with version detection
   * Enhanced version that uses VersionDetectionService and MigrationTransformService
   */
  async migrateWithDetection(
    manifest: unknown,
    targetVersion?: string
  ): Promise<MigrationResult> {
    try {
      // Detect source version
      const detection = await this.versionDetector.detectVersion(manifest);

      if (detection.version === 'unknown') {
        return {
          success: false,
          sourceVersion: 'unknown',
          targetVersion: targetVersion || 'current',
          error: 'Unable to detect manifest version',
          warnings: detection.warnings,
        };
      }

      // Determine target version
      const target = targetVersion || getVersionInfo().version;

      // Check if migration needed
      if (!this.versionDetector.needsMigration(detection.version, target)) {
        return {
          success: true,
          manifest: manifest as OssaAgent,
          sourceVersion: detection.version,
          targetVersion: target,
          warnings: ['Manifest already at target version'],
        };
      }

      // Perform migration
      const migrated = await this.migrate(
        manifest,
        (targetVersion as SchemaVersion) || 'current'
      );

      // Get summary
      const summary = this.getMigrationSummary(manifest, migrated);

      // Validate migration
      const validationWarnings = this.transformService.validateMigration(
        manifest as OssaAgent,
        migrated
      );

      return {
        success: true,
        manifest: migrated,
        sourceVersion: detection.version,
        targetVersion: target,
        warnings: [...detection.warnings, ...validationWarnings],
        summary,
      };
    } catch (error) {
      return {
        success: false,
        sourceVersion: 'unknown',
        targetVersion: targetVersion || 'current',
        error: error instanceof Error ? error.message : 'Unknown error',
        warnings: [],
      };
    }
  }

  /**
   * Migrate multiple manifests in batch with parallel execution
   * @param manifests - Array of manifests to migrate
   * @param targetVersion - Target version (defaults to current)
   * @param options - Batch migration options
   */
  async migrateBatch(
    manifests: unknown[],
    targetVersion?: string,
    options?: {
      parallel?: boolean;
      maxConcurrent?: number;
      stopOnError?: boolean;
      gitRollback?: boolean;
      workingDirectory?: string;
    }
  ): Promise<BatchMigrationResult> {
    const {
      parallel = true,
      maxConcurrent = 5,
      stopOnError = false,
      gitRollback = false,
      workingDirectory = process.cwd(),
    } = options || {};

    let rollbackPoint: RollbackPoint | undefined;

    // Create git rollback point if requested
    if (gitRollback && this.gitRollback.isGitRepository(workingDirectory)) {
      try {
        rollbackPoint = await this.gitRollback.createMigrationBranch(
          workingDirectory,
          `batch-migration-${targetVersion || 'current'}`
        );
      } catch (error) {
        // Non-fatal: continue without rollback support
        console.warn('Could not create rollback point:', error);
      }
    }

    const results: MigrationResult[] = [];
    let succeeded = 0;
    let failed = 0;

    try {
      if (parallel) {
        // Parallel execution with concurrency limit
        const chunks = this.chunkArray(manifests, maxConcurrent);

        for (const chunk of chunks) {
          const chunkResults = await Promise.all(
            chunk.map((manifest) =>
              this.migrateWithDetection(manifest, targetVersion)
            )
          );

          results.push(...chunkResults);

          // Count successes/failures
          for (const result of chunkResults) {
            if (result.success) {
              succeeded++;
            } else {
              failed++;
              if (stopOnError) {
                throw new Error(`Migration failed: ${result.error}`);
              }
            }
          }
        }
      } else {
        // Sequential execution
        for (const manifest of manifests) {
          const result = await this.migrateWithDetection(
            manifest,
            targetVersion
          );
          results.push(result);

          if (result.success) {
            succeeded++;
          } else {
            failed++;
            if (stopOnError) {
              throw new Error(`Migration failed: ${result.error}`);
            }
          }
        }
      }

      return {
        success: failed === 0,
        total: manifests.length,
        succeeded,
        failed,
        results,
        rollbackPoint,
      };
    } catch (error) {
      // Error occurred - rollback if enabled
      if (rollbackPoint) {
        await this.gitRollback.rollback(workingDirectory, rollbackPoint);
      }

      return {
        success: false,
        total: manifests.length,
        succeeded,
        failed,
        results,
        rollbackPoint,
      };
    }
  }

  /**
   * Finalize batch migration (commit changes)
   */
  async finalizeBatchMigration(
    batchResult: BatchMigrationResult,
    workingDirectory: string = process.cwd()
  ): Promise<boolean> {
    if (!batchResult.rollbackPoint) {
      return true; // No rollback point, nothing to finalize
    }

    const result = await this.gitRollback.finalizeMigration(
      workingDirectory,
      batchResult.rollbackPoint
    );

    return result.success;
  }

  /**
   * Rollback batch migration
   */
  async rollbackBatchMigration(
    batchResult: BatchMigrationResult,
    workingDirectory: string = process.cwd()
  ): Promise<boolean> {
    if (!batchResult.rollbackPoint) {
      return false; // No rollback point
    }

    const result = await this.gitRollback.rollback(
      workingDirectory,
      batchResult.rollbackPoint
    );

    return result.success;
  }

  /**
   * Chunk array for parallel processing
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}
