#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const { version } = JSON.parse(readFileSync('package.json', 'utf-8'));

// Website moved to openstandardagents.org repository
// Version is read from package.json at runtime via src/tools/lib/version.ts
// No hardcoded version files to sync
const files = [];

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
