import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { ValidationResult, ValidationIssue } from '../types.js';

interface AjvErrorParams {
  additionalProperty?: string;
  allowedValues?: unknown[];
  type?: string;
  missingProperty?: string;
  [key: string]: unknown;
}

/** Validates OSSA manifests against the JSON Schema using AJV. Runs anywhere — browser, Node, edge. */
export class ValidationEngine {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({ allErrors: true, verbose: true, strict: false });
    addFormats(this.ajv);
  }

  /** Validate a parsed manifest object against a schema */
  validate(
    manifest: Record<string, unknown>,
    schema: object,
  ): ValidationResult {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];

    // Structural pre-checks
    this.runStructuralChecks(manifest, warnings);

    // JSON Schema validation
    try {
      const validate = this.ajv.compile(schema);
      const isValid = validate(manifest);

      if (!isValid && validate.errors) {
        for (const err of validate.errors) {
          errors.push(this.formatAjvError(err));
        }
      }
    } catch (ajvError) {
      warnings.push({
        path: '',
        message: `Schema compilation error: ${ajvError instanceof Error ? ajvError.message : String(ajvError)}`,
        severity: 'warning',
        keyword: 'schema',
      });
    }

    // Semantic checks
    this.runSemanticChecks(manifest, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      parsedManifest: manifest,
      schemaVersion: this.extractVersion(manifest),
    };
  }

  /** Validate raw YAML/JSON string */
  async validateString(
    content: string,
    schema: object,
  ): Promise<ValidationResult> {
    const parsed = await this.parse(content);
    if ('error' in parsed) {
      return {
        valid: false,
        errors: [
          {
            path: '',
            message: parsed.error,
            severity: 'error',
            keyword: 'parse',
          },
        ],
        warnings: [],
      };
    }
    return this.validate(parsed.manifest, schema);
  }

  /** Parse YAML or JSON content into a manifest object */
  async parse(
    content: string,
  ): Promise<
    { manifest: Record<string, unknown> } | { error: string }
  > {
    const trimmed = content.trim();
    try {
      if (trimmed.startsWith('{')) {
        return { manifest: JSON.parse(trimmed) };
      }
      const yaml = await import('yaml');
      return { manifest: yaml.parse(trimmed) };
    } catch (e) {
      return {
        error:
          e instanceof Error
            ? `Parse error: ${e.message}`
            : 'Failed to parse manifest (invalid YAML/JSON)',
      };
    }
  }

  /** Quick structure check — no schema needed */
  async quickValidate(content: string): Promise<boolean> {
    const result = await this.parse(content);
    if ('error' in result) return false;
    const m = result.manifest;
    return !!(m.apiVersion && m.kind && m.metadata && m.spec);
  }

  private runStructuralChecks(
    manifest: Record<string, unknown>,
    warnings: ValidationIssue[],
  ): void {
    if (!manifest.apiVersion) {
      warnings.push({
        path: '/apiVersion',
        message: 'Missing required field: apiVersion (e.g., "ossa/v0.4")',
        severity: 'warning',
        keyword: 'required',
      });
    }

    if (!manifest.kind) {
      warnings.push({
        path: '/kind',
        message: 'Missing required field: kind (must be "Agent")',
        severity: 'warning',
        keyword: 'required',
      });
    }

    if (!manifest.metadata) {
      warnings.push({
        path: '/metadata',
        message: 'Missing required field: metadata',
        severity: 'warning',
        keyword: 'required',
      });
    } else {
      const metadata = manifest.metadata as Record<string, unknown>;
      if (!metadata.name) {
        warnings.push({
          path: '/metadata/name',
          message: 'Missing required field: metadata.name',
          severity: 'warning',
          keyword: 'required',
        });
      }
    }
  }

  private runSemanticChecks(
    manifest: Record<string, unknown>,
    warnings: ValidationIssue[],
  ): void {
    if (!manifest.spec) return;
    const spec = manifest.spec as Record<string, unknown>;

    if (!spec.role && !spec.description) {
      warnings.push({
        path: '/spec/role',
        message: 'Recommended: Add a role or description for your agent',
        severity: 'info',
        keyword: 'recommended',
      });
    }

    if (!spec.llm) {
      warnings.push({
        path: '/spec/llm',
        message: 'Recommended: Specify LLM configuration (provider, model)',
        severity: 'info',
        keyword: 'recommended',
      });
    }

    const autonomy = spec.autonomy as Record<string, unknown> | undefined;
    if (autonomy?.level === 'L4' || autonomy?.level === 'autonomous') {
      warnings.push({
        path: '/spec/autonomy',
        message:
          'High autonomy level — ensure proper approval_required configuration',
        severity: 'warning',
        keyword: 'security',
      });
    }
  }

  private formatAjvError(err: {
    instancePath?: string;
    message?: string;
    keyword?: string;
    params?: Record<string, unknown>;
  }): ValidationIssue {
    const issue: ValidationIssue = {
      path: err.instancePath || '/',
      message: err.message || 'Validation error',
      severity: 'error',
      keyword: err.keyword,
      params: err.params,
    };

    const params = err.params as AjvErrorParams | undefined;

    if (err.keyword === 'additionalProperties' && params?.additionalProperty) {
      issue.message = `Unknown property: "${params.additionalProperty}". Remove it or check spelling.`;
    } else if (err.keyword === 'enum' && params?.allowedValues) {
      issue.message = `Invalid value. Allowed: ${JSON.stringify(params.allowedValues)}`;
    } else if (err.keyword === 'type' && params?.type) {
      issue.message = `Invalid type: expected ${params.type}`;
    } else if (err.keyword === 'required' && params?.missingProperty) {
      issue.message = `Missing required property: "${params.missingProperty}"`;
    } else if (err.keyword === 'pattern') {
      issue.message = `Invalid format: ${err.message}`;
    }

    return issue;
  }

  private extractVersion(manifest: Record<string, unknown>): string | undefined {
    const apiVersion = manifest.apiVersion as string | undefined;
    if (!apiVersion) return undefined;
    const match = apiVersion.match(/ossa\/v?([\d.]+)/i);
    return match ? match[1] : undefined;
  }
}
