#!/usr/bin/env node

/**
 * Convert OSSA agent manifest to kagent.dev Agent CRD
 * Usage: node convert-to-kagent.js <ossa-manifest.yml> [output.yaml]
 */

import fs from 'fs';
import yaml from 'yaml';

function convertOSSAtoKagent(ossaManifest) {
  const agent = ossaManifest.agent;
  
  // Build kagent.dev Agent CRD
  const kagentAgent = {
    apiVersion: 'kagent.dev/v1alpha2',
    kind: 'Agent',
    metadata: {
      name: agent.id,
      labels: {
        'app.kubernetes.io/name': agent.id,
        'app.kubernetes.io/instance': agent.id,
        'app.kubernetes.io/version': agent.version,
        'ossa.io/role': agent.role,
        'ossa.io/compliant': 'true'
      },
      annotations: {
        'ossa.io/original-version': ossaManifest.ossaVersion,
        'ossa.io/agent-name': agent.name,
        'ossa.io/description': agent.description || ''
      }
    },
    spec: {
      declarative: {
        deployment: {
          replicas: agent.bridge?.kagent?.deployment?.replicas || 1,
          resources: agent.bridge?.kagent?.deployment?.resources || {
            requests: {
              cpu: agent.runtime?.resources?.cpu || '100m',
              memory: agent.runtime?.resources?.memory || '256Mi'
            },
            limits: {
              cpu: '1000m',
              memory: '1Gi'
            }
          }
        },
        modelConfig: agent.bridge?.kagent?.model_config || 'default-model-config',
        systemMessage: agent.bridge?.kagent?.system_message || buildSystemMessage(agent),
        tools: agent.bridge?.kagent?.tools || buildDefaultTools(agent),
        a2aConfig: agent.bridge?.kagent?.a2a_config || buildA2AConfig(agent)
      }
    }
  };
  
  return kagentAgent;
}

function buildSystemMessage(agent) {
  return `# ${agent.name}

You are ${agent.name}, a specialized AI agent for ${agent.role}.

${agent.description || ''}

Your capabilities include:
${agent.capabilities.map(cap => `- ${cap.name}: ${cap.description}`).join('\n')}

Follow best practices and always prioritize safety and security.`;
}

function buildDefaultTools(agent) {
  // Map OSSA capabilities to kagent tools
  // NOTE: kagent.dev v1alpha2 uses 'name' not 'toolServer'
  const tools = [];

  if (agent.role === 'orchestration' || agent.role === 'workflow') {
    tools.push({
      type: 'McpServer',
      mcpServer: {
        name: 'kagent-tools', // Fixed: use 'name' not 'toolServer'
        toolNames: ['k8s_get_resources', 'k8s_apply_manifest'],
      },
    });
  }

  return tools;
}

function buildA2AConfig(agent) {
  return {
    skills: agent.capabilities.map(cap => ({
      id: cap.name.replace(/_/g, '-'),
      name: cap.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      description: cap.description,
      examples: cap.examples?.map(ex => ex.name) || [],
      tags: agent.tags || []
    }))
  };
}

// Main execution
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if running as main module
const isMain = import.meta.url === `file://${process.argv[1]}`;

if (isMain) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node convert-to-kagent.js <ossa-manifest.yml> [output.yaml]');
    process.exit(1);
  }
  
  const inputPath = args[0];
  const outputPath = args[1] || inputPath.replace('.yml', '.kagent.yaml').replace('.yaml', '.kagent.yaml');
  
  try {
    // Read OSSA manifest
    const ossaContent = fs.readFileSync(inputPath, 'utf8');
    const ossaManifest = yaml.parse(ossaContent);
    
    // Validate OSSA version
    if (!ossaManifest.ossaVersion) {
      throw new Error('Invalid OSSA manifest: missing ossaVersion');
    }
    
    // Convert to kagent
    const kagentAgent = convertOSSAtoKagent(ossaManifest);
    
    // Write output
    const outputContent = yaml.stringify(kagentAgent);
    fs.writeFileSync(outputPath, outputContent);
    
    console.log(`✓ Converted ${inputPath} → ${outputPath}`);
    console.log(`✓ Agent: ${kagentAgent.metadata.name}`);
    console.log(`✓ Tools: ${kagentAgent.spec.declarative.tools?.length || 0}`);
    console.log(`✓ Skills: ${kagentAgent.spec.declarative.a2aConfig?.skills?.length || 0}`);
    console.log('\nDeploy with:');
    console.log(`  kubectl apply -f ${outputPath}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

export { convertOSSAtoKagent };

