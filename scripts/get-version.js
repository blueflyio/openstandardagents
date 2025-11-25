#!/usr/bin/env node
/**
 * Get version from package.json
 * Usage: node scripts/get-version.js
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJsonPath = join(__dirname, '..', 'package.json');
const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
console.log(pkg.version);

