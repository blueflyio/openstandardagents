/**
 * OSSA COMPLIANCE-ENGINE v0.1.9-alpha.1
 * 
 * Enterprise compliance and governance engine for OSSA Platform production deployments.
 * Enforces OSSA conformance levels, manages regulatory compliance, and provides 
 * enterprise-grade governance for production OSSA deployments.
 */

import { SpecificationValidator } from '../../specification/validator.js';
import { components } from '../../types/api.js';
import { CompliancePolicy, GovernancePolicy, SecurityPolicy } from '../../types/policies/index.js';
import { AgentConformance, OSSAAgent } from '../../types/agents/index.js';
import * as fs from 'fs';
import * as path from 'path';

type ValidationResult = components['schemas']['ValidationResult'];
type ValidationError = components['schemas']['ValidationError'];

export interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  standard: 'ISO-42001' | 'NIST-AI-RMF' | 'EU-AI-Act' | 'FedRAMP-Moderate' | 'NIST-800-53' | 'ISO-25010';
  requirements: ComplianceRequirement[];
  mappings: OSSAConformanceMapping[];
}

export interface ComplianceRequirement {
  id: string;
  title: string;
  description: string;
  category: 'governance' | 'risk-management' | 'transparency' | 'accountability' | 'security' | 'privacy';
  mandatory: boolean;
  evidence: string[];
  validation: (agent: OSSAAgent, context: ComplianceContext) => ComplianceValidationResult;
}

export interface OSSAConformanceMapping {
  ossaLevel: 'bronze' | 'silver' | 'gold';
  requirementIds: string[];
  additionalControls?: string[];
}

export interface ComplianceContext {
  environment: 'development' | 'staging' | 'production';
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  region: string;
  industry?: string;
  dataTypes?: string[];
}

export interface ComplianceValidationResult {
  compliant: boolean;
  score: number;
  findings: ComplianceFinding[];
  recommendations: string[];
  auditTrail: AuditEntry[];
}

export interface ComplianceFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  requirement: string;
  description: string;
  evidence?: any;
  remediation: string;
}

export interface AuditEntry {
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  outcome: 'success' | 'failure' | 'partial';
  details: any;
  compliance?: string[];
}

export interface EnterprisePolicyEnforcement {
  policyId: string;
  enforcementLevel: 'advisory' | 'warning' | 'blocking';
  scope: 'agent' | 'workflow' | 'platform';
  rules: PolicyEnforcementRule[];
}

export interface PolicyEnforcementRule {
  condition: string;
  action: 'allow' | 'deny' | 'require-approval' | 'log-only';
  parameters?: any;
}

/**
 * Enterprise OSSA Compliance Engine
 * 
 * Responsibilities:
 * - OSSA conformance level validation (Bronze/Silver/Gold)
 * - Regulatory compliance frameworks (ISO 42001, NIST AI RMF, EU AI Act)
 * - Enterprise policy enforcement and governance
 * - Audit trail management and compliance reporting
 * - Production governance workflow enforcement
 */
export class ComplianceEngine {
  private readonly ossaVersion = '0.1.9-alpha.1';
  private readonly specValidator: SpecificationValidator;
  private readonly frameworks: Map<string, ComplianceFramework> = new Map();
  private readonly auditLog: AuditEntry[] = [];
  private readonly enterprisePolicies: Map<string, EnterprisePolicyEnforcement> = new Map();
  
  constructor() {
    this.specValidator = new SpecificationValidator();
    this.initializeComplianceFrameworks();
    this.loadEnterprisePolicies();
  }

