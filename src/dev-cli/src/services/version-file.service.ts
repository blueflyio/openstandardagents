/**
 * Version File Service
 * 
 * SOLID: Single Responsibility - .version.json file management only
 * DRY: Centralizes .version.json operations
 * 
 * Separated from VersionDetectionService to follow Single Responsibility Principle.
 */

import { VersionConfigSchema, type VersionConfig } from '../schemas/version.schema.js';
import { FileService } from './file.service.js';

export class VersionFileService {
  private readonly fileService: FileService;
  private readonly versionFilePath = '.version.json';

  constructor(fileService: FileService) {
    this.fileService = fileService;
  }

  /**
   * Read .version.json file
   */
  read(): VersionConfig {
    if (!this.fileService.exists(this.versionFilePath)) {
      return this.getDefaultConfig();
    }

    try {
      return this.fileService.readJson(this.versionFilePath, VersionConfigSchema);
    } catch {
      return this.getDefaultConfig();
    }
  }

  /**
   * Write .version.json file
   */
  write(config: VersionConfig): void {
    this.fileService.writeJson(this.versionFilePath, config, true);
  }

  /**
   * Update version fields in .version.json
   */
  updateVersion(version: string): void {
    const config = this.read();
    const specVersion = version;
    const specPath = `spec/v${specVersion}`;
    const schemaFile = `ossa-${specVersion}.schema.json`;

    this.write({
      ...config,
      current: version,
      spec_version: specVersion,
      spec_path: specPath,
      schema_file: schemaFile,
    });
  }

  /**
   * Get default config
   */
  private getDefaultConfig(): VersionConfig {
    return {
      current: '0.0.0',
      latest_stable: '0.0.0',
      spec_version: '0.0.0',
      spec_path: 'spec/v0.0.0',
      schema_file: 'ossa-0.0.0.schema.json',
    };
  }
}
