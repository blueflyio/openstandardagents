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

const PackageJsonSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/, 'Invalid semver version'),
}).passthrough();

/**
 * Get current version from package.json with Zod validation
 */
export function getCurrentVersion(): string {
  const packageJsonPath = path.join(ROOT, 'package.json');
  try {
    const pkgRaw = fs.readFileSync(packageJsonPath, 'utf8');
    const pkg = PackageJsonSchema.parse(JSON.parse(pkgRaw));
    return pkg.version;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`package.json validation failed: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw new Error(`Failed to read package.json: ${error instanceof Error ? error.message : String(error)}`);
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
