/**
 * OAAS Validator
 * Validates translated agent configurations against OAAS standard
 */

import Ajv, { JSONSchemaType } from 'ajv';
import addFormats from 'ajv-formats';
import { OAASServiceConfig } from '../index.js';

export interface ValidationConfig {
  strictMode?: boolean;
  allowAdditionalProperties?: boolean;
  validateCapabilities?: boolean;
  validateCompliance?: boolean;
  customSchemas?: { [key: string]: any };
}

export interface ValidationResult {
  valid: boolean;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  score: number; // 0-100
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  compliance: ComplianceResult;
  performance: PerformanceMetrics;
}

export interface ValidationError {
  path: string;
  message: string;
  code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  fix_suggestion?: string;
}

export interface ValidationWarning {
  path: string;
  message: string;
  code: string;
  severity: 'low' | 'medium' | 'high';
  improvement?: string;
}

export interface ValidationSuggestion {
  path: string;
  message: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
  benefit: string;
}

export interface ComplianceResult {
  overall_compliant: boolean;
  compliance_score: number;
  frameworks: { [framework: string]: boolean };
  security: SecurityComplianceResult;
  performance: PerformanceComplianceResult;
  accessibility: AccessibilityComplianceResult;
}

export interface SecurityComplianceResult {
  compliant: boolean;
  score: number;
  issues: string[];
  recommendations: string[];
}

export interface PerformanceComplianceResult {
  compliant: boolean;
  score: number;
  token_efficiency: number;
  response_time_estimate: number;
  optimizations: string[];
}

export interface AccessibilityComplianceResult {
  compliant: boolean;
  score: number;
  issues: string[];
  improvements: string[];
}

export interface PerformanceMetrics {
  validation_time: number;
  schema_complexity: number;
  capability_count: number;
  estimated_token_usage: number;
}

export class OAASValidator {
  private ajv: Ajv;
  private baseSchema: any;
  private capabilitySchema: any;
  private frameworkSchemas: Map<string, any> = new Map();

  constructor(private config: ValidationConfig = {}) {
    this.ajv = new Ajv({ 
      allErrors: true,
      allowUnionTypes: true,
      strict: config.strictMode ?? true
    });
    
    addFormats(this.ajv);
    this.initializeSchemas();
  }

  /**
   * Validate single OAAS specification
   */
  async validate(oaasSpec: any): Promise<ValidationResult> {
    const startTime = Date.now();
    console.log('🔍 Validating OAAS specification...');

    const result: ValidationResult = {
      valid: true,
      level: 'bronze',
      score: 0,
      errors: [],
      warnings: [],
      suggestions: [],
      compliance: {
        overall_compliant: false,
        compliance_score: 0,
        frameworks: {},
        security: { compliant: false, score: 0, issues: [], recommendations: [] },
        performance: { compliant: false, score: 0, token_efficiency: 0, response_time_estimate: 0, optimizations: [] },
        accessibility: { compliant: false, score: 0, issues: [], improvements: [] }
      },
      performance: {
        validation_time: 0,
        schema_complexity: 0,
        capability_count: 0,
        estimated_token_usage: 0
      }
    };

    try {
      // 1. Basic schema validation
      const schemaValid = this.ajv.validate(this.baseSchema, oaasSpec);
      if (!schemaValid) {
        result.valid = false;
        result.errors.push(...this.convertAjvErrors(this.ajv.errors || []));
      }

      // 2. Structure validation
      this.validateStructure(oaasSpec, result);

      // 3. Capability validation
      if (this.config.validateCapabilities) {
        this.validateCapabilities(oaasSpec, result);
      }

      // 4. Framework compliance validation
      this.validateFrameworkCompliance(oaasSpec, result);

      // 5. Security validation
      this.validateSecurity(oaasSpec, result);

      // 6. Performance validation
      this.validatePerformance(oaasSpec, result);

      // 7. Accessibility validation
      this.validateAccessibility(oaasSpec, result);

      // 8. Calculate overall score and level
      result.score = this.calculateScore(result);
      result.level = this.determineLevel(result.score);
      result.compliance.overall_compliant = result.level !== 'bronze' || result.errors.length === 0;
      result.compliance.compliance_score = result.score;

      // 9. Performance metrics
      result.performance.validation_time = Date.now() - startTime;
      result.performance.capability_count = oaasSpec.spec?.capabilities?.length || 0;
      result.performance.estimated_token_usage = this.estimateTokenUsage(oaasSpec);
      result.performance.schema_complexity = this.calculateSchemaComplexity(oaasSpec);

    } catch (error) {
      result.valid = false;
      result.errors.push({
        path: 'root',
        message: `Validation failed: ${error.message}`,
        code: 'VALIDATION_ERROR',
        severity: 'critical',
        fix_suggestion: 'Check the OAAS specification format'
      });
    }

    console.log(`✅ Validation complete: ${result.valid ? 'VALID' : 'INVALID'} (${result.level}, ${result.score}/100)`);
    return result;
  }

