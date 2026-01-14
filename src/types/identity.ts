/**
 * OSSA Identity Types
 * Type definitions for spec.identity - agent authentication and attribution
 *
 * @module @openstandardagents/identity
 * @version 0.3.2
 *
 * Implements the Agent Identity Extension for authenticated operations
 * across DevOps platforms (GitLab, GitHub, Azure DevOps, Bitbucket).
 */

// ============================================================================
// Provider Types
// ============================================================================

/**
 * Supported identity providers
 */
export type IdentityProvider =
  | 'gitlab'
  | 'github'
  | 'azure-devops'
  | 'bitbucket'
  | 'generic';

/**
 * Authentication method types
 */
export type AuthenticationMethod =
  | 'personal_access_token'
  | 'project_access_token'
  | 'group_access_token'
  | 'deploy_token'
  | 'oauth2'
  | 'ssh_key'
  | 'mtls'
  | 'github_app'
  | 'azure_service_principal';

/**
 * Service account roles (provider-agnostic)
 */
export type ServiceAccountRole =
  | 'developer'
  | 'maintainer'
  | 'owner'
  | 'reporter'
  | 'guest';

/**
 * Token encryption levels
 */
export type TokenEncryption = 'none' | 'at_rest' | 'in_transit' | 'both';

/**
 * Audit logging levels
 */
export type AuditLoggingLevel = 'required' | 'optional' | 'disabled';

/**
 * Compliance frameworks
 */
export type ComplianceFramework =
  | 'SOC2'
  | 'HIPAA'
  | 'GDPR'
  | 'FedRAMP'
  | 'PCI-DSS'
  | 'ISO27001';

// ============================================================================
// Service Account
// ============================================================================

/**
 * Service account configuration for automated operations
 */
export interface ServiceAccount {
  /** Provider-specific account ID (numeric for GitLab, string for others) */
  id?: number | string;
  /** Service account username (DNS-1123 compatible) */
  username: string;
  /** Service account email for git attribution */
  email: string;
  /** Human-readable display name */
  display_name?: string;
  /** Avatar URL for the service account */
  avatar_url?: string;
  /** When the service account was created */
  created_at?: string;
  /** Roles assigned to this service account */
  roles?: ServiceAccountRole[];
}

// ============================================================================
// Token Sources
// ============================================================================

/**
 * HashiCorp Vault token source
 */
export interface VaultTokenSource {
  /** Vault secret path (e.g., secret/data/gitlab-token) */
  path: string;
  /** Key within the Vault secret */
  key?: string;
  /** Vault role for authentication */
  role?: string;
}

/**
 * Kubernetes secret token source
 */
export interface KubernetesSecretSource {
  /** Secret name */
  name: string;
  /** Kubernetes namespace */
  namespace?: string;
  /** Key within the secret */
  key?: string;
}

/**
 * GCP Secret Manager token source
 */
export interface GCPSecretManagerSource {
  /** GCP project ID */
  project: string;
  /** Secret name */
  secret: string;
  /** Secret version */
  version?: string;
}

/**
 * AWS Secrets Manager token source
 */
export interface AWSSecretsManagerSource {
  /** AWS region */
  region: string;
  /** Secret ARN or name */
  secret_id: string;
  /** JSON key within the secret */
  key?: string;
}

/**
 * Azure Key Vault token source
 */
export interface AzureKeyVaultSource {
  /** Azure Key Vault URL */
  vault_url: string;
  /** Secret name */
  secret_name: string;
}

/**
 * Token source configuration with priority order
 */
export interface TokenSource {
  /** Environment variable name containing the token (highest priority) */
  env_var?: string;
  /** Path to token file (supports ~ expansion) */
  file_path?: string;
  /** HashiCorp Vault configuration */
  vault?: VaultTokenSource;
  /** Kubernetes secret configuration */
  kubernetes_secret?: KubernetesSecretSource;
  /** GCP Secret Manager configuration */
  gcp_secret_manager?: GCPSecretManagerSource;
  /** AWS Secrets Manager configuration */
  aws_secrets_manager?: AWSSecretsManagerSource;
  /** Azure Key Vault configuration */
  azure_key_vault?: AzureKeyVaultSource;
}

