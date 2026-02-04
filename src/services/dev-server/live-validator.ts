/**
 * Live Validator Service
 *
 * Validates OSSA manifests in real-time as files change
 *
 * Features:
 * - Real-time validation on file changes
 * - Detailed error messages with line numbers
 * - Validation caching for performance
 * - Multiple validation levels (schema, semantic, best practices)
 *
 * SOLID: Single Responsibility - Validation only
 */

import { readFile } from 'fs/promises';
import yaml from 'yaml';
import type { OssaAgent } from '../../types/index.js';
import { ValidationService } from '../validation.service.js';
import { container } from '../../di-container.js';

export interface ValidationResult {
  /**
   * Validation status
   */
  valid: boolean;

  /**
   * File path that was validated
   */
  filePath: string;

  /**
   * Validation timestamp
   */
  timestamp: Date;

  /**
   * Validation errors (if any)
   */
  errors: ValidationError[];

  /**
   * Validation warnings
   */
  warnings: ValidationWarning[];

  /**
   * Parsed manifest (if valid)
   */
  manifest?: OssaAgent;

  /**
   * Validation duration in milliseconds
   */
  duration: number;
}

export interface ValidationError {
  /**
   * Error level
   */
  level: 'error';

  /**
   * Error message
   */
  message: string;

  /**
   * JSON path to error location
   */
  path?: string;

  /**
   * Line number in YAML file
   */
  line?: number;

  /**
   * Column number in YAML file
   */
  column?: number;

  /**
   * Error code for programmatic handling
   */
  code?: string;
}

export interface ValidationWarning {
  /**
   * Warning level
   */
  level: 'warning';

  /**
   * Warning message
   */
  message: string;

  /**
   * JSON path to warning location
   */
  path?: string;

  /**
   * Line number in YAML file
   */
  line?: number;

  /**
   * Column number in YAML file
   */
  column?: number;

  /**
   * Suggestion for improvement
   */
  suggestion?: string;
}

export interface LiveValidatorOptions {
  /**
   * Enable semantic validation
   * @default true
   */
  semanticValidation?: boolean;

  /**
   * Enable best practices checks
   * @default true
   */
  bestPractices?: boolean;

  /**
   * Cache validation results
   * @default true
   */
  caching?: boolean;
}

/**
 * Live Validator Service
 *
 * Validates OSSA manifests with detailed error reporting
 */
export class LiveValidator {
  private validationService: ValidationService;
  private cache: Map<string, { hash: string; result: ValidationResult }> =
    new Map();
  private options: Required<LiveValidatorOptions>;

  constructor(options: LiveValidatorOptions = {}) {
    this.validationService = container.get(ValidationService);
    this.options = {
      semanticValidation: true,
      bestPractices: true,
      caching: true,
      ...options,
    };
  }

