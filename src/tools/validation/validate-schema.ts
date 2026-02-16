#!/usr/bin/env node
/**
 * Validate schema using current version from package.json
 *
 * Follows OpenAPI-first, DRY, and type-safe principles.
 * Uses Zod for validation and shared utilities.
 */

import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getCurrentVersion, getSchemaPath } from './lib/version.js';
import { requireFile } from './lib/file-ops.js';
import { execCommand } from './lib/exec.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

async function main() {
  try {
    // Get version with validation
    const version = getCurrentVersion();
    console.log(`📦 Current version: ${version}`);

    // Build schema path
    const schemaPath = join(ROOT, getSchemaPath(version));

    // Validate schema exists
    requireFile(schemaPath, `Schema not found at ${schemaPath}`);
    console.log(`📄 Validating schema: ${schemaPath}`);

    // Get additional args
    const args = process.argv.slice(2);
    // Use ajv-cli compile to validate schema syntax (no data file needed)
    // --strict=false allows unknown formats like "uri"
    const command = `npx ajv-cli compile -s ${schemaPath} --strict=false ${args.join(' ')}`;

    // Run validation
    execCommand(command, { stdio: 'inherit' });
    console.log('✅ Schema validation passed');
  } catch (error) {
    console.error(
      '❌ Error:',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

main();
