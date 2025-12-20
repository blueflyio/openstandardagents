/**
 * OSSA Runtime Core Types
 * Type definitions for the OSSA runtime SDK
 */

/**
 * Capability definition (OpenAPI-style operation)
 */
export interface Capability {
  name: string;
  description: string;
  input_schema: Record<string, unknown> | string;
  output_schema: Record<string, unknown> | string;
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

/**
 * Agent manifest structure (compatible with OSSA v0.3.0)
 */
export interface AgentManifest {
  // k8s-style format
  apiVersion?: string;
  kind?: string;
  metadata?: {
    name: string;
    version?: string;
    description?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec?: {
    role: string;
    llm?: {
      provider: string;
      model: string;
      temperature?: number;
      maxTokens?: number;
      topP?: number;
    };
    tools?: Array<{
      type: string;
      name?: string;
      server?: string;
      namespace?: string;
      endpoint?: string;
      capabilities?: string[];
      config?: Record<string, unknown>;
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
      };
      performance?: {
        maxLatencySeconds?: number;
        maxConcurrentRequests?: number;
        timeoutSeconds?: number;
      };
    };
  };
  // Legacy v0.1.9 format (for backward compatibility)
  ossaVersion?: string;
  agent?: {
    id: string;
    name: string;
    version: string;
    role: string;
    description?: string;
    runtime: {
      type: string;
      image?: string;
      command?: string[];
      requirements?: Record<string, unknown>;
    };
    capabilities: Capability[];
    llm?: {
      provider?: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
    };
  };
}

/**
 * Execution context for agent operations
 */
export interface ExecutionContext {
  requestId: string;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Execution result
 */
export interface ExecutionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  executionTime?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Capability handler function
 */
export type CapabilityHandler<TInput = unknown, TOutput = unknown> = (
  input: TInput,
  context: ExecutionContext
) => Promise<TOutput>;

/**
 * Agent interface
 */
export interface OssaAgent {
  /** Unique identifier for the agent instance */
  id: string;

  /** Agent manifest */
  manifest: AgentManifest;

  /** Execute a capability by name */
  execute<TInput = unknown, TOutput = unknown>(
    capabilityName: string,
    input: TInput,
    context?: Partial<ExecutionContext>
  ): Promise<ExecutionResult<TOutput>>;

  /** Get all registered capabilities */
  getCapabilities(): Map<string, Capability>;

  /** Get a specific capability by name */
  getCapability(name: string): Capability | undefined;

  /** Register a new capability handler */
  registerCapability(
    capability: Capability,
    handler: CapabilityHandler
  ): void;

  /** Check if agent has a specific capability */
  hasCapability(name: string): boolean;
}

/**
 * Runtime interface for loading and managing agents
 */
export interface Runtime {
  /** Load an agent from a manifest file or object */
  loadAgent(
    manifestPath: string | AgentManifest
  ): Promise<OssaAgent>;

  /** Execute a capability on a loaded agent */
  executeCapability<TInput = unknown, TOutput = unknown>(
    agent: OssaAgent,
    capabilityName: string,
    input: TInput,
    context?: Partial<ExecutionContext>
  ): Promise<ExecutionResult<TOutput>>;

  /** Get all loaded agents */
  getAgents(): Map<string, OssaAgent>;

  /** Get a specific agent by ID */
  getAgent(id: string): OssaAgent | undefined;

  /** Unload an agent */
  unloadAgent(id: string): void;
}

/**
 * Manifest loader interface
 */
export interface ManifestLoader {
  /** Load manifest from file path */
  loadFromFile(path: string): Promise<AgentManifest>;

  /** Load manifest from object */
  loadFromObject(manifest: unknown): Promise<AgentManifest>;

  /** Validate manifest structure */
  validate(manifest: AgentManifest): Promise<boolean>;
}

/**
 * Capability registry interface
 */
export interface CapabilityRegistry {
  /** Register a capability */
  register(capability: Capability, handler: CapabilityHandler): void;

  /** Get a capability by name */
  get(name: string): Capability | undefined;

  /** Get capability handler */
  getHandler(name: string): CapabilityHandler | undefined;

  /** Check if capability exists */
  has(name: string): boolean;

  /** Get all capabilities */
  getAll(): Map<string, Capability>;

  /** Remove a capability */
  remove(name: string): boolean;

  /** Clear all capabilities */
  clear(): void;
}
