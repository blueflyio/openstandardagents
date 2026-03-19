/**
 * Core type definitions for the Drupal Contributor Agent
 */

/**
 * Agent configuration
 */
export interface AgentConfig {
  identity: IdentityConfig;
  discovery: DiscoveryConfig;
  governance: GovernanceConfig;
  workspace: WorkspaceConfig;
  observability: ObservabilityConfig;
}

/**
 * Identity configuration
 */
export interface IdentityConfig {
  gaid: string; // W3C Decentralized Identifier
  manifestPath: string;
  privateKeyPath?: string;
}

/**
 * Discovery configuration
 */
export interface DiscoveryConfig {
  endpoint: string;
  port: number;
}

/**
 * Governance configuration
 */
export interface GovernanceConfig {
  cedarPoliciesPath: string;
  approvalWebhookUrl?: string;
  auditLogPath: string;
}

/**
 * Workspace configuration
 */
export interface WorkspaceConfig {
  rootPath: string;
  isolation: 'container' | 'process' | 'none';
  maxDiskUsage: string;
  maxMemory: string;
}

/**
 * Observability configuration
 */
export interface ObservabilityConfig {
  metricsPort: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  tracingEnabled: boolean;
  tracingSampleRate: number;
}

/**
 * Agent state
 */
export interface AgentState {
  status: 'initializing' | 'ready' | 'processing' | 'error' | 'shutdown';
  currentIssue?: string;
  currentWorkspace?: string;
  lastError?: Error;
}

/**
 * Issue processing result
 */
export interface IssueResult {
  issueId: string;
  status: 'completed' | 'failed' | 'pending_approval';
  mergeRequestUrl?: string;
  evidence: Evidence[];
  auditTrail: AuditEntry[];
}

/**
 * Evidence for validation and review
 */
export interface Evidence {
  type: 'diff' | 'test_result' | 'analysis' | 'screenshot' | 'log';
  title: string;
  description: string;
  content: {
    format: 'text' | 'json' | 'binary';
    data: string | Buffer;
    encoding?: string;
  };
  metadata: {
    tool: string;
    version: string;
    timestamp: Date;
    checksum: string;
  };
  validation: {
    verified: boolean;
    signature?: string;
  };
}

/**
 * Audit trail entry
 */
export interface AuditEntry {
  id: string;
  timestamp: Date;
  tenantId: string;
  workspaceId: string;
  actor: {
    type: 'agent' | 'human';
    id: string;
    gaid?: string;
  };
  action: {
    type: string;
    description: string;
    parameters: Record<string, unknown>;
  };
  resource: {
    type: string;
    id: string;
    path?: string;
  };
  result: {
    status: 'success' | 'failure' | 'pending';
    message?: string;
    evidence?: Evidence[];
  };
  governance: {
    policyEvaluation: AuthorizationResult;
    approvals?: ApprovalRecord[];
  };
  context: {
    correlationId: string;
    traceId: string;
    sessionId: string;
  };
}

/**
 * Authorization result from Cedar policy engine
 */
export interface AuthorizationResult {
  decision: 'Allow' | 'Deny';
  reasons: string[];
  requiredApprovals?: ApprovalGate[];
}

/**
 * Approval gate definition
 */
export interface ApprovalGate {
  id: string;
  type: string;
  description: string;
  approvers: string[];
  timeout?: number;
}

/**
 * Approval record
 */
export interface ApprovalRecord {
  gateId: string;
  approver: string;
  decision: 'approved' | 'denied';
  timestamp: Date;
  reason?: string;
}

/**
 * Event handler function
 */
export type EventHandler = (data: unknown) => void | Promise<void>;
