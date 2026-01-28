/**
 * OpenAPI Generator - Sync versions in OpenAPI specs
 *
 * Updates:
 * - info.version in all openapi/*.yaml files
 * - Schema URLs to use correct domain
 *
 * Domain Configuration:
 * - OSSA_DOMAIN env var (default: openstandardagents.org)
 * - Local dev: ossa.orb.local
 */

import { injectable } from 'inversify';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import type {
  Generator,
  GenerateResult,
  DriftReport,
} from '../codegen.service.js';
import { getVersion, getApiVersion } from '../../../utils/version.js';

// Domain configuration
const OSSA_DOMAIN = process.env.OSSA_DOMAIN || 'openstandardagents.org';
const OSSA_LOCAL_DOMAIN = 'ossa.orb.local';

@injectable()
export class OpenAPIGenerator implements Generator {
  name = 'openapi';

  private readonly patterns = ['openapi/**/*.yaml', 'openapi/**/*.yml'];
  private readonly excludePatterns = ['node_modules/**', 'dist/**'];

  /**
   * Generate: Update versions in OpenAPI specs
   */
  async generate(dryRun: boolean): Promise<GenerateResult> {
    const result: GenerateResult = {
      generator: this.name,
      filesUpdated: 0,
      filesCreated: 0,
      errors: [],
    };

    const files = await this.listTargetFiles();
    const version = getVersion();
    const apiVersion = getApiVersion();

    for (const file of files) {
      try {
        const updated = await this.updateOpenAPISpec(
          file,
          version,
          apiVersion,
          dryRun
        );
        if (updated) {
          result.filesUpdated++;
        }
      } catch (error) {
        result.errors.push(
          `${file}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return result;
  }

  /**
   * List target files
   */
  async listTargetFiles(): Promise<string[]> {
    const allFiles: string[] = [];

    for (const pattern of this.patterns) {
      const files = await glob(pattern, {
        ignore: this.excludePatterns,
        cwd: process.cwd(),
        absolute: true,
      });
      allFiles.push(...files);
    }

    return [...new Set(allFiles)].sort();
  }

  /**
   * Check for version drift
   */
  async checkDrift(
    version: string,
    apiVersion: string
  ): Promise<DriftReport['filesWithOldVersion']> {
    const drift: DriftReport['filesWithOldVersion'] = [];
    const files = await this.listTargetFiles();

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const oldVersions = this.findOldVersions(content, version);

        if (oldVersions.length > 0) {
          drift.push({
            path: path.relative(process.cwd(), file),
            foundVersion: oldVersions[0],
          });
        }
      } catch {
        // Skip
      }
    }

    return drift;
  }

  /**
   * Update a single OpenAPI spec
   */
  private async updateOpenAPISpec(
    filePath: string,
    version: string,
    apiVersion: string,
    dryRun: boolean
  ): Promise<boolean> {
    const content = fs.readFileSync(filePath, 'utf8');
    let updated = content;

    // Update info.version
    updated = updated.replace(
      /(info:\s*\n(?:[^\n]*\n)*?\s*version:\s*)(['"]?)[\d.]+(-[\w.]+)?(['"]?)/m,
      `$1$2${version}$4`
    );

    // Update ossa/vX.X.X patterns
    updated = updated.replace(/ossa\/v\d+\.\d+\.\d+/g, apiVersion);

    // Update schema URLs - use configured domain
    const domain = this.getDomain();
    updated = updated.replace(
      /https?:\/\/[a-z.-]+\/schemas\/v[\d.]+/g,
      `https://${domain}/schemas/v${version}`
    );

    if (updated === content) {
      return false;
    }

    if (!dryRun) {
      fs.writeFileSync(filePath, updated, 'utf8');
    }

    return true;
  }

  /**
   * Get configured domain
   */
  private getDomain(): string {
    // Allow override via environment
    if (process.env.OSSA_LOCAL === 'true') {
      return OSSA_LOCAL_DOMAIN;
    }
    return OSSA_DOMAIN;
  }

  /**
   * Find old OSSA version patterns (not API versions)
   *
   * Note: OpenAPI specs have their own info.version (e.g., 1.2.0)
   * which is the API version, NOT the OSSA schema version.
   * We only check for ossa/vX.X.X patterns.
   */
  private findOldVersions(content: string, currentVersion: string): string[] {
    const versions: string[] = [];
    const apiVersion = `ossa/v${currentVersion}`;

    // Only find ossa/vX.X.X patterns (OSSA schema version)
    const ossaVersionMatches = content.matchAll(/ossa\/v(\d+\.\d+\.\d+)/g);
    for (const match of ossaVersionMatches) {
      const foundVersion = `ossa/v${match[1]}`;
      if (foundVersion !== apiVersion) {
        versions.push(foundVersion);
      }
    }

    // Find schema URL versions
    const schemaUrlMatches = content.matchAll(/schemas\/v(\d+\.\d+\.\d+)/g);
    for (const match of schemaUrlMatches) {
      if (match[1] !== currentVersion) {
        versions.push(`schemas/v${match[1]}`);
      }
    }

    return [...new Set(versions)];
  }
}
