/**
 * TypeScript SDK - Manifest Operations
 *
 * SOLID: Single Responsibility - Manifest CRUD operations
 * CRUD: Create, Read, Update, Delete manifests
 * DRY: Uses shared loader and validator
 * Zod: Runtime validation
 */

import { writeFileSync } from 'fs';
import { stringify } from 'yaml';
import { z } from 'zod';
import { ManifestLoader } from '../shared/manifest-loader.js';
import { SchemaValidator } from '../shared/schema-validator.js';
import type {
  AgentManifest,
  TaskManifest,
  WorkflowManifest,
  OSSAManifest,
} from './types.js';
import {
  AgentManifestSchema,
  TaskManifestSchema,
  WorkflowManifestSchema,
} from './types.js';

export class ManifestService {
  private loader: ManifestLoader;
  private validator: SchemaValidator;

  constructor() {
    this.loader = new ManifestLoader();
    this.validator = new SchemaValidator();
  }

  /**
   * Load manifest from file
   * CRUD: Read
   */
  load(filePath: string): OSSAManifest {
    const content = this.loader.load(filePath, z.unknown(), { validate: false });

    // Determine schema based on kind
    const schema =
      content.kind === 'Agent'
        ? AgentManifestSchema
        : content.kind === 'Task'
        ? TaskManifestSchema
        : WorkflowManifestSchema;

    return schema.parse(content);
  }

  /**
   * Validate manifest
   * CRUD: Read (validation)
   */
  validate(manifest: OSSAManifest, strict = false): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const schema =
      manifest.kind === 'Agent'
        ? AgentManifestSchema
        : manifest.kind === 'Task'
        ? TaskManifestSchema
        : WorkflowManifestSchema;

    const result = this.validator.validateZod(manifest, schema, strict);

    return {
      valid: result.valid,
      errors: result.errors || [],
      warnings: [],
    };
  }

  /**
   * Save manifest to file
   * CRUD: Create/Update
   */
  save(manifest: OSSAManifest, filePath: string, format: 'yaml' | 'json' = 'yaml'): void {
    // Validate before saving
    const validation = this.validate(manifest, true);
    if (!validation.valid) {
      throw new Error(`Invalid manifest: ${validation.errors.join(', ')}`);
    }

    const content =
      format === 'yaml' ? stringify(manifest) : JSON.stringify(manifest, null, 2);

    writeFileSync(filePath, content, 'utf-8');
  }

  /**
   * Export manifest to different format
   * CRUD: Read
   */
  export(manifest: OSSAManifest, format: 'yaml' | 'json' | 'typescript'): string {
    switch (format) {
      case 'yaml':
        return stringify(manifest);
      case 'json':
        return JSON.stringify(manifest, null, 2);
      case 'typescript':
        return this.exportToTypeScript(manifest);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private exportToTypeScript(manifest: OSSAManifest): string {
    return `export const manifest: ${manifest.kind}Manifest = ${JSON.stringify(manifest, null, 2)} as const;`;
  }
}
