/**
 * Governance Provider Interface
 * Defines the contract for authorization and compliance engines (Cedar, OPA, etc.)
 */

export interface GovernanceConfig {
  authorization?: {
    clearance_level?: string;
    tool_permissions?: Array<{
      tool?: string;
      risk_level?: string;
      actions?: string[];
    }>;
  };
  compliance?: {
    frameworks?: string[];
  };
}

export interface ComplianceResult {
  compliant: boolean;
  issues: string[];
  warnings: string[];
}

export interface AuthorizationRequest {
  agent: string;
  action: string;
  resource: string;
  context?: Record<string, unknown>;
}

export interface AuthorizationResult {
  decision: 'ALLOW' | 'DENY';
  reason: string;
  diagnostics?: {
    policies_evaluated: string[];
  };
}

export interface QualityGateRequest {
  environment: string;
  metrics: {
    confidence_score: number;
    vulnerability_count: number;
    [key: string]: unknown;
  };
}

export interface QualityGateResult {
  decision: 'PASS' | 'FAIL';
  blocked_by: string[];
  policy_decision: {
    decision: 'ALLOW' | 'DENY';
    reason: string;
  };
}

export interface GovernanceProvider {
  name: string;
  version: string;
  checkCompliance(config: GovernanceConfig): Promise<ComplianceResult>;
  authorize(request: AuthorizationRequest): Promise<AuthorizationResult>;
  evaluateQualityGate(request: QualityGateRequest): Promise<QualityGateResult>;
}
