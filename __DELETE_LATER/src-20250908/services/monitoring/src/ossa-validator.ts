/**
 * OSSA Validator v0.1.8
 * Validates agent specifications against OSSA v0.1.8 standards
 * Supports 360° Feedback Loop architecture with 8-phase lifecycle
 * Plan → Execute → Critique → Judge → Integrate → Learn → Govern → Signal
 */

export interface ValidationConfig {
  strict?: boolean;
  allowWarnings?: boolean;
  customRules?: string[];
  ossaVersion?: string;
  enableFeedbackLoop?: boolean;
  enableVortexValidation?: boolean;
  enableActaValidation?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number;
  compliance_level: 'none' | 'basic' | 'standard' | 'advanced' | 'enterprise';
  ossa_version: string;
  feedback_loop_validation: FeedbackLoopValidation;
  token_optimization_score: number;
  conformance_tier: 'core' | 'governed' | 'advanced' | 'unknown';
}

export interface ValidationError {
  code: string;
  message: string;
  path: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationWarning {
  code: string;
  message: string;
  path: string;
  recommendation: string;
}

export interface FeedbackLoopValidation {
  phase_compliance: Record<FeedbackPhase, boolean>;
  phase_coverage: number;
  lifecycle_completeness: boolean;
  coordination_patterns: string[];
}

export type FeedbackPhase = 'plan' | 'execute' | 'critique' | 'judge' | 'integrate' | 'learn' | 'govern' | 'signal';

export type AgentRole = 'orchestrator' | 'worker' | 'critic' | 'judge' | 'integrator' | 'trainer' | 'governor' | 'telemetry';

export interface VortexToken {
  type: 'CONTEXT' | 'DATA' | 'STATE' | 'METRICS' | 'TEMPORAL';
  ttl?: number;
  resolver?: string;
  permissions?: string[];
}

export class OSSAValidator {
  private readonly OSSA_VERSION = '0.1.8';
  private readonly FEEDBACK_PHASES: FeedbackPhase[] = ['plan', 'execute', 'critique', 'judge', 'integrate', 'learn', 'govern', 'signal'];
  private readonly AGENT_ROLES: Record<AgentRole, FeedbackPhase[]> = {
    orchestrator: ['plan'],
    worker: ['execute'],
    critic: ['critique'],
    judge: ['judge'],
    integrator: ['integrate'],
    trainer: ['learn'],
    governor: ['govern'],
    telemetry: ['signal']
  };

  constructor(private config: ValidationConfig = { ossaVersion: '0.1.8', enableFeedbackLoop: true }) {}

  /**
   * Validate single agent specification against OSSA v0.1.8 standard
   */
  async validate(agentSpec: any): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // OSSA v0.1.8 structure validation
    this.validateOssaStructure(agentSpec, errors, warnings);
    
    // Metadata validation
    this.validateMetadata(agentSpec, errors, warnings);
    
    // Spec validation with v0.1.8 requirements
    this.validateSpec(agentSpec, errors, warnings);
    
    // Framework support validation
    this.validateFrameworkSupport(agentSpec, errors, warnings);

    // 360° Feedback Loop validation
    const feedbackValidation = this.validateFeedbackLoop(agentSpec, errors, warnings);

    // VORTEX Token Exchange validation
    this.validateVortexTokens(agentSpec, errors, warnings);

    // ACTA optimization validation
    this.validateActaOptimization(agentSpec, errors, warnings);

    // Security and compliance validation
    this.validateSecurityCompliance(agentSpec, errors, warnings);

