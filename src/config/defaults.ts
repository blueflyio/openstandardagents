/**
 * OSSA Default Configuration
 *
 * Centralized default values for all OSSA CLI commands.
 * All defaults can be overridden via environment variables.
 *
 * DRY: Single source of truth for all default values
 * SOLID: Configuration separated from business logic
 *
 * @module config/defaults
 */

/**
 * Get default agent version
 * Can be overridden via OSSA_DEFAULT_AGENT_VERSION env var
 */
export function getDefaultAgentVersion(): string {
  return process.env.OSSA_DEFAULT_AGENT_VERSION || '1.0.0';
}

/**
 * Get default agent type
 * Can be overridden via OSSA_DEFAULT_AGENT_TYPE env var
 */
export function getDefaultAgentType(): string {
  return process.env.OSSA_DEFAULT_AGENT_TYPE || 'worker';
}

/**
 * Get default LLM provider
 * Can be overridden via OSSA_DEFAULT_LLM_PROVIDER env var
 */
export function getDefaultLLMProvider(): string {
  return process.env.OSSA_DEFAULT_LLM_PROVIDER || 'openai';
}

/**
 * Get default LLM model (with environment variable pattern)
 * Can be overridden via OSSA_DEFAULT_LLM_MODEL env var
 */
export function getDefaultLLMModel(): string {
  const defaultModel = process.env.OSSA_DEFAULT_LLM_MODEL || 'gpt-4';
  return `\${LLM_MODEL:-${defaultModel}}`;
}

/**
 * Get default agent kind
 * Can be overridden via OSSA_DEFAULT_AGENT_KIND env var
 */
export function getDefaultAgentKind(): string {
  return process.env.OSSA_DEFAULT_AGENT_KIND || 'Agent';
}

/**
 * Get default agent name fallback
 * Can be overridden via OSSA_DEFAULT_AGENT_NAME_FALLBACK env var
 */
export function getDefaultAgentNameFallback(): string {
  return process.env.OSSA_DEFAULT_AGENT_NAME_FALLBACK || 'agent';
}

/**
 * Get default scaffold agent name
 * Can be overridden via OSSA_DEFAULT_SCAFFOLD_NAME env var
 */
export function getDefaultScaffoldName(): string {
  return process.env.OSSA_DEFAULT_SCAFFOLD_NAME || 'my-agent';
}

/**
 * Get default output directory
 * Can be overridden via OSSA_DEFAULT_OUTPUT_DIR env var
 */
export function getDefaultOutputDir(): string {
  return process.env.OSSA_DEFAULT_OUTPUT_DIR || '.agents';
}

/**
 * Get default workspace directory
 * Can be overridden via OSSA_DEFAULT_WORKSPACE_DIR env var
 */
export function getDefaultWorkspaceDir(): string {
  return process.env.OSSA_DEFAULT_WORKSPACE_DIR || '.agents-workspace';
}

/**
 * Get agent type configurations
 */
export interface AgentTypeConfig {
  type: string;
  capabilityName: string;
  description: string;
}

/**
 * Get supported agent types with their configurations
 */
export function getAgentTypeConfigs(): Record<string, AgentTypeConfig> {
  const typesEnv = process.env.OSSA_AGENT_TYPES;
  if (typesEnv) {
    try {
      return JSON.parse(typesEnv);
    } catch {
      // Fall through to defaults
    }
  }

  return {
    worker: {
      type: 'worker',
      capabilityName: '',
      description: 'Standard worker agent',
    },
    orchestrator: {
      type: 'orchestrator',
      capabilityName: 'orchestration',
      description: 'Multi-agent workflow coordination',
    },
    judge: {
      type: 'judge',
      capabilityName: 'evaluation',
      description: 'Agent output evaluation and scoring',
    },
  };
}

/**
 * Get default role template
 * Can be overridden via OSSA_DEFAULT_ROLE_TEMPLATE env var
 * Template supports {name} placeholder
 */
export function getDefaultRoleTemplate(agentName?: string): string {
  const template =
    process.env.OSSA_DEFAULT_ROLE_TEMPLATE ||
    'You are {name}, a helpful AI agent.';

  if (agentName) {
    return template.replace('{name}', agentName);
  }
  return template.replace('{name}', 'an AI agent');
}

/**
 * Get default description template
 * Can be overridden via OSSA_DEFAULT_DESCRIPTION_TEMPLATE env var
 * Template supports {name} placeholder
 */
export function getDefaultDescriptionTemplate(agentName: string): string {
  const template =
    process.env.OSSA_DEFAULT_DESCRIPTION_TEMPLATE ||
    '{name} - OSSA-compliant agent';

  return template.replace('{name}', agentName);
}

/**
 * Get required workspace subdirectories
 * Can be overridden via OSSA_REQUIRED_WORKSPACE_DIRS env var (comma-separated)
 */
export function getRequiredWorkspaceDirs(): string[] {
  const envDirs = process.env.OSSA_REQUIRED_WORKSPACE_DIRS;
  if (envDirs) {
    return envDirs
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);
  }
  return ['registry', 'policies', 'orchestration', 'shared-context', 'logs'];
}

/**
 * Get workspace registry file path
 * Can be overridden via OSSA_WORKSPACE_REGISTRY_PATH env var
 */
export function getWorkspaceRegistryPath(): string {
  return process.env.OSSA_WORKSPACE_REGISTRY_PATH || 'registry/index.yaml';
}

/**
 * Get workspace policy file path
 * Can be overridden via OSSA_WORKSPACE_POLICY_PATH env var
 */
export function getWorkspacePolicyPath(): string {
  return (
    process.env.OSSA_WORKSPACE_POLICY_PATH || 'policies/tool-allowlist.yaml'
  );
}

