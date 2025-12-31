/**
 * Zod Schemas for Data Validation
 *
 * All data fetched from external sources is validated against these schemas.
 * This ensures type safety and runtime validation.
 */

import { z } from 'zod';

// =============================================================================
// EXAMPLE SCHEMAS
// =============================================================================

export const ExampleCategorySchema = z.enum([
  'Getting Started',
  'Framework Integration',
  'Agent Types',
  'Production',
  'Infrastructure',
  'Advanced Patterns',
  'Integration Patterns',
  'OpenAPI Extensions',
  'Migration Guides',
  'Showcase',
  'Spec Examples',
]);

export const ExampleSchema = z.object({
  name: z.string().min(1),
  path: z.string().min(1),
  content: z.string(),
  category: ExampleCategorySchema,
});

export const ExamplesArraySchema = z.array(ExampleSchema);

export type Example = z.infer<typeof ExampleSchema>;
export type ExampleCategory = z.infer<typeof ExampleCategorySchema>;

// =============================================================================
// VERSION SCHEMAS
// =============================================================================

export const VersionTypeSchema = z.enum(['stable', 'dev', 'rc']);

export const VersionInfoSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+(-[\w.]+)?$/),
  tag: z.string().startsWith('v'),
  apiVersion: z.string().startsWith('ossa/'),
  type: VersionTypeSchema,
  published: z.boolean(),
  available: z.boolean(),
});

export const GitHubTagsSchema = z.object({
  latestStable: z.string().nullable(),
  latestDev: z.string().nullable(),
  total: z.number().int().nonnegative(),
});

export const VersionsSchema = z.object({
  stable: z.string(),
  stableTag: z.string(),
  latest: z.string(),
  dev: z.string(),
  devTag: z.string(),
  all: z.array(VersionInfoSchema),
  githubTags: GitHubTagsSchema,
  fallbackVersion: z.string(),
});

export type VersionType = z.infer<typeof VersionTypeSchema>;
export type VersionInfo = z.infer<typeof VersionInfoSchema>;
export type Versions = z.infer<typeof VersionsSchema>;

// =============================================================================
// GITLAB API SCHEMAS
// =============================================================================

export const GitLabTreeItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['blob', 'tree']),
  path: z.string(),
  mode: z.string(),
});

export const GitLabTagSchema = z.object({
  name: z.string(),
  message: z.string().nullable().optional(),
  target: z.string().optional(),
});

export type GitLabTreeItem = z.infer<typeof GitLabTreeItemSchema>;
export type GitLabTag = z.infer<typeof GitLabTagSchema>;

// =============================================================================
// NPM API SCHEMAS
// =============================================================================

export const NpmPackageSchema = z.object({
  name: z.string(),
  'dist-tags': z.record(z.string()).optional(),
  versions: z.record(z.unknown()).optional(),
});

export type NpmPackage = z.infer<typeof NpmPackageSchema>;

// =============================================================================
// RELEASE HIGHLIGHTS SCHEMAS
// =============================================================================

export const HighlightBulletSchema = z.object({
  title: z.string(),
  color: z.string(),
  bullets: z.array(z.string()),
});

export const ReleaseHighlightsSchema = z.object({
  version: z.string(),
  releaseDate: z.string(),
  overview: z.string(),
  features: z.array(z.unknown()).optional(),
  categories: z.array(z.unknown()).optional(),
  homepage: z.array(HighlightBulletSchema),
});

export type ReleaseHighlights = z.infer<typeof ReleaseHighlightsSchema>;
