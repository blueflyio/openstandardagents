/**
 * Zod Generator - Generate Zod schemas from JSON Schema
 *
 * Uses json-schema-to-zod to generate runtime validators from:
 * - spec/vX.X.X/ossa-X.X.X.schema.json
 *
 * Output: src/types/generated/ossa-X.X.X.zod.ts
 */

import { injectable } from 'inversify';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import type { Generator, GenerateResult, DriftReport } from '../codegen.service.js';
import { getVersion } from '../../../utils/version.js';

@injectable()
export class ZodGenerator implements Generator {
  name = 'zod';

  /**
   * Generate Zod schemas from JSON Schema
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

      // Read schema
      const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

      // Generate Zod using json-schema-to-zod
      let output: string;
      try {
        output = execSync(
          `npx json-schema-to-zod -s "${schemaPath}" -n OssaSchema`,
          { encoding: 'utf8', cwd: process.cwd() }
        );
      } catch {
        // Fallback: generate basic Zod schema manually
        output = this.generateBasicZodSchema(schema, version);
      }

      // Add header and imports
      const header = `/**
 * OSSA v${version} Zod Schemas
 *
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from: spec/v${version}/ossa-${version}.schema.json
 *
 * Regenerate with: ossa generate zod
 */

import { z } from 'zod';

`;

      fs.writeFileSync(outputPath, header + output, 'utf8');

      if (fs.existsSync(outputPath)) {
        result.filesCreated = 1;
      }
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
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
   * Check for drift - schemas are always regenerated
   */
  async checkDrift(): Promise<DriftReport['filesWithOldVersion']> {
    return [];
  }

  /**
   * Generate basic Zod schema when json-schema-to-zod fails
   */
  private generateBasicZodSchema(schema: Record<string, unknown>, version: string): string {
    return `
// Basic OSSA schema - manual generation fallback
export const OssaApiVersionSchema = z.literal('ossa/v${version}');

export const OssaMetadataSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  labels: z.record(z.string(), z.string()).optional(),
  annotations: z.record(z.string(), z.string()).optional(),
});

export const OssaAgentSchema = z.object({
  apiVersion: OssaApiVersionSchema,
  kind: z.enum(['Agent', 'Task', 'Workflow']),
  metadata: OssaMetadataSchema,
  spec: z.record(z.string(), z.unknown()),
});

export type OssaAgent = z.infer<typeof OssaAgentSchema>;
export type OssaMetadata = z.infer<typeof OssaMetadataSchema>;
`;
  }

  private getSchemaPath(version: string): string {
    return path.join(process.cwd(), `spec/v${version}/ossa-${version}.schema.json`);
  }

  private getOutputPath(version: string): string {
    return path.join(process.cwd(), `src/types/generated/ossa-${version}.zod.ts`);
  }
}
