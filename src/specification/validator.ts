import { components } from '../types/api.js';
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
import * as fs from 'fs';
import * as path from 'path';

type ValidationResult = components['schemas']['ValidationResult'];
type ValidationError = components['schemas']['ValidationError'];
type AgentTaxonomy = components['schemas']['AgentTaxonomy'];

/**
 * OSSA Specification Authority - ACDL Validator v0.1.9-alpha.1
 * 
 * Implements comprehensive ACDL (Agent Capability Description Language) validation
 * according to OSSA v0.1.9-alpha.1 specification standards.
 */
export class SpecificationValidator {
  private readonly ossaVersion = '0.1.9-alpha.1';
  private readonly ajv: any;
  
  private readonly validAgentTypes = [
    'orchestrator', 'worker', 'critic', 'judge', 
    'trainer', 'governor', 'monitor', 'integrator', 'voice'
  ];
  
  private readonly validDomains = [
    'nlp', 'vision', 'reasoning', 'data', 'documentation',
    'api-design', 'validation', 'orchestration', 'monitoring',
    'security', 'compliance', 'testing', 'deployment',
    'audio', 'speech', 'interaction'
  ];
  
  private readonly validProtocols = [
    'rest', 'grpc', 'websocket', 'mcp', 'graphql'
  ];
  
