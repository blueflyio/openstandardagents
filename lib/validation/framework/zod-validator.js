#!/usr/bin/env node

/**
 * Zod Schema Validation Framework for OSSA v0.1.8
 * Implements the VoltAgent pattern for type-safe validation
 * Provides comprehensive schema validation with detailed error reporting
 * 
 * @version 0.1.8
 */

import { z } from 'zod';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

/**
 * OSSA v0.1.8 Zod Schema Definitions
 */

// Base metadata schema
const OSSAMetadataSchema = z.object({
  name: z.string().min(1, "Name is required"),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "Version must follow semver format"),
  namespace: z.string().optional().default("default"),
  labels: z.record(z.string()).optional(),
  annotations: z.record(z.string()).optional(),
  description: z.string().optional()
});

// Framework integration schema
const FrameworkConfigSchema = z.object({
  enabled: z.boolean(),
  version: z.string().optional(),
  config: z.record(z.any()).optional(),
  integration: z.enum(["native", "bridge", "adapter", "seamless"]).optional(),
  endpoints: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional()
});

const FrameworksSchema = z.object({
  mcp: FrameworkConfigSchema.optional(),
  langchain: FrameworkConfigSchema.optional(),
  crewai: FrameworkConfigSchema.optional(),
  autogen: FrameworkConfigSchema.optional(),
  openai: FrameworkConfigSchema.optional(),
  anthropic: FrameworkConfigSchema.optional()
});

