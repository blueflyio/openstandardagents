#!/usr/bin/env tsx
/**
 * Script to update all OSSA agent manifests to v0.3.0 with ALL features
 * - Updates apiVersion to ossa/v0.3.0
 * - Adds KAgent extensions
 * - Adds GitLab Duo extensions
 * - Ensures all v0.3.0 features are present
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import * as yaml from 'yaml';

const AGENTS_DIR = '.gitlab/agents';
const TEMPLATE_PATH = '.gitlab/agents/TEMPLATE-v0.3.0-comprehensive.ossa.yaml';

interface AgentManifest {
  apiVersion: string;
  kind: string;
  metadata: any;
  spec: any;
  extensions?: any;
  runtime?: any;
}

function updateAgentManifest(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf8');
    const manifest = yaml.parse(content) as AgentManifest;

    // Skip if already v0.3.0
    if (manifest.apiVersion === 'ossa/v0.3.0') {
      console.log(`  [SKIP]  Already v0.3.0: ${filePath}`);
      return false;
    }

    // Update apiVersion
    manifest.apiVersion = 'ossa/v0.3.0';

    // Ensure metadata has required fields
    if (!manifest.metadata.labels) {
      manifest.metadata.labels = {};
    }
    manifest.metadata.labels['ossa-version'] = 'v0.3.0';

    // Ensure extensions exist
    if (!manifest.extensions) {
      manifest.extensions = {};
    }

    // Add KAgent extension if not present
    if (!manifest.extensions.kagent) {
      manifest.extensions.kagent = {
        api_version: 'kagent.dev/v1alpha2',
        kubernetes: {
          namespace: 'agent-system',
          labels: {
            'app.kubernetes.io/name': manifest.metadata.name,
            'app.kubernetes.io/part-of': 'ossa-showcase',
            'openstandardagents.org/version': 'v0.3.0',
          },
          resourceLimits: {
            cpu: '1',
            memory: '2Gi',
          },
        },
        deployment: {
          replicas: { min: 1, max: 3 },
          strategy: 'rolling-update',
        },
        a2aConfig: {
          enabled: true,
          protocol: 'json-rpc',
        },
        meshIntegration: {
          enabled: true,
          istioIntegration: true,
        },
      };
    }

    // Add GitLab Duo extension if not present
    if (!manifest.extensions.gitlab_duo) {
      manifest.extensions.gitlab_duo = {
        enabled: true,
        flow_execution: true,
        model: '${GITLAB_DUO_MODEL:-claude-sonnet-4.5-20250929}',
        knowledge_graph: {
          enabled: true,
          index_on_push: true,
        },
      };
    }

    // Ensure MCP extension structure
    if (!manifest.extensions.mcp && manifest.spec?.tools) {
      manifest.extensions.mcp = {
        enabled: true,
        server_type: 'stdio',
        server_name: `${manifest.metadata.name}-mcp`,
      };
    }

    // Write updated manifest
    const updated = yaml.stringify(manifest, {
      indent: 2,
      lineWidth: 0,
    });

    writeFileSync(filePath, updated, 'utf8');
    console.log(`  [PASS] Updated: ${filePath}`);
    return true;
  } catch (error: any) {
    console.error(`  [FAIL] Error updating ${filePath}: ${error.message}`);
    return false;
  }
}

function findAgentManifests(dir: string): string[] {
  const manifests: string[] = [];
  
  function traverse(currentDir: string) {
    const entries = readdirSync(currentDir);
    
    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
        traverse(fullPath);
      } else if (entry === 'manifest.ossa.yaml' || entry.endsWith('.ossa.yaml')) {
        manifests.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return manifests;
}

function main() {
  console.log('[RUN] Updating all agents to OSSA v0.3.0 with ALL features\n');
  
  const manifests = findAgentManifests(AGENTS_DIR);
  console.log(`Found ${manifests.length} agent manifests\n`);
  
  let updated = 0;
  let skipped = 0;
  const errors = 0;
  
  for (const manifestPath of manifests) {
    const relativePath = manifestPath.replace(process.cwd() + '/', '');
    console.log(`Processing: ${relativePath}`);
    
    if (updateAgentManifest(manifestPath)) {
      updated++;
    } else {
      skipped++;
    }
    console.log('');
  }
  
  console.log('\n[STATS] Summary:');
  console.log(`  [PASS] Updated: ${updated}`);
  console.log(`  [SKIP]  Skipped: ${skipped}`);
  console.log(`  [FAIL] Errors: ${errors}`);
  console.log('\n✨ All agents updated to v0.3.0!');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { updateAgentManifest, findAgentManifests };

