/**
 * OSSA v0.1.8 FedRAMP Compliance Validation Service
 * Implements FedRAMP control validation and assessment
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import {
  ComplianceMapping,
  ComplianceValidationResult,
  ControlValidationResult,
  ComplianceEvidence,
  OSSAWorkspaceContext,
  ComplianceSummary,
  RiskAssessment
} from '../types';

export class FedRAMPValidationService {
  private mappingData: ComplianceMapping | null = null;
  private readonly mappingPath: string;

  constructor(private readonly ossaRoot: string = process.cwd()) {
    this.mappingPath = path.join(this.ossaRoot, 'infrastructure', 'compliance', 'fedramp', 'mapping.yaml');
  }

  /**
   * Load FedRAMP control mapping from YAML configuration
   */
  async loadMapping(): Promise<ComplianceMapping> {
    if (this.mappingData) {
      return this.mappingData;
    }

    try {
      const mappingContent = fs.readFileSync(this.mappingPath, 'utf8');
      this.mappingData = yaml.load(mappingContent) as ComplianceMapping;
      return this.mappingData;
    } catch (error) {
      throw new Error(`Failed to load FedRAMP mapping: ${error.message}`);
    }
  }

  /**
   * Validate OSSA workspace against FedRAMP controls
   */
  async validateWorkspace(workspaceContext: OSSAWorkspaceContext): Promise<ComplianceValidationResult> {
    const mapping = await this.loadMapping();
    const controlResults: ControlValidationResult[] = [];
    
    for (const [controlId, control] of Object.entries(mapping.controls)) {
      const result = await this.validateControl(controlId, control, workspaceContext);
      controlResults.push(result);
    }

    const summary = this.calculateSummary(controlResults);
    const overallScore = summary.compliancePercentage;

    return {
      framework: 'FedRAMP',
      version: mapping.metadata.version,
      timestamp: new Date(),
      overallScore,
      controlResults,
      recommendations: this.generateRecommendations(controlResults),
      criticalFindings: this.identifyCriticalFindings(controlResults),
      summary
    };
  }

  /**
   * Validate individual FedRAMP control
   */
  private async validateControl(
    controlId: string,
    control: any,
    context: OSSAWorkspaceContext
  ): Promise<ControlValidationResult> {
    const findings: string[] = [];
    const evidence: ComplianceEvidence[] = [];
    const recommendations: string[] = [];
    let score = 0;

    try {
      // Validate OSSA components exist and are properly configured
      for (const component of control.ossa_components || []) {
        const componentValidation = await this.validateOSSAComponent(component, context);
        if (componentValidation.isValid) {
          score += componentValidation.score;
          evidence.push(...componentValidation.evidence);
        } else {
          findings.push(...componentValidation.findings);
          recommendations.push(...componentValidation.recommendations);
        }
      }

      // Validate evidence paths exist
      if (control.evidence) {
        for (const evidenceItem of control.evidence) {
          const evidenceValidation = await this.validateEvidence(evidenceItem, context);
          if (evidenceValidation.exists) {
            evidence.push({
              type: 'documentation',
              path: evidenceItem.path,
              description: `FedRAMP control ${controlId} evidence`,
              lastVerified: new Date()
            });
          } else {
            findings.push(`Missing evidence: ${evidenceItem.path}`);
            recommendations.push(`Create missing evidence file: ${evidenceItem.path}`);
          }
        }
      }

      // Validate implementation requirements
      if (control.implementation) {
        const implValidation = await this.validateImplementation(control.implementation, context);
        score += implValidation.score;
        findings.push(...implValidation.findings);
        recommendations.push(...implValidation.recommendations);
      }

      // Determine overall control status
      const maxScore = (control.ossa_components?.length || 0) * 25 + 25; // Base implementation score
      const normalizedScore = Math.min(100, (score / maxScore) * 100);
      
      let status: ControlValidationResult['status'];
      if (normalizedScore >= 90) status = 'compliant';
      else if (normalizedScore >= 70) status = 'partially_compliant';
      else if (normalizedScore > 0) status = 'partially_compliant';
      else status = 'non_compliant';

      return {
        controlId,
        status,
        score: normalizedScore,
        findings,
        evidence,
        recommendations
      };

    } catch (error) {
      return {
        controlId,
        status: 'non_compliant',
        score: 0,
        findings: [`Validation error: ${error.message}`],
        evidence: [],
        recommendations: [`Fix validation error for control ${controlId}`]
      };
    }
  }

  /**
   * Validate OSSA component configuration
   */
  private async validateOSSAComponent(
    componentPath: string,
    context: OSSAWorkspaceContext
  ): Promise<{
    isValid: boolean;
    score: number;
    findings: string[];
    recommendations: string[];
    evidence: ComplianceEvidence[];
  }> {
    const findings: string[] = [];
    const recommendations: string[] = [];
    const evidence: ComplianceEvidence[] = [];
    let score = 0;

    try {
      const pathParts = componentPath.split('.');
      let current: any = context;

      // Navigate to component in context
      for (const part of pathParts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          findings.push(`Missing configuration: ${componentPath}`);
          recommendations.push(`Configure ${componentPath} in workspace settings`);
          return { isValid: false, score: 0, findings, recommendations, evidence };
        }
      }

      // Component exists, validate its configuration
      if (current !== undefined && current !== null) {
        score = 25; // Base score for existing component
        evidence.push({
          type: 'configuration',
          description: `Component ${componentPath} is configured`,
          lastVerified: new Date()
        });

        // Additional validation based on component type
        if (componentPath.includes('security')) {
          score += this.validateSecurityComponent(current, findings, recommendations);
        } else if (componentPath.includes('authentication')) {
          score += this.validateAuthComponent(current, findings, recommendations);
        } else if (componentPath.includes('logging') || componentPath.includes('audit')) {
          score += this.validateLoggingComponent(current, findings, recommendations);
        }
      }

      return {
        isValid: findings.length === 0,
        score,
        findings,
        recommendations,
        evidence
      };

    } catch (error) {
      findings.push(`Component validation error: ${error.message}`);
      return { isValid: false, score: 0, findings, recommendations, evidence };
    }
  }

  /**
   * Validate evidence file exists
   */
  private async validateEvidence(
    evidenceItem: any,
    context: OSSAWorkspaceContext
  ): Promise<{ exists: boolean }> {
    try {
      if (evidenceItem.path) {
        const fullPath = path.resolve(context.path, evidenceItem.path);
        return { exists: fs.existsSync(fullPath) };
      }
      return { exists: false };
    } catch {
      return { exists: false };
    }
  }

  /**
   * Validate implementation requirements
   */
  private async validateImplementation(
    implementation: string[],
    context: OSSAWorkspaceContext
  ): Promise<{
    score: number;
    findings: string[];
    recommendations: string[];
  }> {
    const findings: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    for (const requirement of implementation) {
      // Basic implementation validation
      if (requirement.includes('Role-based access control')) {
        if (context.security?.authorization?.rbac) {
          score += 5;
        } else {
          findings.push('RBAC not configured');
          recommendations.push('Configure role-based access control');
        }
      } else if (requirement.includes('OAuth 2.0')) {
        if (context.security?.authentication?.oauth) {
          score += 5;
        } else {
          findings.push('OAuth 2.0 not configured');
          recommendations.push('Configure OAuth 2.0 authentication');
        }
      } else if (requirement.includes('TLS')) {
        if (context.networking?.tls) {
          score += 5;
        } else {
          findings.push('TLS not configured');
          recommendations.push('Configure TLS encryption');
        }
      } else if (requirement.includes('logging') || requirement.includes('audit')) {
        if (context.observability?.logging) {
          score += 5;
        } else {
          findings.push('Audit logging not configured');
          recommendations.push('Configure comprehensive audit logging');
        }
      }
    }

    return { score, findings, recommendations };
  }

  /**
   * Validate security component configuration
   */
  private validateSecurityComponent(
    component: any,
    findings: string[],
    recommendations: string[]
  ): number {
    let score = 0;

    if (component.policies && Array.isArray(component.policies)) {
      score += 10;
    } else {
      findings.push('Security policies not defined');
      recommendations.push('Define comprehensive security policies');
    }

    if (component.encryption) {
      score += 10;
    } else {
      findings.push('Encryption configuration missing');
      recommendations.push('Configure encryption settings');
    }

    return score;
  }

  /**
   * Validate authentication component
   */
  private validateAuthComponent(
    component: any,
    findings: string[],
    recommendations: string[]
  ): number {
    let score = 0;

    if (component.multiFactor) {
      score += 15;
    } else {
      findings.push('Multi-factor authentication not enabled');
      recommendations.push('Enable multi-factor authentication');
    }

    if (component.keyRotation) {
      score += 10;
    } else {
      findings.push('Key rotation not configured');
      recommendations.push('Configure automatic key rotation');
    }

    return score;
  }

  /**
   * Validate logging component
   */
  private validateLoggingComponent(
    component: any,
    findings: string[],
    recommendations: string[]
  ): number {
    let score = 0;

    if (component.structured && component.format) {
      score += 10;
    } else {
      findings.push('Structured logging not configured');
      recommendations.push('Configure structured JSON logging');
    }

    if (component.retention) {
      score += 5;
    } else {
      findings.push('Log retention policy missing');
      recommendations.push('Define log retention policies');
    }

    return score;
  }

  /**
   * Calculate compliance summary
   */
  private calculateSummary(controlResults: ControlValidationResult[]): ComplianceSummary {
    const totalControls = controlResults.length;
    const compliantControls = controlResults.filter(r => r.status === 'compliant').length;
    const partiallyCompliantControls = controlResults.filter(r => r.status === 'partially_compliant').length;
    const nonCompliantControls = controlResults.filter(r => r.status === 'non_compliant').length;
    const notApplicableControls = controlResults.filter(r => r.status === 'not_applicable').length;

    const compliancePercentage = Math.round(
      ((compliantControls + partiallyCompliantControls * 0.5) / totalControls) * 100
    );

    const avgScore = controlResults.reduce((sum, r) => sum + r.score, 0) / totalControls;
    const riskScore = Math.max(0, 100 - avgScore);

    let maturityLevel: ComplianceSummary['maturityLevel'] = 'Initial';
    if (compliancePercentage >= 95) maturityLevel = 'Optimizing';
    else if (compliancePercentage >= 80) maturityLevel = 'Managed';
    else if (compliancePercentage >= 65) maturityLevel = 'Defined';
    else if (compliancePercentage >= 50) maturityLevel = 'Developing';

    return {
      totalControls,
      compliantControls,
      partiallyCompliantControls,
      nonCompliantControls,
      notApplicableControls,
      compliancePercentage,
      riskScore,
      maturityLevel
    };
  }

  /**
   * Generate recommendations based on validation results
   */
  private generateRecommendations(controlResults: ControlValidationResult[]): string[] {
    const recommendations = new Set<string>();

    for (const result of controlResults) {
      if (result.status !== 'compliant') {
        result.recommendations.forEach(rec => recommendations.add(rec));
      }
    }

    // Add general recommendations
    const nonCompliantCount = controlResults.filter(r => r.status === 'non_compliant').length;
    if (nonCompliantCount > 0) {
      recommendations.add('Prioritize addressing non-compliant controls to improve security posture');
    }

    const partialCount = controlResults.filter(r => r.status === 'partially_compliant').length;
    if (partialCount > 0) {
      recommendations.add('Complete partially implemented controls to achieve full compliance');
    }

    return Array.from(recommendations);
  }

  /**
   * Identify critical findings
   */
  private identifyCriticalFindings(controlResults: ControlValidationResult[]): string[] {
    const criticalFindings: string[] = [];

    // High-risk controls that are non-compliant
    const criticalControls = ['AC-3', 'AC-6', 'SC-7', 'SC-8', 'AU-2', 'IA-2'];
    
    for (const result of controlResults) {
      if (criticalControls.includes(result.controlId) && result.status === 'non_compliant') {
        criticalFindings.push(
          `CRITICAL: Control ${result.controlId} is non-compliant - immediate attention required`
        );
      }
    }

    return criticalFindings;
  }
}