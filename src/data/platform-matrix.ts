/**
 * Platform Matrix - Single source of truth for creating and using AI agents
 * across GitLab, Drupal, kagent, OpenAI, Claude, CrewAI, LangFlow, LangChain, and others.
 *
 * Use: ossa platforms (CLI), export --list-platforms, and doc generation.
 * DRY: All platform metadata lives here.
 *
 * Policy: Use official SDK/npm/Python/GitHub package per platform; do not build custom
 * runtimes. OSSA is the contract/spec layer between MCP and A2A; we integrate via
 * config and manifest (e.g. Drupal ai_agents, LangFlow flow JSON).
 */

export interface PlatformMatrixEntry {
  /** CLI platform id (e.g. langchain, drupal, kagent) */
  id: string;
  /** Display name */
  name: string;
  /** One-line description */
  description: string;
  /** Maturity: production | beta | alpha | planned */
  status: 'production' | 'beta' | 'alpha' | 'planned';
  /** What creators need: requirements to use this platform */
  whatTheyNeed: string[];
  /** Recommended folder structure (relative to agent root); OSSA standard is .agents/{name}/ */
  folderStructure: string[];
  /** Official SDK or npm package to use (prefer open source first) */
  sdkNpm: string[];
  /** How we export: ossa export --platform <id> */
  exportHow: string;
  /** Whether we can import from this platform (ossa import --from <id>) */
  importHow: 'yes' | 'partial' | 'no';
  /** How to use OSSA spec inside the platform / enhance the tool */
  specUsage: string[];
}

/** Questions we might be missing when onboarding a new agent to a platform */
export const QUESTIONS_WE_MIGHT_BE_MISSING: string[] = [
  'Authentication: How does the agent authenticate to APIs and user context?',
  'Rate limits and quotas: What are the platform limits (requests/min, tokens)?',
  'Cost model: Per token, per request, or subscription?',
  'Compliance and data residency: Where does data run (region, SOC2, HIPAA)?',
  'Human-in-the-loop: Where are approval gates and who can approve?',
  'Observability: What traces, metrics, and logs are available?',
  'Versioning and rollback: How do you promote or roll back agent versions?',
  'Multi-tenancy: Single-tenant vs shared infrastructure?',
  'Tool execution: Sandbox, permissions, and timeout limits?',
  'Handoffs: Can this agent delegate to other agents (A2A)?',
];

