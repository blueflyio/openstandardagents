/**
 * Schema Validator - Shared Across SDKs
 *
 * SOLID: Single Responsibility - Schema validation
 * Zod: Runtime validation
 * DRY: Shared validation logic
 */

import { z } from 'zod';
import { readFileSync } from 'fs';

// JSON Schema validation - using dynamic import to avoid requiring ajv as dependency
// If ajv is needed, it should be added to package.json dependencies
let Ajv: any;
let addFormats: any;

async function loadAjv(): Promise<boolean> {
  if (!Ajv) {
    try {
      const ajvModule = await import('ajv');
      const formatsModule = await import('ajv-formats');
      Ajv = ajvModule.default || ajvModule.Ajv;
      addFormats = formatsModule.default;
    } catch {
      // Ajv not available - JSON Schema validation will be skipped
      return false;
    }
  }
  return true;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class SchemaValidator {
  private ajv: any | null = null;
  private ajvLoaded = false;

  constructor() {
    // Ajv will be loaded lazily if available
  }

  private async ensureAjv(): Promise<boolean> {
    if (!this.ajvLoaded) {
      this.ajvLoaded = await loadAjv();
      if (this.ajvLoaded && Ajv) {
        this.ajv = new Ajv({ allErrors: true, strict: false });
        if (addFormats) {
          addFormats(this.ajv);
        }
      }
    }
    return this.ajvLoaded;
  }

  /**
   * Validate against JSON Schema
   * CRUD: Read (validation)
   */
  async validateJSONSchema(
    data: unknown,
    schemaPath: string,
    strict = false
  ): Promise<ValidationResult> {
    const ajvAvailable = await this.ensureAjv();

    if (!ajvAvailable || !this.ajv) {
      return {
        valid: false,
        errors: ['JSON Schema validation requires ajv package. Install with: npm install ajv ajv-formats'],
        warnings: [],
      };
    }

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
