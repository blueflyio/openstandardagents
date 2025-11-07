/**
 * Validation Service
 * Validates OSSA agent manifests against JSON schemas
 */

import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { inject, injectable } from 'inversify';
import { SchemaRepository } from '../repositories/schema.repository.js';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'path';
import type {
  IValidationService,
  OssaAgent,
  SchemaVersion,
  ValidationResult,
} from '../types/index.js';
import type {
  OpenAPISpecWithOssaExtensions,
  OpenAPIOperationWithOssaExtensions,
} from '../types/openapi-extensions.js';

@injectable()
export class ValidationService implements IValidationService {
  private ajv: Ajv;

  constructor(
    @inject(SchemaRepository) private schemaRepository: SchemaRepository
  ) {
    this.ajv = new Ajv({
      allErrors: true,
      strict: true,
      validateFormats: true,
    });
    addFormats(this.ajv);
  }

  /**
   * Validate OSSA agent manifest
   * @param manifest - Manifest object to validate
   * @param version - OSSA version (e.g., '0.2.2', '0.1.9', '1.0')
   * @returns Validation result with errors and warnings
   */
  async validate(
    manifest: unknown,
    version: SchemaVersion = '0.2.2'
  ): Promise<ValidationResult> {
    try {
      // 1. Load schema for version
      const schema = await this.schemaRepository.getSchema(version);

      // 2. Compile validator
      const validator = this.ajv.compile(schema);

      // 3. Validate against schema
      const valid = validator(manifest);

      // 4. Generate warnings (best practices)
      const warnings = this.generateWarnings(manifest);

      // 5. Return structured result
      return {
        valid,
        errors: valid ? [] : validator.errors || [],
        warnings,
        manifest: valid ? (manifest as OssaAgent) : undefined,
      };
    } catch (error) {
      // Handle validation errors
      return {
        valid: false,
        errors: [
          {
            instancePath: '',
            schemaPath: '',
            keyword: 'error',
            params: {},
            message:
              error instanceof Error
                ? error.message
                : 'Unknown validation error',
          } as ErrorObject,
        ],
        warnings: [],
      };
    }
  }

  /**
   * Generate warnings for best practices
   * @param manifest - Manifest object to check
   * @returns Array of warning messages
   */
  private generateWarnings(manifest: unknown): string[] {
    const warnings: string[] = [];

    if (!manifest || typeof manifest !== 'object') {
      return warnings;
    }

    const agent = (manifest as any).agent;

    if (!agent) {
      return warnings;
    }

    // Check for description
    if (!agent.description || agent.description.trim().length === 0) {
      warnings.push(
        'Best practice: Add agent description for better documentation'
      );
    }

    // Check for LLM configuration
    if (!agent.llm) {
      warnings.push(
        'Best practice: Specify LLM configuration (provider, model, temperature)'
      );
    }

    // Check for tools/capabilities
    if (!agent.tools || agent.tools.length === 0) {
      warnings.push(
        'Best practice: Define tools/capabilities for the agent to use'
      );
    }

    // Check for observability
    const extensions = (manifest as any).extensions;
    if (extensions && !extensions.observability) {
      warnings.push(
        'Best practice: Configure observability (tracing, metrics, logging)'
      );
    }

    // Check for autonomy configuration
    if (!agent.autonomy) {
      warnings.push(
        'Best practice: Define autonomy level and approval requirements'
      );
    }

    // Check for constraints
    if (!agent.constraints) {
      warnings.push(
        'Best practice: Set cost and performance constraints for production use'
      );
    }

    return warnings;
  }

  /**
   * Validate multiple manifests
   * @param manifests - Array of manifests to validate
   * @param version - Schema version
   * @returns Array of validation results
   */
  async validateMany(
    manifests: unknown[],
    version: SchemaVersion = '0.2.2'
  ): Promise<ValidationResult[]> {
    return Promise.all(
      manifests.map((manifest) => this.validate(manifest, version))
    );
  }

