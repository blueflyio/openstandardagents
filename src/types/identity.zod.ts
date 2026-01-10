/**
 * OSSA Identity Zod Schemas
 * Validation schemas for spec.identity
 *
 * @module @openstandardagents/identity
 * @version 0.3.2
 */

import { z } from 'zod';

// ============================================================================
// Provider Schemas
// ============================================================================

export const IdentityProviderSchema = z.enum([
  'gitlab',
  'github',
  'azure-devops',
  'bitbucket',
  'generic',
]);

export const AuthenticationMethodSchema = z.enum([
  'personal_access_token',
  'project_access_token',
  'group_access_token',
  'deploy_token',
  'oauth2',
  'ssh_key',
  'mtls',
  'github_app',
  'azure_service_principal',
]);

export const ServiceAccountRoleSchema = z.enum([
  'developer',
  'maintainer',
  'owner',
  'reporter',
  'guest',
]);

export const TokenEncryptionSchema = z.enum(['none', 'at_rest', 'in_transit', 'both']);

export const AuditLoggingLevelSchema = z.enum(['required', 'optional', 'disabled']);

export const ComplianceFrameworkSchema = z.enum([
  'SOC2',
  'HIPAA',
  'GDPR',
  'FedRAMP',
  'PCI-DSS',
  'ISO27001',
]);

// ============================================================================
// Service Account Schema
// ============================================================================

export const ServiceAccountSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  username: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9_-]+$/),
  email: z.string().email(),
  display_name: z.string().optional(),
  avatar_url: z.string().url().optional(),
  created_at: z.string().datetime().optional(),
  roles: z.array(ServiceAccountRoleSchema).optional(),
});

// ============================================================================
// Token Source Schemas
// ============================================================================

export const VaultTokenSourceSchema = z.object({
  path: z.string(),
  key: z.string().optional(),
  role: z.string().optional(),
});

export const KubernetesSecretSourceSchema = z.object({
  name: z.string(),
  namespace: z.string().optional(),
  key: z.string().optional(),
});

export const GCPSecretManagerSourceSchema = z.object({
  project: z.string(),
  secret: z.string(),
  version: z.string().optional(),
});

export const AWSSecretsManagerSourceSchema = z.object({
  region: z.string(),
  secret_id: z.string(),
  key: z.string().optional(),
});

export const AzureKeyVaultSourceSchema = z.object({
  vault_url: z.string().url(),
  secret_name: z.string(),
});

export const TokenSourceSchema = z.object({
  env_var: z
    .string()
    .regex(/^[A-Z][A-Z0-9_]*$/)
    .optional(),
  file_path: z.string().optional(),
  vault: VaultTokenSourceSchema.optional(),
  kubernetes_secret: KubernetesSecretSourceSchema.optional(),
  gcp_secret_manager: GCPSecretManagerSourceSchema.optional(),
  aws_secrets_manager: AWSSecretsManagerSourceSchema.optional(),
  azure_key_vault: AzureKeyVaultSourceSchema.optional(),
});

// ============================================================================
// Authentication Schema
// ============================================================================

export const TokenRotationPolicySchema = z.object({
  enabled: z.boolean().optional(),
  interval_days: z.number().int().min(7).max(365).optional(),
  notify_on_rotation: z.boolean().optional(),
});

export const AuthenticationConfigSchema = z.object({
  method: AuthenticationMethodSchema.optional(),
  scopes: z.array(z.string()).optional(),
  auto_refresh: z.boolean().optional(),
  expiry_warning_days: z.number().int().min(1).max(90).optional(),
  rotation_policy: TokenRotationPolicySchema.optional(),
});

// ============================================================================
// Token Reference Schemas (Shortcuts)
// ============================================================================

export const GitLabServiceAccountSchema = z.object({
  id: z.number().optional(),
  username: z.string(),
  email: z.string().email(),
});

export const GitLabTokenRefSchema = z.object({
  env_var: z.string().optional(),
  file_path: z.string().optional(),
  vault_path: z.string().optional(),
});

export const AnthropicTokenRefSchema = z.object({
  env_var: z.string().optional(),
  file_path: z.string().optional(),
  vault_path: z.string().optional(),
});

// ============================================================================
// Fallback Identity Schema
// ============================================================================

export const FallbackConditionSchema = z.object({
  pattern_match: z.array(z.string()).optional(),
  platform_unavailable: z.boolean().optional(),
});

export const FallbackIdentitySchema = z.object({
  provider: IdentityProviderSchema,
  service_account: ServiceAccountSchema,
  token_source: TokenSourceSchema.optional(),
  condition: FallbackConditionSchema.optional(),
});

// ============================================================================
// DORA Tracking Schema
// ============================================================================

export const DORAMetricSchema = z.enum([
  'deployment_frequency',
  'lead_time',
  'change_failure_rate',
  'mttr',
]);

export const DORAPrometheusConfigSchema = z.object({
  push_gateway: z.string().url().optional(),
  job_name: z.string().optional(),
});

export const DORAClassificationSchema = z.object({
  elite: z.string().optional(),
  high: z.string().optional(),
  medium: z.string().optional(),
  low: z.string().optional(),
});

export const DORAClassificationsSchema = z.object({
  deployment_frequency: DORAClassificationSchema.optional(),
  lead_time: DORAClassificationSchema.optional(),
});

