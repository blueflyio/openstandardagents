/**
 * Spec Validate Service
 * 
 * Validates generated spec against OpenAPI schema
 * SOLID: Single Responsibility - Validation only
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { SpecValidateRequest, SpecValidateResponse } from '../schemas/spec.schema';

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
      
      // TODO: Add actual validation against OpenAPI schema
      // For now, just check if it's valid JSON
      
      const errors: string[] = [];
      const warnings: string[] = [];

      // Basic validation
      if (!spec.$schema && !spec.openapi) {
        errors.push('Spec missing $schema or openapi field');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`],
        warnings: [],
      };
    }
  }
}
