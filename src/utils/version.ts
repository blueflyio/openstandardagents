/**
 * OSSA Version Utilities
 *
 * Provides dynamic version detection from package.json
 * NEVER hardcode version strings - use these utilities
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Cache the version info once resolved
let cachedVersionInfo: VersionInfo | null = null;

export interface VersionInfo {
  /** Full version string (e.g., "0.2.8") */
  version: string;
  /** Major version (e.g., 0) */
  major: number;
  /** Minor version (e.g., 2) */
  minor: number;
  /** Patch version (e.g., 8) */
  patch: number;
  /** Prerelease tag if any (e.g., "RC", "beta") */
  prerelease?: string;
  /** Schema directory name (e.g., "v0.2.8") */
  schemaDir: string;
  /** Schema filename (e.g., "ossa-0.2.8.schema.json") */
  schemaFile: string;
  /** Full schema path relative to project root */
  schemaPath: string;
  /** API version string for manifests */
  apiVersion: string;
}

/**
 * Find package.json by searching upward from a starting directory
 */
function findPackageJson(startDir: string): string | null {
  let current = startDir;
  for (let i = 0; i < 10; i++) {
    const candidate = path.resolve(current, 'package.json');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}

/**
 * Parse version string into components
 */
function parseVersion(version: string): Pick<VersionInfo, 'major' | 'minor' | 'patch' | 'prerelease'> {
  // Handle versions like "0.2.8", "0.2.8-RC", "0.2.8-beta.1"
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4]
  };
}

/**
 * Get OSSA version information dynamically from package.json
 *
 * @param forceRefresh - If true, bypasses cache and re-reads package.json
 * @returns VersionInfo object with all version details
 *
 * @example
 * const { version, schemaPath, apiVersion } = getVersionInfo();
 * console.log(`Using OSSA ${version}`);
 * console.log(`Schema at: ${schemaPath}`);
 */
export function getVersionInfo(forceRefresh = false): VersionInfo {
  if (cachedVersionInfo && !forceRefresh) {
    return cachedVersionInfo;
  }

  let version = '0.2.8'; // Ultimate fallback

  // Try to find package.json
  // Strategy 1: From this file's location (works in dist)
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const pkgPath = findPackageJson(__dirname);
    if (pkgPath) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      version = pkg.version;
    }
  } catch {
    // Strategy 2: From process.cwd()
    try {
      const pkgPath = findPackageJson(process.cwd());
      if (pkgPath) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        version = pkg.version;
      }
    } catch {
      // Use fallback
    }
  }

  // Strategy 3: Check environment variable override
  if (process.env.OSSA_VERSION) {
    version = process.env.OSSA_VERSION;
  }

  const parsed = parseVersion(version);
  const schemaDir = `v${version}`;
  const schemaFile = `ossa-${version}.schema.json`;

  cachedVersionInfo = {
    version,
    ...parsed,
    schemaDir,
    schemaFile,
    schemaPath: `spec/${schemaDir}/${schemaFile}`,
    apiVersion: `ossa.io/${schemaDir}`
  };

  return cachedVersionInfo;
}

/**
 * Get just the version string (convenience function)
 */
export function getVersion(): string {
  return getVersionInfo().version;
}

/**
 * Get the schema path (convenience function)
 */
export function getSchemaPath(): string {
  return getVersionInfo().schemaPath;
}

/**
 * Get the API version for manifests (convenience function)
 */
export function getApiVersion(): string {
  return getVersionInfo().apiVersion;
}

/**
 * Get the schema directory (e.g., "v0.2.8")
 */
export function getSchemaDir(): string {
  return getVersionInfo().schemaDir;
}

/**
 * Check if version is a prerelease
 */
export function isPrerelease(): boolean {
  return getVersionInfo().prerelease !== undefined;
}

/**
 * Get supported schema versions (for migration, validation)
 * Returns versions in descending order (newest first)
 */
export function getSupportedVersions(): string[] {
  const current = getVersionInfo();
  // Generate supported versions dynamically
  // Current version + 2 previous minor versions
  const versions: string[] = [current.version];

  // Add previous minor versions if they exist
  for (let i = 1; i <= 2; i++) {
    if (current.minor - i >= 0) {
      versions.push(`${current.major}.${current.minor - i}.0`);
    }
  }

  return versions;
}

/**
 * Resolve absolute path to schema file
 */
export function resolveSchemaPath(projectRoot?: string): string {
  const root = projectRoot || process.cwd();
  return path.resolve(root, getVersionInfo().schemaPath);
}
