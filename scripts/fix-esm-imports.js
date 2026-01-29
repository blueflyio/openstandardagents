#!/usr/bin/env node
/**
 * Post-build script to add .js extensions to ESM imports
 * Fixes Node.js ESM module resolution issues
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, dirname, extname, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, '../dist');

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(path);
    } else {
      yield path;
    }
  }
}

async function fixImports() {
  let fileCount = 0;
  let importCount = 0;

  for await (const file of walk(distDir)) {
    if (extname(file) !== '.js') continue;

    const content = await readFile(file, 'utf-8');
    const originalContent = content;

    // Fix relative imports without extensions
    const fixed = content.replace(
      /from\s+['"](\.[^'"]+?)['"];/g,
      (match, path) => {
        // Skip if already has extension
        if (path.endsWith('.js') || path.endsWith('.json')) {
          return match;
        }
        importCount++;
        return match.replace(path, `${path}.js`);
      }
    );

    if (fixed !== originalContent) {
      await writeFile(file, fixed, 'utf-8');
      fileCount++;
    }
  }

  console.log(`✅ Fixed ${importCount} imports in ${fileCount} files`);
}

fixImports().catch(err => {
  console.error('❌ Failed to fix imports:', err);
  process.exit(1);
});
