/**
 * Schema Repository
 * Loads and caches OSSA JSON schemas
 */

import * as fs from 'fs';
import { injectable } from 'inversify';
import * as path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import type { ISchemaRepository, SchemaVersion } from '../types/index';

@injectable()
export class SchemaRepository implements ISchemaRepository {
  private schemaCache: Map<string, Record<string, unknown>> = new Map();

  /**
   * Get schema for specific version
   * @param version - Schema version (e.g., '0.2.3', '0.2.2', '0.1.9')
   * @returns JSON Schema object
   */
  async getSchema(version: SchemaVersion): Promise<Record<string, unknown>> {
    // Check cache first
    if (this.schemaCache.has(version)) {
      return this.schemaCache.get(version)!;
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
   * Get schema file path for version
   * @param version - Schema version
   * @returns Absolute path to schema file
   */
  private getSchemaPath(version: SchemaVersion): string {
    // Map versions to schema files
    const schemaMap: Record<SchemaVersion, string> = {
      '0.2.3': 'spec/v0.2.3/ossa-0.2.3.schema.json',
      '0.2.2': 'spec/v0.2.2/ossa-0.2.2.schema.json',
      '0.1.9': 'spec/versions/v0.1.9/ossa-v0.1.9.schema.json',
    };

    const relativePath = schemaMap[version];
    if (!relativePath) {
      throw new Error(`Unsupported schema version: ${version}`);
    }

    // Resolve from OSSA package root (not cwd)
    // Try multiple strategies to find OSSA root
    const ossaRoot = this.findOssaRoot();
    return path.resolve(ossaRoot, relativePath);
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
