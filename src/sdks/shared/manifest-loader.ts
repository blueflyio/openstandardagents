/**
 * Manifest Loader - Shared Across SDKs
 *
 * SOLID: Single Responsibility - Loading manifests
 * CRUD: Read operation
 * DRY: Shared loading logic
 */

import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { z } from 'zod';
import { ApiVersionSchema, MetadataSchema } from './validation.js';

const ManifestBaseSchema = z.object({
  apiVersion: ApiVersionSchema,
  kind: z.enum(['Agent', 'Task', 'Workflow']),
  metadata: MetadataSchema,
});

export type ManifestBase = z.infer<typeof ManifestBaseSchema>;

export interface ManifestLoaderOptions {
  validate?: boolean;
  strict?: boolean;
}

export class ManifestLoader {
  /**
   * Load manifest from file
   * CRUD: Read
   */
  static load<T extends ManifestBase>(
    filePath: string,
    schema: z.ZodSchema<T>,
    options: ManifestLoaderOptions = {}
  ): T {
    const content = readFileSync(filePath, 'utf-8');

    // Parse YAML/JSON
    const parsed = filePath.endsWith('.yaml') || filePath.endsWith('.yml')
      ? parse(content)
      : JSON.parse(content);

    // Validate base structure
    const base = ManifestBaseSchema.parse(parsed);

    // Validate against specific schema if provided
    if (options.validate !== false) {
      return schema.parse(parsed);
    }

    return parsed as T;
  }

  /**
   * Load manifest from string
   * CRUD: Read
   */
  static loadFromString<T extends ManifestBase>(
    content: string,
    schema: z.ZodSchema<T>,
    format: 'yaml' | 'json' = 'yaml'
  ): T {
    const parsed = format === 'yaml' ? parse(content) : JSON.parse(content);
    return schema.parse(parsed);
  }
}
