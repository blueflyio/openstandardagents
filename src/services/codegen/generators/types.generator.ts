/**
 * Types Generator - Generate TypeScript types from JSON Schema
 *
 * Uses json-schema-to-typescript to generate types from:
 * - spec/vX.X.X/ossa-X.X.X.schema.json
 *
 * Output: src/types/generated/ossa-X.X.X.types.ts
 */

import { injectable } from 'inversify';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import type {
  Generator,
  GenerateResult,
  DriftReport,
} from '../codegen.service.js';
import { getVersion } from '../../../utils/version.js';

@injectable()
export class TypesGenerator implements Generator {
  name = 'types';

  /**
   * Generate TypeScript types from JSON Schema
   */
  async generate(dryRun: boolean): Promise<GenerateResult> {
    const result: GenerateResult = {
      generator: this.name,
      filesUpdated: 0,
      filesCreated: 0,
      errors: [],
    };

    const version = getVersion();
    const schemaPath = this.getSchemaPath(version);
    const outputPath = this.getOutputPath(version);

    if (!fs.existsSync(schemaPath)) {
      result.errors.push(`Schema not found: ${schemaPath}`);
      return result;
    }

    if (dryRun) {
      result.filesCreated = 1;
      return result;
    }

    try {
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Generate types using json-schema-to-typescript
      const output = execSync(
        `npx json-schema-to-typescript "${schemaPath}" --no-bannerComment`,
        { encoding: 'utf8', cwd: process.cwd() }
      );

      // Add header
      const header = `/**
 * OSSA v${version} TypeScript Types
 *
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from: spec/v${version}/ossa-${version}.schema.json
 *
 * Regenerate with: ossa generate types
 */

`;

      fs.writeFileSync(outputPath, header + output, 'utf8');

      if (fs.existsSync(outputPath)) {
        result.filesCreated = 1;
      }
    } catch (error) {
      result.errors.push(
        error instanceof Error ? error.message : String(error)
      );
    }

    return result;
  }

  /**
   * List target files
   */
  async listTargetFiles(): Promise<string[]> {
    const version = getVersion();
    return [this.getOutputPath(version)];
  }

  /**
   * Check for drift - types are always regenerated
   */
  async checkDrift(): Promise<DriftReport['filesWithOldVersion']> {
    // Types are generated fresh each time, no drift check needed
    return [];
  }

  private getSchemaPath(version: string): string {
    return path.join(
      process.cwd(),
      `spec/v${version}/ossa-${version}.schema.json`
    );
  }

  private getOutputPath(version: string): string {
    return path.join(
      process.cwd(),
      `src/types/generated/ossa-${version}.types.ts`
    );
  }
}
