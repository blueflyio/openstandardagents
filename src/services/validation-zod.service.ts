/**
 * Validation Service - Zod Implementation
 * 
 * DRY, SOLID, ZOD, OPENAPI-FIRST
 * 
 * Replaces Ajv with Zod for runtime validation.
 * Uses generated Zod schemas from OpenAPI specs.
 */

import { z } from 'zod';
import { inject, injectable } from 'inversify';
import { SchemaRepository } from '../repositories/schema.repository.js';
import type {
  IValidationService,
  OssaAgent,
  SchemaVersion,
  ValidationResult,
} from '../types/index.js';
import type { ErrorObject } from 'ajv';
import { MessagingValidator } from './validators/messaging.validator.js';
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

/**
 * Convert Zod error to Ajv ErrorObject format for compatibility
 */
function zodErrorToErrorObject(error: z.ZodError, path = ''): ErrorObject[] {
  const errors: ErrorObject[] = [];

  for (const issue of error.issues) {
    const instancePath = path ? `${path}${issue.path.map(p => `/${String(p)}`).join('')}` : issue.path.map(p => `/${String(p)}`).join('');

    errors.push({
      instancePath,
      schemaPath: instancePath,
      keyword: issue.code,
      params: issue.code === 'invalid_type' ? { type: issue.expected } : {},
      message: issue.message,
    });
  }

  return errors;
}

/**
 * Load Zod schema for version
 * Falls back to basic schema if version-specific not found
 */
async function loadZodSchema(version: string): Promise<z.ZodType<OssaAgent, z.ZodTypeDef, unknown>> {
  // Use static import for v0.3.3 (current version)
  // TODO: Generate schemas for all versions and use dynamic loading
  try {
    const { OssaAgentSchema } = await import('../types/generated/ossa-0.3.3.zod.js');
    return OssaAgentSchema as z.ZodType<OssaAgent, z.ZodTypeDef, unknown>;
  } catch {
    // Ultimate fallback - create minimal schema
    return z.object({
      apiVersion: z.string(),
      kind: z.string().optional(),
      metadata: z.object({
        name: z.string(),
      }).passthrough().optional(),
      spec: z.record(z.string(), z.unknown()).optional(),
    }) as z.ZodType<OssaAgent, z.ZodTypeDef, unknown>;
  }
}

@injectable()
export class ValidationZodService implements IValidationService {
  private platformValidators: Map<string, { validate: (manifest: OssaAgent) => ValidationResult }>;

