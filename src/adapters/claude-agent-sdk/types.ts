/**
 * Claude Agent SDK Type Definitions
 *
 * Types for generating runnable Claude Agent SDK applications from OSSA manifests.
 * Supports both TypeScript (@anthropic-ai/claude-agent-sdk) and Python (claude-agent-sdk).
 *
 * References:
 * - TS: https://docs.claude.com/en/api/agent-sdk/typescript
 * - PY: https://docs.claude.com/en/api/agent-sdk/python
 * - Go (community): github.com/M1n9X/claude-agent-sdk-go
 * - Rust (community): claude_agent crate
 */

/**
 * Target language for generated SDK application
 */
export type SdkLanguage = 'typescript' | 'python' | 'go' | 'rust';

/**
 * Claude Agent SDK permission mode
 */
export type PermissionMode = 'default' | 'acceptEdits' | 'bypassPermissions' | 'planMode';

/**
 * Claude Agent SDK model identifiers
 */
export type ClaudeModel =
  | 'claude-sonnet-4-20250514'
  | 'claude-opus-4-20250514'
  | 'claude-haiku-4-5-20251001'
  | string;

/**
 * MCP server configuration for the generated agent
 */
export interface SdkMcpServerConfig {
  /** Server type */
  type: 'stdio' | 'sse' | 'http';
  /** Command for stdio servers */
  command?: string;
  /** Args for stdio servers */
  args?: string[];
  /** URL for sse/http servers */
  url?: string;
  /** Environment variables */
  env?: Record<string, string>;
  /** Headers for sse/http */
  headers?: Record<string, string>;
}

/**
 * Sub-agent definition for the generated agent
 */
export interface SdkSubAgent {
  /** Sub-agent name */
  name: string;
  /** Description shown to parent agent */
  description: string;
  /** System prompt */
  systemPrompt: string;
  /** Tools available to sub-agent */
  tools?: string[];
  /** Model override */
  model?: ClaudeModel;
}

/**
 * Custom tool definition for the generated agent
 */
export interface SdkToolDefinition {
  /** Tool name */
  name: string;
  /** Tool description */
  description: string;
  /** Input schema (JSON Schema) */
  inputSchema: Record<string, unknown>;
  /** Whether tool is async */
  async?: boolean;
}

/**
 * Full agent SDK configuration (maps from OSSA manifest)
 */
export interface ClaudeAgentSdkConfig {
  /** Agent name (from metadata.name) */
  name: string;
  /** Agent description */
  description: string;
  /** System prompt (from spec.role) */
  systemPrompt: string;
  /** Model to use */
  model: ClaudeModel;
  /** Permission mode */
  permissionMode: PermissionMode;
  /** Max turns */
  maxTurns?: number;
  /** Budget limit in USD */
  maxBudgetUsd?: number;
  /** Built-in tools to allow */
  allowedTools: string[];
  /** MCP servers */
  mcpServers: Record<string, SdkMcpServerConfig>;
  /** Sub-agents */
  agents: Record<string, SdkSubAgent>;
  /** Custom tools */
  customTools: SdkToolDefinition[];
  /** Version from OSSA metadata */
  version: string;
  /** OSSA manifest source */
  ossaVersion: string;
}

/**
 * Generated project files for a specific language
 */
export interface SdkProjectFiles {
  /** Target language */
  language: SdkLanguage;
  /** Entry point file */
  entryPoint: string;
  /** Package/dependency file */
  packageFile: string;
  /** Config files (tsconfig, etc.) */
  configFiles: Record<string, string>;
  /** Example/usage file */
  exampleFile?: string;
  /** Environment template */
  envTemplate: string;
}

/**
 * Export options specific to Claude Agent SDK
 */
export interface ClaudeAgentSdkExportOptions {
  /** Target languages to generate (default: ['typescript', 'python']) */
  languages?: SdkLanguage[];
  /** Include custom tools scaffolding */
  includeCustomTools?: boolean;
  /** Include sub-agents scaffolding */
  includeSubAgents?: boolean;
  /** Include MCP server configuration */
  includeMcpServers?: boolean;
  /** Include streaming example */
  includeStreaming?: boolean;
  /** Include multi-turn session example */
  includeSession?: boolean;
}
