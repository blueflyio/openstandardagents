/**
 * Schema Repository
 * Loads and caches OSSA JSON schemas
 */

import * as fs from 'fs';
import * as path from 'path';
import { injectable } from 'inversify';
import type { ISchemaRepository, SchemaVersion } from '../types/index';

@injectable()
export class SchemaRepository implements ISchemaRepository {
  private schemaCache: Map<string, Record<string, unknown>> = new Map();

  /**
   * Get schema for specific version
   * @param version - Schema version (e.g., '1.0', '0.1.9')
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
      '1.0': 'spec/v1.0/ossa-1.0.schema.json',
      '0.2.2': 'spec/v0.2.2/ossa-0.2.2.schema.json',
      '0.1.9': 'spec/versions/v0.1.9/ossa-v0.1.9.schema.json',
    };

    const relativePath = schemaMap[version];
    if (!relativePath) {
      throw new Error(`Unsupported schema version: ${version}`);
    }

    // Resolve from project root
    return path.resolve(process.cwd(), relativePath);
  }

  /**
   * Clear schema cache (useful for testing)
   */
  clearCache(): void {
    this.schemaCache.clear();
  }
}