export const PLATFORM_MATRIX: PlatformMatrixEntry[] = [
  {
    id: 'langchain',
    name: 'LangChain',
    description: 'LangChain Python + TypeScript agent package (uses @langchain/* SDK)',
    status: 'production',
    whatTheyNeed: [
      'Python 3.10+ or Node 18+',
      'LangChain SDK (@langchain/core, langgraph if graph)',
      'LLM API key (OpenAI, Anthropic, etc.)',
      'Optional: LangSmith for tracing',
    ],
    folderStructure: [
      '.agents/{name}/manifest.ossa.yaml',
      '.agents/{name}/src/ (or agent code alongside)',
      'requirements.txt or package.json with @langchain/*',
    ],
    sdkNpm: [
      'langchain (Python)',
      '@langchain/core @langchain/langgraph (TS)',
      'langgraph (Python multi-agent)',
    ],
    exportHow: 'ossa export <manifest> --platform langchain -o dist/',
    importHow: 'yes',
    specUsage: [
      'Map spec.role to system message; spec.llm to ChatOpenAI/ChatAnthropic; spec.tools to bind_tools().',
      'Generate runnable from manifest so one OSSA file drives LangChain agent.',
    ],
  },
  {
    id: 'crewai',
    name: 'CrewAI',
    description: 'CrewAI multi-agent Python package (uses CrewAI SDK)',
    status: 'beta',
    whatTheyNeed: [
      'Python 3.10+',
      'CrewAI SDK',
      'LLM API key',
      'Optional: CrewHub for persistence',
    ],
    folderStructure: [
      '.agents/{name}/manifest.ossa.yaml',
      '.agents/{name}/src/crew.py or agents/',
      'pyproject.toml with crewai',
    ],
    sdkNpm: ['crewai', 'crewai-tools'],
    exportHow: 'ossa export <manifest> --platform crewai -o dist/',
    importHow: 'yes',
    specUsage: [
      'Map one OSSA agent to CrewAI Agent (role, goal, backstory from spec); spec.tools to tools=[]; spec.llm to llm.',
      'Multi-agent: use spec.team or extensions.ag2 for crew composition.',
    ],
  },
  {
    id: 'langflow',
    name: 'LangFlow',
    description: 'LangFlow flow JSON; uses official langflow package and LCAgentComponent (LangChain-based)',
    status: 'beta',
    whatTheyNeed: [
      'Official LangFlow: pip install langflow or Docker (https://github.com/langflow-ai/langflow)',
      'Flow JSON export from LangFlow UI or API',
      'LLM API keys configured in LangFlow',
    ],
    folderStructure: [
      '.agents/{name}/manifest.ossa.yaml',
      '.agents/{name}/flows/*.json (exported flow from LangFlow)',
    ],
    sdkNpm: [
      'langflow (PyPI) - official; agents in lfx.base.agents (LCAgentComponent, LangChain AgentExecutor)',
      'LangFlow docs/Agents: agents.mdx, agents-tools.mdx, mcp-server.mdx',
    ],
    exportHow: 'ossa export <manifest> --platform langflow -o dist/',
    importHow: 'partial',
    specUsage: [
      'OSSA is the contract/spec layer. Export OSSA to LangFlow flow JSON; flow mirrors spec (prompts, tools, LLM).',
      'Import: parse official LangFlow flow JSON (nodes/edges) to OSSA manifest. Use langflow package; do not build custom agent runtime.',
    ],
  },
  {
    id: 'openai-agents-sdk',
    name: 'OpenAI Agents / Assistants API',
    description: 'Runnable @openai/agents TypeScript package with MCP, guardrails, handoffs',
    status: 'beta',
    whatTheyNeed: [
      'OpenAI API key',
      'Node 18+ and @openai/agents or assistants API',
      'Optional: MCP servers for tools',
    ],
    folderStructure: [
      '.agents/{name}/manifest.ossa.yaml',
      '.agents/{name}/src/index.ts',
      'package.json with openai, @openai/agents',
    ],
    sdkNpm: ['openai', '@openai/agents'],
    exportHow: 'ossa export <manifest> --platform openai-agents-sdk -o dist/',
    importHow: 'partial',
    specUsage: [
      'Map spec to Assistant (instructions, model, tools); spec.tools to function tools or MCP.',
      'Use extensions.openai_agents for handoffs and guardrails if present.',
    ],
  },
  {
    id: 'anthropic',
    name: 'Claude (Anthropic)',
    description: 'Anthropic Python SDK with FastAPI server',
    status: 'beta',
    whatTheyNeed: [
      'Anthropic API key',
      'Python 3.10+ or Node 18+',
      'Optional: Claude Code / Skills for tool use',
    ],
    folderStructure: [
      '.agents/{name}/manifest.ossa.yaml',
      '.agents/{name}/prompts/system.txt',
      'skills/ for Claude Skills (SKILL.md)',
    ],
    sdkNpm: ['anthropic', '@anthropic-ai/sdk'],
    exportHow: 'ossa export <manifest> --platform anthropic -o dist/ ; or --platform agent-skills for SKILL.md',
    importHow: 'partial',
    specUsage: [
      'spec.role -> system prompt; spec.tools -> tools array or MCP; spec.llm -> model.',
      'Agent Skills: export SKILL.md from manifest for Claude Code / Cowork.',
    ],
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    description: 'Claude Code sub-agent for task execution',
    status: 'beta',
    whatTheyNeed: ['Claude Code app', 'SKILL.md or claude_desktop_config'],
    folderStructure: ['.agents/{name}/manifest.ossa.yaml', '.agents/{name}/skills/*/SKILL.md'],
    sdkNpm: ['@anthropic-ai/sdk (for programmatic)'],
    exportHow: 'ossa export <manifest> --platform agent-skills (SKILL.md)',
    importHow: 'no',
    specUsage: ['SKILL.md is generated from manifest; OSSA is source of truth for description and tools.'],
  },
  {
    id: 'kagent',
    name: 'kagent (Kubernetes)',
    description: 'kagent.dev Kubernetes CRD bundle (Declarative Agent)',
    status: 'alpha',
    whatTheyNeed: [
      'Kubernetes cluster',
      'kagent controller installed',
      'CRD apiVersion v1alpha1 or v1alpha2',
    ],
    folderStructure: [
      '.agents/{name}/manifest.ossa.yaml',
      '.agents/{name}/k8s/ (generated CRDs)',
      'kustomization.yaml for deploy',
    ],
    sdkNpm: ['@bluefly/openstandardagents (crd-generator)'],
    exportHow: 'ossa export <manifest> --platform kagent --crd-version v1alpha2 -o k8s/',
    importHow: 'no',
    specUsage: [
      'OSSA manifest is converted to Agent CRD; spec.llm, spec.tools, spec.observability map to CRD spec.',
    ],
  },
  {
    id: 'gitlab',
    name: 'GitLab CI/CD',
    description: 'GitLab CI/CD YAML configuration',
    status: 'alpha',
    whatTheyNeed: ['GitLab project', '.gitlab-ci.yml', 'Runner with Docker or Node'],
    folderStructure: ['.gitlab-ci.yml', '.agents/{name}/manifest.ossa.yaml', 'GitLab CI jobs or any runner'],
    sdkNpm: ['GitLab API (REST)'],
    exportHow: 'ossa export <manifest> --platform gitlab -o .gitlab/',
    importHow: 'no',
    specUsage: ['Export generates CI jobs that validate/build/deploy the agent from manifest.'],
  },
  {
    id: 'gitlab-duo',
    name: 'GitLab Duo Custom Agent',
    description: 'GitLab Duo Custom Agent with MCP integration',
    status: 'alpha',
    whatTheyNeed: ['GitLab Duo', 'Custom agent config', 'MCP server URL or config'],
    folderStructure: ['.agents/{name}/manifest.ossa.yaml', 'openapi/ for Duo API'],
    sdkNpm: ['GitLab API (REST)'],
    exportHow: 'ossa export <manifest> --platform gitlab-duo -o dist/',
    importHow: 'no',
    specUsage: ['Manifest drives Duo agent definition; MCP tools from spec.tools.'],
  },
  {
    id: 'drupal',
    name: 'Drupal (ai_agents)',
    description: 'Contract layer: OSSA config/plugin between MCP and A2A; integrates with Drupal ai_agents module',
    status: 'beta',
    whatTheyNeed: [
      'Drupal 10+ with ai_agents (https://git.drupalcode.org/project/ai_agents)',
      'OSSA provides the agent standard spec and config; we do not reinvent the runtime.',
      'YAML config in config/install or config/optional',
    ],
    folderStructure: [
      '.agents/{name}/manifest.ossa.yaml',
      'config/install/ai_agents_ossa.agent.{name}.yml',
      'Optional: custom module for tools',
    ],
    sdkNpm: [
      'Drupal ai_agents project (PHP); OSSA = contract/spec layer only',
      'Export produces config and manifest for ai_agents to consume; no custom agent runtime.',
    ],
    exportHow: 'ossa export <manifest> --platform drupal -o config/',
    importHow: 'no',
    specUsage: [
      'OSSA is the contract layer between MCP and A2A. Export manifest as Drupal config; ai_agents module reads spec.role, spec.llm, spec.tools.',
      'Plugin/config integration only; tool execution via ECA or ai_agents; we do not replace ai_agents.',
    ],
  },
  {
    id: 'symfony',
    name: 'Symfony AI Agent',
    description: 'PHP bootstrap for symfony/ai-agent (Platform + Model + Toolbox from OSSA)',
    status: 'alpha',
    whatTheyNeed: [
      'PHP 8.2+',
      'Composer',
      'symfony/ai-agent and symfony/ai-platform',
      'LLM API key (OpenAI, Anthropic, etc.)',
    ],
    folderStructure: [
      '.agents/{name}/manifest.ossa.yaml',
      '{name}/composer.json',
      '{name}/agent_bootstrap.php',
      '{name}/README.md',
    ],
    sdkNpm: ['symfony/ai-agent', 'symfony/ai-platform (Composer)'],
    exportHow: 'ossa export <manifest> --platform symfony -o dist/',
    importHow: 'no',
    specUsage: [
      'spec.role or prompts.system -> system message; spec.llm -> Platform + Model; spec.tools -> Toolbox (stubs or #[AsTool] classes).',
      'One OSSA manifest -> runnable Symfony Agent in PHP.',
    ],
  },
  {
    id: 'cursor',
    name: 'Cursor Cloud Agent',
    description: 'Cursor Cloud Agent for IDE assistance',
    status: 'beta',
    whatTheyNeed: ['Cursor IDE', 'Agent config (e.g. .cursor/agents)'],
    folderStructure: ['.agents/{name}/manifest.ossa.yaml', '.cursor/'],
    sdkNpm: ['Cursor config (no public SDK)'],
    exportHow: 'ossa export <manifest> --platform cursor -o dist/',
    importHow: 'yes',
    specUsage: ['Export produces Cursor-compatible agent config from manifest.'],
  },
  {
    id: 'mcp',
    name: 'MCP (Model Context Protocol)',
    description: 'MCP server for Claude Code, Cursor, and other MCP clients',
    status: 'production',
    whatTheyNeed: ['@modelcontextprotocol/sdk', 'Node 18+', 'Tools and resources defined in manifest'],
    folderStructure: [
      '.agents/{name}/manifest.ossa.yaml',
      '.agents/{name}/tools/',
      'MCP server entry in client config',
    ],
    sdkNpm: ['@modelcontextprotocol/sdk'],
    exportHow: 'ossa export <manifest> --platform mcp -o dist/',
    importHow: 'no',
    specUsage: ['spec.tools and spec.capabilities drive MCP tool/resource registration.'],
  },
  {
    id: 'npm',
    name: 'npm Package',
    description: 'Installable npm package with optional Claude Skill',
    status: 'production',
    whatTheyNeed: ['Node 18+', 'package.json', 'Optional: SKILL.md for Claude'],
    folderStructure: [
      '.agents/{name}/manifest.ossa.yaml',
      'package.json',
      'dist/ from build',
      'Optional: skills/ with SKILL.md',
    ],
    sdkNpm: ['@bluefly/openstandardagents (consumer)'],
    exportHow: 'ossa export <manifest> --platform npm --skill -o dist/',
    importHow: 'no',
    specUsage: ['Package ships manifest and generated client; consumers load via OSSA SDK.'],
  },
  {
    id: 'docker',
    name: 'Docker',
    description: 'Docker deployment package',
    status: 'alpha',
    whatTheyNeed: ['Dockerfile', 'Runtime (Node/Python)'],
    folderStructure: ['.agents/{name}/manifest.ossa.yaml', 'docker/Dockerfile', 'Dockerfile'],
    sdkNpm: ['dockerode (optional, for API)'],
    exportHow: 'ossa export <manifest> --platform docker -o docker/',
    importHow: 'no',
    specUsage: ['Export produces Dockerfile and entrypoint that loads manifest at runtime.'],
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    description: 'Kubernetes Kustomize structure',
    status: 'alpha',
    whatTheyNeed: ['kubectl', 'Kustomize', 'Cluster'],
    folderStructure: ['.agents/{name}/manifest.ossa.yaml', 'k8s/base/', 'k8s/overlays/'],
    sdkNpm: ['@kubernetes/client-node (optional)'],
    exportHow: 'ossa export <manifest> --platform kubernetes -o k8s/',
    importHow: 'no',
    specUsage: ['Manifest drives Deployment, Service, ConfigMap; OSSA in config for runtime.'],
  },
  {
    id: 'temporal',
    name: 'Temporal',
    description: 'Temporal workflow configuration',
    status: 'alpha',
    whatTheyNeed: ['Temporal server', 'Worker runtime'],
    folderStructure: ['.agents/{name}/manifest.ossa.yaml', 'workflows/'],
    sdkNpm: ['@temporalio/workflow', '@temporalio/worker'],
    exportHow: 'ossa export <manifest> --platform temporal -o dist/',
    importHow: 'no',
    specUsage: ['Map spec to workflow/activity definitions; OSSA as contract.'],
  },
  {
    id: 'n8n',
    name: 'n8n',
    description: 'n8n workflow JSON export',
    status: 'alpha',
    whatTheyNeed: ['n8n instance', 'Workflow JSON'],
    folderStructure: ['.agents/{name}/manifest.ossa.yaml', 'n8n/'],
    sdkNpm: ['n8n (self-hosted or cloud)'],
    exportHow: 'ossa export <manifest> --platform n8n -o dist/',
    importHow: 'no',
    specUsage: ['Export OSSA to n8n workflow nodes; spec.role and spec.tools map to nodes.'],
  },
  {
    id: 'agent-skills',
    name: 'Agent Skills',
    description: 'Agent Skills package (SKILL.md format for Claude Code / Cowork)',
    status: 'production',
    whatTheyNeed: ['SKILL.md format', 'Claude Code or Cowork'],
    folderStructure: ['.agents/{name}/manifest.ossa.yaml', '.agents/{name}/skills/*/SKILL.md'],
    sdkNpm: ['Anthropic Skills format (no separate SDK)'],
    exportHow: 'ossa export <manifest> --platform agent-skills -o skills/',
    importHow: 'no',
    specUsage: ['SKILL.md generated from manifest; OSSA is source of truth for description and tools.'],
  },
  {
    id: 'warp',
    name: 'Warp',
    description: 'Warp terminal agent with CLI triggers',
    status: 'beta',
    whatTheyNeed: ['Warp terminal', 'Agent config'],
    folderStructure: ['.agents/{name}/manifest.ossa.yaml'],
    sdkNpm: ['Warp config (no public SDK)'],
    exportHow: 'ossa export <manifest> --platform warp -o dist/',
    importHow: 'no',
    specUsage: ['Export produces Warp-compatible agent config from manifest.'],
  },
];

/** Platform IDs that support import (ossa import --from <id>) */
export const IMPORT_SUPPORTED_IDS: string[] = PLATFORM_MATRIX.filter(
  (p) => p.importHow === 'yes' || p.importHow === 'partial'
).map((p) => p.id);

/** Default folder structure (OSSA standard); used when no platform override */
export const DEFAULT_FOLDER_STRUCTURE = [
  '.agents/{name}/manifest.ossa.yaml',
  '.agents/{name}/openapi.yaml',
  '.agents/{name}/prompts/',
  '.agents/{name}/tools/',
  '.agents/{name}/config/',
  '.agents/{name}/api/',
  '.agents/{name}/src/',
  '.agents/{name}/tests/',
  '.agents/{name}/AGENTS.md',
];

export function getPlatformById(id: string): PlatformMatrixEntry | undefined {
  return PLATFORM_MATRIX.find((p) => p.id === id);
}

export function getPlatformsForExport(): PlatformMatrixEntry[] {
  return PLATFORM_MATRIX.filter((p) => p.status !== 'planned' && p.exportHow);
}