  constructor(@inject(SchemaRepository) private schemaRepository: SchemaRepository) {
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
   * Validate OSSA agent manifest using Zod
   */
  async validate(manifest: unknown, version?: SchemaVersion): Promise<ValidationResult> {
    // Use dynamic version detection if not provided
    if (!version) {
      if (manifest && typeof manifest === 'object' && 'apiVersion' in manifest) {
        const apiVersion = (manifest as { apiVersion: string }).apiVersion;
        const match = apiVersion?.match(/^ossa\/v(.+)$/);
        if (match) {
          version = match[1] as SchemaVersion;
        }
      }
      if (!version) {
        version = this.schemaRepository.getCurrentVersion();
      }
    }

    try {
      // 1. Load Zod schema for version
      const schema = await loadZodSchema(version);

      // 2. Validate against Zod schema
      const result = schema.safeParse(manifest);

      // 3. Generate warnings (best practices)
      const warnings = this.generateWarnings(manifest);

      // 4. Validate messaging extension (v0.3.0+)
      const messagingErrors: ErrorObject[] = [];
      if (
        manifest &&
        typeof manifest === 'object' &&
        'apiVersion' in manifest &&
        'spec' in manifest
      ) {
        const apiVersion = (manifest as { apiVersion: string }).apiVersion;
        const spec = (manifest as { spec?: Record<string, unknown> }).spec;
        if (spec && typeof spec === 'object' && 'messaging' in spec) {
          const messagingValidator = new MessagingValidator();
          const messagingValidationErrors = messagingValidator.validateMessagingExtension(
            spec.messaging as Record<string, unknown>,
            apiVersion
          );
          messagingErrors.push(
            ...messagingValidationErrors.map((err) => ({
              instancePath: err.path,
              schemaPath: err.path,
              keyword: 'messaging',
              params: {},
              message: err.message,
            }))
          );
        }
      }

      // 5. Run platform-specific validators
      const platformResults = this.validatePlatformExtensions(
        result.success ? (result.data as OssaAgent) : (manifest as OssaAgent)
      );

      // 6. Combine all errors
      const allErrors = [
        ...(result.success
          ? []
          : zodErrorToErrorObject(result.error)),
        ...messagingErrors,
        ...platformResults.errors,
      ];
      const allWarnings = [...warnings, ...platformResults.warnings];

      // 7. Return structured result
      return {
        valid: result.success && platformResults.valid && messagingErrors.length === 0,
        errors: allErrors,
        warnings: allWarnings,
        manifest: result.success && platformResults.valid ? result.data : undefined,
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
            message: error instanceof Error ? error.message : 'Unknown validation error',
          } as ErrorObject,
        ],
        warnings: [],
      };
    }
  }

  /**
   * Generate best practice warnings
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
      warnings.push('Best practice: Add agent description for better documentation');
    }

    // Check for LLM configuration
    if (!spec.llm && !m.agent?.llm) {
      warnings.push('Best practice: Specify LLM configuration (provider, model, temperature)');
    }

    // Check for tools/capabilities
    if (
      (!spec.tools || spec.tools.length === 0) &&
      (!m.agent?.tools || m.agent.tools.length === 0)
    ) {
      warnings.push('Best practice: Define tools/capabilities for the agent to use');
    }

    // Check for observability
    const extensions = m.extensions;
    const specRecord = spec as Record<string, unknown>;
    const agentRecord = m.agent as Record<string, unknown> | undefined;
    if (extensions && !specRecord.observability && !agentRecord?.monitoring) {
      warnings.push('Best practice: Configure observability (tracing, metrics, logging)');
    }

    // Check for autonomy configuration
    if (!specRecord.autonomy && !agentRecord?.autonomy) {
      warnings.push('Best practice: Define autonomy level and approval requirements');
    }

    // Check for constraints
    if (!specRecord.constraints && !agentRecord?.constraints) {
      warnings.push('Best practice: Set cost and performance constraints for production use');
    }

    return warnings;
  }

  /**
   * Validate platform-specific extensions
   */
  private validatePlatformExtensions(manifest: OssaAgent): ValidationResult {
    const errors: ErrorObject[] = [];
    const warnings: string[] = [];
    let valid = true;

    if (!manifest.extensions) {
      return { valid: true, errors: [], warnings: [] };
    }

    for (const [platform, config] of Object.entries(manifest.extensions)) {
      const validator = this.platformValidators.get(platform);
      if (validator) {
        const result = validator.validate(manifest);
        if (!result.valid) {
          valid = false;
          errors.push(...result.errors);
        }
        warnings.push(...result.warnings);
      }
    }

    return { valid, errors, warnings };
  }

  /**
   * Validate multiple manifests
   */
  async validateMany(manifests: unknown[], version?: SchemaVersion): Promise<ValidationResult[]> {
    if (!version) {
      version = this.schemaRepository.getCurrentVersion();
    }
    return Promise.all(manifests.map((manifest) => this.validate(manifest, version)));
  }

  /**
   * Validate OpenAPI spec with OSSA extensions
   */
  async validateOpenAPIExtensions(openapiSpec: unknown): Promise<ValidationResult> {
    try {
      const spec = openapiSpec as Record<string, unknown>;
      const extensions: Record<string, unknown> = {};
      const errors: ErrorObject[] = [];
      const warnings: string[] = [];

      // Root-level extensions
      if (spec['x-ossa-metadata']) {
        extensions['x-ossa-metadata'] = spec['x-ossa-metadata'];
      }
      if (spec['x-ossa']) {
        extensions['x-ossa'] = spec['x-ossa'];
      }

      // Validate x-ossa-metadata
      if (extensions['x-ossa-metadata']) {
        const metadata = extensions['x-ossa-metadata'] as Record<string, unknown>;
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
      }

      // Generate warnings
      if (!extensions['x-ossa-metadata'] && !extensions['x-ossa']) {
        warnings.push(
          'Best practice: Add x-ossa-metadata or x-ossa extension for agent identification'
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
            message: error instanceof Error ? error.message : 'Unknown validation error',
          } as ErrorObject,
        ],
        warnings: [],
      };
    }
  }
}
