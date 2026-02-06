/**
 * OSSA Core Types
 * Type definitions for OSSA specification
 */

import { ErrorObject } from 'ajv';

// Export Task types (v0.3.0)
export * from './task.js';
export type { OssaTask, TaskSpec, RuntimeBinding } from './task.js';
export { isOssaTask, createTaskManifest } from './task.js';

// Export Workflow types (v0.3.0)
export * from './workflow.js';
export type { OssaWorkflow, WorkflowSpec, WorkflowStep } from './workflow.js';
export {
  isOssaWorkflow,
  createWorkflowManifest,
  createStep,
  expr,
} from './workflow.js';

// Export Messaging types (v0.3.0)
export * from './messaging.js';
export type {
  MessagingExtension,
  PublishedChannel,
  Subscription,
  Command,
  ReliabilityConfig,
  MessageEnvelope,
  RoutingRule,
} from './messaging.js';

// Export Identity & Adapter types (v0.3.6)
export * from './identity.js';
export type {
  Principal,
  CredentialSource,
  Adapter,
  GenerationContext,
} from './identity.js';

// Export Architect types (v0.3.6)
export * from './architect.js';
export type {
  Blueprint,
  AgentKind,
  ArchitectureConstraint,
  ArchitectRecommendation,
} from './architect.js';

/**
 * Agent Taxonomy Types (v0.4.4+)
 * Defines WHO executes, WHAT they do, and HOW they're structured
 */

/**
 * Agent Type - Runtime platform/framework for agent execution
 * Specifies which platform will execute this agent
 */
export type AgentType =
  | 'claude'           // Anthropic Claude agents
  | 'kagent'           // Kubernetes-orchestrated agents
  | 'openai'           // OpenAI GPT models
  | 'langchain'        // LangChain agent framework
  | 'crewai'           // CrewAI multi-agent crews
  | 'autogen'          // Microsoft AutoGen
  | 'llamaindex'       // LlamaIndex agents
  | 'haystack'         // Haystack agents
  | 'semantic-kernel'  // Microsoft Semantic Kernel
  | 'vertex-ai'        // Google Vertex AI
  | 'bedrock'          // AWS Bedrock
  | 'pydantic-ai'      // Pydantic AI agents
  | 'swarm'            // OpenAI Swarm
  | 'custom';          // Custom implementations

/**
 * Agent Kind - Functional role of the agent
 * Describes WHAT the agent does in the system
 */
export type AgentKind =
  | 'assistant'        // User-facing conversational agent
  | 'orchestrator'     // Coordinates multiple agents
  | 'worker'           // Specialized task execution
  | 'coordinator'      // Manages handoffs and routing
  | 'supervisor'       // Monitors and intervenes in execution
  | 'tool'             // Provides specific capability
  | 'reviewer'         // Validates outputs
  | 'planner'          // Creates execution plans
  | 'executor'         // Executes plans
  | 'monitor'          // Observes system state
  | 'analyst'          // Analyzes data and patterns
  | 'researcher'       // Conducts research tasks
  | 'specialist';      // Domain-specific expert

/**
 * Architecture Pattern - How the agent is structured
 */
export type ArchitecturePattern =
  | 'single'           // One agentic loop
  | 'swarm'            // Multi-agent with handoffs
  | 'pipeline'         // Sequential chain
  | 'graph'            // DAG-based workflow
  | 'hierarchical'     // Manager/worker structure
  | 'reactive'         // Event-driven triggers
  | 'cognitive';       // Multi-step reasoning

/**
 * Agent Capabilities - What the agent can do
 */
export type AgentCapability =
  | 'handoff'          // Can transfer to other agents
  | 'streaming'        // Supports streaming responses
  | 'context'          // Maintains conversation context
  | 'tools'            // Can call external tools
  | 'vision'           // Can process images
  | 'code'             // Can execute code
  | 'audio'            // Can process audio
  | 'video'            // Can process video
  | 'function-calling' // Supports function calling
  | 'parallel-tools'   // Can execute tools in parallel
  | 'memory'           // Has persistent memory
  | 'retrieval'        // Can retrieve from knowledge bases
  | 'web-search';      // Can search the web

