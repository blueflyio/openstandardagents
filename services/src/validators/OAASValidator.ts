/**
 * OAAS Validator
 * Validates agent specifications against OAAS standards
 */

export interface ValidationConfig {
  strict?: boolean;
  allowWarnings?: boolean;
  customRules?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number;
  compliance_level: 'none' | 'basic' | 'standard' | 'advanced' | 'enterprise';
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

export class OAASValidator {
  constructor(private config: ValidationConfig = {}) {}

  /**
   * Validate single agent specification
   */
  async validate(agentSpec: any): Promise<ValidationResult> {
    console.log(`✅ Validating agent specification...`);

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Basic structure validation
    this.validateBasicStructure(agentSpec, errors, warnings);
    
    // Metadata validation
    this.validateMetadata(agentSpec, errors, warnings);
    
    // Spec validation
    this.validateSpec(agentSpec, errors, warnings);
    
    // Framework validation
    this.validateFrameworks(agentSpec, errors, warnings);

    const score = this.calculateValidationScore(errors, warnings);
    const compliance_level = this.determineComplianceLevel(score, errors.length);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      score,
      compliance_level
    };
  }

  /**
   * Validate multiple agents
   */
  async validateMultiple(agents: any[]): Promise<ValidationResult[]> {
    console.log(`✅ Validating ${agents.length} agent specifications...`);
    
    const results = await Promise.all(
      agents.map(agent => this.validate(agent.oaas_spec || agent))
    );

    const summary = this.generateValidationSummary(results);
    console.log(`📊 Validation Summary:`, summary);

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
}