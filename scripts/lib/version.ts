/**
 * Version Management Utilities
 * 
 * DRY: Single source of truth for version operations
 * Type-safe: Uses Zod for validation
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import {
  PackageJsonSchema,
  VersionSchema,
  type PackageJson,
  type Version,
} from '../schemas/package.schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..');

/**
 * Get current version from package.json with Zod validation
 */
export function getCurrentVersion(): Version {
  const packageJsonPath = join(ROOT, 'package.json');
  const content = readFileSync(packageJsonPath, 'utf8');
  
  try {
    const json = JSON.parse(content);
    const pkg = PackageJsonSchema.parse(json);
    return VersionSchema.parse(pkg.version);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid package.json version: ${error.errors.map((e) => e.message).join(', ')}`
      );
    }
    throw error;
  }
}

/**
 * Get package.json with validation
 */
export function getPackageJson(): PackageJson {
  const packageJsonPath = join(ROOT, 'package.json');
  const content = readFileSync(packageJsonPath, 'utf8');
  
  try {
    const json = JSON.parse(content);
    return PackageJsonSchema.parse(json);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid package.json: ${error.errors.map((e) => e.message).join(', ')}`
      );
    }
    throw error;
  }
}

/**
 * Build schema path from version
 */
export function getSchemaPath(version: Version): string {
  return `spec/v${version}/ossa-${version}.schema.json`;
}

/**
 * Build output path for generated types
 */
export function getTypesOutputPath(version: Version): string {
  return `src/types/generated/ossa-${version}.types.ts`;
}

/**
 * Build output path for generated Zod schemas
 */
export function getZodOutputPath(version: Version): string {
  return `src/types/generated/ossa-${version}.zod.ts`;
}