/**
 * Handoff Strategy - How agents coordinate handoffs
 */
export type HandoffStrategy =
  | 'manual'           // Manual handoff by user
  | 'automatic'        // Automatic handoff by agent
  | 'conditional'      // Conditional based on rules
  | 'supervised';      // Supervised by orchestrator

/**
 * Scalability Model - How the agent scales
 */
export type ScalabilityModel =
  | 'single-instance'  // Single instance only
  | 'horizontal'       // Horizontal scaling
  | 'serverless';      // Serverless/auto-scaling

/**
 * Execution Model - How the agent executes
 */
export type ExecutionModel =
  | 'synchronous'      // Synchronous execution
  | 'asynchronous'     // Asynchronous execution
  | 'streaming'        // Streaming execution
  | 'batch';           // Batch processing

/**
 * Agent Architecture - Complete architecture definition
 */
export interface AgentArchitecture {
  /** Architecture pattern */
  pattern?: ArchitecturePattern;

  /** Agent capabilities */
  capabilities?: AgentCapability[];

  /** Multi-agent coordination config */
  coordination?: {
    /** How agents coordinate handoffs */
    handoffStrategy?: HandoffStrategy;
    /** Leader/orchestrator agent name */
    leaderAgent?: string;
    /** Maximum orchestration depth */
    maxDepth?: number;
  };

  /** Runtime configuration hints */
  runtime?: {
    /** Preferred deployment region */
    preferredRegion?: string;
    /** Scalability model */
    scalability?: ScalabilityModel;
    /** Execution model */
    executionModel?: ExecutionModel;
  };
}

/**
 * Capability definition (OpenAPI-style operation)
 */
export interface Capability {
  id: string; // Unique identifier for the capability
  description: string;
  inputSchema: Record<string, unknown> | string; // JSON Schema for inputs
  outputSchema: Record<string, unknown> | string; // JSON Schema for outputs
  authRequirements?: {
    type: string; // e.g., 'apiKey', 'oauth2', 'bearer'
    scopes?: string[]; // Provider-specific scopes
    // ... other auth details mapped from OpenAPI securitySchemes
  };
  idempotencySemantics?: 'idempotent' | 'non-idempotent';
  slo?: {
    maxLatencySeconds?: number;
    maxErrorRate?: number; // e.g., 0.01 for 1%
  };
  telemetryRequirements?: {
    metrics?: string[]; // e.g., ['request_count', 'token_usage', 'latency']
    logs?: string[]; // e.g., ['request_details', 'error_context']
    trace?: boolean; // Whether tracing should be enabled
  };
  examples?: Array<{
    name?: string;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
  }>;
  timeout_seconds?: number;
  retry_policy?: {
    max_attempts?: number;
    backoff?: 'linear' | 'exponential';
  };
}

import { Adapter, Principal } from './identity.js';

/**
 * OSSA Agent manifest structure (k8s-style format)
 * Supports both k8s-style (apiVersion/kind/metadata/spec) and legacy (ossaVersion/agent) formats
 * Compatible with all v0.2.x schema versions
 */
export interface OssaAgent {
  // k8s-style format (current)
  apiVersion?: string;
  kind?: string;
  metadata?: {
    name: string;
    version?: string;
    description?: string;
    author?: string;
    license?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    tags?: string[];
    lifecycle?: {
      state?: 'active' | 'deprecated' | 'retired';
      maturity?: 'alpha' | 'beta' | 'stable' | 'deprecated' | 'retired';
      deprecation?: {
        sunsetDate?: string;
        replacement?: string;
        reason?: string;
      };
    };
    // Agent Taxonomy (v0.4.4+)
    agentType?: AgentType;
    agentKind?: AgentKind;
    agentArchitecture?: AgentArchitecture;
  };

