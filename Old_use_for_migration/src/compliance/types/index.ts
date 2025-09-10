/**
 * OSSA v0.1.8 Compliance Framework Types
 * Core interfaces for FedRAMP and NIST 800-53 compliance validation
 */

export interface ComplianceFramework {
  name: string;
  version: string;
  authority: string;
  description: string;
  classification?: string;
}

export interface ComplianceControl {
  id: string;
  title: string;
  family: string;
  implemented: boolean;
  controlSummary: string;
  ossaComponents: string[];
  implementation: string[];
  evidence?: ComplianceEvidence[];
  risk?: RiskAssessment;
  lastAssessed?: Date;
  assessor?: string;
}

export interface ComplianceEvidence {
  type: 'documentation' | 'configuration' | 'log' | 'test_result' | 'audit_trail';
  path?: string;
  url?: string;
  description: string;
  lastVerified: Date;
}

export interface RiskAssessment {
  level: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High';
  likelihood: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High';
  impact: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High';
  mitigations: string[];
  residualRisk?: string;
}

export interface ComplianceMapping {
  apiVersion: string;
  kind: 'ComplianceMapping';
  metadata: {
    name: string;
    framework: string;
    version: string;
    authority: string;
    classification?: string;
    description: string;
  };
  controls: Record<string, ComplianceControl>;
  implementationStatus: {
    totalControls: number;
    implemented: number;
    partiallyImplemented: number;
    planned: number;
    notApplicable: number;
    overallCompliance: number;
  };
  continuousMonitoring?: {
    enabled: boolean;
    assessmentFrequency: string;
    metricsCollection: boolean;
    automatedReporting: boolean;
    remediationTracking: boolean;
  };
  riskAssessment?: {
    lastConducted: string;
    riskLevel: string;
    identifiedRisks: string[];
    mitigationStrategies: string[];
  };
}

export interface ComplianceValidationResult {
  framework: string;
  version: string;
  timestamp: Date;
  overallScore: number;
  controlResults: ControlValidationResult[];
  recommendations: string[];
  criticalFindings: string[];
  summary: ComplianceSummary;
}

export interface ControlValidationResult {
  controlId: string;
  status: 'compliant' | 'non_compliant' | 'partially_compliant' | 'not_applicable';
  score: number;
  findings: string[];
  evidence: ComplianceEvidence[];
  recommendations: string[];
}

export interface ComplianceSummary {
  totalControls: number;
  compliantControls: number;
  partiallyCompliantControls: number;
  nonCompliantControls: number;
  notApplicableControls: number;
  compliancePercentage: number;
  riskScore: number;
  maturityLevel: 'Initial' | 'Developing' | 'Defined' | 'Managed' | 'Optimizing';
}

export interface ComplianceReport {
  id: string;
  framework: string;
  version: string;
  generatedAt: Date;
  generatedBy: string;
  scope: string;
  validationResult: ComplianceValidationResult;
  executiveSummary: string;
  detailedFindings: ComplianceDetail[];
  actionPlan: ActionPlanItem[];
  metadata: {
    assessmentPeriod: string;
    nextAssessmentDue: Date;
    assessorCredentials: string;
    approvalStatus: 'draft' | 'under_review' | 'approved' | 'published';
  };
}

export interface ComplianceDetail {
  section: string;
  findings: string[];
  evidence: ComplianceEvidence[];
  riskLevel: string;
  impact: string;
  recommendations: string[];
}

export interface ActionPlanItem {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  assignee: string;
  dueDate: Date;
  status: 'planned' | 'in_progress' | 'completed' | 'overdue';
  controls: string[];
  estimatedEffort: string;
}

export interface OSSAWorkspaceContext {
  path: string;
  config: any;
  agents: any[];
  security: any;
  networking: any;
  storage: any;
  observability: any;
}

export interface ComplianceConfiguration {
  enabledFrameworks: string[];
  assessmentFrequency: string;
  automatedScanning: boolean;
  reportingEndpoints: string[];
  thresholds: {
    minimumCompliance: number;
    criticalControlFailureThreshold: number;
    riskScoreThreshold: number;
  };
  notifications: {
    enabled: boolean;
    channels: string[];
    criticalOnly: boolean;
  };
}

export const ComplianceFrameworks = {
  FEDRAMP: {
    name: 'FedRAMP',
    version: '2.0',
    authority: 'GSA',
    description: 'Federal Risk and Authorization Management Program'
  },
  NIST_800_53: {
    name: 'NIST-800-53',
    version: 'Rev 5',
    authority: 'NIST',
    description: 'Security and Privacy Controls for Federal Information Systems'
  }
} as const;

export type SupportedFramework = keyof typeof ComplianceFrameworks;