// Capability schema with input/output validation
const CapabilitySchema = z.object({
  name: z.string().min(1, "Capability name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  domain: z.string().optional(),
  input_schema: z.string().optional(), // Path to JSON schema
  output_schema: z.string().optional(), // Path to JSON schema
  frameworks: z.array(z.string()).optional(),
  examples: z.array(z.any()).optional(),
  sla: z.string().optional(),
  compliance: z.array(z.string()).optional(),
  security_level: z.enum(["public", "internal", "confidential", "restricted"]).optional()
});

// Agent specification schema
const AgentSpecSchema = z.object({
  name: z.string().min(1, "Agent name is required"),
  expertise: z.string().min(20, "Expertise description must be at least 20 characters"),
  description: z.string().optional(),
  version: z.string().optional(),
  type: z.enum(["individual", "team", "orchestrator", "specialist"]).optional().default("individual")
});

// Security configuration schema
const SecuritySchema = z.object({
  authentication: z.object({
    required: z.boolean(),
    methods: z.array(z.enum(["api_key", "oauth2", "jwt", "mTLS"])).optional()
  }).optional(),
  authorization: z.object({
    enabled: z.boolean(),
    model: z.enum(["rbac", "abac", "acl"]).optional()
  }).optional(),
  encryption: z.object({
    in_transit: z.boolean().optional(),
    at_rest: z.boolean().optional(),
    algorithms: z.array(z.string()).optional()
  }).optional(),
  audit: z.object({
    enabled: z.boolean(),
    level: z.enum(["basic", "detailed", "comprehensive"]).optional(),
    retention: z.string().optional()
  }).optional()
});

// Performance configuration schema
const PerformanceSchema = z.object({
  timeout: z.string().regex(/^\d+[ms|s|m]$/, "Timeout must be in format: 30s, 5m, etc.").optional(),
  cache_ttl: z.number().min(0).optional(),
  rate_limit: z.string().optional(),
  max_concurrent: z.number().min(1).optional(),
  memory_limit: z.string().optional(),
  cpu_limit: z.string().optional()
});

// Orchestration configuration schema
const OrchestrationSchema = z.object({
  patterns: z.array(z.enum([
    "sequential", "parallel", "fanout", "pipeline", 
    "mapreduce", "circuit_breaker", "saga", "workflow"
  ])).optional(),
  timeout: z.string().optional(),
  retry_policy: z.object({
    max_attempts: z.number().min(1).optional(),
    backoff_strategy: z.enum(["fixed", "exponential", "linear"]).optional(),
    retry_delay: z.string().optional()
  }).optional(),
  error_handling: z.enum(["fail_fast", "continue", "compensate"]).optional()
});

// API configuration schema
const APISchema = z.object({
  openapi: z.string().optional(), // Path to OpenAPI spec
  version: z.string().optional(),
  base_path: z.string().optional(),
  protocols: z.array(z.enum(["http", "https", "ws", "wss"])).optional(),
  formats: z.array(z.enum(["json", "yaml", "xml", "protobuf"])).optional()
});

// Main OSSA Agent Schema
const OSSAAgentSchema = z.object({
  apiVersion: z.string().regex(/^open-standards-scalable-agents\/v\d+\.\d+\.\d+$/, 
    "API version must follow format: open-standards-scalable-agents/v0.1.8"),
  kind: z.enum(["Agent", "Workspace", "OrchestrationRules", "ConformanceProfile"]),
  metadata: OSSAMetadataSchema,
  spec: z.object({
    agent: AgentSpecSchema,
    capabilities: z.array(CapabilitySchema).min(1, "At least one capability is required"),
    frameworks: FrameworksSchema.optional(),
    security: SecuritySchema.optional(),
    performance: PerformanceSchema.optional(),
    orchestration: OrchestrationSchema.optional(),
    api: APISchema.optional(),
    discovery: z.object({
      uadp: z.object({
        enabled: z.boolean(),
        priority: z.number().min(1).max(10).optional(),
        tags: z.array(z.string()).optional()
      }).optional()
    }).optional(),
    compliance: z.object({
      frameworks: z.array(z.enum([
        "iso-42001", "nist-ai-rmf", "eu-ai-act", "sox", "hipaa", 
        "gdpr", "ccpa", "pci-dss", "soc2"
      ])).optional(),
      certifications: z.array(z.string()).optional(),
      audit_trail: z.boolean().optional()
    }).optional()
  })
});

// Workspace Schema
const OSSAWorkspaceSchema = z.object({
  apiVersion: z.string().regex(/^open-standards-scalable-agents\/v\d+\.\d+\.\d+$/),
  kind: z.literal("Workspace"),
  metadata: OSSAMetadataSchema,
  spec: z.object({
    discovery: z.object({
      scan_patterns: z.array(z.string()),
      exclude_patterns: z.array(z.string()).optional(),
      auto_discovery: z.boolean().optional()
    }),
    orchestration: z.object({
      routing_strategy: z.enum(["capability_match", "round_robin", "weighted", "priority"]),
      conflict_resolution: z.enum(["first_wins", "last_wins", "weighted_confidence", "voting"]),
      cache_strategy: z.enum(["none", "simple", "intelligent", "semantic"]).optional()
    }),
    agents: z.array(z.object({
      name: z.string(),
      path: z.string(),
      enabled: z.boolean().optional(),
      priority: z.number().optional()
    })).optional()
  })
});

export class ZodValidator {
  constructor(options = {}) {
    this.config = {
      strict: true,
      throwOnError: true,
      includeErrorDetails: true,
      ...options
    };

    this.schemas = {
      agent: OSSAAgentSchema,
      workspace: OSSAWorkspaceSchema,
      metadata: OSSAMetadataSchema,
      capability: CapabilitySchema,
      frameworks: FrameworksSchema,
      security: SecuritySchema,
      performance: PerformanceSchema
    };
  }

  /**
   * Validate OSSA agent specification using Zod schemas
   */
  async validateAgent(agentData) {
    try {
      const result = this.schemas.agent.parse(agentData);
      
      // Additional semantic validation
      const semanticValidation = await this.performSemanticValidation(result);
      
      return {
        valid: true,
        data: result,
        errors: [],
        warnings: semanticValidation.warnings,
        level: this.determineComplianceLevel(result),
        suggestions: this.generateImprovementSuggestions(result)
      };
    } catch (error) {
      return this.formatValidationError(error, 'agent');
    }
  }

  /**
   * Validate OSSA workspace specification
   */
  async validateWorkspace(workspaceData) {
    try {
      const result = this.schemas.workspace.parse(workspaceData);
      
      return {
        valid: true,
        data: result,
        errors: [],
        warnings: [],
        agents: await this.validateWorkspaceAgents(result)
      };
    } catch (error) {
      return this.formatValidationError(error, 'workspace');
    }
  }

  /**
   * Validate capability definition with enhanced checking
   */
  async validateCapability(capabilityData) {
    try {
      const result = this.schemas.capability.parse(capabilityData);
      
      // Validate input/output schemas if provided
      const schemaValidation = await this.validateCapabilitySchemas(result);
      
      return {
        valid: true,
        data: result,
        errors: [],
        warnings: schemaValidation.warnings,
        schema_validation: schemaValidation
      };
    } catch (error) {
      return this.formatValidationError(error, 'capability');
    }
  }

  /**
   * Perform semantic validation beyond schema structure
   */
  async performSemanticValidation(agentData) {
    const warnings = [];
    const issues = [];

    // Check capability coherence
    if (agentData.spec.capabilities.length > 10) {
      warnings.push("Agent has many capabilities - consider specialization");
    }

    // Check framework consistency
    const frameworks = agentData.spec.frameworks;
    if (frameworks) {
      const enabledFrameworks = Object.keys(frameworks).filter(f => frameworks[f]?.enabled);
      if (enabledFrameworks.length > 3) {
        warnings.push("Multiple framework integrations may increase complexity");
      }
    }

    // Check security configuration completeness
    if (agentData.spec.security?.authentication?.required && 
        !agentData.spec.security.authorization?.enabled) {
      warnings.push("Authentication enabled but authorization not configured");
    }

    // Check performance configuration
    if (agentData.spec.performance?.timeout && 
        !agentData.spec.performance.retry_policy) {
      warnings.push("Timeout configured without retry policy");
    }

    return { warnings, issues };
  }

  /**
   * Validate capability input/output schemas
   */
  async validateCapabilitySchemas(capability) {
    const warnings = [];
    const schemaValidation = { input: null, output: null };

    if (capability.input_schema) {
      try {
        // Validate that the schema file exists and is valid JSON Schema
        if (existsSync(capability.input_schema)) {
          const schema = JSON.parse(readFileSync(capability.input_schema, 'utf8'));
          schemaValidation.input = { valid: true, schema };
        } else {
          warnings.push(`Input schema file not found: ${capability.input_schema}`);
        }
      } catch (error) {
        warnings.push(`Invalid input schema: ${error.message}`);
      }
    }

    if (capability.output_schema) {
      try {
        if (existsSync(capability.output_schema)) {
          const schema = JSON.parse(readFileSync(capability.output_schema, 'utf8'));
          schemaValidation.output = { valid: true, schema };
        } else {
          warnings.push(`Output schema file not found: ${capability.output_schema}`);
        }
      } catch (error) {
        warnings.push(`Invalid output schema: ${error.message}`);
      }
    }

    return { warnings, ...schemaValidation };
  }

  /**
   * Validate all agents in workspace
   */
  async validateWorkspaceAgents(workspaceData) {
    const results = [];
    
    if (workspaceData.spec.agents) {
      for (const agentRef of workspaceData.spec.agents) {
        try {
          if (existsSync(agentRef.path)) {
            const agentContent = parseYaml(readFileSync(agentRef.path, 'utf8'));
            const validation = await this.validateAgent(agentContent);
            results.push({
              name: agentRef.name,
              path: agentRef.path,
              validation
            });
          } else {
            results.push({
              name: agentRef.name,
              path: agentRef.path,
              validation: { valid: false, errors: [`Agent file not found: ${agentRef.path}`] }
            });
          }
        } catch (error) {
          results.push({
            name: agentRef.name,
            path: agentRef.path,
            validation: { valid: false, errors: [error.message] }
          });
        }
      }
    }
    
    return results;
  }

  /**
   * Determine compliance level based on validation results
   */
  determineComplianceLevel(agentData) {
    let score = 0;
    
    // Basic requirements (Core level)
    if (agentData.spec.agent && agentData.spec.capabilities.length > 0) {
      score += 25;
    }
    
    // Integration requirements (Silver level)
    if (agentData.spec.frameworks && 
        Object.values(agentData.spec.frameworks).some(f => f?.enabled)) {
      score += 25;
    }
    
    // Production requirements (Gold level)
    if (agentData.spec.api?.openapi && agentData.spec.security) {
      score += 25;
    }
    
    // Enterprise requirements (Platinum level)
    if (agentData.spec.compliance?.frameworks?.length > 0 && 
        agentData.spec.orchestration && 
        agentData.spec.performance) {
      score += 25;
    }
    
    if (score >= 75) return 'platinum';
    if (score >= 50) return 'gold';
    if (score >= 25) return 'silver';
    return 'core';
  }

  /**
   * Generate improvement suggestions
   */
  generateImprovementSuggestions(agentData) {
    const suggestions = [];
    
    // Framework integration suggestions
    if (!agentData.spec.frameworks?.mcp?.enabled) {
      suggestions.push({
        category: "integration",
        priority: "high",
        suggestion: "Enable MCP integration for Claude Desktop compatibility",
        implementation: "Add frameworks.mcp.enabled: true to your agent specification"
      });
    }
    
    // Security suggestions
    if (!agentData.spec.security) {
      suggestions.push({
        category: "security",
        priority: "medium",
        suggestion: "Add security configuration for production readiness",
        implementation: "Include authentication and authorization settings"
      });
    }
    
    // API documentation suggestions
    if (!agentData.spec.api?.openapi) {
      suggestions.push({
        category: "documentation",
        priority: "medium",
        suggestion: "Add OpenAPI specification for better interoperability",
        implementation: "Create openapi.yaml file and reference in api.openapi"
      });
    }
    
    // Performance optimization suggestions
    if (!agentData.spec.performance) {
      suggestions.push({
        category: "performance",
        priority: "low",
        suggestion: "Add performance configuration for optimization",
        implementation: "Include timeout, caching, and resource limits"
      });
    }
    
    return suggestions;
  }

  /**
   * Format validation errors with detailed information
   */
  formatValidationError(error, context) {
    const formatted = {
      valid: false,
      errors: [],
      warnings: [],
      context: context
    };

    if (error.errors) {
      // Zod validation errors
      formatted.errors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code,
        received: err.received
      }));
    } else {
      // Other errors
      formatted.errors = [{
        path: 'root',
        message: error.message,
        code: 'VALIDATION_ERROR'
      }];
    }

    return formatted;
  }

  /**
   * Validate file from disk
   */
  async validateFile(filePath) {
    try {
      if (!existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const content = readFileSync(filePath, 'utf8');
      let data;
      
      if (filePath.endsWith('.json')) {
        data = JSON.parse(content);
      } else {
        data = parseYaml(content);
      }

      // Determine type based on kind
      switch (data.kind) {
        case 'Agent':
          return await this.validateAgent(data);
        case 'Workspace':
          return await this.validateWorkspace(data);
        default:
          throw new Error(`Unknown kind: ${data.kind}`);
      }
    } catch (error) {
      return this.formatValidationError(error, 'file');
    }
  }

  /**
   * Batch validate multiple files
   */
  async validateBatch(filePaths) {
    const results = [];
    
    for (const filePath of filePaths) {
      const result = await this.validateFile(filePath);
      results.push({
        file: filePath,
        ...result
      });
    }
    
    return {
      summary: {
        total: results.length,
        valid: results.filter(r => r.valid).length,
        invalid: results.filter(r => !r.valid).length
      },
      results
    };
  }

  /**
   * Generate validation report
   */
  generateReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      version: '0.1.8',
      validator: 'zod-validator',
      summary: results.summary || {
        total: 1,
        valid: results.valid ? 1 : 0,
        invalid: results.valid ? 0 : 1
      },
      compliance_levels: {},
      common_issues: [],
      recommendations: []
    };

    // Analyze results for report
    const resultsList = Array.isArray(results.results) ? results.results : [results];
    
    for (const result of resultsList) {
      if (result.valid && result.level) {
        report.compliance_levels[result.level] = 
          (report.compliance_levels[result.level] || 0) + 1;
      }
      
      if (result.errors) {
        result.errors.forEach(error => {
          const existing = report.common_issues.find(i => i.message === error.message);
          if (existing) {
            existing.count++;
          } else {
            report.common_issues.push({ ...error, count: 1 });
          }
        });
      }
      
      if (result.suggestions) {
        report.recommendations.push(...result.suggestions);
      }
    }

    return report;
  }
}

