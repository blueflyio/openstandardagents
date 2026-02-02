// OSSA v{{VERSION}} - Week 3: Export Adapter Interface
// Location: src/adapters/base.adapter.ts

import { OssaAgent } from '../types/ossa';

/**
 * Base interface for all export adapters
 */
export interface ExportAdapter {
  /** Adapter name (langchain, mcp, crewai, drupal, gitlab-duo) */
  readonly name: string;

  /** Adapter version */
  readonly version: string;

  /** Supported OSSA versions */
  readonly supportedOssaVersions: string[];

  /** Output format (python, typescript, php, yaml, etc.) */
  readonly outputFormat: string[];

  /**
   * Convert OSSA manifest to target platform format
   */
  convert(manifest: OssaAgent, options: ExportOptions): Promise<ExportResult>;

  /**
   * Validate export result
   */
  validate(result: ExportResult): Promise<ValidationResult>;

  /**
   * Get adapter capabilities
   */
  getCapabilities(): AdapterCapabilities;
}

/**
 * Export options
 */
export interface ExportOptions {
  /** Output directory */
  outputDir: string;

  /** Dry run (don't write files) */
  dryRun?: boolean;

  /** Overwrite existing files */
  overwrite?: boolean;

  /** Include tests */
  includeTests?: boolean;

  /** Include documentation */
  includeDocs?: boolean;

  /** Custom template variables */
  templateVars?: Record<string, any>;

  /** Platform-specific options */
  platformOptions?: Record<string, any>;
}

/**
 * Export result
 */
export interface ExportResult {
  /** Success flag */
  success: boolean;

  /** Adapter that generated this */
  adapter: string;

  /** Generated files */
  files: ExportFile[];

  /** Warnings (non-fatal) */
  warnings?: string[];

  /** Errors (if success=false) */
  errors?: string[];

  /** Metadata about export */
  metadata?: ExportMetadata;
}

/**
 * Individual exported file
 */
export interface ExportFile {
  /** Relative path from output directory */
  path: string;

  /** File content */
  content: string;

  /** File type (code, config, doc, test) */
  type: 'code' | 'config' | 'doc' | 'test';

  /** Programming language (if applicable) */
  language?: 'python' | 'typescript' | 'php' | 'go' | 'yaml' | 'json';

  /** Whether file is executable */
  executable?: boolean;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Valid flag */
  valid: boolean;

  /** Validation errors */
  errors?: ValidationError[];

  /** Validation warnings */
  warnings?: ValidationWarning[];

  /** Suggestions for improvement */
  suggestions?: string[];
}

export interface ValidationError {
  file: string;
  line?: number;
  column?: number;
  message: string;
  severity: 'error';
}

export interface ValidationWarning {
  file: string;
  line?: number;
  column?: number;
  message: string;
  severity: 'warning';
}

/**
 * Export metadata
 */
export interface ExportMetadata {
  /** When export was generated */
  timestamp: string;

  /** OSSA version used */
  ossaVersion: string;

  /** Adapter version used */
  adapterVersion: string;

  /** Agent name */
  agentName: string;

  /** Agent version */
  agentVersion: string;

  /** Export duration (ms) */
  durationMs: number;

  /** File count */
  fileCount: number;

  /** Total size (bytes) */
  totalSizeBytes: number;
}

/**
 * Adapter capabilities
 */
export interface AdapterCapabilities {
  /** Can export to Python */
  python?: boolean;

  /** Can export to TypeScript */
  typescript?: boolean;

  /** Can export to PHP */
  php?: boolean;

  /** Can export to Go */
  go?: boolean;

  /** Supports simulation/dry-run */
  simulation?: boolean;

  /** Supports incremental updates */
  incremental?: boolean;

  /** Supports hot-reload */
  hotReload?: boolean;

  /** Custom capabilities */
  custom?: Record<string, boolean>;
}

/**
 * Abstract base adapter class
 */
export abstract class BaseAdapter implements ExportAdapter {
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly supportedOssaVersions: string[];
  abstract readonly outputFormat: string[];

  abstract convert(manifest: OssaAgent, options: ExportOptions): Promise<ExportResult>;

  /**
   * Default validation (can be overridden)
   */
  async validate(result: ExportResult): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for empty files
    for (const file of result.files) {
      if (!file.content || file.content.trim().length === 0) {
        warnings.push({
          file: file.path,
          message: 'File is empty',
          severity: 'warning',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Default capabilities (can be overridden)
   */
  getCapabilities(): AdapterCapabilities {
    return {
      simulation: true,
      incremental: false,
      hotReload: false,
    };
  }

  /**
   * Helper: Create export file
   */
  protected createFile(
    path: string,
    content: string,
    type: ExportFile['type'],
    language?: ExportFile['language'],
    executable?: boolean
  ): ExportFile {
    return { path, content, type, language, executable };
  }

  /**
   * Helper: Create success result
   */
  protected createSuccessResult(
    files: ExportFile[],
    metadata?: Partial<ExportMetadata>
  ): ExportResult {
    return {
      success: true,
      adapter: this.name,
      files,
      metadata: metadata as ExportMetadata,
    };
  }

  /**
   * Helper: Create error result
   */
  protected createErrorResult(errors: string[]): ExportResult {
    return {
      success: false,
      adapter: this.name,
      files: [],
      errors,
    };
  }
}
