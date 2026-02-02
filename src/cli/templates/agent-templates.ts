/**
 * Agent Templates for OSSA Wizard
 *
 * Pre-configured templates for common agent patterns:
 * - Worker: Task execution, data processing, automation
 * - Coordinator: Multi-agent orchestration, workflow management
 * - Specialist: Domain expertise, deep analysis
 * - Reviewer: Code review, quality assurance, validation
 * - Executor: Action execution, deployment, operations
 */

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaults: {
    role: string;
    autonomy: 'fully_autonomous' | 'semi_autonomous' | 'supervised';
    capabilities: string[];
    tools: string[];
    llm?: {
      provider: string;
      model: string;
      temperature: number;
      max_tokens: number;
    };
    observability?: {
      enabled: boolean;
      tracing: boolean;
      metrics: boolean;
    };
  };
  examples: string[];
  useCases: string[];
}

export const agentTemplates: AgentTemplate[] = [
  {
    id: 'worker',
    name: 'Worker Agent',
    description: 'Task execution, data processing, and automation',
    icon: '🔧',
    defaults: {
      role: 'Worker agent specialized in task execution and automation',
      autonomy: 'fully_autonomous',
      capabilities: [
        'task-execution',
        'data-processing',
        'error-handling',
        'result-reporting',
      ],
      tools: ['file_system', 'api_client', 'database'],
      llm: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        temperature: 0.3,
        max_tokens: 4096,
      },
      observability: {
        enabled: true,
        tracing: true,
        metrics: true,
      },
    },
    examples: [
      'data-ingestion-worker',
      'pipeline-processor',
      'file-sync-agent',
      'api-poller',
    ],
    useCases: [
      'Process files and data streams',
      'Execute scheduled tasks',
      'Sync data between systems',
      'Monitor and respond to events',
    ],
  },
  {
    id: 'coordinator',
    name: 'Coordinator Agent',
    description: 'Multi-agent orchestration and workflow management',
    icon: '🎯',
    defaults: {
      role: 'Coordinator agent for multi-agent orchestration and workflow management',
      autonomy: 'fully_autonomous',
      capabilities: [
        'task-routing',
        'agent-coordination',
        'workflow-orchestration',
        'resource-allocation',
        'status-aggregation',
      ],
      tools: ['agent_registry', 'workflow_engine', 'message_queue'],
      llm: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        temperature: 0.3,
        max_tokens: 8192,
      },
      observability: {
        enabled: true,
        tracing: true,
        metrics: true,
      },
    },
    examples: [
      'task-dispatcher',
      'workflow-coordinator',
      'agent-mesh-orchestrator',
      'project-manager-agent',
    ],
    useCases: [
      'Route tasks to specialized agents',
      'Coordinate complex multi-agent workflows',
      'Manage agent resources and priorities',
      'Aggregate results from multiple agents',
    ],
  },
  {
    id: 'specialist',
    name: 'Specialist Agent',
    description: 'Domain expertise and deep analysis',
    icon: '🧠',
    defaults: {
      role: 'Specialist agent with deep domain expertise and analytical capabilities',
      autonomy: 'semi_autonomous',
      capabilities: [
        'domain-analysis',
        'expert-recommendations',
        'pattern-recognition',
        'knowledge-synthesis',
      ],
      tools: ['knowledge_base', 'vector_search', 'domain_apis'],
      llm: {
        provider: 'anthropic',
        model: 'claude-opus-4-20250514',
        temperature: 0.5,
        max_tokens: 16384,
      },
      observability: {
        enabled: true,
        tracing: true,
        metrics: true,
      },
    },
    examples: [
      'security-analyst',
      'architecture-reviewer',
      'compliance-auditor',
      'data-scientist-agent',
    ],
    useCases: [
      'Provide expert analysis and recommendations',
      'Review complex technical decisions',
      'Identify patterns and anomalies',
      'Synthesize knowledge from multiple sources',
    ],
  },
  {
    id: 'reviewer',
    name: 'Reviewer Agent',
    description: 'Code review, quality assurance, and validation',
    icon: '✅',
    defaults: {
      role: 'Reviewer agent specialized in quality assurance and validation',
      autonomy: 'semi_autonomous',
      capabilities: [
        'code-review',
        'quality-assessment',
        'standards-validation',
        'issue-detection',
        'recommendation-generation',
      ],
      tools: ['code_analyzer', 'linter', 'security_scanner', 'test_runner'],
      llm: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        temperature: 0.3,
        max_tokens: 8192,
      },
      observability: {
        enabled: true,
        tracing: true,
        metrics: true,
      },
    },
    examples: [
      'mr-reviewer',
      'code-quality-reviewer',
      'security-reviewer',
      'compliance-checker',
    ],
    useCases: [
      'Review pull requests and merge requests',
      'Validate code quality and standards',
      'Detect security vulnerabilities',
      'Ensure compliance with policies',
    ],
  },
  {
    id: 'executor',
    name: 'Executor Agent',
    description: 'Action execution, deployment, and operations',
    icon: '🚀',
    defaults: {
      role: 'Executor agent for action execution, deployment, and operational tasks',
      autonomy: 'supervised',
      capabilities: [
        'action-execution',
        'deployment',
        'rollback',
        'health-monitoring',
        'incident-response',
      ],
      tools: [
        'kubernetes_api',
        'ci_cd_pipeline',
        'deployment_manager',
        'monitoring_system',
      ],
      llm: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        temperature: 0.2,
        max_tokens: 4096,
      },
      observability: {
        enabled: true,
        tracing: true,
        metrics: true,
      },
    },
    examples: [
      'deployment-executor',
      'pipeline-runner',
      'cluster-operator',
      'incident-responder',
    ],
    useCases: [
      'Deploy applications and services',
      'Execute infrastructure operations',
      'Respond to incidents and alerts',
      'Manage rollbacks and recovery',
    ],
  },
];

/**
 * Get template by ID
 */
export function getTemplate(id: string): AgentTemplate | undefined {
  return agentTemplates.find((t) => t.id === id);
}

/**
 * Get all template choices for CLI
 */
export function getTemplateChoices() {
  return agentTemplates.map((t) => ({
    value: t.id,
    label: `${t.icon} ${t.name}`,
    description: t.description,
  }));
}
