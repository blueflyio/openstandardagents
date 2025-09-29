/**
 * OSSA Policy Type Definitions
 */

export interface PolicyRule {
  id: string;
  name: string;
  condition: string;
  action: 'allow' | 'deny' | 'require' | 'log';
  priority: number;
  description?: string;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  version: string;
  rules: PolicyRule[];
  scope: 'global' | 'agent' | 'workflow';
  targets?: string[];
}

export interface CompliancePolicy {
  id: string;
  standard: string; // OSSA version, GDPR, HIPAA, etc.
  requirements: string[];
  validations: PolicyRule[];
  auditLevel: 'basic' | 'standard' | 'comprehensive';
}

export interface GovernancePolicy {
  id: string;
  name: string;
  domain: string;
  policies: SecurityPolicy[];
  compliance: CompliancePolicy[];
  enforcementLevel: 'advisory' | 'warning' | 'blocking';
}
