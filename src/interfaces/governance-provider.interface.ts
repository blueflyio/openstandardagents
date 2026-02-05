/**
 * Governance Provider Interface
 *
 * Defines the contract that all governance providers must implement.
 * Enables pluggable governance systems (Cedar, OPA, custom).
 *
 * Implementation-agnostic: providers can be Cedar, OPA, or custom logic.
 *
 * API-FIRST COMPLIANCE:
 * These types MUST match the compliance-engine OpenAPI spec:
 * - openapi/cedar-provider.openapi.yaml
 *
 * TODO: Generate these types from compliance-engine's published OpenAPI spec
 * using openapi-typescript once compliance-engine publishes @bluefly/compliance-engine-types
 *
 * For now, these types are manually kept in sync with the OpenAPI spec
 * defined in CEDAR_GOVERNANCE_IMPLEMENTATION_PLAN.md
 */

export interface GovernanceProvider {
  /**
   * Provider metadata
   */
  name: string;
  version: string;

  /**
   * Check if agent configuration meets governance requirements
   */
  checkCompliance(config: GovernanceConfig): Promise<ComplianceResult>;

  /**
   * Authorize an agent action
   */
  authorize(request: AuthorizationRequest): Promise<AuthorizationResult>;

  /**
   * Evaluate quality gate for deployment
   */
  evaluateQualityGate(request: QualityGateRequest): Promise<QualityGateResult>;
}

/**
 * Governance configuration from agent manifest
 */
export interface GovernanceConfig {
  authorization?: {
    clearance_level?: number;
    tool_permissions?: ToolPermission[];
    policy_references?: string[];
  };
  quality_requirements?: {
    confidence_threshold?: number;
    test_coverage_threshold?: number;
    security_score_threshold?: number;
    max_vulnerability_count?: number;
  };
  compliance?: {
    frameworks?: ('SOC2' | 'HIPAA' | 'GDPR' | 'PCI-DSS')[];
    data_classification?: 'public' | 'internal' | 'confidential' | 'restricted';
    audit_logging_required?: boolean;
  };
}

export interface ToolPermission {
  tool: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  requires_approval?: boolean;
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
  context?: Record<string, any>;
}

export interface AuthorizationResult {
  decision: 'ALLOW' | 'DENY';
  reason?: string;
  diagnostics?: {
    policies_evaluated?: string[];
    errors?: string[];
  };
}

export interface QualityGateRequest {
  pipeline_id?: string;
  environment: 'production' | 'staging' | 'development';
  metrics: {
    test_coverage: number;
    security_score: number;
    confidence_score: number;
    vulnerability_count: number;
  };
}

export interface QualityGateResult {
  decision: 'PASS' | 'FAIL';
  blocked_by?: string[];
  policy_decision?: AuthorizationResult;
}
