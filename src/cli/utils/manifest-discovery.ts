/**
 * Manifest Discovery Utility
 * Discovers OSSA manifest files in directories
 *
 * Features:
 * - Recursive directory scanning
 * - Glob pattern support
 * - Automatic version detection
 * - Exclusion of common non-source directories
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles manifest discovery
 * - Open/Closed: Extensible via options without modifying core logic
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import chalk from 'chalk';
import * as yaml from 'yaml';

// ============================================================================
// Types
// ============================================================================

export interface DiscoveredManifest {
  /** Absolute path to the manifest file */
  path: string;
  /** Relative path from the scan directory */
  relativePath: string;
  /** Filename without path */
  name: string;
  /** Detected OSSA version (e.g., 'v0.3.5', 'v1.0', 'unknown') */
  version?: string;
  /** Size of the file in bytes */
  size: number;
  /** Last modified timestamp */
  modified: Date;
}

export interface DiscoveryOptions {
  /** Search recursively in subdirectories (default: true) */
  recursive?: boolean;
  /** Custom glob patterns (default: ['**\/*.ossa.yaml', '**\/*.ossa.yml']) */
  patterns?: string[];
  /** Directories to exclude (default: ['node_modules', 'dist', '.git']) */
  excludeDirs?: string[];
  /** Show verbose output (default: false) */
  verbose?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_PATTERNS = ['**/*.ossa.yaml', '**/*.ossa.yml'];
const DEFAULT_EXCLUDE_DIRS = [
  'node_modules',
  'dist',
  '.git',
  '.gitlab',
  '.github',
  'coverage',
  'build',
  'out',
  'target',
  'vendor',
  '.next',
  '.nuxt',
];

// ============================================================================
// Main Discovery Function
// ============================================================================

/**
 * Discover all OSSA manifests in a directory
 */
export async function discoverManifests(
  directory: string,
  options: DiscoveryOptions = {}
): Promise<DiscoveredManifest[]> {
  const {
    recursive = true,
    patterns = DEFAULT_PATTERNS,
    excludeDirs = DEFAULT_EXCLUDE_DIRS,
    verbose = false,
  } = options;

  // Resolve directory to absolute path
  const absoluteDir = path.resolve(directory);

  // Verify directory exists
  if (!fs.existsSync(absoluteDir)) {
    throw new Error(`Directory not found: ${absoluteDir}`);
  }

  if (!fs.statSync(absoluteDir).isDirectory()) {
    throw new Error(`Not a directory: ${absoluteDir}`);
  }

  if (verbose) {
    console.log(chalk.gray(`Scanning directory: ${absoluteDir}`));
  }

  // Build glob patterns with exclusions
  const globPatterns = patterns.map((p) => {
    if (recursive) {
      return p;
    }
    // Non-recursive: only match files in root directory
    return p.replace('**/', '');
  });

  // Find all matching files
  const files: string[] = [];
  for (const pattern of globPatterns) {
    const matches = await glob(pattern, {
      cwd: absoluteDir,
      absolute: true,
      ignore: excludeDirs.map((dir) => `**/${dir}/**`),
      nodir: true,
    });
    files.push(...matches);
  }

  // Remove duplicates
  const uniqueFiles = Array.from(new Set(files));

  if (verbose) {
    console.log(chalk.gray(`Found ${uniqueFiles.length} manifest files`));
  }

  // Build discovered manifest objects
  const discovered: DiscoveredManifest[] = [];
  for (const filePath of uniqueFiles) {
    try {
      const stats = fs.statSync(filePath);
      const relativePath = path.relative(absoluteDir, filePath);
      const version = await detectVersion(filePath);

      discovered.push({
        path: filePath,
        relativePath,
        name: path.basename(filePath),
        version,
        size: stats.size,
        modified: stats.mtime,
      });
    } catch (error) {
      if (verbose) {
        console.log(
          chalk.yellow(
            `Warning: Could not process ${filePath}: ${error instanceof Error ? error.message : String(error)}`
          )
        );
      }
    }
  }

  // Sort by relative path for consistent ordering
  discovered.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  return discovered;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Detect OSSA version from manifest file
 */
async function detectVersion(filePath: string): Promise<string | undefined> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Try to parse as YAML
    const manifest = yaml.parse(content);

    // Check for apiVersion field (k8s-style)
    if (manifest.apiVersion && typeof manifest.apiVersion === 'string') {
      // Extract version from apiVersion (e.g., 'ossa/v0.3.5' -> 'v0.3.5')
      const match = manifest.apiVersion.match(/ossa\/v?([\d.]+)/);
      if (match) {
        return `v${match[1]}`;
      }
    }

    // Check for legacy ossaVersion field
    if (manifest.ossaVersion) {
      return `v${manifest.ossaVersion}`;
    }

    // Try to detect from filename
    const filenameMatch = path.basename(filePath).match(/\.v?([\d.]+)\.ossa\./);
    if (filenameMatch) {
      return `v${filenameMatch[1]}`;
    }

    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Discover manifests from multiple directories
 */
export async function discoverManifestsFromDirs(
  directories: string[],
  options: DiscoveryOptions = {}
): Promise<DiscoveredManifest[]> {
  const allManifests: DiscoveredManifest[] = [];

  for (const dir of directories) {
    const discovered = await discoverManifests(dir, options);
    allManifests.push(...discovered);
  }

  // Remove duplicates by path
  const uniqueManifests = Array.from(
    new Map(allManifests.map((m) => [m.path, m])).values()
  );

  return uniqueManifests;
}

/**
 * Filter manifests by version
 */
export function filterByVersion(
  manifests: DiscoveredManifest[],
  version: string
): DiscoveredManifest[] {
  const normalizedVersion = version.startsWith('v') ? version : `v${version}`;
  return manifests.filter((m) => m.version === normalizedVersion);
}

/**
 * Filter manifests by pattern (regex or glob)
 */
export function filterByPattern(
  manifests: DiscoveredManifest[],
  pattern: string
): DiscoveredManifest[] {
  try {
    const regex = new RegExp(pattern);
    return manifests.filter(
      (m) => regex.test(m.name) || regex.test(m.relativePath)
    );
  } catch {
    // If not a valid regex, treat as simple string match
    return manifests.filter(
      (m) => m.name.includes(pattern) || m.relativePath.includes(pattern)
    );
  }
}

/**
 * Group manifests by directory
 */
export function groupByDirectory(
  manifests: DiscoveredManifest[]
): Map<string, DiscoveredManifest[]> {
  const groups = new Map<string, DiscoveredManifest[]>();

  for (const manifest of manifests) {
    const dir = path.dirname(manifest.path);
    const existing = groups.get(dir) || [];
    existing.push(manifest);
    groups.set(dir, existing);
  }

  return groups;
}

/**
 * Group manifests by version
 */
export function groupByVersion(
  manifests: DiscoveredManifest[]
): Map<string, DiscoveredManifest[]> {
  const groups = new Map<string, DiscoveredManifest[]>();

  for (const manifest of manifests) {
    const version = manifest.version || 'unknown';
    const existing = groups.get(version) || [];
    existing.push(manifest);
    groups.set(version, existing);
  }

  return groups;
}
