/**
 * OSSA Tool Types
 * Defines tool/trigger types and configurations for OSSA agents
 *
 * Based on OSSA v0.4.4 spec - 19 tool types
 */

/**
 * All supported tool types in OSSA v0.4.4
 */
export type ToolType =
  | 'mcp' // Model Context Protocol servers
  | 'browser' // Browser automation (Puppeteer/Playwright)
  | 'kubernetes' // Kubernetes API integration
  | 'http' // HTTP endpoints
  | 'api' // REST API integration
  | 'grpc' // gRPC services
  | 'function' // Local function calls
  | 'a2a' // Agent-to-agent communication
  | 'webhook' // Event-driven webhooks
  | 'schedule' // Cron-based scheduling
  | 'pipeline' // CI/CD pipeline events
  | 'workflow' // Workflow status changes
  | 'artifact' // Build artifact outputs
  | 'git-commit' // Git commit events
  | 'ci-status' // CI pipeline status
  | 'comment' // MR/Issue comments
  | 'library' // Reusable logic libraries
  | 'custom'; // Custom tool implementation

/**
 * Authentication types for tools
 */
export type AuthType = 'none' | 'bearer' | 'basic' | 'api-key' | 'oauth2';

/**
 * Tool authentication configuration
 */
export interface ToolAuth {
  type: AuthType;
  credentials?: string; // Reference to credentials secret
}

/**
 * OSSA Tool definition
 * Represents a tool/capability/trigger that an agent can use
 */
export interface Tool {
  /** Tool type */
  type: ToolType;

  /** Unique tool identifier */
  name: string;

  /** Human-readable description */
  description?: string;

  /** MCP server command (for type: mcp) */
  server?: string;

  /** Tool namespace for grouping */
  namespace?: string;

  /** HTTP/API endpoint (for type: http/api/webhook/grpc) */
  endpoint?: string;

  /** List of capability identifiers */
  capabilities?: string[];

  /** Tool-specific configuration */
  config?: Record<string, any>;

  /** Authentication configuration */
  auth?: ToolAuth;

  /** JSON Schema for tool input parameters */
  input_schema?: Record<string, any>;

  /** JSON Schema for tool output */
  output_schema?: Record<string, any>;

  /** Tool metadata */
  metadata?: {
    /** Version of the tool */
    version?: string;
    /** Tags for categorization */
    tags?: string[];
    /** Deprecation notice */
    deprecated?: boolean;
    /** Documentation URL */
    documentation?: string;
  };
}

/**
 * Type guard to check if object is a valid Tool
 */
export function isTool(obj: any): obj is Tool {
  return (
    obj &&
    typeof obj === 'object' &&
    'type' in obj &&
    'name' in obj &&
    typeof obj.name === 'string'
  );
}

/**
 * Create a minimal tool configuration
 */
export function createTool(
  type: ToolType,
  name: string,
  config?: Partial<Tool>
): Tool {
  return {
    type,
    name,
    ...config,
  };
}

/**
 * Validate tool configuration
 */
export function validateToolConfig(tool: Tool): string[] {
  const errors: string[] = [];

  if (!tool.type) {
    errors.push('Tool type is required');
  }

  if (!tool.name) {
    errors.push('Tool name is required');
  }

  // Type-specific validation
  switch (tool.type) {
    case 'mcp':
      if (!tool.server) {
        errors.push('MCP tools require a server command');
      }
      break;

    case 'http':
    case 'api':
    case 'webhook':
    case 'grpc':
      if (!tool.endpoint) {
        errors.push(`${tool.type} tools require an endpoint URL`);
      }
      break;

    case 'schedule':
      if (!tool.config?.schedule) {
        errors.push(
          'Schedule tools require a cron expression in config.schedule'
        );
      }
      break;

    case 'kubernetes':
      if (!tool.config?.namespace || !tool.config?.resource) {
        errors.push(
          'Kubernetes tools require namespace and resource in config'
        );
      }
      break;
  }

  return errors;
}
