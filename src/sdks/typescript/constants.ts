/**
 * OSSA TypeScript SDK Constants
 *
 * Enumerated constants for OSSA manifest building.
 * These constants match the OSSA v0.3.6 schema specification.
 */

// ============================================================================
// Tool Types
// ============================================================================

export const TOOL_TYPES = [
  'mcp',
  'kubernetes',
  'http',
  'api',
  'grpc',
  'function',
  'a2a',
  'webhook',
  'schedule',
  'pipeline',
  'workflow',
  'artifact',
  'git-commit',
  'ci-status',
  'comment',
  'library',
  'custom',
] as const;

export type ToolType = (typeof TOOL_TYPES)[number];

// ============================================================================
// LLM Providers
// ============================================================================

export const LLM_PROVIDERS = [
  'anthropic',
  'openai',
  'azure',
  'google',
  'bedrock',
  'groq',
  'ollama',
] as const;

export type LLMProviderType = (typeof LLM_PROVIDERS)[number];

// ============================================================================
// Access Tiers / Autonomy Levels
// ============================================================================

export const ACCESS_TIERS = [
  'tier_1_read',
  'tier_2_write_limited',
  'tier_3_write_elevated',
  'tier_4_policy',
  // Shorthand
  'read',
  'limited',
  'elevated',
  'policy',
] as const;

export type AccessTierType = (typeof ACCESS_TIERS)[number];

// Autonomy levels (legacy/compatibility)
export const AUTONOMY_LEVELS = ACCESS_TIERS;

// ============================================================================
// Safety & Guardrails
// ============================================================================

export const CONTENT_FILTERING_TYPES = [
  'hate_speech',
  'violence',
  'sexual_content',
  'self_harm',
  'profanity',
  'illegal_activity',
] as const;

export type ContentFilteringType = (typeof CONTENT_FILTERING_TYPES)[number];

export const PII_DETECTION_TYPES = [
  'email',
  'phone',
  'ssn',
  'credit_card',
  'address',
  'name',
  'passport',
  'drivers_license',
] as const;

export type PIIDetectionType = (typeof PII_DETECTION_TYPES)[number];

// ============================================================================
// Identity Providers
// ============================================================================

export const IDENTITY_PROVIDERS = [
  'gitlab',
  'github',
  'azure-devops',
  'bitbucket',
  'generic',
] as const;

export type IdentityProviderType = (typeof IDENTITY_PROVIDERS)[number];

// ============================================================================
// Workflow Step Kinds
// ============================================================================

export const WORKFLOW_STEP_KINDS = [
  'Task',
  'Agent',
  'Parallel',
  'Conditional',
  'Loop',
] as const;

export type WorkflowStepKind = (typeof WORKFLOW_STEP_KINDS)[number];

// ============================================================================
// Manifest Kinds
// ============================================================================

export const MANIFEST_KINDS = ['Agent', 'Task', 'Workflow', 'Flow'] as const;

export type ManifestKind = (typeof MANIFEST_KINDS)[number];
