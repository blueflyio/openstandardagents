/**
 * OSSA v0.5 Sub-Agent Type Definitions
 *
 * Vendor-neutral primitives for multi-agent orchestration
 */

// =============================================================================
// Model Configuration
// =============================================================================

/**
 * Abstract model tiers - not provider-specific names
 */
export type ModelTier = 'fast' | 'capable' | 'powerful';

/**
 * Known LLM providers for export hints
 */
export type LLMProvider =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'azure'
  | 'bedrock'
  | 'ollama'
  | 'groq'
  | 'together';

/**
 * Model configuration for sub-agents
 */
export interface SubAgentModel {
  /**
   * Abstract capability tier
   * - fast: Low latency, lower cost (Haiku, GPT-4-mini, Gemini Flash)
   * - capable: Balanced (Sonnet, GPT-4, Gemini Pro)
   * - powerful: Maximum capability (Opus, GPT-4-turbo, Gemini Ultra)
   */
  tier: ModelTier;

  /**
   * Whether to inherit the parent agent's model
   * @default true
   */
  inherit?: boolean;

  /**
   * Preferred provider for exports (optional hint)
   */
  preferredProvider?: LLMProvider;
}

// =============================================================================
// Permission Modes
// =============================================================================

/**
 * Vendor-neutral permission levels
 *
 * Maps to framework-specific concepts:
 * - autonomous → Claude: bypassPermissions
 * - supervised → Claude: default
 * - assisted → Claude: acceptEdits
 * - readonly → Claude: plan
 * - delegator → Claude: delegate
 */
export type PermissionMode =
  | 'autonomous'   // No approval needed
  | 'supervised'   // Approval for destructive actions
  | 'assisted'     // Auto-accept safe edits
  | 'readonly'     // No modifications allowed
  | 'delegator';   // Coordination only, no direct actions

/**
 * Permission configuration for sub-agents
 */
export interface SubAgentPermissions {
  /**
   * Permission handling mode
   */
  mode: PermissionMode;

  /**
   * Whether to inherit parent's permission context
   * @default true
   */
  inherit?: boolean;
}

// =============================================================================
// Tool Configuration
// =============================================================================

/**
 * Standard OSSA tool names for interoperability
 */
export type StandardTool =
  | 'read'        // Read file contents
  | 'write'       // Create/overwrite files
  | 'edit'        // Modify existing files
  | 'execute'     // Run shell commands
  | 'search'      // Search file contents (grep)
  | 'glob'        // Find files by pattern
  | 'web_fetch'   // Fetch URL content
  | 'web_search'  // Search the web
  | 'ask_user'    // Request user input
  | 'task'        // Spawn sub-agents
  | string;       // Custom tools

/**
 * Tool access control for sub-agents
 */
export interface SubAgentTools {
  /**
   * Allowlist: Only these tools are available
   * If not set, inherits from parent
   */
  allow?: StandardTool[];

  /**
   * Denylist: These tools are removed from available set
   * Applied after allow/inherit
   */
  deny?: StandardTool[];

  /**
   * Whether to inherit parent's tool set
   * @default true
   */
  inherit?: boolean;
}

// =============================================================================
// Delegation
// =============================================================================

/**
 * Delegation configuration for a sub-agent
 */
export interface SubAgentDelegation {
  /**
   * Natural language description of when to delegate to this agent
   */
  trigger: string;

  /**
   * Whether the parent agent can proactively delegate
   * @default false
   */
  proactive?: boolean;

  /**
   * Only delegate when explicitly requested by user
   * @default false
   */
  explicit?: boolean;
}

/**
 * Delegation rule for routing tasks
 */
export interface DelegationRule {
  /**
   * Condition for delegation (natural language or expression)
   */
  when: string;

  /**
   * Sub-agent to delegate to
   */
  delegate: string;

  /**
   * Optional: Chain to another sub-agent after completion
   */
  then?: string;

  /**
   * Constraints for this delegation
   */
  constraints?: string[];
}

/**
 * Parallel execution configuration
 */
export interface ParallelExecution {
  /**
   * Enable parallel sub-agent execution
   * @default false
   */
  enabled: boolean;

