/**
 * llms.txt Extension Zod Schemas
 * Runtime validation for llms.txt extension configuration
 * DRY: Single source of truth for validation
 * ZOD: Type-safe runtime validation
 */

import { z } from 'zod';

/**
 * llms.txt section configuration schema
 */
export const LlmsTxtSectionSchema = z.object({
  enabled: z.boolean().default(true).optional(),
  source: z.string().optional(),
  custom: z.string().optional(),
  append: z.string().optional(),
  prepend: z.string().optional(),
  title: z.string().optional(),
  file_list: z.array(z.string()).optional(),
});

/**
 * llms.txt format configuration schema
 */
export const LlmsTxtFormatSchema = z.object({
  include_h1_title: z.boolean().default(true).optional(),
  include_blockquote: z.boolean().default(true).optional(),
  include_h2_sections: z.boolean().default(true).optional(),
  include_optional: z.boolean().default(true).optional(),
});

/**
 * llms.txt sync configuration schema
 */
export const LlmsTxtSyncSchema = z.object({
  on_manifest_change: z.boolean().default(true).optional(),
  include_comments: z.boolean().default(false).optional(),
  preserve_custom: z.boolean().default(true).optional(),
  watch: z.boolean().default(false).optional(),
});

/**
 * llms.txt mapping configuration schema
 */
export const LlmsTxtMappingSchema = z.object({
  metadata_to_h1: z.boolean().default(true).optional(),
  description_to_blockquote: z.boolean().default(true).optional(),
  spec_to_core_specification: z.boolean().default(true).optional(),
  tools_to_cli_tools: z.boolean().default(true).optional(),
  examples_to_examples: z.boolean().default(true).optional(),
  migrations_to_migration_guides: z.boolean().default(true).optional(),
});

/**
 * llms.txt sections configuration schema
 */
export const LlmsTxtSectionsSchema = z
  .object({
    core_specification: LlmsTxtSectionSchema.optional(),
    quick_start: LlmsTxtSectionSchema.optional(),
    cli_tools: LlmsTxtSectionSchema.optional(),
    sdks: LlmsTxtSectionSchema.optional(),
    examples: LlmsTxtSectionSchema.optional(),
    migration_guides: LlmsTxtSectionSchema.optional(),
    development: LlmsTxtSectionSchema.optional(),
    specification_versions: LlmsTxtSectionSchema.optional(),
    openapi_specifications: LlmsTxtSectionSchema.optional(),
    documentation: LlmsTxtSectionSchema.optional(),
    optional: LlmsTxtSectionSchema.optional(),
    custom: z.array(LlmsTxtSectionSchema).optional(),
  })
  .catchall(LlmsTxtSectionSchema);

/**
 * Main llms.txt extension schema
 */
export const LlmsTxtExtensionSchema = z.object({
  enabled: z.boolean().default(false).optional(),
  file_path: z.string().default('llms.txt').optional(),
  generate: z.boolean().default(true).optional(),
  auto_discover: z.boolean().default(false).optional(),
  format: LlmsTxtFormatSchema.optional(),
  sections: LlmsTxtSectionsSchema.optional(),
  sync: LlmsTxtSyncSchema.optional(),
  mapping: LlmsTxtMappingSchema.optional(),
  include_metadata: z.boolean().default(false).optional(),
});

export type LlmsTxtExtension = z.infer<typeof LlmsTxtExtensionSchema>;
export type LlmsTxtSection = z.infer<typeof LlmsTxtSectionSchema>;
