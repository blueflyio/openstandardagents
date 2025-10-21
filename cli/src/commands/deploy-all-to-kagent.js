#!/usr/bin/env node

/**
 * Convert and deploy all OSSA agents to kagent.dev
 * Usage: node deploy-all-to-kagent.js [--dry-run] [--namespace default]
 */

import { exec } from 'child_process';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import yaml from 'yaml';
import { convertOSSAtoKagent } from './convert-to-kagent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const execAsync = promisify(exec);

async function deployAllAgents(options = {}) {
  const dryRun = options.dryRun || false;
  const namespace = options.namespace || 'default';
  const agentsDir = path.join(__dirname, '../../../.agents');

  const stats = {
    total: 0,
    converted: 0,
    deployed: 0,
    failed: 0,
    errors: [],
  };

  console.log('🚀 Deploying OSSA agents to kagent.dev');
  console.log(`   Namespace: ${namespace}`);
  console.log(`   Dry Run: ${dryRun}`);
  console.log('');

  // Find all agent.yml files
  const agentTypes = [
    'workers',
    'orchestrators',
    'monitors',
    'critics',
    'judges',
    'governors',
    'integrators',
  ];

  for (const type of agentTypes) {
    const typeDir = path.join(agentsDir, type);
    if (!fs.existsSync(typeDir)) continue;

    const agents = fs.readdirSync(typeDir);

    for (const agentName of agents) {
      const manifestPath = path.join(typeDir, agentName, 'agent.yml');
      if (!fs.existsSync(manifestPath)) continue;

      stats.total++;

      try {
        console.log(`📦 Converting: ${type}/${agentName}`);

        // Read and convert
        const ossaContent = fs.readFileSync(manifestPath, 'utf8');
        const ossaManifest = yaml.parse(ossaContent);

        const kagentAgent = convertOSSAtoKagent(ossaManifest);
        kagentAgent.metadata.namespace = namespace;

        stats.converted++;

        if (!dryRun) {
          // Write temporary file
          const tempFile = `/tmp/kagent-${agentName}.yaml`;
          fs.writeFileSync(tempFile, yaml.stringify(kagentAgent));

          // Deploy to Kubernetes
          try {
            await execAsync(`kubectl apply -f ${tempFile}`);
            console.log(`   ✅ Deployed: ${agentName}`);
            stats.deployed++;
          } catch (deployError) {
            console.log(`   ⚠️  Deploy failed: ${deployError.message}`);
            stats.failed++;
            stats.errors.push({ agent: agentName, error: deployError.message });
          }

          // Clean up temp file
          fs.unlinkSync(tempFile);
        } else {
          console.log(`   ✓ Would deploy: ${agentName}`);
        }
      } catch (error) {
        console.log(`   ❌ Conversion failed: ${error.message}`);
        stats.failed++;
        stats.errors.push({ agent: agentName, error: error.message });
      }
    }
  }

  // Summary
  console.log('');
  console.log('📊 Deployment Summary');
  console.log(`   Total agents found: ${stats.total}`);
  console.log(`   Successfully converted: ${stats.converted}`);
  console.log(`   Successfully deployed: ${stats.deployed}`);
  console.log(`   Failed: ${stats.failed}`);

  if (stats.errors.length > 0 && !dryRun) {
    console.log('');
    console.log('⚠️  Errors:');
    stats.errors.forEach((err) => {
      console.log(`   ${err.agent}: ${err.error}`);
    });
  }

  if (dryRun) {
    console.log('');
    console.log('ℹ️  This was a dry run. Use without --dry-run to deploy.');
  }

  return stats;
}

// CLI execution
const isMain = import.meta.url === `file://${process.argv[1]}`;

if (isMain) {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    namespace: args.includes('--namespace')
      ? args[args.indexOf('--namespace') + 1]
      : 'default',
  };

  deployAllAgents(options)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { deployAllAgents };

