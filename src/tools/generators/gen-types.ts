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
    const version = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8')).version;
    console.log(`📦 Current version: ${version}`);

    // Generate types from complete OpenAPI spec (agent-crud has agent schemas)
    const openApiPath = join(ROOT, 'openapi/agent-crud.yaml');
    const outputPath = join(ROOT, 'src/generated/types.ts');

    if (!existsSync(openApiPath)) {
      throw new Error(`OpenAPI schema not found at ${openApiPath}`);
    }
    console.log(`📄 OpenAPI Spec: ${openApiPath}`);

    // Generate types using openapi-typescript
    console.log('🔄 Generating TypeScript types from OpenAPI...');
    execSync(
      `npx openapi-typescript ${openApiPath} --output ${outputPath}`,
      {
        encoding: 'utf8',
        stdio: 'inherit',
      }
    );

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

