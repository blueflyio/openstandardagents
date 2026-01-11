/**
 * Version Schema
 * 
 * Zod schemas for version management
 * SOLID: Single Responsibility - Schema definitions only
 */

import { z } from 'zod';

export const VersionConfigSchema = z.object({
  current: z.string(),
  latest_stable: z.string(),
  spec_version: z.string(),
  spec_path: z.string(),
  schema_file: z.string(),
});

export type VersionConfig = z.infer<typeof VersionConfigSchema>;

export const VERSION_PLACEHOLDER_PATTERN = /\{\{VERSION\}\}/g;

export const VersionValidateResponseSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  details: z.record(z.string(), z.string()).optional(),
});

export type VersionValidateResponse = z.infer<typeof VersionValidateResponseSchema>;

export const VersionSyncRequestSchema = z.object({
  version: z.string().optional(),
  files: z.array(z.string()).optional(),
});

export type VersionSyncRequest = z.infer<typeof VersionSyncRequestSchema>;

export const VersionSyncResponseSchema = z.object({
  success: z.boolean(),
  filesUpdated: z.number(),
  files: z.array(z.string()),
});

export type VersionSyncResponse = z.infer<typeof VersionSyncResponseSchema>;

export const VersionReleaseRequestSchema = z.object({
  bumpType: z.enum(['major', 'minor', 'patch']),
  dryRun: z.boolean().default(false),
  skipValidation: z.boolean().default(false),
});

export type VersionReleaseRequest = z.infer<typeof VersionReleaseRequestSchema>;

export const VersionReleaseResponseSchema = z.object({
  success: z.boolean(),
  oldVersion: z.string(),
  newVersion: z.string(),
  changes: z.array(z.string()),
  nextSteps: z.array(z.string()),
});

export type VersionReleaseResponse = z.infer<typeof VersionReleaseResponseSchema>;
