/**
 * OSSA Core Types
 * Type definitions for OSSA specification
 */

import { ErrorObject } from 'ajv';

// Export Task types (v0.3.0)
export * from './task';
export type { OssaTask, TaskSpec, RuntimeBinding } from './task';
export { isOssaTask, createTaskManifest } from './task';

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
  extensions?: {
    agents_md?: AgentsMdExtension;
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
  load(path: string): Promise<unknown>;
  save(path: string, manifest: OssaAgent): Promise<void>;
}
