/**
 * Validation Service
 * Validates OSSA agent manifests against JSON schemas
 */

import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { injectable, inject } from 'inversify';
import type {
  IValidationService,
  ValidationResult,
  SchemaVersion,
  OssaAgent,
} from '../types/index.js';
import { SchemaRepository } from '../repositories/schema.repository.js';

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
   * @param manifest - Parsed manifest object
   * @param version - OSSA version (e.g., '0.2.2', '1.0', '0.1.9')
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
}
