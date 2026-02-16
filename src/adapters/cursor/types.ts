/**
 * Cursor Cloud Agent Type Definitions
 * https://cursor.com/docs/cloud-agent
 */

/**
 * Cursor Cloud Agent Definition
 */
export interface CursorCloudAgent {
  /**
   * Agent name
   */
  name: string;

  /**
   * Agent description
   */
  description: string;

  /**
   * System prompt for agent behavior
   */
  prompt: string;

  /**
   * Agent capabilities
   */
  capabilities: CursorCapability[];

  /**
   * Agent tools
   */
  tools: CursorTool[];

  /**
   * Agent context configuration
   */
  context: CursorContext;

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
 * Cursor Agent Capability
 */
export interface CursorCapability {
  /**
   * Capability type
   */
  type:
    | 'code-generation'
    | 'code-review'
    | 'refactoring'
    | 'testing'
    | 'documentation'
    | 'debugging'
    | 'terminal'
    | 'custom';

  /**
   * Capability configuration
   */
  config?: {
    /**
     * Programming languages supported
     */
    languages?: string[];

    /**
     * Frameworks supported
     */
    frameworks?: string[];

    /**
     * Additional configuration
     */
    [key: string]: unknown;
  };
}

/**
 * Cursor Agent Tool
 */
export interface CursorTool {
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
  parameters: JSONSchema;

  /**
   * Tool implementation
   * - Code string (JavaScript/TypeScript)
   * - API endpoint URL
   * - Shell command
   */
  implementation: string;

  /**
   * Implementation type
   */
  implementationType?: 'code' | 'api' | 'shell';

  /**
   * Tool examples
   */
  examples?: CursorToolExample[];
}

/**
 * Tool example
 */
export interface CursorToolExample {
  /**
   * Example input
   */
  input: Record<string, unknown>;

  /**
   * Expected output
   */
  output: unknown;

  /**
   * Example description
   */
  description?: string;
}

/**
 * Cursor Agent Context Configuration
 */
export interface CursorContext {
  /**
   * Workspace configuration
   */
  workspace?: {
    /**
     * Include workspace files in context
     */
    includeFiles?: boolean;

    /**
     * File patterns to include
     */
    includePatterns?: string[];

    /**
     * File patterns to exclude
     */
    excludePatterns?: string[];

    /**
     * Maximum file size (bytes)
     */
    maxFileSize?: number;
  };

  /**
   * Codebase indexing
   */
  indexing?: {
    /**
     * Enable semantic code search
     */
    enabled?: boolean;

    /**
     * Indexing depth
     */
    depth?: number;
  };

  /**
   * Memory configuration
   */
  memory?: {
    /**
     * Enable conversation memory
     */
    enabled?: boolean;

    /**
     * Maximum memory entries
     */
    maxEntries?: number;
  };

  /**
   * External integrations
   */
  integrations?: {
    /**
     * Git integration
     */
    git?: boolean;

    /**
     * LSP integration
     */
    lsp?: boolean;

    /**
     * Terminal integration
     */
    terminal?: boolean;
  };
}

/**
 * JSON Schema type
 */
export interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
  [key: string]: unknown;
}

/**
 * JSON Schema Property
 */
export interface JSONSchemaProperty {
  type: string;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  items?: JSONSchemaProperty;
  [key: string]: unknown;
}

/**
 * Cursor Agent Configuration File
 */
export interface CursorAgentConfig {
  /**
   * Config file version
   */
  version: '1.0';

  /**
   * Agent definition
   */
  agent: CursorCloudAgent;
}
