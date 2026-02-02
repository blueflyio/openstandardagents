/**
 * Version Status Service
 *
 * Shows comprehensive version status and health
 * API-First: Implements /version/status from OpenAPI spec
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

export interface VersionStatusResponse {
  current: string;
  packageJson: string;
  gitTag: string;
  schemaExists: boolean;
  specPath: string;
  schemaFile: string;
  placeholderStats: {
    total: number;
    hardcoded: number;
  };
  health: 'healthy' | 'warning' | 'error';
}

export class VersionStatusService {
  private readonly ROOT = process.cwd();

  async getStatus(): Promise<VersionStatusResponse> {
    // Read .version.json
    const versionConfig = JSON.parse(
      readFileSync(join(this.ROOT, '.version.json'), 'utf-8')
    );

    // Read package.json
    const packageJson = JSON.parse(
      readFileSync(join(this.ROOT, 'package.json'), 'utf-8')
    );

    // Get latest git tag
    let gitTag = 'none';
    try {
      gitTag = execSync('git describe --tags --abbrev=0', {
        encoding: 'utf-8',
      }).trim();
    } catch (error) {
      // No tags
    }

    // Check if schema exists
    const schemaPath = join(
      this.ROOT,
      versionConfig.spec_path,
      versionConfig.schema_file
    );
    const schemaExists = existsSync(schemaPath);

    // Get placeholder stats (simplified - could be enhanced)
    const placeholderStats = {
      total: 0, // Would need to scan files
      hardcoded: 0, // Would need to scan files
    };

    // Determine health
    let health: 'healthy' | 'warning' | 'error' = 'healthy';
    if (!schemaExists) {
      health = 'error';
    } else if (versionConfig.current !== packageJson.version) {
      health = 'warning';
    }

    return {
      current: versionConfig.current,
      packageJson: packageJson.version,
      gitTag,
      schemaExists,
      specPath: versionConfig.spec_path,
      schemaFile: versionConfig.schema_file,
      placeholderStats,
      health,
    };
  }
}
