/**
 * Shared Manifest Loading Utilities
 *
 * Provides consistent patterns for finding and loading OSSA manifests.
 * Eliminates code duplication across CLI commands.
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles manifest discovery and loading
 * - Open/Closed: New file patterns can be added without modifying existing code
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import chalk from 'chalk';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import type { OssaAgent } from '../../types/index.js';

// ============================================================================
// Types
// ============================================================================

export interface ManifestLoadResult<T = OssaAgent> {
  path: string;
  manifest: T;
}

export interface ManifestLoadError {
  path: string;
  error: string;
}

export interface LoadManifestsResult<T = OssaAgent> {
  loaded: ManifestLoadResult<T>[];
  errors: ManifestLoadError[];
}

export interface FindFilesOptions {
  /** Extensions to search for (default: ['.ossa.yaml', '.ossa.yml']) */
  extensions?: string[];
  /** Directories to exclude (default: ['node_modules', 'dist']) */
  excludeDirs?: string[];
  /** Whether to search recursively (default: true) */
  recursive?: boolean;
}

// ============================================================================
// File Discovery
// ============================================================================

const DEFAULT_EXTENSIONS = ['.ossa.yaml', '.ossa.yml'];
const DEFAULT_EXCLUDE_DIRS = ['node_modules', 'dist', '.git'];

/**
 * Find all OSSA manifest files in a directory
 */
export function findManifestFiles(
  directory: string,
  options: FindFilesOptions = {}
): string[] {
  const extensions = options.extensions || DEFAULT_EXTENSIONS;
  const excludeDirs = options.excludeDirs || DEFAULT_EXCLUDE_DIRS;
  const recursive = options.recursive !== false;

  const files: string[] = [];

  const findFiles = (dir: string): void => {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (recursive && !excludeDirs.includes(entry.name)) {
            findFiles(fullPath);
          }
        } else if (entry.isFile()) {
          if (extensions.some((ext) => entry.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      }
    } catch {
      // Directory not readable, skip
    }
  };

  findFiles(directory);
  return files;
}

/**
 * Find manifest files from paths (can be files or directories)
 */
export function findManifestFilesFromPaths(
  paths: string[],
  options: FindFilesOptions = {}
): string[] {
  if (paths.length === 0) {
    return findManifestFiles(process.cwd(), options);
  }

  const files: string[] = [];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      if (fs.statSync(p).isDirectory()) {
        files.push(...findManifestFiles(p, options));
      } else {
        files.push(p);
      }
    }
  }
  return files;
}

/**
 * Find manifest files using glob pattern
 */
export async function findManifestsByGlob(pattern: string): Promise<string[]> {
  return glob(pattern, { absolute: true });
}

// ============================================================================
// Manifest Loading
// ============================================================================

/**
 * Load a single manifest file
 */
export async function loadManifest<T = OssaAgent>(
  filePath: string
): Promise<T> {
  const manifestRepo = container.get(ManifestRepository);
  return (await manifestRepo.load(filePath)) as T;
}

/**
 * Load multiple manifests from file paths
 * Returns both loaded manifests and any errors encountered
 */
export async function loadManifests<T = OssaAgent>(
  filePaths: string[],
  options: { silent?: boolean; verbose?: boolean } = {}
): Promise<LoadManifestsResult<T>> {
  const manifestRepo = container.get(ManifestRepository);
  const loaded: ManifestLoadResult<T>[] = [];
  const errors: ManifestLoadError[] = [];

  for (const filePath of filePaths) {
    try {
      const manifest = (await manifestRepo.load(filePath)) as T;
      loaded.push({ path: filePath, manifest });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      errors.push({ path: filePath, error: errorMessage });

      if (!options.silent) {
        if (options.verbose) {
          console.log(
            chalk.yellow(
              `[WARN]  Skipping ${path.basename(filePath)}: ${errorMessage}`
            )
          );
        }
      }
    }
  }

  return { loaded, errors };
}

/**
 * Load all manifests matching a glob pattern
 */
export async function loadManifestsByGlob<T = OssaAgent>(
  pattern: string,
  options: { silent?: boolean; verbose?: boolean } = {}
): Promise<LoadManifestsResult<T>> {
  const files = await findManifestsByGlob(pattern);
  return loadManifests<T>(files, options);
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Handle command errors consistently
 */
export function handleCommandError(
  error: unknown,
  options: { verbose?: boolean } = {}
): never {
  const message = error instanceof Error ? error.message : String(error);
  console.error(chalk.red(`\n[FAIL] Error: ${message}\n`));

  if (options.verbose && error instanceof Error && error.stack) {
    console.error(chalk.gray(error.stack));
  }

  process.exit(1);
}

/**
 * Print "no manifests found" message and exit
 */
export function exitNoManifestsFound(context?: string): never {
  const message = context
    ? `No agent manifests found ${context}`
    : 'No agent manifests found';
  console.log(chalk.yellow(`[WARN]  ${message}`));
  process.exit(1);
}

/**
 * Print pattern info and file count
 */
export function printPatternInfo(pattern: string, fileCount: number): void {
  console.log(chalk.gray(`Pattern: ${pattern}`));
  console.log(chalk.gray(`Found ${fileCount} manifests\n`));
}
