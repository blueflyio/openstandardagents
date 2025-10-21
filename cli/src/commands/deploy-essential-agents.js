#!/usr/bin/env node

/**
 * Deploy only essential agents to avoid resource exhaustion
 * Keeps cluster healthy with 20-30 most useful agents
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { convertOSSAtoKagent } from './convert-to-kagent.js';
import yaml from 'yaml';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execAsync = promisify(exec);

// Essential agents that should always run
const ESSENTIAL_AGENTS = {
  orchestrators: [
    'ossa-master-orchestrator',
    'ecosystem-tasks-orchestrator',
    'kubernetes-orchestrator'
  ],
  workers: [
    'drupal-module-developer',
    'drupal-migration-specialist',
    'openapi-3-1-generator',
    'graphql-schema-architect',
    'typescript-fixer',
    'gitlab-ci-optimizer',
    'docker-image-builder',
    'helm-chart-architect',
    'prometheus-metrics-specialist',
    'qdrant-vector-specialist',
    'redis-cluster-architect'
  ],
  integrators: [
    'api-connector',
    'rest-api-implementer',
    'graphql-schema-architect'
  ],
  monitors: [
    'ossa-compliance-monitor',
    'system-monitor'
  ],
  governors: [
    'ossa-policy-governor',
    'compliance-auditor'
  ]
};

async function deployEssentialAgents() {
  console.log('🎯 Deploying Essential Agents Only\n');
  console.log('Strategy: Deploy 20-30 most useful agents');
  console.log('Reason: Cluster service IP exhaustion (13.9GB RAM, limited IPs)\n');
  
  const namespace = 'default';
  const agentsDir = path.join(__dirname, '../../../.agents');
  
  const stats = {
    total: 0,
    deployed: 0,
    failed: 0,
    errors: []
  };
  
  for (const [type, agentNames] of Object.entries(ESSENTIAL_AGENTS)) {
    console.log(`\n📦 Deploying ${type}:`);
    
    for (const agentName of agentNames) {
      const manifestPath = path.join(agentsDir, type, agentName, 'agent.yml');
      
      if (!fs.existsSync(manifestPath)) {
        console.log(`   ⚠️  Not found: ${agentName}`);
        continue;
      }
      
      stats.total++;
      
      try {
        const ossaContent = fs.readFileSync(manifestPath, 'utf8');
        const ossaManifest = yaml.parse(ossaContent);
        
        const kagentAgent = convertOSSAtoKagent(ossaManifest);
        kagentAgent.metadata.namespace = namespace;
        
        // Override: Ensure replicas=1 for essential agents
        kagentAgent.spec.declarative.deployment.replicas = 1;
        
        const tempFile = `/tmp/kagent-${agentName}.yaml`;
        fs.writeFileSync(tempFile, yaml.stringify(kagentAgent));
        
        await execAsync(`kubectl apply -f ${tempFile}`);
        console.log(`   ✅ ${agentName}`);
        stats.deployed++;
        fs.unlinkSync(tempFile);
        
      } catch (error) {
        console.log(`   ❌ ${agentName}: ${error.message}`);
        stats.failed++;
        stats.errors.push({ agent: agentName, error: error.message });
      }
    }
  }
  
  console.log('\n📊 Deployment Summary:');
  console.log(`   Attempted: ${stats.total}`);
  console.log(`   Deployed: ${stats.deployed}`);
  console.log(`   Failed: ${stats.failed}`);
  
  if (stats.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    stats.errors.forEach(err => console.log(`   ${err.agent}: ${err.error}`));
  }
  
  console.log('\n💡 Next Steps:');
  console.log('   1. Wait 2-3 minutes for agents to become READY');
  console.log('   2. Check: kubectl get agents.kagent.dev -n default');
  console.log('   3. Use: open http://localhost:8082 (kagent dashboard)');
  console.log('\n✨ Essential agents deployed! Other 230+ agents available as CRDs (spawn on-demand)');
}

deployEssentialAgents().catch(console.error);

