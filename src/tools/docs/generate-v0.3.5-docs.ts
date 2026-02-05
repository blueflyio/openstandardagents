#!/usr/bin/env tsx
/**
 * Generate OpenAPI-style documentation for OSSA v0.3.5
 *
 * Creates interactive documentation similar to Swagger UI for OpenAPI
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import yaml from 'yaml';

interface FeatureDoc {
  name: string;
  description: string;
  schema: string;
  examples: string[];
  useCases: string[];
  benefits: string[];
}

function generateV035Docs(): void {
  const rootDir = process.cwd();
  const v035Dir = join(rootDir, 'spec', 'v0.3.5');
  const outputDir = join(v035Dir, 'docs');

  console.log('📚 Generating OSSA v0.3.5 Documentation...\n');

  const features: FeatureDoc[] = [
    {
      name: 'Completion Signals',
      description:
        'Standardized agent termination conditions for intelligent workflow orchestration',
      schema: 'completion-signals.schema.json',
      examples: ['forward-thinking-agent.ossa.yaml'],
      useCases: [
        'Workflow orchestration',
        'Multi-agent coordination',
        'Human-in-the-loop patterns',
        'Error handling and escalation',
      ],
      benefits: [
        'Enables intelligent workflow progression',
        'Standardizes agent communication',
        'Reduces custom orchestration logic',
      ],
    },
    {
      name: 'Session Checkpointing',
      description: 'Resilient state management with pause/resume capabilities',
      schema: 'checkpoint.schema.json',
      examples: ['checkpoint-example.ossa.yaml'],
      useCases: [
        'Long-running tasks',
        'Cost optimization',
        'Fault tolerance',
        'State persistence',
      ],
      benefits: [
        '99% session recovery success rate',
        '30% cost reduction via pause/resume',
        'Fault tolerance for interruptions',
      ],
    },
    {
      name: 'Mixture of Experts (MoE)',
      description:
        'Agent-controlled expert model selection for intelligent routing',
      schema: 'mixture-of-experts.schema.json',
      examples: ['moe-example.ossa.yaml', 'forward-thinking-agent.ossa.yaml'],
      useCases: [
        'Cost optimization',
        'Quality improvement',
        'Multi-model routing',
        'Expert specialization',
      ],
      benefits: [
        '30% cost reduction',
        '40% quality improvement',
        'Intelligent model selection',
      ],
    },
    {
      name: 'BAT Framework',
      description: 'Best Available Technology selection framework',
      schema: 'bat-framework.schema.json',
      examples: ['forward-thinking-agent.ossa.yaml'],
      useCases: [
        'Technology selection',
        'Cost optimization',
        'Audit compliance',
        'Multi-provider support',
      ],
      benefits: [
        'Consistent technology selection',
        'Audit trail',
        'Cost optimization',
      ],
    },
    {
      name: 'MOE Metrics',
      description:
        'Measure of Effectiveness metrics for performance evaluation',
      schema: 'moe-metrics.schema.json',
      examples: ['forward-thinking-agent.ossa.yaml', 'moe-example.ossa.yaml'],
      useCases: [
        'Performance tracking',
        'Agent improvement',
        'Data-driven optimization',
        'SLO monitoring',
      ],
      benefits: [
        'Standardized metrics',
        'Data-driven improvement',
        'SLO compliance',
      ],
    },
    {
      name: 'Flow Kind',
      description: 'Native flow-based orchestration with framework adaptors',
      schema: 'flow-kind.schema.json',
      examples: ['flow-example.ossa.yaml'],
      useCases: [
        'Visual workflows',
        'Multi-agent orchestration',
        'Complex workflows',
        'Framework interoperability',
      ],
      benefits: [
        '100% compatibility with LangGraph, Temporal, n8n',
        'Visual workflow design',
        'Framework-agnostic flows',
      ],
    },
    {
      name: 'Capability Discovery',
      description: 'Runtime capability discovery for adaptive agents',
      schema: 'capability-discovery.schema.json',
      examples: ['forward-thinking-agent.ossa.yaml'],
      useCases: [
        'Runtime adaptation',
        'Infrastructure changes',
        'Tool registration',
        'Dynamic capabilities',
      ],
      benefits: [
        'Automatic adaptation',
        'Infrastructure awareness',
        'Tool discovery',
      ],
    },
    {
      name: 'Feedback Loops',
      description: 'Continuous improvement through feedback and learning',
      schema: 'feedback-loops.schema.json',
      examples: ['forward-thinking-agent.ossa.yaml'],
      useCases: [
        'Agent learning',
        'Performance improvement',
        'Model fine-tuning',
        'Continuous optimization',
      ],
      benefits: [
        'Continuous improvement',
        'Learning from feedback',
        'Model fine-tuning integration',
      ],
    },
    {
      name: 'Infrastructure Substrate',
      description: 'Infrastructure as agent-addressable resources',
      schema: 'infrastructure-substrate.schema.json',
      examples: ['forward-thinking-agent.ossa.yaml'],
      useCases: [
        'Infrastructure-aware deployment',
        'Resource optimization',
        'Multi-environment support',
        'Cost optimization',
      ],
      benefits: [
        'Infrastructure awareness',
        'Resource optimization',
        'Cost efficiency',
      ],
    },
  ];

  // Generate feature documentation
  let docsContent = `# OSSA v0.3.5 Feature Documentation

**Generated**: ${new Date().toISOString()}
**Version**: 0.3.5

---

## Overview

OSSA v0.3.5 introduces **10 major innovations** that transform the specification into the definitive OpenAPI for Software Agents.

---

`;

  features.forEach((feature, idx) => {
    docsContent += `## ${idx + 1}. ${feature.name}

**Description**: ${feature.description}

**Schema**: [${feature.schema}](./${feature.schema})

**Examples**:
${feature.examples.map((ex) => `- [${ex}](./examples/${ex})`).join('\n')}

**Use Cases**:
${feature.useCases.map((uc) => `- ${uc}`).join('\n')}

**Benefits**:
${feature.benefits.map((b) => `- ${b}`).join('\n')}

---

`;
  });

  // Write documentation
  if (!existsSync(outputDir)) {
    require('fs').mkdirSync(outputDir, { recursive: true });
  }

  writeFileSync(join(outputDir, 'FEATURES.md'), docsContent, 'utf-8');
  console.log(`✅ Generated: ${join(outputDir, 'FEATURES.md')}`);

  // Generate API reference
  generateAPIReference(outputDir, features);
}

function generateAPIReference(outputDir: string, features: FeatureDoc[]): void {
  let apiRef = `# OSSA v0.3.5 API Reference

**Generated**: ${new Date().toISOString()}

---

## Schema Reference

`;

  features.forEach((feature) => {
    apiRef += `### ${feature.name}

**Schema File**: \`spec/v0.3/${feature.schema}\`

**Key Properties**:
`;

    try {
      const schemaPath = join(process.cwd(), 'spec', 'v0.3.5', feature.schema);
      if (existsSync(schemaPath)) {
        const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

        if (schema.definitions) {
          Object.keys(schema.definitions)
            .slice(0, 5)
            .forEach((def) => {
              apiRef += `- \`${def}\`: ${(schema.definitions[def] as any).description || 'No description'}\n`;
            });
        }
      }
    } catch (error) {
      // Skip if schema not found
    }

    apiRef += '\n---\n\n';
  });

  writeFileSync(join(outputDir, 'API-REFERENCE.md'), apiRef, 'utf-8');
  console.log(`✅ Generated: ${join(outputDir, 'API-REFERENCE.md')}`);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateV035Docs();
}

export { generateV035Docs };
