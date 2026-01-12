#!/usr/bin/env node

/**
 * OSSA Developer CLI Entry Point
 * 
 * Production tool for version management and spec generation.
 * Built from src/dev-cli/src/index.ts
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to load from dist (production build)
const distPath = join(__dirname, '../dist/index.js');
const srcPath = join(__dirname, '../src/index.ts');

if (existsSync(distPath)) {
  // Production build
  import(distPath).catch(err => {
    console.error('Error loading OSSA Developer CLI:', err);
    process.exit(1);
  });
} else {
  // Development mode - use tsx
  import('tsx').then(({ register }) => {
    register();
    import(srcPath).catch(err => {
      console.error('Error loading OSSA Developer CLI:', err);
      process.exit(1);
    });
  }).catch(() => {
    console.error('Error: OSSA Developer CLI not built. Run: npm run build');
    console.error('Or install tsx for development: npm install -D tsx');
    process.exit(1);
  });
}
