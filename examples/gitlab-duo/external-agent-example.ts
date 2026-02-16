/**
 * Example: GitLab Duo External Agent Generation
 *
 * Demonstrates generating external agent YAML configurations from OSSA manifests.
 * External agents run in GitLab CI/CD pipelines and use AI Gateway for model access.
 */

import { ExternalAgentGenerator } from '../../src/adapters/gitlab/external-agent-generator.js';
import type { OssaAgent } from '../../src/types/index.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

const generator = new ExternalAgentGenerator();

// Example 1: Node.js webhook agent with AI Gateway
const webhookAgent: OssaAgent = {
  apiVersion: 'ossa/v0.4.4',
  kind: 'Agent',
  metadata: {
    name: 'mr-reviewer',
    version: '1.0.0',
    description: 'Comprehensive MR review agent with AI Gateway integration',
  },
  spec: {
    role: 'You are an expert code reviewer',
    llm: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      temperature: 0.2,
      maxTokens: 16384,
    },
    runtime: {
      type: 'webhook',
      port: 9090,
      path: '/webhook/mr-reviewer',
    },
    workflow: {
      steps: [
        {
          id: 'fetch-changes',
          action: 'tool-invoke',
          tool: 'getMRChanges',
          params: {
            projectId: '${PROJECT_ID}',
            mrIid: '${MR_IID}',
          },
        },
      ],
    },
    tools: [
      { name: 'getMRChanges', description: 'Get MR changes' },
      { name: 'postMRComment', description: 'Post review comment' },
    ],
  },
};

// Example 2: Python agent with custom image
const pythonAgent: OssaAgent = {
  apiVersion: 'ossa/v0.4.4',
  kind: 'Agent',
  metadata: {
    name: 'data-analyzer',
    version: '1.0.0',
    description: 'Python-based data analysis agent',
  },
  spec: {
    role: 'You are a data analysis expert',
    llm: {
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.5,
      maxTokens: 8192,
    },
    runtime: {
      type: 'python',
    },
    tools: [],
  },
};

// Example 3: Go agent with custom commands
const goAgent: OssaAgent = {
  apiVersion: 'ossa/v0.4.4',
  kind: 'Agent',
  metadata: {
    name: 'security-scanner',
    version: '1.0.0',
    description: 'Go-based security scanner',
  },
  spec: {
    role: 'You are a security expert',
    llm: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
    },
    runtime: {
      type: 'go',
      command: ['go build -o scanner .', './scanner --mode=full'],
    },
    tools: [],
  },
};

// Example 4: Agent with custom variables
const customVarsAgent: OssaAgent = {
  apiVersion: 'ossa/v0.4.4',
  kind: 'Agent',
  metadata: {
    name: 'deployment-agent',
    version: '1.0.0',
    description: 'Deployment automation agent with custom variables',
  },
  spec: {
    role: 'You are a deployment expert',
    llm: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
    },
    tools: [
      {
        name: 'deploy-service',
        auth: {
          type: 'bearer',
          credentials: 'DEPLOY_TOKEN',
        },
      },
    ],
  },
  extensions: {
    gitlab: {
      variables: ['KUBERNETES_CONTEXT', 'HELM_VERSION'],
    },
  },
};

// Generate external agent configurations
console.log('='.repeat(80));
console.log('GitLab Duo External Agent Generator - Examples');
console.log('='.repeat(80));
console.log();

const examples = [
  { name: 'webhook-agent', manifest: webhookAgent },
  { name: 'python-agent', manifest: pythonAgent },
  { name: 'go-agent', manifest: goAgent },
  { name: 'custom-vars-agent', manifest: customVarsAgent },
];

for (const { name, manifest } of examples) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Example: ${name}`);
  console.log('='.repeat(80));

  const result = generator.generate(manifest);

  if (!result.success) {
    console.error(`ERROR: ${result.error}`);
    continue;
  }

  console.log('\nConfiguration:');
  console.log(JSON.stringify(result.config, null, 2));

  console.log('\nGenerated YAML:');
  console.log(result.yaml);

  // Optionally save to file
  const outputPath = join(
    process.cwd(),
    'examples/gitlab-duo/generated',
    `${name}.yaml`
  );
  try {
    writeFileSync(outputPath, result.yaml!);
    console.log(`\n✓ Saved to: ${outputPath}`);
  } catch (error) {
    console.log(`\n✗ Could not save to: ${outputPath}`);
  }
}

console.log('\n' + '='.repeat(80));
console.log('External Agent Generation Complete');
console.log('='.repeat(80));
console.log();
console.log('Next steps:');
console.log('1. Register agent: glab duo agent register <agent-name>.yaml');
console.log('2. Test agent: glab duo agent test <agent-name>');
console.log('3. Deploy agent: Agent runs in GitLab CI/CD when triggered');
console.log();
console.log('Documentation:');
console.log('https://docs.gitlab.com/ee/user/gitlab_duo/external_agents.html');
console.log();
