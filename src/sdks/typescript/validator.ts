/**
 * TypeScript SDK Validator
 *
 * SOLID: Single Responsibility - Validation
 * DRY: Uses shared validator
 */

import { SchemaValidator } from '../shared/schema-validator.js';
import type { OSSAManifest, Kind } from './types.js';

const VALID_KINDS: Kind[] = ['Agent', 'Task', 'Workflow'];

export class ValidatorService {
  private schemaValidator: SchemaValidator;

  constructor() {
    this.schemaValidator = new SchemaValidator();
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
      if (!manifest.spec.role) warnings.push('Agent should have spec.role');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
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
