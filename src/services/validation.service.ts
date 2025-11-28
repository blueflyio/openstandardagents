/**
 * Validation Service
 * Validates OSSA agent manifests against JSON schemas
 */

import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { inject, injectable } from 'inversify';
import { SchemaRepository } from '../repositories/schema.repository.js';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'path';
import type {
  IValidationService,
  OssaAgent,
  SchemaVersion,
  ValidationResult,
} from '../types/index.js';
import type { OpenAPIOperationWithOssaExtensions } from '../types/openapi-extensions.js';
import { CursorValidator } from './validators/cursor.validator.js';
import { OpenAIValidator } from './validators/openai.validator.js';
import { CrewAIValidator } from './validators/crewai.validator.js';
import { LangChainValidator } from './validators/langchain.validator.js';
import { AnthropicValidator } from './validators/anthropic.validator.js';
import { LangflowValidator } from './validators/langflow.validator.js';
import { AutoGenValidator } from './validators/autogen.validator.js';
import { VercelAIValidator } from './validators/vercel-ai.validator.js';
import { LlamaIndexValidator } from './validators/llamaindex.validator.js';
import { LangGraphValidator } from './validators/langgraph.validator.js';

@injectable()
export class ValidationService implements IValidationService {
  private ajv: Ajv;
  private platformValidators: Map<
    string,
    { validate: (manifest: OssaAgent) => ValidationResult }
  >;

  constructor(
    @inject(SchemaRepository) private schemaRepository: SchemaRepository
  ) {
    this.ajv = new Ajv({
      allErrors: true,
      strict: false, // Allow custom x- keywords in v0.2.4+ schemas
      validateFormats: true,
    });
    addFormats(this.ajv);

    // Initialize platform validators
    this.platformValidators = new Map();
    this.platformValidators.set('cursor', new CursorValidator());
    this.platformValidators.set('openai_agents', new OpenAIValidator());
    this.platformValidators.set('crewai', new CrewAIValidator());
    this.platformValidators.set('langchain', new LangChainValidator());
    this.platformValidators.set('anthropic', new AnthropicValidator());
    this.platformValidators.set('langflow', new LangflowValidator());
    this.platformValidators.set('autogen', new AutoGenValidator());
    this.platformValidators.set('vercel_ai', new VercelAIValidator());
    this.platformValidators.set('llamaindex', new LlamaIndexValidator());
    this.platformValidators.set('langgraph', new LangGraphValidator());
  }

  /**
   * Validate OSSA agent manifest
   * @param manifest - Manifest object to validate
   * @param version - OSSA version (e.g., '0.2.3', '0.2.2', '0.1.9')
   * @returns Validation result with errors and warnings
   */
  async validate(
    manifest: unknown,
    version?: SchemaVersion
  ): Promise<ValidationResult> {
    // Use dynamic version detection if not provided
    if (!version) {
      // Try to extract version from manifest's apiVersion field
      if (manifest && typeof manifest === 'object' && 'apiVersion' in manifest) {
        const apiVersion = (manifest as { apiVersion: string }).apiVersion;
        const match = apiVersion?.match(/^ossa\/v(.+)$/);
        if (match) {
          version = match[1] as SchemaVersion;
        }
      }
      // Fall back to current version if extraction failed
      if (!version) {
        version = this.schemaRepository.getCurrentVersion();
      }
    }
    try {
      // 1. Load schema for version
      const schema = await this.schemaRepository.getSchema(version);

      // 2. Compile validator
      const validator = this.ajv.compile(schema);

      // 3. Validate against schema
      const valid = validator(manifest);

      // 4. Generate warnings (best practices)
      const warnings = this.generateWarnings(manifest);

      // 5. Run platform-specific validators
      const platformResults = this.validatePlatformExtensions(
        manifest as OssaAgent
      );
      const allErrors = [
        ...(valid ? [] : validator.errors || []),
        ...platformResults.errors,
      ];
      const allWarnings = [...warnings, ...platformResults.warnings];

      // 6. Return structured result
      return {
        valid: valid && platformResults.valid,
        errors: allErrors,
        warnings: allWarnings,
        manifest:
          valid && platformResults.valid ? (manifest as OssaAgent) : undefined,
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

    const m = manifest as OssaAgent;
    const spec = m.spec || m.agent;
    const metadata =
      (m as Record<string, unknown>).metadata ||
      (m.agent as Record<string, unknown> | undefined)?.metadata;

    if (!spec) {
      return warnings;
    }

    // Check for description
    const metadataRecord = metadata as Record<string, unknown> | undefined;
    if (
      !metadataRecord?.description ||
      (typeof metadataRecord.description === 'string' &&
        metadataRecord.description.trim().length === 0)
    ) {
      warnings.push(
        'Best practice: Add agent description for better documentation'
      );
    }

    // Check for LLM configuration
    if (!spec.llm && !m.agent?.llm) {
      warnings.push(
        'Best practice: Specify LLM configuration (provider, model, temperature)'
      );
    }

    // Check for tools/capabilities
    if (
      (!spec.tools || spec.tools.length === 0) &&
      (!m.agent?.tools || m.agent.tools.length === 0)
    ) {
      warnings.push(
        'Best practice: Define tools/capabilities for the agent to use'
      );
    }

    // Check for observability
    const extensions = m.extensions;
    const specRecord = spec as Record<string, unknown>;
    const agentRecord = m.agent as Record<string, unknown> | undefined;
    if (extensions && !specRecord.observability && !agentRecord?.monitoring) {
      warnings.push(
        'Best practice: Configure observability (tracing, metrics, logging)'
      );
    }

    // Check for autonomy configuration
    if (!specRecord.autonomy && !agentRecord?.autonomy) {
      warnings.push(
        'Best practice: Define autonomy level and approval requirements'
      );
    }

    // Check for constraints
    if (!specRecord.constraints && !agentRecord?.constraints) {
      warnings.push(
        'Best practice: Set cost and performance constraints for production use'
      );
    }

    return warnings;
  }

  /**
   * Validate platform-specific extensions
   * @param manifest - Manifest object to validate
   * @returns Combined validation result from all platform validators
   */
  private validatePlatformExtensions(manifest: OssaAgent): ValidationResult {
    const errors: ErrorObject[] = [];
    const warnings: string[] = [];
    let allValid = true;

    if (!manifest.extensions || typeof manifest.extensions !== 'object') {
      return { valid: true, errors: [], warnings: [] };
    }

    // Run each platform validator
    for (const [platform, validator] of this.platformValidators.entries()) {
      if (manifest.extensions[platform]) {
        const result = validator.validate(manifest);
        if (!result.valid) {
          allValid = false;
        }
        errors.push(...result.errors);
        warnings.push(...result.warnings);
      }
    }

    return {
      valid: allValid,
      errors,
      warnings,
    };
  }

  /**
   * Validate multiple manifests
   * @param manifests - Array of manifests to validate
   * @param version - Schema version
   * @returns Array of validation results
   */
  async validateMany(
    manifests: unknown[],
    version?: SchemaVersion
  ): Promise<ValidationResult[]> {
    // Use dynamic version detection if not provided
    if (!version) {
      version = this.schemaRepository.getCurrentVersion();
    }
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
      const possiblePaths = [
        join(process.cwd(), 'dist/docs/schemas/openapi-extensions.schema.json'),
        join(process.cwd(), 'spec/schemas/openapi-extensions.schema.json'),
      ];

      for (const path of possiblePaths) {
        try {
          if (existsSync(path)) {
            // Schema loaded but not used in validation logic
            JSON.parse(readFileSync(path, 'utf-8'));
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
