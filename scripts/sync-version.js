#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const { version } = JSON.parse(readFileSync('package.json', 'utf-8'));

const files = [
  {
    path: 'website/src/config.ts',
    pattern: /version:\s*['"][\d.]+['"]/,
    replacement: `version: '${version}'`
  },
  {
    path: 'src/version.ts',
    pattern: /VERSION\s*=\s*['"][\d.]+['"]/,
    replacement: `VERSION = '${version}'`
  }
];

console.log(`📦 Syncing version: ${version}\n`);

let updated = 0;
for (const { path, pattern, replacement } of files) {
  try {
    const content = readFileSync(path, 'utf-8');
    if (pattern.test(content)) {
      const newContent = content.replace(pattern, replacement);
      writeFileSync(path, newContent);
      console.log(`✓ ${path}`);
      updated++;
    } else {
      console.log(`⚠ ${path} - pattern not found`);
    }
  } catch (err) {
    console.log(`✗ ${path} - ${err.message}`);
  }
}

console.log(`\n${updated} files updated`);
