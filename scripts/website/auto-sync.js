#!/usr/bin/env node
/**
 * Auto-sync script - runs all sync operations
 * Called by CI/CD and can be run manually
 * 
 * Usage: node scripts/website/auto-sync.js
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WEBSITE_DIR = path.join(__dirname, '../../website');

console.log('🔄 Starting auto-sync for OSSA website...\n');

const scripts = [
  { name: 'Fetch Spec', cmd: 'npm run fetch-spec', cwd: WEBSITE_DIR },
  { name: 'Fetch Examples', cmd: 'npm run fetch-examples', cwd: WEBSITE_DIR },
  { name: 'Fetch Highlights', cmd: 'npm run fetch-highlights', cwd: WEBSITE_DIR },
  { name: 'Fetch Versions', cmd: 'npm run fetch-versions', cwd: WEBSITE_DIR },
  { name: 'Sync Version', cmd: 'npm run sync-version', cwd: WEBSITE_DIR },
  { name: 'Fix Versions', cmd: 'npm run fix-versions', cwd: WEBSITE_DIR },
];

let successCount = 0;
let failCount = 0;

for (const script of scripts) {
  try {
    console.log(`📦 ${script.name}...`);
    execSync(script.cmd, {
      cwd: script.cwd,
      stdio: 'inherit',
      env: {
        ...process.env,
        OSSA_SPEC_REF: process.env.OSSA_SPEC_REF || 'release/v0.3.x',
        OSSA_EXAMPLES_REF: process.env.OSSA_EXAMPLES_REF || 'release/v0.3.x',
      },
    });
    console.log(`✅ ${script.name} completed\n`);
    successCount++;
  } catch (error) {
    console.error(`❌ ${script.name} failed:`, error.message);
    failCount++;
    // Continue with other scripts
  }
}

console.log(`\n📊 Sync Summary:`);
console.log(`   ✅ Successful: ${successCount}`);
console.log(`   ❌ Failed: ${failCount}`);

if (failCount > 0) {
  process.exit(1);
}