  /**
   * Maximum concurrent sub-agents
   * @default 3
   */
  maxConcurrent?: number;

  /**
   * Coordination strategy
   * - independent: Sub-agents don't share context
   * - coordinated: Sub-agents can see each other's results
   * @default 'independent'
   */
  strategy?: 'independent' | 'coordinated';
}

/**
 * Top-level delegation configuration
 */
export interface DelegationConfig {
  /**
   * Delegation strategy
   * - automatic: Agent decides based on triggers
   * - explicit: Only delegate when user requests
   * - rules: Use delegation rules
   * @default 'automatic'
   */
  strategy: 'automatic' | 'explicit' | 'rules';

  /**
   * Delegation rules (for strategy: 'rules')
   */
  rules?: DelegationRule[];

  /**
   * Parallel execution settings
   */
  parallel?: ParallelExecution;
}

// =============================================================================
// Execution
// =============================================================================

/**
 * Execution mode for sub-agents
 */
export type ExecutionMode = 'foreground' | 'background';

/**
 * Duration string (e.g., "5m", "1h", "30s")
 */
export type Duration = string;

/**
 * Execution configuration for sub-agents
 */
export interface SubAgentExecution {
  /**
   * Execution mode
   * - foreground: Blocks until complete
   * - background: Runs concurrently
   * @default 'foreground'
   */
  mode?: ExecutionMode;

  /**
   * Maximum agentic turns before stopping
   */
  maxTurns?: number;

  /**
   * Execution timeout
   */
  timeout?: Duration;
}

// =============================================================================
// Memory
// =============================================================================

/**
 * Memory persistence scope
 */
export type MemoryScope =
  | 'session'   // Current session only
  | 'local'     // Persists across sessions, not shared
  | 'project'   // Persists, shared via version control
  | 'user';     // Persists across all projects

/**
 * Memory storage format
 */
export type MemoryFormat = 'markdown' | 'json' | 'sqlite';

/**
 * Memory retention policy
 */
export interface MemoryRetention {
  /**
   * Maximum age of memory entries
   */
  maxAge?: Duration;

  /**
   * Maximum number of entries
   */
  maxEntries?: number;
}

/**
 * Memory configuration for sub-agents
 */
export interface SubAgentMemory {
  /**
   * Persistence scope
   */
  scope: MemoryScope;

  /**
   * Storage location (relative path)
   * @default '.ossa/memory/'
   */
  path?: string;

  /**
   * Storage format
   * @default 'markdown'
   */
  format?: MemoryFormat;

  /**
   * Maximum storage size
   */
  maxSize?: string;

  /**
   * Retention policy
   */
  retention?: MemoryRetention;

  /**
   * Categories of information to remember
   */
  categories?: string[];
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Single hook command
 */
export interface HookCommand {
  /**
   * Command to execute
   */
  command: string;

  /**
   * Execution timeout
   */
  timeout?: Duration;
}

/**
 * Tool-matching hook
 */
export interface ToolHook {
  /**
   * Tool name pattern (regex)
   */
  matcher: string;

  /**
   * Command to execute
   */
  command: string;

  /**
   * If true, can prevent tool execution (exit code 2)
   * @default false
   */
  blocking?: boolean;
}

/**
 * Sub-agent matching hook
 */
export interface SubAgentHook {
  /**
   * Sub-agent name pattern (regex)
   */
  matcher: string;

  /**
   * Command to execute
   */
  command: string;
}

/**
 * Lifecycle hooks for sub-agents
 */
export interface SubAgentHooks {
  /**
   * Run when sub-agent starts
   */
  onStart?: HookCommand[];

  /**
   * Run when sub-agent completes
   */
  onComplete?: HookCommand[];

  /**
   * Run before tool execution
   */
  beforeToolUse?: ToolHook[];

  /**
   * Run after tool execution
   */
  afterToolUse?: ToolHook[];

  /**
   * Run when a nested sub-agent starts
   */
  onSubAgentStart?: SubAgentHook[];

