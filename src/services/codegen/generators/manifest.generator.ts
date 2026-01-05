/**
 * Manifest Generator - Update apiVersion in all OSSA manifests
 *
 * Fixes 161+ .ossa.yaml files with hardcoded versions.
 * Uses single source of truth: package.json version
 */

import { injectable } from 'inversify';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import * as yaml from 'yaml';
import type { Generator, GenerateResult, DriftReport } from '../codegen.service.js';
import { getApiVersion } from '../../../utils/version.js';

@injectable()
export class ManifestGenerator implements Generator {
  name = 'manifests';

  private readonly patterns = [
    '**/*.ossa.yaml',
    '**/*.ossa.yml',
    '**/*.ossa.json',
  ];

  private readonly excludePatterns = [
    'node_modules/**',
    'dist/**',
    '.git/**',
    '**/*.template.*',
  ];

  /**
   * Generate: Update apiVersion in all manifests
   */
  async generate(dryRun: boolean): Promise<GenerateResult> {
    const result: GenerateResult = {
      generator: this.name,
      filesUpdated: 0,
      filesCreated: 0,
      errors: [],
    };

    const files = await this.listTargetFiles();
    const targetApiVersion = getApiVersion();

    for (const file of files) {
      try {
        const updated = await this.updateManifest(file, targetApiVersion, dryRun);
        if (updated) {
          result.filesUpdated++;
        }
      } catch (error) {
        result.errors.push(`${file}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return result;
  }

  /**
   * List all manifest files
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
   * Check for version drift in manifests
   */
  async checkDrift(version: string, apiVersion: string): Promise<DriftReport['filesWithOldVersion']> {
    const drift: DriftReport['filesWithOldVersion'] = [];
    const files = await this.listTargetFiles();

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const foundVersion = this.extractApiVersion(content, file);

        if (foundVersion && foundVersion !== apiVersion) {
          drift.push({
            path: path.relative(process.cwd(), file),
            foundVersion,
          });
        }
      } catch {
        // Skip files that can't be read
      }
    }

    return drift;
  }

  /**
   * Update a single manifest file
   */
  private async updateManifest(
    filePath: string,
    targetApiVersion: string,
    dryRun: boolean
  ): Promise<boolean> {
    const content = fs.readFileSync(filePath, 'utf8');
    const ext = path.extname(filePath).toLowerCase();

    let updated: string;
    let changed = false;

    if (ext === '.json') {
      const result = this.updateJsonManifest(content, targetApiVersion);
      updated = result.content;
      changed = result.changed;
    } else {
      const result = this.updateYamlManifest(content, targetApiVersion);
      updated = result.content;
      changed = result.changed;
    }

    if (changed && !dryRun) {
      fs.writeFileSync(filePath, updated, 'utf8');
    }

    return changed;
  }

  /**
   * Update YAML manifest apiVersion
   */
  private updateYamlManifest(
    content: string,
    targetApiVersion: string
  ): { content: string; changed: boolean } {
    // Use regex to preserve formatting and comments
    const apiVersionRegex = /^(apiVersion:\s*)ossa\/v[\d.]+(-\w+)?/m;
    const match = content.match(apiVersionRegex);

    if (!match) {
      return { content, changed: false };
    }

    const currentVersion = match[0];
    const targetValue = `apiVersion: ${targetApiVersion}`;

    if (currentVersion === targetValue) {
      return { content, changed: false };
    }

    const updated = content.replace(apiVersionRegex, targetValue);
    return { content: updated, changed: true };
  }

  /**
   * Update JSON manifest apiVersion
   */
  private updateJsonManifest(
    content: string,
    targetApiVersion: string
  ): { content: string; changed: boolean } {
    try {
      const json = JSON.parse(content);

      if (!json.apiVersion) {
        return { content, changed: false };
      }

      if (json.apiVersion === targetApiVersion) {
        return { content, changed: false };
      }

      json.apiVersion = targetApiVersion;
      const updated = JSON.stringify(json, null, 2) + '\n';
      return { content: updated, changed: true };
    } catch {
      return { content, changed: false };
    }
  }

  /**
   * Extract apiVersion from file content
   */
  private extractApiVersion(content: string, filePath: string): string | null {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.json') {
      try {
        const json = JSON.parse(content);
        return json.apiVersion || null;
      } catch {
        return null;
      }
    }

    // YAML - extract with regex to handle various formats
    const match = content.match(/apiVersion:\s*(ossa\/v[\d.]+(-\w+)?|v[\d.]+)/);
    return match ? match[1] : null;
  }
}
