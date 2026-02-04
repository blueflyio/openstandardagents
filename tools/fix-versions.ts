#!/usr/bin/env tsx
/**
 * Version Auto-Fix Tool
 *
 * Automatically fixes hardcoded version strings in tests and code.
 * Replaces hardcoded 'ossa/vX.X.X' with import { API_VERSION }
 *
 * Usage:
 *   npm run fix:versions
 *   tsx tools/fix-versions.ts
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { API_VERSION } from '../src/version.js';

const IGNORE_PATTERNS = [
  /node_modules/,
  /dist\//,
  /\.git\//,
  /coverage\//,
  /\.tgz$/,
  /\.bak$/,
  /examples\/v0\.\d+\.\d+\//, // Legacy example directories - keep historical
  /spec\/v0\.\d+/, // Spec directories are versioned - keep historical
  /CHANGELOG\.md$/, // Changelog has historical versions
  /\.version\.json$/, // Source of truth
  /src\/version\.ts$/, // Version constants file
  /tools\/.*\.ts$/, // Tool files reference versionsfor scanning
];

interface Fix {
  file: string;
  oldVersion: string;
  newVersion: string;
  changes: number;
}

const fixes: Fix[] = [];

function shouldIgnore(filepath: string): boolean {
  return IGNORE_PATTERNS.some(pattern => pattern.test(filepath));
}

function fixFile(filepath: string) {
  if (shouldIgnore(filepath)) return;

  try {
    let content = readFileSync(filepath, 'utf-8');
    let changeCount = 0;

    // For TypeScript/JavaScript test files
    if (filepath.endsWith('.test.ts') || filepath.endsWith('.spec.ts')) {
      // Check if file already imports API_VERSION
      const hasImport = content.includes('import') && content.includes('API_VERSION');

      if (!hasImport) {
        // Add import at the top after other imports
        const importRegex = /(import .* from .*;\n)+/;
        const match = content.match(importRegex);
        if (match) {
          const lastImportIndex = match.index! + match[0].length;
          content = content.slice(0, lastImportIndex) +
                   `import { API_VERSION } from '../../../src/version.js';\n` +
                   content.slice(lastImportIndex);
          changeCount++;
        }
      }

      // Replace all hardcoded apiVersion strings
      const versionRegex = /apiVersion:\s*['"]ossa\/v\d+\.\d+(?:\.\d+)?['"]/g;
      const matches = content.match(versionRegex);

      if (matches) {
        content = content.replace(versionRegex, 'apiVersion: API_VERSION');
        changeCount += matches.length;

        fixes.push({
          file: filepath,
          oldVersion: matches[0],
          newVersion: 'API_VERSION',
          changes: matches.length,
        });
      }
    }

    // For JSON/YAML files (examples, configs)
    if ((filepath.endsWith('.json') || filepath.endsWith('.yaml') || filepath.endsWith('.yml')) &&
        !shouldIgnore(filepath)) {
      // Replace with current version (these can't import)
      const versionRegex = /(['"]?)ossa\/v\d+\.\d+(?:\.\d+)?\1/g;
      const matches = content.match(versionRegex);

      if (matches) {
        content = content.replace(versionRegex, `$1${API_VERSION}$1`);
        changeCount += matches.length;

        fixes.push({
          file: filepath,
          oldVersion: matches[0],
          newVersion: API_VERSION,
          changes: matches.length,
        });
      }
    }

    if (changeCount > 0) {
      writeFileSync(filepath, content, 'utf-8');
    }
  } catch (err) {
    // Skip files that can't be read/written
  }
}

function scanDirectory(dir: string) {
  try {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (stat.isFile()) {
        fixFile(fullPath);
      }
    }
  } catch (err) {
    // Skip directories that can't be read
  }
}

// Main execution
console.log('🔧 Auto-fixing hardcoded version strings...\n');
console.log(`Target apiVersion: ${API_VERSION}\n`);

const rootDir = join(process.cwd());

// Fix tests directory
console.log('📝 Fixing tests...');
scanDirectory(join(rootDir, 'tests'));

console.log('\n📝 Fixing examples...');
scanDirectory(join(rootDir, 'examples'));

console.log('\n📝 Fixing src...');
scanDirectory(join(rootDir, 'src'));

if (fixes.length === 0) {
  console.log('\n✅ No fixes needed - all versions are up to date!\n');
  process.exit(0);
} else {
  console.log(`\n✅ Fixed ${fixes.length} files:\n`);

  fixes.forEach(fix => {
    const relPath = relative(rootDir, fix.file);
    console.log(`  ${relPath}`);
    console.log(`    ${fix.oldVersion} → ${fix.newVersion} (${fix.changes} changes)`);
  });

  const totalChanges = fixes.reduce((sum, f) => sum + f.changes, 0);
  console.log(`\n✅ Total: ${totalChanges} changes across ${fixes.length} files\n`);

  process.exit(0);
}
