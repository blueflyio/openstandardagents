import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import logger from './logger';

interface ValidationError {
  field: string;
  message: string;
  path: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

type JSONSchema = Record<string, unknown>;

class OSSAValidator {
  private ajv: Ajv;
  private validateManifest?: ValidateFunction;
  private manifestSchema: JSONSchema = {};

  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);
  }

  async initialize(): Promise<void> {
    // OSSA Manifest Schema (based on OSSA spec)
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
          description: 'Agent name (lowercase, alphanumeric, hyphens)',
        },
        version: {
          type: 'string',
          pattern: '^\\d+\\.\\d+\\.\\d+(-[a-z0-9-]+)?$',
          description: 'Semantic version (e.g., 1.0.0)',
        },
        ossa_version: {
          type: 'string',
          pattern: '^\\d+\\.\\d+\\.\\d+$',
          description: 'OSSA specification version',
        },
        type: {
          type: 'string',
          enum: ['worker', 'supervisor', 'hybrid'],
          description: 'Agent type',
        },
        description: {
          type: 'string',
          maxLength: 500,
          description: 'Short description of the agent',
        },
        capabilities: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['name', 'description'],
            properties: {
              name: {
                type: 'string',
                pattern: '^[a-z0-9-_]+$',
              },
              description: {
                type: 'string',
              },
              parameters: {
                type: 'object',
              },
              returns: {
                type: 'object',
              },
            },
          },
        },
        runtime: {
          type: 'object',
          properties: {
            engine: {
              type: 'string',
              enum: ['node', 'python', 'docker', 'bash'],
            },
            version: {
              type: 'string',
            },
            entrypoint: {
              type: 'string',
            },
          },
        },
        communication: {
          type: 'object',
          properties: {
            protocols: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['http', 'grpc', 'websocket', 'stdio', 'message-queue'],
              },
            },
            endpoints: {
              type: 'object',
            },
          },
        },
        dependencies: {
          type: 'object',
          properties: {
            agents: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name', 'version'],
                properties: {
                  name: { type: 'string' },
                  version: { type: 'string' },
                  optional: { type: 'boolean' },
                },
              },
            },
            services: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  version: { type: 'string' },
                  optional: { type: 'boolean' },
                },
              },
            },
          },
        },
        metadata: {
          type: 'object',
          properties: {
            author: { type: 'string' },
            license: { type: 'string' },
            repository: {
              type: 'string',
              format: 'uri',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      },
    };

    this.validateManifest = this.ajv.compile(this.manifestSchema);
    logger.info('OSSA validator initialized with manifest schema');
  }

  validate(manifest: unknown): ValidationResult {
    if (!this.validateManifest) {
      throw new Error('Validator not initialized. Call initialize() first.');
    }

    const valid = this.validateManifest(manifest);
    const errors: ValidationError[] = [];

    if (!valid && this.validateManifest.errors) {
      for (const error of this.validateManifest.errors) {
        errors.push({
          field: error.instancePath || 'root',
          message: error.message || 'Validation error',
          path: error.instancePath || '/',
        });
      }
    }

    return { valid: !!valid, errors };
  }

  getSchemaForField(fieldPath: string): JSONSchema | null {
    const parts = fieldPath.split('.');
    const schemaProperties = (this.manifestSchema.properties as JSONSchema | undefined);
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