  /**
   * Validate multiple OAAS specifications
   */
  async validateMultiple(specs: any[]): Promise<ValidationResult[]> {
    console.log(`🔍 Validating ${specs.length} OAAS specifications...`);
    
    const results = await Promise.all(
      specs.map(spec => this.validate(spec))
    );

    const validCount = results.filter(r => r.valid).length;
    console.log(`📊 Batch validation complete: ${validCount}/${specs.length} valid`);

    return results;
  }

  /**
   * Get validation summary for multiple results
   */
  getValidationSummary(results: ValidationResult[]): any {
    const summary = {
      total_specs: results.length,
      valid_specs: results.filter(r => r.valid).length,
      invalid_specs: results.filter(r => !r.valid).length,
      average_score: results.reduce((sum, r) => sum + r.score, 0) / results.length,
      level_distribution: {
        bronze: results.filter(r => r.level === 'bronze').length,
        silver: results.filter(r => r.level === 'silver').length,
        gold: results.filter(r => r.level === 'gold').length,
        platinum: results.filter(r => r.level === 'platinum').length
      },
      common_errors: this.getCommonErrors(results),
      common_warnings: this.getCommonWarnings(results),
      performance_metrics: {
        avg_validation_time: results.reduce((sum, r) => sum + r.performance.validation_time, 0) / results.length,
        total_capabilities: results.reduce((sum, r) => sum + r.performance.capability_count, 0),
        estimated_total_tokens: results.reduce((sum, r) => sum + r.performance.estimated_token_usage, 0)
      }
    };

    return summary;
  }

  // Private validation methods

