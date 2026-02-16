/**
 * Spec Generate Service
 *
 * Generates OSSA spec from source files (for CI)
 * Prevents local AI bots from breaking the spec
 * SOLID: Single Responsibility - Spec generation only
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  SpecGenerateRequest,
  SpecGenerateResponse,
} from '../schemas/spec.schema.js';

export class SpecGenerateService {
  private readonly rootDir: string;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
  }

  /**
   * Generate consolidated spec from source schema files
   * CRUD: Create operation (generates spec files)
   *
   * Collects all JSON schema files from spec/ directory and consolidates
   * them into a single generated spec with version metadata.
   */
  async generate(request: SpecGenerateRequest): Promise<SpecGenerateResponse> {
    const outputDir = join(this.rootDir, request.outputDir);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const filesGenerated: string[] = [];

    // Read package.json for version
    const packageJsonPath = join(this.rootDir, 'package.json');
    let version = '0.0.0';
    if (existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        version = pkg.version || version;
      } catch {
        // Fall back to default version
      }
    }

    // Collect schemas from spec/ directory
    const specDir = join(this.rootDir, 'spec');
    const schemas: Record<string, unknown> = {};
    const schemaErrors: string[] = [];

    if (existsSync(specDir)) {
      this.collectSchemas(specDir, schemas, schemaErrors);
    }

    // Build consolidated spec
    const consolidatedSpec = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: 'OSSA Generated Specification',
      version,
      generatedAt: new Date().toISOString(),
      generator: 'ossa-dev-cli/spec-generate',
      schemas,
    };

    const outputPath = join(outputDir, 'generated-spec.json');
    writeFileSync(outputPath, JSON.stringify(consolidatedSpec, null, 2));
    filesGenerated.push(outputPath);

    // Generate a schema index file listing all discovered schemas
    const indexPath = join(outputDir, 'schema-index.json');
    const schemaIndex = {
      version,
      generatedAt: new Date().toISOString(),
      totalSchemas: Object.keys(schemas).length,
      schemas: Object.keys(schemas).map((name) => ({
        name,
        path: `spec/${name}`,
      })),
    };
    writeFileSync(indexPath, JSON.stringify(schemaIndex, null, 2));
    filesGenerated.push(indexPath);

    let validation;
    if (request.validate) {
      const errors: string[] = [...schemaErrors];

      // Validate consolidated spec structure
      if (Object.keys(schemas).length === 0) {
        errors.push('No schemas found in spec/ directory');
      }

      if (!version || version === '0.0.0') {
        errors.push('Could not determine version from package.json');
      }

      validation = {
        valid: errors.length === 0,
        errors,
      };
    }

    return {
      success: true,
      outputPath,
      filesGenerated,
      validation,
    };
  }

  /**
   * Recursively collect JSON schema files from a directory
   */
  private collectSchemas(
    dirPath: string,
    schemas: Record<string, unknown>,
    errors: string[]
  ): void {
    const { readdirSync, statSync } = require('fs') as typeof import('fs');

    let entries: string[];
    try {
      entries = readdirSync(dirPath);
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          this.collectSchemas(fullPath, schemas, errors);
        } else if (entry.endsWith('.schema.json')) {
          const content = readFileSync(fullPath, 'utf-8');
          try {
            const parsed = JSON.parse(content);
            // Use relative path from rootDir as the schema key
            const relativePath = fullPath
              .replace(this.rootDir + '/', '')
              .replace('.schema.json', '');
            schemas[relativePath] = parsed;
          } catch {
            errors.push(`Invalid JSON in schema file: ${fullPath}`);
          }
        }
      } catch {
        // Skip files that cannot be read
      }
    }
  }
}