  private readonly conformanceLevels = {
    bronze: {
      auditLogging: false,
      feedbackLoop: false,
      propsTokens: false,
      learningSignals: false,
      minCapabilities: 1,
      minProtocols: 1
    },
    silver: {
      auditLogging: true,
      feedbackLoop: true,
      propsTokens: false,
      learningSignals: true,
      minCapabilities: 2,
      minProtocols: 2
    },
    gold: {
      auditLogging: true,
      feedbackLoop: true,
      propsTokens: true,
      learningSignals: true,
      minCapabilities: 3,
      minProtocols: 3
    }
  };
  
  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);
    
    // Load and add OSSA agent manifest schema
    try {
      const schemaPath = path.resolve(__dirname, '../api/agent-manifest.schema.json');
      if (fs.existsSync(schemaPath)) {
        const schemaContent = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
        this.ajv.addSchema(schemaContent, 'agent-manifest');
      } else {
        console.warn('Agent manifest schema not found at:', schemaPath);
      }
    } catch (error) {
      console.warn('Could not load agent manifest schema:', error);
    }
  }

  /**
   * Comprehensive ACDL validation according to OSSA v0.1.9-alpha.1
   */
  async validate(manifest: any): Promise<ValidationResult | ValidationError> {
    const errors: Array<{ field: string; message: string; code: string }> = [];
    const warnings: string[] = [];
    
    try {
      // 1. JSON Schema validation against OSSA agent manifest schema
      // Only validate if schema was loaded successfully
      if (this.ajv.getSchema('agent-manifest')) {
        const schemaValidation = this.validateAgentManifestSchema(manifest);
        if (!schemaValidation.valid) {
          errors.push(...schemaValidation.errors);
        }
      }
      
      // 2. OSSA-specific validation rules
      const ossaValidation = this.validateOSSACompliance(manifest);
      errors.push(...ossaValidation.errors);
      warnings.push(...ossaValidation.warnings);
      
      // 3. Protocol validation
      const protocolValidation = this.validateProtocols(manifest.spec?.protocols);
      errors.push(...protocolValidation.errors);
      warnings.push(...protocolValidation.warnings);
      
      // 4. Performance characteristics validation
      const performanceValidation = this.validatePerformance(manifest.spec?.performance);
      errors.push(...performanceValidation.errors);
      warnings.push(...performanceValidation.warnings);
      
      // 5. Conformance level validation (optional for basic compliance)
      if (manifest.spec?.conformance) {
        const conformanceValidation = this.validateConformance(manifest.spec.conformance);
        errors.push(...conformanceValidation.errors);
        warnings.push(...conformanceValidation.warnings);
      }
      
      // 6. Token efficiency and budget validation
      const budgetValidation = this.validateBudgets(manifest.spec?.budgets);
      errors.push(...budgetValidation.errors);
      warnings.push(...budgetValidation.warnings);
      
      if (errors.length > 0) {
        return {
          valid: false,
          errors
        };
      }
      
      // Determine conformance level achieved
      const achievedLevel = this.determineConformanceLevel(manifest);
      
      return {
        valid: true,
        version: this.ossaVersion,
        warnings: warnings.length > 0 ? warnings : undefined,
        compliance: {
          ossaVersion: this.ossaVersion,
          level: achievedLevel as 'basic' | 'standard' | 'enterprise'
        }
      };
      
    } catch (error) {
      return {
        valid: false,
        errors: [{
          field: 'manifest',
          message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          code: 'VALIDATION_ERROR'
        }]
      };
    }
  }
  
  /**
   * Validate agent manifest against JSON Schema
   */
  private validateAgentManifestSchema(manifest: any): { valid: boolean; errors: Array<{ field: string; message: string; code: string }> } {
    const valid = this.ajv.validate('agent-manifest', manifest);
    const errors: Array<{ field: string; message: string; code: string }> = [];
    
    if (!valid && this.ajv.errors) {
      for (const error of this.ajv.errors) {
        errors.push({
          field: error.instancePath || error.schemaPath || 'unknown',
          message: error.message || 'Schema validation failed',
          code: error.keyword?.toUpperCase() || 'SCHEMA_ERROR'
        });
      }
    }
    
    return { valid, errors };
  }
  
  /**
   * Validate OSSA-specific compliance rules
   */
  private validateOSSACompliance(manifest: any): { errors: Array<{ field: string; message: string; code: string }>; warnings: string[] } {
    const errors: Array<{ field: string; message: string; code: string }> = [];
    const warnings: string[] = [];
    
    // Validate API version
    if (manifest.apiVersion !== 'ossa.io/v0.1.9-alpha.1') {
      errors.push({
        field: 'apiVersion',
        message: `Expected OSSA API version 'ossa.io/v0.1.9-alpha.1', got '${manifest.apiVersion}'`,
        code: 'INVALID_API_VERSION'
      });
    }
    
    // Validate kind
    if (manifest.kind !== 'Agent') {
      errors.push({
        field: 'kind',
        message: `Expected kind 'Agent', got '${manifest.kind}'`,
        code: 'INVALID_KIND'
      });
    }
    
    // Validate agent name format (DNS-1123)
    if (manifest.metadata?.name && !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(manifest.metadata.name)) {
      errors.push({
        field: 'metadata.name',
        message: 'Agent name must follow DNS-1123 naming convention (lowercase, hyphens only)',
        code: 'INVALID_NAME_FORMAT'
      });
    }
    
    // Validate semantic versioning
    if (manifest.metadata?.version && !/^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/.test(manifest.metadata.version)) {
      errors.push({
        field: 'metadata.version',
        message: 'Version must follow semantic versioning format',
        code: 'INVALID_VERSION_FORMAT'
      });
    }
    
    // Validate agent type
    if (manifest.spec?.type && !this.validAgentTypes.includes(manifest.spec.type)) {
      errors.push({
        field: 'spec.type',
        message: `Invalid agent type '${manifest.spec.type}'. Valid types: ${this.validAgentTypes.join(', ')}`,
        code: 'INVALID_AGENT_TYPE'
      });
    }
    
    // Validate capability domains
    if (manifest.spec?.capabilities?.domains) {
      const invalidDomains = manifest.spec.capabilities.domains.filter((domain: string) => 
        !this.validDomains.includes(domain)
      );
      
      if (invalidDomains.length > 0) {
        errors.push({
          field: 'spec.capabilities.domains',
          message: `Invalid capability domains: ${invalidDomains.join(', ')}. Valid domains: ${this.validDomains.join(', ')}`,
          code: 'INVALID_CAPABILITY_DOMAIN'
        });
      }
    }
    
    // Check for deprecated features
    if (manifest.metadata?.version && manifest.metadata.version.startsWith('0.1.')) {
      warnings.push(`Version ${manifest.metadata.version} uses legacy 0.1.x format`);
    }
    
    return { errors, warnings };
  }
  
  /**
   * Validate protocol configurations
   */
  private validateProtocols(protocols: any): { errors: Array<{ field: string; message: string; code: string }>; warnings: string[] } {
    const errors: Array<{ field: string; message: string; code: string }> = [];
    const warnings: string[] = [];
    
    if (!protocols) {
      errors.push({
        field: 'spec.protocols',
        message: 'Protocol configuration is required',
        code: 'MISSING_PROTOCOLS'
      });
      return { errors, warnings };
    }
    
    // Validate supported protocols
    if (!protocols.supported || !Array.isArray(protocols.supported)) {
      errors.push({
        field: 'spec.protocols.supported',
        message: 'At least one supported protocol is required',
        code: 'MISSING_SUPPORTED_PROTOCOLS'
      });
      return { errors, warnings };
    }
    
    // Validate each protocol
    protocols.supported.forEach((protocol: any, index: number) => {
      if (!protocol.name || !this.validProtocols.includes(protocol.name)) {
        errors.push({
          field: `spec.protocols.supported[${index}].name`,
          message: `Invalid protocol '${protocol.name}'. Valid protocols: ${this.validProtocols.join(', ')}`,
          code: 'INVALID_PROTOCOL_NAME'
        });
      }
      
      if (!protocol.endpoint) {
        errors.push({
          field: `spec.protocols.supported[${index}].endpoint`,
          message: 'Protocol endpoint is required',
          code: 'MISSING_PROTOCOL_ENDPOINT'
        });
      }
      
      // Warn if TLS is disabled
      if (protocol.tls === false) {
        warnings.push(`Protocol ${protocol.name} has TLS disabled - not recommended for production`);
      }
    });
    
    return { errors, warnings };
  }
  
  /**
   * Validate performance characteristics
   */
  private validatePerformance(performance: any): { errors: Array<{ field: string; message: string; code: string }>; warnings: string[] } {
    const errors: Array<{ field: string; message: string; code: string }> = [];
    const warnings: string[] = [];
    
    if (!performance) {
      warnings.push('Performance characteristics not specified - consider defining for better orchestration');
      return { errors, warnings };
    }
    
    // Validate throughput specifications
    if (performance.throughput) {
      if (performance.throughput.requestsPerSecond && performance.throughput.requestsPerSecond < 1) {
        errors.push({
          field: 'spec.performance.throughput.requestsPerSecond',
          message: 'Requests per second must be at least 1',
          code: 'INVALID_THROUGHPUT'
        });
      }
      
      if (performance.throughput.concurrentRequests && performance.throughput.concurrentRequests < 1) {
        errors.push({
          field: 'spec.performance.throughput.concurrentRequests',
          message: 'Concurrent requests must be at least 1',
          code: 'INVALID_CONCURRENCY'
        });
      }
    }
    
    // Validate latency specifications
    if (performance.latency) {
      const { p50, p95, p99 } = performance.latency;
      
      if (p50 && p95 && p50 >= p95) {
        errors.push({
          field: 'spec.performance.latency',
          message: 'P50 latency must be less than P95 latency',
          code: 'INVALID_LATENCY_DISTRIBUTION'
        });
      }
      
      if (p95 && p99 && p95 >= p99) {
        errors.push({
          field: 'spec.performance.latency',
          message: 'P95 latency must be less than P99 latency',
          code: 'INVALID_LATENCY_DISTRIBUTION'
        });
      }
      
      // Warn about high latency
      if (p95 && p95 > 1000) {
        warnings.push(`High P95 latency (${p95}ms) may impact orchestration performance`);
      }
    }
    
    return { errors, warnings };
  }
  
  /**
   * Validate conformance level requirements
   */
  private validateConformance(conformance: any): { errors: Array<{ field: string; message: string; code: string }>; warnings: string[] } {
    const errors: Array<{ field: string; message: string; code: string }> = [];
    const warnings: string[] = [];
    
    if (!conformance) {
      warnings.push('Conformance level not specified - defaulting to bronze level');
      return { errors, warnings };
    }
    
    // Validate conformance level
    const validLevels = ['bronze', 'silver', 'gold'];
    if (!conformance.level || !validLevels.includes(conformance.level)) {
      errors.push({
        field: 'spec.conformance.level',
        message: `Invalid conformance level '${conformance.level}'. Valid levels: ${validLevels.join(', ')}`,
        code: 'INVALID_CONFORMANCE_LEVEL'
      });
    }
    
    return { errors, warnings };
  }
  
  /**
   * Validate budget and token efficiency specifications
   */
  private validateBudgets(budgets: any): { errors: Array<{ field: string; message: string; code: string }>; warnings: string[] } {
    const errors: Array<{ field: string; message: string; code: string }> = [];
    const warnings: string[] = [];
    
    if (!budgets) {
      warnings.push('Budget specifications not provided - consider defining for cost control');
      return { errors, warnings };
    }
    
    // Validate token budgets
    if (budgets.tokens) {
      if (budgets.tokens.default && budgets.tokens.default < 100) {
        errors.push({
          field: 'spec.budgets.tokens.default',
          message: 'Default token budget must be at least 100',
          code: 'INVALID_TOKEN_BUDGET'
        });
      }
      
      if (budgets.tokens.maximum && budgets.tokens.default && budgets.tokens.maximum < budgets.tokens.default) {
        errors.push({
          field: 'spec.budgets.tokens.maximum',
          message: 'Maximum token budget must be greater than or equal to default budget',
          code: 'INVALID_BUDGET_RELATIONSHIP'
        });
      }
    }
    
    return { errors, warnings };
  }
  
  /**
   * Determine the achieved conformance level based on manifest features
   */
  private determineConformanceLevel(manifest: any): string {
    const spec = manifest.spec || {};
    const conformance = spec.conformance || {};
    
    // Start with declared level
    let declaredLevel = conformance.level || 'bronze';
    
    // Check if the agent actually meets the requirements for the declared level
    const requirements = this.conformanceLevels[declaredLevel as keyof typeof this.conformanceLevels];
    if (!requirements) return 'bronze';
    
    const capabilities = spec.capabilities?.domains || [];
    const protocols = spec.protocols?.supported || [];
    
    // Validate minimum requirements
    if (capabilities.length < requirements.minCapabilities || 
        protocols.length < requirements.minProtocols) {
      return 'bronze';
    }
    
    // Validate feature requirements
    if (requirements.auditLogging && !conformance.auditLogging) {
      return declaredLevel === 'gold' ? 'silver' : 'bronze';
    }
    
    if (requirements.feedbackLoop && !conformance.feedbackLoop) {
      return declaredLevel === 'gold' ? 'silver' : 'bronze';
    }
    
    if (requirements.propsTokens && !conformance.propsTokens) {
      return 'silver';
    }
    
    return declaredLevel;
  }

  /**
   * Get comprehensive OSSA agent taxonomy with 360° feedback loop
   */
  getTaxonomy(): AgentTaxonomy {
    return {
      version: this.ossaVersion,
      feedbackLoop: {
        phases: ['plan', 'execute', 'review', 'judge', 'learn', 'govern']
      },
      types: [
        {
          name: 'orchestrator',
          description: 'Manages goal decomposition, task planning, and workflow coordination in the 360° feedback loop',
          capabilities: ['goal-decomposition', 'task-planning', 'workflow-management', 'agent-coordination', 'resource-allocation']
        },
        {
          name: 'worker',
          description: 'Executes specific tasks with self-reporting and result validation',
          capabilities: ['task-execution', 'self-reporting', 'result-validation', 'progress-tracking', 'error-recovery']
        },
        {
          name: 'critic',
          description: 'Provides multi-dimensional reviews and feedback across quality, security, and performance dimensions',
          capabilities: ['review-generation', 'feedback-analysis', 'quality-assessment', 'security-analysis', 'performance-critique']
        },
        {
          name: 'judge',
          description: 'Makes binary decisions through pairwise comparisons and evaluation frameworks',
          capabilities: ['decision-making', 'comparison', 'evaluation', 'ranking', 'conflict-resolution']
        },
        {
          name: 'trainer',
          description: 'Continuously improves agent capabilities through learning and adaptation',
          capabilities: ['learning-signal-processing', 'capability-enhancement', 'performance-optimization', 'knowledge-transfer']
        },
        {
          name: 'governor',
          description: 'Enforces policies, budgets, and compliance across the agent ecosystem',
          capabilities: ['policy-enforcement', 'budget-management', 'compliance-monitoring', 'audit-trail-generation']
        },
        {
          name: 'monitor',
          description: 'Provides real-time observability and health monitoring of agent operations',
          capabilities: ['health-monitoring', 'performance-tracking', 'alert-generation', 'metrics-collection']
        },
        {
          name: 'integrator',
          description: 'Manages external system integrations and protocol bridging',
          capabilities: ['system-integration', 'protocol-bridging', 'data-transformation', 'external-api-management']
        }
      ]
    };
  }

  /**
   * Get comprehensive JSON Schema for specific agent type
   */
  getSchema(agentType: string): any {
    if (!this.validAgentTypes.includes(agentType)) {
      throw new Error(`Unknown agent type: ${agentType}. Valid types: ${this.validAgentTypes.join(', ')}`);
    }
    
    // Create a basic schema for the agent type
    const baseSchema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      required: ['apiVersion', 'kind', 'metadata', 'spec'],
      properties: {
        apiVersion: {
          type: 'string',
          const: 'ossa.io/v0.1.9-alpha.1'
        },
        kind: {
          type: 'string',
          const: 'Agent'
        },
        metadata: {
          type: 'object',
          required: ['name', 'version'],
          properties: {
            name: {
              type: 'string',
              pattern: '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'
            },
            version: {
              type: 'string',
              pattern: '^v?(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$'
            }
          }
        },
        spec: {
          type: 'object',
          required: ['type', 'capabilities'],
          properties: {
            type: {
              type: 'string',
              const: agentType
            },
            capabilities: {
              type: 'object',
              required: ['domains'],
              properties: {
                domains: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: this.getTypeSpecificCapabilities(agentType)
                  },
                  minItems: 1
                }
              }
            }
          }
        }
      }
    };
    
    return baseSchema;
  }
  
  /**
   * Get type-specific capability domains
   */
  private getTypeSpecificCapabilities(agentType: string): string[] {
    const typeCapabilities: Record<string, string[]> = {
      orchestrator: ['orchestration', 'monitoring', 'reasoning'],
      worker: ['api-design', 'documentation', 'validation', 'testing', 'data'],
      critic: ['security', 'compliance', 'validation', 'monitoring'],
      judge: ['reasoning', 'validation', 'compliance'],
      trainer: ['nlp', 'reasoning', 'monitoring'],
      governor: ['compliance', 'security', 'monitoring'],
      monitor: ['monitoring', 'security', 'data'],
      integrator: ['api-design', 'data', 'orchestration']
    };
    
    return typeCapabilities[agentType] || this.validDomains;
  }
  
  /**
   * Validate agent capability matching for orchestration
   */
  async validateCapabilityMatch(requiredCapabilities: string[], agentManifest: any): Promise<{
    compatible: boolean;
    score: number;
    missing: string[];
    warnings: string[];
  }> {
    const agentCapabilities = agentManifest.spec?.capabilities?.domains || [];
    const missing = requiredCapabilities.filter(cap => !agentCapabilities.includes(cap));
    const compatible = missing.length === 0;
    const score = (agentCapabilities.length - missing.length) / requiredCapabilities.length;
    const warnings: string[] = [];
    
    if (!compatible) {
      warnings.push(`Agent missing required capabilities: ${missing.join(', ')}`);
    }
    
    if (score < 0.8) {
      warnings.push(`Low capability match score: ${Math.round(score * 100)}%`);
    }
    
    return {
      compatible,
      score: Math.max(0, score),
      missing,
      warnings
    };
  }
  
  /**
   * Get OSSA specification version
   */
  getVersion(): string {
    return this.ossaVersion;
  }
  
  /**
   * Get supported conformance levels with requirements
   */
  getConformanceLevels(): typeof this.conformanceLevels {
    return this.conformanceLevels;
  }
}