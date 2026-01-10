/**
 * VSCode Generator - Update version in VSCode extension files
 *
 * Targets:
 * - tools/vscode-ossa/snippets/ossa-snippets.json
 * - tools/vscode-ossa/package.json
 * - tools/vscode-ossa/src/commands.ts
 * - tools/vscode-ossa/src/validator.ts
 */

import { injectable } from 'inversify';
import * as fs from 'fs';
import * as path from 'path';
import type { Generator, GenerateResult, DriftReport } from '../codegen.service.js';
import { getVersion, getApiVersion } from '../../../utils/version.js';

@injectable()
export class VSCodeGenerator implements Generator {
  name = 'vscode';

  private readonly targetFiles = [
    'tools/vscode-ossa/snippets/ossa-snippets.json',
    'tools/vscode-ossa/package.json',
    'tools/vscode-ossa/src/commands.ts',
    'tools/vscode-ossa/src/validator.ts',
  ];

  /**
   * Generate: Update version in all VSCode files
   */
  async generate(dryRun: boolean): Promise<GenerateResult> {
    const result: GenerateResult = {
      generator: this.name,
      filesUpdated: 0,
      filesCreated: 0,
      errors: [],
    };

    const apiVersion = getApiVersion();
    const version = getVersion();

    for (const relativePath of this.targetFiles) {
      const filePath = path.join(process.cwd(), relativePath);

      if (!fs.existsSync(filePath)) {
        continue;
      }

      try {
        const updated = await this.updateFile(filePath, apiVersion, version, dryRun);
        if (updated) {
          result.filesUpdated++;
        }
      } catch (error) {
        result.errors.push(`${relativePath}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return result;
  }

  /**
   * List target files
   */
  async listTargetFiles(): Promise<string[]> {
    return this.targetFiles
      .map(f => path.join(process.cwd(), f))
      .filter(f => fs.existsSync(f));
  }

  /**
   * Check for version drift
   */
  async checkDrift(version: string, apiVersion: string): Promise<DriftReport['filesWithOldVersion']> {
    const drift: DriftReport['filesWithOldVersion'] = [];

    for (const relativePath of this.targetFiles) {
      const filePath = path.join(process.cwd(), relativePath);

      if (!fs.existsSync(filePath)) {
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const oldVersions = this.findOldVersions(content, apiVersion);

      if (oldVersions.length > 0) {
        drift.push({
          path: relativePath,
          foundVersion: oldVersions[0],
        });
      }
    }

    return drift;
  }

  /**
   * Update a single file
   */
  private async updateFile(
    filePath: string,
    apiVersion: string,
    version: string,
    dryRun: boolean
  ): Promise<boolean> {
    const content = fs.readFileSync(filePath, 'utf8');
    const ext = path.extname(filePath).toLowerCase();

    let updated: string;

    if (ext === '.json') {
      updated = this.updateJsonFile(content, apiVersion, version);
    } else if (ext === '.ts') {
      updated = this.updateTsFile(content, apiVersion);
    } else {
      return false;
    }

    if (updated === content) {
      return false;
    }

    if (!dryRun) {
      fs.writeFileSync(filePath, updated, 'utf8');
    }

    return true;
  }

  /**
   * Update JSON file - replace old version patterns
   */
  private updateJsonFile(content: string, apiVersion: string, version: string): string {
    let updated = content;

    // Replace ossa/v0.x.x patterns
    updated = updated.replace(/ossa\/v\d+\.\d+\.\d+/g, apiVersion);

    // Replace schema URLs
    updated = updated.replace(
      /schemas\/v\d+\.\d+\.\d+\//g,
      `schemas/v${version}/`
    );

    // Replace "default": "vX.X.X" pattern (but NOT enum arrays)
    updated = updated.replace(
      /"default":\s*"v\d+\.\d+\.\d+"/g,
      `"default": "v${version}"`
    );

    return updated;
  }

  /**
   * Update TypeScript file - replace apiVersion strings
   */
  private updateTsFile(content: string, apiVersion: string): string {
    let updated = content;

    // Replace apiVersion: 'ossa/v0.x.x' patterns
    updated = updated.replace(
      /apiVersion:\s*['"]ossa\/v\d+\.\d+\.\d+['"]/g,
      `apiVersion: '${apiVersion}'`
    );

    // Replace template strings with ossa/v0.x.x
    updated = updated.replace(
      /`apiVersion:\s*ossa\/v\d+\.\d+\.\d+/g,
      `\`apiVersion: ${apiVersion}`
    );

    // Replace 'v0.x.x' default values
    updated = updated.replace(
      /['"]v\d+\.\d+\.\d+['"]/g,
      (match) => {
        // Only replace if it looks like an OSSA version
        if (match.includes("v0.3") || match.includes("v0.2")) {
          // apiVersion is "ossa/v0.3.3", so .replace('ossa/', '') gives "v0.3.3"
          return `'${apiVersion.replace('ossa/', '')}'`;
        }
        return match;
      }
    );

    return updated;
  }

  /**
   * Find old version patterns in content
   */
  private findOldVersions(content: string, currentApiVersion: string): string[] {
    const versions: string[] = [];
    const currentBase = currentApiVersion.replace('ossa/', '');

    // Find ossa/vX.X.X patterns
    const ossaMatches = content.matchAll(/ossa\/v(\d+\.\d+\.\d+)/g);
    for (const match of ossaMatches) {
      if (match[1] !== currentBase.replace('v', '')) {
        versions.push(`ossa/v${match[1]}`);
      }
    }

    return [...new Set(versions)];
  }
}