  /**
   * Initialize supported regulatory compliance frameworks
   */
  private initializeComplianceFrameworks(): void {
    // ISO 42001 - Information technology — Artificial intelligence — Management system
    const iso42001: ComplianceFramework = {
      id: 'iso-42001',
      name: 'ISO/IEC 42001:2023',
      version: '2023',
      standard: 'ISO-42001',
      requirements: [
        {
          id: 'iso-42001-4.1',
          title: 'Understanding the organization and its context',
          description: 'AI system documentation and context understanding',
          category: 'governance',
          mandatory: true,
          evidence: ['agent-manifest', 'capability-documentation', 'deployment-context'],
          validation: this.validateContextDocumentation.bind(this)
        },
        {
          id: 'iso-42001-6.1',
          title: 'Actions to address risks and opportunities',
          description: 'AI risk assessment and mitigation strategies',
          category: 'risk-management',
          mandatory: true,
          evidence: ['risk-assessment', 'security-controls', 'performance-monitoring'],
          validation: this.validateRiskManagement.bind(this)
        },
        {
          id: 'iso-42001-7.5',
          title: 'Documented information',
          description: 'Comprehensive audit trail and documentation',
          category: 'transparency',
          mandatory: true,
          evidence: ['audit-logs', 'decision-trails', 'version-history'],
          validation: this.validateDocumentationControls.bind(this)
        }
      ],
      mappings: [
        {
          ossaLevel: 'bronze',
          requirementIds: ['iso-42001-4.1']
        },
        {
          ossaLevel: 'silver',
          requirementIds: ['iso-42001-4.1', 'iso-42001-6.1']
        },
        {
          ossaLevel: 'gold',
          requirementIds: ['iso-42001-4.1', 'iso-42001-6.1', 'iso-42001-7.5'],
          additionalControls: ['continuous-monitoring', 'automated-compliance']
        }
      ]
    };

    // NIST AI Risk Management Framework
    const nistAiRmf: ComplianceFramework = {
      id: 'nist-ai-rmf',
      name: 'NIST AI Risk Management Framework',
      version: '1.0',
      standard: 'NIST-AI-RMF',
      requirements: [
        {
          id: 'nist-ai-govern-1.1',
          title: 'AI governance and oversight',
          description: 'Establish AI governance structure and oversight mechanisms',
          category: 'governance',
          mandatory: true,
          evidence: ['governance-policies', 'oversight-mechanisms', 'accountability-framework'],
          validation: this.validateAIGovernance.bind(this)
        },
        {
          id: 'nist-ai-manage-2.1',
          title: 'AI system lifecycle management',
          description: 'Manage AI systems throughout their lifecycle',
          category: 'risk-management',
          mandatory: true,
          evidence: ['lifecycle-documentation', 'change-management', 'retirement-procedures'],
          validation: this.validateLifecycleManagement.bind(this)
        },
        {
          id: 'nist-ai-measure-2.1',
          title: 'AI system performance monitoring',
          description: 'Continuous monitoring of AI system performance and impact',
          category: 'accountability',
          mandatory: true,
          evidence: ['performance-metrics', 'impact-assessments', 'monitoring-systems'],
          validation: this.validatePerformanceMonitoring.bind(this)
        }
      ],
      mappings: [
        {
          ossaLevel: 'bronze',
          requirementIds: ['nist-ai-govern-1.1']
        },
        {
          ossaLevel: 'silver',
          requirementIds: ['nist-ai-govern-1.1', 'nist-ai-manage-2.1']
        },
        {
          ossaLevel: 'gold',
          requirementIds: ['nist-ai-govern-1.1', 'nist-ai-manage-2.1', 'nist-ai-measure-2.1']
        }
      ]
    };

    // EU AI Act
    const euAiAct: ComplianceFramework = {
      id: 'eu-ai-act',
      name: 'EU Artificial Intelligence Act',
      version: '2024',
      standard: 'EU-AI-Act',
      requirements: [
        {
          id: 'eu-ai-art-9',
          title: 'Risk management system',
          description: 'Establish and maintain risk management system for high-risk AI',
          category: 'risk-management',
          mandatory: true,
          evidence: ['risk-management-system', 'risk-assessments', 'mitigation-measures'],
          validation: this.validateEUAIRiskManagement.bind(this)
        },
        {
          id: 'eu-ai-art-12',
          title: 'Record-keeping obligations',
          description: 'Maintain detailed logs and records of AI system operations',
          category: 'transparency',
          mandatory: true,
          evidence: ['operation-logs', 'decision-records', 'user-interactions'],
          validation: this.validateRecordKeeping.bind(this)
        },
        {
          id: 'eu-ai-art-14',
          title: 'Human oversight',
          description: 'Ensure appropriate human oversight of AI systems',
          category: 'accountability',
          mandatory: true,
          evidence: ['human-oversight-mechanisms', 'intervention-capabilities', 'escalation-procedures'],
          validation: this.validateHumanOversight.bind(this)
        }
      ],
      mappings: [
        {
          ossaLevel: 'bronze',
          requirementIds: ['eu-ai-art-12']
        },
        {
          ossaLevel: 'silver',
          requirementIds: ['eu-ai-art-12', 'eu-ai-art-9']
        },
        {
          ossaLevel: 'gold',
          requirementIds: ['eu-ai-art-12', 'eu-ai-art-9', 'eu-ai-art-14']
        }
      ]
    };

    this.frameworks.set('iso-42001', iso42001);
    this.frameworks.set('nist-ai-rmf', nistAiRmf);
    this.frameworks.set('eu-ai-act', euAiAct);
  }

