/**
 * Release Schema
 * 
 * Zod schemas for release management
 * SOLID: Single Responsibility - Schema definitions only
 * DRY: Single source of truth for release data structures
 */

import { z } from 'zod';

// ============================================================================
// Repository State Schemas
// ============================================================================

export const RepositoryCheckSchema = z.object({
  name: z.string(),
  passed: z.boolean(),
  message: z.string(),
});

export type RepositoryCheck = z.infer<typeof RepositoryCheckSchema>;

export const RepositoryStateSchema = z.object({
  remoteUrl: z.string(),
  currentBranch: z.string(),
  isClean: z.boolean(),
  checks: z.array(RepositoryCheckSchema),
});

export type RepositoryState = z.infer<typeof RepositoryStateSchema>;

// ============================================================================
// Version State Schemas
// ============================================================================

export const VersionStateSchema = z.object({
  versionFromJson: z.string(),
  packageVersion: z.string(),
  versionTag: z.string(),
  isSynced: z.boolean(),
  checks: z.array(RepositoryCheckSchema),
});

export type VersionState = z.infer<typeof VersionStateSchema>;

// ============================================================================
// Tag State Schemas
// ============================================================================

export const TagStateSchema = z.object({
  versionTag: z.string(),
  stableTagExists: z.boolean(),
  rcTags: z.array(z.string()),
  devTags: z.array(z.string()),
  checks: z.array(RepositoryCheckSchema),
});

export type TagState = z.infer<typeof TagStateSchema>;

// ============================================================================
// CI Configuration Schemas
// ============================================================================

export const CIConfigCheckSchema = z.object({
  filePath: z.string(),
  exists: z.boolean(),
  hasFastGate: z.boolean().optional(),
  hasFullGate: z.boolean().optional(),
  checks: z.array(RepositoryCheckSchema),
});

export type CIConfigCheck = z.infer<typeof CIConfigCheckSchema>;

export const CIConfigStateSchema = z.object({
  files: z.array(CIConfigCheckSchema),
  checks: z.array(RepositoryCheckSchema),
});

export type CIConfigState = z.infer<typeof CIConfigStateSchema>;

// ============================================================================
// Release Verify Request/Response Schemas
// ============================================================================

export const ReleaseVerifyRequestSchema = z.object({
  version: z.string().optional(),
  skipBuildTests: z.boolean().default(false),
  skipCIConfig: z.boolean().default(false),
});

export type ReleaseVerifyRequest = z.infer<typeof ReleaseVerifyRequestSchema>;

export const ReleaseVerifyResponseSchema = z.object({
  ready: z.boolean(),
  version: z.string(),
  versionTag: z.string(),
  repository: RepositoryStateSchema,
  versionState: VersionStateSchema,
  tagState: TagStateSchema,
  ciConfig: CIConfigStateSchema.optional(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  nextSteps: z.array(z.string()),
});

export type ReleaseVerifyResponse = z.infer<typeof ReleaseVerifyResponseSchema>;
