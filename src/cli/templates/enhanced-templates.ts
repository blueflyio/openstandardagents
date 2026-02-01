/**
 * Enhanced Agent Template Library
 *
 * Comprehensive collection of professional agent templates
 * organized by category with detailed defaults and use cases
 */

import type { TemplateDefinition } from '../wizard/types.js';

/**
 * Complete template library (15+ templates)
 */
export const ENHANCED_TEMPLATES: TemplateDefinition[] = [
  // ========================================
  // WORKER AGENTS (Task Execution)
  // ========================================
  {
    id: 'worker-data-processor',
    name: 'Data Processor Worker',
    description:
      'Process and transform data from various sources (CSV, JSON, APIs)',
    category: 'worker',
    icon: '📊',
    difficulty: 'beginner',
    estimatedTime: '3-5 minutes',
    useCases: [
      'ETL pipelines',
      'Data transformation',
      'Format conversion',
      'Data validation',
      'Batch processing',
    ],
    examples: ['etl-worker', 'csv-processor', 'data-cleaner'],
    tags: ['data', 'etl', 'transformation', 'batch'],
    popularity: 95,
    defaults: {
      role: 'You are a data processing agent that transforms and validates data from various sources. You excel at ETL operations, format conversions, and data quality checks.',
      autonomy: 'fully_autonomous',
      capabilities: [
        'data-transformation',
        'format-conversion',
        'data-validation',
        'batch-processing',
        'error-handling',
      ],
      tools: ['file_system', 'csv_parser', 'json_handler', 'data_validator'],
      llm: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        temperature: 0.3,
        maxTokens: 4096,
      },
    },
  },

  {
    id: 'worker-api-client',
    name: 'API Integration Worker',
    description: 'Call REST APIs, handle authentication, process responses',
    category: 'worker',
    icon: '🔌',
    difficulty: 'beginner',
    estimatedTime: '3-5 minutes',
    useCases: [
      'API integrations',
      'Webhook handling',
      'Third-party service calls',
      'Data synchronization',
      'Microservice communication',
    ],
    examples: ['slack-integration', 'stripe-client', 'github-sync'],
    tags: ['api', 'integration', 'http', 'rest'],
    popularity: 88,
    defaults: {
      role: 'You are an API integration agent that handles HTTP requests, manages authentication, and processes API responses. You ensure reliable communication with external services.',
      autonomy: 'fully_autonomous',
      capabilities: [
        'http-requests',
        'api-authentication',
        'rate-limiting',
        'retry-logic',
        'response-processing',
      ],
      tools: ['http_client', 'auth_handler', 'json_parser', 'error_logger'],
      llm: {
        provider: 'anthropic',
        model: 'claude-haiku-4-20250514',
        temperature: 0.2,
        maxTokens: 2048,
      },
    },
  },

  {
    id: 'worker-file-handler',
    name: 'File Operations Worker',
    description: 'Read, write, organize, and process files and directories',
    category: 'worker',
    icon: '📁',
    difficulty: 'beginner',
    estimatedTime: '2-4 minutes',
    useCases: [
      'File processing',
      'Directory organization',
      'Backup operations',
      'File synchronization',
      'Archive management',
    ],
    examples: ['file-sync', 'backup-agent', 'log-processor'],
    tags: ['filesystem', 'files', 'backup', 'sync'],
    popularity: 76,
    defaults: {
      role: 'You are a file operations agent that manages files and directories. You handle reading, writing, moving, copying, and organizing files efficiently.',
      autonomy: 'supervised',
      capabilities: [
        'file-reading',
        'file-writing',
        'directory-management',
        'file-backup',
        'archive-operations',
      ],
      tools: ['file_system', 'path_handler', 'compression', 'checksum'],
      llm: {
        provider: 'anthropic',
        model: 'claude-haiku-4-20250514',
        temperature: 0.1,
        maxTokens: 2048,
      },
    },
  },

  // ========================================
  // COORDINATOR AGENTS (Orchestration)
  // ========================================
  {
    id: 'coordinator-workflow',
    name: 'Workflow Orchestrator',
    description: 'Coordinate multi-agent workflows and task delegation',
    category: 'coordinator',
    icon: '🎭',
    difficulty: 'intermediate',
    estimatedTime: '5-8 minutes',
    useCases: [
      'Multi-agent coordination',
      'Complex workflows',
      'Task delegation',
      'Process orchestration',
      'Agent mesh management',
    ],
    examples: ['pipeline-orchestrator', 'task-dispatcher', 'workflow-manager'],
    tags: ['orchestration', 'workflow', 'coordination', 'delegation'],
    popularity: 82,
    defaults: {
      role: 'You are a workflow orchestration agent that coordinates multiple agents to complete complex tasks. You delegate work, monitor progress, and ensure successful completion.',
      autonomy: 'supervised',
      capabilities: [
        'agent-discovery',
        'task-delegation',
        'workflow-management',
        'progress-monitoring',
        'error-recovery',
      ],
      tools: [
        'agent_registry',
        'task_queue',
        'workflow_engine',
        'status_monitor',
      ],
      llm: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        temperature: 0.5,
        maxTokens: 8192,
      },
      workflow: {
        steps: [
          {
            agent: 'analyzer',
            task: 'analyze',
            description: 'Analyze requirements',
          },
          { agent: 'executor', task: 'execute', description: 'Execute tasks' },
          {
            agent: 'validator',
            task: 'validate',
            description: 'Validate results',
          },
        ],
      },
    },
  },

  {
    id: 'coordinator-parallel',
    name: 'Parallel Task Coordinator',
    description: 'Execute multiple tasks in parallel with synchronization',
    category: 'coordinator',
    icon: '⚡',
    difficulty: 'advanced',
    estimatedTime: '6-10 minutes',
    useCases: [
      'Parallel processing',
      'Concurrent workflows',
      'Resource optimization',
      'Batch job management',
      'High-throughput pipelines',
    ],
    examples: [
      'parallel-processor',
      'batch-coordinator',
      'concurrent-executor',
    ],
    tags: ['parallel', 'concurrent', 'performance', 'batch'],
    popularity: 68,
    defaults: {
      role: 'You are a parallel task coordination agent that executes multiple tasks concurrently. You optimize resource usage, manage synchronization, and ensure consistent results.',
      autonomy: 'fully_autonomous',
      capabilities: [
        'parallel-execution',
        'resource-management',
        'synchronization',
        'load-balancing',
        'result-aggregation',
      ],
      tools: [
        'task_scheduler',
        'resource_manager',
        'sync_handler',
        'aggregator',
      ],
      llm: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        temperature: 0.4,
        maxTokens: 6144,
      },
    },
  },

  // ========================================
  // SPECIALIST AGENTS (Domain Expertise)
  // ========================================
  {
    id: 'specialist-code-reviewer',
    name: 'Code Review Specialist',
    description: 'Review code for quality, security, and best practices',
    category: 'specialist',
    icon: '👁️',
    difficulty: 'advanced',
    estimatedTime: '6-10 minutes',
    useCases: [
      'Pull request reviews',
      'Code quality analysis',
      'Security audits',
      'Best practice enforcement',
      'Technical debt identification',
    ],
    examples: ['pr-reviewer', 'security-auditor', 'quality-checker'],
    tags: ['code-review', 'quality', 'security', 'audit'],
    popularity: 91,
    defaults: {
      role: 'You are a code review specialist that analyzes code for quality, security vulnerabilities, and adherence to best practices. You provide constructive feedback and actionable suggestions.',
      autonomy: 'supervised',
      capabilities: [
        'code-analysis',
        'security-scanning',
        'quality-metrics',
        'best-practices',
        'documentation-review',
      ],
      tools: [
        'ast_parser',
        'static_analyzer',
        'security_scanner',
        'metrics_calculator',
      ],
      llm: {
        provider: 'anthropic',
        model: 'claude-opus-4-20250514',
        temperature: 0.3,
        maxTokens: 16384,
      },
    },
  },

  {
    id: 'specialist-data-scientist',
    name: 'Data Science Specialist',
    description: 'Analyze data, build models, generate insights',
    category: 'specialist',
    icon: '📈',
    difficulty: 'advanced',
    estimatedTime: '8-12 minutes',
    useCases: [
      'Data analysis',
      'Statistical modeling',
      'ML model training',
      'Feature engineering',
      'Insight generation',
    ],
    examples: ['ml-trainer', 'data-analyst', 'insight-generator'],
    tags: ['data-science', 'machine-learning', 'analytics', 'statistics'],
    popularity: 73,
    defaults: {
      role: 'You are a data science specialist that analyzes data, builds predictive models, and generates actionable insights. You apply statistical methods and machine learning techniques.',
      autonomy: 'supervised',
      capabilities: [
        'data-analysis',
        'statistical-modeling',
        'feature-engineering',
        'model-training',
        'visualization',
      ],
      tools: ['pandas', 'numpy', 'sklearn', 'matplotlib', 'jupyter'],
      llm: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        temperature: 0.4,
        maxTokens: 12288,
      },
    },
  },

  {
    id: 'specialist-security',
    name: 'Security Specialist',
    description: 'Security audits, vulnerability scanning, compliance checks',
    category: 'specialist',
    icon: '🛡️',
    difficulty: 'advanced',
    estimatedTime: '7-10 minutes',
    useCases: [
      'Security audits',
      'Vulnerability assessment',
      'Compliance validation',
      'Threat detection',
      'Security policy enforcement',
    ],
    examples: [
      'security-auditor',
      'vulnerability-scanner',
      'compliance-checker',
    ],
    tags: ['security', 'audit', 'compliance', 'vulnerability'],
    popularity: 79,
    defaults: {
      role: 'You are a security specialist that performs security audits, identifies vulnerabilities, and ensures compliance with security standards. You provide detailed remediation recommendations.',
      autonomy: 'supervised',
      capabilities: [
        'vulnerability-scanning',
        'security-auditing',
        'compliance-checking',
        'threat-analysis',
        'remediation-planning',
      ],
      tools: [
        'vuln_scanner',
        'compliance_checker',
        'threat_detector',
        'audit_logger',
      ],
      llm: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        temperature: 0.2,
        maxTokens: 8192,
      },
    },
  },

  // ========================================
  // REVIEWER AGENTS (Quality Assurance)
  // ========================================
  {
    id: 'reviewer-qa-tester',
    name: 'QA Testing Reviewer',
    description: 'Test applications, verify functionality, report bugs',
    category: 'reviewer',
    icon: '✅',
    difficulty: 'intermediate',
    estimatedTime: '5-7 minutes',
    useCases: [
      'Automated testing',
      'Regression testing',
      'Bug verification',
      'Test case generation',
      'Quality gates',
    ],
    examples: ['test-runner', 'qa-validator', 'regression-tester'],
    tags: ['testing', 'qa', 'quality', 'automation'],
    popularity: 85,
    defaults: {
      role: 'You are a QA testing reviewer that executes tests, verifies functionality, and identifies bugs. You ensure quality standards are met before release.',
      autonomy: 'fully_autonomous',
      capabilities: [
        'test-execution',
        'bug-detection',
        'test-generation',
        'coverage-analysis',
        'report-generation',
      ],
      tools: [
        'test_runner',
        'coverage_analyzer',
        'bug_tracker',
        'report_generator',
      ],
      llm: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        temperature: 0.3,
        maxTokens: 4096,
      },
    },
  },

  {
    id: 'reviewer-documentation',
    name: 'Documentation Reviewer',
    description: 'Review docs for completeness, accuracy, and clarity',
    category: 'reviewer',
    icon: '📝',
    difficulty: 'intermediate',
    estimatedTime: '4-6 minutes',
    useCases: [
      'Documentation review',
      'Technical writing',
      'API documentation',
      'User guides',
      'README validation',
    ],
    examples: ['docs-reviewer', 'readme-checker', 'api-docs-validator'],
    tags: ['documentation', 'technical-writing', 'review'],
    popularity: 64,
    defaults: {
      role: 'You are a documentation reviewer that ensures docs are complete, accurate, and well-written. You verify technical accuracy and improve clarity.',
      autonomy: 'supervised',
      capabilities: [
        'documentation-review',
        'technical-accuracy',
        'clarity-improvement',
        'formatting-validation',
        'link-checking',
      ],
      tools: ['markdown_parser', 'link_checker', 'spell_checker', 'formatter'],
      llm: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        temperature: 0.5,
        maxTokens: 8192,
      },
    },
  },

  // ========================================
  // EXECUTOR AGENTS (Action & Deployment)
  // ========================================
  {
    id: 'executor-deployment',
    name: 'Deployment Executor',
    description: 'Deploy applications, manage releases, handle rollbacks',
    category: 'executor',
    icon: '🚀',
    difficulty: 'advanced',
    estimatedTime: '7-10 minutes',
    useCases: [
      'Application deployment',
      'Release management',
      'Rollback handling',
      'Environment setup',
      'Blue-green deployment',
    ],
    examples: ['deploy-agent', 'release-manager', 'rollback-handler'],
    tags: ['deployment', 'release', 'devops', 'ci-cd'],
    popularity: 87,
    defaults: {
      role: 'You are a deployment executor that manages application releases. You handle deployments, monitor health, and execute rollbacks when needed.',
      autonomy: 'supervised',
      capabilities: [
        'deployment-automation',
        'health-monitoring',
        'rollback-execution',
        'environment-management',
        'release-validation',
      ],
      tools: [
        'kubectl',
        'docker',
        'helm',
        'deployment_manager',
        'health_checker',
      ],
      llm: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        temperature: 0.2,
        maxTokens: 4096,
      },
    },
  },

  {
    id: 'executor-monitoring',
    name: 'System Monitor Executor',
    description: 'Monitor systems, detect anomalies, trigger alerts',
    category: 'executor',
    icon: '📊',
    difficulty: 'intermediate',
    estimatedTime: '5-7 minutes',
    useCases: [
      'System monitoring',
      'Anomaly detection',
      'Alert triggering',
      'Performance tracking',
      'Health checks',
    ],
    examples: ['system-monitor', 'alert-agent', 'health-checker'],
    tags: ['monitoring', 'alerting', 'observability', 'health'],
    popularity: 81,
    defaults: {
      role: 'You are a system monitoring executor that tracks system health, detects anomalies, and triggers alerts. You ensure systems are running optimally.',
      autonomy: 'fully_autonomous',
      capabilities: [
        'metric-collection',
        'anomaly-detection',
        'alert-triggering',
        'dashboard-updates',
        'trend-analysis',
      ],
      tools: ['prometheus', 'grafana', 'alert_manager', 'metric_collector'],
      llm: {
        provider: 'anthropic',
        model: 'claude-haiku-4-20250514',
        temperature: 0.1,
        maxTokens: 2048,
      },
    },
  },

  // ========================================
  // CUSTOM/SPECIALIZED
  // ========================================
  {
    id: 'custom-chatbot',
    name: 'Customer Support Chatbot',
    description: 'Answer customer questions, provide support, escalate issues',
    category: 'custom',
    icon: '💬',
    difficulty: 'intermediate',
    estimatedTime: '5-8 minutes',
    useCases: [
      'Customer support',
      'FAQ answering',
      'Issue escalation',
      'Ticket creation',
      'Knowledge base queries',
    ],
    examples: ['support-bot', 'help-desk-agent', 'faq-assistant'],
    tags: ['chatbot', 'support', 'customer-service'],
    popularity: 89,
    defaults: {
      role: 'You are a customer support chatbot that helps customers with their questions and issues. You provide friendly, helpful responses and escalate complex issues to humans.',
      autonomy: 'supervised',
      capabilities: [
        'question-answering',
        'knowledge-base-search',
        'issue-escalation',
        'ticket-creation',
        'sentiment-analysis',
      ],
      tools: [
        'knowledge_base',
        'ticket_system',
        'sentiment_analyzer',
        'chat_handler',
      ],
      llm: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        temperature: 0.7,
        maxTokens: 4096,
      },
    },
  },

  {
    id: 'custom-research',
    name: 'Research Assistant',
    description: 'Conduct research, summarize findings, generate reports',
    category: 'custom',
    icon: '🔬',
    difficulty: 'intermediate',
    estimatedTime: '6-9 minutes',
    useCases: [
      'Web research',
      'Document summarization',
      'Report generation',
      'Data gathering',
      'Competitive analysis',
    ],
    examples: ['research-agent', 'summarizer', 'report-generator'],
    tags: ['research', 'analysis', 'reporting'],
    popularity: 75,
    defaults: {
      role: 'You are a research assistant that conducts thorough research, analyzes information, and generates comprehensive reports. You gather data from multiple sources and synthesize insights.',
      autonomy: 'supervised',
      capabilities: [
        'web-research',
        'document-analysis',
        'summarization',
        'report-generation',
        'citation-management',
      ],
      tools: [
        'web_search',
        'document_reader',
        'summarizer',
        'citation_manager',
      ],
      llm: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        temperature: 0.6,
        maxTokens: 12288,
      },
    },
  },
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): TemplateDefinition[] {
  return ENHANCED_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): TemplateDefinition | undefined {
  return ENHANCED_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get popular templates (top 10 by popularity)
 */
export function getPopularTemplates(): TemplateDefinition[] {
  return [...ENHANCED_TEMPLATES]
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 10);
}

/**
 * Search templates by query
 */
export function searchTemplates(query: string): TemplateDefinition[] {
  const lowerQuery = query.toLowerCase();
  return ENHANCED_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some((tag) => tag.includes(lowerQuery)) ||
      t.useCases.some((uc) => uc.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get templates for beginners
 */
export function getBeginnerTemplates(): TemplateDefinition[] {
  return ENHANCED_TEMPLATES.filter((t) => t.difficulty === 'beginner');
}
