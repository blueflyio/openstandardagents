#!/usr/bin/env node

/**
 * Use kagent k8s-agent to clean up unused pods and resources
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function cleanupWithKagent() {
  console.log('🧹 Using kagent k8s-agent for intelligent cleanup\n');
  
  try {
    // Step 1: Get k8s-agent to analyze cluster
    console.log('📊 Step 1: Analyzing cluster state...');
    const { stdout: pods } = await execAsync('kubectl get pods -A --field-selector=status.phase=Pending -o json');
    const pendingPods = JSON.parse(pods);
    
    console.log(`   Found ${pendingPods.items?.length || 0} pending pods`);
    
    // Step 2: Get agents that are not READY
    console.log('\n📊 Step 2: Finding non-ready agents...');
    const { stdout: agents } = await execAsync('kubectl get agents.kagent.dev -A -o json');
    const agentsList = JSON.parse(agents);
    
    const notReadyAgents = agentsList.items.filter(agent => {
      const readyCondition = agent.status?.conditions?.find(c => c.type === 'Ready');
      return readyCondition?.status !== 'True';
    });
    
    console.log(`   Found ${notReadyAgents.length} not-ready agents`);
    
    // Step 3: Delete old pending pods (>10 minutes old)
    console.log('\n🗑️  Step 3: Cleaning up old pending pods...');
    let deletedPods = 0;
    
    for (const pod of pendingPods.items || []) {
      const podAge = new Date() - new Date(pod.metadata.creationTimestamp);
      const ageMinutes = podAge / 1000 / 60;
      
      if (ageMinutes > 10) {
        try {
          await execAsync(`kubectl delete pod ${pod.metadata.name} -n ${pod.metadata.namespace} --grace-period=0 --force`);
          console.log(`   ✓ Deleted: ${pod.metadata.name} (${ageMinutes.toFixed(0)}m old)`);
          deletedPods++;
        } catch (err) {
          console.log(`   ✗ Failed to delete: ${pod.metadata.name}`);
        }
      }
    }
    
    // Step 4: Scale down non-essential agents
    console.log('\n📉 Step 4: Scaling down non-ready agents...');
    let scaledDown = 0;
    
    for (const agent of notReadyAgents.slice(0, 50)) { // Limit to 50 to free resources
      if (agent.metadata.name.startsWith('nx-')) { // These are test agents, safe to remove
        try {
          await execAsync(`kubectl delete agent ${agent.metadata.name} -n ${agent.metadata.namespace}`);
          console.log(`   ✓ Deleted test agent: ${agent.metadata.name}`);
          scaledDown++;
        } catch (err) {
          console.log(`   ✗ Failed: ${agent.metadata.name}`);
        }
      }
    }
    
    console.log('\n📊 Cleanup Summary:');
    console.log(`   Deleted pods: ${deletedPods}`);
    console.log(`   Scaled down agents: ${scaledDown}`);
    console.log(`   Freed resources for: ~${scaledDown} new agents`);
    
  } catch (error) {
    console.error('Error during cleanup:', error.message);
    process.exit(1);
  }
}

cleanupWithKagent();

