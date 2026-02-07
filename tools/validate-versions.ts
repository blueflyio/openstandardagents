#!/usr/bin/env tsx
/**
 * Version Validation Tool
 *
 * Scans the codebase for hardcoded version strings and reports violations.
 * Run this in CI to prevent version drift.
 *
 * Usage:
 *   npm run validate:versions
 *   tsx tools/validate-versions.ts
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { API_VERSION, SPEC_VERSION } from '../src/version.js';

const ALLOWED_HARDCODED_VERSIONS = [
  '.version.json',           // Source of truth
  'src/version.ts',          // Version constants
  'CHANGELOG.md',            // Historical versions documented
  'package.json',            // NPM version
  'tools/validate-versions.ts', // This file
];

const IGNORE_PATTERNS = [
  /node_modules/,
  /dist\//,
  /\.git\//,
  /coverage\//,
  /\.tgz$/,
  /\.bak$/,
  /examples\/v0\.\d+\.\d+\//, // Legacy example directories
  /spec\/v0\.\d+/, // Spec directories are versioned
];

interface Violation {
  file: string;
  line: number;
  content: string;
  version: string;
}

const violations: Violation[] = [];

function shouldIgnore(filepath: string): boolean {
  return IGNORE_PATTERNS.some(pattern => pattern.test(filepath)) ||
         ALLOWED_HARDCODED_VERSIONS.some(allowed => filepath.includes(allowed));
}

function scanFile(filepath: string) {
  if (shouldIgnore(filepath)) return;

  try {
    const content = readFileSync(filepath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for hardcoded ossa/vX.X.X patterns
      const ossaVersionMatch = line.match(/['"]ossa\/v(\d+\.\d+(?:\.\d+)?)['"]/);//Check for other version patterns (but not current version)
      if (ossaVersionMatch) {
        const foundVersion = `ossa/v${ossaVersionMatch[1]}`;
        if (foundVersion !== API_VERSION) {
          violations.push({
            file: filepath,
            line: index + 1,
            content: line.trim(),
            version: foundVersion,
          });
        }
      }
    });
  } catch (err) {
    // Skip files that can't be read
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
      } else if (stat.isFile() && (
        fullPath.endsWith('.ts') ||
        fullPath.endsWith('.js') ||
        fullPath.endsWith('.json') ||
        fullPath.endsWith('.yaml') ||
        fullPath.endsWith('.yml')
      )) {
        scanFile(fullPath);
      }
    }
  } catch (err) {
    // Skip directories that can't be read
  }
}

// Main execution
console.log('🔍 Scanning for hardcoded version strings...\n');
console.log(`Expected apiVersion: ${API_VERSION}`);
console.log(`Expected specVersion: ${SPEC_VERSION}\n`);

const rootDir = join(process.cwd());
scanDirectory(rootDir);

if (violations.length === 0) {
  console.log('✅ No version violations found!\n');
  process.exit(0);
} else {
  console.error(`❌ Found ${violations.length} version violations:\n`);

  // Group by version
  const byVersion = violations.reduce((acc, v) => {
    if (!acc[v.version]) acc[v.version] = [];
    acc[v.version].push(v);
    return acc;
  }, {} as Record<string, Violation[]>);

  Object.entries(byVersion).forEach(([version, viols]) => {
    console.error(`\n${version} (${viols.length} occurrences):`);
    viols.forEach(v => {
      const relPath = relative(rootDir, v.file);
      console.error(`  ${relPath}:${v.line}`);
      console.error(`    ${v.content}`);
    });
  });

  console.error('\n❌ Fix: Replace hardcoded versions with:');
  console.error(`   import { API_VERSION } from '../src/version.js';`);
  console.error(`   apiVersion: API_VERSION  // Not 'ossa/v0.3.6'`);
  console.error('');

  process.exit(1);
}