// ============================================================================
// Authentication Configuration
// ============================================================================

/**
 * Token rotation policy configuration
 */
export interface TokenRotationPolicy {
  /** Enable automatic token rotation */
  enabled?: boolean;
  /** Rotation interval in days */
  interval_days?: number;
  /** Notify on rotation */
  notify_on_rotation?: boolean;
}

/**
 * Authentication method configuration
 */
export interface AuthenticationConfig {
  /** Authentication method type */
  method?: AuthenticationMethod;
  /** Required token scopes (provider-specific) */
  scopes?: string[];
  /** Automatically refresh token before expiry */
  auto_refresh?: boolean;
  /** Days before expiry to warn about token rotation */
  expiry_warning_days?: number;
  /** Token rotation policy */
  rotation_policy?: TokenRotationPolicy;
}

// ============================================================================
// Token Reference Types (for spec.identity shortcuts)
// ============================================================================

/**
 * GitLab service account reference
 */
export interface GitLabServiceAccount {
  /** GitLab user ID */
  id?: number;
  /** GitLab username */
  username: string;
  /** Email for git attribution */
  email: string;
}

/**
 * GitLab token reference configuration
 */
export interface GitLabTokenRef {
  /** Environment variable containing the token */
  env_var?: string;
  /** File path to token */
  file_path?: string;
  /** Vault path for token */
  vault_path?: string;
}

/**
 * Anthropic token reference configuration
 */
export interface AnthropicTokenRef {
  /** Environment variable containing the API key */
  env_var?: string;
  /** File path to API key */
  file_path?: string;
  /** Vault path for API key */
  vault_path?: string;
}

// ============================================================================
// Fallback Identity
// ============================================================================

/**
 * Fallback condition configuration
 */
export interface FallbackCondition {
  /** Only use this fallback for these patterns */
  pattern_match?: string[];
  /** Use when primary platform is unavailable */
  platform_unavailable?: boolean;
}

/**
 * Fallback identity configuration
 */
export interface FallbackIdentity {
  /** Identity provider */
  provider: IdentityProvider;
  /** Service account details */
  service_account: ServiceAccount;
  /** Token source configuration */
  token_source?: TokenSource;
  /** Conditions under which this fallback is used */
  condition?: FallbackCondition;
}

// ============================================================================
// DORA Tracking
// ============================================================================

/**
 * DORA metric types
 */
export type DORAMetric =
  | 'deployment_frequency'
  | 'lead_time'
  | 'change_failure_rate'
  | 'mttr';

/**
 * Prometheus configuration for DORA tracking
 */
export interface DORAPrometheusConfig {
  /** Prometheus Pushgateway URL */
  push_gateway?: string;
  /** Prometheus job name */
  job_name?: string;
}

/**
 * DORA classification thresholds
 */
export interface DORAClassification {
  /** Elite threshold */
  elite?: string;
  /** High threshold */
  high?: string;
  /** Medium threshold */
  medium?: string;
  /** Low threshold */
  low?: string;
}

/**
 * DORA classifications configuration
 */
export interface DORAClassifications {
  /** Deployment frequency classification */
  deployment_frequency?: DORAClassification;
  /** Lead time classification */
  lead_time?: DORAClassification;
}

/**
 * DORA metrics tracking configuration
 */
export interface DORATracking {
  /** Enable DORA metrics tracking */
  enabled?: boolean;
  /** Metrics to track */
  metrics?: DORAMetric[];
  /** Additional labels for metrics */
  labels?: Record<string, string>;
  /** Prometheus configuration */
  prometheus?: DORAPrometheusConfig;
  /** Classification thresholds */
  classifications?: DORAClassifications;
}

// ============================================================================
// Session Configuration
// ============================================================================

/**
 * Session hooks configuration
 */
export interface SessionHooks {
  /** Hook into pre-prompt-submit */
  pre_prompt_submit?: boolean;
  /** Execute cleanup on session end */
  post_session?: boolean;
}

/**
 * Session management configuration for Claude Code integration
 */
