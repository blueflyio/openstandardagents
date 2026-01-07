/**
 * TypeScript SDK Client
 *
 * SOLID: Single Responsibility - SDK client interface
 * OpenAPI: Client generated from OpenAPI spec
 * CRUD: Full CRUD operations
 */

import { ManifestService } from './manifest.js';
import { ValidatorService } from './validator.js';
import type { OSSAManifest } from './types.js';

export interface SDKClientOptions {
  apiUrl?: string;
  apiKey?: string;
  strict?: boolean;
}

export class OSSASDKClient {
  private manifestService: ManifestService;
  private validatorService: ValidatorService;
  private options: SDKClientOptions;

  constructor(options: SDKClientOptions = {}) {
    this.options = {
      strict: false,
      ...options,
    };
    this.manifestService = new ManifestService();
    this.validatorService = new ValidatorService();
  }

  /**
   * Load manifest from file
   * CRUD: Read
   */
  loadManifest(filePath: string): OSSAManifest {
    return this.manifestService.load(filePath);
  }

  /**
   * Validate manifest
   * CRUD: Read (validation)
   */
  validateManifest(manifest: OSSAManifest): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    return this.manifestService.validate(manifest, this.options.strict);
  }

  /**
   * Save manifest to file
   * CRUD: Create/Update
   */
  saveManifest(manifest: OSSAManifest, filePath: string, format: 'yaml' | 'json' = 'yaml'): void {
    this.manifestService.save(manifest, filePath, format);
  }

  /**
   * Export manifest
   * CRUD: Read
   */
  exportManifest(manifest: OSSAManifest, format: 'yaml' | 'json' | 'typescript'): string {
    return this.manifestService.export(manifest, format);
  }
}
