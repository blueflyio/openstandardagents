/**
 * OSSA Core Types
 * Type definitions for OSSA specification
 */

import { ErrorObject } from 'ajv';

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
 * OSSA Agent manifest structure (v0.2.3 format)
 * Supports both v0.2.3 (apiVersion/kind/metadata/spec) and legacy v0.1.9 (ossaVersion/agent)
 */
export interface OssaAgent {
  // v0.2.3 format
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
      auth?: {
        type: string;
        credentials?: string;
      };
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
        maxConcurrentRequests?: number;
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
    tools?: Array<{
      type: string;
      server?: string;
      namespace?: string;
      capabilities?: string[];
    }>;
    protocols?: Array<{
      type: string;
      version?: string;
      endpoint?: string;
    }>;
    compliance?: {
      frameworks?: string[];
      dataClassification?: string;
      retentionPolicy?: string;
    };
  };
  extensions?: Record<string, unknown>;
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
  runtimeType?: string;
  capabilities?: Capability[];
}

/**
 * Schema versions supported
 */
export type SchemaVersion = '0.2.4' | '0.2.3' | '0.2.2' | '0.1.9';

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
}

export interface IManifestRepository {
  load(path: string): Promise<unknown>;
  save(path: string, manifest: OssaAgent): Promise<void>;
}
