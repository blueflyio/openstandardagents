#!/usr/bin/env node
/**
 * Generate TypeScript types from current version schema
 *
 * Follows OpenAPI-first, DRY, and type-safe principles.
 * Uses Zod for validation and shared utilities.
 */

import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '../../..');

async function main() {
  try {
    // Get version with validation
    const version = getVersion();
    console.log(`📦 Current version: ${version}`);

    // Build paths
    const schemaPath = join(ROOT, getSchemaPath());
    const outputPath = join(ROOT, 'src/generated/types.ts');

    // Validate schema exists
    if (!existsSync(schemaPath)) {
      throw new Error(`Schema not found at ${schemaPath}`);
    }
    console.log(`📄 Schema: ${schemaPath}`);

    // Generate types
    console.log('🔄 Generating TypeScript types...');
    const output = execSync(`npx json-schema-to-typescript ${schemaPath}`, {
      encoding: 'utf8',
    });

    // Write output
    writeFileSync(outputPath, output);
    console.log(`✅ Generated: ${outputPath}`);
  } catch (error) {
    console.error(
      '❌ Error:',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

main();

