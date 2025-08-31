#!/usr/bin/env node

/**
 * OSSA v0.1.3 Validator - Redirects to tools/validation
 * This file remains in root for backward compatibility
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Redirect to the actual validator in lib/validation
const validatorPath = join(__dirname, 'lib', 'validation', 'validate-ossa-v0.1.3.js');
const child = spawn('node', [validatorPath, ...process.argv.slice(2)], {
  stdio: 'inherit'
});

child.on('exit', (code) => {
  process.exit(code);
});