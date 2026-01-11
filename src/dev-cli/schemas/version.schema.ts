/**
 * Version Management Zod Schemas
 * 
 * Generated from OpenAPI spec: openapi/dev-cli.openapi.yml
 * DRY: Single source of truth for version validation
 */

import { z } from 'zod';

// ============================================================================
// Version Release
// ============================================================================

export const VersionReleaseRequestSchema = z.object({
  bumpType: z.enum(['patch', 'minor', 'major']),
  dryRun: z.boolean().default(false),
  skipValidation: z.boolean().default(false),
});

export const VersionReleaseResponseSchema = z.object({
  success: z.boolean(),
  oldVersion: z.string(),
  newVersion: z.string(),
  changes: z.array(z.string()),
  nextSteps: z.array(z.string()),
});

export type VersionReleaseRequest = z.infer<typeof VersionReleaseRequestSchema>;
export type VersionReleaseResponse = z.infer<typeof VersionReleaseResponseSchema>;

// ============================================================================
// Version Validation
// ============================================================================

export const VersionValidateResponseSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  details: z.record(z.string(), z.string()).optional(),
});

export type VersionValidateResponse = z.infer<typeof VersionValidateResponseSchema>;

// ============================================================================
// Version Audit
// ============================================================================

export const HardcodedVersionFileSchema = z.object({
  path: z.string(),
  line: z.number(),
  content: z.string(),
  suggested: z.string(),
});

export const VersionAuditResponseSchema = z.object({
  files: z.array(HardcodedVersionFileSchema),
  total: z.number(),
  fixed: z.number().optional(),
});

export type HardcodedVersionFile = z.infer<typeof HardcodedVersionFileSchema>;
export type VersionAuditResponse = z.infer<typeof VersionAuditResponseSchema>;

// ============================================================================
// Version Sync
// ============================================================================

export const VersionSyncRequestSchema = z.object({
  version: z.string().optional(),
  files: z.array(z.string()).optional(),
});

export const VersionSyncResponseSchema = z.object({
  success: z.boolean(),
  filesUpdated: z.number(),
  files: z.array(z.string()),
});

export type VersionSyncRequest = z.infer<typeof VersionSyncRequestSchema>;
export type VersionSyncResponse = z.infer<typeof VersionSyncResponseSchema>;

// ============================================================================
// Version Config (from .version.json)
// ============================================================================

export const VersionConfigSchema = z.object({
  current: z.string(),
  latest_stable: z.string(),
  spec_version: z.string(),
  spec_path: z.string(),
  schema_file: z.string(),
});

export type VersionConfig = z.infer<typeof VersionConfigSchema>;

// ============================================================================
// Version Pattern Matching
// ============================================================================

/**
 * Pattern for matching semantic versions
 */
export const SEMVER_PATTERN = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.]+))?$/;

/**
 * Pattern for matching {{VERSION}} placeholder
 */
export const VERSION_PLACEHOLDER_PATTERN = /\{\{VERSION\}\}/g;

/**
 * Pattern for matching hardcoded versions in files
 */
export const HARDCODED_VERSION_PATTERN = /(?:version|VERSION|v)\s*[:=]\s*["']?(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?)["']?/gi;