export const DORATrackingSchema = z.object({
  enabled: z.boolean().optional(),
  metrics: z.array(DORAMetricSchema).optional(),
  labels: z.record(z.string(), z.string()).optional(),
  prometheus: DORAPrometheusConfigSchema.optional(),
  classifications: DORAClassificationsSchema.optional(),
});

// ============================================================================
// Session Schema
// ============================================================================

export const SessionHooksSchema = z.object({
  pre_prompt_submit: z.boolean().optional(),
  post_session: z.boolean().optional(),
});

export const SessionConfigSchema = z.object({
  init_on_start: z.boolean().optional(),
  propagate_to_subprocesses: z.boolean().optional(),
  git_attribution: z.boolean().optional(),
  heartbeat_interval: z.number().int().min(30).max(3600).optional(),
  timeout: z.number().int().min(60).max(86400).optional(),
  hooks: SessionHooksSchema.optional(),
});

// ============================================================================
// Observability Schema
// ============================================================================

export const ObservabilityIdentitySchema = z.object({
  service_name: z.string().optional(),
  service_namespace: z.string().optional(),
  service_version: z
    .string()
    .regex(/^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$/)
    .optional(),
  service_instance_id: z.string().optional(),
  resource_attributes: z.record(z.string(), z.string()).optional(),
});

// ============================================================================
// Compliance & Security Schemas
// ============================================================================

export const IdentityComplianceSchema = z.object({
  require_mfa: z.boolean().optional(),
  ip_allowlist: z.array(z.string()).optional(),
  audit_logging: AuditLoggingLevelSchema.optional(),
  data_residency: z.string().optional(),
  frameworks: z.array(ComplianceFrameworkSchema).optional(),
});

export const RequiredApprovalsSchema = z.object({
  force_push: z.boolean().optional(),
  delete_protected_branch: z.boolean().optional(),
  modify_ci_config: z.boolean().optional(),
});

export const IdentityRateLimitsSchema = z.object({
  requests_per_minute: z.number().int().optional(),
  requests_per_hour: z.number().int().optional(),
  git_operations_per_hour: z.number().int().optional(),
});

export const IdentitySecuritySchema = z.object({
  token_encryption: TokenEncryptionSchema.optional(),
  minimum_token_length: z.number().int().optional(),
  prohibited_actions: z.array(z.string()).optional(),
  required_approvals: RequiredApprovalsSchema.optional(),
  rate_limits: IdentityRateLimitsSchema.optional(),
});

// ============================================================================
// Complete Identity Schema
// ============================================================================

export const IdentitySpecSchema = z.object({
  provider: IdentityProviderSchema,
  service_account: ServiceAccountSchema,
  authentication: AuthenticationConfigSchema.optional(),
  token_source: TokenSourceSchema.optional(),
  patterns: z.array(z.string()).optional(),
  fallback: z.array(FallbackIdentitySchema).optional(),
  dora_tracking: DORATrackingSchema.optional(),
  session: SessionConfigSchema.optional(),
  observability: ObservabilityIdentitySchema.optional(),
  compliance: IdentityComplianceSchema.optional(),
  security: IdentitySecuritySchema.optional(),
});

// ============================================================================
// Shortcut Schemas
// ============================================================================

export const GitLabIdentitySchema = z.object({
  service_account: GitLabServiceAccountSchema,
  token_ref: GitLabTokenRefSchema,
});

export const AnthropicIdentitySchema = z.object({
  token_ref: AnthropicTokenRefSchema,
});

export const IdentityShortcutsSchema = z.object({
  gitlab: GitLabIdentitySchema.optional(),
  anthropic: AnthropicIdentitySchema.optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type IdentityProvider = z.infer<typeof IdentityProviderSchema>;
export type AuthenticationMethod = z.infer<typeof AuthenticationMethodSchema>;
export type ServiceAccountRole = z.infer<typeof ServiceAccountRoleSchema>;
export type TokenEncryption = z.infer<typeof TokenEncryptionSchema>;
export type AuditLoggingLevel = z.infer<typeof AuditLoggingLevelSchema>;
export type ComplianceFramework = z.infer<typeof ComplianceFrameworkSchema>;
export type ServiceAccount = z.infer<typeof ServiceAccountSchema>;
export type TokenSource = z.infer<typeof TokenSourceSchema>;
export type AuthenticationConfig = z.infer<typeof AuthenticationConfigSchema>;
export type FallbackIdentity = z.infer<typeof FallbackIdentitySchema>;
export type DORATracking = z.infer<typeof DORATrackingSchema>;
export type SessionConfig = z.infer<typeof SessionConfigSchema>;
export type ObservabilityIdentity = z.infer<typeof ObservabilityIdentitySchema>;
export type IdentityCompliance = z.infer<typeof IdentityComplianceSchema>;
export type IdentitySecurity = z.infer<typeof IdentitySecuritySchema>;
export type IdentitySpec = z.infer<typeof IdentitySpecSchema>;
export type GitLabIdentity = z.infer<typeof GitLabIdentitySchema>;
export type AnthropicIdentity = z.infer<typeof AnthropicIdentitySchema>;
export type IdentityShortcuts = z.infer<typeof IdentityShortcutsSchema>;
