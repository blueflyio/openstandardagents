/**
 * TypeScript SDK - Manifest Operations
 *
 * SOLID: Single Responsibility - Manifest CRUD operations
 * CRUD: Create, Read, Update, Delete manifests
 * DRY: Uses shared loader and validator
 */

import { readFileSync, writeFileSync } from 'fs';
import { parse, stringify } from 'yaml';
import type { OSSAManifest } from './types.js';

export class ManifestService {
  /**
   * Load manifest from file
   * CRUD: Read
   */
  load(filePath: string): OSSAManifest {
    const content = readFileSync(filePath, 'utf-8');
    const parsed = filePath.endsWith('.json')
      ? JSON.parse(content)
      : parse(content);

    return parsed as OSSAManifest;
  }

  /**
   * Validate manifest structure
   * CRUD: Read (validation)
   */
  validate(manifest: OSSAManifest): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!manifest.apiVersion) errors.push('Missing apiVersion');
    if (!manifest.kind) errors.push('Missing kind');
    if (!manifest.metadata) errors.push('Missing metadata');
    if (!manifest.spec) errors.push('Missing spec');

    // Kind validation
    if (
      manifest.kind &&
      !['Agent', 'Task', 'Workflow'].includes(manifest.kind)
    ) {
      errors.push(`Invalid kind: ${manifest.kind}`);
    }

    // Metadata validation
    if (manifest.metadata && !manifest.metadata.name) {
      errors.push('Missing metadata.name');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Save manifest to file
   * CRUD: Create/Update
   */
  save(
    manifest: OSSAManifest,
    filePath: string,
    format: 'yaml' | 'json' = 'yaml'
  ): void {
    // Validate before saving
    const validation = this.validate(manifest);
    if (!validation.valid) {
      throw new Error(`Invalid manifest: ${validation.errors.join(', ')}`);
    }

    const content =
      format === 'yaml'
        ? stringify(manifest)
        : JSON.stringify(manifest, null, 2);

    writeFileSync(filePath, content, 'utf-8');
  }

  /**
   * Export manifest to different format
   * CRUD: Read
   */
  export(
    manifest: OSSAManifest,
    format: 'yaml' | 'json' | 'typescript'
  ): string {
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
