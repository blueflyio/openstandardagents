/**
 * Schema Repository
 * Loads and caches OSSA JSON schemas
 */

import * as fs from 'fs';
import { injectable } from 'inversify';
import * as path from 'path';
import type { ISchemaRepository, SchemaVersion } from '../types/index';

@injectable()
export class SchemaRepository implements ISchemaRepository {
  private schemaCache: Map<string, Record<string, unknown>> = new Map();
  private _availableVersions: string[] | null = null;

  /**
   * Get available schema versions (cached after first discovery)
   */
  getAvailableVersions(): string[] {
    if (this._availableVersions === null) {
      const ossaRoot = this.findOssaRoot();
      const specDir = path.join(ossaRoot, 'spec');
      this._availableVersions = this.discoverAvailableVersions(specDir);
    }
    return this._availableVersions;
  }

  /**
   * Get the latest/current version from package.json or spec directory
   */
  getCurrentVersion(): string {
    // Try to get from package.json first
    const ossaRoot = this.findOssaRoot();
    const packageJsonPath = path.join(ossaRoot, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        if (pkg.version) {
          return pkg.version;
        }
      } catch {
        // Fall through to spec directory discovery
      }
    }

    // Fallback: get latest version from spec directory
    const versions = this.getAvailableVersions();
    if (versions.length > 0) {
      // Return the highest version (last in sorted array)
      return versions[versions.length - 1];
    }

    // Ultimate fallback
    return '0.2.3';
  }

  /**
   * Get schema for specific version
   * @param version - Schema version (e.g., '0.2.3', '0.2.2', '0.1.9')
   * @returns JSON Schema object
   */
  async getSchema(version: SchemaVersion): Promise<Record<string, unknown>> {
    // Check cache first
    const cached = this.schemaCache.get(version);
    if (cached) {
      return cached;
    }

    // Determine schema file path
    const schemaPath = this.getSchemaPath(version);

    // Load schema from filesystem
    if (!fs.existsSync(schemaPath)) {
      throw new Error(
        `Schema not found for version ${version} at ${schemaPath}`
      );
    }

    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    const schema = JSON.parse(schemaContent);

    // Cache for future use
    this.schemaCache.set(version, schema);

    return schema;
  }

  /**
   * Get schema file path for version (dynamically discovers from spec directory)
   * @param version - Schema version
   * @returns Absolute path to schema file
   */
  private getSchemaPath(version: SchemaVersion): string {
    const ossaRoot = this.findOssaRoot();
    const specDir = path.join(ossaRoot, 'spec');

    // Try multiple naming patterns for schema files
    const possiblePaths = [
      // Pattern 1: spec/v0.2.5-RC/ossa-0.2.5-RC.schema.json (for versions with suffixes)
      `spec/v${version}/ossa-${version}.schema.json`,
      // Pattern 2: spec/v0.2.3/ossa-0.2.3.schema.json (standard pattern)
      `spec/v${version}/ossa-${version}.schema.json`,
      // Pattern 3: spec/v0.1.9/ossa-v0.1.9.schema.json (legacy with 'v' prefix in filename)
      `spec/v${version}/ossa-v${version}.schema.json`,
    ];

    // Try each pattern
    for (const relativePath of possiblePaths) {
      const fullPath = path.resolve(ossaRoot, relativePath);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }

    // If not found, try to discover available versions
    const availableVersions = this.discoverAvailableVersions(specDir);
    throw new Error(
      `Schema not found for version ${version}. ` +
        `Available versions: ${availableVersions.join(', ')}`
    );
  }

  /**
   * Dynamically discover available schema versions from spec directory
   * @param specDir - Path to spec directory
   * @returns Array of available version strings
   */
  private discoverAvailableVersions(specDir: string): string[] {
    if (!fs.existsSync(specDir)) {
      return [];
    }

    const versions: string[] = [];
    const entries = fs.readdirSync(specDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('v')) {
        // Extract version from directory name (e.g., "v0.2.5-RC" -> "0.2.5-RC")
        const version = entry.name.substring(1);

        // Check if schema file exists for this version
        const schemaPatterns = [
          path.join(specDir, entry.name, `ossa-${version}.schema.json`),
          path.join(specDir, entry.name, `ossa-v${version}.schema.json`),
        ];

        for (const schemaPath of schemaPatterns) {
          if (fs.existsSync(schemaPath)) {
            versions.push(version);
            break;
          }
        }
      }
    }

    return versions.sort();
  }

  /**
   * Find OSSA package root directory
   * Looks for package.json with @bluefly/openstandardagents
   */
  private findOssaRoot(): string {
    // Strategy 1: Check if OSSA_ROOT env var is set
    if (process.env.OSSA_ROOT && fs.existsSync(process.env.OSSA_ROOT)) {
      const schemaTest = path.join(
        process.env.OSSA_ROOT,
        'spec/v0.2.3/ossa-0.2.3.schema.json'
      );
      if (fs.existsSync(schemaTest)) {
        return process.env.OSSA_ROOT;
      }
    }

    // Strategy 2: Check common locations relative to cwd
    // Check dist/spec first (for published npm package)
    const distSpecPath = path.join(
      process.cwd(),
      'dist/spec/v0.2.3/ossa-0.2.3.schema.json'
    );
    if (fs.existsSync(distSpecPath)) {
      return path.join(process.cwd(), 'dist');
    }

    // Check project root spec (for development)
    const sourceSpecPath = path.join(
      process.cwd(),
      'spec/v0.2.3/ossa-0.2.3.schema.json'
    );
    if (fs.existsSync(sourceSpecPath)) {
      return process.cwd();
    }

    // Strategy 3: Search upward from cwd for package.json with OSSA name
    let current = process.cwd();
    let depth = 0;
    const maxDepth = 15; // Increased to search further up

    while (depth < maxDepth) {
      const packageJsonPath = path.join(current, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(
            fs.readFileSync(packageJsonPath, 'utf-8')
          );
          if (packageJson.name === '@bluefly/openstandardagents') {
            // Check both dist/spec and project root spec
            const distSpec = path.join(
              current,
              'dist/spec/v0.2.3/ossa-0.2.3.schema.json'
            );
            const sourceSpec = path.join(
              current,
              'spec/v0.2.3/ossa-0.2.3.schema.json'
            );
            if (fs.existsSync(sourceSpec)) {
              return current;
            }
            if (fs.existsSync(distSpec)) {
              return path.join(current, 'dist');
            }
          }
        } catch {
          // Continue searching
        }
      }

      const parent = path.dirname(current);
      if (parent === current) {
        break; // Reached filesystem root
      }
      current = parent;
      depth++;
    }

    // Strategy 4: Last resort - try absolute path to OSSA project
    const commonPaths = [
      '/Users/flux423/Sites/LLM/OSSA',
      path.resolve(process.cwd(), '../OSSA'),
      path.resolve(process.cwd(), '../../OSSA'),
    ];
    for (const ossaPath of commonPaths) {
      const absoluteSpec = path.join(
        ossaPath,
        'spec/v0.2.3/ossa-0.2.3.schema.json'
      );
      if (fs.existsSync(absoluteSpec)) {
        return ossaPath;
      }
    }

    // Strategy 5: Fallback - throw error with helpful message
    throw new Error(
      `Cannot find OSSA schema file. Searched from:\n` +
        `  - cwd: ${process.cwd()}\n` +
        `  - common paths: ${commonPaths.join(', ')}\n` +
        `Set OSSA_ROOT environment variable to the OSSA project root directory.`
    );
  }

  /**
   * Clear schema cache (useful for testing)
   */
  clearCache(): void {
    this.schemaCache.clear();
  }
}
