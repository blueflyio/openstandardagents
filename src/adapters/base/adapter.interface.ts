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
    [key: string]: any;
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
  platformOptions?: Record<string, any>;

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

  /**
   * Generate team/ structure for multi-agent orchestration
   * (auto-detected from spec.team, spec.swarm, or agentArchitecture.pattern)
   */
  includeTeam?: boolean;
}

/**
 * Adapter maturity status
 */
export type AdapterStatus = 'production' | 'beta' | 'alpha' | 'planned';

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
   * Detect if manifest defines a multi-agent system.
   */
  protected isMultiAgent(manifest: OssaAgent): boolean {
    const spec = manifest.spec as Record<string, unknown> | undefined;
    const arch = manifest.metadata?.agentArchitecture as Record<string, unknown> | undefined;
    const pattern = arch?.pattern as string | undefined;
    return !!(
      spec?.team ||
      spec?.swarm ||
      spec?.subagents ||
      (pattern && pattern !== 'single')
    );
  }

  /**
   * Generate all Perfect Agent files based on options.
   * Adapters call this at the end of their export() method.
   *
   * Uses lazy imports to avoid circular dependencies and keep
   * adapters lightweight when Perfect Agent mode is not used.
   */
  protected async generatePerfectAgentFiles(
    manifest: OssaAgent,
    options?: ExportOptions
  ): Promise<ExportFile[]> {
    const opts = this.resolvePerfectAgentOptions(options);
    const files: ExportFile[] = [];

    // Agent Card — .well-known/agent-card.json
    if (opts.includeAgentCard) {
      try {
        const { AgentCardGenerator } = await import(
          '../../services/agent-card-generator.js'
        );
        const generator = new AgentCardGenerator();
        const result = generator.generate(manifest, {
          namespace: 'default',
        });
        if (result.success && result.json) {
          files.push(
            this.createFile(
              '.well-known/agent-card.json',
              result.json,
              'config',
              'json'
            )
          );
        }
      } catch {
        // AgentCardGenerator not available — skip silently
      }
    }

    // AGENTS.md
    if (opts.includeAgentsMd) {
      try {
        const { AgentsMdGeneratorService } = await import(
          '../../services/agents-md/agents-md-generator.service.js'
        );
        const generator = new AgentsMdGeneratorService();
        files.push(...generator.generate(manifest));
      } catch {
        // Service not available yet — skip
      }
    }

    // Evals
    if (opts.includeEvals) {
      try {
        const { EvalsGeneratorService } = await import(
          '../../services/evals/evals-generator.service.js'
        );
        const generator = new EvalsGeneratorService();
        files.push(...generator.generate(manifest));
      } catch {
        // Service not available yet — skip
      }
    }

    // Governance
    if (opts.includeGovernance) {
      try {
        const { GovernanceGeneratorService } = await import(
          '../../services/governance/governance-generator.service.js'
        );
        const generator = new GovernanceGeneratorService();
        files.push(...generator.generate(manifest));
      } catch {
        // Service not available yet — skip
      }
    }

    // Observability
    if (opts.includeObservability) {
      try {
        const { ObservabilityGeneratorService } = await import(
          '../../services/observability/observability-generator.service.js'
        );
        const generator = new ObservabilityGeneratorService();
        files.push(...generator.generate(manifest));
      } catch {
        // Service not available yet — skip
      }
    }

    // Claude Skill (SKILL.md) — for ALL adapters, not just NPM
    if (opts.includeSkill) {
      try {
        const { generateSkillContent } = await import(
          './perfect-agent-utils.js'
        );
        const skillContent = generateSkillContent(manifest);
        if (skillContent) {
          files.push(
            this.createFile('skills/SKILL.md', skillContent, 'documentation', 'markdown')
          );
        }
      } catch {
        // Skills utils not available — skip
      }
    }

    // Team / Multi-agent structure
    if (opts.includeTeam && this.isMultiAgent(manifest)) {
      try {
        const { TeamGeneratorService } = await import(
          '../../services/multi-agent/team-generator.service.js'
        );
        const generator = new TeamGeneratorService();
        files.push(...generator.generate(manifest, this.platform));
      } catch {
        // Team generator not available yet — skip
      }
    }

    return files;
  }
}