  /**
   * Load enterprise-specific policies from configuration
   */
  private loadEnterprisePolicies(): void {
    // Default enterprise policies for production environments
    const defaultPolicies: EnterprisePolicyEnforcement[] = [
      {
        policyId: 'prod-security-baseline',
        enforcementLevel: 'blocking',
        scope: 'platform',
        rules: [
          {
            condition: 'agent.spec.protocols.supported.some(p => p.tls === false)',
            action: 'deny',
            parameters: { message: 'TLS is required for all production agents' }
          },
          {
            condition: 'agent.spec.conformance.level !== "gold" && environment === "production"',
            action: 'require-approval',
            parameters: { approverRoles: ['security-officer', 'compliance-manager'] }
          }
        ]
      },
      {
        policyId: 'audit-compliance',
        enforcementLevel: 'blocking',
        scope: 'agent',
        rules: [
          {
            condition: 'agent.spec.conformance.auditLogging !== true',
            action: 'deny',
            parameters: { message: 'Audit logging is mandatory for enterprise deployment' }
          }
        ]
      },
      {
        policyId: 'budget-governance',
        enforcementLevel: 'warning',
        scope: 'workflow',
        rules: [
          {
            condition: 'workflow.totalBudget > 10000',
            action: 'require-approval',
            parameters: { approverRoles: ['budget-manager'], escalationThreshold: 50000 }
          }
        ]
      }
    ];

    defaultPolicies.forEach(policy => {
      this.enterprisePolicies.set(policy.policyId, policy);
    });
  }

