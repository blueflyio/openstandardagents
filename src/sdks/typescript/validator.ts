/**
 * TypeScript SDK Validator
 *
 * SOLID: Single Responsibility - Validation
 * Zod: Runtime validation
 * DRY: Uses shared validator
 */

import { SchemaValidator } from '../shared/schema-validator.js';
import type { OSSAManifest } from './types.js';
import {
  AgentManifestSchema,
  TaskManifestSchema,
  WorkflowManifestSchema,
} from './types.js';

export class ValidatorService {
  private validator: SchemaValidator;

  constructor() {
    this.validator = new SchemaValidator();
  }

  /**
   * Validate manifest against schema
   * CRUD: Read (validation)
   */
  validate(manifest: OSSAManifest, strict = false): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const schema =
      manifest.kind === 'Agent'
        ? AgentManifestSchema
        : manifest.kind === 'Task'
        ? TaskManifestSchema
        : WorkflowManifestSchema;

    const result = this.validator.validateZod(manifest, schema, strict);

    return {
      valid: result.valid || false,
      errors: result.errors || [],
      warnings: [],
    };
  }

  /**
   * Validate against JSON Schema file
   * CRUD: Read (validation)
   */
  validateJSONSchema(manifest: OSSAManifest, schemaPath: string, strict = false) {
    return this.validator.validateJSONSchema(manifest, schemaPath, strict);
  }
}
