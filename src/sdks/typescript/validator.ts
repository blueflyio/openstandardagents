/**
 * TypeScript SDK Validator
 *
 * SOLID: Single Responsibility - Validation
 * DRY: Uses shared validator
 */

import Ajv from 'ajv';
import { SchemaValidator } from '../shared/schema-validator.js';
import type {
  OSSAManifest,
  Kind,
  AccessTier,
  LLMProvider,
  Tool,
  Capability,
  AgentManifest,
} from './types.js';

const VALID_KINDS: Kind[] = ['Agent', 'Task', 'Workflow'];

const VALID_ACCESS_TIERS: AccessTier[] = [
  'tier_1_read',
  'tier_2_write_limited',
  'tier_3_write_elevated',
  'tier_4_policy',
  'read',
  'limited',
  'elevated',
  'policy',
];

const VALID_LLM_PROVIDERS: LLMProvider[] = [
  'anthropic',
  'openai',
  'azure',
  'google',
  'bedrock',
  'groq',
  'ollama',
];

export class ValidatorService {
  private schemaValidator: SchemaValidator;
  private ajv: Ajv;

  constructor() {
    this.schemaValidator = new SchemaValidator();
    this.ajv = new Ajv({ allErrors: true, strict: false });
  }

  /**
   * Validate manifest structure
   * CRUD: Read (validation)
   */
  validate(manifest: OSSAManifest): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!manifest.apiVersion) errors.push('Missing apiVersion');
    if (!manifest.kind) errors.push('Missing kind');
    if (!manifest.metadata) errors.push('Missing metadata');
    if (!manifest.spec) errors.push('Missing spec');

    // Kind validation
    if (manifest.kind && !VALID_KINDS.includes(manifest.kind)) {
      errors.push(
        `Invalid kind: ${manifest.kind}. Must be one of: ${VALID_KINDS.join(', ')}`
      );
    }

    // Metadata validation
    if (manifest.metadata) {
      if (!manifest.metadata.name) errors.push('Missing metadata.name');
    }

    // Spec validation based on kind
    if (manifest.spec && manifest.kind === 'Agent') {
      const agentManifest = manifest as AgentManifest;
      if (!agentManifest.spec.role)
        warnings.push('Agent should have spec.role');

      // Validate LLM provider
      if (agentManifest.spec.llm) {
        const llmResult = this.validateLLMProvider(
          agentManifest.spec.llm.provider
        );
        if (!llmResult.valid) {
          errors.push(...llmResult.errors);
        }
      }

      // Validate access tier
      if (agentManifest.spec.access_tier) {
        const tierResult = this.validateAccessTier(
          agentManifest.spec.access_tier
        );
        if (!tierResult.valid) {
          errors.push(...tierResult.errors);
        }
      }

      // Validate identity access tier
      if (agentManifest.spec.identity?.access_tier) {
        const tierResult = this.validateAccessTier(
          agentManifest.spec.identity.access_tier
        );
        if (!tierResult.valid) {
          errors.push(...tierResult.errors);
        }
      }

      // Validate tools
      if (agentManifest.spec.tools) {
        for (const tool of agentManifest.spec.tools) {
          const toolResult = this.validateTool(tool);
          if (!toolResult.valid) {
            errors.push(...toolResult.errors);
          }
          warnings.push(...toolResult.warnings);
        }
      }

      // Validate capabilities
      if (agentManifest.spec.capabilities) {
        for (const capability of agentManifest.spec.capabilities) {
          const capResult = this.validateCapability(capability);
          if (!capResult.valid) {
            errors.push(...capResult.errors);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate LLM provider
   * CRUD: Read (validation)
   */
  private validateLLMProvider(provider: string | LLMProvider): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!VALID_LLM_PROVIDERS.includes(provider as LLMProvider)) {
      errors.push(
        `Invalid LLM provider: ${provider}. Must be one of: ${VALID_LLM_PROVIDERS.join(', ')}`
      );
      return { valid: false, errors };
    }

    return { valid: true, errors: [] };
  }

  /**
   * Validate access tier
   * CRUD: Read (validation)
   */
  private validateAccessTier(tier: string | AccessTier): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!VALID_ACCESS_TIERS.includes(tier as AccessTier)) {
      errors.push(
        `Invalid access tier: ${tier}. Must be one of: ${VALID_ACCESS_TIERS.join(', ')}`
      );
      return { valid: false, errors };
    }

    return { valid: true, errors: [] };
  }

  /**
   * Validate tool
   * CRUD: Read (validation)
   */
  private validateTool(tool: Tool): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!tool.name) {
      errors.push('Tool is missing required field: name');
    }

    // Handler validation
    if (tool.handler) {
      const handlerResult = this.validateToolHandler(tool);
      if (!handlerResult.valid) {
        errors.push(...handlerResult.errors);
      }
      warnings.push(...handlerResult.warnings);
    }

    // Parameters validation (JSON schema)
    if (tool.parameters) {
      const paramsResult = this.validateToolParameters(tool.parameters);
      if (!paramsResult.valid) {
        errors.push(...paramsResult.errors);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate tool handler
   * CRUD: Read (validation)
   */
  private validateToolHandler(tool: Tool): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!tool.handler) {
      return { valid: true, errors: [], warnings: [] };
    }

    const handler = tool.handler;

    // At least one handler type must be specified
    if (!handler.runtime && !handler.capability && !handler.endpoint) {
      errors.push(
        `Tool "${tool.name}" handler must specify at least one of: runtime, capability, endpoint`
      );
    }

    // Endpoint handler validation
    if (handler.endpoint) {
      // Validate endpoint URL format
      try {
        new URL(handler.endpoint);
      } catch {
        errors.push(
          `Tool "${tool.name}" handler.endpoint is not a valid URL: ${handler.endpoint}`
        );
      }

      // Method should be specified for endpoint handlers
      if (!handler.method) {
        warnings.push(
          `Tool "${tool.name}" handler.endpoint specified without handler.method (defaults to GET)`
        );
      }
    }

    // Runtime handler validation
    if (handler.runtime) {
      const validRuntimes = ['node', 'python', 'shell', 'docker'];
      if (!validRuntimes.includes(handler.runtime)) {
        warnings.push(
          `Tool "${tool.name}" handler.runtime "${handler.runtime}" is not a standard runtime (${validRuntimes.join(', ')})`
        );
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate tool parameters (JSON schema)
   * CRUD: Read (validation)
   */
  private validateToolParameters(parameters: Record<string, unknown>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Basic JSON schema structure validation
    // Parameters should be an object with valid JSON schema properties
    if (typeof parameters !== 'object' || parameters === null) {
      errors.push('Tool parameters must be an object');
      return { valid: false, errors };
    }

    // Check for common JSON schema fields
    if ('type' in parameters) {
      const validTypes = [
        'string',
        'number',
        'integer',
        'boolean',
        'array',
        'object',
        'null',
      ];
      if (
        !validTypes.includes(parameters.type as string) &&
        !Array.isArray(parameters.type)
      ) {
        errors.push(
          `Invalid JSON schema type: ${parameters.type}. Must be one of: ${validTypes.join(', ')}`
        );
      }
    }

    // Validate nested schemas
    if ('properties' in parameters && typeof parameters.properties === 'object') {
      for (const [propName, propSchema] of Object.entries(
        parameters.properties as Record<string, unknown>
      )) {
        const nestedResult = this.validateToolParameters(
          propSchema as Record<string, unknown>
        );
        if (!nestedResult.valid) {
          errors.push(
            ...nestedResult.errors.map((err) => `properties.${propName}: ${err}`)
          );
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate capability
   * CRUD: Read (validation)
   */
  private validateCapability(capability: Capability): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!capability.name) {
      errors.push('Capability is missing required field: name');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate against JSON Schema file
   * CRUD: Read (validation)
   */
  async validateJSONSchema(
    manifest: OSSAManifest,
    schemaPath: string,
    strict = false
  ) {
    return await this.schemaValidator.validateJSONSchema(
      manifest,
      schemaPath,
      strict
    );
  }
}
