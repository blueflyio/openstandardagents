const yaml = require('js-yaml');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

class ComplianceValidator {
  constructor() {
    this.supportedFrameworks = [
      'ISO_42001_2023', 'NIST_AI_RMF_1_0', 'EU_AI_Act', 
      'FISMA', 'FedRAMP', 'StateRAMP', 'SOC2', 'GDPR', 'CCPA'
    ];
    
    // Initialize JSON Schema validator for compliance schemas
    this.ajv = new Ajv({ allErrors: true, verbose: true });
    addFormats(this.ajv);
    
    // Load compliance schemas
    this.complianceSchemas = this.loadComplianceSchemas();
  }

  loadComplianceSchemas() {
    return {
      'ISO_42001_2023': {
        type: 'object',
        required: ['governance', 'risk_management', 'data_quality', 'monitoring'],
        properties: {
          governance: {
            type: 'object',
            required: ['policies', 'roles', 'accountability'],
            properties: {
              policies: { type: 'array', items: { type: 'string' } },
              roles: { type: 'array', items: { type: 'string' } },
              accountability: { type: 'string' }
            }
          },
          risk_management: {
            type: 'object',
            required: ['assessment', 'mitigation', 'monitoring'],
            properties: {
              assessment: { type: 'string' },
              mitigation: { type: 'array', items: { type: 'string' } },
              monitoring: { type: 'string' }
            }
          },
          data_quality: {
            type: 'object',
            required: ['validation', 'cleansing', 'monitoring'],
            properties: {
              validation: { type: 'string' },
              cleansing: { type: 'string' },
              monitoring: { type: 'string' }
            }
          },
          monitoring: {
            type: 'object',
            required: ['metrics', 'alerts', 'reporting'],
            properties: {
              metrics: { type: 'array', items: { type: 'string' } },
              alerts: { type: 'array', items: { type: 'string' } },
              reporting: { type: 'string' }
            }
          }
        }
      },
      'NIST_AI_RMF_1_0': {
        type: 'object',
        required: ['govern', 'map', 'measure', 'manage'],
        properties: {
          govern: {
            type: 'object',
            required: ['policies', 'roles', 'oversight'],
            properties: {
              policies: { type: 'array', items: { type: 'string' } },
              roles: { type: 'array', items: { type: 'string' } },
              oversight: { type: 'string' }
            }
          },
          map: {
            type: 'object',
            required: ['context', 'risk_categories', 'threat_analysis'],
            properties: {
              context: { type: 'string' },
              risk_categories: { type: 'array', items: { type: 'string' } },
              threat_analysis: { type: 'string' }
            }
          },
          measure: {
            type: 'object',
            required: ['metrics', 'baselines', 'thresholds'],
            properties: {
              metrics: { type: 'array', items: { type: 'string' } },
              baselines: { type: 'string' },
              thresholds: { type: 'string' }
            }
          },
          manage: {
            type: 'object',
            required: ['response_plan', 'communication', 'review'],
            properties: {
              response_plan: { type: 'string' },
              communication: { type: 'string' },
              review: { type: 'string' }
            }
          }
        }
      },
      'EU_AI_Act': {
        type: 'object',
        required: ['risk_classification', 'transparency', 'human_oversight'],
        properties: {
          risk_classification: {
            type: 'string',
            enum: ['unacceptable', 'high', 'limited', 'minimal']
          },
          transparency: {
            type: 'object',
            required: ['documentation', 'user_information'],
            properties: {
              documentation: { type: 'string' },
              user_information: { type: 'string' }
            }
          },
          human_oversight: {
            type: 'object',
            required: ['human_in_loop', 'override_capability'],
            properties: {
              human_in_loop: { type: 'boolean' },
              override_capability: { type: 'boolean' }
            }
          }
        }
      }
    };
  }

