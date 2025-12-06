#!/usr/bin/env node

/**
 * Sync version from npm registry (source of truth) to lib/version.ts
 * Falls back to package.json if npm registry is unreachable
 *
 * Run: npm run sync-version
 * Automatically runs on: npm run dev, npm run build
 *
 * IMPORTANT: This script fetches the latest version from npm registry,
 * so the website always displays the latest published version without
 * needing to manually update package.json.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const NPM_PACKAGE = '@bluefly/openstandardagents';
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const versionTsPath = path.join(__dirname, '..', 'lib', 'version.ts');
const versionsJsonPath = path.join(__dirname, '..', 'lib', 'versions.json');

// Fetch latest version from npm registry
function fetchNpmVersion() {
  return new Promise((resolve, reject) => {
    const url = `https://registry.npmjs.org/${NPM_PACKAGE}/latest`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const pkg = JSON.parse(data);
          resolve(pkg.version);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function syncVersion() {
  let version;
  let source;

  // Try npm registry first (source of truth for published versions)
  try {
    version = await fetchNpmVersion();
    source = 'npm registry';
    console.log(`📦 Fetched version ${version} from npm registry`);
  } catch (error) {
    // Fallback to package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    version = packageJson.version;
    source = 'package.json (fallback)';
    console.log(`⚠️  npm registry unreachable, using package.json: ${version}`);
  }

  // Also update package.json to keep in sync
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (packageJson.version !== version) {
    packageJson.version = version;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`📝 Updated package.json to ${version}`);
  }

  // Read versions.json if it exists
  let versionsData = { all: [], stable: version, dev: null };
  try {
    if (fs.existsSync(versionsJsonPath)) {
      versionsData = JSON.parse(fs.readFileSync(versionsJsonPath, 'utf8'));
    }
  } catch (e) {
    // Ignore if versions.json doesn't exist yet
  }

  // Extract major.minor for display version
  const versionParts = version.split('.');
  const displayVersion = `${versionParts[0]}.${versionParts[1]}.x`;

  // Generate version.ts content
  const versionTsContent = `// OSSA version constants
// AUTO-GENERATED from ${source} - DO NOT EDIT DIRECTLY
// Run: npm run sync-version (fetches latest from npm registry)

import versionsData from './versions.json';

export const OSSA_VERSION = "${version}";
export const OSSA_VERSION_TAG = \`v\${OSSA_VERSION}\`;
export const OSSA_API_VERSION = \`ossa/v\${OSSA_VERSION}\`;
export const OSSA_SCHEMA_VERSION = OSSA_VERSION;

// Display version for marketing (doesn't change on patch releases)
export const OSSA_DISPLAY_VERSION = "${displayVersion}";
export const OSSA_DISPLAY_VERSION_TAG = "v${displayVersion}";

// Aliases for backward compatibility
export const STABLE_VERSION = OSSA_VERSION;
export const STABLE_VERSION_TAG = OSSA_VERSION_TAG;

// Version data from versions.json
export const STABLE_VERSIONS = versionsData.all.filter((v: any) => v.type === 'stable');
export const DEV_VERSIONS = versionsData.all.filter((v: any) => v.type === 'dev' || v.type === 'prerelease');
export const ALL_VERSIONS = versionsData.all;
export const DEV_VERSION_TAG = versionsData.dev ? \`v\${versionsData.dev}\` : undefined;

// Utility to get version info
export function getVersionInfo(version: string): any {
  return versionsData.all.find((v: any) => v.version === version);
}

// Utility to get schema path
export function getSchemaPath(ver = OSSA_VERSION): string {
  return \`/schemas/ossa-\${ver}.schema.json\`;
}

// Utility to get spec path
export function getSpecPath(ver = OSSA_VERSION): string {
  return \`/spec/v\${ver}/ossa-\${ver}.schema.json\`;
}
`;

  // Write version.ts
  fs.writeFileSync(versionTsPath, versionTsContent);
  console.log(`✅ Synced version ${version} to lib/version.ts (from ${source})`);
}

syncVersion().catch(error => {
  console.error('❌ Error syncing version:', error.message);
  process.exit(1);
});
