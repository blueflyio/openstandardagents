/**
 * Schema Validator - Shared Across SDKs
 *
 * SOLID: Single Responsibility - Schema validation
 * Zod: Runtime validation
 * DRY: Shared validation logic
 */

import { z } from 'zod';
import { readFileSync } from 'fs';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class SchemaValidator {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);
  }

  /**
   * Validate against JSON Schema
   * CRUD: Read (validation)
   */
  validateJSONSchema(
    data: unknown,
    schemaPath: string,
    strict = false
  ): ValidationResult {
    const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
    const validate = this.ajv.compile(schema);
    const valid = validate(data);

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!valid && validate.errors) {
      for (const error of validate.errors) {
        const message = `${error.instancePath || '/'}: ${error.message}`;
        if (strict || error.keyword === 'required') {
          errors.push(message);
        } else {
          warnings.push(message);
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
   * Validate with Zod schema
   * CRUD: Read (validation)
   */
  validateZod<T>(
    data: unknown,
    schema: z.ZodSchema<T>,
    strict = false
  ): { valid: boolean; data?: T; errors: string[] } {
    const result = schema.safeParse(data);

    if (result.success) {
      return {
        valid: true,
        data: result.data,
        errors: [],
      };
    }

    const errors = result.error.errors.map(
      (err) => `${err.path.join('.')}: ${err.message}`
    );

    return {
      valid: false,
      errors,
    };
  }
}
