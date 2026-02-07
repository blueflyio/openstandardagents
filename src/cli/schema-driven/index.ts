/**
 * Schema-Driven Infrastructure - API-First Entry Point
 * Exports all schema-driven utilities
 */

import { getSchemaLoader } from './schema-loader.js';
import { createUIGenerator } from './ui-generator.js';

export { SchemaLoader, getSchemaLoader } from './schema-loader.js';
export type { SchemaDefinition, EnumOption } from './schema-loader.js';

export { UIGenerator, createUIGenerator } from './ui-generator.js';
export type { UIGeneratorOptions } from './ui-generator.js';

// Re-export for convenience
export { default as inquirer } from 'inquirer';
export { default as chalk } from 'chalk';

/**
 * Quick-start helper: Create schema-driven wizard components
 */
export function initializeAPIsFirst(schemaPath?: string) {
  const schema = getSchemaLoader(schemaPath);
  const ui = createUIGenerator(schemaPath, {
    includeOptional: true,
    showDescriptions: true,
    allowSkip: true,
  });

  return {
    schema,
    ui,
    // Convenience methods
    validateManifest: (manifest: any) => schema.validate(manifest),
    getLLMProviders: () => schema.getLLMProviders(),
    getToolTypes: () => schema.getToolTypes(),
    getExtensions: () => schema.getExtensionTypes(),
    generateLLMConfig: () => ui.generateLLMConfig(),
    generateToolConfig: () => ui.generateToolConfig(),
  };
}
