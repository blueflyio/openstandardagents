/**
 * Codegen Service Exports
 *
 * CI-based schema and version generation.
 * Single source of truth: package.json version
 *
 * CRUD Operations via CLI:
 *   ossa generate types      - Generate TypeScript types
 *   ossa generate zod        - Generate Zod schemas
 *   ossa generate manifests  - Update apiVersion in manifests
 *   ossa generate vscode     - Update VSCode extension
 *   ossa generate openapi    - Sync OpenAPI versions
 *   ossa generate all        - Run all generators
 *
 *   ossa generate list       - List files that would be generated
 *   ossa generate validate   - Check for version drift
 *   ossa generate sync       - Sync all files to current version
 */

// Main service
export { CodegenService, type GeneratorType, type GenerateResult, type DriftReport, type Generator } from './codegen.service.js';

// Generators
export { ManifestGenerator } from './generators/manifest.generator.js';
export { VSCodeGenerator } from './generators/vscode.generator.js';
export { OpenAPIGenerator } from './generators/openapi.generator.js';
export { TypesGenerator } from './generators/types.generator.js';
export { ZodGenerator } from './generators/zod.generator.js';

// DI Symbols
export const CODEGEN_SYMBOLS = {
  CodegenService: Symbol.for('CodegenService'),
  ManifestGenerator: Symbol.for('ManifestGenerator'),
  VSCodeGenerator: Symbol.for('VSCodeGenerator'),
  OpenAPIGenerator: Symbol.for('OpenAPIGenerator'),
  TypesGenerator: Symbol.for('TypesGenerator'),
  ZodGenerator: Symbol.for('ZodGenerator'),
} as const;
