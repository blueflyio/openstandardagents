/**
 * Shared SDK Utilities
 *
 * DRY: Common functionality shared across all SDKs
 * Zod: Shared validation schemas
 * OpenAPI: Shared OpenAPI definitions
 */

export * from './validation.js';
export * from './types.js';
export * from './manifest-loader.js';
export * from './schema-validator.js';

// Convenience functions
import { ManifestLoader } from './manifest-loader.js';
import { SchemaValidator } from './schema-validator.js';

/**
 * Load manifest from file path
 */
export function loadManifest<T>(filePath: string): T {
  return ManifestLoader.load<any>(filePath) as T;
}

/**
 * Validate manifest data with a Zod schema
 */
export function validateManifest<T>(
  data: unknown,
  schema: import('zod').ZodSchema<T>
): { valid: boolean; data?: T; errors: string[] } {
  const validator = new SchemaValidator();
  return validator.validateZod(data, schema);
}
