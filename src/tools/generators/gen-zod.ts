#!/usr/bin/env node
/**
 * Generate Zod schemas from current version schema
 * 
 * Follows OpenAPI-first, DRY, and type-safe principles.
 * Uses Zod for validation and shared utilities.
 */

import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getCurrentVersion, getSchemaPath, getZodOutputPath } from '../lib/version.js';
import { requireFile, writeFile } from '../lib/file-ops.js';
import { execCommand } from '../lib/exec.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

async function main() {
  try {
    // Get version with validation
    const version = getCurrentVersion();
    console.log(`[PKG] Current version: ${version}`);
    
    // Build paths
    const schemaPath = join(ROOT, getSchemaPath(version));
    const outputPath = join(ROOT, getZodOutputPath(version));
    
    // Validate schema exists
    requireFile(schemaPath, `Schema not found at ${schemaPath}`);
    console.log(`📄 Schema: ${schemaPath}`);
    
    // Generate Zod schemas
    console.log('[SYNC] Generating Zod schemas...');
    execCommand(`npx json-schema-to-zod -i ${schemaPath} -o ${outputPath}`, {
      stdio: 'inherit',
    });
    
    console.log(`[PASS] Generated: ${outputPath}`);
    
  } catch (error) {
    console.error('[FAIL] Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();

