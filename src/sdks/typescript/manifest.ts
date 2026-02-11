/**
 * TypeScript SDK - Manifest Operations
 *
 * Create, read, and validate OSSA manifests.
 *
 * SOLID: Single Responsibility - Manifest file operations
 * DRY: Delegates validation to ValidatorService
 */

import { readFileSync, writeFileSync } from 'fs';
import { parse, stringify } from 'yaml';
import type { OSSAManifest } from './types.js';
import { ValidatorService } from './validator.js';

export class ManifestService {
  private validator: ValidatorService;

  constructor() {
    this.validator = new ValidatorService();
  }

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
   *
   * Delegates to ValidatorService for comprehensive validation
   */
  validate(manifest: OSSAManifest): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    return this.validator.validate(manifest);
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
