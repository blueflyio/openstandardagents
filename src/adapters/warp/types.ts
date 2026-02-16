/**
 * Warp Terminal Agent Type Definitions
 * https://docs.warp.dev/agent-platform/getting-started/agents-in-warp
 */

/**
 * Warp Agent Definition
 */
export interface WarpAgent {
  /**
   * Unique agent identifier
   */
  name: string;

  /**
   * Human-readable description
   */
  description: string;

  /**
   * Agent commands
   */
  commands: WarpCommand[];

  /**
   * Command triggers (optional)
   */
  triggers?: WarpTrigger[];

  /**
   * Agent permissions
   */
  permissions?: WarpPermission[];

  /**
   * Agent metadata
   */
  metadata?: {
    version?: string;
    author?: string;
    tags?: string[];
    [key: string]: unknown;
  };
}

/**
 * Warp Command Definition
 */
export interface WarpCommand {
  /**
   * Command name (invoked as /name in Warp)
   */
  name: string;

  /**
   * Command description
   */
  description: string;

  /**
   * Command parameters
   */
  parameters?: Record<string, WarpParameter>;

  /**
   * Shell command or script path to execute
   */
  handler: string;

  /**
   * Command aliases
   */
  aliases?: string[];

  /**
   * Command examples
   */
  examples?: string[];
}

/**
 * Warp Parameter Definition
 */
export interface WarpParameter {
  /**
   * Parameter type
   */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';

  /**
   * Parameter description
   */
  description: string;

  /**
   * Whether parameter is required
   */
  required?: boolean;

  /**
   * Default value
   */
  default?: unknown;

  /**
   * Allowed values
   */
  enum?: unknown[];
}

/**
 * Warp Trigger Definition
 */
export interface WarpTrigger {
  /**
   * Trigger type
   */
  type: 'keyword' | 'pattern' | 'event';

  /**
   * Trigger value (keyword, regex pattern, or event name)
   */
  value: string;

  /**
   * Command to execute when triggered
   */
  command: string;
}

/**
 * Warp Permission Definition
 */
export interface WarpPermission {
  /**
   * Permission type
   */
  type:
    | 'filesystem'
    | 'network'
    | 'environment'
    | 'process'
    | 'clipboard'
    | 'system';

  /**
   * Permission scope (e.g., read, write, execute)
   */
  scope: string[];

  /**
   * Permission description
   */
  description?: string;
}

/**
 * Warp Agent Configuration File
 */
export interface WarpAgentConfig {
  /**
   * Config file version
   */
  version: '1.0';

  /**
   * Agent definition
   */
  agent: WarpAgent;
}