export interface SessionConfig {
  /** Initialize identity when session starts */
  init_on_start?: boolean;
  /** Propagate identity env vars to spawned processes */
  propagate_to_subprocesses?: boolean;
  /** Configure git author/committer from identity */
  git_attribution?: boolean;
  /** Heartbeat interval in seconds */
  heartbeat_interval?: number;
  /** Session timeout in seconds */
  timeout?: number;
  /** Session hooks */
  hooks?: SessionHooks;
}

// ============================================================================
// Observability Identity
// ============================================================================

/**
 * OpenTelemetry service identity for distributed tracing
 */
export interface ObservabilityIdentity {
  /** Service name for OpenTelemetry traces */
  service_name?: string;
  /** Service namespace (e.g., production, staging) */
  service_namespace?: string;
  /** Service version (semver) */
  service_version?: string;
  /** Unique instance identifier */
  service_instance_id?: string;
  /** Additional OpenTelemetry resource attributes */
  resource_attributes?: Record<string, string>;
}

// ============================================================================
// Compliance & Security
// ============================================================================

/**
 * Compliance requirements for identity management
 */
export interface IdentityCompliance {
  /** Require MFA for service account authentication */
  require_mfa?: boolean;
  /** IP addresses/ranges allowed for this identity */
  ip_allowlist?: string[];
  /** Audit logging requirement level */
  audit_logging?: AuditLoggingLevel;
  /** Required data residency region */
  data_residency?: string;
  /** Applicable compliance frameworks */
  frameworks?: ComplianceFramework[];
}

/**
 * Required approvals configuration
 */
export interface RequiredApprovals {
  /** Require approval for force push */
  force_push?: boolean;
  /** Require approval for deleting protected branches */
  delete_protected_branch?: boolean;
  /** Require approval for modifying CI config */
  modify_ci_config?: boolean;
}

/**
 * Rate limits configuration
 */
export interface IdentityRateLimits {
  /** Requests per minute */
  requests_per_minute?: number;
  /** Requests per hour */
  requests_per_hour?: number;
  /** Git operations per hour */
  git_operations_per_hour?: number;
}

/**
 * Security policies for identity management
 */
export interface IdentitySecurity {
  /** Token encryption requirements */
  token_encryption?: TokenEncryption;
  /** Minimum token length in characters */
  minimum_token_length?: number;
  /** Actions this identity is prohibited from performing */
  prohibited_actions?: string[];
  /** Actions requiring human approval */
  required_approvals?: RequiredApprovals;
  /** Rate limiting configuration */
  rate_limits?: IdentityRateLimits;
}

// ============================================================================
// Complete Identity Specification
// ============================================================================

/**
 * Complete agent identity configuration
 * Used in spec.identity within OSSA manifests
 */
export interface IdentitySpec {
  /** Primary identity provider */
  provider: IdentityProvider;
  /** Service account configuration */
  service_account: ServiceAccount;
  /** Authentication configuration */
  authentication?: AuthenticationConfig;
  /** Token source configuration */
  token_source?: TokenSource;
  /** Auto-detection patterns (glob syntax) */
  patterns?: string[];
  /** Fallback identity chain */
  fallback?: FallbackIdentity[];
  /** DORA metrics tracking */
  dora_tracking?: DORATracking;
  /** Session management */
  session?: SessionConfig;
  /** Observability/OpenTelemetry identity */
  observability?: ObservabilityIdentity;
  /** Compliance requirements */
  compliance?: IdentityCompliance;
  /** Security policies */
  security?: IdentitySecurity;
}

// ============================================================================
// Shortcut Types for Common Patterns
// ============================================================================

/**
 * Simplified GitLab identity configuration
 * Convenience type for spec.identity.gitlab
 */
export interface GitLabIdentity {
  /** GitLab service account */
  service_account: GitLabServiceAccount;
  /** Token reference */
  token_ref: GitLabTokenRef;
}

/**
 * Simplified Anthropic identity configuration
 * Convenience type for spec.identity.anthropic
 */
export interface AnthropicIdentity {
  /** API key reference */
  token_ref: AnthropicTokenRef;
}

/**
 * Combined identity shortcuts for spec.identity
 */
export interface IdentityShortcuts {
  /** GitLab identity shortcut */
  gitlab?: GitLabIdentity;
  /** Anthropic identity shortcut */
  anthropic?: AnthropicIdentity;
}