  /**
   * Validate OpenAPI spec with OSSA extensions
   * @param openapiSpec - OpenAPI specification object
   * @returns Validation result with errors and warnings for extensions
   */
  async validateOpenAPIExtensions(
    openapiSpec: unknown
  ): Promise<ValidationResult> {
    try {
      // Load OpenAPI extensions schema
      // Try multiple possible paths (works in both dev and production)
      let extensionSchema: Record<string, unknown> = {};
      const possiblePaths = [
        join(process.cwd(), 'docs/schemas/openapi-extensions.schema.json'),
        join(process.cwd(), 'dist/docs/schemas/openapi-extensions.schema.json'),
        join(process.cwd(), 'spec/schemas/openapi-extensions.schema.json'),
      ];

      for (const path of possiblePaths) {
        try {
          if (existsSync(path)) {
            extensionSchema = JSON.parse(readFileSync(path, 'utf-8'));
            break;
          }
        } catch {
          // Try next path
        }
      }

      // Extract OSSA extensions from spec
      const spec = openapiSpec as Record<string, unknown>;
      const extensions: Record<string, unknown> = {};

      // Root-level extensions
      if (spec['x-ossa-metadata']) {
        extensions['x-ossa-metadata'] = spec['x-ossa-metadata'];
      }
      if (spec['x-ossa']) {
        extensions['x-ossa'] = spec['x-ossa'];
      }
      if (spec['x-agent']) {
        extensions['x-agent'] = spec['x-agent'];
      }

      // Operation-level extensions (in paths)
      if (spec.paths && typeof spec.paths === 'object') {
        const paths = spec.paths as Record<string, unknown>;
        for (const path of Object.values(paths)) {
          if (path && typeof path === 'object') {
            const pathItem = path as Record<string, unknown>;
            for (const operation of Object.values(pathItem)) {
              if (
                operation &&
                typeof operation === 'object' &&
                'operationId' in operation
              ) {
                const op = operation as OpenAPIOperationWithOssaExtensions;
                if (op['x-ossa-capability']) {
                  extensions['x-ossa-capability'] = op['x-ossa-capability'];
                }
                if (op['x-ossa-autonomy']) {
                  extensions['x-ossa-autonomy'] = op['x-ossa-autonomy'];
                }
                if (op['x-ossa-constraints']) {
                  extensions['x-ossa-constraints'] = op['x-ossa-constraints'];
                }
                if (op['x-ossa-tools']) {
                  extensions['x-ossa-tools'] = op['x-ossa-tools'];
                }
                if (op['x-ossa-llm']) {
                  extensions['x-ossa-llm'] = op['x-ossa-llm'];
                }
              }
            }
          }
        }
      }

      // Validate extensions against schema (basic validation)
      const warnings: string[] = [];
      const errors: ErrorObject[] = [];

      // Validate x-ossa-metadata
      if (extensions['x-ossa-metadata']) {
        const metadata = extensions['x-ossa-metadata'] as Record<
          string,
          unknown
        >;
        if (!metadata.version) {
          errors.push({
            instancePath: '/x-ossa-metadata',
            schemaPath: '',
            keyword: 'required',
            params: { missingProperty: 'version' },
            message: 'x-ossa-metadata must have version field',
          } as ErrorObject);
        }
      }

      // Validate x-ossa
      if (extensions['x-ossa']) {
        const ossa = extensions['x-ossa'] as Record<string, unknown>;
        if (!ossa.version) {
          errors.push({
            instancePath: '/x-ossa',
            schemaPath: '',
            keyword: 'required',
            params: { missingProperty: 'version' },
            message: 'x-ossa must have version field',
          } as ErrorObject);
        }
        if (!ossa.agent || typeof ossa.agent !== 'object') {
          errors.push({
            instancePath: '/x-ossa',
            schemaPath: '',
            keyword: 'required',
            params: { missingProperty: 'agent' },
            message: 'x-ossa must have agent field',
          } as ErrorObject);
        } else {
          const agent = ossa.agent as Record<string, unknown>;
          if (!agent.id) {
            errors.push({
              instancePath: '/x-ossa/agent',
              schemaPath: '',
              keyword: 'required',
              params: { missingProperty: 'id' },
              message: 'x-ossa.agent must have id field',
            } as ErrorObject);
          }
          if (!agent.type) {
            errors.push({
              instancePath: '/x-ossa/agent',
              schemaPath: '',
              keyword: 'required',
              params: { missingProperty: 'type' },
              message: 'x-ossa.agent must have type field',
            } as ErrorObject);
          }
        }
      }

      // Generate warnings
      if (!extensions['x-ossa-metadata'] && !extensions['x-ossa']) {
        warnings.push(
          'Best practice: Add x-ossa-metadata or x-ossa extension for agent identification'
        );
      }

      // Check for operation-level extensions
      const hasOperationExtensions =
        extensions['x-ossa-capability'] ||
        extensions['x-ossa-autonomy'] ||
        extensions['x-ossa-constraints'];
      if (!hasOperationExtensions && spec.paths) {
        warnings.push(
          'Best practice: Add x-ossa-capability, x-ossa-autonomy, or x-ossa-constraints to operations'
        );
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        manifest: undefined,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [
          {
            instancePath: '',
            schemaPath: '',
            keyword: 'error',
            params: {},
            message:
              error instanceof Error
                ? error.message
                : 'Unknown validation error',
          } as ErrorObject,
        ],
        warnings: [],
      };
    }
  }
}
