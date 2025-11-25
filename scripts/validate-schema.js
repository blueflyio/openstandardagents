#!/usr/bin/env node
/**
 * Validate schema using current version from package.json
 */

import { readFileSync } from 'fs';
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

// Check schema exists
try {
  readFileSync(join(__dirname, '..', schemaPath), 'utf8');
} catch (error) {
  console.error(`Error: Schema not found at ${schemaPath}`);
  process.exit(1);
}

// Run ajv validate
const args = process.argv.slice(2);
try {
  execSync(`ajv validate -s ${schemaPath} ${args.join(' ')}`, { stdio: 'inherit' });
} catch (error) {
  process.exit(error.status || 1);
}