// CLI interface
if (import.meta.url === `file://${new URL(import.meta.url).pathname}`) {
  const validator = new ZodValidator();
  
  const command = process.argv[2];
  const args = process.argv.slice(3);
  
  switch (command) {
    case 'validate':
      if (args.length < 1) {
        console.error('Usage: node zod-validator.js validate <file-path>');
        process.exit(1);
      }
      
      validator.validateFile(args[0])
        .then(result => {
          console.log(JSON.stringify(result, null, 2));
          process.exit(result.valid ? 0 : 1);
        })
        .catch(err => {
          console.error('Validation failed:', err.message);
          process.exit(1);
        });
      break;
      
    case 'batch':
      if (args.length < 1) {
        console.error('Usage: node zod-validator.js batch <file1> [file2] [file3...]');
        process.exit(1);
      }
      
      validator.validateBatch(args)
        .then(results => {
          console.log(JSON.stringify(results, null, 2));
          process.exit(results.summary.invalid === 0 ? 0 : 1);
        })
        .catch(err => {
          console.error('Batch validation failed:', err.message);
          process.exit(1);
        });
      break;
      
    case 'report':
      if (args.length < 1) {
        console.error('Usage: node zod-validator.js report <file-path>');
        process.exit(1);
      }
      
      validator.validateFile(args[0])
        .then(result => {
          const report = validator.generateReport(result);
          console.log(JSON.stringify(report, null, 2));
        })
        .catch(err => {
          console.error('Report generation failed:', err.message);
          process.exit(1);
        });
      break;
      
    default:
      console.log(`
Zod Validation Framework for OSSA v0.1.8

Commands:
  validate <file>           Validate single OSSA file
  batch <file1> [file2...]  Validate multiple files
  report <file>             Generate validation report

Examples:
  node zod-validator.js validate ./examples/.agents/test-agent/agent.yml
  node zod-validator.js batch agent1.yml agent2.yml agent3.yml  
  node zod-validator.js report ./examples/.agents/test-agent/agent.yml

Features:
- Type-safe validation using Zod schemas
- Comprehensive error reporting with suggestions
- Compliance level determination (core/silver/gold/platinum)
- Semantic validation beyond structural checks
- VoltAgent pattern implementation
      `);
      break;
  }
}

export default ZodValidator;