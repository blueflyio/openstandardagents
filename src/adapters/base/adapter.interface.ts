/**
 * Base Adapter Interface for OSSA Export System
 *
 * All platform adapters must implement this interface to provide
 * consistent export functionality across different platforms.
 *
 * SOLID: Interface Segregation Principle - Small, focused interface
 * DRY: Reusable across all platform adapters
 */

import * as yaml from 'yaml';
import type { OssaAgent } from '../../types/index.js';
import { isMultiAgentManifest } from '../../services/multi-agent/team-generator.service.js';
import { generatePerfectAgentBundle } from './common-file-generator.js';

// Re-export OssaAgent for adapter usage
export type { OssaAgent };

/**
 * Export result containing generated files
 */
export interface ExportResult {
  /**
   * Platform name (e.g., 'langchain', 'mcp', 'drupal')
   */
  platform: string;

  /**
   * Export status
   */
  success: boolean;

  /**
   * Generated files
   */
  files: ExportFile[];

  /**
   * Export metadata
   */
  metadata?: {
    /**
     * Time taken to export (ms)
     */
    duration?: number;

    /**
     * Platform version
     */
    version?: string;

    /**
     * Warnings during export
     */
    warnings?: string[];

    /**
     * Whether Claude Skill was included
     */
    includeSkill?: boolean;

    /**
     * Additional platform-specific metadata
     */
    [key: string]: unknown;
  };

  /**
   * Error message if export failed
   */
  error?: string;
}

/**
 * Exported file
 */
export interface ExportFile {
  /**
   * Relative file path
   */
  path: string;

  /**
   * File content
   */
  content: string;

  /**
   * File type
   */
  type: 'code' | 'config' | 'documentation' | 'test' | 'other';

  /**
   * Programming language or format
   */
  language?: string;
}

/**
 * Export options
 */
export interface ExportOptions {
  /**
   * Output directory
   */
  outputDir?: string;

  /**
   * Whether to validate export before generation
   */
  validate?: boolean;

  /**
   * Whether to include tests
   */
  includeTests?: boolean;

  /**
   * Whether to include documentation
   */
  includeDocs?: boolean;

  /**
   * Whether to include Claude Skill (SKILL.md)
   */
  includeSkill?: boolean;

  /**
   * Platform-specific options
   */
  platformOptions?: Record<string, unknown>;

  /**
   * Dry run mode - validate only, don't write files
   */
  dryRun?: boolean;

  // ── Perfect Agent Export Options ──────────────────────────────────

  /**
   * Master flag: generate full "Perfect Agent" structure.
   * Enables all include* flags below.
   */
  perfectAgent?: boolean;

  /**
   * Generate .well-known/agent-card.json for universal agent discovery
   */
  includeAgentCard?: boolean;

  /**
   * Generate AGENTS.md (AAIF convention, adopted by 60K+ projects)
   */
  includeAgentsMd?: boolean;

  /**
   * Include multi-agent team scaffolding
   * (auto-detected from spec.team, spec.swarm, or agentArchitecture.pattern)
   */
  includeTeam?: boolean;

  /**
   * Generate identity/ with DID document (.well-known/did.json)
   */
  includeDID?: boolean;

  /**
   * Generate evals/ with CLEAR framework config and golden sets
   */
  includeEvals?: boolean;

  /**
   * Generate governance/ with compliance, policies, audit config
   */
  includeGovernance?: boolean;

  /**
   * Generate observability/ with OTel traces, metrics, dashboards
   */
  includeObservability?: boolean;
}

/**
 * Adapter maturity status
 */
export type AdapterStatus = 'production' | 'beta' | 'alpha' | 'planned';

/**
 * Lightweight config-only export result.
 * Used by MCP tool responses and other contexts where full file scaffolds
 * are too heavy.
 */
export interface ConfigResult {
  /**
   * The converted configuration object (platform-specific JSON)
   */
  config: Record<string, unknown>;

  /**
   * Suggested filename for the config (e.g. 'agent.kagent.yaml')
   */
  filename: string;
}

/**
 * Platform Adapter Interface
 *
 * All export adapters must implement this interface
 */
export interface PlatformAdapter {
  /**
   * Platform identifier (unique)
   */
  readonly platform: string;

  /**
   * Platform display name
   */
  readonly displayName: string;

  /**
   * Platform description
   */
  readonly description: string;

  /**
   * Adapter maturity status — honest reporting of readiness
   */
  readonly status: AdapterStatus;

  /**
   * Supported OSSA versions
   */
  readonly supportedVersions: string[];

  /**
   * Export manifest to platform-specific format
   *
   * @param manifest - OSSA agent manifest
   * @param options - Export options
   * @returns Export result with generated files
   */
  export(manifest: OssaAgent, options?: ExportOptions): Promise<ExportResult>;

  /**
   * Validate manifest can be exported to this platform
   *
   * @param manifest - OSSA agent manifest
   * @returns Validation result
   */
  validate(manifest: OssaAgent): Promise<ValidationResult>;

