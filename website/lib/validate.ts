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

// Available schema versions in order of preference (newest first)
const AVAILABLE_SCHEMAS = ['0.2.9', '0.2.8', '0.2.3'];

/**
 * Load schema from public directory (client-side)
 * Falls back to latest available if requested version doesn't exist
 */
async function loadSchema(version: string = OSSA_VERSION): Promise<{ schema: object; actualVersion: string } | null> {
  // Normalize version (remove -RC, -dev suffixes for matching)
  const normalizedVersion = version.replace(/-.*$/, '');

  // Try versions in order: requested, then fallbacks
  const versionsToTry = [normalizedVersion, ...AVAILABLE_SCHEMAS.filter(v => v !== normalizedVersion)];

  for (const ver of versionsToTry) {
    const cacheKey = ver;
    if (schemaCache.has(cacheKey)) {
      return { schema: schemaCache.get(cacheKey)!, actualVersion: ver };
    }

    try {
      const schemaPath = `/schemas/ossa-${ver}.schema.json`;
      const response = await fetch(schemaPath);
      if (response.ok) {
        const schema = await response.json();
        schemaCache.set(cacheKey, schema);
        if (ver !== normalizedVersion) {
          console.log(`Schema ${version} not found, using ${ver} as fallback`);
        }
        return { schema, actualVersion: ver };
      }
    } catch (error) {
      // Try next version
    }
  }

  console.error(`No schema found for ${version} or any fallback`);
  return null;
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
    warnings.push({
      path: '/apiVersion',
      message: 'Missing required field: apiVersion (e.g., "ossa/v0.2.9")',
      keyword: 'required'
    });
  }

  if (!parsed.kind) {
    warnings.push({
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
    warnings.push({
      path: '/metadata',
      message: 'Missing required field: metadata',
      keyword: 'required'
    });
  } else {
    const metadata = parsed.metadata as Record<string, unknown>;
    if (!metadata.name) {
      warnings.push({
        path: '/metadata/name',
        message: 'Missing required field: metadata.name',
        keyword: 'required'
      });
    }
  }

  if (!parsed.spec) {
    warnings.push({
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
  const schemaResult = await loadSchema(schemaVersion);
  let actualSchemaVersion = schemaVersion;

  if (schemaResult) {
    actualSchemaVersion = schemaResult.actualVersion;
    try {
      const ajv = new Ajv({
        allErrors: true,
        verbose: true,
        strict: false
      });
      addFormats(ajv);

      const validate = ajv.compile(schemaResult.schema);
      const isValid = validate(parsed);

      if (!isValid && validate.errors) {
        for (const err of validate.errors) {
          const error: ValidationError = {
            path: err.instancePath || '/',
            message: err.message || 'Validation error',
            keyword: err.keyword,
            params: err.params as Record<string, unknown>
          };

          // Enhance error messages with fix suggestions
          if (err.keyword === 'additionalProperties') {
            const prop = (err.params as any)?.additionalProperty;
            error.message = `Unknown property: "${prop}". Remove it or check spelling.`;
          } else if (err.keyword === 'enum') {
            const allowed = (err.params as any)?.allowedValues;
            error.message = `Invalid value. Allowed: ${JSON.stringify(allowed)}`;
          } else if (err.keyword === 'type') {
            const expected = (err.params as any)?.type;
            error.message = `Invalid type: expected ${expected}`;
          } else if (err.keyword === 'required') {
            const missing = (err.params as any)?.missingProperty;
            error.message = `Missing required property: "${missing}"`;
          } else if (err.keyword === 'pattern') {
            error.message = `Invalid format: ${err.message}`;
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
    errors.push({
      path: '',
      message: `Could not load any schema. Check your connection or try again.`,
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
    schemaVersion: actualSchemaVersion
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
