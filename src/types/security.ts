/**
 * OSSA v0.4 Security Posture Types
 *
 * Type definitions for agent security posture metadata,
 * including threat models, capability requirements, sandboxing,
 * and network access constraints.
 */

/**
 * Threat categories from OWASP LLM Top 10 and agent-specific threats
 */
export type ThreatCategory =
  | 'prompt-injection'
  | 'data-exfiltration'
  | 'privilege-escalation'
  | 'resource-abuse'
  | 'model-poisoning'
  | 'supply-chain'
  | 'denial-of-service'
  | 'information-disclosure'
  | 'unauthorized-access'
  | 'custom';

/**
 * Threat severity levels
 */
export type ThreatSeverity =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'informational';

/**
 * Threat model entry
 */
export interface ThreatModelEntry {
  /** Threat category */
  category: ThreatCategory;

  /** Assessed severity level */
  severity?: ThreatSeverity;

  /** Mitigation strategies implemented */
  mitigations?: string[];

  /** Human-readable description */
  description?: string;
}

/**
 * Security capability that an agent may require or optionally use
 */
export type SecurityCapability =
  | 'filesystem-read'
  | 'filesystem-write'
  | 'network-outbound'
  | 'network-inbound'
  | 'process-spawn'
  | 'env-read'
  | 'env-write'
  | 'clipboard-read'
  | 'clipboard-write'
  | 'browser'
  | 'database-read'
  | 'database-write'
  | 'secrets-read'
  | 'gpu'
  | 'memory-extended'
  | 'tool-execution'
  | 'agent-spawn'
  | 'human-interaction';

/**
 * Sandboxing technology type
 */
export type SandboxType = 'container' | 'vm' | 'wasm' | 'process' | 'none';

/**
 * Network protocol
 */
export type NetworkProtocol =
  | 'https'
  | 'http'
  | 'wss'
  | 'ws'
  | 'grpc'
  | 'ssh'
  | 'stdio';

/**
 * Egress policy
 */
export type EgressPolicy = 'allow-all' | 'allow-list' | 'deny-all';

/**
 * Data classification level
 */
export type DataClassification =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted';

/**
 * Resource limits for sandboxed execution
 */
export interface ResourceLimits {
  /** Maximum memory allocation in megabytes */
  max_memory_mb?: number;

  /** Maximum CPU cores */
  max_cpu_cores?: number;

  /** Maximum execution time in seconds */
  max_execution_seconds?: number;

  /** Maximum disk usage in megabytes */
  max_disk_mb?: number;
}

/**
 * Sandboxing configuration
 */
export interface SandboxingConfig {
  /** Whether sandboxed execution is mandatory */
  required: boolean;

  /** Preferred sandboxing technology */
  type?: SandboxType;

  /** Resource constraints */
  resource_limits?: ResourceLimits;
}

/**
 * Network access constraints
 */
export interface NetworkAccessConfig {
  /** Allowlist of domains the agent may connect to */
  allowed_domains?: string[];

  /** Denylist of domains (takes precedence over allowed) */
  blocked_domains?: string[];

  /** Allowed network protocols */
  protocols?: NetworkProtocol[];

  /** Default egress policy */
  egress_policy?: EgressPolicy;
}

/**
 * Audit configuration
 */
export interface AuditConfig {
  /** Whether to log all inputs */
  log_inputs?: boolean;

  /** Whether to log all outputs */
  log_outputs?: boolean;

  /** Whether to log all tool invocations */
  log_tool_calls?: boolean;

  /** Number of days to retain audit logs */
  retention_days?: number;
}

/**
 * Security Posture (v0.4)
 * Defines the agent's security requirements, threat model,
 * and operational constraints.
 */
export interface SecurityPosture {
  /** Threat categories this agent handles or is exposed to */
  threat_model?: ThreatModelEntry[];

  /** Required and optional capability declarations */
  capabilities?: {
    /** Capabilities the agent MUST have */
    required?: SecurityCapability[];
    /** Capabilities the agent can use if available */
    optional?: SecurityCapability[];
  };

  /** Sandboxing requirements */
  sandboxing?: SandboxingConfig;

  /** Network access constraints */
  network_access?: NetworkAccessConfig;

  /** Data classification level */
  data_classification?: DataClassification;

  /** Audit requirements */
  audit?: AuditConfig;
}
