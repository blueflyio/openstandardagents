#!/usr/bin/env node

/**
 * Sync version from GitLab tags (source of truth) to lib/version.ts
 * Falls back to npm registry or package.json if GitLab is unreachable
 *
 * Run: npm run sync-version
 * Automatically runs on: npm run dev, npm run build
 *
 * IMPORTANT: This script only updates the website on major/minor releases,
 * not on patch releases. This prevents constant website updates for bug fixes.
 *
 * Priority:
 * 1. GitLab tags API (includes dev tags)
 * 2. npm registry (fallback)
 * 3. package.json (final fallback)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const GITLAB_PROJECT = 'blueflyio/ossa/openstandardagents';
const GITLAB_API_BASE = 'https://gitlab.com/api/v4';
const NPM_PACKAGE = '@bluefly/openstandardagents';
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const versionTsPath = path.join(__dirname, '..', 'lib', 'version.ts');
const versionsJsonPath = path.join(__dirname, '..', 'lib', 'versions.json');

// Check if we're in REVIEW/local environment
const isReviewEnv = process.env.REVIEW === 'true' || process.env.CI_ENVIRONMENT_NAME === 'review' || 
                    process.env.ORB === 'true' || process.env.ORBSTACK === 'true';

// Fetch latest tag from GitLab tags API
function fetchGitLabLatestTag() {
  return new Promise((resolve, reject) => {
    // Use WEB_TOKEN in CI (configured in GitLab CI/CD variables)
    // Falls back to CI_JOB_TOKEN, GITLAB_TOKEN for local/REVIEW env
    // WEB_TOKEN has cross-project access to openstandardagents project
    const token = process.env.WEB_TOKEN || process.env.CI_JOB_TOKEN || process.env.GITLAB_TOKEN || '';
    const projectPath = encodeURIComponent(GITLAB_PROJECT);
    const url = `${GITLAB_API_BASE}/projects/${projectPath}/repository/tags?per_page=100&order_by=updated&sort=desc`;
    
    const options = {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    };
    
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 404) {
            reject(new Error('Project not found or private - set GITLAB_TOKEN env var for authentication'));
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`GitLab API returned ${res.statusCode}: ${data.substring(0, 100)}`));
            return;
          }
          const tags = JSON.parse(data);
          
          if (!tags || tags.length === 0) {
            reject(new Error('No tags found'));
            return;
          }
          
          // Filter to stable versions (no -dev, -pre, -rc suffixes) or get latest dev tag if in REVIEW
          let stableTags = tags.filter(t => {
            const name = t.name.replace(/^v/, ''); // Remove 'v' prefix
            return !name.includes('-dev') && !name.includes('-pre') && !name.includes('-rc') && 
                   !name.includes('alpha') && !name.includes('beta');
          });
          
          // In REVIEW env, prefer dev tags, otherwise use stable
          if (isReviewEnv && stableTags.length === 0) {
            // Get latest dev tag
            const devTags = tags.filter(t => {
              const name = t.name.replace(/^v/, '');
              return name.includes('-dev');
            });
            if (devTags.length > 0) {
              stableTags = [devTags[0]]; // Use latest dev tag
            }
          }
          
          if (stableTags.length === 0) {
            // Fallback to first tag
            stableTags = [tags[0]];
          }
          
          // Get version without 'v' prefix
          const latestTag = stableTags[0];
          const version = latestTag.name.replace(/^v/, '');
          resolve(version);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

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
  let latestVersion;
  let source;
  let shouldUpdate = false;

  // Get current version from package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const currentVersion = packageJson.version;
  const [currentMajor, currentMinor] = currentVersion.split('.').map(Number);

  // Try GitLab tags first (includes dev tags, good for REVIEW env)
  try {
    latestVersion = await fetchGitLabLatestTag();
    const [latestMajor, latestMinor] = latestVersion.split('.').map(Number);
    
    // Only update if major or minor version changed (not patch)
    if (latestMajor > currentMajor || (latestMajor === currentMajor && latestMinor > currentMinor)) {
      shouldUpdate = true;
      source = `GitLab tags${isReviewEnv ? ' (REVIEW env)' : ''} (major/minor update)`;
      console.log(`📦 New major/minor version detected from GitLab: ${latestVersion} (was ${currentVersion})`);
    } else {
      // Keep current version, but use latest patch for display
      shouldUpdate = false;
      source = `GitLab tags${isReviewEnv ? ' (REVIEW env)' : ''} (patch only, no update needed)`;
      console.log(`📦 Latest GitLab tag ${latestVersion} is a patch release, keeping website at ${currentVersion}`);
      // Use current version for website, but latest for reference
      latestVersion = currentVersion;
    }
  } catch (gitlabError) {
    // Silently fall back to npm - GitLab might be unavailable
    // In CI, WEB_TOKEN should be configured for cross-project access to openstandardagents
    if (process.env.CI) {
      console.log(`ℹ️  GitLab tags API unavailable in CI (expected), using npm registry`);
    } else {
      console.log(`⚠️  GitLab tags API unreachable: ${gitlabError.message}`);
    }
    
    // Fallback to npm registry
    try {
      latestVersion = await fetchNpmVersion();
      const [latestMajor, latestMinor] = latestVersion.split('.').map(Number);
      
      if (latestMajor > currentMajor || (latestMajor === currentMajor && latestMinor > currentMinor)) {
        shouldUpdate = true;
        source = 'npm registry (major/minor update, fallback)';
        console.log(`📦 New major/minor version detected from npm: ${latestVersion} (was ${currentVersion})`);
      } else {
        shouldUpdate = false;
        source = 'npm registry (patch only, no update needed, fallback)';
        console.log(`📦 Latest npm version ${latestVersion} is a patch release, keeping website at ${currentVersion}`);
        latestVersion = currentVersion;
      }
    } catch (npmError) {
      // Final fallback to package.json
      latestVersion = currentVersion;
      source = 'package.json (fallback)';
      console.log(`⚠️  npm registry unreachable, using package.json: ${latestVersion}`);
    }
  }

  // Only update package.json if major/minor changed
  if (shouldUpdate && packageJson.version !== latestVersion) {
    packageJson.version = latestVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`📝 Updated package.json to ${latestVersion}`);
  }

  // Read versions.json if it exists
  let versionsData = { all: [], stable: latestVersion, dev: null };
  try {
    if (fs.existsSync(versionsJsonPath)) {
      versionsData = JSON.parse(fs.readFileSync(versionsJsonPath, 'utf8'));
      // Update stable version in versions.json
      versionsData.stable = latestVersion;
      versionsData.latest = latestVersion;
    }
  } catch (e) {
    // Ignore if versions.json doesn't exist yet
  }

  // Extract major.minor for display version
  const versionParts = latestVersion.split('.');
  const displayVersion = `${versionParts[0]}.${versionParts[1]}.x`;

  // Generate version.ts content
  const versionTsContent = `// OSSA version constants
// AUTO-GENERATED from ${source} - DO NOT EDIT DIRECTLY
// Run: npm run sync-version (fetches latest from GitLab tags or npm registry)
// NOTE: Website only updates on major/minor releases, not patches

import versionsData from './versions.json';

export const OSSA_VERSION = "${latestVersion}";
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

  // Always write version.ts (it may have updated version info even if we don't update package.json)
  fs.writeFileSync(versionTsPath, versionTsContent);
  
  if (shouldUpdate) {
    console.log(`✅ Updated website to version ${latestVersion} (from ${source})`);
  } else {
    console.log(`✅ Synced version info (no update needed - patch release only)`);
  }
}

syncVersion().catch(error => {
  console.error('❌ Error syncing version:', error.message);
  process.exit(1);
});
