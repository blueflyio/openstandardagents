/**
 * OSSA Version Utilities
 *
 * Provides dynamic version detection from package.json
 *
 * IMPORTANT: Package version vs OSSA Spec version
 * - Package version (from package.json): The CLI tool version (can be 0.4.0, 0.5.0, etc.)
 * - OSSA Spec version (OSSA_SPEC_VERSION): The agent manifest format version (0.3.6)
 * These evolve independently - CLI can update without changing the spec.
 *
 * NOTE: This module is designed to work with both ESM and CommonJS (Jest).
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Current OSSA specification version
 * This is the version used in manifest apiVersion fields
 * Independent from package.json version (CLI tool version)
 */
const OSSA_SPEC_VERSION = '0.3.6';

// Cache the version info once resolved
let cachedVersionInfo: VersionInfo | null = null;

export interface VersionInfo {
  /** Full version string (e.g., "0.3.0") - dynamically derived */
  version: string;
  /** Major version */
  major: number;
  /** Minor version */
  minor: number;
  /** Patch version */
  patch: number;
  /** Prerelease tag if any (e.g., "RC", "beta") */
  prerelease?: string;
  /** Schema directory name (e.g., "v0.3.0") */
  schemaDir: string;
  /** Schema filename (e.g., "ossa-0.3.0.schema.json") */
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
 * Find .version.json by searching upward from a starting directory
 */
function findVersionJson(startDir: string): string | null {
  let current = startDir;
  for (let i = 0; i < 10; i++) {
    const candidate = path.resolve(current, '.version.json');
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
function parseVersion(
  version: string
): Pick<VersionInfo, 'major' | 'minor' | 'patch' | 'prerelease'> {
  // Handle versions like "0.2.8", "0.2.8-RC", "0.2.8-beta.1"
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (!match) {
    throw new Error(
      `Invalid version format: ${version}. Version must be read from package.json.`
    );
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4],
  };
}

/**
 * Read version from package.json - the ONLY source of truth
 *
 * Strategy order:
 * 1. OSSA_VERSION environment variable (for CI/CD overrides)
 * 2. Jest environment check
 * 3. ESM import.meta.url check (Production)
 * 4. Fallback to .version.json
 *
 * THROWS if no version can be determined - we NEVER use fallback hardcoded versions.
 */
function readVersionFromPackageJson(): string {
  // Strategy 1: Environment variable override (for CI/CD)
  if (process.env.OSSA_VERSION) {
    return process.env.OSSA_VERSION;
  }

  let pkgPath: string | null = null;

  // Check if running in a Jest test environment
  if (process.env.JEST_WORKER_ID || typeof __dirname !== 'undefined') {
    // Strategy for Jest/CJS: Find package.json from the project root
    pkgPath = findPackageJson(process.cwd());
  } else {
    // Strategy for ESM (runtime): Use import.meta.url to find package.json
    try {
      // Use eval to prevent bundlers from seeing import.meta.url in environments that don't support it
      const metaUrl = eval('import.meta.url');
      const modulePath = fileURLToPath(metaUrl);
      // Search upward from the module path (handles both local and npm install -g)
      pkgPath = findPackageJson(path.dirname(modulePath));
    } catch (e) {
      // Fallback: Search from CWD (for development/testing)
      pkgPath = findPackageJson(process.cwd());
    }
  }

  // Read from package.json if found
  if (pkgPath) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (pkg.version && pkg.name === '@bluefly/openstandardagents') {
        return pkg.version;
      }
    } catch {
      // Fallthrough
    }
  }

  // Fallback Strategy: Read from .version.json (bundled with the package)
  try {
    let searchDir: string;
    if (process.env.JEST_WORKER_ID || typeof __dirname !== 'undefined') {
      searchDir = process.cwd();
    } else {
      try {
        const metaUrl = eval('import.meta.url');
        const modulePath = fileURLToPath(metaUrl);
        searchDir = path.dirname(modulePath);
      } catch {
        searchDir = process.cwd();
      }
    }

    const versionJsonPath = findVersionJson(searchDir);
    if (versionJsonPath) {
      const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
      if (versionData.current) {
        return versionData.current;
      }
    }
  } catch {
    // Fallthrough
  }

  // NO FALLBACK - fail loudly
  throw new Error(
    'OSSA_VERSION_ERROR: Could not determine version dynamically. ' +
      'Ensure package.json or .version.json exists with a valid version, or set OSSA_VERSION env var.'
  );
}

/**
 * Get OSSA version information dynamically from package.json
 *
 * @param forceRefresh - If true, bypasses cache and re-reads package.json
 * @returns VersionInfo object with all version details
 * @throws Error if version cannot be determined dynamically
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

  const version = readVersionFromPackageJson();
  const parsed = parseVersion(version);
  const specParsed = parseVersion(OSSA_SPEC_VERSION);

  // USE MAJOR.MINOR for stability (ignore patch version for schema/api)
  // 0.3.6 -> v0.3
  const schemaDir = `v${specParsed.major}.${specParsed.minor}`;
  const schemaFile = `ossa-${schemaDir}.schema.json`;

  cachedVersionInfo = {
    version,
    ...parsed,
    schemaDir,
    schemaFile,
    schemaPath: `spec/${schemaDir}/${schemaFile}`,
    apiVersion: `ossa/v${OSSA_SPEC_VERSION}`,
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
 * Get the schema directory (e.g., "v0.3.0")
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

/**
 * Clear the cached version info (useful for testing)
 */
export function clearVersionCache(): void {
  cachedVersionInfo = null;
}
