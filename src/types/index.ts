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
 * OSSA Agent manifest structure (will be replaced with generated types)
 */
export interface OssaAgent {
  ossaVersion: string;
  agent: {
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
export type SchemaVersion = '1.0' | '0.2.2' | '0.1.9';

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