  private initializeSchemas(): void {
    // Base OAAS schema
    this.baseSchema = {
      type: 'object',
      required: ['apiVersion', 'kind', 'metadata', 'spec'],
      properties: {
        apiVersion: {
          type: 'string',
          pattern: '^openapi-ai-agents/v[0-9]+\\.[0-9]+\\.[0-9]+$'
        },
        kind: {
          type: 'string',
          enum: ['Agent', 'Workspace', 'AgentGroup']
        },
        metadata: {
          type: 'object',
          required: ['name', 'version'],
          properties: {
            name: {
              type: 'string',
              pattern: '^[a-z0-9-]+$',
              minLength: 3,
              maxLength: 50
            },
            version: {
              type: 'string',
              pattern: '^[0-9]+\\.[0-9]+\\.[0-9]+$'
            },
            description: { type: 'string', maxLength: 1000 },
            annotations: { type: 'object' },
            labels: { type: 'object' }
          },
          additionalProperties: this.config.allowAdditionalProperties ?? true
        },
        spec: {
          type: 'object',
          required: ['agent'],
          properties: {
            agent: {
              type: 'object',
              required: ['name', 'expertise'],
              properties: {
                name: { type: 'string', minLength: 1, maxLength: 100 },
                expertise: { type: 'string', minLength: 1, maxLength: 500 }
              }
            },
            capabilities: {
              type: 'array',
              items: { $ref: '#/definitions/capability' }
            },
            protocols: { type: 'object' },
            frameworks: { type: 'object' },
            data: { type: 'object' }
          },
          additionalProperties: this.config.allowAdditionalProperties ?? true
        }
      },
      definitions: {
        capability: {
          type: 'object',
          required: ['name', 'description'],
          properties: {
            name: { 
              type: 'string', 
              pattern: '^[a-z0-9_]+$',
              minLength: 1,
              maxLength: 100
            },
            description: { type: 'string', minLength: 1, maxLength: 500 },
            input_schema: { type: 'object' },
            output_schema: { type: 'object' },
            frameworks: {
              type: 'array',
              items: { type: 'string' }
            },
            compliance: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      },
      additionalProperties: this.config.allowAdditionalProperties ?? true
    };

    // Add custom schemas if provided
    if (this.config.customSchemas) {
      Object.entries(this.config.customSchemas).forEach(([name, schema]) => {
        this.ajv.addSchema(schema, name);
      });
    }
  }

  private validateStructure(spec: any, result: ValidationResult): void {
    // Check required top-level fields
    if (!spec.apiVersion) {
      result.errors.push({
        path: 'apiVersion',
        message: 'Missing required field: apiVersion',
        code: 'MISSING_API_VERSION',
        severity: 'critical',
        fix_suggestion: 'Add apiVersion field (e.g., "openapi-ai-agents/v0.1.1")'
      });
    }

    if (!spec.kind) {
      result.errors.push({
        path: 'kind',
        message: 'Missing required field: kind',
        code: 'MISSING_KIND',
        severity: 'critical',
        fix_suggestion: 'Add kind field (should be "Agent")'
      });
    }

    // Check metadata structure
    if (!spec.metadata?.name) {
      result.errors.push({
        path: 'metadata.name',
        message: 'Missing required field: metadata.name',
        code: 'MISSING_NAME',
        severity: 'critical',
        fix_suggestion: 'Add name field in kebab-case format'
      });
    }

    if (!spec.metadata?.version) {
      result.errors.push({
        path: 'metadata.version',
        message: 'Missing required field: metadata.version',
        code: 'MISSING_VERSION',
        severity: 'high',
        fix_suggestion: 'Add version field in semantic versioning format (x.y.z)'
      });
    }

    // Check agent specification
    if (!spec.spec?.agent?.name) {
      result.warnings.push({
        path: 'spec.agent.name',
        message: 'Missing agent name',
        code: 'MISSING_AGENT_NAME',
        severity: 'medium',
        improvement: 'Add descriptive agent name'
      });
    }

    if (!spec.spec?.agent?.expertise) {
      result.warnings.push({
        path: 'spec.agent.expertise',
        message: 'Missing agent expertise description',
        code: 'MISSING_EXPERTISE',
        severity: 'medium',
        improvement: 'Add detailed expertise description'
      });
    }
  }

  private validateCapabilities(spec: any, result: ValidationResult): void {
    const capabilities = spec.spec?.capabilities;
    
    if (!capabilities || !Array.isArray(capabilities)) {
      result.warnings.push({
        path: 'spec.capabilities',
        message: 'No capabilities defined',
        code: 'NO_CAPABILITIES',
        severity: 'high',
        improvement: 'Define at least one capability'
      });
      return;
    }

    capabilities.forEach((capability: any, index: number) => {
      const path = `spec.capabilities[${index}]`;
      
      if (!capability.name) {
        result.errors.push({
          path: `${path}.name`,
          message: 'Capability missing required name field',
          code: 'MISSING_CAPABILITY_NAME',
          severity: 'high',
          fix_suggestion: 'Add unique name in snake_case format'
        });
      }

      if (!capability.description) {
        result.warnings.push({
          path: `${path}.description`,
          message: 'Capability missing description',
          code: 'MISSING_CAPABILITY_DESCRIPTION',
          severity: 'medium',
          improvement: 'Add clear description of what this capability does'
        });
      }

      if (!capability.frameworks || !Array.isArray(capability.frameworks)) {
        result.suggestions.push({
          path: `${path}.frameworks`,
          message: 'Capability should specify supported frameworks',
          action: 'Add frameworks array',
          priority: 'medium',
          benefit: 'Improves framework interoperability'
        });
      }

      if (!capability.input_schema) {
        result.suggestions.push({
          path: `${path}.input_schema`,
          message: 'Consider adding input schema for better validation',
          action: 'Add JSON schema for inputs',
          priority: 'low',
          benefit: 'Enables better input validation and documentation'
        });
      }
    });
  }

  private validateFrameworkCompliance(spec: any, result: ValidationResult): void {
    const frameworks = spec.spec?.frameworks || {};
    const protocols = spec.spec?.protocols || {};
    
    result.compliance.frameworks = {};

    // Check MCP compliance
    if (frameworks.mcp?.enabled) {
      result.compliance.frameworks.mcp = this.validateMCPCompliance(spec);
    }

    // Check LangChain compliance  
    if (frameworks.langchain?.enabled) {
      result.compliance.frameworks.langchain = this.validateLangChainCompliance(spec);
    }

    // Check CrewAI compliance
    if (frameworks.crewai?.enabled) {
      result.compliance.frameworks.crewai = this.validateCrewAICompliance(spec);
    }

    // Check OpenAI compliance
    if (frameworks.openai?.enabled) {
      result.compliance.frameworks.openai = this.validateOpenAICompliance(spec);
    }
  }

  private validateSecurity(spec: any, result: ValidationResult): void {
    const security = result.compliance.security;
    let securityScore = 100;

    // Check for sensitive data in specification
    const specString = JSON.stringify(spec).toLowerCase();
    
    const sensitivePatterns = [
      /api[_-]?key/,
      /secret/,
      /password/,
      /token/,
      /credential/
    ];

    sensitivePatterns.forEach(pattern => {
      if (pattern.test(specString)) {
        security.issues.push(`Potential sensitive data detected: ${pattern.source}`);
        security.recommendations.push('Remove sensitive data from specification');
        securityScore -= 20;
      }
    });

    // Check authentication requirements
    if (!spec.spec?.protocols?.authentication) {
      security.recommendations.push('Consider adding authentication requirements');
      securityScore -= 10;
    }

    // Check HTTPS enforcement
    const servers = spec.spec?.api?.servers || [];
    servers.forEach((server: any) => {
      if (server.url && !server.url.startsWith('https://')) {
        security.issues.push(`Non-HTTPS server URL: ${server.url}`);
        security.recommendations.push('Use HTTPS for all server URLs');
        securityScore -= 15;
      }
    });

    security.score = Math.max(0, securityScore);
    security.compliant = security.score >= 80;
  }

  private validatePerformance(spec: any, result: ValidationResult): void {
    const performance = result.compliance.performance;
    let performanceScore = 100;

    // Estimate token usage
    const tokenUsage = this.estimateTokenUsage(spec);
    performance.token_efficiency = Math.max(0, 100 - (tokenUsage / 1000) * 10);
    
    if (tokenUsage > 2000) {
      performance.optimizations.push('Consider reducing specification size to improve token efficiency');
      performanceScore -= 15;
    }

    // Check capability count
    const capabilityCount = spec.spec?.capabilities?.length || 0;
    if (capabilityCount > 20) {
      performance.optimizations.push('Large number of capabilities may impact performance');
      performanceScore -= 10;
    }

    // Estimate response time (simplified)
    performance.response_time_estimate = capabilityCount * 100 + tokenUsage * 0.1;

    if (performance.response_time_estimate > 5000) {
      performance.optimizations.push('High response time estimate - consider optimizing');
      performanceScore -= 20;
    }

    performance.score = Math.max(0, performanceScore);
    performance.compliant = performance.score >= 70;
  }

  private validateAccessibility(spec: any, result: ValidationResult): void {
    const accessibility = result.compliance.accessibility;
    let accessibilityScore = 100;

    // Check for descriptive names and descriptions
    if (!spec.metadata?.description) {
      accessibility.issues.push('Missing agent description');
      accessibility.improvements.push('Add clear description for better discoverability');
      accessibilityScore -= 20;
    }

    // Check capability descriptions
    const capabilities = spec.spec?.capabilities || [];
    const missingDescriptions = capabilities.filter((cap: any) => !cap.description).length;
    
    if (missingDescriptions > 0) {
      accessibility.issues.push(`${missingDescriptions} capabilities missing descriptions`);
      accessibility.improvements.push('Add descriptions to all capabilities');
      accessibilityScore -= missingDescriptions * 5;
    }

    // Check for examples
    const hasExamples = spec.spec?.data?.examples || 
                       capabilities.some((cap: any) => cap.examples);
    
    if (!hasExamples) {
      accessibility.improvements.push('Consider adding usage examples');
      accessibilityScore -= 10;
    }

    accessibility.score = Math.max(0, accessibilityScore);
    accessibility.compliant = accessibility.score >= 80;
  }

  private validateMCPCompliance(spec: any): boolean {
    const mcpConfig = spec.spec?.protocols?.mcp;
    return !!(mcpConfig && mcpConfig.enabled);
  }

  private validateLangChainCompliance(spec: any): boolean {
    const langchainConfig = spec.spec?.frameworks?.langchain;
    return !!(langchainConfig && langchainConfig.enabled);
  }

  private validateCrewAICompliance(spec: any): boolean {
    const crewaiConfig = spec.spec?.frameworks?.crewai;
    return !!(crewaiConfig && crewaiConfig.enabled);
  }

  private validateOpenAICompliance(spec: any): boolean {
    const openaiConfig = spec.spec?.frameworks?.openai;
    return !!(openaiConfig && openaiConfig.enabled);
  }

  private calculateScore(result: ValidationResult): number {
    let score = 100;

    // Deduct for errors
    result.errors.forEach(error => {
      switch (error.severity) {
        case 'critical': score -= 25; break;
        case 'high': score -= 15; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    });

    // Deduct for warnings
    result.warnings.forEach(warning => {
      switch (warning.severity) {
        case 'high': score -= 10; break;
        case 'medium': score -= 5; break;
        case 'low': score -= 2; break;
      }
    });

    // Bonus for compliance
    const complianceBonus = (
      (result.compliance.security.compliant ? 5 : 0) +
      (result.compliance.performance.compliant ? 5 : 0) +
      (result.compliance.accessibility.compliant ? 5 : 0)
    );

    return Math.max(0, Math.min(100, score + complianceBonus));
  }

  private determineLevel(score: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
    if (score >= 95) return 'platinum';
    if (score >= 85) return 'gold';
    if (score >= 70) return 'silver';
    return 'bronze';
  }

  private estimateTokenUsage(spec: any): number {
    const specString = JSON.stringify(spec);
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(specString.length / 4);
  }

  private calculateSchemaComplexity(spec: any): number {
    const capabilities = spec.spec?.capabilities || [];
    const frameworks = Object.keys(spec.spec?.frameworks || {}).length;
    const protocols = Object.keys(spec.spec?.protocols || {}).length;
    
    return capabilities.length + frameworks + protocols;
  }

  private convertAjvErrors(ajvErrors: any[]): ValidationError[] {
    return ajvErrors.map(error => ({
      path: error.instancePath || error.schemaPath || 'root',
      message: error.message || 'Validation error',
      code: error.keyword?.toUpperCase() || 'VALIDATION_ERROR',
      severity: 'high' as const,
      fix_suggestion: this.getFixSuggestion(error)
    }));
  }

  private getFixSuggestion(error: any): string {
    const suggestions: { [key: string]: string } = {
      'required': `Add required property: ${error.params?.missingProperty || 'unknown'}`,
      'additionalProperties': 'Remove additional properties or set allowAdditionalProperties to true',
      'type': `Expected ${error.schema} but got ${typeof error.data}`,
      'pattern': `Value should match pattern: ${error.schema}`,
      'enum': `Value should be one of: ${error.schema?.join(', ')}`
    };

    return suggestions[error.keyword] || 'Check the specification format';
  }

  private getCommonErrors(results: ValidationResult[]): any[] {
    const errorCounts: { [key: string]: number } = {};
    
    results.forEach(result => {
      result.errors.forEach(error => {
        errorCounts[error.code] = (errorCounts[error.code] || 0) + 1;
      });
    });

    return Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([code, count]) => ({ code, count }));
  }

  private getCommonWarnings(results: ValidationResult[]): any[] {
    const warningCounts: { [key: string]: number } = {};
    
    results.forEach(result => {
      result.warnings.forEach(warning => {
        warningCounts[warning.code] = (warningCounts[warning.code] || 0) + 1;
      });
    });

    return Object.entries(warningCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([code, count]) => ({ code, count }));
  }
}