    const score = this.calculateValidationScore(errors, warnings);
    const compliance_level = this.determineComplianceLevel(score, errors.length);
    const token_optimization_score = this.calculateTokenOptimizationScore(agentSpec);
    const conformance_tier = this.determineConformanceTier(agentSpec);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      score,
      compliance_level,
      ossa_version: this.config.ossaVersion || this.OSSA_VERSION,
      feedback_loop_validation: feedbackValidation,
      token_optimization_score,
      conformance_tier
    };
  }

  /**
   * Validate multiple agents
   */
  async validateMultiple(agents: any[]): Promise<ValidationResult[]> {
    // Validate multiple agent specifications
    
    const results = await Promise.all(
      agents.map(agent => this.validate(agent.oaas_spec || agent))
    );

    const summary = this.generateValidationSummary(results);
    // Validation completed successfully

    return results;
  }

  private validateBasicStructure(spec: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!spec) {
      errors.push({
        code: 'MISSING_SPEC',
        message: 'Agent specification is missing',
        path: 'root',
        severity: 'error'
      });
      return;
    }

    // Check required fields
    if (!spec.apiVersion) {
      errors.push({
        code: 'MISSING_API_VERSION',
        message: 'apiVersion is required',
        path: 'apiVersion',
        severity: 'error'
      });
    }

    if (!spec.kind) {
      errors.push({
        code: 'MISSING_KIND',
        message: 'kind is required',
        path: 'kind',
        severity: 'error'
      });
    } else if (spec.kind !== 'Agent') {
      warnings.push({
        code: 'UNEXPECTED_KIND',
        message: `Expected kind 'Agent', got '${spec.kind}'`,
        path: 'kind',
        recommendation: 'Use kind: Agent for agent specifications'
      });
    }

    if (!spec.metadata) {
      errors.push({
        code: 'MISSING_METADATA',
        message: 'metadata section is required',
        path: 'metadata',
        severity: 'error'
      });
    }

    if (!spec.spec) {
      errors.push({
        code: 'MISSING_SPEC',
        message: 'spec section is required',
        path: 'spec',
        severity: 'error'
      });
    }
  }

  private validateMetadata(spec: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!spec.metadata) return;

    const metadata = spec.metadata;

    if (!metadata.name) {
      errors.push({
        code: 'MISSING_METADATA_NAME',
        message: 'metadata.name is required',
        path: 'metadata.name',
        severity: 'error'
      });
    }

    if (!metadata.version) {
      warnings.push({
        code: 'MISSING_VERSION',
        message: 'metadata.version is recommended',
        path: 'metadata.version',
        recommendation: 'Add version field for better tracking'
      });
    }

    if (!metadata.description) {
      warnings.push({
        code: 'MISSING_DESCRIPTION',
        message: 'metadata.description is recommended',
        path: 'metadata.description',
        recommendation: 'Add description for better documentation'
      });
    }
  }

  private validateSpec(spec: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!spec.spec) return;

    const agentSpec = spec.spec;

    if (!agentSpec.agent) {
      errors.push({
        code: 'MISSING_AGENT_CONFIG',
        message: 'spec.agent is required',
        path: 'spec.agent',
        severity: 'error'
      });
    } else {
      if (!agentSpec.agent.name) {
        warnings.push({
          code: 'MISSING_AGENT_NAME',
          message: 'spec.agent.name is recommended',
          path: 'spec.agent.name',
          recommendation: 'Add agent name for clarity'
        });
      }
    }

    if (!agentSpec.capabilities || !Array.isArray(agentSpec.capabilities)) {
      warnings.push({
        code: 'MISSING_CAPABILITIES',
        message: 'spec.capabilities should be an array',
        path: 'spec.capabilities',
        recommendation: 'Define agent capabilities as an array'
      });
    } else if (agentSpec.capabilities.length === 0) {
      warnings.push({
        code: 'NO_CAPABILITIES',
        message: 'Agent has no defined capabilities',
        path: 'spec.capabilities',
        recommendation: 'Add at least one capability'
      });
    }
  }

  private validateFrameworks(spec: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!spec.spec?.frameworks) {
      warnings.push({
        code: 'NO_FRAMEWORKS',
        message: 'No frameworks specified',
        path: 'spec.frameworks',
        recommendation: 'Specify supported frameworks'
      });
      return;
    }

    const frameworks = spec.spec.frameworks;
    const supportedFrameworks = ['drupal', 'mcp', 'langchain', 'crewai', 'openai', 'anthropic'];
    
    Object.keys(frameworks).forEach(framework => {
      if (!supportedFrameworks.includes(framework)) {
        warnings.push({
          code: 'UNKNOWN_FRAMEWORK',
          message: `Unknown framework: ${framework}`,
          path: `spec.frameworks.${framework}`,
          recommendation: `Use one of: ${supportedFrameworks.join(', ')}`
        });
      }
    });
  }

  private calculateValidationScore(errors: ValidationError[], warnings: ValidationWarning[]): number {
    let score = 100;
    
    // Deduct points for errors and warnings
    score -= errors.length * 20; // 20 points per error
    score -= warnings.length * 5; // 5 points per warning
    
    return Math.max(0, score);
  }

  private determineComplianceLevel(score: number, errorCount: number): ValidationResult['compliance_level'] {
    if (errorCount > 0) return 'none';
    if (score >= 95) return 'enterprise';
    if (score >= 85) return 'advanced';
    if (score >= 70) return 'standard';
    if (score >= 50) return 'basic';
    return 'none';
  }

  private generateValidationSummary(results: ValidationResult[]): any {
    const totalAgents = results.length;
    const validAgents = results.filter(r => r.valid).length;
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / totalAgents;

    const complianceCounts = results.reduce((counts, r) => {
      counts[r.compliance_level] = (counts[r.compliance_level] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    return {
      total_agents: totalAgents,
      valid_agents: validAgents,
      validation_rate: ((validAgents / totalAgents) * 100).toFixed(1) + '%',
      total_errors: totalErrors,
      total_warnings: totalWarnings,
      average_score: avgScore.toFixed(1),
      compliance_breakdown: complianceCounts
    };
  }

  /**
   * Validate 360° Feedback Loop architecture compliance
   */
  private validateFeedbackLoop(spec: any, errors: ValidationError[], warnings: ValidationWarning[]): FeedbackLoopValidation {
    const feedbackValidation: FeedbackLoopValidation = {
      phase_compliance: {} as Record<FeedbackPhase, boolean>,
      phase_coverage: 0,
      lifecycle_completeness: false,
      coordination_patterns: []
    };

    if (!this.config.enableFeedbackLoop) {
      this.FEEDBACK_PHASES.forEach(phase => {
        feedbackValidation.phase_compliance[phase] = true;
      });
      feedbackValidation.lifecycle_completeness = true;
      return feedbackValidation;
    }

    const agentSpec = spec.spec;
    const agentRole = this.identifyAgentRole(agentSpec);
    
    // Validate phase coverage based on agent role
    this.FEEDBACK_PHASES.forEach(phase => {
      const isCompliant = this.validatePhaseCompliance(agentSpec, phase, agentRole);
      feedbackValidation.phase_compliance[phase] = isCompliant;
      if (isCompliant) {
        feedbackValidation.phase_coverage++;
      }
    });

    feedbackValidation.phase_coverage = (feedbackValidation.phase_coverage / this.FEEDBACK_PHASES.length) * 100;
    feedbackValidation.lifecycle_completeness = feedbackValidation.phase_coverage >= 12.5; // At least 1 phase

    // Check for coordination patterns
    if (agentSpec.coordination_patterns) {
      feedbackValidation.coordination_patterns = agentSpec.coordination_patterns;
    }

    // Add warnings for missing feedback loop implementation
    if (feedbackValidation.phase_coverage < 25) {
      warnings.push({
        code: 'LIMITED_FEEDBACK_PARTICIPATION',
        message: `Agent participates in ${feedbackValidation.phase_coverage.toFixed(1)}% of feedback phases`,
        path: 'spec.feedback_loop',
        recommendation: 'Consider expanding agent participation in 360° feedback loop phases'
      });
    }

    return feedbackValidation;
  }

  private identifyAgentRole(agentSpec: any): AgentRole {
    if (agentSpec.role) {
      return agentSpec.role;
    }

    // Infer role from capabilities or class
    const capabilities = agentSpec.capabilities?.primary || [];
    const agentClass = agentSpec.class;

    if (capabilities.some((cap: string) => cap.includes('orchestrat') || cap.includes('plan'))) {
      return 'orchestrator';
    }
    if (capabilities.some((cap: string) => cap.includes('execut') || cap.includes('work'))) {
      return 'worker';
    }
    if (capabilities.some((cap: string) => cap.includes('critic') || cap.includes('review'))) {
      return 'critic';
    }
    if (capabilities.some((cap: string) => cap.includes('judg') || cap.includes('decisi'))) {
      return 'judge';
    }
    if (capabilities.some((cap: string) => cap.includes('integrat') || cap.includes('merg'))) {
      return 'integrator';
    }
    if (capabilities.some((cap: string) => cap.includes('learn') || cap.includes('train'))) {
      return 'trainer';
    }
    if (capabilities.some((cap: string) => cap.includes('govern') || cap.includes('polic'))) {
      return 'governor';
    }
    if (capabilities.some((cap: string) => cap.includes('monitor') || cap.includes('telemetr'))) {
      return 'telemetry';
    }

    // Default based on class
    if (agentClass === 'coordinator') return 'orchestrator';
    if (agentClass === 'security') return 'governor';
    
    return 'worker'; // Default role
  }

  private validatePhaseCompliance(agentSpec: any, phase: FeedbackPhase, role: AgentRole): boolean {
    const rolePhases = this.AGENT_ROLES[role];
    return rolePhases.includes(phase) || this.hasPhaseCapability(agentSpec, phase);
  }

  private hasPhaseCapability(agentSpec: any, phase: FeedbackPhase): boolean {
    const capabilities = [...(agentSpec.capabilities?.primary || []), ...(agentSpec.capabilities?.secondary || [])];
    const phaseKeywords: Record<FeedbackPhase, string[]> = {
      plan: ['plan', 'strategy', 'design', 'architecture'],
      execute: ['execute', 'implement', 'run', 'perform'],
      critique: ['critique', 'review', 'analyze', 'evaluate'],
      judge: ['judge', 'decide', 'arbitrate', 'resolve'],
      integrate: ['integrate', 'merge', 'combine', 'consolidate'],
      learn: ['learn', 'train', 'adapt', 'improve'],
      govern: ['govern', 'policy', 'compliance', 'control'],
      signal: ['monitor', 'observe', 'measure', 'report']
    };

    const keywords = phaseKeywords[phase];
    return capabilities.some((cap: string) => 
      keywords.some(keyword => cap.toLowerCase().includes(keyword))
    );
  }

  /**
   * Validate VORTEX Token Exchange System
   */
  private validateVortexTokens(spec: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!this.config.enableVortexValidation) return;

    const vortexConfig = spec.spec?.vortex_tokens;
    if (!vortexConfig) {
      warnings.push({
        code: 'NO_VORTEX_SUPPORT',
        message: 'VORTEX Token Exchange System not configured',
        path: 'spec.vortex_tokens',
        recommendation: 'Add VORTEX token support for optimized token exchange'
      });
      return;
    }

    // Validate token types
    const validTokenTypes = ['CONTEXT', 'DATA', 'STATE', 'METRICS', 'TEMPORAL'];
    if (vortexConfig.supported_types && Array.isArray(vortexConfig.supported_types)) {
      vortexConfig.supported_types.forEach((type: string, index: number) => {
        if (!validTokenTypes.includes(type)) {
          errors.push({
            code: 'INVALID_VORTEX_TOKEN_TYPE',
            message: `Invalid VORTEX token type '${type}'`,
            path: `spec.vortex_tokens.supported_types[${index}]`,
            severity: 'error'
          });
        }
      });
    }

    // Validate resolver functions
    if (vortexConfig.resolvers && typeof vortexConfig.resolvers !== 'object') {
      errors.push({
        code: 'INVALID_VORTEX_RESOLVERS',
        message: 'VORTEX resolvers must be an object',
        path: 'spec.vortex_tokens.resolvers',
        severity: 'error'
      });
    }

    // Check for security boundaries
    if (!vortexConfig.security_boundaries) {
      warnings.push({
        code: 'MISSING_VORTEX_SECURITY',
        message: 'VORTEX security boundaries not defined',
        path: 'spec.vortex_tokens.security_boundaries',
        recommendation: 'Define security boundaries for token resolution'
      });
    }
  }

  /**
   * Validate ACTA Token Optimization
   */
  private validateActaOptimization(spec: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!this.config.enableActaValidation) return;

    const actaConfig = spec.spec?.acta_optimization;
    if (!actaConfig) {
      warnings.push({
        code: 'NO_ACTA_OPTIMIZATION',
        message: 'ACTA Token Optimization not configured',
        path: 'spec.acta_optimization',
        recommendation: 'Add ACTA optimization for token reduction and cost savings'
      });
      return;
    }

    // Validate semantic compression
    if (actaConfig.semantic_compression) {
      if (typeof actaConfig.semantic_compression.enabled !== 'boolean') {
        errors.push({
          code: 'INVALID_ACTA_COMPRESSION_CONFIG',
          message: 'ACTA semantic compression enabled flag must be boolean',
          path: 'spec.acta_optimization.semantic_compression.enabled',
          severity: 'error'
        });
      }

      if (actaConfig.semantic_compression.target_reduction) {
        const reduction = actaConfig.semantic_compression.target_reduction;
        if (typeof reduction !== 'number' || reduction < 0 || reduction > 100) {
          errors.push({
            code: 'INVALID_ACTA_REDUCTION_TARGET',
            message: 'ACTA reduction target must be a number between 0 and 100',
            path: 'spec.acta_optimization.semantic_compression.target_reduction',
            severity: 'error'
          });
        }
      }
    }

    // Validate vector enhancement
    if (actaConfig.vector_enhancement && !actaConfig.vector_enhancement.provider) {
      warnings.push({
        code: 'MISSING_VECTOR_PROVIDER',
        message: 'Vector enhancement provider not specified',
        path: 'spec.acta_optimization.vector_enhancement.provider',
        recommendation: 'Specify vector database provider (e.g., qdrant, pinecone)'
      });
    }
  }

  /**
   * Validate Security and Compliance
   */
  private validateSecurityCompliance(spec: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    const security = spec.spec?.security;
    if (!security) {
      warnings.push({
        code: 'NO_SECURITY_CONFIG',
        message: 'Security configuration not specified',
        path: 'spec.security',
        recommendation: 'Define security requirements for production deployment'
      });
      return;
    }

    // Validate authentication methods
    if (security.authentication && Array.isArray(security.authentication)) {
      const validAuthMethods = ['api_key', 'oauth2', 'jwt', 'basic', 'none'];
      security.authentication.forEach((method: string, index: number) => {
        if (!validAuthMethods.includes(method)) {
          errors.push({
            code: 'INVALID_AUTH_METHOD',
            message: `Invalid authentication method '${method}'`,
            path: `spec.security.authentication[${index}]`,
            severity: 'error'
          });
        }
      });

      if (security.authentication.includes('none') && security.authentication.length > 1) {
        warnings.push({
          code: 'MIXED_AUTH_WITH_NONE',
          message: 'Mixed authentication methods including \'none\' may reduce security',
          path: 'spec.security.authentication',
          recommendation: 'Use specific authentication methods for production'
        });
      }
    }

    // Validate compliance frameworks
    if (spec.spec?.compliance_frameworks && Array.isArray(spec.spec.compliance_frameworks)) {
      const validFrameworks = ['ISO_42001', 'NIST_AI_RMF', 'EU_AI_ACT', 'SOC2', 'GDPR'];
      spec.spec.compliance_frameworks.forEach((framework: any, index: number) => {
        if (!framework.name || !validFrameworks.includes(framework.name)) {
          errors.push({
            code: 'INVALID_COMPLIANCE_FRAMEWORK',
            message: `Invalid compliance framework '${framework.name}'`,
            path: `spec.compliance_frameworks[${index}].name`,
            severity: 'error'
          });
        }

        if (!framework.level || !['planned', 'implementing', 'implemented', 'certified'].includes(framework.level)) {
          errors.push({
            code: 'INVALID_COMPLIANCE_LEVEL',
            message: `Invalid compliance level '${framework.level}'`,
            path: `spec.compliance_frameworks[${index}].level`,
            severity: 'error'
          });
        }
      });
    }
  }

  /**
   * Generate comprehensive validation report
   */
  generateValidationReport(results: ValidationResult[]): ValidationReport {
    const totalAgents = results.length;
    const validAgents = results.filter(r => r.valid).length;
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / totalAgents || 0;
    const avgTokenOptimization = results.reduce((sum, r) => sum + r.token_optimization_score, 0) / totalAgents || 0;

    const complianceCounts = results.reduce((counts, r) => {
      counts[r.compliance_level] = (counts[r.compliance_level] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const conformanceCounts = results.reduce((counts, r) => {
      counts[r.conformance_tier] = (counts[r.conformance_tier] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const feedbackLoopStats = {
      average_phase_coverage: results.reduce((sum, r) => sum + r.feedback_loop_validation.phase_coverage, 0) / totalAgents || 0,
      lifecycle_complete_agents: results.filter(r => r.feedback_loop_validation.lifecycle_completeness).length,
      common_coordination_patterns: this.extractCommonPatterns(results)
    };

    return {
      summary: {
        total_agents: totalAgents,
        valid_agents: validAgents,
        validation_rate: ((validAgents / totalAgents) * 100).toFixed(1) + '%',
        total_errors: totalErrors,
        total_warnings: totalWarnings,
        average_score: parseFloat(avgScore.toFixed(1)),
        average_token_optimization: parseFloat(avgTokenOptimization.toFixed(1))
      },
      compliance_breakdown: complianceCounts,
      conformance_breakdown: conformanceCounts,
      feedback_loop_stats: feedbackLoopStats,
      ossa_version: this.config.ossaVersion || this.OSSA_VERSION,
      validation_timestamp: new Date().toISOString()
    };
  }

  private extractCommonPatterns(results: ValidationResult[]): string[] {
    const patternCounts = new Map<string, number>();
    
    results.forEach(result => {
      result.feedback_loop_validation.coordination_patterns.forEach(pattern => {
        patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
      });
    });

    return Array.from(patternCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([pattern]) => pattern);
  }
}

export interface ValidationReport {
  summary: {
    total_agents: number;
    valid_agents: number;
    validation_rate: string;
    total_errors: number;
    total_warnings: number;
    average_score: number;
    average_token_optimization: number;
  };
  compliance_breakdown: Record<string, number>;
  conformance_breakdown: Record<string, number>;
  feedback_loop_stats: {
    average_phase_coverage: number;
    lifecycle_complete_agents: number;
    common_coordination_patterns: string[];
  };
  ossa_version: string;
  validation_timestamp: string;
}

// Export the validator for backward compatibility
export const OAASValidator = OSSAValidator;

// Default validator instance with v0.1.8 configuration
export const defaultOSSAValidator = new OSSAValidator({
  ossaVersion: '0.1.8',
  enableFeedbackLoop: true,
  enableVortexValidation: true,
  enableActaValidation: true,
  strict: false,
  allowWarnings: true
});