  /**
   * Run when a nested sub-agent completes
   */
  onSubAgentComplete?: SubAgentHook[];
}

// =============================================================================
// Sub-Agent Definition
// =============================================================================

/**
 * Complete sub-agent definition
 */
export interface SubAgent {
  /**
   * Unique identifier (lowercase, hyphens allowed)
   */
  name: string;

  /**
   * Description of when to delegate to this agent
   * Used by parent agent to decide delegation
   */
  description: string;

  /**
   * Model configuration
   */
  model?: SubAgentModel;

  /**
   * Tool access control
   */
  tools?: SubAgentTools;

  /**
   * Permission configuration
   */
  permissions?: SubAgentPermissions;

  /**
   * Delegation triggers
   */
  delegation?: SubAgentDelegation;

  /**
   * Execution settings
   */
  execution?: SubAgentExecution;

  /**
   * Persistent memory
   */
  memory?: SubAgentMemory;

  /**
   * Lifecycle hooks
   */
  hooks?: SubAgentHooks;

  /**
   * System prompt for the sub-agent
   */
  role?: string;

  /**
   * Nested sub-agents (max depth: 2)
   */
  subAgents?: SubAgent[];
}

// =============================================================================
// Agent Spec Extension
// =============================================================================

/**
 * Extension to OSSA Agent spec for v0.5
 */
export interface AgentSpecV05Extension {
  /**
   * Sub-agent definitions
   */
  subAgents?: SubAgent[];

  /**
   * Delegation configuration
   */
  delegation?: DelegationConfig;

  /**
   * Parent agent memory
   */
  memory?: SubAgentMemory;

  /**
   * Parent agent hooks
   */
  hooks?: SubAgentHooks;
}

// =============================================================================
// Export Helpers
// =============================================================================

/**
 * Model tier to provider-specific model mapping
 */
export interface ModelTierMapping {
  fast: string;
  capable: string;
  powerful: string;
}

/**
 * Default model mappings by provider
 */
export const DEFAULT_MODEL_MAPPINGS: Record<LLMProvider, ModelTierMapping> = {
  anthropic: {
    fast: 'claude-3-haiku-20240307',
    capable: 'claude-sonnet-4-20250514',
    powerful: 'claude-opus-4-20250514',
  },
  openai: {
    fast: 'gpt-4o-mini',
    capable: 'gpt-4o',
    powerful: 'gpt-4-turbo',
  },
  google: {
    fast: 'gemini-1.5-flash',
    capable: 'gemini-1.5-pro',
    powerful: 'gemini-ultra',
  },
  azure: {
    fast: 'gpt-4o-mini',
    capable: 'gpt-4o',
    powerful: 'gpt-4-turbo',
  },
  bedrock: {
    fast: 'anthropic.claude-3-haiku-20240307-v1:0',
    capable: 'anthropic.claude-3-sonnet-20240229-v1:0',
    powerful: 'anthropic.claude-3-opus-20240229-v1:0',
  },
  ollama: {
    fast: 'llama3.2:1b',
    capable: 'llama3.2:3b',
    powerful: 'llama3.1:70b',
  },
  groq: {
    fast: 'llama-3.2-1b-preview',
    capable: 'llama-3.2-90b-text-preview',
    powerful: 'llama-3.2-90b-text-preview',
  },
  together: {
    fast: 'meta-llama/Llama-3.2-3B-Instruct-Turbo',
    capable: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
    powerful: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
  },
};

/**
 * Permission mode to Claude Code mapping
 */
export const CLAUDE_PERMISSION_MODES: Record<PermissionMode, string> = {
  autonomous: 'bypassPermissions',
  supervised: 'default',
  assisted: 'acceptEdits',
  readonly: 'plan',
  delegator: 'delegate',
};

/**
 * Standard tool to Claude Code tool mapping
 */
export const CLAUDE_TOOL_NAMES: Record<string, string> = {
  read: 'Read',
  write: 'Write',
  edit: 'Edit',
  execute: 'Bash',
  search: 'Grep',
  glob: 'Glob',
  web_fetch: 'WebFetch',
  web_search: 'WebSearch',
  ask_user: 'AskUserQuestion',
  task: 'Task',
};
