/**
 * Common types for framework converters
 */

export interface OSSAManifest {
  apiVersion: string;
  kind: 'Agent' | 'Task' | 'Workflow';
  metadata: {
    name: string;
    version?: string;
    description?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec: AgentSpec | TaskSpec | WorkflowSpec;
}

export interface AgentSpec {
  role?: string;
  capabilities?: Array<{
    name: string;
    description?: string;
  }>;
  tools?: Array<{
    name: string;
    description?: string;
    handler?: {
      runtime?: string;
      capability?: string;
      endpoint?: string;
    };
    parameters?: Record<string, unknown>;
  }>;
  llm?: {
    provider: string;
    model: string;
    temperature?: number;
    max_tokens?: number;
  };
  safety?: {
    guardrails?: {
      max_actions_per_minute?: number;
      require_human_approval_for?: string[];
      blocked_actions?: string[];
    };
  };
}

export interface TaskSpec {
  description?: string;
  steps?: Array<{
    name: string;
    description?: string;
    action?: string;
    parameters?: Record<string, unknown>;
  }>;
}

export interface WorkflowSpec {
  triggers?: Record<string, unknown>[];
  inputs?: Record<string, unknown>;
  steps?: Array<{
    id: string;
    name?: string;
    kind: 'Task' | 'Agent' | 'Parallel' | 'Conditional';
    ref?: string;
    depends_on?: string[];
  }>;
  agents?: Array<{
    name: string;
    ref?: string;
    role?: string;
  }>;
}

export interface ConversionResult {
  manifest: OSSAManifest;
  warnings: string[];
  metadata: {
    source_framework: string;
    conversion_time: string;
    ossa_version: string;
  };
}

export interface ConverterOptions {
  strict?: boolean;
  include_comments?: boolean;
  target_version?: string;
}

export interface FrameworkConverter {
  name: string;
  version: string;
  convert(input: unknown, options?: ConverterOptions): Promise<ConversionResult>;
  validate(input: unknown): Promise<boolean>;
}
