#!/usr/bin/env node
/**
 * Version utilities for scripts
 * 
 * Follows DRY, Zod validation, OpenAPI-first principles.
 * Single source of truth: package.json version field
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');

const SemverPattern = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;

const VersionJsonSchema = z.object({
  current: z.string().regex(SemverPattern, 'Invalid semver version'),
}).passthrough();

const PackageJsonSchema = z.object({
  version: z.string(),
}).passthrough();

/**
 * Get current version from .version.json (source of truth) with package.json fallback
 *
 * Priority:
 * 1. .version.json (always has real version)
 * 2. package.json (may have 0.3.0 placeholder in CI)
 */
export function getCurrentVersion(): string {
  // Try .version.json first (source of truth)
  const versionJsonPath = path.join(ROOT, '.version.json');
  try {
    const versionRaw = fs.readFileSync(versionJsonPath, 'utf8');
    const versionConfig = VersionJsonSchema.parse(JSON.parse(versionRaw));
    return versionConfig.current;
  } catch {
    // Fallback to package.json
  }

  // Fallback: package.json
  const packageJsonPath = path.join(ROOT, 'package.json');
  try {
    const pkgRaw = fs.readFileSync(packageJsonPath, 'utf8');
    const pkg = PackageJsonSchema.parse(JSON.parse(pkgRaw));

    // Check for CI placeholder
    if (pkg.version === '0.3.0') {
      throw new Error('package.json has 0.3.0 placeholder. Create .version.json with "current" field.');
    }

    if (!SemverPattern.test(pkg.version)) {
      throw new Error(`Invalid version in package.json: ${pkg.version}`);
    }

    return pkg.version;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Get schema path for a version
 * @param version - Version string (e.g., "0.2.9")
 * @returns Relative path (e.g., "spec/v0.2.9/ossa-0.2.9.schema.json")
 */
export function getSchemaPath(version: string): string {
  return `spec/v${version}/ossa-${version}.schema.json`;
}

/**
 * Get TypeScript types output path for a version
 * @param version - Version string (e.g., "0.2.9")
 * @returns Relative path (e.g., "src/types/generated/ossa-0.2.9.types.ts")
 */
export function getTypesOutputPath(version: string): string {
  return `src/types/generated/ossa-${version}.types.ts`;
}

/**
 * Get Zod schemas output path for a version
 * @param version - Version string (e.g., "0.2.9")
 * @returns Relative path (e.g., "src/types/generated/ossa-0.2.9.zod.ts")
 */
export function getZodOutputPath(version: string): string {
  return `src/types/generated/ossa-${version}.zod.ts`;
}