  /**
   * Get example manifest for this platform
   *
   * @returns Example OSSA manifest optimized for this platform
   */
  getExample(): OssaAgent;

  /**
   * Produce a lightweight JSON config suitable for MCP tool responses.
   * Unlike export() which generates full multi-file project scaffolds,
   * toConfig() returns a single JSON object representing the platform config.
   *
   * @param manifest - OSSA agent manifest
   * @returns Lightweight config result with config object and suggested filename
   */
  toConfig(manifest: OssaAgent): Promise<ConfigResult>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /**
   * Whether manifest is valid for this platform
   */
  valid: boolean;

  /**
   * Validation errors
   */
  errors?: ValidationError[];

  /**
   * Validation warnings
   */
  warnings?: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  /**
   * Error message
   */
  message: string;

  /**
   * JSON path to error location (e.g., 'spec.llm.model')
   */
  path?: string;

  /**
   * Error code
   */
  code?: string;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  /**
   * Warning message
   */
  message: string;

  /**
   * JSON path to warning location
   */
  path?: string;

  /**
   * Suggestion for fixing warning
   */
  suggestion?: string;

  /**
   * Warning code
   */
  code?: string;
}

/**
 * Base adapter implementation with common functionality
 */
export abstract class BaseAdapter implements PlatformAdapter {
  abstract readonly platform: string;
  abstract readonly displayName: string;
  abstract readonly description: string;
  abstract readonly status: AdapterStatus;
  abstract readonly supportedVersions: string[];

  abstract export(
    manifest: OssaAgent,
    options?: ExportOptions
  ): Promise<ExportResult>;

  /**
   * Default validation - checks basic manifest structure
   */
  async validate(manifest: OssaAgent): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check required fields
    if (!manifest.metadata?.name) {
      errors.push({
        message: 'metadata.name is required',
        path: 'metadata.name',
        code: 'MISSING_REQUIRED_FIELD',
      });
    }

    if (!manifest.metadata?.version) {
      errors.push({
        message: 'metadata.version is required',
        path: 'metadata.version',
        code: 'MISSING_REQUIRED_FIELD',
      });
    }

    if (!manifest.spec?.role) {
      warnings.push({
        message: 'spec.role is recommended for better agent behavior',
        path: 'spec.role',
        suggestion: 'Add a system prompt describing the agent role',
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Get example manifest - subclasses should override
   */
  getExample(): OssaAgent {
    return {
      apiVersion: 'ossa/v{{VERSION}}',
      kind: 'Agent',
      metadata: {
        name: 'example-agent',
        version: '1.0.0',
        description: 'Example agent for ' + this.displayName,
      },
      spec: {
        role: 'Example agent role',
      },
    };
  }

  /**
   * Helper: Create export result
   */
  protected createResult(
    success: boolean,
    files: ExportFile[],
    error?: string,
    metadata?: ExportResult['metadata']
  ): ExportResult {
    return {
      platform: this.platform,
      success,
      files,
      error,
      metadata,
    };
  }

  /**
   * Helper: Create export file
   */
  protected createFile(
    path: string,
    content: string,
    type: ExportFile['type'],
    language?: string
  ): ExportFile {
    return {
      path,
      content,
      type,
      language,
    };
  }

  /**
   * Helper: Create agent.ossa.yaml manifest file for provenance
   */
  protected createManifestFile(manifest: OssaAgent): ExportFile {
    return this.createFile(
      'agent.ossa.yaml',
      yaml.stringify(manifest),
      'config',
      'yaml'
    );
  }

  /**
   * Default toConfig() — throws unless overridden by the adapter.
   * Adapters that support lightweight config-only export should override this.
   */
  async toConfig(manifest: OssaAgent): Promise<ConfigResult> {
    throw new Error(
      `toConfig() is not implemented for platform "${this.platform}". ` +
        `Use export() for full file scaffold export.`
    );
  }

  // ── Perfect Agent Export ─────────────────────────────────────────

  /**
   * Resolve effective options: if perfectAgent is set, enable all flags.
   */
  protected resolvePerfectAgentOptions(options?: ExportOptions): ExportOptions {
    const opts = { ...options };
    if (opts.perfectAgent) {
      opts.includeAgentCard ??= true;
      opts.includeAgentsMd ??= true;
      opts.includeDID ??= true;
      opts.includeEvals ??= true;
      opts.includeGovernance ??= true;
      opts.includeObservability ??= true;
      opts.includeSkill ??= true;
      opts.includeTeam ??= true;
    }
    return opts;
  }

  /**
   * Detect if manifest defines a multi-agent system
   */
  isMultiAgent(manifest: OssaAgent): boolean {
    return isMultiAgentManifest(manifest);
  }

  /**
   * Generate all "perfect agent" supplementary files.
   * Called by adapters when ExportOptions.perfectAgent is true.
   * Delegates to generatePerfectAgentBundle() in common-file-generator.
   */
  generatePerfectAgentFiles(
    manifest: OssaAgent,
    options?: ExportOptions
  ): ExportFile[] {
    return generatePerfectAgentBundle(manifest, options);
  }
}