  /**
   * Legacy agent format support (v0.2.x)
   */
  agent?: {
    id: string;
    name: string;
    version: string;
    description?: string;
    role: string;
    llm?: {
      provider: string;
      model: string;
      temperature?: number;
      maxTokens?: number;
      topP?: number;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    capabilities?: any[];
    runtime?: {
      type: string;
      image?: string;
      config?: Record<string, unknown>;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools?: any[];
  };

  skills?: string[]; // List of skill names or references
  spec?: {
    // This 'spec' object is part of the k8s-style format
    role: string;
    instructions?: string;
    workflow?: {
      steps?: Array<Record<string, unknown>>;
      [key: string]: unknown;
    };
    llm?: {
      provider: string;
      model: string;
      temperature?: number;
      maxTokens?: number;
      topP?: number;
    };
    // Adapters: The new envelope for platform-specifics
    adapters?: Adapter[];
    // Principal: Abstract identity definition (v0.3.6)
    principal?: Principal;
    tools?: Array<{
      type: string;
      name?: string;
      description?: string;
      server?: string;
      namespace?: string;
      endpoint?: string;
      // Reference to the CapabilityContract ID that this tool implements
      capabilityId?: string; // Made optional to maintain backward compatibility
      capabilities?: string[]; // For MCP-style capabilities
      config?: Record<string, unknown>;
      auth?: {
        type: string;
        credentials?: string;
      };
      // Schema definitions for tool inputs and outputs
      inputSchema?: Record<string, unknown> | string;
      outputSchema?: Record<string, unknown> | string;
    }>;
    autonomy?: {
      level?: string;
      approval_required?: boolean;
      allowed_actions?: string[];
      blocked_actions?: string[];
    };
    constraints?: {
      cost?: {
        maxTokensPerDay?: number;
        maxTokensPerRequest?: number;
        maxCostPerDay?: number;
        currency?: string;
      };
      performance?: {
        maxLatencySeconds?: number;
        maxErrorRate?: number; // e.g., 0.01 for 1%
        timeoutSeconds?: number;
      };
      resources?: {
        cpu?: string;
        memory?: string;
        gpu?: string;
      };
    };
    observability?: {
      tracing?: {
        enabled?: boolean;
        exporter?: string;
        endpoint?: string;
      };
      metrics?: {
        enabled?: boolean;
        exporter?: string;
        endpoint?: string;
      };
      logging?: {
        level?: string;
        format?: string;
      };
    };
    messaging?: {
      publishes?: Array<{
        channel: string;
        description?: string;
        schema: Record<string, unknown>;
        examples?: Record<string, unknown>[];
        contentType?: string;
        tags?: string[];
      }>;
      subscribes?: Array<{
        channel: string;
        description?: string;
        schema?: Record<string, unknown>;
        handler?: string;
        filter?: {
          expression?: string;
          fields?: Record<string, unknown>;
        };
        priority?: 'low' | 'normal' | 'high' | 'critical';
        maxConcurrency?: number;
      }>;
      commands?: Array<{
        name: string;
        description?: string;
        inputSchema: Record<string, unknown>;
        outputSchema?: Record<string, unknown>;
        timeoutSeconds?: number;
        idempotent?: boolean;
        async?: boolean;
      }>;
      reliability?: {
        deliveryGuarantee?: 'at-least-once' | 'at-most-once' | 'exactly-once';
        retry?: {
          maxAttempts?: number;
          backoffMs?: number;
          maxBackoffMs?: number;
        };
        deadLetterQueue?: {
          enabled?: boolean;
          maxRetries?: number;
        };
        ordering?: {
          enabled?: boolean;
          key?: string;
        };
      };
    };
    dependencies?: {
      agents?: Array<{
        name: string;
        version?: string;
        contract?: {
          channels?: string[];
          commands?: string[];
        };
      }>;
    };
    capabilities?: (Capability | string)[]; // Allow both full Capability objects and string IDs
    policies?: Array<{
      name: string;
      type: string;
      rules: unknown[];
      [key: string]: unknown;
    }>;
    tests?: Array<{
      id: string;
      name?: string;
      type?: 'unit' | 'integration' | 'capability' | 'policy';
      assertions: Array<{
        type: string;
        actual: string;
        expected: unknown;
      }>;
      [key: string]: unknown;
    }>;
    environments?: Record<
      string,
      {
        version: string;
        deployedAt: string;
        deployedBy: string;
        status: 'deployed' | 'healthy' | 'degraded' | 'failed';
        endpoint?: string;
      }
    >;
  };
  extensions?: {
    agents_md?: AgentsMdExtension;
    llms_txt?: LlmsTxtExtension;
    cursor?: CursorExtension;
    [key: string]: unknown;
  };
}

/**
 * agents.md section configuration
 */
export interface AgentsMdSection {
  enabled?: boolean;
  source?: string;
  custom?: string;
  title_format?: string;
}

/**
 * agents.md extension configuration
 */
export interface AgentsMdExtension {
  enabled?: boolean;
  generate?: boolean;
  output_path?: string;
  sections?: {
    dev_environment?: AgentsMdSection;
    testing?: AgentsMdSection;
    pr_instructions?: AgentsMdSection;
  };
  sync?: {
    on_manifest_change?: boolean;
    include_comments?: boolean;
  };
  cursor_integration?: boolean;
}

/**
 * llms.txt section configuration
 */
export interface LlmsTxtSection {
  enabled?: boolean;
  source?: string;
  custom?: string;
  append?: string;
  prepend?: string;
  title?: string;
  file_list?: string[];
}

/**
 * llms.txt extension configuration
 */
export interface LlmsTxtExtension {
  enabled?: boolean;
  generate?: boolean;
  file_path?: string;
  auto_discover?: boolean;
  format?: {
    include_h1_title?: boolean;
    include_blockquote?: boolean;
    include_h2_sections?: boolean;
    include_optional?: boolean;
  };
  sections?: {
    core_specification?: LlmsTxtSection;
    quick_start?: LlmsTxtSection;
    cli_tools?: LlmsTxtSection;
    sdks?: LlmsTxtSection;
    examples?: LlmsTxtSection;
    migration_guides?: LlmsTxtSection;
    development?: LlmsTxtSection;
    specification_versions?: LlmsTxtSection;
    openapi_specifications?: LlmsTxtSection;
    documentation?: LlmsTxtSection;
    optional?: LlmsTxtSection;
    custom?: LlmsTxtSection[];
  };
  sync?: {
    on_manifest_change?: boolean;
    include_comments?: boolean;
    preserve_custom?: boolean;
    watch?: boolean;
  };
  mapping?: {
    metadata_to_h1?: boolean;
    description_to_blockquote?: boolean;
    spec_to_core_specification?: boolean;
    tools_to_cli_tools?: boolean;
    examples_to_examples?: boolean;
    migrations_to_migration_guides?: boolean;
  };
  include_metadata?: boolean;
}

/**
 * Cursor extension configuration
 */
export interface CursorExtension {
  enabled?: boolean;
  agent_type?: string;
  workspace_config?: {
    rules_file?: string;
    context_files?: string[];
    ignore_patterns?: string[];
    agents_md_path?: string;
  };
  capabilities?: Record<string, boolean>;
  model?: {
    provider?: string;
    name?: string;
  };
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ErrorObject[];
  warnings: string[];
  manifest?: OssaAgent;
}

/**
 * Agent template for generation
 */
export interface AgentTemplate {
  id: string;
  name: string;
  role: string;
  description?: string;
  /** Agent version (not OSSA spec version) */
  version?: string;
  runtimeType?: string;
  capabilities?: Capability[];
}

/**
 * Schema versions supported
 * Dynamic: versions are discovered from spec/ directory at runtime
 * Supports any version pattern like 0.2.5-RC, 0.2.6, etc.
 */
export type SchemaVersion = string;

/**
 * Service interfaces
 */
export interface IValidationService {
  validate(
    manifest: unknown,
    version: SchemaVersion
  ): Promise<ValidationResult>;
}

export interface ISchemaRepository {
  getSchema(version: SchemaVersion): Promise<Record<string, unknown>>;
  clearCache(): void;
  getAvailableVersions(): string[];
  getCurrentVersion(): string;
}

export interface IManifestRepository {
  load(path: string): Promise<OssaAgent>;
  save(path: string, manifest: OssaAgent): Promise<void>;
}
