/**
 * OSSA v0.1.8 NIST 800-53 Compliance Validation Service
 * Implements NIST 800-53 Rev 5 control validation and assessment
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

export class NIST80053ValidationService {
  private mappingData: ComplianceMapping | null = null;
  private readonly mappingPath: string;

  constructor(private readonly ossaRoot: string = process.cwd()) {
    this.mappingPath = path.join(this.ossaRoot, 'infrastructure', 'compliance', 'nist-800-53', 'mapping.yaml');
  }

  /**
   * Load NIST 800-53 control mapping from YAML configuration
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
      throw new Error(`Failed to load NIST 800-53 mapping: ${error.message}`);
    }
  }

  /**
   * Validate OSSA workspace against NIST 800-53 controls
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
      framework: 'NIST-800-53',
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
   * Validate individual NIST 800-53 control with enhanced assessment methodology
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
    const assessmentMethod = this.getControlAssessmentMethod(controlId);

    try {
      // Enhanced OSSA component validation with NIST 800-53 specific checks
      for (const component of control.ossa_components || []) {
        const componentValidation = await this.validateNISTComponent(
          component, 
          context, 
          controlId,
          assessmentMethod
        );
        
        if (componentValidation.isValid) {
          score += componentValidation.score;
          evidence.push(...componentValidation.evidence);
        } else {
          findings.push(...componentValidation.findings);
          recommendations.push(...componentValidation.recommendations);
        }
      }

      // Validate implementation guidance specific to NIST 800-53
      if (control.implementation_guidance) {
        const guidanceValidation = await this.validateImplementationGuidance(
          control.implementation_guidance, 
          context,
          controlId
        );
        score += guidanceValidation.score;
        findings.push(...guidanceValidation.findings);
        recommendations.push(...guidanceValidation.recommendations);
      }

      // Enhanced evidence validation for NIST requirements
      if (control.evidence) {
        const evidenceValidation = await this.validateNISTEvidence(
          control.evidence,
          context,
          controlId
        );
        evidence.push(...evidenceValidation.evidence);
        findings.push(...evidenceValidation.findings);
        recommendations.push(...evidenceValidation.recommendations);
      }

      // Control family-specific validation
      const familyValidation = await this.validateControlFamily(controlId, control, context);
      score += familyValidation.score;
      findings.push(...familyValidation.findings);
      recommendations.push(...familyValidation.recommendations);

      // Calculate weighted score based on control criticality
      const controlWeight = this.getControlWeight(controlId);
      const maxScore = this.getMaxScoreForControl(controlId, control);
      const normalizedScore = Math.min(100, (score / maxScore) * 100 * controlWeight);
      
      const status = this.determineControlStatus(normalizedScore, findings.length);

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
        findings: [`NIST 800-53 validation error: ${error.message}`],
        evidence: [],
        recommendations: [`Resolve validation error for NIST control ${controlId}`]
      };
    }
  }

  /**
   * Enhanced NIST component validation with family-specific checks
   */
  private async validateNISTComponent(
    componentPath: string,
    context: OSSAWorkspaceContext,
    controlId: string,
    assessmentMethod: string[]
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

      // Navigate to component
      for (const part of pathParts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          findings.push(`NIST requirement: Missing configuration ${componentPath}`);
          recommendations.push(`Implement NIST 800-53 compliant ${componentPath} configuration`);
          return { isValid: false, score: 0, findings, recommendations, evidence };
        }
      }

      if (current !== undefined && current !== null) {
        score = 30; // Base NIST compliance score
        evidence.push({
          type: 'configuration',
          description: `NIST 800-53 component ${componentPath} implemented`,
          lastVerified: new Date()
        });

        // NIST-specific component validation
        score += await this.validateNISTSpecificRequirements(
          componentPath, 
          current, 
          controlId, 
          findings, 
          recommendations
        );

        // Assessment method validation
        for (const method of assessmentMethod) {
          if (method === 'Examine' && this.hasDocumentation(current)) {
            score += 10;
          } else if (method === 'Interview' && this.hasProcessDocumentation(current)) {
            score += 10;
          } else if (method === 'Test' && this.hasTestableConfiguration(current)) {
            score += 15;
          }
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
      findings.push(`NIST component validation error: ${error.message}`);
      return { isValid: false, score: 0, findings, recommendations, evidence };
    }
  }

  /**
   * Validate NIST-specific requirements based on component type
   */
  private async validateNISTSpecificRequirements(
    componentPath: string,
    component: any,
    controlId: string,
    findings: string[],
    recommendations: string[]
  ): Promise<number> {
    let score = 0;

    // Access Control family specific validations
    if (controlId.startsWith('AC')) {
      if (componentPath.includes('rbac') && component.policies) {
        score += this.validateRBACPolicies(component, findings, recommendations);
      }
      if (componentPath.includes('authorization') && component.matrix) {
        score += 15; // Authorization matrix present
      }
    }

    // Audit family specific validations
    else if (controlId.startsWith('AU')) {
      if (componentPath.includes('logging')) {
        score += this.validateAuditLogging(component, findings, recommendations);
      }
      if (componentPath.includes('retention') && component.policy) {
        score += 10; // Retention policy defined
      }
    }

    // Configuration Management family
    else if (controlId.startsWith('CM')) {
      if (componentPath.includes('baseline') && component.version) {
        score += 15; // Baseline version tracking
      }
      if (componentPath.includes('change') && component.approvalProcess) {
        score += 20; // Change approval process
      }
    }

    // Identification and Authentication family
    else if (controlId.startsWith('IA')) {
      if (componentPath.includes('authentication')) {
        score += this.validateAuthenticationMechanisms(component, findings, recommendations);
      }
      if (componentPath.includes('credentials') && component.encryption) {
        score += 15; // Credential encryption
      }
    }

    // System and Communications Protection family
    else if (controlId.startsWith('SC')) {
      if (componentPath.includes('encryption')) {
        score += this.validateEncryptionImplementation(component, findings, recommendations);
      }
      if (componentPath.includes('boundary') && component.firewall) {
        score += 20; // Network boundary protection
      }
    }

    // System and Information Integrity family
    else if (controlId.startsWith('SI')) {
      if (componentPath.includes('monitoring')) {
        score += this.validateSystemMonitoring(component, findings, recommendations);
      }
      if (componentPath.includes('integrity') && component.validation) {
        score += 15; // Integrity validation mechanisms
      }
    }

    return score;
  }

  /**
   * Validate RBAC policies implementation
   */
  private validateRBACPolicies(
    component: any,
    findings: string[],
    recommendations: string[]
  ): number {
    let score = 0;

    if (component.roles && Array.isArray(component.roles)) {
      score += 10;
      
      // Check for separation of duties
      if (component.separationOfDuties) {
        score += 10;
      } else {
        findings.push('Separation of duties not implemented in RBAC');
        recommendations.push('Implement separation of duties controls in RBAC system');
      }

      // Check for principle of least privilege
      if (component.leastPrivilege) {
        score += 10;
      } else {
        findings.push('Principle of least privilege not enforced');
        recommendations.push('Implement least privilege principle in role assignments');
      }
    } else {
      findings.push('RBAC roles not properly defined');
      recommendations.push('Define comprehensive RBAC roles and permissions');
    }

    return score;
  }

  /**
   * Validate audit logging configuration
   */
  private validateAuditLogging(
    component: any,
    findings: string[],
    recommendations: string[]
  ): number {
    let score = 0;

    // Check for required audit events (AU-2)
    if (component.events && Array.isArray(component.events)) {
      score += 15;
      
      // Validate required NIST audit events are included
      const requiredEvents = [
        'successful_logons', 'unsuccessful_logons', 
        'account_management', 'object_access', 
        'policy_changes', 'privilege_use'
      ];
      
      const configuredEvents = component.events.map((e: any) => e.type || e);
      const missingEvents = requiredEvents.filter(evt => 
        !configuredEvents.some((configured: string) => 
          configured.toLowerCase().includes(evt.toLowerCase())
        )
      );

      if (missingEvents.length === 0) {
        score += 10;
      } else {
        findings.push(`Missing required audit events: ${missingEvents.join(', ')}`);
        recommendations.push('Configure all required NIST 800-53 audit events');
      }
    } else {
      findings.push('Audit events not configured');
      recommendations.push('Configure comprehensive audit event logging per NIST AU-2');
    }

    // Check for structured logging format (AU-3)
    if (component.format && component.format.includes('json')) {
      score += 10;
    } else {
      findings.push('Structured audit logging format not configured');
      recommendations.push('Implement structured JSON audit logging format');
    }

    return score;
  }

  /**
   * Validate authentication mechanisms
   */
  private validateAuthenticationMechanisms(
    component: any,
    findings: string[],
    recommendations: string[]
  ): number {
    let score = 0;

    // Multi-factor authentication (IA-2)
    if (component.multiFactor) {
      score += 20;
      
      // Check for acceptable MFA methods
      if (component.methods && Array.isArray(component.methods)) {
        const acceptableMethods = ['totp', 'hardware_token', 'biometric', 'smart_card'];
        const hasAcceptableMethod = component.methods.some((method: string) =>
          acceptableMethods.includes(method.toLowerCase())
        );
        
        if (hasAcceptableMethod) {
          score += 10;
        } else {
          findings.push('MFA methods do not meet NIST requirements');
          recommendations.push('Implement NIST-approved MFA methods (TOTP, hardware tokens, etc.)');
        }
      }
    } else {
      findings.push('Multi-factor authentication not configured');
      recommendations.push('Implement multi-factor authentication per NIST IA-2');
    }

    // Password policies (IA-5)
    if (component.passwordPolicy) {
      score += 15;
      
      const policy = component.passwordPolicy;
      if (policy.minLength && policy.minLength >= 12) {
        score += 5;
      } else {
        findings.push('Password minimum length does not meet NIST guidelines');
        recommendations.push('Set minimum password length to 12 characters per NIST guidelines');
      }
    }

    return score;
  }

  /**
   * Validate encryption implementation
   */
  private validateEncryptionImplementation(
    component: any,
    findings: string[],
    recommendations: string[]
  ): number {
    let score = 0;

    // Check for FIPS-approved algorithms (SC-13)
    if (component.algorithms && Array.isArray(component.algorithms)) {
      const fipsAlgorithms = ['aes-256', 'aes-256-gcm', 'rsa-2048', 'rsa-4096', 'ecdsa-p256'];
      const hasFipsAlgorithm = component.algorithms.some((alg: string) =>
        fipsAlgorithms.some(fips => alg.toLowerCase().includes(fips))
      );
      
      if (hasFipsAlgorithm) {
        score += 25;
      } else {
        findings.push('Non-FIPS approved encryption algorithms in use');
        recommendations.push('Use only FIPS 140-2 approved encryption algorithms');
      }
    } else {
      findings.push('Encryption algorithms not specified');
      recommendations.push('Configure FIPS 140-2 approved encryption algorithms');
    }

    // Key management (SC-12)
    if (component.keyManagement) {
      score += 15;
      
      if (component.keyManagement.rotation) {
        score += 10;
      } else {
        findings.push('Key rotation not configured');
        recommendations.push('Implement automated cryptographic key rotation');
      }
    }

    return score;
  }

  /**
   * Validate system monitoring capabilities
   */
  private validateSystemMonitoring(
    component: any,
    findings: string[],
    recommendations: string[]
  ): number {
    let score = 0;

    // Intrusion detection (SI-4)
    if (component.intrusionDetection) {
      score += 20;
      
      if (component.intrusionDetection.realTime) {
        score += 10;
      } else {
        findings.push('Real-time intrusion detection not enabled');
        recommendations.push('Enable real-time intrusion detection and monitoring');
      }
    } else {
      findings.push('Intrusion detection system not configured');
      recommendations.push('Implement intrusion detection system per NIST SI-4');
    }

    // Malware protection (SI-3)
    if (component.malwareProtection) {
      score += 15;
    } else {
      findings.push('Malware protection not configured');
      recommendations.push('Implement malware detection and protection mechanisms');
    }

    return score;
  }

  /**
   * Get NIST 800-53 assessment method for control
   */
  private getControlAssessmentMethod(controlId: string): string[] {
    const methodMap: Record<string, string[]> = {
      'AC-1': ['Examine', 'Interview'],
      'AC-2': ['Examine', 'Interview', 'Test'],
      'AC-3': ['Examine', 'Test'],
      'AU-2': ['Examine', 'Interview', 'Test'],
      'AU-3': ['Examine', 'Test'],
      'CM-2': ['Examine', 'Interview', 'Test'],
      'IA-2': ['Examine', 'Interview', 'Test'],
      'SC-7': ['Examine', 'Interview', 'Test'],
      'SC-8': ['Examine', 'Test'],
      'SI-4': ['Examine', 'Interview', 'Test']
    };

    return methodMap[controlId] || ['Examine', 'Interview'];
  }

  /**
   * Get control weight for scoring
   */
  private getControlWeight(controlId: string): number {
    // Critical controls get higher weights
    const criticalControls = ['AC-3', 'AC-6', 'AU-2', 'IA-2', 'SC-7', 'SC-8', 'SI-4'];
    return criticalControls.includes(controlId) ? 1.5 : 1.0;
  }

  /**
   * Get maximum possible score for a control
   */
  private getMaxScoreForControl(controlId: string, control: any): number {
    let maxScore = 30; // Base score
    
    // Add points for components
    if (control.ossa_components) {
      maxScore += control.ossa_components.length * 50;
    }
    
    // Add points for assessment methods
    const methods = this.getControlAssessmentMethod(controlId);
    maxScore += methods.length * 15;
    
    // Add family-specific maximums
    if (controlId.startsWith('AC')) maxScore += 40;
    else if (controlId.startsWith('AU')) maxScore += 35;
    else if (controlId.startsWith('IA')) maxScore += 45;
    else if (controlId.startsWith('SC')) maxScore += 50;
    else if (controlId.startsWith('SI')) maxScore += 45;
    
    return maxScore;
  }

  /**
   * Determine control status based on score and findings
   */
  private determineControlStatus(score: number, findingsCount: number): ControlValidationResult['status'] {
    if (findingsCount === 0 && score >= 90) return 'compliant';
    if (score >= 70) return 'partially_compliant';
    if (score > 0) return 'partially_compliant';
    return 'non_compliant';
  }

  /**
   * Helper methods for component validation
   */
  private hasDocumentation(component: any): boolean {
    return !!(component.documentation || component.policies || component.procedures);
  }

  private hasProcessDocumentation(component: any): boolean {
    return !!(component.process || component.workflow || component.procedures);
  }

  private hasTestableConfiguration(component: any): boolean {
    return !!(component.tests || component.validation || component.monitoring);
  }

  /**
   * Validate implementation guidance
   */
  private async validateImplementationGuidance(
    guidance: string[],
    context: OSSAWorkspaceContext,
    controlId: string
  ): Promise<{
    score: number;
    findings: string[];
    recommendations: string[];
  }> {
    const findings: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    for (const guidanceItem of guidance) {
      // Implementation-specific validations based on guidance content
      if (guidanceItem.includes('access control policies') && context.security?.policies) {
        score += 10;
      } else if (guidanceItem.includes('audit') && context.observability?.logging) {
        score += 10;
      } else if (guidanceItem.includes('authentication') && context.security?.authentication) {
        score += 10;
      } else {
        findings.push(`Implementation guidance not fully addressed: ${guidanceItem}`);
        recommendations.push(`Implement guidance: ${guidanceItem}`);
      }
    }

    return { score, findings, recommendations };
  }

  /**
   * Validate control family requirements
   */
  private async validateControlFamily(
    controlId: string,
    control: any,
    context: OSSAWorkspaceContext
  ): Promise<{
    score: number;
    findings: string[];
    recommendations: string[];
  }> {
    const findings: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    const family = controlId.split('-')[0];
    
    switch (family) {
      case 'RA': // Risk Assessment
        if (context.security?.riskAssessment) {
          score += 20;
        } else {
          findings.push('Risk assessment documentation missing');
          recommendations.push('Conduct and document comprehensive risk assessment');
        }
        break;
        
      default:
        score += 5; // Base family compliance
    }

    return { score, findings, recommendations };
  }

  /**
   * Validate NIST-specific evidence requirements
   */
  private async validateNISTEvidence(
    evidence: any[],
    context: OSSAWorkspaceContext,
    controlId: string
  ): Promise<{
    evidence: ComplianceEvidence[];
    findings: string[];
    recommendations: string[];
  }> {
    const resultEvidence: ComplianceEvidence[] = [];
    const findings: string[] = [];
    const recommendations: string[] = [];

    for (const evidenceItem of evidence) {
      if (evidenceItem.path) {
        const fullPath = path.resolve(context.path, evidenceItem.path);
        if (fs.existsSync(fullPath)) {
          resultEvidence.push({
            type: 'documentation',
            path: evidenceItem.path,
            description: `NIST 800-53 ${controlId} evidence documentation`,
            lastVerified: new Date()
          });
        } else {
          findings.push(`NIST evidence missing: ${evidenceItem.path}`);
          recommendations.push(`Create required NIST evidence file: ${evidenceItem.path}`);
        }
      }
    }

    return { evidence: resultEvidence, findings, recommendations };
  }

  /**
   * Calculate compliance summary with NIST-specific metrics
   */
  private calculateSummary(controlResults: ControlValidationResult[]): ComplianceSummary {
    const totalControls = controlResults.length;
    const compliantControls = controlResults.filter(r => r.status === 'compliant').length;
    const partiallyCompliantControls = controlResults.filter(r => r.status === 'partially_compliant').length;
    const nonCompliantControls = controlResults.filter(r => r.status === 'non_compliant').length;
    const notApplicableControls = controlResults.filter(r => r.status === 'not_applicable').length;

    const compliancePercentage = Math.round(
      ((compliantControls + partiallyCompliantControls * 0.6) / totalControls) * 100
    );

    // Weight-adjusted risk calculation
    const weightedScore = controlResults.reduce((sum, r) => {
      const weight = this.getControlWeight(r.controlId);
      return sum + (r.score * weight);
    }, 0) / controlResults.reduce((sum, r) => sum + this.getControlWeight(r.controlId), 0);

    const riskScore = Math.max(0, 100 - weightedScore);

    // NIST maturity levels based on compliance percentage
    let maturityLevel: ComplianceSummary['maturityLevel'] = 'Initial';
    if (compliancePercentage >= 98) maturityLevel = 'Optimizing';
    else if (compliancePercentage >= 85) maturityLevel = 'Managed';
    else if (compliancePercentage >= 70) maturityLevel = 'Defined';
    else if (compliancePercentage >= 55) maturityLevel = 'Developing';

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
   * Generate NIST-specific recommendations
   */
  private generateRecommendations(controlResults: ControlValidationResult[]): string[] {
    const recommendations = new Set<string>();

    // Control family specific recommendations
    const familyScores = new Map<string, number>();
    
    for (const result of controlResults) {
      const family = result.controlId.split('-')[0];
      const currentScore = familyScores.get(family) || 0;
      familyScores.set(family, currentScore + result.score);
      
      if (result.status !== 'compliant') {
        result.recommendations.forEach(rec => recommendations.add(rec));
      }
    }

    // Add family-specific recommendations
    for (const [family, avgScore] of familyScores.entries()) {
      const controlCount = controlResults.filter(r => r.controlId.startsWith(family)).length;
      const familyAverage = avgScore / controlCount;
      
      if (familyAverage < 70) {
        switch (family) {
          case 'AC':
            recommendations.add('Strengthen access control implementation - critical for NIST compliance');
            break;
          case 'AU':
            recommendations.add('Enhance audit and accountability mechanisms');
            break;
          case 'IA':
            recommendations.add('Improve identification and authentication controls');
            break;
          case 'SC':
            recommendations.add('Strengthen system and communications protection measures');
            break;
          case 'SI':
            recommendations.add('Enhance system and information integrity controls');
            break;
        }
      }
    }

    // Add overall recommendations
    const overallCompliance = controlResults.filter(r => r.status === 'compliant').length / controlResults.length * 100;
    if (overallCompliance < 85) {
      recommendations.add('Consider engaging NIST compliance expert for gap analysis');
      recommendations.add('Implement continuous monitoring program per NIST guidelines');
    }

    return Array.from(recommendations);
  }

  /**
   * Identify critical findings specific to NIST 800-53
   */
  private identifyCriticalFindings(controlResults: ControlValidationResult[]): string[] {
    const criticalFindings: string[] = [];

    // NIST high-impact controls that are critical for compliance
    const criticalControls = {
      'AC-3': 'Access Enforcement',
      'AC-6': 'Least Privilege',
      'AU-2': 'Event Logging',
      'IA-2': 'Identification and Authentication',
      'SC-7': 'Boundary Protection',
      'SC-8': 'Transmission Confidentiality',
      'SI-4': 'System Monitoring'
    };
    
    for (const result of controlResults) {
      if (result.controlId in criticalControls && result.status === 'non_compliant') {
        criticalFindings.push(
          `CRITICAL NIST FINDING: ${result.controlId} (${criticalControls[result.controlId as keyof typeof criticalControls]}) - Non-compliant with immediate remediation required`
        );
      }
      
      // Score-based critical findings
      if (result.score < 30 && Object.keys(criticalControls).includes(result.controlId)) {
        criticalFindings.push(
          `HIGH RISK: ${result.controlId} score (${Math.round(result.score)}%) below acceptable threshold`
        );
      }
    }

    return criticalFindings;
  }
}