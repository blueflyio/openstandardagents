/**
 * OSSA Version Utilities
 *
 * Provides dynamic version detection from package.json
 *
 * CRITICAL: NO HARDCODED VERSION STRINGS ANYWHERE
 * All versions MUST be derived from package.json or environment variables.
 *
 * NOTE: This module is designed to work with both ESM and CommonJS (Jest).
 */

import * as fs from 'fs';
import * as path from 'path';

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
 * 2. package.json from process.cwd()
 * 3. package.json from __dirname (CommonJS)
 *
 * THROWS if no version can be determined - we NEVER use fallback hardcoded versions.
 */
function readVersionFromPackageJson(): string {
  // Strategy 1: Environment variable override (for CI/CD)
  if (process.env.OSSA_VERSION) {
    return process.env.OSSA_VERSION;
  }

  // Strategy 2: From process.cwd() - most common case
  try {
    const pkgPath = findPackageJson(process.cwd());
    if (pkgPath) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (pkg.version && pkg.version !== '{{VERSION}}') {
        return pkg.version;
      }
      // If version is {{VERSION}} placeholder, continue to next strategy
    }
  } catch {
    // Continue to next strategy
  }

  // Strategy 3: From __dirname (CommonJS/Jest)
  if (typeof __dirname !== 'undefined') {
    try {
      const pkgPath = findPackageJson(__dirname);
      if (pkgPath) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        if (pkg.version && pkg.version !== '{{VERSION}}') {
          return pkg.version;
        }
      }
    } catch {
      // Continue to next strategy
    }
  }

  // Strategy 4: Check for spec directories to infer version
  // Look for existing schema directories and use the latest
  try {
    const specDir = path.resolve(process.cwd(), 'spec');
    if (fs.existsSync(specDir)) {
      const versions = fs
        .readdirSync(specDir)
        .filter(
          (d) =>
            d.startsWith('v') &&
            fs.statSync(path.join(specDir, d)).isDirectory()
        )
        .map((d) => d.substring(1)) // Remove 'v' prefix
        .filter((v) => /^\d+\.\d+\.\d+/.test(v))
        .sort((a, b) => {
          const [aMajor, aMinor, aPatch] = a.split('.').map(Number);
          const [bMajor, bMinor, bPatch] = b.split('.').map(Number);
          return bMajor - aMajor || bMinor - aMinor || bPatch - aPatch;
        });

      if (versions.length > 0) {
        return versions[0];
      }
    }
  } catch {
    // Continue
  }

  // NO FALLBACK - fail loudly
  throw new Error(
    'OSSA_VERSION_ERROR: Could not determine version dynamically. ' +
      'Ensure package.json exists with a valid version, or set OSSA_VERSION env var. ' +
      'NEVER hardcode version strings.'
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
  const schemaDir = `v${version}`;
  const schemaFile = `ossa-${version}.schema.json`;

  cachedVersionInfo = {
    version,
    ...parsed,
    schemaDir,
    schemaFile,
    schemaPath: `spec/${schemaDir}/${schemaFile}`,
    apiVersion: `ossa/${schemaDir}`,
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
