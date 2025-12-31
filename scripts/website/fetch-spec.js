#!/usr/bin/env node
/**
 * Fetch spec folder from main openstandardagents repo
 * This ensures the website always uses the latest spec from the source of truth
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GITLAB_API = 'https://gitlab.com/api/v4';
// Use numeric project ID for reliable cross-project job token access
const PROJECT_ID = '76265294';  // blueflyio/openstandardagents
const SPEC_PATH = 'spec';
const REF = 'main';

const SPEC_DIR = path.join(__dirname, '../../spec');
const SCHEMAS_DIR = path.join(__dirname, '../../website/public/schemas');

// Ensure directories exist
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Get auth headers for GitLab API
function getAuthHeaders() {
  const headers = {};
  // WEB_TOKEN is a project access token for cross-project access
  const token = process.env.WEB_TOKEN || process.env.GITLAB_TOKEN;
  if (token) {
    headers['PRIVATE-TOKEN'] = token;
  }
  return headers;
}

// Fetch JSON from GitLab API
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const headers = getAuthHeaders();

    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON from ${url}: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

// Fetch file content from GitLab
function fetchFile(filePath) {
  const encodedPath = encodeURIComponent(filePath);
  const url = `${GITLAB_API}/projects/${PROJECT_ID}/repository/files/${encodedPath}/raw?ref=${REF}`;

  return new Promise((resolve, reject) => {
    const headers = getAuthHeaders();

    https.get(url, { headers }, (res) => {
      if (res.statusCode === 404) {
        resolve(null);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// List files in a directory from GitLab
async function listFiles(dirPath) {
  const encodedPath = encodeURIComponent(dirPath);
  const url = `${GITLAB_API}/projects/${PROJECT_ID}/repository/tree?path=${encodedPath}&ref=${REF}&per_page=100`;
  return fetchJson(url);
}

// Recursively fetch directory
async function fetchDirectory(remotePath, localPath) {
  ensureDir(localPath);

  const items = await listFiles(remotePath);

  if (!Array.isArray(items)) {
    console.error(`Failed to list ${remotePath}:`, items);
    return;
  }

  for (const item of items) {
    const localItemPath = path.join(localPath, item.name);
    const remoteItemPath = `${remotePath}/${item.name}`;

    if (item.type === 'tree') {
      await fetchDirectory(remoteItemPath, localItemPath);
    } else if (item.type === 'blob') {
      console.log(`  Fetching ${remoteItemPath}...`);
      const content = await fetchFile(remoteItemPath);
      if (content !== null) {
        fs.writeFileSync(localItemPath, content);
      }
    }
  }
}

// Copy latest schema to public/schemas
function copyLatestSchema() {
  ensureDir(SCHEMAS_DIR);

  // Find latest version
  const versions = fs.readdirSync(SPEC_DIR)
    .filter(f => f.startsWith('v') && fs.statSync(path.join(SPEC_DIR, f)).isDirectory())
    .sort((a, b) => {
      // Sort by semver
      const parseVersion = v => v.replace('v', '').split(/[-.]/).map(n => parseInt(n) || 0);
      const aParts = parseVersion(a);
      const bParts = parseVersion(b);
      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        if ((aParts[i] || 0) !== (bParts[i] || 0)) {
          return (bParts[i] || 0) - (aParts[i] || 0);
        }
      }
      return 0;
    });

  if (versions.length === 0) {
    console.log('No versions found in spec/');
    return;
  }

  const latestVersion = versions[0];
  console.log(`Latest version: ${latestVersion}`);

  // Copy schema files
  const versionDir = path.join(SPEC_DIR, latestVersion);
  const files = fs.readdirSync(versionDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const src = path.join(versionDir, file);
    const dest = path.join(SCHEMAS_DIR, file);
    fs.copyFileSync(src, dest);
    console.log(`  Copied ${file} to public/schemas/`);
  }
}

// Validate schema structure to prevent breaking changes
function validateSchemaStructure() {
  const agentSchemaPath = path.join(SCHEMAS_DIR, 'agent.json');
  if (fs.existsSync(agentSchemaPath)) {
    try {
      const schema = JSON.parse(fs.readFileSync(agentSchemaPath, 'utf-8'));
      if (!schema.properties || !schema.properties.apiVersion || !schema.properties.kind) {
        throw new Error('Agent schema missing required properties (apiVersion, kind)');
      }
      console.log('  ✅ Agent schema structure valid');
    } catch (error) {
      console.error('  ❌ Agent schema validation failed:', error.message);
      throw error;
    }
  }
}

async function main() {
  console.log('🔄 Fetching spec from blueflyio/openstandardagents (main branch)...\n');

  try {
    // Clean existing spec dir
    if (fs.existsSync(SPEC_DIR)) {
      fs.rmSync(SPEC_DIR, { recursive: true });
    }

    // Fetch spec directory
    await fetchDirectory(SPEC_PATH, SPEC_DIR);

    console.log('\n✅ Spec fetched successfully');

    // Copy latest schema to public
    console.log('\n📋 Copying latest schema to public/schemas/...');
    copyLatestSchema();

    // Validate schema structure
    console.log('\n🔍 Validating schema structure...');
    validateSchemaStructure();

    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error fetching spec:', error.message);
    process.exit(1);
  }
}

main();
