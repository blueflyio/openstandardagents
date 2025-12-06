/**
 * OSSA Manifest Validation Utility
 * Uses AJV for full JSON Schema validation against the OSSA spec
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { OSSA_VERSION, getSchemaPath } from './version';

export interface ValidationError {
  path: string;
  message: string;
  keyword?: string;
  params?: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  parsedManifest?: Record<string, unknown>;
  schemaVersion?: string;
}

// Cache for loaded schemas
const schemaCache: Map<string, object> = new Map();

/**
 * Load schema from public directory (client-side)
 */
async function loadSchema(version: string = OSSA_VERSION): Promise<object | null> {
  const cacheKey = version;
  if (schemaCache.has(cacheKey)) {
    return schemaCache.get(cacheKey)!;
  }

  try {
    const schemaPath = getSchemaPath(version);
    const response = await fetch(schemaPath);
    if (!response.ok) {
      console.error(`Failed to load schema: ${response.status}`);
      return null;
    }
    const schema = await response.json();
    schemaCache.set(cacheKey, schema);
    return schema;
  } catch (error) {
    console.error('Error loading schema:', error);
    return null;
  }
}

/**
 * Parse YAML or JSON manifest
 */
async function parseManifest(content: string): Promise<Record<string, unknown>> {
  const trimmed = content.trim();

  // Try JSON first
  if (trimmed.startsWith('{')) {
    return JSON.parse(trimmed);
  }

  // Parse as YAML
  const yaml = await import('yaml');
  return yaml.parse(trimmed);
}

/**
 * Extract version from manifest apiVersion field
 */
function extractVersion(manifest: Record<string, unknown>): string | null {
  const apiVersion = manifest.apiVersion as string;
  if (!apiVersion) return null;

  // Parse "ossa/v0.2.9" or "ossa/v0.2.x" format
  const match = apiVersion.match(/ossa\/v?([\d.]+)/i);
  return match ? match[1] : null;
}

/**
 * Validate OSSA manifest against schema
 */
export async function validateManifest(
  content: string,
  options: { strictMode?: boolean; version?: string } = {}
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Step 1: Parse the manifest
  let parsed: Record<string, unknown>;
  try {
    parsed = await parseManifest(content);
  } catch (error) {
    return {
      valid: false,
      errors: [{
        path: '',
        message: error instanceof Error
          ? `Parse error: ${error.message}`
          : 'Failed to parse manifest (invalid YAML/JSON)',
        keyword: 'parse'
      }],
      warnings: []
    };
  }

  // Step 2: Basic structure validation (before schema)
  if (!parsed.apiVersion) {
    errors.push({
      path: '/apiVersion',
      message: 'Missing required field: apiVersion (e.g., "ossa/v0.2.9")',
      keyword: 'required'
    });
  }

  if (!parsed.kind) {
    errors.push({
      path: '/kind',
      message: 'Missing required field: kind (must be "Agent")',
      keyword: 'required'
    });
  } else if (parsed.kind !== 'Agent') {
    warnings.push({
      path: '/kind',
      message: `Unexpected kind: "${parsed.kind}". Expected "Agent".`,
      keyword: 'enum'
    });
  }

  if (!parsed.metadata) {
    errors.push({
      path: '/metadata',
      message: 'Missing required field: metadata',
      keyword: 'required'
    });
  } else {
    const metadata = parsed.metadata as Record<string, unknown>;
    if (!metadata.name) {
      errors.push({
        path: '/metadata/name',
        message: 'Missing required field: metadata.name',
        keyword: 'required'
      });
    }
  }

  if (!parsed.spec) {
    errors.push({
      path: '/spec',
      message: 'Missing required field: spec',
      keyword: 'required'
    });
  }

  // If basic structure is invalid, return early
  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      warnings,
      parsedManifest: parsed
    };
  }

  // Step 3: Determine schema version
  const manifestVersion = extractVersion(parsed);
  const schemaVersion = options.version || manifestVersion || OSSA_VERSION;

  // Step 4: Load and validate against JSON Schema
  const schema = await loadSchema(schemaVersion);
  if (schema) {
    try {
      const ajv = new Ajv({
        allErrors: true,
        verbose: true,
        strict: false
      });
      addFormats(ajv);

      const validate = ajv.compile(schema);
      const isValid = validate(parsed);

      if (!isValid && validate.errors) {
        for (const err of validate.errors) {
          const error: ValidationError = {
            path: err.instancePath || '/',
            message: err.message || 'Validation error',
            keyword: err.keyword,
            params: err.params as Record<string, unknown>
          };

          // Enhance error messages
          if (err.keyword === 'additionalProperties') {
            error.message = `Unknown property: ${(err.params as any)?.additionalProperty}`;
          } else if (err.keyword === 'enum') {
            error.message = `${err.message}. Allowed values: ${JSON.stringify((err.params as any)?.allowedValues)}`;
          } else if (err.keyword === 'type') {
            error.message = `Invalid type: expected ${(err.params as any)?.type}`;
          }

          errors.push(error);
        }
      }
    } catch (ajvError) {
      warnings.push({
        path: '',
        message: `Schema validation warning: ${ajvError instanceof Error ? ajvError.message : 'Unknown error'}`,
        keyword: 'schema'
      });
    }
  } else {
    warnings.push({
      path: '',
      message: `Could not load schema for version ${schemaVersion}. Basic validation passed.`,
      keyword: 'schema'
    });
  }

  // Step 5: Additional semantic validations
  if (parsed.spec) {
    const spec = parsed.spec as Record<string, unknown>;

    // Check for role
    if (!spec.role) {
      warnings.push({
        path: '/spec/role',
        message: 'Recommended: Add a role description for your agent',
        keyword: 'recommended'
      });
    }

    // Check for LLM config
    if (!spec.llm) {
      warnings.push({
        path: '/spec/llm',
        message: 'Recommended: Specify LLM configuration (provider, model)',
        keyword: 'recommended'
      });
    }

    // Autonomy validation
    if (spec.autonomy) {
      const autonomy = spec.autonomy as Record<string, unknown>;
      if (autonomy.level === 'L4' || autonomy.level === 'autonomous') {
        warnings.push({
          path: '/spec/autonomy',
          message: 'High autonomy level (L4/autonomous) - ensure proper approval_required configuration',
          keyword: 'security'
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    parsedManifest: parsed,
    schemaVersion
  };
}

/**
 * Quick validation - just checks basic structure
 */
export async function quickValidate(content: string): Promise<boolean> {
  try {
    const parsed = await parseManifest(content);
    return !!(parsed.apiVersion && parsed.kind && parsed.metadata && parsed.spec);
  } catch {
    return false;
  }
}
