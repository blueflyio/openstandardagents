#!/usr/bin/env ts-node

/**
 * Generate All Missing Agents
 * Uses the OSSA agent-builder to create the 60 missing specialist agents
 */

import { createAgent } from './src/cli/commands/agent-builder.js';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_DIR = resolve(__dirname, '.agents');

interface AgentDefinition {
  name: string;
  type: 'worker' | 'orchestrator' | 'critic';
  category: string;
}

const MISSING_AGENTS: AgentDefinition[] = [
  // Documentation Agents (10)
  { name: 'api-docs-generator', type: 'worker', category: 'documentation' },
  { name: 'architecture-diagram-creator', type: 'worker', category: 'documentation' },
  { name: 'user-guide-writer', type: 'worker', category: 'documentation' },
  { name: 'developer-docs-specialist', type: 'worker', category: 'documentation' },
  { name: 'changelog-automator', type: 'worker', category: 'documentation' },
  { name: 'readme-optimizer', type: 'worker', category: 'documentation' },
  { name: 'code-comment-analyzer', type: 'worker', category: 'documentation' },
  { name: 'tutorial-content-creator', type: 'worker', category: 'documentation' },
  { name: 'api-example-generator', type: 'worker', category: 'documentation' },
  { name: 'knowledge-base-curator', type: 'worker', category: 'documentation' },

  // Deployment & DevOps Agents (10)
  { name: 'gitlab-ci-optimizer', type: 'worker', category: 'devops' },
  { name: 'docker-image-builder', type: 'worker', category: 'devops' },
  { name: 'kubernetes-manifest-generator', type: 'worker', category: 'devops' },
  { name: 'helm-chart-architect', type: 'worker', category: 'devops' },
  { name: 'terraform-iac-specialist', type: 'worker', category: 'devops' },
  { name: 'ansible-playbook-writer', type: 'worker', category: 'devops' },
  { name: 'argocd-gitops-expert', type: 'worker', category: 'devops' },
  { name: 'registry-management-specialist', type: 'worker', category: 'devops' },
  { name: 'blue-green-deployment-manager', type: 'worker', category: 'devops' },
  { name: 'rollback-automation-expert', type: 'worker', category: 'devops' },

  // Monitoring & Observability Agents (9)
  { name: 'phoenix-integration-specialist', type: 'worker', category: 'observability' },
  { name: 'opentelemetry-instrumentor', type: 'worker', category: 'observability' },
  { name: 'distributed-tracing-expert', type: 'worker', category: 'observability' },
  { name: 'metrics-dashboard-designer', type: 'worker', category: 'observability' },
  { name: 'alert-rule-configurator', type: 'worker', category: 'observability' },
  { name: 'log-aggregation-specialist', type: 'worker', category: 'observability' },
  { name: 'slo-sli-calculator', type: 'worker', category: 'observability' },
  { name: 'anomaly-detection-analyst', type: 'worker', category: 'observability' },
  { name: 'incident-response-coordinator', type: 'orchestrator', category: 'observability' },

  // Nx Integration Agents (16)
  { name: 'nx-agent-brain', type: 'worker', category: 'nx' },
  { name: 'nx-agent-tracer', type: 'worker', category: 'nx' },
  { name: 'nx-agent-chat', type: 'worker', category: 'nx' },
  { name: 'nx-compliance-engine', type: 'worker', category: 'nx' },
  { name: 'nx-agent-router', type: 'worker', category: 'nx' },
  { name: 'nx-agent-studio', type: 'worker', category: 'nx' },
  { name: 'nx-agent-protocol', type: 'worker', category: 'nx' },
  { name: 'nx-foundation-bridge', type: 'worker', category: 'nx' },
  { name: 'nx-studio-ui', type: 'worker', category: 'nx' },
  { name: 'nx-agentic-flows', type: 'worker', category: 'nx' },
  { name: 'nx-agent-docker', type: 'worker', category: 'nx' },
  { name: 'nx-agent-mesh', type: 'worker', category: 'nx' },
  { name: 'nx-doc-engine', type: 'worker', category: 'nx' },
  { name: 'nx-workflow-engine', type: 'worker', category: 'nx' },
  { name: 'nx-rfp-automation', type: 'worker', category: 'nx' },
  { name: 'nx-agent-ops', type: 'worker', category: 'nx' },

  // Drupal Integration Agents (5)
  { name: 'drupal-module-analyzer', type: 'worker', category: 'drupal' },
  { name: 'drupal-recipe-builder', type: 'worker', category: 'drupal' },
  { name: 'drupal-theme-architect', type: 'worker', category: 'drupal' },
  { name: 'drupal-migration-specialist', type: 'worker', category: 'drupal' },
  { name: 'drupal-api-integrator', type: 'worker', category: 'drupal' },

  // Additional Specialists (10)
  { name: 'cost-optimization-analyst', type: 'worker', category: 'specialist' },
  { name: 'dependency-update-manager', type: 'worker', category: 'specialist' },
  { name: 'license-compliance-checker', type: 'worker', category: 'specialist' },
  { name: 'code-quality-enforcer', type: 'worker', category: 'specialist' },
  { name: 'migration-planning-specialist', type: 'worker', category: 'specialist' },
  { name: 'disaster-recovery-planner', type: 'worker', category: 'specialist' },
  { name: 'capacity-planning-analyst', type: 'worker', category: 'specialist' },
  { name: 'sre-best-practices-auditor', type: 'worker', category: 'specialist' },
  { name: 'vendor-integration-specialist', type: 'worker', category: 'specialist' },
  { name: 'technical-debt-tracker', type: 'worker', category: 'specialist' }
];

async function generateAllAgents() {
  console.log(`\n🚀 Generating ${MISSING_AGENTS.length} missing agents...\n`);

  let successCount = 0;
  let failureCount = 0;

  for (const agent of MISSING_AGENTS) {
    try {
      await createAgent(agent.name, {
        type: agent.type,
        output: join(OUTPUT_DIR, `${agent.type}s`),
        template: 'default'
      });
      console.log(`✅ Created: ${agent.name} (${agent.category})`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed: ${agent.name} - ${error.message}`);
      failureCount++;
    }
  }

  console.log(`\n📊 Generation Complete:`);
  console.log(`   ✅ Success: ${successCount}/${MISSING_AGENTS.length}`);
  console.log(`   ❌ Failures: ${failureCount}/${MISSING_AGENTS.length}`);
  console.log(`\n🎯 Total Agents: ${40 + successCount}/100\n`);
}

// Execute
generateAllAgents().catch(console.error);
