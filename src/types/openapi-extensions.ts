/**
 * OSSA OpenAPI/Swagger Specification Extensions
 * TypeScript type definitions for OSSA-specific OpenAPI extensions
 */

/**
 * Root-level extension: Comprehensive OSSA agent metadata
 */
export interface XOssaMetadata {
  version: string;
  compliance?: {
    level: 'basic' | 'standard' | 'advanced' | 'enterprise';
    frameworks?: string[];
  };
  governance?: {
    approved?: boolean;
    approvedBy?: string;
    approvalDate?: string; // YYYY-MM-DD format
  };
  security?: {
    classification?: 'public' | 'internal' | 'confidential' | 'restricted';
    authentication?: 'required' | 'optional' | 'none';
    encryption?: string;
  };
  observability?: {
    tracing?: boolean;
    metrics?: boolean;
    logging?: boolean;
  };
}

/**
 * Root-level extension: Core OSSA compliance information
 */
export interface XOssa {
  version: string;
  agent: {
    id: string;
    type:
      | 'orchestrator'
      | 'worker'
      | 'specialist'
      | 'critic'
      | 'judge'
      | 'monitor'
      | 'gateway'
      | 'governor'
      | 'integrator'
      | 'voice';
    compliance?: {
      standards?: string[];
      validated?: boolean;
      validatedAt?: string; // ISO 8601 timestamp
    };
  };
}

/**
 * Root-level extension: Agent-specific capabilities and configuration
 */
export interface XAgent {
  capabilities?: string[];
  tools?: string[];
  environment?: Record<string, unknown>;
  rules?: string[];
}

/**
 * Operation-level extension: Links operation to agent capability
 */
export type XOssaCapability =
  | string
  | {
      name: string;
      description?: string;
      inputSchema?: Record<string, unknown>;
      outputSchema?: Record<string, unknown>;
    };

/**
 * Operation-level extension: Defines autonomy level for operation
 */
export interface XOssaAutonomy {
  level: 'supervised' | 'autonomous' | 'semi-autonomous';
  approval_required?: boolean;
  allowed_actions?: string[];
  blocked_actions?: string[];
}

/**
 * Operation-level extension: Cost, token, and resource constraints
 */
export interface XOssaConstraints {
  cost?: {
    maxTokensPerDay?: number;
    maxTokensPerRequest?: number;
    maxCostPerDay?: number;
    currency?: string; // ISO 4217 code, default: "USD"
  };
  performance?: {
    maxLatencySeconds?: number;
    maxConcurrentRequests?: number;
  };
  time?: {
    maxExecutionTime?: number; // seconds
  };
}

/**
 * Operation-level extension: MCP servers or tools required
 */
export interface XOssaTool {
  type: 'mcp' | 'http' | 'custom';
  server: string;
  namespace?: string;
  capabilities?: string[];
}

export type XOssaTools = XOssaTool[];

/**
 * Operation-level extension: LLM configuration override
 */
export interface XOssaLlm {
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';
  model: string;
  temperature?: number; // 0-2
  maxTokens?: number;
}

/**
 * Parameter extension: Header parameter for agent identification
 */
export interface XOssaAgentId {
  name?: string; // default: "X-OSSA-Agent-ID"
  description?: string;
  required?: boolean;
}

/**
 * Parameter extension: Header parameter for OSSA version
 */
export interface XOssaVersion {
  name?: string; // default: "X-OSSA-Version"
  description?: string;
  required?: boolean;
}

/**
 * Schema extension: Capability schema metadata
 */
export interface XOssaCapabilitySchema {
  capabilityName: string;
  input?: boolean;
  output?: boolean;
  validation?: {
    required?: boolean;
    strict?: boolean;
  };
}

/**
 * OpenAPI 3.1 spec with OSSA extensions at root level
 */
export interface OpenAPISpecWithOssaExtensions {
  'x-ossa-metadata'?: XOssaMetadata;
  'x-ossa'?: XOssa;
  'x-agent'?: XAgent;
  [key: string]: unknown;
}

/**
 * OpenAPI operation with OSSA extensions
 */
export interface OpenAPIOperationWithOssaExtensions {
  'x-ossa-capability'?: XOssaCapability;
  'x-ossa-autonomy'?: XOssaAutonomy;
  'x-ossa-constraints'?: XOssaConstraints;
  'x-ossa-tools'?: XOssaTools;
  'x-ossa-llm'?: XOssaLlm;
  [key: string]: unknown;
}

/**
 * OpenAPI schema with OSSA extensions
 */
export interface OpenAPISchemaWithOssaExtensions {
  'x-ossa-capability-schema'?: XOssaCapabilitySchema;
  [key: string]: unknown;
}

