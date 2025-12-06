#!/usr/bin/env node
/**
 * Fetch examples from main openstandardagents repo
 * This ensures the website always uses the latest examples from the source of truth
 *
 * Source: https://gitlab.com/blueflyio/openstandardagents
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const GITLAB_API = 'https://gitlab.com/api/v4';
// Use numeric project ID for reliable cross-project job token access
const PROJECT_ID = '76265294';  // blueflyio/openstandardagents
const EXAMPLES_PATH = 'examples';
const REF = 'main';

const outputFile = path.join(__dirname, '../public/examples.json');

// Map directories to 10 main categories
function getCategory(filePath) {
  const pathParts = filePath.toLowerCase().split('/');
  const topLevel = pathParts[0];

  // 1. Getting Started
  if (topLevel === 'getting-started' || topLevel === 'quickstart' || topLevel === 'minimal') {
    return 'Getting Started';
  }

  // 2. Framework Integration
  if (['langchain', 'crewai', 'openai', 'anthropic', 'autogen', 'langflow', 'langgraph', 'llamaindex', 'cursor', 'vercel'].includes(topLevel)) {
    return 'Framework Integration';
  }

  // 3. Agent Types
  if (topLevel === 'agent-manifests' || pathParts.includes('workers') || pathParts.includes('orchestrators') ||
      pathParts.includes('critics') || pathParts.includes('judges') || pathParts.includes('monitors') ||
      pathParts.includes('governors') || pathParts.includes('integrators')) {
    return 'Agent Types';
  }

  // 4. Production
  if (topLevel === 'production' || topLevel === 'enterprise' || filePath.includes('compliance')) {
    return 'Production';
  }

  // 5. Infrastructure
  if (topLevel === 'kagent' || topLevel === 'bridges' || filePath.includes('k8s') ||
      filePath.includes('kubernetes') || filePath.includes('docker') || filePath.includes('serverless')) {
    return 'Infrastructure';
  }

  // 6. Advanced Patterns
  if (topLevel === 'advanced' || filePath.includes('patterns') || filePath.includes('workflows') ||
      filePath.includes('model-router') || filePath.includes('smart-model')) {
    return 'Advanced Patterns';
  }

  // 7. Integration Patterns
  if (topLevel === 'integration-patterns' || topLevel === 'adk-integration' ||
      (topLevel === 'bridges' && !filePath.includes('k8s') && !filePath.includes('phase4'))) {
    return 'Integration Patterns';
  }

  // 8. OpenAPI Extensions
  if (topLevel === 'openapi-extensions' || filePath.includes('openapi')) {
    return 'OpenAPI Extensions';
  }

  // 9. Migration Guides
  if (topLevel === 'migration-guides') {
    return 'Migration Guides';
  }

  // 10. Spec Examples & Templates
  if (topLevel === 'spec-examples' || topLevel === 'templates' || topLevel === 'extensions' ||
      topLevel === 'common_npm' || topLevel === 'architecture' || topLevel === 'typescript' ||
      topLevel === 'drupal') {
    return 'Spec Examples & Templates';
  }

  return 'Getting Started';
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

// List files in a directory from GitLab (recursive)
async function listFilesRecursive(dirPath, allFiles = []) {
  const encodedPath = encodeURIComponent(dirPath);
  const url = `${GITLAB_API}/projects/${PROJECT_ID}/repository/tree?path=${encodedPath}&ref=${REF}&per_page=100&recursive=true`;

  try {
    const items = await fetchJson(url);

    if (!Array.isArray(items)) {
      console.error(`Failed to list ${dirPath}:`, items);
      return allFiles;
    }

    for (const item of items) {
      if (item.type === 'blob') {
        // Filter for example files
        const ext = path.extname(item.path).toLowerCase();
        if (['.yml', '.yaml', '.json', '.ts'].includes(ext) &&
            !item.name.startsWith('.') &&
            item.name !== '.gitlab-ci.yml') {
          allFiles.push(item);
        }
      }
    }
  } catch (error) {
    console.error(`Error listing ${dirPath}:`, error.message);
  }

  return allFiles;
}

async function main() {
  console.log('🔄 Fetching examples from blueflyio/openstandardagents (main branch)...\n');

  try {
    // List all example files
    const files = await listFilesRecursive(EXAMPLES_PATH);
    console.log(`Found ${files.length} example files\n`);

    const examples = [];

    // Fetch each file content
    for (const file of files) {
      console.log(`  Fetching ${file.path}...`);
      const content = await fetchFile(file.path);

      if (content !== null) {
        // Remove 'examples/' prefix for relative path
        const relativePath = file.path.replace(/^examples\//, '');

        examples.push({
          name: file.name,
          path: relativePath,
          content,
          category: getCategory(relativePath),
        });
      }
    }

    // Ensure public directory exists
    const publicDir = path.dirname(outputFile);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    fs.writeFileSync(outputFile, JSON.stringify(examples, null, 2));
    console.log(`\n✅ Generated ${outputFile} with ${examples.length} examples`);
  } catch (error) {
    console.error('❌ Error fetching examples:', error.message);
    process.exit(1);
  }
}

main();
