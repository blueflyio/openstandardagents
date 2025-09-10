#!/usr/bin/env node

/**
 * JSON Schema Validation Ecosystem for OSSA v0.1.8
 * Integrates with existing OpenAPI validation tools and JSON Schema ecosystem
 * Provides comprehensive schema validation with cross-reference resolution
 * 
 * @version 0.1.8
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import $RefParser from '@apidevtools/json-schema-ref-parser';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

export class JSONSchemaValidator {
  constructor(options = {}) {
    this.config = {
      strict: true,
      allErrors: true,
      verbose: true,
      validateFormats: true,
      addUsedSchema: false,
      ...options
    };

    // Initialize AJV with formats
    this.ajv = new Ajv(this.config);
    addFormats(this.ajv);
    
    // Add custom formats for OSSA
    this.addCustomFormats();
    
    // Cache for resolved schemas
    this.schemaCache = new Map();
    
    // Initialize core OSSA schemas
    this.initializeCoreSchemas();
  }

  /**
   * Add custom formats for OSSA validation
   */
  addCustomFormats() {
    // OSSA version format
    this.ajv.addFormat('ossa-version', {
      type: 'string',
      validate: (data) => /^open-standards-scalable-agents\/v\d+\.\d+\.\d+$/.test(data)
    });

    // Capability name format
    this.ajv.addFormat('capability-name', {
      type: 'string',
      validate: (data) => /^[a-z][a-z0-9_]*[a-z0-9]$/.test(data)
    });

    // Agent name format
    this.ajv.addFormat('agent-name', {
      type: 'string',
      validate: (data) => data.length >= 3 && data.length <= 50
    });

    // Duration format (e.g., "30s", "5m", "1h")
    this.ajv.addFormat('duration', {
      type: 'string',
      validate: (data) => /^\d+[ms|s|m|h]$/.test(data)
    });

    // Semver format
    this.ajv.addFormat('semver', {
      type: 'string', 
      validate: (data) => /^\d+\.\d+\.\d+(-[\w\.-]+)?(\+[\w\.-]+)?$/.test(data)
    });

    // File path format
    this.ajv.addFormat('file-path', {
      type: 'string',
      validate: (data) => typeof data === 'string' && data.length > 0
    });
  }

  /**
   * Initialize core OSSA JSON schemas
   */
  initializeCoreSchemas() {
    // OSSA Agent Schema
    const agentSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      $id: "ossa://schemas/agent/v0.1.8",
      title: "OSSA Agent Specification v0.1.8",
      type: "object",
      required: ["apiVersion", "kind", "metadata", "spec"],
      properties: {
        apiVersion: {
          type: "string",
          format: "ossa-version",
          description: "OSSA API version"
        },
        kind: {
          type: "string",
          enum: ["Agent", "Workspace", "OrchestrationRules", "ConformanceProfile"],
          description: "Resource type"
        },
        metadata: {
          $ref: "#/$defs/metadata"
        },
        spec: {
          $ref: "#/$defs/agentSpec"
        }
      },
      $defs: {
        metadata: {
          type: "object",
          required: ["name", "version"],
          properties: {
            name: {
              type: "string",
              format: "agent-name",
              description: "Agent name"
            },
            version: {
              type: "string",
              format: "semver",
              description: "Agent version"
            },
            namespace: {
              type: "string",
              default: "default",
              description: "Namespace for agent"
            },
            labels: {
              type: "object",
              additionalProperties: { type: "string" },
              description: "Key-value labels"
            },
            annotations: {
              type: "object",
              additionalProperties: { type: "string" },
              description: "Key-value annotations"
            },
            description: {
              type: "string",
              description: "Agent description"
            }
          }
        },
        agentSpec: {
          type: "object",
          required: ["agent", "capabilities"],
          properties: {
            agent: {
              $ref: "#/$defs/agentInfo"
            },
            capabilities: {
              type: "array",
              minItems: 1,
              items: {
                $ref: "#/$defs/capability"
              },
              description: "Agent capabilities"
            },
            frameworks: {
              $ref: "#/$defs/frameworks"
            },
            security: {
              $ref: "#/$defs/security"
            },
            performance: {
              $ref: "#/$defs/performance"
            },
            orchestration: {
              $ref: "#/$defs/orchestration"
            },
            api: {
              $ref: "#/$defs/api"
            },
            discovery: {
              $ref: "#/$defs/discovery"
            },
            compliance: {
              $ref: "#/$defs/compliance"
            }
          }
        },
        agentInfo: {
          type: "object",
          required: ["name", "expertise"],
          properties: {
            name: {
              type: "string",
              minLength: 1,
              description: "Agent display name"
            },
            expertise: {
              type: "string",
              minLength: 20,
              description: "Agent expertise description"
            },
            description: {
              type: "string",
              description: "Additional agent description"
            },
            version: {
              type: "string",
              format: "semver"
            },
            type: {
              type: "string",
              enum: ["individual", "team", "orchestrator", "specialist"],
              default: "individual"
            }
          }
        },
        capability: {
          type: "object",
          required: ["name", "description"],
          properties: {
            name: {
              type: "string",
              format: "capability-name",
              description: "Capability identifier"
            },
            description: {
              type: "string",
              minLength: 10,
              description: "Capability description"
            },
            domain: {
              type: "string",
              description: "Domain of expertise"
            },
            input_schema: {
              type: "string",
              format: "file-path",
              description: "Path to input JSON schema"
            },
            output_schema: {
              type: "string",
              format: "file-path",
              description: "Path to output JSON schema"
            },
            frameworks: {
              type: "array",
              items: { type: "string" },
              description: "Compatible frameworks"
            },
            examples: {
              type: "array",
              items: {},
              description: "Usage examples"
            },
            sla: {
              type: "string",
              description: "Service level agreement"
            },
            compliance: {
              type: "array",
              items: { type: "string" },
              description: "Compliance frameworks"
            },
            security_level: {
              type: "string",
              enum: ["public", "internal", "confidential", "restricted"],
              description: "Security classification"
            }
          }
        },
        frameworks: {
          type: "object",
          properties: {
            mcp: { $ref: "#/$defs/frameworkConfig" },
            langchain: { $ref: "#/$defs/frameworkConfig" },
            crewai: { $ref: "#/$defs/frameworkConfig" },
            autogen: { $ref: "#/$defs/frameworkConfig" },
            openai: { $ref: "#/$defs/frameworkConfig" },
            anthropic: { $ref: "#/$defs/frameworkConfig" }
          }
        },
        frameworkConfig: {
          type: "object",
          required: ["enabled"],
          properties: {
            enabled: {
              type: "boolean",
              description: "Framework integration enabled"
            },
            version: {
              type: "string",
              description: "Framework version"
            },
            config: {
              type: "object",
              description: "Framework-specific configuration"
            },
            integration: {
              type: "string",
              enum: ["native", "bridge", "adapter", "seamless"],
              description: "Integration type"
            },
            endpoints: {
              type: "array",
              items: { type: "string" },
              description: "Framework endpoints"
            },
            tools: {
              type: "array", 
              items: { type: "string" },
              description: "Available tools"
            }
          }
        },
        security: {
          type: "object",
          properties: {
            authentication: {
              type: "object",
              properties: {
                required: { type: "boolean" },
                methods: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: ["api_key", "oauth2", "jwt", "mTLS"]
                  }
                }
              }
            },
            authorization: {
              type: "object",
              properties: {
                enabled: { type: "boolean" },
                model: {
                  type: "string",
                  enum: ["rbac", "abac", "acl"]
                }
              }
            },
            encryption: {
              type: "object",
              properties: {
                in_transit: { type: "boolean" },
                at_rest: { type: "boolean" },
                algorithms: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            },
            audit: {
              type: "object",
              properties: {
                enabled: { type: "boolean" },
                level: {
                  type: "string",
                  enum: ["basic", "detailed", "comprehensive"]
                },
                retention: {
                  type: "string",
                  format: "duration"
                }
              }
            }
          }
        },
        performance: {
          type: "object",
          properties: {
            timeout: {
              type: "string",
              format: "duration",
              description: "Operation timeout"
            },
            cache_ttl: {
              type: "number",
              minimum: 0,
              description: "Cache time-to-live in seconds"
            },
            rate_limit: {
              type: "string",
              description: "Rate limiting configuration"
            },
            max_concurrent: {
              type: "number",
              minimum: 1,
              description: "Maximum concurrent operations"
            },
            memory_limit: {
              type: "string",
              description: "Memory limit"
            },
            cpu_limit: {
              type: "string",
              description: "CPU limit"
            }
          }
        },
        orchestration: {
          type: "object",
          properties: {
            patterns: {
              type: "array",
              items: {
                type: "string",
                enum: [
                  "sequential", "parallel", "fanout", "pipeline",
                  "mapreduce", "circuit_breaker", "saga", "workflow"
                ]
              },
              description: "Supported orchestration patterns"
            },
            timeout: {
              type: "string",
              format: "duration"
            },
            retry_policy: {
              type: "object",
              properties: {
                max_attempts: {
                  type: "number",
                  minimum: 1
                },
                backoff_strategy: {
                  type: "string",
                  enum: ["fixed", "exponential", "linear"]
                },
                retry_delay: {
                  type: "string",
                  format: "duration"
                }
              }
            },
            error_handling: {
              type: "string",
              enum: ["fail_fast", "continue", "compensate"]
            }
          }
        },
        api: {
          type: "object",
          properties: {
            openapi: {
              type: "string",
              format: "file-path",
              description: "Path to OpenAPI specification"
            },
            version: {
              type: "string",
              description: "API version"
            },
            base_path: {
              type: "string",
              description: "API base path"
            },
            protocols: {
              type: "array",
              items: {
                type: "string",
                enum: ["http", "https", "ws", "wss"]
              }
            },
            formats: {
              type: "array",
              items: {
                type: "string",
                enum: ["json", "yaml", "xml", "protobuf"]
              }
            }
          }
        },
        discovery: {
          type: "object",
          properties: {
            uadp: {
              type: "object",
              properties: {
                enabled: { type: "boolean" },
                priority: {
                  type: "number",
                  minimum: 1,
                  maximum: 10
                },
                tags: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            }
          }
        },
        compliance: {
          type: "object",
          properties: {
            frameworks: {
              type: "array",
              items: {
                type: "string",
                enum: [
                  "iso-42001", "nist-ai-rmf", "eu-ai-act", "sox", "hipaa",
                  "gdpr", "ccpa", "pci-dss", "soc2"
                ]
              }
            },
            certifications: {
              type: "array",
              items: { type: "string" }
            },
            audit_trail: {
              type: "boolean"
            }
          }
        }
      }
    };

    // Compile and cache schema
    const compiledSchema = this.ajv.compile(agentSchema);
    this.schemaCache.set('ossa://schemas/agent/v0.1.8', compiledSchema);
  }

  /**
   * Validate OSSA specification using JSON Schema
   */
  async validate(data, schemaId = 'ossa://schemas/agent/v0.1.8') {
    try {
      const validator = this.schemaCache.get(schemaId);
      if (!validator) {
        throw new Error(`Schema not found: ${schemaId}`);
      }

      const valid = validator(data);
      
      if (!valid) {
        return {
          valid: false,
          errors: validator.errors.map(error => this.formatError(error)),
          warnings: [],
          schema: schemaId
        };
      }

      // Perform additional validation
      const additionalValidation = await this.performAdditionalValidation(data);
      
      return {
        valid: true,
        errors: [],
        warnings: additionalValidation.warnings,
        schema: schemaId,
        compliance_level: this.determineComplianceLevel(data),
        cross_references: additionalValidation.crossReferences
      };
    } catch (error) {
      return {
        valid: false,
        errors: [{ message: error.message, path: 'root' }],
        warnings: [],
        schema: schemaId
      };
    }
  }

  /**
   * Validate file with schema resolution
   */
  async validateFile(filePath, schemaPath = null) {
    try {
      if (!existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Read and parse file
      const content = readFileSync(filePath, 'utf8');
      let data;
      
      if (filePath.endsWith('.json')) {
        data = JSON.parse(content);
      } else {
        data = parseYaml(content);
      }

      // Resolve schema if provided
      let schemaId = 'ossa://schemas/agent/v0.1.8';
      if (schemaPath) {
        const schema = await this.loadSchema(schemaPath);
        const schemaValidator = this.ajv.compile(schema);
        schemaId = schema.$id || schemaPath;
        this.schemaCache.set(schemaId, schemaValidator);
      }

      // Validate with resolved references
      const result = await this.validate(data, schemaId);
      
      // Add file context
      result.file = filePath;
      result.timestamp = new Date().toISOString();
      
      return result;
    } catch (error) {
      return {
        valid: false,
        errors: [{ message: error.message, path: 'file' }],
        warnings: [],
        file: filePath
      };
    }
  }

  /**
   * Load and resolve schema with $ref resolution
   */
  async loadSchema(schemaPath) {
    try {
      // Use RefParser to resolve all $ref references
      const schema = await $RefParser.dereference(schemaPath);
      return schema;
    } catch (error) {
      throw new Error(`Failed to load schema ${schemaPath}: ${error.message}`);
    }
  }

  /**
   * Validate OpenAPI specification for agent
   */
  async validateOpenAPI(openApiPath, agentData = null) {
    try {
      if (!existsSync(openApiPath)) {
        return {
          valid: false,
          errors: [{ message: `OpenAPI file not found: ${openApiPath}` }]
        };
      }

      // Load and dereference OpenAPI spec
      const openApiSpec = await $RefParser.dereference(openApiPath);
      
      // Basic OpenAPI validation
      if (!openApiSpec.openapi || !openApiSpec.info || !openApiSpec.paths) {
        return {
          valid: false,
          errors: [{ message: 'Invalid OpenAPI specification structure' }]
        };
      }

      // Validate against agent capabilities if provided
      let capabilityValidation = { valid: true, warnings: [] };
      if (agentData?.spec?.capabilities) {
        capabilityValidation = this.validateCapabilitiesAgainstAPI(
          agentData.spec.capabilities,
          openApiSpec
        );
      }

      return {
        valid: capabilityValidation.valid,
        errors: capabilityValidation.errors || [],
        warnings: capabilityValidation.warnings || [],
        openapi_version: openApiSpec.openapi,
        endpoints: Object.keys(openApiSpec.paths).length,
        security_schemes: Object.keys(openApiSpec.components?.securitySchemes || {}).length
      };
    } catch (error) {
      return {
        valid: false,
        errors: [{ message: `OpenAPI validation failed: ${error.message}` }]
      };
    }
  }

  /**
   * Validate agent capabilities against OpenAPI endpoints
   */
  validateCapabilitiesAgainstAPI(capabilities, openApiSpec) {
    const warnings = [];
    const errors = [];
    
    for (const capability of capabilities) {
      // Check if capability has corresponding endpoint
      const capabilityPath = `/api/v1/capabilities/${capability.name}`;
      const paths = Object.keys(openApiSpec.paths);
      
      const hasEndpoint = paths.some(path => 
        path.includes(capability.name) || 
        path === capabilityPath
      );
      
      if (!hasEndpoint) {
        warnings.push({
          message: `No API endpoint found for capability: ${capability.name}`,
          capability: capability.name
        });
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Perform additional validation beyond schema
   */
  async performAdditionalValidation(data) {
    const warnings = [];
    const crossReferences = [];

    // Validate capability schemas if referenced
    if (data.spec?.capabilities) {
      for (const capability of data.spec.capabilities) {
        if (capability.input_schema) {
          const inputValidation = await this.validateCapabilitySchema(capability.input_schema);
          if (!inputValidation.valid) {
            warnings.push(`Invalid input schema for ${capability.name}: ${inputValidation.error}`);
          } else {
            crossReferences.push({
              type: 'input_schema',
              capability: capability.name,
              schema: capability.input_schema
            });
          }
        }
        
        if (capability.output_schema) {
          const outputValidation = await this.validateCapabilitySchema(capability.output_schema);
          if (!outputValidation.valid) {
            warnings.push(`Invalid output schema for ${capability.name}: ${outputValidation.error}`);
          } else {
            crossReferences.push({
              type: 'output_schema',
              capability: capability.name,
              schema: capability.output_schema
            });
          }
        }
      }
    }

    // Validate OpenAPI reference if present
    if (data.spec?.api?.openapi) {
      const apiValidation = await this.validateOpenAPI(data.spec.api.openapi, data);
      if (!apiValidation.valid) {
        warnings.push(`OpenAPI validation issues: ${apiValidation.errors.map(e => e.message).join(', ')}`);
      } else {
        crossReferences.push({
          type: 'openapi_spec',
          path: data.spec.api.openapi,
          endpoints: apiValidation.endpoints
        });
      }
    }

    return { warnings, crossReferences };
  }

  /**
   * Validate capability schema file
   */
  async validateCapabilitySchema(schemaPath) {
    try {
      if (!existsSync(schemaPath)) {
        return { valid: false, error: `Schema file not found: ${schemaPath}` };
      }

      const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
      
      // Basic JSON Schema validation
      if (!schema.type && !schema.$ref) {
        return { valid: false, error: 'Schema must have type or $ref' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Determine compliance level from validation results
   */
  determineComplianceLevel(data) {
    let score = 0;
    
    // Core requirements
    if (data.spec?.agent && data.spec?.capabilities?.length > 0) {
      score += 25;
    }
    
    // Integration requirements
    if (data.spec?.frameworks && 
        Object.values(data.spec.frameworks).some(f => f?.enabled)) {
      score += 25;
    }
    
    // Production requirements
    if (data.spec?.api?.openapi && data.spec?.security) {
      score += 25;
    }
    
    // Enterprise requirements
    if (data.spec?.compliance?.frameworks?.length > 0 && 
        data.spec?.orchestration && 
        data.spec?.performance) {
      score += 25;
    }
    
    if (score >= 75) return 'platinum';
    if (score >= 50) return 'gold';
    if (score >= 25) return 'silver';
    return 'core';
  }

  /**
   * Format validation error for consistency
   */
  formatError(error) {
    return {
      path: error.instancePath || error.dataPath || 'root',
      message: error.message,
      keyword: error.keyword,
      schema: error.schemaPath,
      data: error.data
    };
  }

  /**
   * Batch validate multiple files
   */
  async validateBatch(files, options = {}) {
    const results = [];
    
    for (const file of files) {
      const result = await this.validateFile(file, options.schema);
      results.push(result);
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
   * Generate comprehensive validation report
   */
  generateValidationReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      validator: 'json-schema-validator',
      version: '0.1.8',
      summary: results.summary || {
        total: 1,
        valid: results.valid ? 1 : 0,
        invalid: results.valid ? 0 : 1
      },
      compliance_distribution: {},
      common_errors: {},
      cross_references: [],
      recommendations: []
    };

    const resultsList = Array.isArray(results.results) ? results.results : [results];
    
    for (const result of resultsList) {
      // Count compliance levels
      if (result.compliance_level) {
        report.compliance_distribution[result.compliance_level] = 
          (report.compliance_distribution[result.compliance_level] || 0) + 1;
      }
      
      // Collect common errors
      if (result.errors) {
        result.errors.forEach(error => {
          const key = `${error.keyword}: ${error.message}`;
          report.common_errors[key] = (report.common_errors[key] || 0) + 1;
        });
      }
      
      // Collect cross-references
      if (result.cross_references) {
        report.cross_references.push(...result.cross_references);
      }
    }

    // Generate recommendations
    report.recommendations = this.generateRecommendations(report);
    
    return report;
  }

  /**
   * Generate improvement recommendations
   */
  generateRecommendations(report) {
    const recommendations = [];
    
    // Check compliance distribution
    const totalSpecs = report.summary.total;
    const coreCount = report.compliance_distribution.core || 0;
    const silverCount = report.compliance_distribution.silver || 0;
    
    if (coreCount / totalSpecs > 0.5) {
      recommendations.push({
        priority: 'high',
        category: 'compliance',
        message: 'Many specifications are at Core level - consider upgrading to Silver level',
        action: 'Add framework integrations and security configurations'
      });
    }
    
    if (silverCount / totalSpecs > 0.3 && !report.compliance_distribution.gold) {
      recommendations.push({
        priority: 'medium',
        category: 'production_readiness',
        message: 'Consider upgrading Silver level specifications to Gold',
        action: 'Add OpenAPI specifications and enhanced security configurations'
      });
    }
    
    // Check for common errors
    const commonErrorKeys = Object.keys(report.common_errors);
    if (commonErrorKeys.length > 0) {
      const mostCommon = commonErrorKeys.reduce((a, b) => 
        report.common_errors[a] > report.common_errors[b] ? a : b
      );
      
      recommendations.push({
        priority: 'high',
        category: 'quality',
        message: `Most common validation error: ${mostCommon}`,
        action: 'Review and fix this error pattern across specifications'
      });
    }
    
    return recommendations;
  }
}

// CLI interface
if (import.meta.url === `file://${new URL(import.meta.url).pathname}`) {
  const validator = new JSONSchemaValidator();
  
  const command = process.argv[2];
  const args = process.argv.slice(3);
  
  switch (command) {
    case 'validate':
      if (args.length < 1) {
        console.error('Usage: node json-schema-validator.js validate <file> [schema]');
        process.exit(1);
      }
      
      validator.validateFile(args[0], args[1])
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
        console.error('Usage: node json-schema-validator.js batch <file1> [file2...]');
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
      
    case 'openapi':
      if (args.length < 1) {
        console.error('Usage: node json-schema-validator.js openapi <openapi-file> [agent-file]');
        process.exit(1);
      }
      
      const agentData = args[1] ? parseYaml(readFileSync(args[1], 'utf8')) : null;
      validator.validateOpenAPI(args[0], agentData)
        .then(result => {
          console.log(JSON.stringify(result, null, 2));
          process.exit(result.valid ? 0 : 1);
        })
        .catch(err => {
          console.error('OpenAPI validation failed:', err.message);
          process.exit(1);
        });
      break;
      
    case 'report':
      if (args.length < 1) {
        console.error('Usage: node json-schema-validator.js report <file>');
        process.exit(1);
      }
      
      validator.validateFile(args[0])
        .then(result => {
          const report = validator.generateValidationReport(result);
          console.log(JSON.stringify(report, null, 2));
        })
        .catch(err => {
          console.error('Report generation failed:', err.message);
          process.exit(1);
        });
      break;
      
    default:
      console.log(`
JSON Schema Validation Framework for OSSA v0.1.8

Commands:
  validate <file> [schema]          Validate OSSA file with optional custom schema
  batch <file1> [file2...]          Validate multiple files
  openapi <openapi-file> [agent]    Validate OpenAPI specification
  report <file>                     Generate validation report

Examples:
  node json-schema-validator.js validate ./examples/.agents/test-agent/agent.yml
  node json-schema-validator.js batch agent1.yml agent2.yml
  node json-schema-validator.js openapi ./api/openapi.yaml ./agent.yml
  node json-schema-validator.js report ./examples/.agents/test-agent/agent.yml

Features:
- Comprehensive JSON Schema validation with AJV
- OpenAPI specification validation and cross-reference checking
- Schema reference resolution with @apidevtools/json-schema-ref-parser
- Custom OSSA formats and validation rules
- Compliance level determination and reporting
- Cross-reference validation between agent specs and API definitions
      `);
      break;
  }
}

export default JSONSchemaValidator;