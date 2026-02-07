/**
 * Version Check Service
 *
 * Quick version consistency check
 * API-First: Implements /version/check from OpenAPI spec
 */

import { readFileSync } from 'fs';
import { join } from 'path';

export interface VersionCheckResponse {
  status: 'OK' | 'WARN' | 'ERROR';
  consistent: boolean;
  issues: string[];
  message: string;
}

export class VersionCheckService {
  private readonly ROOT = process.cwd();

  async check(): Promise<VersionCheckResponse> {
    const issues: string[] = [];

    try {
      // Read .version.json
      const versionConfig = JSON.parse(
        readFileSync(join(this.ROOT, '.version.json'), 'utf-8')
      );

      // Read package.json
      const packageJson = JSON.parse(
        readFileSync(join(this.ROOT, 'package.json'), 'utf-8')
      );

      // Check consistency
      if (versionConfig.current !== packageJson.version) {
        issues.push(
          `.version.json (${versionConfig.current}) ≠ package.json (${packageJson.version})`
        );
      }

      // Check schema file format
      const expectedSchemaFile = `ossa-${versionConfig.current}.schema.json`;
      if (
        versionConfig.schema_file !== expectedSchemaFile &&
        versionConfig.schema_file !==
          `ossa-v${versionConfig.spec_version}.schema.json`
      ) {
        issues.push(
          `Schema file name inconsistent: ${versionConfig.schema_file}`
        );
      }

      // Determine status
      let status: 'OK' | 'WARN' | 'ERROR' = 'OK';
      if (issues.length > 0) {
        status = 'ERROR';
      }

      return {
        status,
        consistent: issues.length === 0,
        issues,
        message:
          issues.length === 0
            ? 'All version references are consistent'
            : `Found ${issues.length} consistency issue(s)`,
      };
    } catch (error) {
      return {
        status: 'ERROR',
        consistent: false,
        issues: [
          `Failed to read version files: ${error instanceof Error ? error.message : String(error)}`,
        ],
        message: 'Error reading version files',
      };
    }
  }
}
