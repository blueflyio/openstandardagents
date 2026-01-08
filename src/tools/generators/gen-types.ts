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
import { getCurrentVersion, getSchemaPath, getTypesOutputPath } from './lib/version.js';
import { requireFile, writeFile } from './lib/file-ops.js';
import { execCommand } from './lib/exec.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

async function main() {
  try {
    // Get version with validation
    const version = getCurrentVersion();
    console.log(`📦 Current version: ${version}`);
    
    // Build paths
    const schemaPath = join(ROOT, getSchemaPath(version));
    const outputPath = join(ROOT, getTypesOutputPath(version));
    
    // Validate schema exists
    requireFile(schemaPath, `Schema not found at ${schemaPath}`);
    console.log(`📄 Schema: ${schemaPath}`);
    
    // Generate types
    console.log('🔄 Generating TypeScript types...');
    const output = execCommand(`npx json-schema-to-typescript ${schemaPath}`, {
      encoding: 'utf8',
    });
    
    // Write output
    writeFile(outputPath, output);
    console.log(`✅ Generated: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();