  async validateCompliance(agentConfig, frameworks) {
    const results = {
      valid: true,
      authorization_readiness: 'basic',
      totalErrors: 0,
      totalWarnings: 0,
      framework_results: {},
      compliance_score: 0,
      certification_level: 'none',
      next_steps: []
    };

    for (const framework of frameworks) {
      if (!this.supportedFrameworks.includes(framework)) {
        results.totalErrors++;
        results.valid = false;
        results.framework_results[framework] = {
          valid: false,
          errors: [`Unsupported framework: ${framework}`],
          warnings: [],
          passed: [],
          score: 0
        };
        continue;
      }

      const frameworkResult = await this.validateFramework(agentConfig, framework);
      results.framework_results[framework] = frameworkResult;
      results.totalErrors += frameworkResult.errors?.length || 0;
      results.totalWarnings += frameworkResult.warnings?.length || 0;
      
      if (!frameworkResult.valid) {
        results.valid = false;
      }
    }

    // Calculate compliance score and certification level
    results.compliance_score = this.calculateComplianceScore(results.framework_results);
    results.certification_level = this.determineCertificationLevel(results.compliance_score);
    results.authorization_readiness = this.determineAuthorizationReadiness(results);
    results.next_steps = this.generateNextSteps(results);

    return results;
  }

