/**
 * Spec Schema
 *
 * Zod schemas for spec generation and validation
 * SOLID: Single Responsibility - Schema definitions only
 */

import { z } from 'zod';

export const SpecGenerateRequestSchema = z.object({
  outputDir: z.string().default('spec/generated'),
  validate: z.boolean().default(true),
});

export type SpecGenerateRequest = z.infer<typeof SpecGenerateRequestSchema>;

export const SpecGenerateResponseSchema = z.object({
  success: z.boolean(),
  outputPath: z.string(),
  filesGenerated: z.array(z.string()),
  validation: z
    .object({
      valid: z.boolean(),
      errors: z.array(z.string()),
    })
    .optional(),
});

export type SpecGenerateResponse = z.infer<typeof SpecGenerateResponseSchema>;

export const SpecValidateRequestSchema = z.object({
  specPath: z.string(),
  strict: z.boolean().default(false),
});

export type SpecValidateRequest = z.infer<typeof SpecValidateRequestSchema>;

export const SpecValidateResponseSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
});

export type SpecValidateResponse = z.infer<typeof SpecValidateResponseSchema>;
