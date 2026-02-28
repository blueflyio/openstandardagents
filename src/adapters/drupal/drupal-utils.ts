/**
 * Drupal Adapter Shared Utilities
 *
 * Extracted from adapter.ts, generator.ts, and manifest-exporter.ts
 * to eliminate code duplication across the Drupal adapter layer.
 *
 * Contains:
 * - Name sanitization (sanitizeModuleName, toClassName, toLabel)
 * - Drupal-specific validation helpers
 * - Composer/Info YAML generation helpers
 * - OSSA-to-Drupal tool mapping (mapOssaToolToDrupalTool)
 * - Shared TypeScript interfaces
 *
 * SOLID: Single Responsibility - Drupal utility functions only
 * DRY: Single source of truth for all shared Drupal adapter logic
 */

import type {
  OssaAgent,
  ValidationError,
  ValidationWarning,
  ValidationResult,
} from '../base/adapter.interface.js';

// ===================================================================
// TypeScript Interfaces
// ===================================================================

/**
 * Options for Drupal module generation (shared across adapters)
 */
export interface DrupalModuleOptions {
  /** Drupal core version requirement */
  coreVersion?: string;
  /** Module package group */
  packageGroup?: string;
  /** License identifier */
  license?: string;
}

/**
 * Drupal Tool API plugin definition
 *
 * Maps an OSSA spec.tools[] entry to Drupal's Tool API plugin format
 * used by ai_agents contrib module.
 */
export interface DrupalToolDefinition {
  /** Plugin ID (machine name) */
  id: string;
  /** Human-readable label */
  label: string;
  /** Tool description */
  description: string;
  /** Drupal plugin category */
  category: string;
  /** Tool type mapping from OSSA (api, function, mcp, etc.) */
  type: string;
  /** Module that provides this tool */
  provider: string;
  /** Input schema for the tool (JSON Schema compatible) */
  inputSchema?: Record<string, unknown>;
  /** Output schema for the tool (JSON Schema compatible) */
  outputSchema?: Record<string, unknown>;
  /** PHP class annotation attributes */
  annotation: {
    id: string;
    label: string;
    description: string;
  };
}

/**
 * Shape of an OSSA tool entry from spec.tools[]
 */
