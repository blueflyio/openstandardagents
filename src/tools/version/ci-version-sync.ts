#!/usr/bin/env tsx
/**
 * CI Version Sync Script
 * 
 * Automatically syncs version from CI environment variables to all project files.
 * Designed to run in CI after patch version is determined.
 * 
 * Environment Variables:
 * - CI_DETERMINED_VERSION: Full version (e.g., "0.3.0") set by CI
 * - CI_BRANCH_VERSION: Major.minor from branch (e.g., "0.3") 
 * - CI_PATCH_VERSION: Patch number (e.g., "1")
 * 
 * Usage:
 *   CI_DETERMINED_VERSION=0.3.0 tsx src/tools/version/ci-version-sync.ts
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const VERSION = process.env.CI_DETERMINED_VERSION || process.env.CI_COMMIT_TAG?.replace(/^v/, '') || '0.3.0';
const BRANCH_VERSION = process.env.CI_BRANCH_VERSION || VERSION.split('.').slice(0, 2).join('.');
const PATCH_VERSION = process.env.CI_PATCH_VERSION || VERSION.split('.')[2];

console.log(`CI Version Sync`);
console.log(`==================`);
console.log(`Version: ${VERSION}`);
console.log(`Branch: ${BRANCH_VERSION}`);
console.log(`Patch: ${PATCH_VERSION}\n`);

// Update package.json
const packageJsonPath = path.join(process.cwd(), 'package.json');
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
pkg.version = VERSION;
if (pkg.exports && pkg.exports['./schema']) {
  pkg.exports['./schema'] = `./spec/v${VERSION}/ossa-${VERSION}.schema.json`;
}
fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`Updated package.json: ${VERSION}`);

// Update .version.json
const versionJsonPath = path.join(process.cwd(), '.version.json');
const versionConfig = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
versionConfig.current = VERSION;
versionConfig.spec_version = VERSION;
fs.writeFileSync(versionJsonPath, JSON.stringify(versionConfig, null, 2) + '\n');
console.log(`Updated .version.json: ${VERSION}`);

// Run sync-versions to update README.md and other files
try {
  execSync('npm run version:sync', { stdio: 'inherit' });
  console.log(`Synced all version references`);
} catch (error) {
  console.error(`WARNING: version:sync failed, continuing...`);
}

console.log(`\nCI version sync complete!`);