  /**
   * Validate a manifest file
   */
  async validate(filePath: string): Promise<ValidationResult> {
    const startTime = Date.now();

    try {
      // Read file
      const content = await readFile(filePath, 'utf-8');

      // Check cache
      if (this.options.caching) {
        const hash = this.hashContent(content);
        const cached = this.cache.get(filePath);

        if (cached && cached.hash === hash) {
          // Return cached result with updated timestamp
          return {
            ...cached.result,
            timestamp: new Date(),
          };
        }
      }

      // Parse YAML
      let manifest: OssaAgent;
      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];

      try {
        manifest = yaml.parse(content) as OssaAgent;
      } catch (error: unknown) {
        const err = error as {
          message: string;
          linePos?: Array<{ line: number; col: number }>;
        };
        errors.push({
          level: 'error',
          message: `YAML parse error: ${err.message}`,
          line: err.linePos?.[0]?.line,
          column: err.linePos?.[0]?.col,
          code: 'YAML_PARSE_ERROR',
        });

        return this.createResult(
          filePath,
          false,
          errors,
          warnings,
          undefined,
          startTime
        );
      }

      // Schema validation
      const schemaErrors = await this.validateSchema(manifest, content);
      errors.push(...schemaErrors);

      // Semantic validation
      if (this.options.semanticValidation && errors.length === 0) {
        const semanticIssues = await this.validateSemantic(manifest);
        errors.push(...semanticIssues.errors);
        warnings.push(...semanticIssues.warnings);
      }

      // Best practices
      if (this.options.bestPractices && errors.length === 0) {
        const practiceWarnings = await this.validateBestPractices(manifest);
        warnings.push(...practiceWarnings);
      }

      const valid = errors.length === 0;
      const result = this.createResult(
        filePath,
        valid,
        errors,
        warnings,
        valid ? manifest : undefined,
        startTime
      );

      // Cache result
      if (this.options.caching) {
        this.cache.set(filePath, {
          hash: this.hashContent(content),
          result,
        });
      }

      return result;
    } catch (error: unknown) {
      // Unexpected error
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return this.createResult(
        filePath,
        false,
        [
          {
            level: 'error',
            message: `Validation error: ${errorMessage}`,
            code: 'VALIDATION_ERROR',
          },
        ],
        [],
        undefined,
        startTime
      );
    }
  }

  /**
   * Clear validation cache
   */
  clearCache(filePath?: string): void {
    if (filePath) {
      this.cache.delete(filePath);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Validate against JSON schema
   */
  private async validateSchema(
    manifest: OssaAgent,
    content: string
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    try {
      const result = await this.validationService.validate(manifest);

      if (!result.valid && result.errors) {
        for (const error of result.errors) {
          // Try to find line number in YAML
          const lineInfo = this.findLineNumber(content, error.instancePath);

          errors.push({
            level: 'error',
            message: error.message || 'Schema validation error',
            path: error.instancePath,
            line: lineInfo?.line,
            column: lineInfo?.column,
            code: 'SCHEMA_VALIDATION_ERROR',
          });
        }
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      errors.push({
        level: 'error',
        message: `Schema validation failed: ${errorMessage}`,
        code: 'SCHEMA_VALIDATION_FAILED',
      });
    }

    return errors;
  }

  /**
   * Validate semantic correctness
   */
  private async validateSemantic(
    manifest: OssaAgent
  ): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check required fields
    if (!manifest.metadata?.name) {
      errors.push({
        level: 'error',
        message: 'Agent name is required',
        path: '/metadata/name',
        code: 'MISSING_NAME',
      });
    }

    if (!manifest.spec?.role) {
      errors.push({
        level: 'error',
        message: 'Agent role is required',
        path: '/spec/role',
        code: 'MISSING_ROLE',
      });
    }

    // Check LLM configuration
    if (!manifest.spec?.llm) {
      warnings.push({
        level: 'warning',
        message: 'No LLM configuration specified',
        path: '/spec/llm',
        suggestion: 'Add LLM configuration with provider and model',
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate best practices
   */
  private async validateBestPractices(
    manifest: OssaAgent
  ): Promise<ValidationWarning[]> {
    const warnings: ValidationWarning[] = [];

    // Check description
    if (
      !manifest.metadata?.description ||
      manifest.metadata.description.length < 10
    ) {
      warnings.push({
        level: 'warning',
        message:
          'Agent description should be descriptive (at least 10 characters)',
        path: '/metadata/description',
        suggestion: 'Add a clear description of what this agent does',
      });
    }

    // Check role length
    if (manifest.spec?.role && manifest.spec.role.length < 20) {
      warnings.push({
        level: 'warning',
        message: 'Agent role should be detailed (at least 20 characters)',
        path: '/spec/role',
        suggestion:
          'Provide a detailed role description for better agent behavior',
      });
    }

    // Check tags
    if (!manifest.metadata?.tags || manifest.metadata.tags.length === 0) {
      warnings.push({
        level: 'warning',
        message: 'No tags specified',
        path: '/metadata/tags',
        suggestion: 'Add tags to help categorize and discover this agent',
      });
    }

    // Check tools
    if (manifest.spec?.tools && manifest.spec.tools.length > 10) {
      warnings.push({
        level: 'warning',
        message: 'Large number of tools (>10) may impact performance',
        path: '/spec/tools',
        suggestion:
          'Consider splitting into multiple agents or reducing tool count',
      });
    }

    return warnings;
  }

  /**
   * Find line number for JSON path in YAML content
   */
  private findLineNumber(
    content: string,
    jsonPath?: string
  ): { line: number; column: number } | undefined {
    if (!jsonPath) return undefined;

    try {
      // Parse YAML with line info
      const doc = yaml.parseDocument(content);

      // Navigate to path
      const parts = jsonPath.split('/').filter(Boolean);
      let node: unknown = doc.contents;

      for (const part of parts) {
        if (!node) break;
        if (
          typeof node === 'object' &&
          node !== null &&
          'get' in node &&
          typeof (node as { get: (key: string) => unknown }).get === 'function'
        ) {
          node = (node as { get: (key: string) => unknown }).get(part);
        } else if (typeof node === 'object' && node !== null && part in node) {
          node = (node as Record<string, unknown>)[part];
        }
      }

      if (
        typeof node === 'object' &&
        node !== null &&
        'range' in node &&
        Array.isArray((node as { range: unknown }).range)
      ) {
        const range = (node as { range: [number, number] }).range;
        const lines = content.substring(0, range[0]).split('\n');
        return {
          line: lines.length,
          column: lines[lines.length - 1].length + 1,
        };
      }
    } catch {
      // Ignore parse errors
    }

    return undefined;
  }

  /**
   * Create validation result
   */
  private createResult(
    filePath: string,
    valid: boolean,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    manifest: OssaAgent | undefined,
    startTime: number
  ): ValidationResult {
    return {
      valid,
      filePath,
      timestamp: new Date(),
      errors,
      warnings,
      manifest,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Simple hash for caching
   */
  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
}
