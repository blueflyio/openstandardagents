/**
 * Release Preparation Schema
 * 
 * Comprehensive validation schemas for v0.3.3 release
 * Validates GitLab, GitHub, and npmjs readiness
 * 
 * SOLID: Single Responsibility - Release preparation validation only
 * DRY: Single source of truth for release validation
 */

import { z } from 'zod';

// ============================================================================
// Platform Validation Schemas
// ============================================================================

export const GitLabValidationSchema = z.object({
  ready: z.boolean(),
  remoteUrl: z.string(),
  branch: z.string(),
  tagExists: z.boolean(),
  tagCanBeCreated: z.boolean(),
  releaseCanBeCreated: z.boolean(),
  protectedTagRules: z.object({
    pattern: z.string(),
    allowed: z.boolean(),
  }),
  ciTokenConfigured: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
});

export type GitLabValidation = z.infer<typeof GitLabValidationSchema>;

export const GitHubValidationSchema = z.object({
  ready: z.boolean(),
  remoteConfigured: z.boolean(),
  mirrorEnabled: z.boolean(),
  tokenConfigured: z.boolean(),
  releaseCanBeCreated: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
});

export type GitHubValidation = z.infer<typeof GitHubValidationSchema>;

export const NPMValidationSchema = z.object({
  ready: z.boolean(),
  versionExists: z.boolean(),
  canPublish: z.boolean(),
  tokenConfigured: z.boolean(),
  registryAccessible: z.boolean(),
  packageName: z.string(),
  currentPublishedVersion: z.string().optional(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
});

export type NPMValidation = z.infer<typeof NPMValidationSchema>;

// ============================================================================
// Release Preparation Request/Response
// ============================================================================

export const ReleasePrepRequestSchema = z.object({
  version: z.string(),
  dryRun: z.boolean().default(false),
  skipGitHub: z.boolean().default(false),
  skipNPM: z.boolean().default(false),
});

export type ReleasePrepRequest = z.infer<typeof ReleasePrepRequestSchema>;

export const ReleasePrepResponseSchema = z.object({
  ready: z.boolean(),
  version: z.string(),
  versionTag: z.string(),
  gitlab: GitLabValidationSchema,
  github: GitHubValidationSchema.optional(),
  npm: NPMValidationSchema.optional(),
  allErrors: z.array(z.string()),
  allWarnings: z.array(z.string()),
  checklist: z.array(z.object({
    category: z.string(),
    item: z.string(),
    status: z.enum(['pass', 'fail', 'warning', 'skip']),
    message: z.string(),
  })),
  nextSteps: z.array(z.string()),
  rollbackPlan: z.array(z.string()),
});

export type ReleasePrepResponse = z.infer<typeof ReleasePrepResponseSchema>;
