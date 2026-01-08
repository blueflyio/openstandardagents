/**
 * OSSA v0.3.3 TypeScript Types
 *
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from: spec/v0.3.3/ossa-0.3.3.schema.json
 *
 * Regenerate with: ossa generate types
 */

/**
 * Open Standard for Scalable AI Agents (OSSA) v0.3.3 - Unified Task Schema with Access Tiers & Separation of Duties. Supports Agent (agentic loops with LLM), Task (deterministic workflow steps), and Workflow (composition of Tasks and Agents) kinds. Includes Agent-to-Agent Messaging Extension and Access Control Tiers for privilege separation.
 */
export type OSSAV032ManifestSchema = {
  [k: string]: unknown;
} & {
  /**
   * OSSA API version (v0.3.3+ supports Task and Workflow kinds)
   */
  apiVersion: string;
  /**
   * Resource type: Agent (agentic loops), Task (deterministic steps), or Workflow (composition)
   */
  kind: "Agent" | "Task" | "Workflow";
  metadata: Metadata;
  /**
   * Specification varies based on kind
   */
  spec?: {
    [k: string]: unknown;
  };
  /**
   * Framework-specific extensions
   */
  extensions?: {
    mcp?: MCPExtension;
    [k: string]: unknown;
  };
  runtime?: RuntimeBinding;
  [k: string]: unknown;
};

export interface Metadata {
  /**
   * Resource identifier (DNS-1123 subdomain format for Kubernetes compatibility)
   */
  name: string;
  /**
   * Semantic version (semver 2.0.0)
   */
  version?: string;
  /**
   * Human-readable description
   */
  description?: string;
  /**
   * Key-value labels for organization and filtering
   */
  labels?: {
    [k: string]: string;
  };
  /**
   * Arbitrary metadata for tooling
   */
  annotations?: {
    [k: string]: string;
  };
}
/**
 * Model Context Protocol (MCP) extension for agents - supports tools, resources, and prompts
 */
export interface MCPExtension {
  /**
   * Whether MCP is enabled for this agent
   */
  enabled?: boolean;
  /**
   * MCP server transport mechanism
   */
  server_type?: "stdio" | "http" | "sse";
  /**
   * Name of the MCP server
   */
  server_name?: string;
  /**
   * MCP tools (functions/actions the agent can invoke)
   */
  tools?: MCPTool[];
  /**
   * MCP resources (read-only context/data sources)
   */
  resources?: MCPResource[];
  /**
   * MCP prompts (templated workflows and interactions)
   */
  prompts?: MCPPrompt[];
}
/**
 * MCP tool definition - actions/functions the agent can invoke
 */
export interface MCPTool {
  /**
   * Unique tool name
   */
  name: string;
  /**
   * Human-readable description of what the tool does
   */
  description?: string;
  input_schema?: JSONSchemaDefinition;
  inputSchema?: JSONSchemaDefinition1;
  [k: string]: unknown;
}
/**
 * JSON Schema for tool input parameters (snake_case)
 */
export interface JSONSchemaDefinition {
  type?: "object" | "array" | "string" | "number" | "integer" | "boolean" | "null";
  properties?: {
    [k: string]: unknown;
  };
  required?: string[];
  items?: {
    [k: string]: unknown;
  };
  additionalProperties?:
    | boolean
    | {
        [k: string]: unknown;
      };
  minItems?: 0;
  [k: string]: unknown;
}
/**
 * JSON Schema for tool input parameters (camelCase - MCP SDK convention)
 */
export interface JSONSchemaDefinition1 {
  type?: "object" | "array" | "string" | "number" | "integer" | "boolean" | "null";
  properties?: {
    [k: string]: unknown;
  };
  required?: string[];
  items?: {
    [k: string]: unknown;
  };
  additionalProperties?:
    | boolean
    | {
        [k: string]: unknown;
      };
  minItems?: 0;
  [k: string]: unknown;
}
/**
 * MCP resource definition - read-only context and data sources
 */
export interface MCPResource {
  /**
   * Unique resource identifier (URI)
   */
  uri: string;
  /**
   * Human-readable resource name
   */
  name: string;
  /**
   * Description of the resource and its contents
   */
  description?: string;
  /**
   * MIME type of the resource content
   */
  mimeType?: string;
  /**
   * Additional resource metadata
   */
  metadata?: {
    [k: string]: unknown;
  };
}
/**
 * MCP prompt definition - templated messages and workflows
 */