export interface OssaToolEntry {
  type?: string;
  name?: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Composer.json structure for Drupal modules
 */
export interface DrupalComposerJson {
  name: string;
  type: string;
  description: string;
  keywords: string[];
  license: string;
  require: Record<string, string>;
  autoload?: Record<string, unknown>;
  extra?: Record<string, unknown>;
}

// ===================================================================
// Name Sanitization Utilities
// ===================================================================

/**
 * Sanitize a name for use as a Drupal module machine name.
 *
 * Drupal machine names must be lowercase, alphanumeric with underscores,
 * cannot start with a digit, and should not have leading/trailing underscores.
 *
 * @param name - Raw name string
 * @returns Sanitized Drupal-compatible machine name
 */
export function sanitizeModuleName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^[0-9]+/, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Convert a Drupal module machine name to a PascalCase class name.
 *
 * Example: 'content_moderator' -> 'ContentModerator'
 *
 * @param moduleName - Drupal module machine name (snake_case)
 * @returns PascalCase class name
 */
export function toClassName(moduleName: string): string {
  return moduleName
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Convert a kebab-case or snake_case name to a Title Case label.
 *
 * Example: 'content_moderator' -> 'Content Moderator'
 * Example: 'content-moderator' -> 'Content Moderator'
 *
 * @param name - Raw name string
 * @returns Title Case label
 */
export function toLabel(name: string): string {
  return name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ===================================================================
// Validation Utilities
// ===================================================================

/**
 * Perform Drupal-specific validation on an OSSA manifest.
 *
 * Checks that the module name follows Drupal conventions and adds
 * appropriate warnings. This is meant to be called after base validation
 * and its results merged into the caller's error/warning arrays.
 *
 * @param manifest - OSSA agent manifest
 * @returns Object containing Drupal-specific errors and warnings
 */
export function validateDrupalCompatibility(manifest: OssaAgent): {
  errors: ValidationError[];
  warnings: ValidationWarning[];
} {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const name = manifest.metadata?.name;
  if (name && !/^[a-z0-9_]+$/.test(name)) {
    warnings.push({
      message:
        'Module name should only contain lowercase letters, numbers, and underscores',
      path: 'metadata.name',
      suggestion: `Use: ${sanitizeModuleName(name)}`,
    });
  }

  return { errors, warnings };
}

/**
 * Build a complete ValidationResult from accumulated errors and warnings.
 *
 * @param errors - Array of validation errors
 * @param warnings - Array of validation warnings
 * @returns ValidationResult with proper undefined handling
 */
export function buildValidationResult(
  errors: ValidationError[],
  warnings: ValidationWarning[]
): ValidationResult {
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

// ===================================================================
// Composer.json Generation
// ===================================================================

/**
 * Generate a base composer.json for a Drupal module from an OSSA manifest.
 *
 * This produces the common structure shared by adapter.ts and generator.ts.
 * Callers can extend the returned object with additional fields before
 * serializing to JSON.
 *
 * @param manifest - OSSA agent manifest
 * @param moduleName - Sanitized Drupal module name
 * @param options - Additional Drupal module options
 * @returns DrupalComposerJson object (serialize with JSON.stringify)
 */
export function buildComposerJson(
  manifest: OssaAgent,
  moduleName: string,
  options?: DrupalModuleOptions
): DrupalComposerJson {
  return {
    name: `drupal/${moduleName}`,
    type: 'drupal-module',
    description: manifest.metadata?.description || 'OSSA agent module',
    keywords: ['Drupal', 'OSSA', 'AI', 'Agent'],
    license:
      manifest.metadata?.license || options?.license || 'GPL-2.0-or-later',
    require: {
      'drupal/core': options?.coreVersion || '^10 || ^11',
      'drupal/ai': '^1.0',
      'drupal/ai_agents': '^1.3',
      'drupal/tool': '^1.0@alpha',
    },
    extra: {
      ossa: {
        version: manifest.metadata?.version,
        apiVersion: manifest.apiVersion,
        kind: manifest.kind,
      },
    },
  };
}

// ===================================================================
// Info YAML Generation
// ===================================================================

/**
 * Generate the core .info.yml content shared between adapters.
 *
 * Produces the minimal OSSA metadata block that both adapter.ts and
 * generator.ts include in their info YAML files.
 *
 * @param manifest - OSSA agent manifest
 * @param moduleName - Sanitized Drupal module name
 * @param options - Additional Drupal module options
 * @returns YAML string for the .info.yml file
 */
export function generateBaseInfoYml(
  manifest: OssaAgent,
  moduleName: string,
  options?: DrupalModuleOptions
): string {
  const coreVersion = options?.coreVersion || '^10 || ^11';
  const packageGroup = options?.packageGroup || 'OSSA Agents';

  return `name: '${manifest.metadata?.name || moduleName}'
type: module
description: '${manifest.metadata?.description || 'OSSA agent module'}'
core_version_requirement: ${coreVersion}
package: '${packageGroup}'

dependencies:
  - ai:ai
  - ai:ai_agents

# OSSA metadata
ossa:
  version: '${manifest.metadata?.version || '1.0.0'}'
  api_version: '${manifest.apiVersion || 'ossa/v{{VERSION}}'}'
  kind: '${manifest.kind || 'Agent'}'
`;
}

// ===================================================================
// Capability / Tool Utilities
// ===================================================================

/**
 * Extract capabilities as string array from an OSSA manifest.
 *
 * Handles: (1) array of strings or { name } objects, (2) object with grants[]
 * (e.g. { policy, grants: [{ capability: '...' }] }), (3) missing -> [].
 *
 * @param manifest - OSSA agent manifest
 * @returns Array of capability name strings
 */
export function extractCapabilities(manifest: OssaAgent): string[] {
  const raw = manifest.spec?.capabilities;
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return (raw as Array<string | { name?: string }>).map((c) =>
      typeof c === 'string' ? c : c.name || ''
    );
  }
  if (typeof raw === 'object' && Array.isArray((raw as { grants?: unknown[] }).grants)) {
    return ((raw as { grants: Array<{ capability?: string }> }).grants
      .map((g) => g.capability)
      .filter((s): s is string => typeof s === 'string'));
  }
  return [];
}

/**
 * Extract tools as typed array from an OSSA manifest.
 *
 * @param manifest - OSSA agent manifest
 * @returns Array of tool entries (empty if spec.tools is missing or not an array)
 */
export function extractTools(manifest: OssaAgent): OssaToolEntry[] {
  const raw = manifest.spec?.tools;
  return Array.isArray(raw) ? (raw as OssaToolEntry[]) : [];
}

/**
 * Map an OSSA spec.tools[] entry to a Drupal Tool API plugin definition.
 *
 * This creates the structure used by Drupal's ai_agents contrib module
 * to register tools as Drupal plugins. The output can be used to generate
 * PHP plugin annotations or YAML tool definitions.
 *
 * @param tool - OSSA tool entry from spec.tools[]
 * @param moduleName - Sanitized Drupal module name (used as provider)
 * @returns DrupalToolDefinition with all plugin metadata
 */
export function mapOssaToolToDrupalTool(
  tool: OssaToolEntry,
  moduleName: string
): DrupalToolDefinition {
  const toolName = tool.name || 'unknown_tool';
  const toolId = `${moduleName}_${sanitizeModuleName(toolName)}`;
  const toolLabel = toLabel(toolName);
  const toolDescription = tool.description || `Tool: ${toolName}`;
  const toolType = tool.type || 'api';

  return {
    id: toolId,
    label: toolLabel,
    description: toolDescription,
    category: 'OSSA Agent Tools',
    type: toolType,
    provider: moduleName,
    inputSchema: tool.inputSchema,
    outputSchema: tool.outputSchema,
    annotation: {
      id: toolId,
      label: toolLabel,
      description: toolDescription,
    },
  };
}

/**
 * Map all tools from an OSSA manifest to Drupal Tool API plugin definitions.
 *
 * Convenience wrapper around mapOssaToolToDrupalTool for batch processing.
 *
 * @param manifest - OSSA agent manifest
 * @param moduleName - Sanitized Drupal module name
 * @returns Array of DrupalToolDefinition objects
 */
export function mapAllOssaToolsToDrupal(
  manifest: OssaAgent,
  moduleName: string
): DrupalToolDefinition[] {
  const tools = extractTools(manifest);
  return tools.map((tool) => mapOssaToolToDrupalTool(tool, moduleName));
}

// ===================================================================
// PHP Tool Plugin Stub Generation (shared with manifest-exporter)
// ===================================================================

/**
 * Escape a string for safe inclusion inside PHP single-quoted strings.
 */
export function escapePhpString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Map a JSON Schema type to a PHP/Drupal typed data type string.
 */
export function jsonSchemaTypeToPHP(jsonType: string): string {
  const typeMap: Record<string, string> = {
    string: 'string',
    number: 'float',
    integer: 'integer',
    boolean: 'boolean',
    array: 'list',
    object: 'map',
  };
  return typeMap[jsonType] || 'string';
}

/**
 * Build a PHP array literal from a JSON Schema definition for Drupal Tool API.
 *
 * @param schema - JSON Schema object (properties, required)
 * @returns PHP array literal string
 */
export function buildSchemaDefinitionArray(
  schema?: Record<string, unknown>
): string {
  if (!schema || Object.keys(schema).length === 0) {
    return '[]';
  }
  const properties = schema.properties as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (!properties || Object.keys(properties).length === 0) {
    return '[]';
  }
  const required = (schema.required as string[]) || [];
  const entries: string[] = [];
  for (const [propName, propDef] of Object.entries(properties)) {
    const phpType = jsonSchemaTypeToPHP((propDef.type as string) || 'string');
    const description = propDef.description
      ? escapePhpString(propDef.description as string)
      : `The ${propName} parameter`;
    const isRequired = required.includes(propName) ? 'TRUE' : 'FALSE';
    entries.push(`      '${propName}' => [
        'type' => '${phpType}',
        'label' => '${toLabel(propName)}',
        'description' => '${escapePhpString(description)}',
        'required' => ${isRequired},
      ]`);
  }
  return `[
${entries.join(',\n')},
    ]`;
}
