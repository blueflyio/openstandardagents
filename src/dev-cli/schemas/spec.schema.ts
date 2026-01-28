/**
 * Spec Generation Zod Schemas
 *
 * Generated from OpenAPI spec: openapi/dev-cli.openapi.yml
 * DRY: Single source of truth for spec validation
 */

import { z } from 'zod';

// ============================================================================
// Spec Generation
// ============================================================================

export const SpecGenerateRequestSchema = z.object({
  outputDir: z.string().default('spec/'),
  validate: z.boolean().default(true),
});

export const SpecValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
});

export const SpecGenerateResponseSchema = z.object({
  success: z.boolean(),
  outputPath: z.string(),
  filesGenerated: z.array(z.string()),
  validation: SpecValidationResultSchema.optional(),
});

export type SpecGenerateRequest = z.infer<typeof SpecGenerateRequestSchema>;
export type SpecGenerateResponse = z.infer<typeof SpecGenerateResponseSchema>;
export type SpecValidationResult = z.infer<typeof SpecValidationResultSchema>;

// ============================================================================
// Spec Validation
// ============================================================================

export const SpecValidateRequestSchema = z.object({
  specPath: z.string(),
});

export const SpecValidateResponseSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
});

export type SpecValidateRequest = z.infer<typeof SpecValidateRequestSchema>;
export type SpecValidateResponse = z.infer<typeof SpecValidateResponseSchema>;