export interface MCPPrompt {
  /**
   * Unique prompt identifier
   */
  name: string;
  /**
   * Human-readable description of the prompt purpose
   */
  description?: string;
  /**
   * Template arguments that can be substituted
   */
  arguments?: MCPPromptArgument[];
}
/**
 * Argument definition for MCP prompts
 */
export interface MCPPromptArgument {
  /**
   * Argument name
   */
  name: string;
  /**
   * Description of what this argument represents
   */
  description?: string;
  /**
   * Whether this argument is required
   */
  required?: boolean;
}
/**
 * Runtime-specific capability bindings (for Task and Workflow kinds)
 */
export interface RuntimeBinding {
  /**
   * Primary runtime type
   */
  type?:
    | "unified"
    | "google-a2a"
    | "gitlab-duo"
    | "ossa-mesh"
    | "mcp"
    | "local"
    | "drupal"
    | "symfony_messenger"
    | "kagent"
    | "temporal"
    | "node";
  /**
   * List of compatible runtimes
   */
  supports?: (
    | "google-a2a"
    | "gitlab-duo"
    | "ossa-mesh"
    | "mcp"
    | "local-execution"
    | "kubernetes"
    | "serverless"
    | "lambda"
    | "cloudflare-workers"
    | "drupal"
    | "symfony"
  )[];
  /**
   * Message transport for async runtimes
   */
  transport?: string;
  scheduling?: SchedulingConfig;
  resource_limits?: ResourceLimits;
  /**
   * External runtime extensions
   */
  extensions?: RuntimeExtension[];
  /**
   * Map of capability names to runtime-specific handlers
   */
  bindings?: {
    [k: string]: {
      /**
       * Handler class/function (e.g., 'Drupal\node\NodeQuery::getList')
       */
      handler?: string;
      /**
       * MCP server name for MCP-based bindings
       */
      mcp_server?: string;
      /**
       * Tool name within MCP server
       */
      tool?: string;
      /**
       * Additional binding configuration
       */
      config?: {
        [k: string]: unknown;
      };
    };
  };
  kubernetes?: KubernetesConfig;
}
/**
 * Agent scheduling configuration
 */
export interface SchedulingConfig {
  /**
   * Scheduling strategy
   */
  strategy?: "fair" | "priority" | "deadline" | "cost-optimized";
  /**
   * Execution priority
   */
  priority?: "critical" | "high" | "normal" | "low" | "background";
  /**
   * Maximum concurrent executions
   */
  max_concurrent?: number;
  /**
   * Execution timeout in seconds
   */
  timeout_seconds?: number;
}
/**
 * Compute resource constraints
 */
export interface ResourceLimits {
  /**
   * Memory limit in megabytes
   */
  memory_mb?: number;
  /**
   * CPU limit in millicores (1000 = 1 CPU)
   */
  cpu_millicores?: number;
  /**
   * Requires GPU acceleration
   */
  gpu_required?: boolean;
  /**
   * Required GPU type (e.g., nvidia-a100, nvidia-h100)
   */
  gpu_type?: string;
}
/**
 * External runtime extension (A2A compatible)
 */
export interface RuntimeExtension {
  /**
   * Extension protocol type
   */
  type: "http" | "grpc" | "mcp" | "websocket" | "kafka" | "pubsub";
  /**
   * Extension name
   */
  name: string;
  /**
   * Extension endpoint URL
   */
  endpoint?: string;
  /**
   * Reference to credentials for authentication
   */
  credentials_ref?: string;
}
/**
 * Kubernetes-specific configuration (KAS-inspired)
 */
export interface KubernetesConfig {
  /**
   * Kubernetes namespace (DNS-1123 subdomain)
   */
  namespace?: string;
  /**
   * Kubernetes service account name
   */
  service_account?: string;
  /**
   * Kubernetes API server URL (similar to KAS private API URL)
   */
  api_server_url?: string;
  /**
   * Network family (KAS pattern: tcp, tcp4, tcp6)
   */
  network_family?: "tcp" | "tcp4" | "tcp6";
  /**
   * Health check endpoint URL
   */
  health_check_endpoint?: string;
  /**
   * Reference to Kubernetes ConfigMap
   */
  config_map_ref?: string;
  /**
   * Reference to Kubernetes Secret
   */
  secret_ref?: string;
  rbac?: {
    /**
     * Kubernetes Role name
     */
    role?: string;
    /**
     * Kubernetes ClusterRole name
     */
    cluster_role?: string;
    /**
     * Kubernetes RoleBinding name
     */
    role_binding?: string;
  };
}
