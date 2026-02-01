/**
 * Base Adapter Interface for OSSA Export System
 *
 * All platform adapters must implement this interface to provide
 * consistent export functionality across different platforms.
 *
 * SOLID: Interface Segregation Principle - Small, focused interface
 * DRY: Reusable across all platform adapters
 */

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
   * Platform-specific options
   */
  platformOptions?: Record<string, any>;

  /**
   * Dry run mode - validate only, don't write files
   */
  dryRun?: boolean;
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
}

/**
 * Base adapter implementation with common functionality
 */
export abstract class BaseAdapter implements PlatformAdapter {
  abstract readonly platform: string;
  abstract readonly displayName: string;
  abstract readonly description: string;
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
}