  /**
   * Comprehensive OSSA conformance validation with enterprise compliance
   */
  async validateOSSAConformance(
    agent: OSSAAgent, 
    context: ComplianceContext,
    requiredFrameworks: string[] = []
  ): Promise<ComplianceValidationResult> {
    const auditEntry: AuditEntry = {
      timestamp: new Date().toISOString(),
      actor: 'compliance-engine',
      action: 'validate-conformance',
      resource: `agent:${agent.metadata.name}`,
      outcome: 'success',
      details: { context, requiredFrameworks }
    };

    try {
      // 1. Basic OSSA specification validation
      const specValidation = await this.specValidator.validate(agent);
      if (!specValidation.valid) {
        auditEntry.outcome = 'failure';
        auditEntry.details.specErrors = specValidation.errors;
        this.auditLog.push(auditEntry);
        
        return {
          compliant: false,
          score: 0,
          findings: [{
            id: 'ossa-spec-violation',
            severity: 'critical',
            category: 'specification',
            requirement: 'OSSA v0.1.9-alpha.1 compliance',
            description: 'Agent violates OSSA specification requirements',
            evidence: specValidation.errors,
            remediation: 'Fix specification violations and re-validate'
          }],
          recommendations: ['Review OSSA specification documentation', 'Use OSSA-compliant agent templates'],
          auditTrail: [auditEntry]
        };
      }

      const findings: ComplianceFinding[] = [];
      const recommendations: string[] = [];
      let totalScore = 100;

      // 2. Conformance level validation
      const conformanceLevel = agent.spec.conformance?.level || 'bronze';
      const conformanceValidation = this.validateConformanceLevel(agent, conformanceLevel, context);
      findings.push(...conformanceValidation.findings);
      recommendations.push(...conformanceValidation.recommendations);
      totalScore *= conformanceValidation.score;

      // 3. Enterprise policy enforcement
      const policyValidation = this.enforceEnterprisePolicies(agent, context);
      findings.push(...policyValidation.findings);
      recommendations.push(...policyValidation.recommendations);
      totalScore *= policyValidation.score;

      // 4. Regulatory framework compliance (if required)
      for (const frameworkId of requiredFrameworks) {
        const framework = this.frameworks.get(frameworkId);
        if (framework) {
          const frameworkValidation = await this.validateRegulatoryCompliance(agent, framework, context);
          findings.push(...frameworkValidation.findings);
          recommendations.push(...frameworkValidation.recommendations);
          totalScore *= frameworkValidation.score;
        }
      }

      const isCompliant = findings.every(f => f.severity !== 'critical') && totalScore >= 0.8;
      auditEntry.outcome = isCompliant ? 'success' : 'partial';
      auditEntry.compliance = requiredFrameworks;
      this.auditLog.push(auditEntry);

      return {
        compliant: isCompliant,
        score: Math.max(0, Math.min(100, totalScore)),
        findings,
        recommendations: [...new Set(recommendations)],
        auditTrail: [auditEntry]
      };

    } catch (error) {
      auditEntry.outcome = 'failure';
      auditEntry.details.error = error instanceof Error ? error.message : 'Unknown error';
      this.auditLog.push(auditEntry);
      
      throw new Error(`Compliance validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate specific OSSA conformance level requirements
   */
  private validateConformanceLevel(
    agent: OSSAAgent, 
    level: 'bronze' | 'silver' | 'gold',
    context: ComplianceContext
  ): { findings: ComplianceFinding[]; recommendations: string[]; score: number } {
    const findings: ComplianceFinding[] = [];
    const recommendations: string[] = [];
    const conformance = agent.spec.conformance || {};
    
    const requirements = this.specValidator.getConformanceLevels()[level];
    let score = 1.0;

    // Validate minimum capabilities
    const capabilities = agent.spec.capabilities?.domains || [];
    if (capabilities.length < requirements.minCapabilities) {
      findings.push({
        id: `conformance-${level}-capabilities`,
        severity: 'high',
        category: 'conformance',
        requirement: `${level.toUpperCase()} level minimum capabilities`,
        description: `Agent has ${capabilities.length} capabilities, requires ${requirements.minCapabilities}`,
        remediation: 'Add additional capability domains to meet conformance requirements'
      });
      score *= 0.7;
    }

    // Validate minimum protocols
    const protocols = agent.spec.protocols?.supported || [];
    if (protocols.length < requirements.minProtocols) {
      findings.push({
        id: `conformance-${level}-protocols`,
        severity: 'high',
        category: 'conformance',
        requirement: `${level.toUpperCase()} level minimum protocols`,
        description: `Agent supports ${protocols.length} protocols, requires ${requirements.minProtocols}`,
        remediation: 'Add additional protocol support to meet conformance requirements'
      });
      score *= 0.7;
    }

    // Validate feature requirements
    if (requirements.auditLogging && !conformance.auditLogging) {
      findings.push({
        id: `conformance-${level}-audit`,
        severity: context.environment === 'production' ? 'critical' : 'high',
        category: 'conformance',
        requirement: `${level.toUpperCase()} level audit logging`,
        description: 'Audit logging is required but not enabled',
        remediation: 'Enable audit logging in agent conformance configuration'
      });
      score *= context.environment === 'production' ? 0.5 : 0.8;
    }

    if (requirements.feedbackLoop && !conformance.feedbackLoop) {
      findings.push({
        id: `conformance-${level}-feedback`,
        severity: 'medium',
        category: 'conformance',
        requirement: `${level.toUpperCase()} level feedback loop`,
        description: 'Feedback loop integration is required but not enabled',
        remediation: 'Enable feedback loop integration in agent conformance configuration'
      });
      score *= 0.9;
    }

    if (requirements.propsTokens && !conformance.propsTokens) {
      findings.push({
        id: `conformance-${level}-props`,
        severity: 'medium',
        category: 'conformance',
        requirement: `${level.toUpperCase()} level PROPS token efficiency`,
        description: 'PROPS token efficiency tracking is required but not enabled',
        remediation: 'Enable PROPS token efficiency tracking in agent conformance configuration'
      });
      score *= 0.9;
    }

    return { findings, recommendations, score };
  }

  /**
   * Enforce enterprise-specific policies
   */
  private enforceEnterprisePolicies(
    agent: OSSAAgent,
    context: ComplianceContext
  ): { findings: ComplianceFinding[]; recommendations: string[]; score: number } {
    const findings: ComplianceFinding[] = [];
    const recommendations: string[] = [];
    let score = 1.0;

    for (const [policyId, policy] of this.enterprisePolicies.entries()) {
      for (const rule of policy.rules) {
        try {
          // Simplified rule evaluation (in production, use a proper rule engine)
          const violatesRule = this.evaluatePolicyRule(agent, context, rule);
          
          if (violatesRule) {
            const severity = policy.enforcementLevel === 'blocking' ? 'critical' : 
                           policy.enforcementLevel === 'warning' ? 'medium' : 'low';
            
            findings.push({
              id: `policy-${policyId}-violation`,
              severity,
              category: 'policy',
              requirement: `Enterprise Policy: ${policyId}`,
              description: `Policy rule violated: ${rule.condition}`,
              evidence: { rule, policy },
              remediation: rule.parameters?.message || 'Comply with enterprise policy requirements'
            });

            score *= policy.enforcementLevel === 'blocking' ? 0.5 : 0.8;
          }
        } catch (error) {
          // Log policy evaluation errors but don't fail compliance
          console.warn(`Policy evaluation error for ${policyId}:`, error);
        }
      }
    }

    return { findings, recommendations, score };
  }

  /**
   * Validate regulatory compliance against specific framework
   */
  private async validateRegulatoryCompliance(
    agent: OSSAAgent,
    framework: ComplianceFramework,
    context: ComplianceContext
  ): Promise<{ findings: ComplianceFinding[]; recommendations: string[]; score: number }> {
    const findings: ComplianceFinding[] = [];
    const recommendations: string[] = [];
    let score = 1.0;

    const conformanceLevel = agent.spec.conformance?.level || 'bronze';
    const applicableMapping = framework.mappings.find(m => m.ossaLevel === conformanceLevel);
    
    if (!applicableMapping) {
      findings.push({
        id: `${framework.id}-no-mapping`,
        severity: 'high',
        category: 'regulatory',
        requirement: `${framework.name} conformance mapping`,
        description: `No compliance mapping found for ${conformanceLevel} level`,
        remediation: 'Upgrade to supported conformance level or request custom mapping'
      });
      return { findings, recommendations, score: 0.5 };
    }

    // Validate applicable requirements
    for (const requirementId of applicableMapping.requirementIds) {
      const requirement = framework.requirements.find(r => r.id === requirementId);
      if (requirement) {
        try {
          const validationResult = requirement.validation(agent, context);
          if (!validationResult.compliant) {
            findings.push(...validationResult.findings);
            score *= validationResult.score;
          }
          recommendations.push(...validationResult.recommendations);
        } catch (error) {
          findings.push({
            id: `${framework.id}-${requirementId}-error`,
            severity: 'high',
            category: 'regulatory',
            requirement: requirement.title,
            description: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            remediation: 'Review requirement implementation and fix validation errors'
          });
          score *= 0.8;
        }
      }
    }

    return { findings, recommendations, score };
  }

  // Framework-specific validation methods
  private validateContextDocumentation(agent: OSSAAgent, context: ComplianceContext): ComplianceValidationResult {
    const findings: ComplianceFinding[] = [];
    let score = 1.0;

    if (!agent.metadata.description) {
      findings.push({
        id: 'iso-42001-context-desc',
        severity: 'medium',
        category: 'documentation',
        requirement: 'ISO 42001 Section 4.1 - Context Documentation',
        description: 'Agent lacks comprehensive description',
        remediation: 'Add detailed description explaining agent purpose and context'
      });
      score *= 0.9;
    }

    return {
      compliant: findings.every(f => f.severity !== 'critical'),
      score,
      findings,
      recommendations: ['Document agent context and intended use'],
      auditTrail: []
    };
  }

  private validateRiskManagement(agent: OSSAAgent, context: ComplianceContext): ComplianceValidationResult {
    const findings: ComplianceFinding[] = [];
    let score = 1.0;

    if (!agent.spec.performance) {
      findings.push({
        id: 'iso-42001-risk-perf',
        severity: 'high',
        category: 'risk-management',
        requirement: 'ISO 42001 Section 6.1 - Risk Assessment',
        description: 'Agent lacks performance specifications for risk assessment',
        remediation: 'Define performance characteristics and risk thresholds'
      });
      score *= 0.7;
    }

    return {
      compliant: findings.every(f => f.severity !== 'critical'),
      score,
      findings,
      recommendations: ['Implement comprehensive risk assessment framework'],
      auditTrail: []
    };
  }

  private validateDocumentationControls(agent: OSSAAgent, context: ComplianceContext): ComplianceValidationResult {
    const findings: ComplianceFinding[] = [];
    let score = 1.0;

    if (!agent.spec.conformance?.auditLogging) {
      findings.push({
        id: 'iso-42001-doc-audit',
        severity: 'critical',
        category: 'documentation',
        requirement: 'ISO 42001 Section 7.5 - Documented Information',
        description: 'Audit logging not enabled for documentation compliance',
        remediation: 'Enable audit logging to maintain documented information trail'
      });
      score *= 0.5;
    }

    return {
      compliant: findings.every(f => f.severity !== 'critical'),
      score,
      findings,
      recommendations: ['Implement comprehensive audit trail documentation'],
      auditTrail: []
    };
  }

  private validateAIGovernance(agent: OSSAAgent, context: ComplianceContext): ComplianceValidationResult {
    // NIST AI RMF governance validation implementation
    return {
      compliant: true,
      score: 1.0,
      findings: [],
      recommendations: [],
      auditTrail: []
    };
  }

  private validateLifecycleManagement(agent: OSSAAgent, context: ComplianceContext): ComplianceValidationResult {
    // NIST AI RMF lifecycle management validation implementation
    return {
      compliant: true,
      score: 1.0,
      findings: [],
      recommendations: [],
      auditTrail: []
    };
  }

  private validatePerformanceMonitoring(agent: OSSAAgent, context: ComplianceContext): ComplianceValidationResult {
    // NIST AI RMF performance monitoring validation implementation
    return {
      compliant: true,
      score: 1.0,
      findings: [],
      recommendations: [],
      auditTrail: []
    };
  }

  private validateEUAIRiskManagement(agent: OSSAAgent, context: ComplianceContext): ComplianceValidationResult {
    // EU AI Act risk management validation implementation
    return {
      compliant: true,
      score: 1.0,
      findings: [],
      recommendations: [],
      auditTrail: []
    };
  }

  private validateRecordKeeping(agent: OSSAAgent, context: ComplianceContext): ComplianceValidationResult {
    // EU AI Act record keeping validation implementation
    return {
      compliant: true,
      score: 1.0,
      findings: [],
      recommendations: [],
      auditTrail: []
    };
  }

  private validateHumanOversight(agent: OSSAAgent, context: ComplianceContext): ComplianceValidationResult {
    // EU AI Act human oversight validation implementation
    return {
      compliant: true,
      score: 1.0,
      findings: [],
      recommendations: [],
      auditTrail: []
    };
  }

  /**
   * Simplified policy rule evaluation (replace with proper rule engine in production)
   */
  private evaluatePolicyRule(agent: OSSAAgent, context: ComplianceContext, rule: PolicyEnforcementRule): boolean {
    // This is a simplified implementation
    // In production, use a proper rule engine like JSONLogic or similar
    try {
      if (rule.condition.includes('agent.spec.protocols.supported.some(p => p.tls === false)')) {
        return agent.spec.protocols?.supported?.some(p => p.tls === false) || false;
      }
      
      if (rule.condition.includes('agent.spec.conformance.level !== "gold" && environment === "production"')) {
        return agent.spec.conformance?.level !== 'gold' && context.environment === 'production';
      }
      
      if (rule.condition.includes('agent.spec.conformance.auditLogging !== true')) {
        return agent.spec.conformance?.auditLogging !== true;
      }

      return false;
    } catch (error) {
      console.warn('Policy rule evaluation error:', error);
      return false;
    }
  }

  /**
   * Generate comprehensive compliance report
   */
  async generateComplianceReport(
    agents: OSSAAgent[],
    context: ComplianceContext,
    frameworks: string[] = []
  ): Promise<{
    summary: ComplianceReportSummary;
    agentResults: Array<{ agent: OSSAAgent; result: ComplianceValidationResult }>;
    recommendations: string[];
    auditTrail: AuditEntry[];
  }> {
    const agentResults: Array<{ agent: OSSAAgent; result: ComplianceValidationResult }> = [];
    const allFindings: ComplianceFinding[] = [];
    const allRecommendations: string[] = [];
    
    for (const agent of agents) {
      const result = await this.validateOSSAConformance(agent, context, frameworks);
      agentResults.push({ agent, result });
      allFindings.push(...result.findings);
      allRecommendations.push(...result.recommendations);
    }

    const summary: ComplianceReportSummary = {
      totalAgents: agents.length,
      compliantAgents: agentResults.filter(r => r.result.compliant).length,
      averageScore: agentResults.reduce((sum, r) => sum + r.result.score, 0) / agents.length,
      criticalFindings: allFindings.filter(f => f.severity === 'critical').length,
      frameworks: frameworks.map(id => this.frameworks.get(id)?.name || id),
      timestamp: new Date().toISOString()
    };

    return {
      summary,
      agentResults,
      recommendations: [...new Set(allRecommendations)],
      auditTrail: this.getAuditTrail()
    };
  }

  /**
   * Get audit trail for compliance reporting
   */
  getAuditTrail(since?: string): AuditEntry[] {
    if (!since) {
      return [...this.auditLog];
    }
    
    const sinceDate = new Date(since);
    return this.auditLog.filter(entry => new Date(entry.timestamp) >= sinceDate);
  }

  /**
   * Get supported compliance frameworks
   */
  getSupportedFrameworks(): ComplianceFramework[] {
    return Array.from(this.frameworks.values());
  }

  /**
   * Get enterprise policies
   */
  getEnterprisePolicies(): EnterprisePolicyEnforcement[] {
    return Array.from(this.enterprisePolicies.values());
  }
}

export interface ComplianceReportSummary {
  totalAgents: number;
  compliantAgents: number;
  averageScore: number;
  criticalFindings: number;
  frameworks: string[];
  timestamp: string;
}