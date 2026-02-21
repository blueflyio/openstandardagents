/**
 * Shared Manifest Scanner Utility
 *
 * Lightweight fast-glob scanner for discovering OSSA manifest files.
 * Used by both MCP server (ossa_list) and CLI (manifest-discovery).
 *
 * Single Responsibility: scan filesystem for manifests and return results.
 * No CLI dependencies (chalk, commander), no DI container required.
 */

import fg from 'fast-glob';
import yaml from 'js-yaml';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ============================================================================
// Types
// ============================================================================

export interface ManifestScanOptions {
  /** Scan subdirectories recursively (default: true) */
  recursive?: boolean;
  /** Include .agents/{name}/manifest.ossa.yaml patterns (default: true) */
  includeAgentsDirs?: boolean;
  /** Return absolute paths (default: true) */
  absolute?: boolean;
}

export interface ManifestScanResult {
  /** File path (absolute or relative depending on options) */
  path: string;
  /** Agent name parsed from metadata, or directory/file fallback */
  name?: string;
  /** Version string from metadata */
  version?: string;
  /** Kind field (e.g. Agent, Task, Workflow) */
  kind?: string;
  /** apiVersion field (e.g. ossa/v0.4) */
  apiVersion?: string;
  /** Description from metadata */
  description?: string;
  /** Parse error message if YAML failed to load */
  error?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Base glob patterns for OSSA manifest files */
const RECURSIVE_PATTERNS = ['**/*.ossa.yaml', '**/*.ossa.yml'];
const NON_RECURSIVE_PATTERNS = ['*.ossa.yaml', '*.ossa.yml'];

/** Pattern for .agents/ directory convention */
const AGENTS_DIR_RECURSIVE = '**/.agents/*/manifest.ossa.yaml';
const AGENTS_DIR_NON_RECURSIVE = '.agents/*/manifest.ossa.yaml';

/** Directories to ignore during scanning */
const DEFAULT_IGNORE = [
  '**/node_modules/**',
  '**/dist/**',
  '**/.git/**',
];

// ============================================================================
// Main Scan Function
// ============================================================================

/**
 * Scan a directory for OSSA manifest files using fast-glob.
 *
 * Returns lightweight results with optional metadata parsed from YAML.
 * Reusable by MCP server, CLI, and any other consumer.
 */
export async function scanManifests(
  directory: string,
  options?: ManifestScanOptions,
): Promise<ManifestScanResult[]> {
  const {
    recursive = true,
    includeAgentsDirs = true,
    absolute = true,
  } = options ?? {};

  const basePatterns = recursive ? RECURSIVE_PATTERNS : NON_RECURSIVE_PATTERNS;
  const patterns = [...basePatterns];

  if (includeAgentsDirs) {
    patterns.push(recursive ? AGENTS_DIR_RECURSIVE : AGENTS_DIR_NON_RECURSIVE);
  }

  const files = await fg(patterns, {
    cwd: directory,
    absolute,
    ignore: DEFAULT_IGNORE,
  });

  const results: ManifestScanResult[] = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(file, 'utf8');
      const doc = yaml.load(raw) as Record<string, unknown>;
      const meta = doc.metadata as Record<string, unknown> | undefined;

      results.push({
        path: file,
        name: (meta?.name as string) || path.basename(path.dirname(file)),
        version: (meta?.version as string) || 'unknown',
        kind: (doc.kind as string) || 'Agent',
        apiVersion: (doc.apiVersion as string) || 'unknown',
        description: (meta?.description as string) || '',
      });
    } catch {
      results.push({
        path: file,
        name: path.basename(file),
        error: 'Failed to parse',
      });
    }
  }

  return results;
}
