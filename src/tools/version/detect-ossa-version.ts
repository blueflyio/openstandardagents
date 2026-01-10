#!/usr/bin/env tsx
/**
 * Detect OSSA Version Script
 *
 * Determines the OSSA specification version from various sources.
 * Writes result to ossa-version.env for use in CI.
 *
 * Priority order:
 * 1. VERSION from build.env (strips dev/rc suffix)
 * 2. package.json version (if not placeholder)
 * 3. CI_COMMIT_TAG
 * 4. Latest spec directory (spec/v*)
 * 5. CI_MERGE_REQUEST_MILESTONE (converts v0.3.x -> v0.3.0)
 * 6. release/vX.Y.x branch -> vX.Y.0
 */

import fs from 'fs';
import path from 'path';

function stripPreRelease(version: string): string {
  // Strip dev/rc suffix: 0.3.0-dev.4 -> 0.3.0, 0.3.0-rc1 -> 0.3.0
  return version
    .replace(/(-dev|-rc)\.[0-9]+$/, '')
    .replace(/(-dev|-rc)[0-9]*$/, '');
}

function isValidVersion(version: string): boolean {
  return /^v?[0-9]+\.[0-9]+\.[0-9]+$/.test(version);
}

function normalizeVersion(version: string): string {
  return version.startsWith('v') ? version : `v${version}`;
}

function detectOssaVersion(): string | null {
  // Priority 1: VERSION from build.env
  const buildEnvPath = path.join(process.cwd(), 'build.env');
  if (fs.existsSync(buildEnvPath)) {
    const content = fs.readFileSync(buildEnvPath, 'utf8');
    const match = content.match(/^VERSION=(.+)$/m);
    if (match) {
      const baseVersion = stripPreRelease(match[1]);
      const version = normalizeVersion(baseVersion);
      if (isValidVersion(version)) {
        console.log(`📦 Found version in build.env: ${match[1]} -> ${version}`);
        return version;
      }
    }
  }

  // Priority 2: package.json
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (pkg.version && pkg.version !== '0.3.3') {
      const version = normalizeVersion(pkg.version);
      if (isValidVersion(version)) {
        console.log(`📦 Found version in package.json: ${version}`);
        return version;
      }
    }
  }

  // Priority 3: CI_COMMIT_TAG
  const commitTag = process.env.CI_COMMIT_TAG;
  if (commitTag && isValidVersion(commitTag)) {
    console.log(`🏷️  Found version in CI_COMMIT_TAG: ${commitTag}`);
    return normalizeVersion(commitTag);
  }

  // Priority 4: Latest spec directory
  const specDir = path.join(process.cwd(), 'spec');
  if (fs.existsSync(specDir)) {
    const dirs = fs.readdirSync(specDir)
      .filter(d => d.startsWith('v') && fs.statSync(path.join(specDir, d)).isDirectory())
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    if (dirs.length > 0) {
      const latestSpec = dirs[dirs.length - 1];
      console.log(`📁 Found version in spec directory: ${latestSpec}`);
      return latestSpec;
    }
  }

  // Priority 5: CI_MERGE_REQUEST_MILESTONE
  const milestone = process.env.CI_MERGE_REQUEST_MILESTONE;
  if (milestone) {
    // Convert v0.3.x or v0.3 -> v0.3.0
    const converted = milestone
      .replace(/\.x$/, '.0')
      .replace(/^v([0-9]+\.[0-9]+)$/, 'v$1.0');

    if (isValidVersion(converted)) {
      console.log(`🎯 Found version in milestone: ${milestone} -> ${converted}`);
      return converted;
    }
  }

  // Priority 6: release/vX.Y.x branch
  const branch = process.env.CI_COMMIT_BRANCH;
  if (branch) {
    const match = branch.match(/^release\/v([0-9]+)\.([0-9]+)\.x$/);
    if (match) {
      const version = `v${match[1]}.${match[2]}.0`;
      console.log(`🌿 Found version in branch: ${branch} -> ${version}`);
      return version;
    }
  }

  return null;
}

function main() {
  console.log('🔍 Detecting OSSA version...\n');

  const version = detectOssaVersion();

  if (!version) {
    console.error('❌ ERROR: Could not determine OSSA version.');
    console.error('Expected one of: build.env VERSION, package.json version, CI_COMMIT_TAG, spec/v*, MR milestone, release/vX.Y.x');
    process.exit(1);
  }

  if (!isValidVersion(version)) {
    console.error(`❌ ERROR: Invalid version format: ${version} (expected vX.Y.Z)`);
    process.exit(1);
  }

  const cleanVersion = version.replace(/^v/, '');

  // Write to ossa-version.env
  const envContent = `OSSA_VERSION=${cleanVersion}\nDETECTED_VERSION=${cleanVersion}\n`;
  fs.writeFileSync('ossa-version.env', envContent);

  console.log(`\n✅ OSSA Version: ${cleanVersion}`);
  console.log(`📄 Written to: ossa-version.env`);
}

main();
