/**
 * OSSA Bridge Configuration Type Definitions
 */

export interface BridgeConfig {
  /** Model Context Protocol bridge */
  mcp?: MCPBridgeConfig;
  /** Agent-to-Agent protocol bridge */
  a2a?: A2ABridgeConfig;
  /** OpenAPI specification bridge */
  openapi?: OpenAPIBridgeConfig;
  /** LangChain framework bridge */
  langchain?: LangChainBridgeConfig;
  /** CrewAI framework bridge */
  crewai?: CrewAIBridgeConfig;
  /** AutoGen framework bridge */
  autogen?: AutoGenBridgeConfig;
  /** Custom bridge configurations */
  custom?: Record<string, unknown>;
}

// MCP Bridge Types
export interface MCPBridgeConfig {
  /** Enable MCP bridge */
  enabled: boolean;
  /** MCP transport type */
  server_type?: 'stdio' | 'sse' | 'websocket';
  /** MCP tools exposed by the agent */
  tools?: MCPTool[];
  /** MCP resources provided */
  resources?: MCPResource[];
  /** MCP prompts available */
  prompts?: MCPPrompt[];
  /** Additional configuration */
  config?: {
    /** Maximum message size in bytes */
    max_message_size?: number;
    /** Connection timeout in milliseconds */
    timeout_ms?: number;
    /** Number of retry attempts */
    retry_count?: number;
  };
}

export interface MCPTool {
  /** Tool name */
  name: string;
  /** Tool description */
  description: string;
  /** JSON Schema for tool input */
  input_schema?: Record<string, unknown>;
  /** JSON Schema for tool output */
  output_schema?: Record<string, unknown>;
  /** Mapped OSSA capability */
  capability?: string;
}

export interface MCPResource {
  /** Resource URI */
  uri: string;
  /** Resource name */
  name: string;
  /** Resource description */
  description?: string;
  /** MIME type */
  mimeType?: string;
  /** Read-only flag */
  readonly?: boolean;
}

export interface MCPPrompt {
  /** Prompt name */
  name: string;
  /** Prompt description */
  description?: string;
  /** Prompt template */
  template: string;
  /** Template arguments */
  arguments?: Array<{
    name: string;
    type?: string;
    required?: boolean;
  }>;
}

// A2A Bridge Types
export interface A2ABridgeConfig {
  /** Enable A2A bridge */
  enabled?: boolean;
  /** Agent card URL */
  card_url?: string;
  /** A2A schema version */
  schema_version?: string;
  /** Map OSSA capabilities to A2A actions */
  capabilities_mapping?: Record<string, string>;
  /** A2A metadata */
  metadata?: {
    '@context'?: string;
    '@type'?: string;
    [key: string]: unknown;
  };
}

// OpenAPI Bridge Types
export interface OpenAPIBridgeConfig {
  /** Enable OpenAPI bridge */
  enabled?: boolean;
  /** Path or URL to OpenAPI specification */
  spec_url?: string;
  /** OpenAPI specification version */
  spec_version?: '3.0' | '3.1';
  /** Auto-generate OpenAPI spec from agent manifest */
  auto_generate?: boolean;
  /** Server configurations */
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  /** Security configurations */
  security?: Array<Record<string, unknown>>;
}

// LangChain Bridge Types
export interface LangChainBridgeConfig {
  /** Enable LangChain bridge */
  enabled?: boolean;
  /** LangChain tool class name */
  tool_class?: string;
  /** Type of LangChain chain */
  chain_type?: 'llm' | 'retrieval' | 'agent' | 'sequential' | 'custom';
  /** Memory configuration */
  memory?: {
    type?: 'buffer' | 'summary' | 'conversation' | 'vector';
    max_tokens?: number;
  };
  /** LangChain callback handlers */
  callbacks?: string[];
  /** Export configuration */
  export?: {
    as_tool?: boolean;
    as_chain?: boolean;
    as_agent?: boolean;
  };
}

// CrewAI Bridge Types
export interface CrewAIBridgeConfig {
  /** Enable CrewAI bridge */
  enabled?: boolean;
  /** CrewAI agent role */
  agent_type?: 'worker' | 'manager' | 'researcher' | 'analyst' | 'custom';
  /** Agent role description */
  role?: string;
  /** Agent goal */
  goal?: string;
  /** Agent backstory for context */
  backstory?: string;
  /** CrewAI tools to use */
  tools?: string[];
  /** LLM configuration */
  llm?: {
    model?: string;
    temperature?: number;
  };
  /** Maximum iterations */
  max_iter?: number;
  /** Allow delegation to other agents */
  allow_delegation?: boolean;
}

// AutoGen Bridge Types
export interface AutoGenBridgeConfig {
  /** Enable AutoGen bridge */
  enabled?: boolean;
  /** AutoGen agent type */
  agent_type?: 'assistant' | 'user_proxy' | 'groupchat' | 'custom';
  /** System message for the agent */
  system_message?: string;
  /** Human input mode */
  human_input_mode?: 'ALWAYS' | 'NEVER' | 'TERMINATE';
  /** Code execution configuration */
  code_execution?: {
    enabled?: boolean;
    work_dir?: string;
    use_docker?: boolean;
  };
  /** LLM configuration */
  llm_config?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    functions?: Array<Record<string, unknown>>;
  };
  /** Maximum consecutive auto-replies */
  max_consecutive_auto_reply?: number;
}

// Bridge utility functions
export function createMCPBridge(tools: MCPTool[]): MCPBridgeConfig {
  return {
    enabled: true,
    server_type: 'stdio',
    tools
  };
}

export function createOpenAPIBridge(specUrl: string): OpenAPIBridgeConfig {
  return {
    enabled: true,
    spec_url: specUrl,
    spec_version: '3.1',
    auto_generate: false
  };
}

export function createLangChainBridge(
  toolClass: string,
  chainType: LangChainBridgeConfig['chain_type'] = 'agent'
): LangChainBridgeConfig {
  return {
    enabled: true,
    tool_class: toolClass,
    chain_type: chainType,
    export: {
      as_tool: true,
      as_chain: false,
      as_agent: false
    }
  };
}

// Bridge validation
export function hasBridgeSupport(config: BridgeConfig): boolean {
  return !!(
    config.mcp?.enabled ||
    config.a2a?.enabled ||
    config.openapi?.enabled ||
    config.langchain?.enabled ||
    config.crewai?.enabled ||
    config.autogen?.enabled
  );
}

export function getSupportedBridges(config: BridgeConfig): string[] {
  const bridges: string[] = [];
  if (config.mcp?.enabled) bridges.push('mcp');
  if (config.a2a?.enabled) bridges.push('a2a');
  if (config.openapi?.enabled) bridges.push('openapi');
  if (config.langchain?.enabled) bridges.push('langchain');
  if (config.crewai?.enabled) bridges.push('crewai');
  if (config.autogen?.enabled) bridges.push('autogen');
  return bridges;
}

export function countBridges(config: BridgeConfig): number {
  return getSupportedBridges(config).length;
}