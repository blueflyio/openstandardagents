/**
 * OSSA Agent Templates
 * Pre-built agent templates for common use cases
 */

import type { AgentTemplate } from '../types.js';
import { getApiVersion } from '../../../utils/version.js';

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'orchestrator:multi-agent-coordinator',
    name: 'Multi-Agent Coordinator',
    description: 'Orchestrates multiple agents in complex workflows',
    type: 'orchestrator',
    tags: ['multi-agent', 'coordination', 'workflow'],
    manifest: {
      apiVersion: getApiVersion(),
      kind: 'Agent',
      metadata: {
        name: 'multi-agent-coordinator',
        version: '1.0.0',
        description: 'Orchestrates and coordinates multiple agents',
      },
      spec: {
        role: 'You are an orchestrator agent that coordinates multiple specialized agents to solve complex problems.',
        llm: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          temperature: 0.7,
        },
        tools: [
          {
            type: 'mcp',
            name: 'agent-discovery',
            config: { server: 'npx -y @ossa/mcp-agent-discovery' },
          },
        ],
      },
    },
  },
  {
    id: 'worker:api-integrator',
    name: 'API Integrator',
    description: 'Integrates with external APIs and services',
    type: 'worker',
    tags: ['api', 'integration', 'http'],
    manifest: {
      apiVersion: getApiVersion(),
      kind: 'Agent',
      metadata: {
        name: 'api-integrator',
        version: '1.0.0',
        description: 'Integrates with external APIs and handles HTTP requests',
      },
      spec: {
        role: 'You are an API integration specialist that connects and synchronizes data between systems.',
        llm: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          temperature: 0.5,
        },
        tools: [
          {
            type: 'mcp',
            name: 'http',
            config: { server: 'npx -y @modelcontextprotocol/server-fetch' },
          },
        ],
      },
    },
  },
  {
    id: 'worker:data-processor',
    name: 'Data Processor',
    description: 'Processes and transforms data in batch or streaming mode',
    type: 'worker',
    tags: ['data', 'processing', 'etl'],
    manifest: {
      apiVersion: getApiVersion(),
      kind: 'Agent',
      metadata: {
        name: 'data-processor',
        version: '1.0.0',
        description: 'Processes and transforms data',
      },
      spec: {
        role: 'You are a data processing specialist that transforms and validates data.',
        llm: {
          provider: 'anthropic',
          model: 'claude-haiku-4-20250514',
          temperature: 0.3,
        },
        tools: [
          {
            type: 'mcp',
            name: 'filesystem',
            config: {
              server: 'npx -y @modelcontextprotocol/server-filesystem',
            },
          },
        ],
      },
    },
  },
  {
    id: 'reviewer:code-quality',
    name: 'Code Quality Reviewer',
    description: 'Reviews code for quality, security, and best practices',
    type: 'reviewer',
    tags: ['code-review', 'quality', 'security'],
    manifest: {
      apiVersion: getApiVersion(),
      kind: 'Agent',
      metadata: {
        name: 'code-quality-reviewer',
        version: '1.0.0',
        description: 'Reviews code for quality and security',
      },
      spec: {
        role: 'You are a code review expert that ensures code quality and security.',
        llm: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          temperature: 0.3,
        },
        tools: [
          {
            type: 'mcp',
            name: 'git',
            config: { server: 'npx -y @modelcontextprotocol/server-git' },
          },
        ],
      },
    },
  },
  {
    id: 'critic:performance-analyzer',
    name: 'Performance Analyzer',
    description: 'Analyzes and optimizes system performance',
    type: 'critic',
    tags: ['performance', 'optimization', 'analysis'],
    manifest: {
      apiVersion: getApiVersion(),
      kind: 'Agent',
      metadata: {
        name: 'performance-analyzer',
        version: '1.0.0',
        description: 'Analyzes and optimizes performance',
      },
      spec: {
        role: 'You are a performance expert that identifies bottlenecks and suggests optimizations.',
        llm: {
          provider: 'anthropic',
          model: 'claude-opus-4-20250514',
          temperature: 0.5,
        },
      },
    },
  },
  {
    id: 'monitor:system-health',
    name: 'System Health Monitor',
    description: 'Monitors system health and sends alerts',
    type: 'monitor',
    tags: ['monitoring', 'alerting', 'observability'],
    manifest: {
      apiVersion: getApiVersion(),
      kind: 'Agent',
      metadata: {
        name: 'system-health-monitor',
        version: '1.0.0',
        description: 'Monitors system health and sends alerts',
      },
      spec: {
        role: 'You are a monitoring specialist that tracks system health and sends alerts.',
        llm: {
          provider: 'google',
          model: 'gemini-2.0-flash-exp',
          temperature: 0.3,
        },
        observability: {
          tracing: {
            enabled: true,
            exporter: 'otlp',
            endpoint: '${OTEL_ENDPOINT:-http://localhost:4317}',
          },
          metrics: {
            enabled: true,
          },
        },
      },
    },
  },
  {
    id: 'planner:workflow-designer',
    name: 'Workflow Designer',
    description: 'Designs and optimizes workflows',
    type: 'planner',
    tags: ['workflow', 'planning', 'design'],
    manifest: {
      apiVersion: getApiVersion(),
      kind: 'Agent',
      metadata: {
        name: 'workflow-designer',
        version: '1.0.0',
        description: 'Designs and optimizes workflows',
      },
      spec: {
        role: 'You are a workflow design expert that creates efficient processes.',
        llm: {
          provider: 'anthropic',
          model: 'claude-opus-4-20250514',
          temperature: 0.7,
        },
      },
    },
  },
];

export function getTemplateById(id: string): AgentTemplate | undefined {
  return AGENT_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByType(type: string): AgentTemplate[] {
  return AGENT_TEMPLATES.filter((t) => t.type === type);
}

export function searchTemplates(query: string): AgentTemplate[] {
  const lowerQuery = query.toLowerCase();
  return AGENT_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}
