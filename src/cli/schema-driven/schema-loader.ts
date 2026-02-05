/**
 * Schema Loader - API-First Infrastructure
 * Loads and parses OSSA JSON Schema for validation and UI generation
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';

export interface SchemaDefinition {
  type: string;
  description?: string;
  properties?: Record<string, any>;
  required?: string[];
  enum?: string[];
  pattern?: string;
  minimum?: number;
  maximum?: number;
  default?: any;
  examples?: any[];
  $ref?: string;
  items?: SchemaDefinition;
}

export interface EnumOption {
  value: string;
  description?: string;
}

export class SchemaLoader {
  private schema: any;
  private ajv: Ajv;
  private validator?: ValidateFunction;
  private definitions: Map<string, SchemaDefinition> = new Map();

  constructor(schemaPath?: string) {
    // Default to v0.4 schema - find it relative to this module
    // When installed as npm package, __dirname will be in node_modules/@bluefly/openstandardagents/dist/cli/schema-driven/
    // Schema is at node_modules/@bluefly/openstandardagents/dist/spec/v0.4/agent.schema.json
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Try multiple paths to find the schema
    const possiblePaths = [
      // When running from dist/ (npm installed or local build)
      path.join(__dirname, '../../../spec/v0.4/agent.schema.json'),
      // When running from source (development)
      path.join(__dirname, '../../../spec/v0.4/agent.schema.json'),
      // Fallback to cwd (for backwards compatibility)
      path.join(process.cwd(), 'spec/v0.4/agent.schema.json'),
    ];

    let resolvedPath: string;
    if (schemaPath) {
      resolvedPath = schemaPath;
    } else {
      // Find first existing path
      const foundPath = possiblePaths.find((p) => fs.existsSync(p));
      if (!foundPath) {
        throw new Error(
          `Schema not found. Tried:\n${possiblePaths.map((p) => `  - ${p}`).join('\n')}`
        );
      }
      resolvedPath = foundPath;
    }

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Schema not found at: ${resolvedPath}`);
    }

    // Load schema
    const schemaContent = fs.readFileSync(resolvedPath, 'utf-8');
    this.schema = JSON.parse(schemaContent);

    // Initialize AJV with strict validation
    this.ajv = new Ajv({
      strict: true,
      strictTypes: false,
      allErrors: true,
      verbose: true,
      validateFormats: true,
      allowUnionTypes: true,
    });
    addFormats(this.ajv);

    // Compile validator
    this.validator = this.ajv.compile(this.schema);

    // Extract all definitions for easy lookup
    this.extractDefinitions();
  }

  /**
   * Extract all schema definitions into a map for easy access
   */
  private extractDefinitions(): void {
    if (this.schema.definitions) {
      for (const [name, definition] of Object.entries(
        this.schema.definitions
      )) {
        this.definitions.set(name, definition as SchemaDefinition);
      }
    }
  }

  /**
   * Validate a manifest against the schema
   */
  validate(manifest: any): { valid: boolean; errors?: any[] } {
    if (!this.validator) {
      throw new Error('Validator not initialized');
    }

    const valid = this.validator(manifest);

    return {
      valid: !!valid,
      errors: valid ? undefined : this.validator.errors || [],
    };
  }

  /**
   * Get schema definition for a specific path
   * Example: getDefinition('spec.llm')
   */
  getDefinition(path: string): SchemaDefinition | null {
    const parts = path.split('.');
    let current: any = this.schema.properties;

    for (const part of parts) {
      if (!current?.[part]) {
        // Try to resolve $ref
        if (current?.[part]?.$ref) {
          const refName = current[part].$ref.replace('#/definitions/', '');
          return this.definitions.get(refName) || null;
        }
        return null;
      }
      current = current[part].properties || current[part];
    }

    // Resolve $ref if present
    if (current.$ref) {
      const refName = current.$ref.replace('#/definitions/', '');
      return this.definitions.get(refName) || null;
    }

    return current;
  }

  /**
   * Get enum values for a specific field
   * Returns array of { value, description } objects
   */
  getEnumOptions(path: string): EnumOption[] {
    const definition = this.getDefinition(path);
    if (!definition?.enum) {
      return [];
    }

    return definition.enum.map((value: string) => ({
      value,
      description: this.getEnumDescription(path, value),
    }));
  }

  /**
   * Get description for a specific enum value
   * Looks for documentation in schema comments or examples
   */
  private getEnumDescription(path: string, value: string): string | undefined {
    const definition = this.getDefinition(path);
    // Try to find description in examples or comments
    // This is a placeholder - enhance based on actual schema structure
    return definition?.description;
  }

  /**
   * Get required fields for a specific path
   */
  getRequiredFields(path: string): string[] {
    const definition = this.getDefinition(path);
    return definition?.required || [];
  }

  /**
   * Check if a field is required
   */
  isRequired(path: string): boolean {
    const parts = path.split('.');
    const field = parts.pop();
    const parentPath = parts.join('.');

    if (!field) return false;

    const parent = this.getDefinition(parentPath);
    return parent?.required?.includes(field) || false;
  }

  /**
   * Get default value for a field
   */
  getDefault(path: string): any {
    const definition = this.getDefinition(path);
    return definition?.default;
  }

  /**
   * Get all LLM provider options from schema
   */
  getLLMProviders(): EnumOption[] {
    return this.getEnumOptions('spec.llm.provider');
  }

  /**
   * Get all tool types from schema
   */
  getToolTypes(): EnumOption[] {
    const toolDef = this.definitions.get('Tool');
    if (!toolDef?.properties?.type?.enum) {
      return [];
    }

    return toolDef.properties.type.enum.map((value: string) => ({
      value,
      description: this.getToolTypeDescription(value),
    }));
  }

  /**
   * Get description for tool type
   */
  private getToolTypeDescription(type: string): string {
    const descriptions: Record<string, string> = {
      mcp: 'Model Context Protocol server',
      kubernetes: 'Kubernetes API integration',
      http: 'HTTP/REST API endpoints',
      api: 'General API integration',
      grpc: 'gRPC service',
      function: 'Local function execution',
      a2a: 'Agent-to-agent communication',
      webhook: 'Webhook event handler',
      schedule: 'Cron-based scheduler',
      pipeline: 'CI/CD pipeline integration',
    };

    return descriptions[type] || `${type} tool`;
  }

  /**
   * Get all extension types from schema
   */
  getExtensionTypes(): string[] {
    if (!this.schema.properties?.extensions?.properties) {
      return [];
    }

    return Object.keys(this.schema.properties.extensions.properties);
  }

  /**
   * Get validation pattern for a field
   */
  getPattern(path: string): RegExp | null {
    const definition = this.getDefinition(path);
    if (!definition?.pattern) {
      return null;
    }

    try {
      return new RegExp(definition.pattern);
    } catch {
      return null;
    }
  }

  /**
   * Get numeric constraints (min/max) for a field
   */
  getNumericConstraints(path: string): { minimum?: number; maximum?: number } {
    const definition = this.getDefinition(path);
    return {
      minimum: definition?.minimum,
      maximum: definition?.maximum,
    };
  }

  /**
   * Get examples for a field
   */
  getExamples(path: string): any[] {
    const definition = this.getDefinition(path);
    return definition?.examples || [];
  }

  /**
   * Get description for a field
   */
  getDescription(path: string): string | undefined {
    const definition = this.getDefinition(path);
    return definition?.description;
  }

  /**
   * Get complete schema
   */
  getSchema(): any {
    return this.schema;
  }

  /**
   * Get all definitions
   */
  getDefinitions(): Map<string, SchemaDefinition> {
    return this.definitions;
  }
}

// Singleton instance
let schemaLoaderInstance: SchemaLoader | null = null;

/**
 * Get or create SchemaLoader singleton
 */
export function getSchemaLoader(schemaPath?: string): SchemaLoader {
  if (!schemaLoaderInstance) {
    schemaLoaderInstance = new SchemaLoader(schemaPath);
  }
  return schemaLoaderInstance;
}
