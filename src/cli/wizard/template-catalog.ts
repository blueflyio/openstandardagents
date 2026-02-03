/**
 * Template Catalog - References external platform-agents templates
 * Does NOT duplicate templates, just provides metadata for discovery
 */

export interface TemplateMeta {
  id: string;
  name: string;
  platform: string;
  description: string;
  path: string; // Path in platform-agents repo
  tags: string[];
  useCases: string[];
  features: string[];
}

/**
 * Template catalog - metadata only
 * Actual templates live in platform-agents repo
 */
export const TEMPLATE_CATALOG: TemplateMeta[] = [
  {
    id: 'claude-code-review',
    name: 'Claude Code Review Agent',
    platform: 'claude',
    description: 'Automated code quality analysis using Claude',
    path: 'templates/claude/examples/code-review-agent.ossa.yaml',
    tags: ['code-quality', 'automation', 'ci-cd'],
    useCases: ['code-review', 'quality-assurance', 'ci-cd'],
    features: ['tool-use', 'streaming', 'batch-processing'],
  },
  {
    id: 'openai-docs-generator',
    name: 'OpenAI Documentation Generator',
    platform: 'openai',
    description: 'Automated technical documentation generation',
    path: 'templates/openai/examples/documentation-generator.ossa.yaml',
    tags: ['docs', 'technical-writing', 'automation'],
    useCases: ['documentation', 'technical-writing'],
    features: ['function-calling', 'structured-output'],
  },
  {
    id: 'drupal-content-ai',
    name: 'Drupal Content AI Agent',
    platform: 'drupal',
    description: 'CMS automation and content optimization',
    path: 'templates/drupal/examples/content-ai-agent.ossa.yaml',
    tags: ['cms', 'content', 'drupal'],
    useCases: ['content-management', 'cms', 'seo'],
    features: ['content-crud', 'eca-integration', 'taxonomy'],
  },
  {
    id: 'cursor-ide',
    name: 'Cursor IDE Assistant',
    platform: 'cursor',
    description: 'Real-time code completion and refactoring',
    path: 'templates/cursor/template.ossa.yaml',
    tags: ['ide', 'completion', 'refactoring'],
    useCases: ['ide-integration', 'code-assistance'],
    features: ['lsp', 'real-time', 'semantic-search'],
  },
  {
    id: 'crewai-multi-agent',
    name: 'CrewAI Multi-Agent Workflow',
    platform: 'crewai',
    description: 'Complex multi-agent orchestration',
    path: 'templates/crewai/template.ossa.yaml',
    tags: ['multi-agent', 'orchestration', 'workflows'],
    useCases: ['multi-agent', 'complex-workflows', 'orchestration'],
    features: ['crew-composition', 'task-delegation', 'shared-memory'],
  },
  {
    id: 'langchain-research',
    name: 'LangChain Research Agent',
    platform: 'langchain',
    description: 'Autonomous research with tool integration',
    path: 'templates/langchain/template.ossa.yaml',
    tags: ['research', 'autonomous', 'tools'],
    useCases: ['research', 'autonomous-tasks', 'tool-integration'],
    features: ['agent-executor', 'tool-framework', 'memory-management'],
  },
  {
    id: 'langflow-visual',
    name: 'LangFlow Visual Workflow',
    platform: 'langflow',
    description: 'Visual workflow builder for agents',
    path: 'templates/langflow/template.ossa.yaml',
    tags: ['visual', 'no-code', 'workflows'],
    useCases: ['visual-workflows', 'no-code', 'rapid-prototyping'],
    features: ['component-based', 'visual-builder', 'streaming'],
  },
];

/**
 * Find templates by use case
 */
export function findTemplatesByUseCase(useCase: string): TemplateMeta[] {
  return TEMPLATE_CATALOG.filter((t) =>
    t.useCases.some((uc) => uc.toLowerCase().includes(useCase.toLowerCase()))
  );
}

/**
 * Find templates by platform
 */
export function findTemplatesByPlatform(platform: string): TemplateMeta[] {
  return TEMPLATE_CATALOG.filter(
    (t) => t.platform.toLowerCase() === platform.toLowerCase()
  );
}

/**
 * Get template by ID
 */
export function getTemplate(id: string): TemplateMeta | undefined {
  return TEMPLATE_CATALOG.find((t) => t.id === id);
}
