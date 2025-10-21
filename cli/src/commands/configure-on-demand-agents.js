#!/usr/bin/env node

/**
 * Configure agents for on-demand scaling
 * Sets all agent deployments to 0 replicas by default
 * Agents scale up automatically when called
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function configureOnDemandAgents() {
  console.log('🎯 Configuring On-Demand Agent Scaling\n');

  try {
    // Get all agents
    const { stdout } = await execAsync(
      'kubectl get agents.kagent.dev -A -o json'
    );
    const data = JSON.parse(stdout);

    const stats = {
      total: data.items.length,
      configured: 0,
      keepRunning: [],
    };

    // Keep these essential agents always running
    const alwaysOn = [
      'k8s-agent',
      'helm-agent',
      'ecosystem-tasks-orchestrator',
      'kagent-controller',
      'kagent-ui',
      'kagent-tools',
    ];

    console.log(`📊 Found ${stats.total} agents`);
    console.log(
      `⚡ Keeping ${alwaysOn.length} essential agents always running\n`
    );

    for (const item of data.items) {
      const name = item.metadata.name;
      const ns = item.metadata.namespace;

      if (alwaysOn.includes(name)) {
        console.log(`✅ Keep running: ${name}`);
        stats.keepRunning.push(name);
        continue;
      }

      // Scale to 0 for on-demand
      const deployment = item.spec?.declarative?.deployment || {};
      if (deployment.replicas !== 0) {
        deployment.replicas = 0;

        // Update agent
        const tempFile = `/tmp/${name}-scaled.yaml`;
        const yaml = require('yaml');
        const fs = require('fs');

        fs.writeFileSync(tempFile, yaml.stringify(item));

        try {
          await execAsync(`kubectl apply -f ${tempFile}`);
          console.log(`⏸️  Dormant: ${name}`);
          stats.configured++;
          fs.unlinkSync(tempFile);
        } catch (err) {
          console.log(`❌ Failed: ${name}`);
        }
      }
    }

    console.log(`\n📊 Configuration Summary:`);
    console.log(`   Total agents: ${stats.total}`);
    console.log(`   Always running: ${stats.keepRunning.length}`);
    console.log(`   On-demand: ${stats.configured}`);
    console.log(`\n💡 To activate an agent:`);
    console.log(
      `   kubectl scale deployment <agent-name> --replicas=1 -n default`
    );
    console.log(`\n💡 Or use buildkit (when implemented):`);
    console.log(`   buildkit agents spawn <agent-name>`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

configureOnDemandAgents();
