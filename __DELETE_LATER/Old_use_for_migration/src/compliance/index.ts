/**
 * OSSA v0.1.8 Compliance Validation System
 * Main entry point for compliance validation, scoring, and reporting
 */

// Core types and interfaces
export * from './types';

// Validation services
export { FedRAMPValidationService } from './services/fedramp-service';
export { NIST80053ValidationService } from './services/nist-800-53-service';
export { ComplianceService } from './services/compliance-service';

// Scoring and metrics
export { ComplianceScorer } from './scoring/compliance-scorer';
export type { 
  ComplianceMetrics, 
  ScoringWeights, 
  TrendAnalysis, 
  BenchmarkComparison 
} from './scoring/compliance-scorer';

// Reporting system
export { ComplianceReporter } from './reporting/compliance-reporter';
export type { 
  ReportOptions, 
  ReportTemplate, 
  ReportSection, 
  ReportStyling 
} from './reporting/compliance-reporter';

// API endpoints
export { ComplianceEndpoints } from './endpoints/compliance-endpoints';
export type {
  ComplianceValidationRequest,
  BulkComplianceRequest,
  ComplianceScheduleRequest
} from './endpoints/compliance-endpoints';

// CLI interface
export { ComplianceCLI } from './cli/compliance-cli';

// Convenience factory functions
export const createComplianceService = (ossaRoot?: string) => {
  return new ComplianceService(ossaRoot);
};

export const createComplianceReporter = (ossaRoot?: string, config?: any) => {
  return new ComplianceReporter(ossaRoot, config);
};

export const createComplianceEndpoints = (ossaRoot?: string, config?: any) => {
  return new ComplianceEndpoints(ossaRoot, config);
};

export const createComplianceCLI = (ossaRoot?: string) => {
  return new ComplianceCLI(ossaRoot);
};

// Version information
export const COMPLIANCE_VERSION = 'OSSA v0.1.8';
export const SUPPORTED_FRAMEWORKS = ['FedRAMP', 'NIST-800-53'] as const;

/**
 * Quick compliance validation utility function
 */
export const validateCompliance = async (
  workspacePath: string,
  framework: 'FEDRAMP' | 'NIST_800_53',
  ossaRoot?: string
) => {
  const service = new ComplianceService(ossaRoot);
  const workspaceContext = {
    path: workspacePath,
    config: {},
    agents: [],
    security: {},
    networking: {},
    storage: {},
    observability: {}
  };
  
  return await service.quickCheck(workspaceContext, framework);
};

/**
 * Generate compliance report utility function
 */
export const generateComplianceReport = async (
  workspacePath: string,
  framework: 'FEDRAMP' | 'NIST_800_53',
  format: 'json' | 'pdf' | 'html' = 'json',
  ossaRoot?: string
) => {
  const service = new ComplianceService(ossaRoot);
  const reporter = new ComplianceReporter(ossaRoot);
  
  const workspaceContext = {
    path: workspacePath,
    config: {},
    agents: [],
    security: {},
    networking: {},
    storage: {},
    observability: {}
  };
  
  const assessmentResult = await service.assessCompliance(workspaceContext, {
    frameworks: [framework],
    includeMetrics: true,
    includeReporting: true,
    reportFormats: [format],
    detailedAnalysis: true,
    benchmarkComparison: true
  });
  
  const frameworkResult = assessmentResult.frameworks[framework];
  return frameworkResult.reportPaths?.[0];
};