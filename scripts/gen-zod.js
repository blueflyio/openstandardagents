#!/usr/bin/env node
/**
 * Generate Zod schemas from current version schema
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get version
const packageJsonPath = join(__dirname, '..', 'package.json');
const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const version = pkg.version;
const schemaPath = `spec/v${version}/ossa-${version}.schema.json`;
const outputPath = `src/types/generated/ossa-${version}.zod.ts`;

// Check schema exists
try {
  readFileSync(join(__dirname, '..', schemaPath), 'utf8');
} catch (error) {
  console.error(`Error: Schema not found at ${schemaPath}`);
  process.exit(1);
}

// Generate Zod schemas
try {
  const output = execSync(`json-schema-to-zod ${schemaPath}`, { encoding: 'utf8' });
  writeFileSync(join(__dirname, '..', outputPath), output);
  console.log(`Generated: ${outputPath}`);
} catch (error) {
  console.error(`Error generating Zod schemas: ${error.message}`);
  process.exit(1);
}

