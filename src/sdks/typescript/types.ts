/**
 * OSSA TypeScript SDK Types
 *
 * Core type definitions for OSSA manifests.
 * These types match the OSSA v0.3.3 JSON Schema specification.
 */

export const VERSION = '0.3.3';
export const OSSA_VERSION = 'v0.3.3';

// ============================================================================
// Core Enums
// ============================================================================

export type Kind = 'Agent' | 'Task' | 'Workflow';

export type AccessTier =
  | 'tier_1_read'
  | 'tier_2_write_limited'
  | 'tier_3_write_elevated'
  | 'tier_4_policy'
  // Shorthand
  | 'read'
  | 'limited'
  | 'elevated'
  | 'policy';

export type LLMProvider =
  | 'anthropic'
  | 'openai'
  | 'azure'
  | 'google'
  | 'bedrock'
  | 'groq'
  | 'ollama';

// ============================================================================
// Metadata
// ============================================================================

export interface Metadata {
  name: string;
  version?: string;
  namespace?: string;
  description?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

// ============================================================================
// Tools
// ============================================================================

export interface ToolHandler {
  runtime?: string;
  capability?: string;
  endpoint?: string;
  method?: string;
}

export interface Tool {
  name: string;
  description?: string;
  handler?: ToolHandler;
  parameters?: Record<string, unknown>;
}

// ============================================================================
// LLM Configuration
// ============================================================================

export interface LLMConfig {
  provider: LLMProvider | string;
  model: string;
  temperature?: number;
  max_tokens?: number;
  profile?: string;
}

// ============================================================================
// Safety & Guardrails
// ============================================================================

export interface Guardrails {
  max_actions_per_minute?: number;
  require_human_approval_for?: string[];
  blocked_actions?: string[];
  audit_all_actions?: boolean;
  cost_threshold_usd?: number;
}

export interface Safety {
  guardrails?: Guardrails;
  pii_handling?: string;
  data_classification?: string;
}

// ============================================================================
// Identity
// ============================================================================

export interface ServiceAccount {
  id?: string;
  username?: string;
  email?: string;
  display_name?: string;
  roles?: string[];
}

export interface DORATracking {
  enabled?: boolean;
  metrics?: string[];
  labels?: Record<string, string>;
}

export interface Identity {
  provider?: string;
  service_account?: ServiceAccount;
  access_tier?: AccessTier;
  dora_tracking?: DORATracking;
}

// ============================================================================
// Capabilities
// ============================================================================

export interface Capability {
  name: string;
  description?: string;
}

// ============================================================================
// Spec Types
// ============================================================================

export interface AgentSpec {
  role?: string;
  capabilities?: Capability[];
  tools?: Tool[];
  llm?: LLMConfig;
  safety?: Safety;
  access_tier?: AccessTier;
  identity?: Identity;
}

export interface TaskStep {
  name: string;
  description?: string;
  action?: string;
  parameters?: Record<string, unknown>;
}

export interface TaskSpec {
  description?: string;
  steps?: TaskStep[];
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface WorkflowAgent {
  name: string;
  ref?: string;
  role?: string;
}

export interface WorkflowStep {
  id: string;
  name?: string;
  kind: 'Task' | 'Agent' | 'Parallel' | 'Conditional' | 'Loop';
  ref?: string;
  depends_on?: string[];
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface WorkflowSpec {
  triggers?: Record<string, unknown>[];
  inputs?: Record<string, unknown>;
  steps?: WorkflowStep[];
  agents?: WorkflowAgent[];
  concurrency?: Record<string, unknown>;
}

// ============================================================================
// Manifest Types
// ============================================================================

export interface BaseManifest<K extends Kind, S> {
  apiVersion: string;
  kind: K;
  metadata: Metadata;
  spec: S;
}

export type AgentManifest = BaseManifest<'Agent', AgentSpec>;
export type TaskManifest = BaseManifest<'Task', TaskSpec>;
export type WorkflowManifest = BaseManifest<'Workflow', WorkflowSpec>;

export type OSSAManifest = AgentManifest | TaskManifest | WorkflowManifest;

// ============================================================================
// Validation
// ============================================================================

export interface ValidationError {
  path: string;
  message: string;
  keyword?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// Type Guards
// ============================================================================

export function isAgent(manifest: OSSAManifest): manifest is AgentManifest {
  return manifest.kind === 'Agent';
}

export function isTask(manifest: OSSAManifest): manifest is TaskManifest {
  return manifest.kind === 'Task';
}

export function isWorkflow(
  manifest: OSSAManifest
): manifest is WorkflowManifest {
  return manifest.kind === 'Workflow';
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Normalize shorthand access tier to full name
 */
export function normalizeAccessTier(tier: AccessTier): AccessTier {
  switch (tier) {
    case 'read':
      return 'tier_1_read';
    case 'limited':
      return 'tier_2_write_limited';
    case 'elevated':
      return 'tier_3_write_elevated';
    case 'policy':
      return 'tier_4_policy';
    default:
      return tier;
  }
}

/**
 * Get the effective access tier from a manifest
 */
export function getAccessTier(manifest: OSSAManifest): AccessTier | undefined {
  if (manifest.kind !== 'Agent') return undefined;

  const spec = manifest.spec;
  const tier = spec.access_tier ?? spec.identity?.access_tier;
  return tier ? normalizeAccessTier(tier) : undefined;
}
