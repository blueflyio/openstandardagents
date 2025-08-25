const yaml = require('js-yaml');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const path = require('path');

class DualFormatValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
    
    // Initialize JSON Schema validator
    this.ajv = new Ajv({ 
      allErrors: true, 
      verbose: true,
      strict: false,
      validateFormats: true
    });
    addFormats(this.ajv);
    
    // Enhanced Agent.yml schema for OpenAPI AI Agents Standard
    this.agentSchema = {
      type: 'object',
      required: ['apiVersion', 'kind', 'metadata', 'spec'],
      properties: {
        apiVersion: {
          type: 'string',
          enum: ['openapi-ai-agents/v0.1.0', 'openapi-ai-agents/v0.2.0']
        },
        kind: {
          type: 'string',
          enum: ['Agent', 'AgentGroup', 'AgentOrchestrator']
        },
        metadata: {
          type: 'object',
          required: ['name', 'version'],
          properties: {
            name: { 
              type: 'string',
              minLength: 1,
              maxLength: 63,
              pattern: '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'
            },
            version: { 
              type: 'string',
              pattern: '^\\d+\\.\\d+\\.\\d+(-[a-zA-Z0-9.-]+)?(\\+[a-zA-Z0-9.-]+)?$'
            },
            namespace: { type: 'string' },
            labels: { 
              type: 'object',
              additionalProperties: { type: 'string' }
            },
            annotations: {
              type: 'object',
              additionalProperties: { type: 'string' }
            }
          }
        },
        spec: {
          type: 'object',
          required: ['openapi_spec', 'capabilities'],
          properties: {
            openapi_spec: { 
              type: 'string',
              pattern: '^(\\./|\\.\\./|https?://|/).*\\.(yaml|yml|json)$'
            },
            capabilities: {
              type: 'array',
              items: { 
                type: 'string',
                enum: [
                  'universal_agent_interface',
                  'protocol_bridging',
                  'token_optimization',
                  'compliance_validation',
                  'multi_agent_orchestration',
                  'security_assessment',
                  'bias_detection',
                  'explainability',
                  'audit_logging',
                  'performance_monitoring'
                ]
              },
              minItems: 1
            },
            protocols: {
              type: 'array',
              items: { 
                type: 'string',
                enum: ['openapi', 'mcp', 'a2a', 'aitp', 'grpc', 'graphql']
              }
            },
            security: {
              type: 'object',
              properties: {
                authentication: { type: 'string' },
                authorization: { type: 'string' },
                encryption: { type: 'string' },
                audit_logging: { type: 'boolean' }
              }
            },
            governance: {
              type: 'object',
              properties: {
                policies: { type: 'array', items: { type: 'string' } },
                roles: { type: 'array', items: { type: 'string' } },
                accountability: { type: 'string' }
              }
            },
            risk_management: {
              type: 'object',
              properties: {
                assessment: { type: 'string' },
                mitigation: { type: 'array', items: { type: 'string' } },
                monitoring: { type: 'string' }
              }
            },
            data_quality: {
              type: 'object',
              properties: {
                validation: { type: 'string' },
                cleansing: { type: 'string' },
                monitoring: { type: 'string' }
              }
            },
            monitoring: {
              type: 'object',
              properties: {
                metrics: { type: 'array', items: { type: 'string' } },
                alerts: { type: 'array', items: { type: 'string' } },
                reporting: { type: 'string' }
              }
            }
          }
        }
      }
    };
    
    // Enhanced OpenAPI 3.1.0 schema validation
    this.openApiSchema = {
      type: 'object',
      required: ['openapi', 'info', 'paths'],
      properties: {
        openapi: {
          type: 'string',
          pattern: '^3\\.(0|1)\\.\\d+$'
        },
        info: {
          type: 'object',
          required: ['title', 'version'],
          properties: {
            title: { 
              type: 'string',
              minLength: 1,
              maxLength: 200
            },
            version: { 
              type: 'string',
              pattern: '^\\d+\\.\\d+\\.\\d+(-[a-zA-Z0-9.-]+)?(\\+[a-zA-Z0-9.-]+)?$'
            },
            description: { type: 'string' },
            contact: { type: 'object' },
            license: { type: 'object' }
          }
        },
        servers: {
          type: 'array',
          items: {
            type: 'object',
            required: ['url'],
            properties: {
              url: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        paths: { 
          type: 'object',
          minProperties: 1
        },
        components: { type: 'object' },
        security: { 
          type: 'array',
          items: { type: 'object' }
        },
        tags: { 
          type: 'array',
          items: { type: 'object' }
        }
      }
    };

    // Agent-specific OpenAPI extensions schema
    this.agentExtensionsSchema = {
      type: 'object',
      properties: {
        'x-agent-metadata': {
          type: 'object',
          properties: {
            class: {
              type: 'string',
              enum: ['specialist', 'generalist', 'orchestrator', 'coordinator']
            },
            certification_level: {
              type: 'string',
              enum: ['bronze', 'silver', 'gold', 'platinum']
            },
            protocols: {
              type: 'array',
              items: { type: 'string' }
            },
            capabilities: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        'x-token-estimate': {
          type: 'number',
          minimum: 0
        },
        'x-security-level': {
          type: 'string',
          enum: ['basic', 'enhanced', 'enterprise', 'government']
        }
      }
    };
  }

  async validateDualFormat(agentConfig, openApiSpec) {
    this.errors = [];
    this.warnings = [];
    this.passed = [];

    try {
      // Step 1: Validate individual formats
      const agentValidation = await this.validateAgentConfig(agentConfig);
      const openApiValidation = await this.validateOpenApiSpec(openApiSpec);
      
      // Step 2: Cross-format validation
      const crossValidation = await this.validateCrossFormatConsistency(agentConfig, openApiSpec);
      
      // Step 3: Security and compliance validation
      const securityValidation = await this.validateSecurityCompliance(agentConfig, openApiSpec);
      
      // Step 4: Determine overall certification level
      const certificationLevel = this.determineCertificationLevel();
      
      // Step 5: Generate comprehensive report
      const report = this.generateValidationReport({
        agentValidation,
        openApiValidation,
        crossValidation,
        securityValidation,
        certificationLevel
      });

      return report;

    } catch (error) {
      this.errors.push(`Validation failed: ${error.message}`);
      return {
        valid: false,
        certification_level: 'none',
        errors: this.errors,
        warnings: this.warnings,
        passed: this.passed,
        score: 0
      };
    }
  }

  async validateAgentConfig(agentConfig) {
    const result = {
      valid: false,
      errors: [],
      warnings: [],
      passed: [],
      score: 0
    };

    try {
      // Schema validation
      const valid = this.ajv.validate(this.agentSchema, agentConfig);
      
      if (!valid) {
        result.errors.push(...this.ajv.errors.map(e => `Agent config: ${e.message}`));
      } else {
        result.passed.push('✅ Agent configuration schema validation passed');
      }

      // Business logic validation
      const businessValidation = this.validateAgentBusinessLogic(agentConfig);
      result.errors.push(...businessValidation.errors);
      result.warnings.push(...businessValidation.warnings);
      result.passed.push(...businessValidation.passed);

      // Calculate score
      result.score = this.calculateAgentScore(result);
      result.valid = result.errors.length === 0 && result.score >= 70;

    } catch (error) {
      result.errors.push(`Agent config validation error: ${error.message}`);
    }

    return result;
  }

  async validateOpenApiSpec(openApiSpec) {
    const result = {
      valid: false,
      errors: [],
      warnings: [],
      passed: [],
      score: 0
    };

    try {
      // Basic schema validation
      const valid = this.ajv.validate(this.openApiSchema, openApiSpec);
      
      if (!valid) {
        result.errors.push(...this.ajv.errors.map(e => `OpenAPI: ${e.message}`));
      } else {
        result.passed.push('✅ OpenAPI schema validation passed');
      }

      // Agent extensions validation
      const extensionsValidation = this.validateAgentExtensions(openApiSpec);
      result.errors.push(...extensionsValidation.errors);
      result.warnings.push(...extensionsValidation.warnings);
      result.passed.push(...extensionsValidation.passed);

      // Security validation
      const securityValidation = this.validateOpenApiSecurity(openApiSpec);
      result.errors.push(...securityValidation.errors);
      result.warnings.push(...securityValidation.warnings);
      result.passed.push(...securityValidation.passed);

      // Calculate score
      result.score = this.calculateOpenApiScore(result);
      result.valid = result.errors.length === 0 && result.score >= 70;

    } catch (error) {
      result.errors.push(`OpenAPI validation error: ${error.message}`);
    }

    return result;
  }

  async validateCrossFormatConsistency(agentConfig, openApiSpec) {
    const result = {
      valid: false,
      errors: [],
      warnings: [],
      passed: [],
      score: 0
    };

    try {
      // Check if OpenAPI spec path matches agent config
      if (agentConfig.spec?.openapi_spec && openApiSpec.info?.title) {
        const agentName = agentConfig.metadata?.name;
        const openApiTitle = openApiSpec.info.title;
        
        if (agentName && !openApiTitle.toLowerCase().includes(agentName.toLowerCase())) {
          result.warnings.push('Agent name and OpenAPI title should be consistent');
        } else {
          result.passed.push('✅ Agent name and OpenAPI title consistency verified');
        }
      }

      // Check protocol consistency
      if (agentConfig.spec?.protocols && openApiSpec.paths) {
        const agentProtocols = agentConfig.spec.protocols;
        const hasOpenApiEndpoints = Object.keys(openApiSpec.paths).length > 0;
        
        if (agentProtocols.includes('openapi') && !hasOpenApiEndpoints) {
          result.errors.push('OpenAPI protocol specified but no API endpoints found');
        } else if (agentProtocols.includes('openapi') && hasOpenApiEndpoints) {
          result.passed.push('✅ OpenAPI protocol and endpoints consistency verified');
        }
      }

      // Check capabilities consistency
      if (agentConfig.spec?.capabilities && openApiSpec.paths) {
        const capabilities = agentConfig.spec.capabilities;
        const endpoints = Object.keys(openApiSpec.paths);
        
        if (capabilities.includes('multi_agent_orchestration') && endpoints.length < 3) {
          result.warnings.push('Multi-agent orchestration capability requires more API endpoints');
        }
      }

      result.score = this.calculateCrossValidationScore(result);
      result.valid = result.errors.length === 0;

    } catch (error) {
      result.errors.push(`Cross-format validation error: ${error.message}`);
    }

    return result;
  }

  async validateSecurityCompliance(agentConfig, openApiSpec) {
    const result = {
      valid: false,
      errors: [],
      warnings: [],
      passed: [],
      score: 0
    };

    try {
      // Security scheme validation
      if (!openApiSpec.components?.securitySchemes) {
        result.errors.push('Security schemes must be defined for production agents');
      } else {
        result.passed.push('✅ Security schemes defined');
      }

      // Authentication validation
      if (openApiSpec.security && openApiSpec.security.length === 0) {
        result.warnings.push('Global security should be defined for sensitive operations');
      }

      // Audit logging validation
      if (agentConfig.spec?.monitoring?.metrics) {
        const hasAuditMetrics = agentConfig.spec.monitoring.metrics.some(
          metric => metric.toLowerCase().includes('audit')
        );
        if (!hasAuditMetrics) {
          result.warnings.push('Audit logging metrics recommended for compliance');
        } else {
          result.passed.push('✅ Audit logging metrics configured');
        }
      }

      // Data protection validation
      if (agentConfig.spec?.data_quality) {
        result.passed.push('✅ Data quality management configured');
      } else {
        result.warnings.push('Data quality management recommended');
      }

      result.score = this.calculateSecurityScore(result);
      result.valid = result.errors.length === 0;

    } catch (error) {
      result.errors.push(`Security validation error: ${error.message}`);
    }

    return result;
  }

  validateAgentBusinessLogic(agentConfig) {
    const result = {
      errors: [],
      warnings: [],
      passed: []
    };

    // Version compatibility check
    if (agentConfig.apiVersion === 'openapi-ai-agents/v0.1.0') {
      result.warnings.push('Consider upgrading to latest API version for new features');
    }

    // Capability validation
    if (agentConfig.spec?.capabilities) {
      const capabilities = agentConfig.spec.capabilities;
      
      if (capabilities.includes('compliance_validation') && !agentConfig.spec?.governance) {
        result.warnings.push('Compliance validation capability requires governance configuration');
      }
      
      if (capabilities.includes('security_assessment') && !agentConfig.spec?.security) {
        result.warnings.push('Security assessment capability requires security configuration');
      }
    }

    // Protocol validation
    if (agentConfig.spec?.protocols) {
      const protocols = agentConfig.spec.protocols;
      
      if (protocols.includes('mcp') && !agentConfig.spec?.capabilities?.includes('protocol_bridging')) {
        result.warnings.push('MCP protocol requires protocol bridging capability');
      }
    }

    return result;
  }

  validateAgentExtensions(openApiSpec) {
    const result = {
      errors: [],
      warnings: [],
      passed: []
    };

    // Check for required agent extensions
    if (!openApiSpec['x-agent-metadata']) {
      result.warnings.push('x-agent-metadata extension recommended for better agent identification');
    } else {
      result.passed.push('✅ Agent metadata extensions present');
      
      // Validate metadata content
      const metadata = openApiSpec['x-agent-metadata'];
      if (metadata.certification_level && !['bronze', 'silver', 'gold', 'platinum'].includes(metadata.certification_level)) {
        result.errors.push('Invalid certification level in x-agent-metadata');
      }
    }

    // Check for token estimation
    if (!openApiSpec['x-token-estimate']) {
      result.warnings.push('x-token-estimate extension recommended for cost optimization');
    }

    return result;
  }

  validateOpenApiSecurity(openApiSpec) {
    const result = {
      errors: [],
      warnings: [],
      passed: []
    };

    // Check security schemes
    if (openApiSpec.components?.securitySchemes) {
      const schemes = Object.keys(openApiSpec.components.securitySchemes);
      
      if (schemes.length === 0) {
        result.errors.push('At least one security scheme must be defined');
      } else {
        result.passed.push('✅ Security schemes configured');
        
        // Check for strong authentication
        const hasStrongAuth = schemes.some(scheme => 
          ['oauth2', 'mutualTLS', 'apiKey'].includes(scheme)
        );
        
        if (!hasStrongAuth) {
          result.warnings.push('Consider implementing stronger authentication mechanisms');
        }
      }
    }

    // Check global security
    if (openApiSpec.security && openApiSpec.security.length > 0) {
      result.passed.push('✅ Global security defined');
    } else {
      result.warnings.push('Global security recommended for production APIs');
    }

    return result;
  }

  calculateAgentScore(result) {
    let score = 100;
    
    // Deduct points for errors and warnings
    score -= result.errors.length * 15;
    score -= result.warnings.length * 5;
    
    return Math.max(0, Math.round(score));
  }

  calculateOpenApiScore(result) {
    let score = 100;
    
    // Deduct points for errors and warnings
    score -= result.errors.length * 15;
    score -= result.warnings.length * 5;
    
    return Math.max(0, Math.round(score));
  }

  calculateCrossValidationScore(result) {
    let score = 100;
    
    score -= result.errors.length * 20;
    score -= result.warnings.length * 5;
    
    return Math.max(0, Math.round(score));
  }

  calculateSecurityScore(result) {
    let score = 100;
    
    score -= result.errors.length * 25;
    score -= result.warnings.length * 8;
    
    return Math.max(0, Math.round(score));
  }

  determineCertificationLevel() {
    const totalErrors = this.errors.length;
    const totalWarnings = this.warnings.length;
    const totalPassed = this.passed.length;
    
    if (totalErrors === 0 && totalWarnings === 0 && totalPassed >= 10) {
      return 'platinum';
    } else if (totalErrors === 0 && totalWarnings <= 2 && totalPassed >= 8) {
      return 'gold';
    } else if (totalErrors === 0 && totalWarnings <= 5 && totalPassed >= 6) {
      return 'silver';
    } else if (totalErrors <= 2 && totalWarnings <= 8 && totalPassed >= 4) {
      return 'bronze';
    } else {
      return 'none';
    }
  }

  generateValidationReport(validationResults) {
    const totalScore = Math.round(
      (validationResults.agentValidation.score + 
       validationResults.openApiValidation.score + 
       validationResults.crossValidation.score + 
       validationResults.securityValidation.score) / 4
    );

    return {
      valid: this.errors.length === 0 && totalScore >= 70,
      certification_level: validationResults.certificationLevel,
      overall_score: totalScore,
      errors: this.errors,
      warnings: this.warnings,
      passed: this.passed,
      detailed_results: {
        agent_config: validationResults.agentValidation,
        openapi_spec: validationResults.openApiValidation,
        cross_format: validationResults.crossValidation,
        security: validationResults.securityValidation
      },
      recommendations: this.generateRecommendations(),
      next_steps: this.generateNextSteps(totalScore)
    };
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.errors.length > 0) {
      recommendations.push('Fix all validation errors to achieve compliance');
    }
    
    if (this.warnings.length > 5) {
      recommendations.push('Address critical warnings to improve certification level');
    }
    
    if (this.passed.length < 8) {
      recommendations.push('Implement additional features to reach higher certification levels');
    }
    
    return recommendations;
  }

  generateNextSteps(score) {
    const steps = [];
    
    if (score < 70) {
      steps.push('Fix critical errors to achieve basic compliance');
    } else if (score < 80) {
      steps.push('Address warnings to reach silver certification');
    } else if (score < 90) {
      steps.push('Enhance security and compliance to reach gold certification');
    } else if (score < 95) {
      steps.push('Optimize for platinum certification');
    } else {
      steps.push('Maintain platinum certification standards');
    }
    
    return steps;
  }
}

module.exports = DualFormatValidator;