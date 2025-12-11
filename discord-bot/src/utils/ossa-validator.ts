import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import logger from './logger';

interface ValidationError {
  field: string;
  message: string;
  path: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  kind?: string;
}

type JSONSchema = Record<string, unknown>;

export type OSSAKind = 'Agent' | 'Task' | 'Workflow' | 'MessageRouting';

class OSSAValidator {
  private ajv: Ajv;
  private validateManifest?: ValidateFunction;
  private validateWorkflow?: ValidateFunction;
  private validateTask?: ValidateFunction;
  private validateMessageRouting?: ValidateFunction;
  private manifestSchema: JSONSchema = {};
  private fullSchema: JSONSchema = {};

  constructor() {
    this.ajv = new Ajv({ 
      allErrors: true, 
      strict: false,
      validateSchema: false // Allow schema validation to be more lenient
    });
    addFormats(this.ajv);
  }

  async initialize(): Promise<void> {
    // Try to load OSSA v0.3.1 schema from multiple possible locations
    const possiblePaths = [
      // Relative to worktree root
      join(__dirname, '../../../../../openstandardagents/spec/v0.3.1/ossa-0.3.1.schema.json'),
      // Relative to monorepo root
      join(__dirname, '../../../../../../openstandardagents/spec/v0.3.1/ossa-0.3.1.schema.json'),
      // Absolute path from monorepo
      resolve('/Users/flux423/Sites/LLM/openstandardagents/spec/v0.3.1/ossa-0.3.1.schema.json'),
    ];

    let schemaLoaded = false;
    for (const schemaPath of possiblePaths) {
      if (existsSync(schemaPath)) {
        try {
          this.fullSchema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
          logger.info(`Loaded OSSA v0.3.1 schema from: ${schemaPath}`);
          schemaLoaded = true;
          break;
        } catch (error) {
          logger.warn(`Failed to load schema from ${schemaPath}:`, error);
        }
      }
    }

    if (!schemaLoaded) {
      logger.warn('Could not load OSSA schema file, using fallback schema');
      this.initializeFallbackSchema();
      return;
    }

    // Compile main validator
    this.validateManifest = this.ajv.compile(this.fullSchema);
    
    // Create kind-specific validators
    this.initializeKindValidators();
    
    logger.info('OSSA validator initialized with v0.3.1 schema supporting Agent, Task, Workflow, and MessageRouting');
  }

  private initializeFallbackSchema(): void {
    // Fallback schema for backward compatibility (old format)
    this.manifestSchema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      required: ['name', 'version', 'ossa_version', 'type', 'capabilities'],
      properties: {
        name: {
          type: 'string',
          pattern: '^[a-z0-9-]+$',
          minLength: 1,
          maxLength: 100,
        },
        version: {
          type: 'string',
          pattern: '^\\d+\\.\\d+\\.\\d+(-[a-z0-9-]+)?$',
        },
        ossa_version: {
          type: 'string',
          pattern: '^\\d+\\.\\d+\\.\\d+$',
        },
        type: {
          type: 'string',
          enum: ['worker', 'supervisor', 'hybrid'],
        },
        capabilities: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['name', 'description'],
            properties: {
              name: { type: 'string', pattern: '^[a-z0-9-_]+$' },
              description: { type: 'string' },
            },
          },
        },
      },
    };
    this.validateManifest = this.ajv.compile(this.manifestSchema);
  }

  private initializeKindValidators(): void {
    // Create validators for each kind using conditional schemas
    // The full schema uses allOf with if/then conditions for each kind
    const kinds: OSSAKind[] = ['Agent', 'Task', 'Workflow', 'MessageRouting'];
    
    kinds.forEach(kind => {
      try {
        // Create a schema that validates the specific kind
        const kindSchema = {
          ...this.fullSchema,
          allOf: this.fullSchema.allOf?.filter((condition: any) => {
            // Include conditions that match this kind or are general
            if (condition.if?.properties?.kind?.const === kind) {
              return true;
            }
            // Include the base schema conditions
            return !condition.if || condition.if.properties?.kind === undefined;
          }) || []
        };
        
        const validator = this.ajv.compile(kindSchema);
        
        if (kind === 'Workflow') {
          this.validateWorkflow = validator;
        } else if (kind === 'Task') {
          this.validateTask = validator;
        } else if (kind === 'MessageRouting') {
          this.validateMessageRouting = validator;
        }
      } catch (error) {
        logger.warn(`Could not compile validator for kind: ${kind}`, error);
      }
    });
  }

  validate(manifest: unknown, kind?: OSSAKind): ValidationResult {
    if (!this.validateManifest) {
      throw new Error('Validator not initialized. Call initialize() first.');
    }

    // Determine kind from manifest if not provided
    const manifestObj = manifest as Record<string, unknown>;
    const manifestKind = kind || (manifestObj.kind as OSSAKind | undefined);

    // Use kind-specific validator if available
    let validator: ValidateFunction | undefined;
    if (manifestKind === 'Workflow' && this.validateWorkflow) {
      validator = this.validateWorkflow;
    } else if (manifestKind === 'Task' && this.validateTask) {
      validator = this.validateTask;
    } else if (manifestKind === 'MessageRouting' && this.validateMessageRouting) {
      validator = this.validateMessageRouting;
    } else {
      validator = this.validateManifest;
    }

    const valid = validator(manifest);
    const errors: ValidationError[] = [];

    if (!valid && validator.errors) {
      for (const error of validator.errors) {
        errors.push({
          field: error.instancePath || 'root',
          message: error.message || 'Validation error',
          path: error.instancePath || '/',
        });
      }
    }

    return { 
      valid: !!valid, 
      errors,
      kind: manifestKind 
    };
  }

  /**
   * Validate a Workflow manifest specifically
   */
  validateWorkflowManifest(manifest: unknown): ValidationResult {
    return this.validate(manifest, 'Workflow');
  }

  /**
   * Validate a Task manifest specifically
   */
  validateTaskManifest(manifest: unknown): ValidationResult {
    return this.validate(manifest, 'Task');
  }

  /**
   * Get supported kinds
   */
  getSupportedKinds(): OSSAKind[] {
    return ['Agent', 'Task', 'Workflow', 'MessageRouting'];
  }

  getSchemaForField(fieldPath: string): JSONSchema | null {
    const parts = fieldPath.split('.');
    const schemaProperties = (this.manifestSchema.properties as JSONSchema | undefined) || 
                            (this.fullSchema.properties as JSONSchema | undefined);
    let schema: JSONSchema | undefined = schemaProperties;

    for (const part of parts) {
      if (!schema || typeof schema[part] !== 'object' || schema[part] === null) {
        return null;
      }
      const partSchema = schema[part] as JSONSchema;
      schema = (partSchema.properties as JSONSchema | undefined) || partSchema;
    }

    return schema || null;
  }

  getFieldDescription(fieldPath: string): string | null {
    const schema = this.getSchemaForField(fieldPath);
    const description = schema?.description;
    return typeof description === 'string' ? description : null;
  }
}

export const validator = new OSSAValidator();