/**
 * Get DNS-1123 name validation regex
 */
export function getDNS1123Regex(): RegExp {
  return /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;
}

/**
 * Get semantic version validation regex
 */
export function getSemanticVersionRegex(): RegExp {
  return /^\d+\.\d+\.\d+/;
}

/**
 * Get maximum DNS-1123 name length
 */
export function getMaxDNS1123Length(): number {
  return parseInt(process.env.OSSA_MAX_DNS1123_LENGTH || '63', 10);
}

/**
 * Get default agent discovery patterns
 * Can be overridden via OSSA_DISCOVERY_PATTERNS env var (comma-separated)
 */
export function getDefaultDiscoveryPatterns(): string[] {
  const envPatterns = process.env.OSSA_DISCOVERY_PATTERNS;
  if (envPatterns) {
    return envPatterns
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
  }
  const outputDir = getDefaultOutputDir();
  return [`${outputDir}/**/*.ossa.yaml`, `${outputDir}/**/manifest.ossa.yaml`];
}

/**
 * Get default discovery strategy
 * Can be overridden via OSSA_DISCOVERY_STRATEGY env var
 */
export function getDefaultDiscoveryStrategy(): string {
  return process.env.OSSA_DISCOVERY_STRATEGY || 'filesystem';
}

/**
 * Get default discovery refresh mode
 * Can be overridden via OSSA_DISCOVERY_REFRESH env var
 */
export function getDefaultDiscoveryRefresh(): string {
  return process.env.OSSA_DISCOVERY_REFRESH || 'on-demand';
}

/**
 * Get default registry kind
 * Can be overridden via OSSA_REGISTRY_KIND env var
 */
export function getDefaultRegistryKind(): string {
  return process.env.OSSA_REGISTRY_KIND || 'AgentRegistry';
}

/**
 * Get default policy kind
 * Can be overridden via OSSA_POLICY_KIND env var
 */
export function getDefaultPolicyKind(): string {
  return process.env.OSSA_POLICY_KIND || 'ToolPolicy';
}

/**
 * Get default API version for OSSA resources
 * Can be overridden via OSSA_API_VERSION env var
 */
export function getDefaultOSSAAPIVersion(): string {
  return process.env.OSSA_API_VERSION || 'ossa.dev/v1';
}

/**
 * Build command defaults
 * Can be overridden via environment variables
 */
export function getBuildDefaults() {
  return {
    outputDir: process.env.OSSA_BUILD_OUTPUT_DIR || 'dist/build',
    baseImage: process.env.OSSA_BASE_IMAGE || 'node:20-alpine',
    platforms: ['npm', 'langchain', 'crewai', 'anthropic', 'drupal', 'kagent'],
  };
}

/**
 * Runtime command defaults
 * Can be overridden via environment variables
 */
export function getRuntimeDefaults() {
  return {
    defaultRuntime: process.env.OSSA_DEFAULT_RUNTIME || 'openai',
    maxTurns: parseInt(process.env.OSSA_MAX_TURNS || '10', 10),
    defaultProvider: process.env.OSSA_LLM_PROVIDER || 'openai',
    defaultModel: process.env.OSSA_LLM_MODEL || 'gpt-4',
  };
}

/**
 * Deploy command defaults
 * Can be overridden via environment variables
 */
export function getDeployDefaults() {
  return {
    defaultPlatform: process.env.OSSA_DEFAULT_DEPLOY_PLATFORM || 'kagent',
    defaultTarget: process.env.OSSA_DEFAULT_DEPLOY_TARGET || 'local',
    defaultNamespace: process.env.OSSA_DEFAULT_DEPLOY_NAMESPACE || 'default',
    defaultReplicas: parseInt(
      process.env.OSSA_DEFAULT_DEPLOY_REPLICAS || '1',
      10
    ),
    dockerNetwork: process.env.OSSA_DOCKER_NETWORK || 'bridge',
    environment: process.env.OSSA_DEFAULT_ENVIRONMENT || 'dev',
  };
}

/**
 * Init command defaults
 * Can be overridden via environment variables
 */
export function getInitDefaults() {
  return {
    outputPath: process.env.OSSA_INIT_OUTPUT_PATH || 'agent.ossa.json',
    defaultVersion: process.env.OSSA_DEFAULT_VERSION || '1.0.0',
    defaultLLMProvider: process.env.OSSA_INIT_LLM_PROVIDER || 'openai',
    defaultLLMModels: {
      openai: process.env.OSSA_INIT_OPENAI_MODEL || 'gpt-4',
      anthropic:
        process.env.OSSA_INIT_ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      google: process.env.OSSA_INIT_GOOGLE_MODEL || 'gemini-pro',
    },
    defaultDescription:
      process.env.OSSA_DEFAULT_DESCRIPTION || 'OSSA-compliant agent',
    defaultPlatforms: (process.env.OSSA_DEFAULT_PLATFORMS || 'cursor,openai')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean),
  };
}

/**
 * Audit command defaults
 * Can be overridden via environment variables
 */
export function getAuditDefaults() {
  return {
    scanPath: process.env.OSSA_AUDIT_SCAN_PATH || './packages/@ossa',
    validationLevel: process.env.OSSA_AUDIT_LEVEL || 'full',
    specVersion: process.env.OSSA_SPEC_VERSION || '0.3.5',
    outputFormat: process.env.OSSA_AUDIT_FORMAT || 'table',
    recursive: process.env.OSSA_AUDIT_RECURSIVE !== 'false',
    includeExamples: process.env.OSSA_AUDIT_INCLUDE_EXAMPLES !== 'false',
  };
}
