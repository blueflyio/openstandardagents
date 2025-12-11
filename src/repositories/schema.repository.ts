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
   * Check if version is a template placeholder (e.g., {{VERSION}})
   */
  private isTemplateVersion(version: string): boolean {
    return /^\{\{[A-Z_]+\}\}$/.test(version);
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
        if (pkg.version && !this.isTemplateVersion(pkg.version)) {
          return pkg.version;
        }
        // If version is a template placeholder, fall through to spec directory discovery
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

    // Ultimate fallback - should never reach here
    throw new Error('Unable to determine current schema version');
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

    // Try multiple naming patterns for schema files in both dist/spec and spec directories
    const possiblePaths = [
      // Try dist/spec first (for built/published package)
      `dist/spec/v${version}/ossa-${version}.schema.json`,
      `dist/spec/v${version}/ossa-v${version}.schema.json`,
      // Then try source spec (for development)
      `spec/v${version}/ossa-${version}.schema.json`,
      `spec/v${version}/ossa-v${version}.schema.json`,
    ];

    // Try each pattern
    for (const relativePath of possiblePaths) {
      const fullPath = path.resolve(ossaRoot, relativePath);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }

    // If not found, try to discover available versions from both directories
    const distSpecDir = path.join(ossaRoot, 'dist/spec');
    const sourceSpecDir = path.join(ossaRoot, 'spec');
    const availableVersions = [
      ...this.discoverAvailableVersions(distSpecDir),
      ...this.discoverAvailableVersions(sourceSpecDir),
    ];
    const uniqueVersions = [...new Set(availableVersions)].sort();
    
    throw new Error(
      `Schema not found for version ${version}. ` +
        `Available versions: ${uniqueVersions.join(', ')}`
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
   * Check if a directory contains an OSSA spec directory
   * Uses dynamic discovery - no hardcoded version numbers
   */
  private hasSpecDirectory(dir: string): boolean {
    const specDir = path.join(dir, 'spec');
    if (!fs.existsSync(specDir)) {
      return false;
    }
    // Check if spec directory has any version subdirectories
    try {
      const entries = fs.readdirSync(specDir, { withFileTypes: true });
      return entries.some(e => e.isDirectory() && e.name.startsWith('v'));
    } catch {
      return false;
    }
  }

  /**
   * Find OSSA package root directory
   * Looks for package.json with @bluefly/openstandardagents or spec/ directory
   */
  private findOssaRoot(): string {
    // Strategy 1: Check if OSSA_ROOT env var is set
    if (process.env.OSSA_ROOT && fs.existsSync(process.env.OSSA_ROOT)) {
      if (this.hasSpecDirectory(process.env.OSSA_ROOT)) {
        return process.env.OSSA_ROOT;
      }
    }

    // Strategy 2: Check cwd (for development) - look for spec/ dir
    if (this.hasSpecDirectory(process.cwd())) {
      return process.cwd();
    }

    // Strategy 3: Check dist/spec in cwd (for published npm package)
    const distSpecDir = path.join(process.cwd(), 'dist/spec');
    if (fs.existsSync(distSpecDir)) {
      try {
        const entries = fs.readdirSync(distSpecDir, { withFileTypes: true });
        if (entries.some(e => e.isDirectory() && e.name.startsWith('v'))) {
          return process.cwd();
        }
      } catch {
        // Continue searching
      }
    }

    // Strategy 4: Search upward from cwd for package.json with OSSA name
    let current = process.cwd();
    let depth = 0;
    const maxDepth = 15;

    while (depth < maxDepth) {
      const packageJsonPath = path.join(current, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(
            fs.readFileSync(packageJsonPath, 'utf-8')
          );
          if (packageJson.name === '@bluefly/openstandardagents') {
            // Found OSSA package - check for spec directory
            if (this.hasSpecDirectory(current)) {
              return current;
            }
            // Check dist/spec as fallback
            const distSpecPath = path.join(current, 'dist/spec');
            if (fs.existsSync(distSpecPath)) {
              return current;
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

    // Strategy 5: Last resort - try common project paths
    const commonPaths = [
      '/Users/flux423/Sites/LLM/OSSA',
      path.resolve(process.cwd(), '../OSSA'),
      path.resolve(process.cwd(), '../../OSSA'),
    ];
    for (const ossaPath of commonPaths) {
      if (this.hasSpecDirectory(ossaPath)) {
        return ossaPath;
      }
    }

    // Strategy 6: Fallback - throw error with helpful message
    throw new Error(
      `Cannot find OSSA spec directory. Searched from:\n` +
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
