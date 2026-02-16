/**
 * Shared Zod Schemas for Build Scripts
 *
 * Follows OpenAPI-first, DRY, and type-safe principles.
 * Single source of truth for package.json and version validation.
 */

import { z } from 'zod';

/**
 * Semantic version pattern (supports RC, alpha, beta, etc.)
 * Matches: 0.2.5, 0.2.5-RC, 0.2.5-alpha.1, 1.0.0-beta.2, etc.
 */
const SemverPattern = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;

/**
 * Package.json schema (partial - only fields we use)
 */
export const PackageJsonSchema = z
  .object({
    name: z.string().min(1),
    version: z.string().regex(SemverPattern, {
      message: 'Invalid semver version format. Expected: X.Y.Z or X.Y.Z-SUFFIX',
    }),
    exports: z
      .object({
        './schema': z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

/**
 * Version string schema
 */
export const VersionSchema = z.string().regex(SemverPattern, {
  message: 'Invalid version format',
});

/**
 * File path schema
 */
export const FilePathSchema = z.string().min(1);

/**
 * Script configuration schema
 */
export const ScriptConfigSchema = z.object({
  version: VersionSchema,
  schemaPath: FilePathSchema,
  outputPath: z.string().optional(),
  rootDir: FilePathSchema,
});

// Type exports
export type PackageJson = z.infer<typeof PackageJsonSchema>;
export type Version = z.infer<typeof VersionSchema>;
export type ScriptConfig = z.infer<typeof ScriptConfigSchema>;

/**
 * Parse and validate package.json
 */
export function parsePackageJson(content: string): PackageJson {
  try {
    const json = JSON.parse(content);
    return PackageJsonSchema.parse(json);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid package.json: ${error.issues.map((e: z.ZodIssue) => e.message).join(', ')}`
      );
    }
    throw error;
  }
}
