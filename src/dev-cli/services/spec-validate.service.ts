/**
 * Spec Validate Service
 *
 * Validates generated spec against OpenAPI schema
 * SOLID: Single Responsibility - Validation only
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  SpecValidateRequest,
  SpecValidateResponse,
} from '../schemas/spec.schema.js';

export class SpecValidateService {
  private readonly rootDir: string;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
  }

  /**
   * Validate generated spec
   * CRUD: Read operation (validates spec)
   */
  async validate(request: SpecValidateRequest): Promise<SpecValidateResponse> {
    const specPath = join(this.rootDir, request.specPath);

    if (!existsSync(specPath)) {
      return {
        valid: false,
        errors: [`Spec file not found: ${request.specPath}`],
        warnings: [],
      };
    }

    try {
      const spec = JSON.parse(readFileSync(specPath, 'utf-8'));

      const errors: string[] = [];
      const warnings: string[] = [];

      // Determine spec type and validate accordingly
      if (spec.openapi) {
        // OpenAPI spec validation
        const openapiVersion = String(spec.openapi);
        if (!openapiVersion.startsWith('3.')) {
          errors.push(`Unsupported OpenAPI version: ${openapiVersion} (expected 3.x)`);
        }
        if (!spec.info) {
          errors.push('OpenAPI spec missing required "info" field');
        } else {
          if (!spec.info.title) errors.push('OpenAPI spec missing "info.title"');
          if (!spec.info.version) errors.push('OpenAPI spec missing "info.version"');
        }
        if (!spec.paths && !spec.components) {
          warnings.push('OpenAPI spec has neither "paths" nor "components"');
        }
      } else if (spec.$schema) {
        // JSON Schema validation
        if (typeof spec.$schema !== 'string') {
          errors.push('"$schema" must be a string URI');
        }
        if (spec.type && !['object', 'array', 'string', 'number', 'integer', 'boolean', 'null'].includes(spec.type)) {
          errors.push(`Invalid JSON Schema type: ${spec.type}`);
        }
      } else if (spec.version && spec.schemas) {
        // Generated consolidated spec validation
        if (typeof spec.schemas !== 'object' || Array.isArray(spec.schemas)) {
          errors.push('"schemas" must be an object');
        }
        if (Object.keys(spec.schemas).length === 0) {
          warnings.push('Consolidated spec contains no schemas');
        }
      } else {
        errors.push('Spec missing $schema, openapi, or recognized spec format identifier');
      }

      // Check for common issues
      const specStr = JSON.stringify(spec);
      if (specStr.includes('"$ref"')) {
        // Verify $ref targets exist (basic check)
        const refPattern = /"\$ref"\s*:\s*"#\/([^"]+)"/g;
        let match;
        while ((match = refPattern.exec(specStr)) !== null) {
          const refPath = match[1].split('/');
          let target: any = spec;
          for (const segment of refPath) {
            target = target?.[segment];
          }
          if (target === undefined) {
            errors.push(`Broken $ref: #/${match[1]}`);
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [
          `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
        ],
        warnings: [],
      };
    }
  }
}