  async validateFramework(agentConfig, framework) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      passed: [],
      score: 0,
      requirements_met: 0,
      total_requirements: 0
    };

    try {
      switch (framework) {
        case 'ISO_42001_2023':
          result = await this.validateISO42001(agentConfig, result);
          break;
        case 'NIST_AI_RMF_1_0':
          result = await this.validateNISTAIRMF(agentConfig, result);
          break;
        case 'EU_AI_Act':
          result = await this.validateEUAIAct(agentConfig, result);
          break;
        case 'FISMA':
          result = await this.validateFISMA(agentConfig, result);
          break;
        case 'FedRAMP':
          result = await this.validateFedRAMP(agentConfig, result);
          break;
        case 'SOC2':
          result = await this.validateSOC2(agentConfig, result);
          break;
        default:
          result.warnings.push(`Basic validation for ${framework}`);
      }

      // Calculate framework-specific score
      result.score = this.calculateFrameworkScore(result);
      result.valid = result.errors.length === 0 && result.score >= 70;
      
    } catch (error) {
      result.errors.push(`Validation error for ${framework}: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  async validateISO42001(agentConfig, result) {
    const schema = this.complianceSchemas['ISO_42001_2023'];
    const valid = this.ajv.validate(schema, agentConfig);
    
    if (!valid) {
      result.errors.push(...this.ajv.errors.map(e => `ISO 42001: ${e.message}`));
    } else {
      result.passed.push('✅ ISO 42001:2023 schema validation passed');
    }

    // Additional business logic validation
    if (agentConfig.governance?.policies?.length < 3) {
      result.warnings.push('ISO 42001: At least 3 governance policies recommended');
    }
    
    if (agentConfig.risk_management?.mitigation?.length < 2) {
      result.warnings.push('ISO 42001: Multiple risk mitigation strategies recommended');
    }

    if (agentConfig.monitoring?.metrics?.length < 5) {
      result.warnings.push('ISO 42001: Comprehensive monitoring metrics recommended');
    }

    result.requirements_met = this.countRequirementsMet(agentConfig, schema);
    result.total_requirements = this.countTotalRequirements(schema);
  }

  async validateNISTAIRMF(agentConfig, result) {
    const schema = this.complianceSchemas['NIST_AI_RMF_1_0'];
    const valid = this.ajv.validate(schema, agentConfig);
    
    if (!valid) {
      result.errors.push(...this.ajv.errors.map(e => `NIST AI RMF: ${e.message}`));
    } else {
      result.passed.push('✅ NIST AI RMF 1.0 schema validation passed');
    }

    // NIST-specific validations
    if (!agentConfig.map?.threat_analysis?.includes('adversarial')) {
      result.warnings.push('NIST AI RMF: Adversarial threat analysis recommended');
    }

    if (!agentConfig.measure?.metrics?.includes('bias_detection')) {
      result.warnings.push('NIST AI RMF: Bias detection metrics recommended');
    }

    if (!agentConfig.manage?.response_plan?.includes('incident_response')) {
      result.warnings.push('NIST AI RMF: Incident response plan recommended');
    }

    result.requirements_met = this.countRequirementsMet(agentConfig, schema);
    result.total_requirements = this.countTotalRequirements(schema);
  }

  async validateEUAIAct(agentConfig, result) {
    const schema = this.complianceSchemas['EU_AI_Act'];
    const valid = this.ajv.validate(schema, agentConfig);
    
    if (!valid) {
      result.errors.push(...this.ajv.errors.map(e => `EU AI Act: ${e.message}`));
    } else {
      result.passed.push('✅ EU AI Act schema validation passed');
    }

    // EU AI Act specific validations
    if (agentConfig.risk_classification === 'high' && !agentConfig.human_oversight?.human_in_loop) {
      result.errors.push('EU AI Act: High-risk AI systems require human-in-the-loop oversight');
    }

    if (!agentConfig.transparency?.documentation?.includes('training_data')) {
      result.warnings.push('EU AI Act: Training data documentation recommended');
    }

    result.requirements_met = this.countRequirementsMet(agentConfig, schema);
    result.total_requirements = this.countTotalRequirements(schema);
  }

  async validateFISMA(agentConfig, result) {
    // FISMA validation logic
    if (!agentConfig.security?.access_control) {
      result.errors.push('FISMA: Access control mechanisms required');
    }
    
    if (!agentConfig.security?.audit_logging) {
      result.errors.push('FISMA: Comprehensive audit logging required');
    }

    if (!agentConfig.security?.incident_response) {
      result.warnings.push('FISMA: Incident response procedures recommended');
    }

    result.passed.push('✅ FISMA basic validation completed');
  }

  async validateFedRAMP(agentConfig, result) {
    // FedRAMP validation logic
    if (!agentConfig.security?.multi_factor_auth) {
      result.errors.push('FedRAMP: Multi-factor authentication required');
    }
    
    if (!agentConfig.security?.encryption_at_rest) {
      result.errors.push('FedRAMP: Encryption at rest required');
    }

    if (!agentConfig.security?.continuous_monitoring) {
      result.warnings.push('FedRAMP: Continuous monitoring recommended');
    }

    result.passed.push('✅ FedRAMP basic validation completed');
  }

  async validateSOC2(agentConfig, result) {
    // SOC2 validation logic
    if (!agentConfig.security?.data_governance) {
      result.warnings.push('SOC2: Data governance framework recommended');
    }
    
    if (!agentConfig.security?.vendor_management) {
      result.warnings.push('SOC2: Vendor management processes recommended');
    }

    result.passed.push('✅ SOC2 basic validation completed');
  }

  countRequirementsMet(agentConfig, schema) {
    // Count how many required fields are present and valid
    let count = 0;
    const required = schema.required || [];
    
    for (const field of required) {
      if (agentConfig[field] !== undefined && agentConfig[field] !== null) {
        count++;
      }
    }
    
    return count;
  }

  countTotalRequirements(schema) {
    return (schema.required || []).length;
  }

  calculateFrameworkScore(result) {
    if (result.total_requirements === 0) return 100;
    
    const baseScore = (result.requirements_met / result.total_requirements) * 100;
    const errorPenalty = result.errors.length * 10;
    const warningPenalty = result.warnings.length * 2;
    
    return Math.max(0, Math.round(baseScore - errorPenalty - warningPenalty));
  }

  calculateComplianceScore(frameworkResults) {
    const frameworks = Object.keys(frameworkResults);
    if (frameworks.length === 0) return 0;
    
    const totalScore = frameworks.reduce((sum, framework) => {
      return sum + (frameworkResults[framework].score || 0);
    }, 0);
    
    return Math.round(totalScore / frameworks.length);
  }

  determineCertificationLevel(score) {
    if (score >= 95) return 'platinum';
    if (score >= 90) return 'gold';
    if (score >= 80) return 'silver';
    if (score >= 70) return 'bronze';
    return 'none';
  }

  determineAuthorizationReadiness(results) {
    if (results.compliance_score >= 95 && results.totalErrors === 0) return 'production';
    if (results.compliance_score >= 80 && results.totalErrors === 0) return 'staging';
    if (results.compliance_score >= 70) return 'development';
    return 'not_ready';
  }

  generateNextSteps(results) {
    const steps = [];
    
    if (results.totalErrors > 0) {
      steps.push('Fix all validation errors before proceeding');
    }
    
    if (results.compliance_score < 80) {
      steps.push('Improve compliance score to at least 80% for staging deployment');
    }
    
    if (results.compliance_score < 95) {
      steps.push('Achieve 95%+ compliance score for production deployment');
    }
    
    if (results.totalWarnings > 5) {
      steps.push('Address critical warnings to improve compliance posture');
    }
    
    return steps;
  }
}

module.exports = ComplianceValidator;