/**
 * Claude Code Sub-agent Type Definitions
 * https://code.claude.com/docs/en/sub-agents
 */

/**
 * Claude Code Sub-agent Definition
 */
export interface ClaudeCodeSubAgent {
  /**
   * Sub-agent name
   */
  name: string;

  /**
   * Sub-agent description
   */
  description: string;

  /**
   * System prompt for sub-agent behavior
   */
  system_prompt: string;

  /**
   * Sub-agent type
   */
  subagent_type: 'general-purpose' | 'Explore' | 'Plan' | 'Bash';

  /**
   * Maximum conversation turns
   */
  max_turns?: number;

  /**
   * Model to use (defaults to parent agent's model)
   */
  model?: 'sonnet' | 'opus' | 'haiku';

  /**
   * Tools available to sub-agent
   */
  tools: ClaudeCodeTool[];

  /**
   * Sub-agent metadata
   */
  metadata?: {
    version?: string;
    author?: string;
    tags?: string[];
    [key: string]: unknown;
  };
}

/**
 * Claude Code Tool Definition
 */
export interface ClaudeCodeTool {
  /**
   * Tool name
   */
  name: string;

  /**
   * Tool description
   */
  description: string;

  /**
   * Tool parameters (JSON Schema)
   */
  input_schema: ClaudeCodeInputSchema;

  /**
   * Tool implementation
   */
  implementation?: ClaudeCodeToolImplementation;
}

/**
 * Tool input schema (JSON Schema subset)
 */
export interface ClaudeCodeInputSchema {
  type: 'object';
  properties: Record<string, ClaudeCodeSchemaProperty>;
  required?: string[];
}

/**
 * Schema property
 */
export interface ClaudeCodeSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: unknown[];
  items?: ClaudeCodeSchemaProperty;
  default?: unknown;
}

/**
 * Tool implementation options
 */
export interface ClaudeCodeToolImplementation {
  /**
   * Implementation type
   */
  type: 'bash' | 'mcp' | 'api';

  /**
   * Bash command (for type: bash)
   */
  command?: string;

  /**
   * MCP server name (for type: mcp)
   */
  mcp_server?: string;

  /**
   * MCP tool name (for type: mcp)
   */
  mcp_tool?: string;

  /**
   * API endpoint (for type: api)
   */
  endpoint?: string;

  /**
   * HTTP method (for type: api)
   */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
}

/**
 * Sub-agent Configuration File
 */
export interface ClaudeCodeSubAgentConfig {
  /**
   * Config file version
   */
  version: '1.0';

  /**
   * Sub-agent definition
   */
  subagent: ClaudeCodeSubAgent;
}

/**
 * Sub-agent Skills Configuration
 * For integration with Claude Code skills system
 */
export interface ClaudeCodeSkillConfig {
  /**
   * Skill name (command name without slash)
   */
  name: string;

  /**
   * Skill description
   */
  description: string;

  /**
   * Whether skill spawns a sub-agent
   */
  spawns_subagent: boolean;

  /**
   * Sub-agent configuration (if spawns_subagent is true)
   */
  subagent_config?: ClaudeCodeSubAgent;

  /**
   * Skill implementation (if spawns_subagent is false)
   */
  implementation?: string;
}
